'use strict';

const express = require('express');
const router = express.Router();
const { executeQuery, executeUpdate } = require('../config/db');
const {
  detectIntent,
  generateResponse,
  extractKeywords,
  recordFeedback,
  calculateUserPreferences,
} = require('../utils/chatbotUtils');

// ==================== SEND MESSAGE ====================
/**
 * POST /api/chatbot/message
 * Send message to chatbot and get response
 */
router.post('/message', async (req, res) => {
  try {
    const { userId, message, conversationId, sessionToken } = req.body;

    // Validate message only (userId can be string or number)
    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    // Accept userId as string (for anonymous) or number
    const finalUserId = userId ? String(userId) : 'guest';

    const startTime = Date.now();

    // Get or create conversation
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
        console.warn('Conversation creation skipped, using provided ID:', err.message);
      }
    }

    // Get user data for personalization (only if numeric userId)
    let user = { USER_ID: finalUserId, FULL_NAME: null };
    
    if (!isNaN(finalUserId)) {
      const userQuery = `
        SELECT U.USER_ID, U.FULL_NAME, CUP.CATEGORY_INTEREST, CUP.PRICE_RANGE
        FROM USERS U
        LEFT JOIN CHATBOT_USER_PREFERENCES CUP ON U.USER_ID = CUP.USER_ID
        WHERE U.USER_ID = :userId
      `;

      try {
        const userData = await executeQuery(userQuery, { userId: finalUserId });
        if (userData.rows && userData.rows[0]) {
          user = userData.rows[0];
        }
      } catch (err) {
        console.warn('User data fetch skipped:', err.message);
      }
    }

    // Store user message
    const userMsgQuery = `
      INSERT INTO CHATBOT_MESSAGES
      (MESSAGE_ID, CONVERSATION_ID, USER_ID, MESSAGE_TYPE, CONTENT, CREATED_AT)
      VALUES (chatbot_message_seq.NEXTVAL, :convId, :userId, 'user', :message, SYSDATE)
      RETURNING MESSAGE_ID INTO :msgId
    `;

    let userMessageId = null;
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

    // Generate bot response
    const { response, intent, confidence } = generateResponse(message, {
      name: user.FULL_NAME,
      preferences: {
        categories: user.CATEGORY_INTEREST?.split(',') || [],
        priceRange: user.PRICE_RANGE,
      },
    });

    const responseTime = Date.now() - startTime;

    // Store bot message
    const botMsgQuery = `
      INSERT INTO CHATBOT_MESSAGES
      (MESSAGE_ID, CONVERSATION_ID, USER_ID, MESSAGE_TYPE, CONTENT, INTENT, CONFIDENCE_SCORE, RESPONSE_TIME_MS, CREATED_AT)
      VALUES (chatbot_message_seq.NEXTVAL, :convId, :userId, 'bot', :response, :intent, :confidence, :responseTime, SYSDATE)
      RETURNING MESSAGE_ID INTO :msgId
    `;

    let botMsgResult = { MESSAGE_ID: null };
    try {
      botMsgResult = await executeUpdate(botMsgQuery, {
        convId,
        userId: finalUserId,
        response,
        intent,
        confidence,
        responseTime,
      });
    } catch (err) {
      console.warn('Bot message insertion skipped:', err.message);
    }

    // Update conversation metadata
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

    // Log learning data
    const learningInsertQuery = `
      INSERT INTO CHATBOT_LEARNING
      (LEARNING_ID, QUESTION_PATTERN, CATEGORY, RESPONSE_TEMPLATE, FREQUENCY, IS_ACTIVE)
      SELECT chatbot_learning_seq.NEXTVAL, :message, :intent, :response, 1, 1
      FROM DUAL
      WHERE NOT EXISTS (
        SELECT 1 FROM CHATBOT_LEARNING 
        WHERE QUESTION_PATTERN = :message AND CATEGORY = :intent
      )
    `;

    try {
      await executeUpdate(learningInsertQuery, {
        message,
        intent,
        response,
      });
    } catch (err) {
      console.warn('Learning insert skipped');
    }

    res.json({
      success: true,
      data: {
        conversationId: convId,
        userMessageId,
        botMessageId: botMsgResult?.MESSAGE_ID,
        response,
        intent,
        confidence,
        responseTime,
      },
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==================== GET CONVERSATIONS ====================
/**
 * GET /api/chatbot/conversations/:userId
 * Get conversation history for a user
 */
router.get('/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(Number(req.query.limit) || 5, 20);

    const query = `
      SELECT CC.CONVERSATION_ID, CC.TOTAL_MESSAGES, CC.LAST_MESSAGE_AT, CC.SATISFIED_FLAG
      FROM CHATBOT_CONVERSATIONS CC
      WHERE CC.USER_ID = :userId
      ORDER BY CC.CREATED_AT DESC
      FETCH FIRST :limit ROWS ONLY
    `;

    const result = await executeQuery(query, { userId, limit });

    res.json({
      success: true,
      data: result.rows || [],
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==================== GET MESSAGES ====================
/**
 * GET /api/chatbot/messages/:conversationId
 * Get messages in a conversation
 */
router.get('/messages/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const limit = Math.min(Number(req.query.limit) || 50, 100);

    const query = `
      SELECT MESSAGE_ID, MESSAGE_TYPE, CONTENT, INTENT, CONFIDENCE_SCORE, 
             IS_HELPFUL, CREATED_AT
      FROM CHATBOT_MESSAGES
      WHERE CONVERSATION_ID = :conversationId
      ORDER BY CREATED_AT ASC
      FETCH FIRST :limit ROWS ONLY
    `;

    const result = await executeQuery(query, { conversationId, limit });

    res.json({
      success: true,
      data: result.rows || [],
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==================== SEND FEEDBACK ====================
/**
 * POST /api/chatbot/feedback
 * Send feedback on chatbot response
 */
router.post('/feedback', async (req, res) => {
  try {
    const { messageId, helpful, conversationId, feedbackText } = req.body;

    if (!messageId) {
      return res.status(400).json({
        success: false,
        error: 'messageId is required',
      });
    }

    // Update message feedback
    const updateMsgQuery = `
      UPDATE CHATBOT_MESSAGES
      SET IS_HELPFUL = :helpful
      WHERE MESSAGE_ID = :messageId
    `;

    await executeUpdate(updateMsgQuery, { messageId, helpful });

    // Update conversation satisfaction if provided
    if (conversationId && feedbackText) {
      const satisfactionFlag = helpful > 0 ? 1 : -1;

      const updateConvQuery = `
        UPDATE CHATBOT_CONVERSATIONS
        SET SATISFIED_FLAG = :satisfactionFlag,
            FEEDBACK_TEXT = :feedbackText,
            UPDATED_AT = SYSDATE
        WHERE CONVERSATION_ID = :conversationId
      `;

      await executeUpdate(updateConvQuery, {
        conversationId,
        satisfactionFlag,
        feedbackText,
      });
    }

    res.json({
      success: true,
      message: 'Feedback recorded successfully',
    });
  } catch (error) {
    console.error('Error recording feedback:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==================== GET USER PREFERENCES ====================
/**
 * GET /api/chatbot/preferences/:userId
 * Get learned preferences for a user
 */
router.get('/preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const query = `
      SELECT PREFERENCE_ID, USER_ID, CATEGORY_INTEREST, PRICE_RANGE, 
             FAVORITE_AUTHORS, INTERACTION_COUNT, LAST_INTEREST_UPDATE
      FROM CHATBOT_USER_PREFERENCES
      WHERE USER_ID = :userId
    `;

    const result = await executeQuery(query, { userId });
    const preferences = result.rows?.[0];

    res.json({
      success: true,
      data: preferences || {
        categories: [],
        priceRange: null,
        authors: [],
      },
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==================== UPDATE USER PREFERENCES ====================
/**
 * POST /api/chatbot/preferences/:userId
 * Update learned preferences for a user
 */
router.post('/preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { categoryInterest, priceRange, favoriteAuthors } = req.body;

    const checkQuery = `
      SELECT PREFERENCE_ID FROM CHATBOT_USER_PREFERENCES WHERE USER_ID = :userId
    `;

    const existing = await executeQuery(checkQuery, { userId });

    if (existing.rows?.length > 0) {
      // Update existing
      const updateQuery = `
        UPDATE CHATBOT_USER_PREFERENCES
        SET CATEGORY_INTEREST = :categoryInterest,
            PRICE_RANGE = :priceRange,
            FAVORITE_AUTHORS = :favoriteAuthors,
            INTERACTION_COUNT = INTERACTION_COUNT + 1,
            LAST_INTEREST_UPDATE = SYSDATE,
            UPDATED_AT = SYSDATE
        WHERE USER_ID = :userId
      `;

      await executeUpdate(updateQuery, {
        userId,
        categoryInterest,
        priceRange,
        favoriteAuthors,
      });
    } else {
      // Insert new
      const insertQuery = `
        INSERT INTO CHATBOT_USER_PREFERENCES
        (PREFERENCE_ID, USER_ID, CATEGORY_INTEREST, PRICE_RANGE, FAVORITE_AUTHORS, INTERACTION_COUNT, CREATED_AT, UPDATED_AT)
        VALUES (chatbot_learning_seq.NEXTVAL, :userId, :categoryInterest, :priceRange, :favoriteAuthors, 1, SYSDATE, SYSDATE)
      `;

      await executeUpdate(insertQuery, {
        userId,
        categoryInterest,
        priceRange,
        favoriteAuthors,
      });
    }

    res.json({
      success: true,
      message: 'Preferences updated successfully',
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==================== GET FAQ ====================
/**
 * GET /api/chatbot/faq
 * Get frequently asked questions
 */
router.get('/faq', async (req, res) => {
  try {
    const category = req.query.category || null;

    let query = `
      SELECT LEARNING_ID, QUESTION_PATTERN, CATEGORY, RESPONSE_TEMPLATE, 
             FREQUENCY, AVERAGE_RATING, LAST_USED_AT
      FROM CHATBOT_LEARNING
      WHERE IS_ACTIVE = 1
    `;

    const params = {};

    if (category) {
      query += ` AND CATEGORY = :category`;
      params.category = category;
    }

    query += ` ORDER BY FREQUENCY DESC FETCH FIRST 10 ROWS ONLY`;

    const result = await executeQuery(query, params);

    res.json({
      success: true,
      data: result.rows || [],
    });
  } catch (error) {
    console.error('Error fetching FAQ:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==================== GET CHATBOT STATS ====================
/**
 * GET /api/chatbot/stats
 * Get chatbot statistics (admin)
 */
router.get('/stats', async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM CHATBOT_CONVERSATIONS) AS total_conversations,
        (SELECT COUNT(*) FROM CHATBOT_MESSAGES) AS total_messages,
        (SELECT COUNT(DISTINCT USER_ID) FROM CHATBOT_CONVERSATIONS) AS unique_users,
        (SELECT AVG(TOTAL_MESSAGES) FROM CHATBOT_CONVERSATIONS) AS avg_messages_per_conv,
        (SELECT SUM(CASE WHEN SATISFIED_FLAG = 1 THEN 1 ELSE 0 END) FROM CHATBOT_CONVERSATIONS) 
          AS satisfied_conversations
      FROM DUAL
    `;

    const result = await executeQuery(statsQuery);
    const stats = result.rows?.[0] || {};

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
