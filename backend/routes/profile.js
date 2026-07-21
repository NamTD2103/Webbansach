'use strict';

/**
 * User Profile API Routes
 * Handles profile management, analytics, insights, wishlist, reviews
 */

const express = require('express');
const router = express.Router();
const { executeQuery, executeUpdate } = require('../config/db');
const { generateUserInsights, getUserInsights, updateUserAnalytics } = require('../utils/userInsightsGenerator');
const bookRecommendationEngine = require('../utils/bookRecommendationEngine');

/**
 * GET /api/profile/:userId
 * Get complete user profile with all sections
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get basic user info
    const userQuery = `
      SELECT USER_ID, USERNAME, EMAIL, FULLNAME, ROLE
      FROM USERS 
      WHERE USER_ID = :userId
    `;
    const userResult = await executeQuery(userQuery, { userId });

    if (!userResult.rows?.length) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const user = userResult.rows[0];

    // Get addresses (try, but don't fail if table doesn't exist)
    let addresses = [];
    try {
      const addressQuery = `
        SELECT * FROM ADDRESS WHERE USER_ID = :userId ORDER BY IS_DEFAULT DESC
      `;
      const addressResult = await executeQuery(addressQuery, { userId });
      addresses = addressResult.rows || [];
    } catch (err) {
      console.log('Note: ADDRESS table query failed, continuing without addresses');
    }

    // Get analytics (will be empty if no data yet)
    let analytics = null;
    try {
      const analyticsQuery = `
        SELECT * FROM USER_READING_ANALYTICS WHERE USER_ID = :userId
      `;
      const analyticsResult = await executeQuery(analyticsQuery, { userId });
      analytics = analyticsResult.rows?.[0] || null;
    } catch (err) {
      console.log('Note: USER_READING_ANALYTICS not ready yet');
    }

    // Get insights
    let insights = {};
    try {
      insights = await getUserInsights(userId);
    } catch (err) {
      console.log('Note: Insights generation error, continuing');
    }

    // Get profile completeness
    let completeness = null;
    try {
      const completeQuery = `
        SELECT * FROM USER_PROFILE_COMPLETENESS WHERE USER_ID = :userId
      `;
      const completeResult = await executeQuery(completeQuery, { userId });
      completeness = completeResult.rows?.[0] || null;
    } catch (err) {
      console.log('Note: USER_PROFILE_COMPLETENESS not ready yet');
    }

    // Get recent orders
    let recentOrders = [];
    try {
      const ordersQuery = `
        SELECT ORDER_ID, ORDER_DATE, STATUS, TOTAL_AMOUNT 
        FROM ORDERS 
        WHERE USER_ID = :userId 
        ORDER BY ORDER_DATE DESC 
        FETCH FIRST 5 ROWS ONLY
      `;
      const ordersResult = await executeQuery(ordersQuery, { userId });
      recentOrders = ordersResult.rows || [];
    } catch (err) {
      console.log('Note: ORDERS query failed');
    }

    // Get wishlist count
    let wishlistCount = 0;
    try {
      const wishlistQuery = `
        SELECT COUNT(*) as count FROM USER_WISHLIST 
        WHERE USER_ID = :userId AND IS_ACTIVE = 1
      `;
      const wishlistResult = await executeQuery(wishlistQuery, { userId });
      wishlistCount = wishlistResult.rows?.[0]?.COUNT || 0;
    } catch (err) {
      console.log('Note: USER_WISHLIST query failed');
    }

    // Get review count
    let reviewCount = 0;
    try {
      const reviewQuery = `
        SELECT COUNT(*) as count FROM USER_BOOK_REVIEWS 
        WHERE USER_ID = :userId
      `;
      const reviewResult = await executeQuery(reviewQuery, { userId });
      reviewCount = reviewResult.rows?.[0]?.COUNT || 0;
    } catch (err) {
      console.log('Note: USER_BOOK_REVIEWS query failed');
    }

    res.json({
      success: true,
      data: {
        user: {
          userId: user.USER_ID,
          username: user.USERNAME,
          fullName: user.FULLNAME,
          email: user.EMAIL,
          phone: '', // Will be stored separately if needed
          role: user.ROLE,
          joinDate: new Date().toISOString(), // Default to now
        },
        addresses: addresses.map(addr => ({
          addressId: addr.ADDR_ID,
          address: addr.ADDRESS,
          city: addr.CITY,
          phone: addr.PHONE,
          isDefault: addr.IS_DEFAULT === 1,
        })),
        analytics: analytics ? {
          totalBooksViewed: analytics.TOTAL_BOOKS_VIEWED,
          totalBooksPurchased: analytics.TOTAL_BOOKS_PURCHASED,
          totalBooksReviewed: analytics.TOTAL_BOOKS_REVIEWED,
          totalSpent: analytics.TOTAL_SPENT,
          favoriteCategory1: analytics.FAVORITE_CATEGORY_1,
          favoriteCategory2: analytics.FAVORITE_CATEGORY_2,
          favoriteCategory3: analytics.FAVORITE_CATEGORY_3,
        } : null,
        insights: insights || {},
        completeness: completeness ? {
          overallPercent: completeness.OVERALL_COMPLETENESS_PERCENT,
          basicInfoComplete: completeness.BASIC_INFO_COMPLETE === 1,
          addressComplete: completeness.ADDRESS_COMPLETE === 1,
          avatarUploaded: completeness.AVATAR_UPLOADED === 1,
        } : null,
        recentOrders: recentOrders.map(order => ({
          orderId: order.ORDER_ID,
          createdAt: order.ORDER_DATE,
          status: order.STATUS,
          totalAmount: order.TOTAL_AMOUNT,
        })),
        wishlistCount,
        reviewCount,
      },
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message,
    });
  }
});

/**
 * PUT /api/profile/:userId
 * Update user profile information
 */
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { fullName, email, phone } = req.body;

    const updateQuery = `
      UPDATE USERS
      SET FULLNAME = NVL(:fullName, FULLNAME),
          EMAIL = NVL(:email, EMAIL)
      WHERE USER_ID = :userId
    `;

    await executeUpdate(updateQuery, {
      userId,
      fullName,
      email,
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
});

