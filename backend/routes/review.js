const express = require('express');
const router = express.Router();
const { executeQuery, getConnection } = require('../config/db');
const { generateReviewSummary, analyzeSentiment } = require('../utils/reviewAIEngine');

/**
 * POST /api/review
 * Create a new product review
 */
router.post('/', async (req, res) => {
  try {
    const { productId, userId, rating, title, content, verifiedPurchase } = req.body;

    if (!productId || !userId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: productId, userId, rating',
      });
    }

    // Analyze sentiment
    const sentiment = analyzeSentiment(content);

    const query = `
      INSERT INTO PRODUCT_REVIEWS (
        REVIEW_ID, PRODUCT_ID, USER_ID, RATING, TITLE, CONTENT,
        VERIFIED_PURCHASE, SENTIMENT, CREATED_AT
      ) VALUES (
        SEQ_REVIEW_ID.NEXTVAL, :productId, :userId, :rating, :title, :content,
        :verifiedPurchase, :sentiment, CURRENT_TIMESTAMP
      ) RETURNING REVIEW_ID INTO :reviewId
    `;

    const binds = {
      productId,
      userId,
      rating: parseFloat(rating),
      title: title || 'Bình luận về sản phẩm',
      content: content || '',
      verifiedPurchase: verifiedPurchase ? 1 : 0,
      sentiment,
      reviewId: { type: 101, dir: 3003 }, // OUT parameter
    };

    const result = await executeQuery(query, binds);

    // Update review summary
    await updateReviewSummary(productId);

    res.json({
      success: true,
      message: 'Review created successfully',
      data: {
        reviewId: result.outBinds.reviewId[0],
      },
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create review',
      error: error.message,
    });
  }
});

/**
 * GET /api/review/product/:productId
 * Get all reviews for a product with pagination
 */
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 10, offset = 0, sort = 'helpful' } = req.query;

    let orderBy = 'pr.CREATED_AT DESC';
    if (sort === 'helpful') {
      orderBy = 'pr.HELPFUL_COUNT DESC, pr.CREATED_AT DESC';
    } else if (sort === 'highest') {
      orderBy = 'pr.RATING DESC, pr.CREATED_AT DESC';
    } else if (sort === 'lowest') {
      orderBy = 'pr.RATING ASC, pr.CREATED_AT DESC';
    }

    const query = `
      SELECT 
        pr.REVIEW_ID, pr.RATING, pr.TITLE, pr.CONTENT,
        pr.VERIFIED_PURCHASE, pr.HELPFUL_COUNT, pr.UNHELPFUL_COUNT,
        pr.SENTIMENT, pr.CREATED_AT,
        u.USER_ID, u.USERNAME, u.FULLNAME
      FROM PRODUCT_REVIEWS pr
      JOIN USERS u ON pr.USER_ID = u.USER_ID
      WHERE pr.PRODUCT_ID = :productId AND pr.STATUS = 'PUBLISHED'
      ORDER BY ${orderBy}
      OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    `;

    const result = await executeQuery(query, {
      productId,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Get images for each review
    const reviews = result.rows || [];
    for (const review of reviews) {
      const imgQuery = `
        SELECT IMAGE_URL, DISPLAY_ORDER
        FROM REVIEW_IMAGES
        WHERE REVIEW_ID = :reviewId
        ORDER BY DISPLAY_ORDER
      `;
      const imgResult = await executeQuery(imgQuery, { reviewId: review.REVIEW_ID });
      review.images = imgResult.rows || [];
    }

    res.json({
      success: true,
      data: reviews.map(r => ({
        reviewId: r.REVIEW_ID,
        rating: r.RATING,
        title: r.TITLE,
        content: r.CONTENT,
        verifiedPurchase: r.VERIFIED_PURCHASE === 1,
        helpfulCount: r.HELPFUL_COUNT,
        unhelpfulCount: r.UNHELPFUL_COUNT,
        sentiment: r.SENTIMENT,
        images: r.images,
        createdAt: r.CREATED_AT,
        user: {
          userId: r.USER_ID,
          username: r.USERNAME,
          fullName: r.FULLNAME,
        },
      })),
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
 * GET /api/review/product/:productId/summary
 * Get AI-generated review summary for a product
 */
router.get('/product/:productId/summary', async (req, res) => {
  try {
    const { productId } = req.params;
    const { refresh } = req.query;

    let summary;

    // Check if summary exists and not stale
    if (!refresh) {
      const checkQuery = `
        SELECT * FROM PRODUCT_REVIEW_SUMMARY
        WHERE PRODUCT_ID = :productId
        AND LAST_UPDATED > SYSDATE - INTERVAL '1' DAY
      `;
      const checkResult = await executeQuery(checkQuery, { productId });
      if (checkResult.rows && checkResult.rows.length > 0) {
        summary = checkResult.rows[0];
      }
    }

    // If no cached summary or refresh requested, generate new one
    if (!summary) {
      summary = await generateReviewSummary(productId);
    }

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Error getting review summary:', error);
    res.json({
      success: true,
      data: null, // Return null gracefully if generation fails
    });
  }
});

/**
 * POST /api/review/:reviewId/like
 * Like or dislike a review
 */
router.post('/:reviewId/like', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { userId, likeType } = req.body;

    if (!userId || !['HELPFUL', 'UNHELPFUL'].includes(likeType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid userId or likeType',
      });
    }

    // Check if already liked
    const checkQuery = `
      SELECT LIKE_ID FROM REVIEW_LIKES
      WHERE REVIEW_ID = :reviewId AND USER_ID = :userId AND LIKE_TYPE = :likeType
    `;
    const checkResult = await executeQuery(checkQuery, { reviewId, userId, likeType });

    if (checkResult.rows && checkResult.rows.length > 0) {
      // Already liked, remove it
      const deleteQuery = `
        DELETE FROM REVIEW_LIKES
        WHERE REVIEW_ID = :reviewId AND USER_ID = :userId AND LIKE_TYPE = :likeType
      `;
      await executeQuery(deleteQuery, { reviewId, userId, likeType });
    } else {
      // Add like
      const insertQuery = `
        INSERT INTO REVIEW_LIKES (
          LIKE_ID, REVIEW_ID, USER_ID, LIKE_TYPE, CREATED_AT
        ) VALUES (
          SEQ_REVIEW_LIKE_ID.NEXTVAL, :reviewId, :userId, :likeType, CURRENT_TIMESTAMP
        )
      `;
      await executeQuery(insertQuery, { reviewId, userId, likeType });
    }

    // Update helpful/unhelpful count
    const updateQuery = `
      UPDATE PRODUCT_REVIEWS
      SET HELPFUL_COUNT = (
        SELECT COUNT(*) FROM REVIEW_LIKES
        WHERE REVIEW_ID = :reviewId AND LIKE_TYPE = 'HELPFUL'
      ),
      UNHELPFUL_COUNT = (
        SELECT COUNT(*) FROM REVIEW_LIKES
        WHERE REVIEW_ID = :reviewId AND LIKE_TYPE = 'UNHELPFUL'
      )
      WHERE REVIEW_ID = :reviewId
    `;
    await executeQuery(updateQuery, { reviewId });

    res.json({
      success: true,
      message: 'Like updated successfully',
    });
  } catch (error) {
    console.error('Error updating like:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update like',
      error: error.message,
    });
  }
});

