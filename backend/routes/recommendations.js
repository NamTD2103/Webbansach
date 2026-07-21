'use strict';

/**
 * Book Recommendation API Routes
 * Handles book suggestions, preferences, and feedback
 */

const express = require('express');
const router = express.Router();
const bookRecommendationEngine = require('../utils/bookRecommendationEngine');
const { executeQuery, executeUpdate } = require('../config/db');

/**
 * GET /api/recommendations/:userId
 * Get personalized recommendations for user
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 5 } = req.query;

    const recommendations = await bookRecommendationEngine.generatePersonalizedRecommendations(
      userId,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations',
      error: error.message,
    });
  }
});

/**
 * GET /api/recommendations/:userId/preferences
 * Get user's book preferences
 */
router.get('/:userId/preferences', async (req, res) => {
  try {
    const { userId } = req.params;

    const prefs = await bookRecommendationEngine.getUserBookPreferences(userId);

    res.json({
      success: true,
      data: prefs || {
        userId,
        favoriteCategories: [],
        favoriteAuthors: [],
        preferredDifficulty: null,
        readingMotivation: null,
      },
    });
  } catch (error) {
    console.error('Error getting preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get preferences',
      error: error.message,
    });
  }
});

/**
 * PUT /api/recommendations/:userId/preferences
 * Update user's book preferences
 */
router.put('/:userId/preferences', async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      favoriteCategories,
      dislikedCategories,
      favoriteAuthors,
      preferredDifficulty,
      readingMotivation,
      priceRange,
    } = req.body;

    // Check if exists
    const checkQuery = `
      SELECT PREF_ID FROM USER_BOOK_PREFERENCES WHERE USER_ID = :userId
    `;
    const checkResult = await executeQuery(checkQuery, { userId });

    if (checkResult.rows?.length > 0) {
      // Update
      const updateQuery = `
        UPDATE USER_BOOK_PREFERENCES
        SET FAVORITE_CATEGORIES = NVL(:favoriteCategories, FAVORITE_CATEGORIES),
            DISLIKED_CATEGORIES = NVL(:dislikedCategories, DISLIKED_CATEGORIES),
            FAVORITE_AUTHORS = NVL(:favoriteAuthors, FAVORITE_AUTHORS),
            PREFERRED_DIFFICULTY = NVL(:difficulty, PREFERRED_DIFFICULTY),
            READING_MOTIVATION = NVL(:motivation, READING_MOTIVATION),
            PRICE_RANGE_MIN = NVL(:priceMin, PRICE_RANGE_MIN),
            PRICE_RANGE_MAX = NVL(:priceMax, PRICE_RANGE_MAX),
            UPDATED_AT = SYSDATE
        WHERE USER_ID = :userId
      `;

      await executeUpdate(updateQuery, {
        userId,
        favoriteCategories: favoriteCategories ? JSON.stringify(favoriteCategories) : null,
        dislikedCategories: dislikedCategories ? JSON.stringify(dislikedCategories) : null,
        favoriteAuthors: favoriteAuthors ? JSON.stringify(favoriteAuthors) : null,
        difficulty: preferredDifficulty,
        motivation: readingMotivation,
        priceMin: priceRange?.min,
        priceMax: priceRange?.max,
      });
    } else {
      // Create
      const insertQuery = `
        INSERT INTO USER_BOOK_PREFERENCES
        (PREF_ID, USER_ID, FAVORITE_CATEGORIES, DISLIKED_CATEGORIES,
         FAVORITE_AUTHORS, PREFERRED_DIFFICULTY, READING_MOTIVATION,
         PRICE_RANGE_MIN, PRICE_RANGE_MAX, CREATED_AT, UPDATED_AT)
        VALUES (user_pref_seq.NEXTVAL, :userId, :favoriteCategories,
                :dislikedCategories, :favoriteAuthors, :difficulty, :motivation,
                :priceMin, :priceMax, SYSDATE, SYSDATE)
      `;

      await executeUpdate(insertQuery, {
        userId,
        favoriteCategories: JSON.stringify(favoriteCategories || []),
        dislikedCategories: JSON.stringify(dislikedCategories || []),
        favoriteAuthors: JSON.stringify(favoriteAuthors || []),
        difficulty: preferredDifficulty,
        motivation: readingMotivation,
        priceMin: priceRange?.min,
        priceMax: priceRange?.max,
      });
    }

    const updated = await bookRecommendationEngine.getUserBookPreferences(userId);
    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences',
      error: error.message,
    });
  }
});

/**
 * POST /api/recommendations/:userId/track-interaction
 * Track user interaction with a book (view, search, cart, purchase)
 */
router.post('/:userId/track-interaction', async (req, res) => {
  try {
    const { userId } = req.params;
    const { masp, interactionType, additionalData } = req.body;

    await bookRecommendationEngine.recordReadingHistory(
      userId,
      masp,
      interactionType,
      additionalData
    );

    res.json({
      success: true,
      message: 'Interaction tracked successfully',
    });
  } catch (error) {
    console.error('Error tracking interaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track interaction',
      error: error.message,
    });
  }
});