/**
 * GET /api/profile/:userId/insights
 * Get AI-generated insights about user
 */
router.get('/:userId/insights', async (req, res) => {
  try {
    const { userId } = req.params;
    const { refresh = 'false' } = req.query;

    let insights = null;

    if (refresh === 'true') {
      // Regenerate insights
      await updateUserAnalytics(userId);
      insights = await generateUserInsights(userId);
    } else {
      // Get cached or generate if doesn't exist
      insights = await getUserInsights(userId);
      if (!insights) {
        await updateUserAnalytics(userId);
        insights = await generateUserInsights(userId);
      }
    }

    res.json({
      success: true,
      data: insights || {},
    });
  } catch (error) {
    console.error('Error getting insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get insights',
      error: error.message,
    });
  }
});

/**
 * GET /api/profile/:userId/analytics
 * Get detailed reading analytics
 */
router.get('/:userId/analytics', async (req, res) => {
  try {
    const { userId } = req.params;

    const query = `
      SELECT * FROM USER_READING_ANALYTICS WHERE USER_ID = :userId
    `;
    const result = await executeQuery(query, { userId });

    if (!result.rows?.length) {
      return res.json({
        success: true,
        data: {
          totalBooksViewed: 0,
          totalBooksPurchased: 0,
          totalSpent: 0,
          message: 'No analytics data yet',
        },
      });
    }

    const analytics = result.rows[0];

    res.json({
      success: true,
      data: {
        totalBooksViewed: analytics.TOTAL_BOOKS_VIEWED,
        totalBooksPurchased: analytics.TOTAL_BOOKS_PURCHASED,
        totalBooksReviewed: analytics.TOTAL_BOOKS_REVIEWED,
        totalSpent: analytics.TOTAL_SPENT,
        averageSpending: analytics.AVERAGE_SPENDING,
        favoriteCategories: [
          { category: analytics.FAVORITE_CATEGORY_1, count: analytics.FAVORITE_CATEGORY_1_COUNT },
          { category: analytics.FAVORITE_CATEGORY_2, count: analytics.FAVORITE_CATEGORY_2_COUNT || 0 },
          { category: analytics.FAVORITE_CATEGORY_3, count: analytics.FAVORITE_CATEGORY_3_COUNT || 0 },
        ].filter(c => c.category),
        averageRating: analytics.AVERAGE_RATING_GIVEN,
        reviewCount: analytics.REVIEW_COUNT,
        wishlistCount: analytics.WISHLIST_COUNT,
        lastPurchase: analytics.LAST_PURCHASE_DATE,
        peakActivityDay: analytics.PEAK_ACTIVITY_DAY,
        peakActivityHour: analytics.PEAK_ACTIVITY_HOUR,
        engagementScore: analytics.ENGAGEMENT_SCORE,
      },
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

/**
 * GET /api/profile/:userId/wishlist
 * Get user's wishlist
 */
router.get('/:userId/wishlist', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const query = `
      SELECT * FROM USER_WISHLIST
      WHERE USER_ID = :userId AND IS_ACTIVE = 1
      ORDER BY PRIORITY DESC
      OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    `;

    const result = await executeQuery(query, {
      userId,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const wishlist = result.rows?.map(row => ({
      wishlistId: row.WISHLIST_ID,
      masp: row.MASP,
      priority: row.PRIORITY,
      addedAt: row.ADDED_AT,
      reason: row.REASON,
    })) || [];

    res.json({
      success: true,
      data: wishlist,
      count: wishlist.length,
    });
  } catch (error) {
    console.error('Error getting wishlist:', error);
    res.json({
      success: true,
      data: [],
      count: 0,
    });
  }
});

/**
 * POST /api/profile/:userId/wishlist
 * Add book to wishlist
 */
router.post('/:userId/wishlist', async (req, res) => {
  try {
    const { userId } = req.params;
    const { masp, priority = 'MEDIUM', reason = '' } = req.body;

    const insertQuery = `
      INSERT INTO USER_WISHLIST
      (WISHLIST_ID, USER_ID, MASP, PRIORITY, REASON, ADDED_DATE)
      VALUES (user_wishlist_seq.NEXTVAL, :userId, :masp, :priority, :reason, SYSDATE)
    `;

    await executeUpdate(insertQuery, {
      userId,
      masp,
      priority,
      reason: reason || null,
    });

    res.json({
      success: true,
      message: 'Added to wishlist',
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add to wishlist',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/profile/:userId/wishlist/:wishlistId
 * Remove from wishlist
 */
router.delete('/:userId/wishlist/:wishlistId', async (req, res) => {
  try {
    const { userId, wishlistId } = req.params;

    const deleteQuery = `
      UPDATE USER_WISHLIST
      SET IS_ACTIVE = 0
      WHERE WISHLIST_ID = :wishlistId AND USER_ID = :userId
    `;

    await executeUpdate(deleteQuery, { wishlistId, userId });

    res.json({
      success: true,
      message: 'Removed from wishlist',
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove from wishlist',
      error: error.message,
    });
  }
});

/**
 * GET /api/profile/:userId/reviews
 * Get user's reviews
 */
router.get('/:userId/reviews', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    const query = `
      SELECT ubr.*, sp.TENSP
      FROM USER_BOOK_REVIEWS ubr
      JOIN SANPHAM sp ON ubr.MASP = sp.MASP
      WHERE ubr.USER_ID = :userId
      ORDER BY ubr.REVIEW_DATE DESC
      OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    `;

    const result = await executeQuery(query, {
      userId,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const reviews = result.rows?.map(row => ({
      reviewId: row.REVIEW_ID,
      masp: row.MASP,
      tensp: row.TENSP,
      rating: row.RATING,
      reviewTitle: row.REVIEW_TITLE,
      reviewText: row.REVIEW_TEXT,
      reviewDate: row.REVIEW_DATE,
      helpfulCount: row.HELPFUL_COUNT,
      unhelpfulCount: row.UNHELPFUL_COUNT,
      isVerifiedPurchase: row.IS_VERIFIED_PURCHASE === 1,
    })) || [];

    res.json({
      success: true,
      data: reviews,
      count: reviews.length,
    });
  } catch (error) {
    console.error('Error getting reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reviews',
      error: error.message,
    });
  }
});

/**
 * GET /api/profile/:userId/personalized-recommendations
 * Get personalized book recommendations with reasons
 */
router.get('/:userId/personalized-recommendations', async (req, res) => {
  try {
    // Return empty for now - book recommendation system requires additional setup
    res.json({
      success: true,
      data: [],
      count: 0,
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.json({
      success: true,
      data: [],
      count: 0,
    });
  }
});

/**
 * Get human-readable reason for recommendation
 */
const getRecommendationReason = (rec, insights, position) => {
  const reasons = {
    SIMILAR: 'Sách tương tự như những cuốn bạn thích',
    CATEGORY_MATCH: 'Phù hợp với thể loại yêu thích của bạn',
    TRENDING: 'Sách đang được yêu thích',
    NEW_RELEASE: 'Tác phẩm mới nhất',
  };

  return reasons[rec.type] || 'Được gợi ý dành riêng cho bạn';
};

module.exports = router;