/**
 * POST /api/review/:reviewId/report
 * Report inappropriate review
 */
router.post('/:reviewId/report', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reporterId, reason, description } = req.body;

    if (!reporterId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: reporterId, reason',
      });
    }

    const query = `
      INSERT INTO REVIEW_REPORTS (
        REPORT_ID, REVIEW_ID, REPORTER_ID, REASON, DESCRIPTION, STATUS, CREATED_AT
      ) VALUES (
        SEQ_REVIEW_REPORT_ID.NEXTVAL, :reviewId, :reporterId, :reason, :description,
        'PENDING', CURRENT_TIMESTAMP
      )
    `;

    await executeQuery(query, {
      reviewId,
      reporterId,
      reason,
      description: description || '',
    });

    res.json({
      success: true,
      message: 'Review reported successfully',
    });
  } catch (error) {
    console.error('Error reporting review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to report review',
      error: error.message,
    });
  }
});

/**
 * Internal function: Update review summary
 */
async function updateReviewSummary(productId) {
  try {
    const summaryData = await generateReviewSummary(productId);

    // Check if summary exists
    const checkQuery = `
      SELECT SUMMARY_ID FROM PRODUCT_REVIEW_SUMMARY
      WHERE PRODUCT_ID = :productId
    `;
    const checkResult = await executeQuery(checkQuery, { productId });

    if (checkResult.rows && checkResult.rows.length > 0) {
      // Update existing
      const updateQuery = `
        UPDATE PRODUCT_REVIEW_SUMMARY
        SET AVERAGE_RATING = :avgRating,
            TOTAL_REVIEWS = :totalReviews,
            RATING_DISTRIBUTION = :ratingDist,
            AI_SUMMARY = :aiSummary,
            POSITIVE_PERCENT = :positivePercent,
            NEUTRAL_PERCENT = :neutralPercent,
            NEGATIVE_PERCENT = :negativePercent,
            KEY_STRENGTHS = :strengths,
            KEY_WEAKNESSES = :weaknesses,
            LAST_UPDATED = CURRENT_TIMESTAMP
        WHERE PRODUCT_ID = :productId
      `;
      await executeQuery(updateQuery, {
        productId,
        avgRating: summaryData.average_rating,
        totalReviews: summaryData.total_reviews,
        ratingDist: JSON.stringify(summaryData.rating_distribution),
        aiSummary: summaryData.ai_summary,
        positivePercent: summaryData.positive_percent,
        neutralPercent: summaryData.neutral_percent,
        negativePercent: summaryData.negative_percent,
        strengths: JSON.stringify(summaryData.key_strengths),
        weaknesses: JSON.stringify(summaryData.key_weaknesses),
      });
    } else {
      // Insert new
      const insertQuery = `
        INSERT INTO PRODUCT_REVIEW_SUMMARY (
          SUMMARY_ID, PRODUCT_ID, AVERAGE_RATING, TOTAL_REVIEWS,
          RATING_DISTRIBUTION, AI_SUMMARY, POSITIVE_PERCENT,
          NEUTRAL_PERCENT, NEGATIVE_PERCENT, KEY_STRENGTHS, KEY_WEAKNESSES,
          LAST_UPDATED
        ) VALUES (
          SEQ_SUMMARY_ID.NEXTVAL, :productId, :avgRating, :totalReviews,
          :ratingDist, :aiSummary, :positivePercent, :neutralPercent,
          :negativePercent, :strengths, :weaknesses, CURRENT_TIMESTAMP
        )
      `;
      await executeQuery(insertQuery, {
        productId,
        avgRating: summaryData.average_rating,
        totalReviews: summaryData.total_reviews,
        ratingDist: JSON.stringify(summaryData.rating_distribution),
        aiSummary: summaryData.ai_summary,
        positivePercent: summaryData.positive_percent,
        neutralPercent: summaryData.neutral_percent,
        negativePercent: summaryData.negative_percent,
        strengths: JSON.stringify(summaryData.key_strengths),
        weaknesses: JSON.stringify(summaryData.key_weaknesses),
      });
    }
  } catch (err) {
    console.error('Error updating review summary:', err);
  }
}

module.exports = router;
