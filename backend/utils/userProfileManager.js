'use strict';

/**
 * User Profile Manager
 * Handles user memory, preferences, and personalization data
 */

const { executeQuery, executeUpdate } = require('../config/db');

/**
 * Get or create user profile
 * @param {string} userId - User ID
 * @returns {object} - User profile
 */
const getUserProfile = async (userId) => {
  try {
    const query = `
      SELECT * FROM CHATBOT_USER_PROFILE 
      WHERE USER_ID = :userId
    `;

    const result = await executeQuery(query, { userId });

    if (result.rows && result.rows.length > 0) {
      return parseUserProfile(result.rows[0]);
    }

    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

/**
 * Create or update user profile
 * @param {object} userData - User data
 * @returns {object} - Created/updated profile
 */
const upsertUserProfile = async (userData) => {
  try {
    const {
      userId,
      fullName,
      phone,
      email,
      favoriteCategories,
      priceRange,
      budgetType,
    } = userData;

    // Check if exists
    const existingProfile = await getUserProfile(userId);

    if (existingProfile) {
      // Update
      const updateQuery = `
        UPDATE CHATBOT_USER_PROFILE
        SET FULL_NAME = NVL(:fullName, FULL_NAME),
            PHONE = NVL(:phone, PHONE),
            EMAIL = NVL(:email, EMAIL),
            FAVORITE_CATEGORIES = NVL(:favoriteCategories, FAVORITE_CATEGORIES),
            PRICE_RANGE_MIN = NVL(:priceRangeMin, PRICE_RANGE_MIN),
            PRICE_RANGE_MAX = NVL(:priceRangeMax, PRICE_RANGE_MAX),
            BUDGET_TYPE = NVL(:budgetType, BUDGET_TYPE),
            UPDATED_AT = SYSDATE,
            INTERACTION_COUNT = INTERACTION_COUNT + 1,
            LAST_INTERACTION_AT = SYSDATE
        WHERE USER_ID = :userId
      `;

      await executeUpdate(updateQuery, {
        userId,
        fullName,
        phone,
        email,
        favoriteCategories: favoriteCategories ? JSON.stringify(favoriteCategories) : null,
        priceRangeMin: priceRange?.min,
        priceRangeMax: priceRange?.max,
        budgetType,
      });

      return await getUserProfile(userId);
    } else {
      // Create
      const insertQuery = `
        INSERT INTO CHATBOT_USER_PROFILE
        (PROFILE_ID, USER_ID, FULL_NAME, PHONE, EMAIL, FAVORITE_CATEGORIES, 
         PRICE_RANGE_MIN, PRICE_RANGE_MAX, BUDGET_TYPE, INTERACTION_COUNT, 
         CREATED_AT, UPDATED_AT, LAST_INTERACTION_AT)
        VALUES (chatbot_profile_seq.NEXTVAL, :userId, :fullName, :phone, :email,
                :favoriteCategories, :priceRangeMin, :priceRangeMax, :budgetType,
                1, SYSDATE, SYSDATE, SYSDATE)
      `;

      await executeUpdate(insertQuery, {
        userId,
        fullName,
        phone,
        email,
        favoriteCategories: favoriteCategories ? JSON.stringify(favoriteCategories) : null,
        priceRangeMin: priceRange?.min,
        priceRangeMax: priceRange?.max,
        budgetType,
      });

      return await getUserProfile(userId);
    }
  } catch (error) {
    console.error('Error upserting user profile:', error);
    throw error;
  }
};

/**
 * Update user preferences from interaction
 * @param {string} userId - User ID
 * @param {object} interaction - Interaction data
 */
const updateUserPreferences = async (userId, interaction) => {
  try {
    const profile = await getUserProfile(userId);

    if (!profile) return null;

    // Parse existing preferences
    let favoriteCategories = [];
    if (profile.FAVORITE_CATEGORIES) {
      try {
        favoriteCategories = JSON.parse(profile.FAVORITE_CATEGORIES);
      } catch (e) {
        favoriteCategories = [];
      }
    }

    // Update categories if mentioned
    if (interaction.mentionedCategories && interaction.mentionedCategories.length > 0) {
      for (const category of interaction.mentionedCategories) {
        const existing = favoriteCategories.find(c => c.category === category);
        if (existing) {
          existing.frequency++;
          existing.lastMentionedAt = new Date().toISOString();
        } else {
          favoriteCategories.push({
            category,
            frequency: 1,
            lastMentionedAt: new Date().toISOString(),
          });
        }
      }

      // Sort by frequency
      favoriteCategories.sort((a, b) => b.frequency - a.frequency);
    }

    // Determine personality from interaction style
    let userPersonality = profile.USER_PERSONALITY;
    if (interaction.responseTime !== undefined && interaction.responseTime < 5000) {
      // Quick responses - direct style
      userPersonality = 'DIRECT';
    } else if (interaction.askingQuestions && interaction.askingQuestions > 2) {
      // Many questions - analytical style
      userPersonality = 'ANALYTICAL';
    } else {
      userPersonality = 'CONVERSATIONAL';
    }

    // Update profile
    const updateQuery = `
      UPDATE CHATBOT_USER_PROFILE
      SET FAVORITE_CATEGORIES = :favoriteCategories,
          USER_PERSONALITY = :userPersonality,
          PREFERRED_RESPONSE_TYPE = :preferredResponseType,
          INTERACTION_COUNT = INTERACTION_COUNT + 1,
          AVERAGE_RESPONSE_TIME = 
            (AVERAGE_RESPONSE_TIME * (INTERACTION_COUNT - 1) + :responseTime) / INTERACTION_COUNT,
          LAST_INTERACTION_AT = SYSDATE,
          UPDATED_AT = SYSDATE
      WHERE USER_ID = :userId
    `;

    await executeUpdate(updateQuery, {
      userId,
      favoriteCategories: JSON.stringify(favoriteCategories),
      userPersonality,
      preferredResponseType: interaction.preferredResponseType,
      responseTime: interaction.responseTime || 0,
    });

    return await getUserProfile(userId);
  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw error;
  }
};

/**
 * Record purchase for user
 * @param {string} userId - User ID
 * @param {object} purchaseData - Purchase information
 */
const recordUserPurchase = async (userId, purchaseData) => {
  try {
    const { amount, categories } = purchaseData;

    const profile = await getUserProfile(userId);
    if (!profile) return null;

    const newTotalSpent = (profile.TOTAL_SPENT || 0) + amount;
    const newPurchaseCount = (profile.TOTAL_PURCHASES || 0) + 1;
    const newAvgOrderValue = newTotalSpent / newPurchaseCount;

    // Determine purchase frequency
    let purchaseFrequency = 'OCCASIONAL';
    if (newPurchaseCount >= 5) purchaseFrequency = 'FREQUENT';
    if (newPurchaseCount <= 1) purchaseFrequency = 'RARE';

    // Update profile
    const updateQuery = `
      UPDATE CHATBOT_USER_PROFILE
      SET TOTAL_PURCHASES = :totalPurchases,
          TOTAL_SPENT = :totalSpent,
          AVERAGE_ORDER_VALUE = :avgOrderValue,
          PURCHASE_FREQUENCY = :purchaseFrequency,
          LAST_PURCHASE_DATE = SYSDATE,
          UPDATED_AT = SYSDATE
      WHERE USER_ID = :userId
    `;

    await executeUpdate(updateQuery, {
      userId,
      totalPurchases: newPurchaseCount,
      totalSpent: newTotalSpent,
      avgOrderValue: newAvgOrderValue,
      purchaseFrequency,
    });

    return await getUserProfile(userId);
  } catch (error) {
    console.error('Error recording purchase:', error);
    throw error;
  }
};

/**
 * Calculate user churn risk
 * @param {object} profile - User profile
 * @returns {number} - Churn risk (0-1)
 */
const calculateChurnRisk = (profile) => {
  if (!profile) return 0.5;

  let risk = 0.5; // Base risk

  // Days since last interaction
  if (profile.LAST_INTERACTION_AT) {
    const daysSinceLastInteraction = Math.floor(
      (Date.now() - new Date(profile.LAST_INTERACTION_AT).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastInteraction > 30) risk += 0.3;
    else if (daysSinceLastInteraction > 14) risk += 0.15;
    else if (daysSinceLastInteraction < 7) risk -= 0.2;
  }

  // Purchase behavior
  if (profile.PURCHASE_FREQUENCY === 'FREQUENT') risk -= 0.3;
  if (profile.PURCHASE_FREQUENCY === 'RARE') risk += 0.2;

  // Interaction quality
  if (profile.INTERACTION_COUNT > 20) risk -= 0.15;
  if (profile.INTERACTION_COUNT < 3) risk += 0.1;

  return Math.max(0, Math.min(1, risk)); // Normalize to 0-1
};

/**
 * Parse user profile from database row
 * @param {object} row - Database row
 * @returns {object} - Parsed profile
 */
const parseUserProfile = (row) => {
  return {
    ...row,
    FAVORITE_CATEGORIES: row.FAVORITE_CATEGORIES ? JSON.parse(row.FAVORITE_CATEGORIES) : [],
    FAVORITE_AUTHORS: row.FAVORITE_AUTHORS ? JSON.parse(row.FAVORITE_AUTHORS) : [],
  };
};

/**
 * Get conversation context
 * @param {number} conversationId - Conversation ID
 * @returns {object} - Conversation context
 */
const getConversationContext = async (conversationId) => {
  try {
    const query = `
      SELECT * FROM CHATBOT_CONVERSATION_CONTEXT 
      WHERE CONVERSATION_ID = :conversationId
    `;

    const result = await executeQuery(query, { conversationId });

    if (result.rows && result.rows.length > 0) {
      return result.rows[0];
    }

    return null;
  } catch (error) {
    console.error('Error getting conversation context:', error);
    return null;
  }
};

/**
 * Create or update conversation context
 * @param {number} conversationId - Conversation ID
 * @param {object} contextData - Context data
 */
const upsertConversationContext = async (conversationId, contextData) => {
  try {
    const existingContext = await getConversationContext(conversationId);

    if (existingContext) {
      // Update
      const updateQuery = `
        UPDATE CHATBOT_CONVERSATION_CONTEXT
        SET DEVICE_TYPE = NVL(:deviceType, DEVICE_TYPE),
            ENTRY_POINT = NVL(:entryPoint, ENTRY_POINT),
            USER_URGENCY = NVL(:userUrgency, USER_URGENCY),
            INTERACTION_PHASE = NVL(:interactionPhase, INTERACTION_PHASE),
            UPDATED_AT = SYSDATE
        WHERE CONVERSATION_ID = :conversationId
      `;

      await executeUpdate(updateQuery, {
        conversationId,
        ...contextData,
      });
    } else {
      // Create
      const insertQuery = `
        INSERT INTO CHATBOT_CONVERSATION_CONTEXT
        (CONTEXT_ID, CONVERSATION_ID, DEVICE_TYPE, ENTRY_POINT, TIME_OF_DAY,
         USER_URGENCY, INTERACTION_PHASE, CREATED_AT)
        VALUES (chatbot_context_seq.NEXTVAL, :conversationId, :deviceType, :entryPoint,
                :timeOfDay, :userUrgency, :interactionPhase, SYSDATE)
      `;

      await executeUpdate(insertQuery, {
        conversationId,
        timeOfDay: getTimeOfDay(),
        ...contextData,
      });
    }

    return await getConversationContext(conversationId);
  } catch (error) {
    console.error('Error upserting conversation context:', error);
    throw error;
  }
};

/**
 * Helper: Get current time of day
 */
const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'MORNING';
  if (hour >= 12 && hour < 17) return 'AFTERNOON';
  if (hour >= 17 && hour < 21) return 'EVENING';
  return 'NIGHT';
};

module.exports = {
  getUserProfile,
  upsertUserProfile,
  updateUserPreferences,
  recordUserPurchase,
  calculateChurnRisk,
  getConversationContext,
  upsertConversationContext,
  parseUserProfile,
};
