'use strict';

/**
 * Book Recommendation Engine
 * Smart recommendation system that learns from user behavior
 */

const { executeQuery, executeUpdate } = require('../config/db');

/**
 * Get user book preferences
 */
const getUserBookPreferences = async (userId) => {
  try {
    const query = `
      SELECT * FROM USER_BOOK_PREFERENCES 
      WHERE USER_ID = :userId
    `;
    const result = await executeQuery(query, { userId });
    
    if (result.rows?.length > 0) {
      const row = result.rows[0];
      return {
        userId: row.USER_ID,
        favoriteCategories: row.FAVORITE_CATEGORIES ? JSON.parse(row.FAVORITE_CATEGORIES) : [],
        dislikedCategories: row.DISLIKED_CATEGORIES ? JSON.parse(row.DISLIKED_CATEGORIES) : [],
        favoriteAuthors: row.FAVORITE_AUTHORS ? JSON.parse(row.FAVORITE_AUTHORS) : [],
        dislikedAuthors: row.DISLIKED_AUTHORS ? JSON.parse(row.DISLIKED_AUTHORS) : [],
        preferredDifficulty: row.PREFERRED_DIFFICULTY,
        readingMotivation: row.READING_MOTIVATION,
        priceRange: { min: row.PRICE_RANGE_MIN, max: row.PRICE_RANGE_MAX },
        preferredTargetAudience: row.PREFERRED_TARGET_AUDIENCE,
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return null;
  }
};

/**
 * Track user reading history (view, search, cart, purchase)
 */
const recordReadingHistory = async (userId, masp, interactionType, additionalData = {}) => {
  try {
    const insertQuery = `
      INSERT INTO BOOK_READING_HISTORY 
      (HISTORY_ID, USER_ID, MASP, INTERACTION_TYPE, STATUS, 
       VIEW_DURATION_SECONDS, IN_SEARCH_CONTEXT, INTERACTION_DATE)
      VALUES (reading_history_seq.NEXTVAL, :userId, :masp, :interactionType, :status,
              :viewDuration, :searchContext, SYSDATE)
    `;

    await executeUpdate(insertQuery, {
      userId,
      masp,
      interactionType,
      status: additionalData.status || 'BROWSED',
      viewDuration: additionalData.viewDuration || null,
      searchContext: additionalData.searchContext || null,
    });

    // Update user preferences based on interaction
    await updatePreferencesFromHistory(userId, masp, interactionType);

    return true;
  } catch (error) {
    console.error('Error recording reading history:', error);
    return false;
  }
};

/**
 * Learn from user interactions
 */
const updatePreferencesFromHistory = async (userId, masp, interactionType) => {
  try {
    // Get book metadata
    const bookQuery = `
      SELECT bm.* FROM BOOK_METADATA bm
      WHERE bm.MASP = :masp
    `;
    const bookResult = await executeQuery(bookQuery, { masp });
    
    if (!bookResult.rows?.length) return;

    const book = bookResult.rows[0];
    const primaryCategory = book.CATEGORY_PRIMARY;
    const author = book.AUTHOR_NAME;

    // Get or create preferences
    let prefs = await getUserBookPreferences(userId);
    if (!prefs) {
      // Create new preferences
      await executeUpdate(`
        INSERT INTO USER_BOOK_PREFERENCES 
        (PREF_ID, USER_ID, FAVORITE_CATEGORIES, CREATED_AT, UPDATED_AT)
        VALUES (user_pref_seq.NEXTVAL, :userId, '[]', SYSDATE, SYSDATE)
      `, { userId });
      prefs = await getUserBookPreferences(userId);
    }

    // Update categories based on interaction
    let categories = prefs.favoriteCategories || [];
    
    if (interactionType === 'PURCHASED' || interactionType === 'REVIEWED') {
      // Strong signal
      categories = incrementCategoryWeight(categories, primaryCategory, 3);
    } else if (interactionType === 'ADDED_CART') {
      // Medium signal
      categories = incrementCategoryWeight(categories, primaryCategory, 2);
    } else if (interactionType === 'VIEWED') {
      // Weak signal
      categories = incrementCategoryWeight(categories, primaryCategory, 1);
    }

    // Update preferences in DB
    const updateQuery = `
      UPDATE USER_BOOK_PREFERENCES
      SET FAVORITE_CATEGORIES = :categories,
          UPDATED_AT = SYSDATE
      WHERE USER_ID = :userId
    `;
    await executeUpdate(updateQuery, {
      userId,
      categories: JSON.stringify(categories),
    });

  } catch (error) {
    console.error('Error updating preferences:', error);
  }
};

/**
 * Helper: increment category weight
 */
const incrementCategoryWeight = (categories, categoryName, weight) => {
  const existing = categories.find(c => c.category === categoryName);
  if (existing) {
    existing.weight = (existing.weight || 1) + weight;
    existing.lastMentioned = new Date().toISOString();
  } else {
    categories.push({
      category: categoryName,
      weight,
      lastMentioned: new Date().toISOString(),
    });
  }
  return categories.sort((a, b) => b.weight - a.weight);
};

/**
 * Generate personalized recommendations
 * @param userId - User ID
 * @param limit - Number of recommendations to generate (default: 5)
 * @returns - Array of recommendation objects
 */
const generatePersonalizedRecommendations = async (userId, limit = 5) => {
  try {
    // Get user profile and preferences
    const userProfile = await getUserProfile(userId);
    const userPrefs = await getUserBookPreferences(userId);
    
    if (!userProfile || !userPrefs) {
      // Fallback to trending books
      return await generateTrendingRecommendations(limit);
    }

    // Get user's reading history
    const historyQuery = `
      SELECT DISTINCT MASP FROM BOOK_READING_HISTORY
      WHERE USER_ID = :userId
      AND INTERACTION_DATE > SYSDATE - 90
      ORDER BY INTERACTION_DATE DESC
    `;
    const historyResult = await executeQuery(historyQuery, { userId });
    const viewedBooks = historyResult.rows?.map(r => r.MASP) || [];

    // Find similar books to what user liked
    let recommendations = [];

    // Strategy 1: Similar to books user viewed/purchased
    if (viewedBooks.length > 0) {
      const similarQuery = `
        SELECT DISTINCT bm.MASP, bm.TENSP, bm.GIABAN, bm.HINHANH,
               sb.SIMILARITY_SCORE, 'SIMILAR' as REC_TYPE
        FROM SIMILAR_BOOKS sb
        JOIN BOOK_METADATA bm ON sb.BOOK_ID_2 = bm.MASP
        WHERE sb.BOOK_ID_1 IN (${viewedBooks.map((_, i) => `:book${i}`).join(',')})
        AND bm.MASP NOT IN (${viewedBooks.map((_, i) => `:viewed${i}`).join(',')})
        AND sb.SIMILARITY_SCORE >= 0.6
        ORDER BY sb.SIMILARITY_SCORE DESC
        FETCH FIRST :limit ROWS ONLY
      `;
      
      const params = {};
      viewedBooks.forEach((book, i) => {
        params[`book${i}`] = book;
        params[`viewed${i}`] = book;
      });
      params.limit = limit;

      const similarResult = await executeQuery(similarQuery, params);
      recommendations = similarResult.rows?.map(row => ({
        masp: row.MASP,
        tensp: row.TENSP,
        giaban: row.GIABAN,
        hinhanh: row.HINHANH,
        type: 'SIMILAR',
        reason: 'Sách tương tự với những cuốn bạn thích',
        matchScore: row.SIMILARITY_SCORE,
      })) || [];
    }

    // Strategy 2: Books matching favorite categories
    if (recommendations.length < limit && userPrefs.favoriteCategories.length > 0) {
      const categories = userPrefs.favoriteCategories.slice(0, 3).map(c => c.category);
      const categoryQuery = `
        SELECT DISTINCT bm.MASP, bm.TENSP, bm.GIABAN, bm.HINHANH, bm.AVERAGE_RATING,
               bm.RECOMMENDATION_SCORE
        FROM BOOK_METADATA bm
        WHERE bm.CATEGORY_PRIMARY IN (${categories.map((_, i) => `:cat${i}`).join(',')})
        AND bm.MASP NOT IN (
          SELECT MASP FROM BOOK_READING_HISTORY 
          WHERE USER_ID = :userId
        )
        ORDER BY bm.AVERAGE_RATING DESC, bm.RECOMMENDATION_SCORE DESC
        FETCH FIRST :limit ROWS ONLY
      `;

      const params = {};
      categories.forEach((cat, i) => {
        params[`cat${i}`] = cat;
      });
      params.userId = userId;
      params.limit = limit - recommendations.length;

      const categoryResult = await executeQuery(categoryQuery, params);
      const categoryBooks = categoryResult.rows?.map(row => ({
        masp: row.MASP,
        tensp: row.TENSP,
        giaban: row.GIABAN,
        hinhanh: row.HINHANH,
        type: 'CATEGORY_MATCH',
        reason: `Phù hợp với thể loại bạn yêu thích`,
        matchScore: (row.AVERAGE_RATING || 3.5) / 5,
      })) || [];
      
      recommendations = [...recommendations, ...categoryBooks];
    }

    // Strategy 3: Trending/Popular books
    if (recommendations.length < limit) {
      const trendingQuery = `
        SELECT DISTINCT bm.MASP, bm.TENSP, bm.GIABAN, bm.HINHANH,
               bm.AVERAGE_RATING, bm.REVIEW_COUNT
        FROM BOOK_METADATA bm
        WHERE bm.IS_TRENDING = 1 OR bm.BESTSELLER_RANK <= 50
        AND bm.MASP NOT IN (
          SELECT MASP FROM BOOK_READING_HISTORY 
          WHERE USER_ID = :userId
        )
        ORDER BY bm.REVIEW_COUNT DESC, bm.AVERAGE_RATING DESC
        FETCH FIRST :limit ROWS ONLY
      `;

      const trendingResult = await executeQuery(trendingQuery, {
        userId,
        limit: limit - recommendations.length,
      });
      
      const trendingBooks = trendingResult.rows?.map(row => ({
        masp: row.MASP,
        tensp: row.TENSP,
        giaban: row.GIABAN,
        hinhanh: row.HINHANH,
        type: 'TRENDING',
        reason: 'Sách đang được quan tâm nhiều',
        matchScore: (row.AVERAGE_RATING || 3.5) / 5,
      })) || [];

      recommendations = [...recommendations, ...trendingBooks];
    }

    // Save recommendations to DB and return
    return await saveAndReturnRecommendations(userId, recommendations.slice(0, limit));

  } catch (error) {
    console.error('Error generating recommendations:', error);
    return [];
  }
};

/**
 * Generate trending recommendations (fallback)
 */
const generateTrendingRecommendations = async (limit = 5) => {
  try {
    const query = `
      SELECT bm.MASP, bm.TENSP, bm.GIABAN, bm.HINHANH, bm.AVERAGE_RATING
      FROM BOOK_METADATA bm
      WHERE bm.IS_TRENDING = 1 OR bm.BESTSELLER_RANK <= 50
      ORDER BY bm.REVIEW_COUNT DESC, bm.AVERAGE_RATING DESC
      FETCH FIRST :limit ROWS ONLY
    `;

    const result = await executeQuery(query, { limit });
    return result.rows?.map((row, idx) => ({
      masp: row.MASP,
      tensp: row.TENSP,
      giaban: row.GIABAN,
      hinhanh: row.HINHANH,
      type: 'TRENDING',
      reason: 'Sách nổi bật hiện nay',
      matchScore: 0.5,
      rank: idx + 1,
    })) || [];
  } catch (error) {
    console.error('Error generating trending recommendations:', error);
    return [];
  }
};

/**
 * Save recommendations to DB
 */
const saveAndReturnRecommendations = async (userId, recommendations) => {
  try {
    const savedRecs = [];

    for (let i = 0; i < recommendations.length; i++) {
      const rec = recommendations[i];
      const insertQuery = `
        INSERT INTO BOOK_RECOMMENDATIONS
        (REC_ID, USER_ID, MASP, RECOMMENDATION_TYPE, REASON, 
         MATCH_SCORE, CONFIDENCE_LEVEL, RANK_POSITION, GENERATED_AT, EXPIRES_AT)
        VALUES (recommendation_seq.NEXTVAL, :userId, :masp, :recType, :reason,
                :matchScore, :confidence, :rank, SYSDATE, SYSDATE + 7)
      `;

      await executeUpdate(insertQuery, {
        userId,
        masp: rec.masp,
        recType: rec.type || 'PERSONALIZED',
        reason: rec.reason || 'Được gợi ý dựa trên sở thích của bạn',
        matchScore: rec.matchScore || 0.5,
        confidence: rec.matchScore || 0.5,
        rank: i + 1,
      });

      savedRecs.push({
        ...rec,
        rank: i + 1,
      });
    }

    return savedRecs;
  } catch (error) {
    console.error('Error saving recommendations:', error);
    return recommendations;
  }
};

/**
 * Record recommendation feedback
 */
const recordRecommendationFeedback = async (recId, userId, feedbackType, reason = '') => {
  try {
    const insertQuery = `
      INSERT INTO RECOMMENDATION_FEEDBACK
      (FEEDBACK_ID, REC_ID, USER_ID, FEEDBACK_TYPE, DETAILED_REASON, FEEDBACK_AT)
      VALUES (recommendation_feedback_seq.NEXTVAL, :recId, :userId, :feedbackType, 
              :reason, SYSDATE)
    `;

    await executeUpdate(insertQuery, {
      recId,
      userId,
      feedbackType,
      reason: reason || null,
    });

    // Update recommendation status
    const updateQuery = `
      UPDATE BOOK_RECOMMENDATIONS
      SET USER_FEEDBACK = :feedback, FEEDBACK_AT = SYSDATE
      WHERE REC_ID = :recId
    `;

    await executeUpdate(updateQuery, {
      recId,
      feedback: feedbackType,
    });

    // Learn from feedback
    await learnFromFeedback(userId, recId, feedbackType);

    return true;
  } catch (error) {
    console.error('Error recording feedback:', error);
    return false;
  }
};

/**
 * Learn from user feedback
 */
const learnFromFeedback = async (userId, recId, feedbackType) => {
  try {
    if (feedbackType === 'HELPFUL') {
      // Boost similar recommendations
      const recQuery = `SELECT MASP FROM BOOK_RECOMMENDATIONS WHERE REC_ID = :recId`;
      const recResult = await executeQuery(recQuery, { recId });
      
      if (recResult.rows?.length > 0) {
        const masp = recResult.rows[0].MASP;
        // Could boost future recommendations of this book or similar books
      }
    } else if (feedbackType === 'NOT_HELPFUL') {
      // Reduce similar recommendations
      // Learn what NOT to recommend
    }

    return true;
  } catch (error) {
    console.error('Error learning from feedback:', error);
    return false;
  }
};

/**
 * Helper: Get user profile (assumes exists in userProfileManager)
 */
const getUserProfile = async (userId) => {
  const userProfileManager = require('./userProfileManager');
  return await userProfileManager.getUserProfile(userId);
};

module.exports = {
  getUserBookPreferences,
  recordReadingHistory,
  generatePersonalizedRecommendations,
  generateTrendingRecommendations,
  recordRecommendationFeedback,
  updatePreferencesFromHistory,
};