/**
 * GET /api/recommendations/:userId/history
 * Get user's reading/interaction history
 */
router.get('/:userId/history', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const query = `
      SELECT brh.*, sp.TENSP, sp.GIABAN
      FROM BOOK_READING_HISTORY brh
      JOIN SANPHAM sp ON brh.MASP = sp.MASP
      WHERE brh.USER_ID = :userId
      ORDER BY brh.INTERACTION_DATE DESC
      OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    `;

    const result = await executeQuery(query, {
      userId,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const history = result.rows?.map(row => ({
      historyId: row.HISTORY_ID,
      masp: row.MASP,
      tensp: row.TENSP,
      giaban: row.GIABAN,
      interactionType: row.INTERACTION_TYPE,
      status: row.STATUS,
      rating: row.PERSONAL_RATING,
      interactionDate: row.INTERACTION_DATE,
    })) || [];

    res.json({
      success: true,
      data: history,
      count: history.length,
    });
  } catch (error) {
    console.error('Error getting history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get history',
      error: error.message,
    });
  }
});

/**
 * POST /api/recommendations/:userId/feedback
 * Submit feedback on a recommendation
 */
router.post('/:userId/feedback', async (req, res) => {
  try {
    const { userId } = req.params;
    const { recId, feedbackType, reason } = req.body;

    const success = await bookRecommendationEngine.recordRecommendationFeedback(
      recId,
      userId,
      feedbackType,
      reason
    );

    if (success) {
      res.json({
        success: true,
        message: 'Feedback recorded successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to record feedback',
      });
    }
  } catch (error) {
    console.error('Error recording feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record feedback',
      error: error.message,
    });
  }
});

/**
 * GET /api/recommendations/trending
 * Get trending/popular books
 */
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const trending = await bookRecommendationEngine.generateTrendingRecommendations(
      parseInt(limit)
    );

    res.json({
      success: true,
      data: trending,
      count: trending.length,
    });
  } catch (error) {
    console.error('Error getting trending books:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trending books',
      error: error.message,
    });
  }
});

/**
 * GET /api/recommendations/:userId/similar/:masp
 * Get books similar to a specific book
 */
router.get('/:userId/similar/:masp', async (req, res) => {
  try {
    const { userId, masp } = req.params;
    const { limit = 5 } = req.query;

    const query = `
      SELECT bm.MASP, bm.TENSP, bm.GIABAN, bm.HINHANH, bm.AVERAGE_RATING,
             sb.SIMILARITY_SCORE, sb.REASON
      FROM SIMILAR_BOOKS sb
      JOIN BOOK_METADATA bm ON sb.BOOK_ID_2 = bm.MASP
      WHERE sb.BOOK_ID_1 = :masp
      AND sb.SIMILARITY_SCORE >= 0.6
      ORDER BY sb.SIMILARITY_SCORE DESC
      FETCH FIRST :limit ROWS ONLY
    `;

    const result = await executeQuery(query, {
      masp,
      limit: parseInt(limit),
    });

    const similar = result.rows?.map(row => ({
      masp: row.MASP,
      tensp: row.TENSP,
      giaban: row.GIABAN,
      hinhanh: row.HINHANH,
      rating: row.AVERAGE_RATING,
      similarityScore: row.SIMILARITY_SCORE,
      reason: row.REASON,
    })) || [];

    res.json({
      success: true,
      data: similar,
      count: similar.length,
    });
  } catch (error) {
    console.error('Error getting similar books:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get similar books',
      error: error.message,
    });
  }
});

/**
 * GET /api/recommendations/analytics
 * Get recommendation system analytics (for admin)
 */
router.get('/analytics/dashboard', async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    const query = `
      SELECT * FROM RECOMMENDATION_ANALYTICS
      WHERE DATE_TRACKED BETWEEN NVL(TO_DATE(:fromDate, 'YYYY-MM-DD'), TRUNC(SYSDATE) - 30)
                         AND NVL(TO_DATE(:toDate, 'YYYY-MM-DD'), TRUNC(SYSDATE))
      ORDER BY DATE_TRACKED DESC
    `;

    const result = await executeQuery(query, {
      fromDate: fromDate || null,
      toDate: toDate || null,
    });

    const analytics = result.rows?.map(row => ({
      date: row.DATE_TRACKED,
      recommendationType: row.RECOMMENDATION_TYPE,
      totalRecommendations: row.TOTAL_RECOMMENDATIONS,
      clickThroughRate: row.CLICK_THROUGH_RATE,
      conversionRate: row.CONVERSION_RATE,
      satisfactionScore: row.SATISFACTION_SCORE,
      totalRevenue: row.TOTAL_REVENUE,
    })) || [];

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics',
      error: error.message,
    });
  }
});

module.exports = router;
