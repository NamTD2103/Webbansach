'use strict';

const express = require('express');
const router = express.Router();
const { executeQuery, executeUpdate } = require('../config/db');
const {
  detectIntent,
  generateResponse,
  extractKeywords,
} = require('../utils/chatbotUtils');
const {
  selectBestResponse,
  prepareSelectionContext,
  renderResponse,
  createSelectionLog,
  updateResponseStats,
} = require('../utils/responsePoolManager');
const {
  getUserProfile,
  upsertUserProfile,
  updateUserPreferences,
  recordUserPurchase,
  calculateChurnRisk,
  getConversationContext,
  upsertConversationContext,
} = require('../utils/userProfileManager');

// ==================== SEND MESSAGE (ENHANCED) ====================
/**
 * POST /api/chatbot/message
 * Send message to chatbot with smart response selection
 */
router.post('/message', async (req, res) => {
  try {
    const { userId, message, conversationId, sessionToken, contextData } = req.body;

    // Validate
    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    const finalUserId = userId ? String(userId) : 'guest_' + Date.now();
    const startTime = Date.now();

    // ========== GET OR CREATE CONVERSATION ==========
    let convId = conversationId;
    if (!convId) {
      const convQuery = `
        INSERT INTO CHATBOT_CONVERSATIONS 
        (CONVERSATION_ID, USER_ID, SESSION_TOKEN, CREATED_AT, UPDATED_AT)
        VALUES (chatbot_conversation_seq.NEXTVAL, :userId, :sessionToken, SYSDATE, SYSDATE)
        RETURNING CONVERSATION_ID INTO :convId
      `;

      try {
        const result = await executeUpdate(convQuery, {
          userId: finalUserId,
          sessionToken: sessionToken || 'web_' + Date.now(),
        });
        convId = result?.CONVERSATION_ID || conversationId;
      } catch (err) {
        console.warn('Conversation creation skipped:', err.message);
      }
    }

    // ========== GET USER PROFILE ==========
    let userProfile = null;
    let contextInfo = null;

    if (!isNaN(finalUserId) && finalUserId !== 'guest') {
      userProfile = await getUserProfile(finalUserId);
      contextInfo = await getConversationContext(convId);
    }

    // ========== UPDATE CONTEXT ==========
    if (contextData && convId) {
      try {
        await upsertConversationContext(convId, contextData);
        contextInfo = await getConversationContext(convId);
      } catch (err) {
        console.warn('Context update skipped:', err.message);
      }
    }

    // ========== STORE USER MESSAGE ==========
    let userMessageId = null;
    const userMsgQuery = `
      INSERT INTO CHATBOT_MESSAGES
      (MESSAGE_ID, CONVERSATION_ID, USER_ID, MESSAGE_TYPE, CONTENT, CREATED_AT)
      VALUES (chatbot_message_seq.NEXTVAL, :convId, :userId, 'user', :message, SYSDATE)
      RETURNING MESSAGE_ID INTO :msgId
    `;

    try {
      const userMsgResult = await executeUpdate(userMsgQuery, {
        convId,
        userId: finalUserId,
        message,
      });
      userMessageId = userMsgResult?.MESSAGE_ID;
    } catch (err) {
      console.warn('User message insertion skipped:', err.message);
    }

    // ========== DETECT INTENT ==========
    const { intent, confidence } = detectIntent(message);

    // ========== SELECT BEST RESPONSE ==========
    let selectedResponse = null;
    let selectionReason = 'DEFAULT';
    let selectedPoolId = null;

    try {
      // Get response pool
      const poolQuery = `
        SELECT * FROM CHATBOT_RESPONSE_POOL 
        WHERE INTENT_CATEGORY = :intent AND IS_ACTIVE = 1
        ORDER BY RESPONSE_RANK ASC
      `;

      const poolResult = await executeQuery(poolQuery, { intent });
      const responsePool = poolResult.rows || [];

      if (responsePool.length > 0) {
        // Get recent messages for context
        const recentMsgQuery = `
          SELECT RESPONSE_TYPE FROM (
            SELECT RESPONSE_TYPE FROM CHATBOT_RESPONSE_SELECTION_LOG
            WHERE MESSAGE_ID IN (
              SELECT MESSAGE_ID FROM CHATBOT_MESSAGES
              WHERE CONVERSATION_ID = :convId
              ORDER BY MESSAGE_ID DESC
            )
            ORDER BY MESSAGE_ID DESC
          ) WHERE ROWNUM <= 3
        `;

        let recentMessages = [];
        try {
          const recentResult = await executeQuery(recentMsgQuery, { convId });
          recentMessages = recentResult.rows || [];
        } catch (err) {
          // Ignore error for recent messages
        }

        // Prepare context
        const selectionContext = prepareSelectionContext(
          userProfile,
          contextInfo,
          recentMessages
        );
        selectionContext.confidence = confidence;

        // Select best response
        const selection = selectBestResponse(responsePool, selectionContext);
        selectedResponse = selection.response;
        selectionReason = selection.reason;
        selectedPoolId = selectedResponse?.POOL_ID;
      }
    } catch (err) {
      console.warn('Response pool selection failed:', err.message);
    }

    // ========== GENERATE RESPONSE ==========
    let response = '';
    let responseType = 'DEFAULT';

    if (selectedResponse && selectedResponse.RESPONSE_TEMPLATE) {
      // Use response from pool
      response = renderResponse(selectedResponse.RESPONSE_TEMPLATE, {
        name: userProfile?.FULL_NAME,
        preferredCategory: userProfile?.FAVORITE_CATEGORIES?.[0]?.category,
        priceRange: userProfile?.PRICE_RANGE_MAX
          ? `${userProfile.PRICE_RANGE_MIN}-${userProfile.PRICE_RANGE_MAX}đ`
          : null,
        loyaltyStatus: userProfile?.IS_VIP ? 'VIP' : 'thành viên',
      });
      responseType = selectedResponse.RESPONSE_TYPE;
    } else {
      // Fallback to default generation
      const defaultResponse = generateResponse(message, {
        name: userProfile?.FULL_NAME,
        preferences: {
          categories: userProfile?.FAVORITE_CATEGORIES?.map(c => c.category) || [],
          priceRange: userProfile?.PRICE_RANGE_MAX,
        },
      });
      response = defaultResponse.response;
    }

    const responseTime = Date.now() - startTime;

    // ========== STORE BOT MESSAGE ==========
    const botMsgQuery = `
      INSERT INTO CHATBOT_MESSAGES
      (MESSAGE_ID, CONVERSATION_ID, USER_ID, MESSAGE_TYPE, CONTENT, INTENT, CONFIDENCE_SCORE, RESPONSE_TIME_MS, CREATED_AT)
      VALUES (chatbot_message_seq.NEXTVAL, :convId, :userId, 'bot', :response, :intent, :confidence, :responseTime, SYSDATE)
      RETURNING MESSAGE_ID INTO :msgId
    `;

    let botMessageId = null;
    try {
      const botMsgResult = await executeUpdate(botMsgQuery, {
        convId,
        userId: finalUserId,
        response,
        intent,
        confidence,
        responseTime,
      });
      botMessageId = botMsgResult?.MESSAGE_ID;
    } catch (err) {
      console.warn('Bot message insertion skipped:', err.message);
    }

    // ========== LOG RESPONSE SELECTION ==========
    if (botMessageId && selectedPoolId) {
      try {
        const logQuery = `
          INSERT INTO CHATBOT_RESPONSE_SELECTION_LOG
          (SELECTION_ID, MESSAGE_ID, POOL_ID, RESPONSE_TYPE, SELECTION_REASON, CONTEXT_FLAGS, CREATED_AT)
          VALUES (chatbot_selection_seq.NEXTVAL, :messageId, :poolId, :responseType, :reason, :contextFlags, SYSDATE)
        `;

        await executeUpdate(logQuery, {
          messageId: botMessageId,
          poolId: selectedPoolId,
          responseType,
          reason: selectionReason,
          contextFlags: JSON.stringify(
            prepareSelectionContext(userProfile, contextInfo, [])?.contextFlags || []
          ),
        });

        // Update response stats
        const statsUpdateQuery = `
          UPDATE CHATBOT_RESPONSE_POOL
          SET USAGE_COUNT = USAGE_COUNT + 1
          WHERE POOL_ID = :poolId
        `;
        await executeUpdate(statsUpdateQuery, { poolId: selectedPoolId });
      } catch (err) {
        console.warn('Response logging skipped:', err.message);
      }
    }

    // ========== UPDATE CONVERSATION ==========
    const updateConvQuery = `
      UPDATE CHATBOT_CONVERSATIONS
      SET TOTAL_MESSAGES = TOTAL_MESSAGES + 2,
          LAST_MESSAGE_AT = SYSDATE,
          UPDATED_AT = SYSDATE
      WHERE CONVERSATION_ID = :convId
    `;

    try {
      await executeUpdate(updateConvQuery, { convId });
    } catch (err) {
      console.warn('Conversation update skipped:', err.message);
    }

    // ========== UPDATE USER PROFILE ==========
    if (userProfile) {
      try {
        await updateUserPreferences(finalUserId, {
          mentionedCategories: extractKeywords(message),
          responseTime: responseTime,
          preferredResponseType: responseType,
        });
      } catch (err) {
        console.warn('User preferences update skipped:', err.message);
      }
    }

    // ========== RETURN RESPONSE ==========
    res.json({
      success: true,
      data: {
        conversationId: convId,
        userMessageId,
        botMessageId,
        response,
        intent,
        confidence,
        responseType,
        selectionReason,
        responseTime,
        sessionToken: sessionToken || 'web_' + Date.now(),
      },
    });
  } catch (error) {
    console.error('[CHATBOT ERROR]', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Chatbot error occurred',
    });
  }
});

