const { executeQuery } = require('../config/db');

/**
 * Analyze sentiment of review content
 * Simple keyword-based analysis (can be replaced with ML model)
 */
function analyzeSentiment(text) {
  if (!text) return 'NEUTRAL';

  const positiveWords = [
    'tuyệt vời', 'rất tốt', 'xuất sắc', 'tuyệt', 'thích', 'yêu',
    'tốt', 'hay', 'đẹp', 'chất lượng', 'xứng đáng', 'như mong đợi',
    'siêu', 'amazing', 'excellent', 'great', 'love', 'perfect',
    'recommend', 'awesome', 'fantastic', 'wonderful', 'impressed'
  ];

  const negativeWords = [
    'tệ', 'xấu', 'không tốt', 'tồi', 'ghét', 'khó chịu',
    'lừa', 'kém', 'fail', 'thất vọng', 'hư hỏng',
    'bad', 'terrible', 'poor', 'hate', 'waste', 'regret',
    'disappointed', 'awful', 'horrible', 'useless', 'scam'
  ];

  const textLower = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach(word => {
    if (textLower.includes(word)) positiveCount++;
  });

  negativeWords.forEach(word => {
    if (textLower.includes(word)) negativeCount++;
  });

  if (positiveCount > negativeCount) return 'POSITIVE';
  if (negativeCount > positiveCount) return 'NEGATIVE';
  return 'NEUTRAL';
}

/**
 * Generate AI review summary for a product
 */
async function generateReviewSummary(productId) {
  try {
    // Get all reviews for the product
    const reviewsQuery = `
      SELECT RATING, SENTIMENT, CONTENT, HELPFUL_COUNT
      FROM PRODUCT_REVIEWS
      WHERE PRODUCT_ID = :productId AND STATUS = 'PUBLISHED'
      ORDER BY HELPFUL_COUNT DESC
    `;

    const result = await executeQuery(reviewsQuery, { productId });
    const reviews = result.rows || [];

    if (reviews.length === 0) {
      return {
        product_id: productId,
        average_rating: 0,
        total_reviews: 0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        ai_summary: 'Chưa có đánh giá nào',
        positive_percent: 0,
        neutral_percent: 0,
        negative_percent: 0,
        key_strengths: [],
        key_weaknesses: [],
      };
    }

    // Calculate statistics
    const totalReviews = reviews.length;
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const sentimentCounts = { POSITIVE: 0, NEUTRAL: 0, NEGATIVE: 0 };
    let totalRating = 0;

    reviews.forEach(review => {
      const rating = Math.round(review.RATING);
      ratingDistribution[rating]++;
      totalRating += review.RATING;
      sentimentCounts[review.SENTIMENT || 'NEUTRAL']++;
    });

    const averageRating = (totalRating / totalReviews).toFixed(1);
    const positivePercent = ((sentimentCounts.POSITIVE / totalReviews) * 100).toFixed(0);
    const neutralPercent = ((sentimentCounts.NEUTRAL / totalReviews) * 100).toFixed(0);
    const negativePercent = ((sentimentCounts.NEGATIVE / totalReviews) * 100).toFixed(0);

    // Extract keywords (simple implementation)
    const keyStrengths = extractKeywords(
      reviews.filter(r => r.SENTIMENT === 'POSITIVE').map(r => r.CONTENT)
    );
    const keyWeaknesses = extractKeywords(
      reviews.filter(r => r.SENTIMENT === 'NEGATIVE').map(r => r.CONTENT)
    );

    // Generate AI summary
    let aiSummary = '';
    if (positivePercent > 60) {
      aiSummary += `Đa số người dùng (${positivePercent}%) rất hài lòng với sản phẩm này. `;
    }
    if (keyStrengths.length > 0) {
      aiSummary += `Điểm mạnh: ${keyStrengths.slice(0, 2).join(', ')}. `;
    }
    if (negativePercent > 20 && keyWeaknesses.length > 0) {
      aiSummary += `Một số nhận xét: ${keyWeaknesses.slice(0, 2).join(', ')}.`;
    }

    return {
      product_id: productId,
      average_rating: parseFloat(averageRating),
      total_reviews: totalReviews,
      rating_distribution: ratingDistribution,
      ai_summary: aiSummary || 'Sản phẩm nhận được đánh giá khá tốt từ người dùng',
      positive_percent: parseFloat(positivePercent),
      neutral_percent: parseFloat(neutralPercent),
      negative_percent: parseFloat(negativePercent),
      key_strengths: keyStrengths,
      key_weaknesses: keyWeaknesses,
    };
  } catch (error) {
    console.error('Error generating review summary:', error);
    return null;
  }
}

/**
 * Extract keywords from reviews
 */
function extractKeywords(reviews) {
  const keywords = {
    strength: [
      'dễ hiểu', 'mô tả chi tiết', 'đóng gói tốt', 'giao hàng nhanh',
      'chất lượng tốt', 'đáng tiền', 'hài lòng', 'giá tốt',
      'hay', 'thú vị', 'bổ ích', 'tác giả giỏi'
    ],
    weakness: [
      'giá cao', 'đóng gói kém', 'giao hàng chậm', 'sai mô tả',
      'hư hỏng', 'in mờ', 'thiếu trang', 'lặp lại nội dung',
      'cũ', 'bản dịch tệ', 'bìa lỏng', 'lỗi in'
    ]
  };

  const foundKeywords = [];
  const reviewText = reviews.join(' ').toLowerCase();

  // Check for strength keywords
  for (const key of keywords.strength) {
    if (reviewText.includes(key)) {
      foundKeywords.push(key);
    }
  }

  // If no strength found, check weakness
  if (foundKeywords.length === 0) {
    for (const key of keywords.weakness) {
      if (reviewText.includes(key)) {
        foundKeywords.push(key);
      }
    }
  }

  return foundKeywords.slice(0, 3);
}

module.exports = {
  analyzeSentiment,
  generateReviewSummary,
  extractKeywords,
};