// ==================== FEEDBACK ENDPOINT ==========
/**
 * POST /api/chatbot/feedback
 * Record user feedback for learning
 */
router.post('/feedback', async (req, res) => {
  try {
    const { messageId, helpful, sentiment, conversionResult } = req.body;

    if (!messageId) {
      return res.status(400).json({
        success: false,
        error: 'Message ID required',
      });
    }

    // Update message feedback
    const updateMsgQuery = `
      UPDATE CHATBOT_MESSAGES 
      SET IS_HELPFUL = :helpful,
          UPDATED_AT = SYSDATE
      WHERE MESSAGE_ID = :messageId
    `;

    await executeUpdate(updateMsgQuery, { messageId, helpful });

    // Update selection log if exists
    const updateLogQuery = `
      UPDATE CHATBOT_RESPONSE_SELECTION_LOG
      SET WAS_HELPFUL = :helpful,
          CONVERSION_RESULT = :conversionResult,
          UPDATED_AT = SYSDATE
      WHERE MESSAGE_ID = :messageId
    `;

    try {
      await executeUpdate(updateLogQuery, {
        messageId,
        helpful,
        conversionResult: conversionResult ? 1 : 0,
      });

      // Update response stats if helpful
      const logQuery = `
        SELECT POOL_ID FROM CHATBOT_RESPONSE_SELECTION_LOG
        WHERE MESSAGE_ID = :messageId
      `;

      const logResult = await executeQuery(logQuery, { messageId });
      if (logResult.rows && logResult.rows[0]) {
        const poolId = logResult.rows[0].POOL_ID;

        // Get current stats
        const statsQuery = `
          SELECT USAGE_COUNT, AVERAGE_RATING, CONVERSION_COUNT
          FROM CHATBOT_RESPONSE_POOL
          WHERE POOL_ID = :poolId
        `;

        const statsResult = await executeQuery(statsQuery, { poolId });
        if (statsResult.rows && statsResult.rows[0]) {
          const current = statsResult.rows[0];
          const newStats = updateResponseStats({
            poolId,
            wasHelpful: helpful,
            conversionResult,
            currentUsageCount: current.USAGE_COUNT,
            currentRating: current.AVERAGE_RATING || 0.5,
            currentConversionCount: current.CONVERSION_COUNT || 0,
          });

          // Update pool
          const updatePoolQuery = `
            UPDATE CHATBOT_RESPONSE_POOL
            SET AVERAGE_RATING = :rating,
                CONVERSION_COUNT = :conversionCount,
                UPDATED_AT = SYSDATE
            WHERE POOL_ID = :poolId
          `;

          await executeUpdate(updatePoolQuery, {
            poolId,
            rating: newStats.averageRating,
            conversionCount: newStats.conversionCount,
          });
        }
      }
    } catch (err) {
      console.warn('Log update skipped:', err.message);
    }

    res.json({
      success: true,
      message: 'Feedback recorded',
    });
  } catch (error) {
    console.error('[FEEDBACK ERROR]', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==================== USER PROFILE ENDPOINTS ==========

/**
 * GET /api/chatbot/profile/:userId
 * Get user chatbot profile
 */
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await getUserProfile(userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found',
      });
    }

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/chatbot/profile/:userId
 * Update user profile
 */
router.post('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = req.body;

    const updated = await upsertUserProfile({
      userId,
      ...userData,
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/chatbot/profile/:userId/purchase
 * Record user purchase
 */
router.post('/profile/:userId/purchase', async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, categories } = req.body;

    const updated = await recordUserPurchase(userId, {
      amount,
      categories,
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
