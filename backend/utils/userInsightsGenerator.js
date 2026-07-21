'use strict';

/**
 * User AI Insights Generator
 * Analyzes user behavior and generates personalized insights
 */

const { executeQuery, executeUpdate } = require('../config/db');

/**
 * Generate AI insights for a user
 * Analyzes purchase history, viewing patterns, preferences
 */
const generateUserInsights = async (userId) => {
  try {
    // Get user analytics data
    const analytics = await getUserAnalytics(userId);
    if (!analytics) {
      return null;
    }

    // Generate insights based on data
    const insights = {
      readingStyleInsight: generateReadingStyleInsight(analytics),
      favoriteGenreInsight: generateGenreInsight(analytics),
      readingPaceInsight: generatePaceInsight(analytics),
      activityPatternInsight: generateActivityInsight(analytics),
      peakTimeInsight: generatePeakTimeInsight(analytics),
      spendingPatternInsight: generateSpendingInsight(analytics),
    };

    // Generate array of all insights
    const allInsights = generateAllInsights(analytics, insights);

    // Save to database
    await saveUserInsights(userId, insights, allInsights);

    return {
      ...insights,
      allInsights,
      confidenceScore: calculateConfidenceScore(analytics),
    };
  } catch (error) {
    console.error('Error generating user insights:', error);
    return null;
  }
};

/**
 * Get user analytics data
 */
const getUserAnalytics = async (userId) => {
  try {
    const query = `
      SELECT * FROM USER_READING_ANALYTICS 
      WHERE USER_ID = :userId
    `;
    const result = await executeQuery(query, { userId });
    
    if (result.rows?.length > 0) {
      return result.rows[0];
    }
    return null;
  } catch (error) {
    console.error('Error getting analytics:', error);
    return null;
  }
};

/**
 * Generate reading style insight
 */
const generateReadingStyleInsight = (analytics) => {
  const totalBooks = analytics.TOTAL_BOOKS_PURCHASED || 0;
  const avgRating = analytics.AVERAGE_RATING_GIVEN || 3;
  
  if (totalBooks === 0) {
    return '📚 Bạn mới bắt đầu hành trình đọc sách cùng chúng tôi';
  }

  let insight = '📚 ';

  // Analyze reading behavior
  if (totalBooks < 5) {
    insight += 'Bạn là người đọc sách một cách chọn lọc - chỉ chọn những cuốn thực sự phù hợp.';
  } else if (totalBooks < 20) {
    insight += 'Bạn là người đọc sách đều đặn và có thú vị riêng về sách.';
  } else {
    insight += 'Bạn là một độc giả đam mê! Bạn thường xuyên khám phá những cuốn sách mới.';
  }

  // Add rating insight
  if (avgRating >= 4.5) {
    insight += ' Bạn có tiêu chuẩn cao trong việc chọn sách.';
  } else if (avgRating >= 3.5) {
    insight += ' Bạn là người không khó tính và sẵn sàng nhận những cuốn sách hay dù lạ lẫm.';
  }

  return insight;
};

/**
 * Generate favorite genre insight
 */
const generateGenreInsight = (analytics) => {
  const fav1 = analytics.FAVORITE_CATEGORY_1;
  const fav1Count = analytics.FAVORITE_CATEGORY_1_COUNT || 0;
  const fav2 = analytics.FAVORITE_CATEGORY_2;
  const fav3 = analytics.FAVORITE_CATEGORY_3;

  if (!fav1) {
    return 'Bạn còn đang khám phá các thể loại sách khác nhau.';
  }

  let insight = `❤️ Bạn yêu thích thể loại "${fav1}"`;
  
  if (fav1Count > 5) {
    insight += ` (bạn đã đọc ${fav1Count} cuốn)`;
  }

  if (fav2) {
    insight += ` và "${fav2}"`;
  }

  if (fav3) {
    insight += `, "${fav3}"`;
  }

  insight += '.';

  return insight;
};

/**
 * Generate reading pace insight
 */
const generatePaceInsight = (analytics) => {
  const difficulty = analytics.PREFERRED_DIFFICULTY;

  if (!difficulty) {
    return '📖 Bạn sẵn sàng đọc sách ở mọi độ khó.';
  }

  if (difficulty === 'DỄ') {
    return '📖 Bạn thích những cuốn sách dễ đọc, nhẹ nhàng - hoàn hảo để thư giãn.';
  } else if (difficulty === 'TRUNG_BÌNH') {
    return '📖 Bạn thích những cuốn sách cân bằng - vừa học hỏi vừa dễ hiểu.';
  } else {
    return '📖 Bạn là người đọc có tư duy - thích những sách đòi hỏi sự tập trung.';
  }
};

/**
 * Generate activity pattern insight
 */
const generateActivityInsight = (analytics) => {
  const peakDay = analytics.PEAK_ACTIVITY_DAY;

  if (!peakDay) {
    return '🎯 Bạn thường hoạt động đều đặn hàng ngày.';
  }

  if (peakDay === 'WEEKEND') {
    return '🎯 Bạn thích mua sách vào cuối tuần - thời gian thư giãn!';
  } else if (peakDay === 'WEEKDAY') {
    return '🎯 Bạn là người luôn bận rộn nhưng vẫn dành thời gian cho sách!';
  } else {
    return `🎯 Bạn hoạt động nhiều vào ${peakDay}.`;
  }
};

/**
 * Generate peak time insight
 */
const generatePeakTimeInsight = (analytics) => {
  const peakHour = analytics.PEAK_ACTIVITY_HOUR;

  if (peakHour === null || peakHour === undefined) {
    return 'Bạn hoạt động vào những thời điểm khác nhau.';
  }

  let timeOfDay = 'sáng';
  if (peakHour >= 12 && peakHour < 18) {
    timeOfDay = 'chiều';
  } else if (peakHour >= 18) {
    timeOfDay = 'tối';
  }

  return `⏰ Bạn thường duyệt sách vào buổi ${timeOfDay}.`;
};

/**
 * Generate spending pattern insight
 */
const generateSpendingInsight = (analytics) => {
  const totalSpent = analytics.TOTAL_SPENT || 0;
  const totalBooks = analytics.TOTAL_BOOKS_PURCHASED || 1;
  const avgSpending = totalSpent / totalBooks;

  if (totalBooks === 0) {
    return '💰 Bạn chưa mua sách nào cả - bắt đầu hành trình của bạn ngay hôm nay!';
  }

  let insight = `💰 Bạn đã chi ${totalSpent.toLocaleString('vi-VN')}đ cho sách`;

  if (avgSpending < 100000) {
    insight += ' - bạn chọn những cuốn sách giá tốt.';
  } else if (avgSpending < 200000) {
    insight += ' - bạn sẵn sàng đầu tư vào sách chất lượng.';
  } else {
    insight += ' - bạn là người sẵn sàng chi tiền cho những cuốn sách hay.';
  }

  return insight;
};

/**
 * Generate all insights array
 */
const generateAllInsights = (analytics, insights) => {
  const allInsights = [];

  // Add all generated insights
  if (insights.readingStyleInsight) {
    allInsights.push({
      type: 'reading_style',
      text: insights.readingStyleInsight,
      emoji: '📚',
    });
  }

  if (insights.favoriteGenreInsight) {
    allInsights.push({
      type: 'favorite_genre',
      text: insights.favoriteGenreInsight,
      emoji: '❤️',
    });
  }

  if (insights.readingPaceInsight) {
    allInsights.push({
      type: 'reading_pace',
      text: insights.readingPaceInsight,
      emoji: '📖',
    });
  }

  if (insights.activityPatternInsight) {
    allInsights.push({
      type: 'activity_pattern',
      text: insights.activityPatternInsight,
      emoji: '🎯',
    });
  }

  if (insights.peakTimeInsight) {
    allInsights.push({
      type: 'peak_time',
      text: insights.peakTimeInsight,
      emoji: '⏰',
    });
  }

  if (insights.spendingPatternInsight) {
    allInsights.push({
      type: 'spending_pattern',
      text: insights.spendingPatternInsight,
      emoji: '💰',
    });
  }

  return allInsights;
};

/**
 * Calculate confidence score (0-1)
 * Higher score means more reliable insights
 */
const calculateConfidenceScore = (analytics) => {
  let score = 0;
  const maxPoints = 6;

  // Points for data availability
  if (analytics.TOTAL_BOOKS_PURCHASED > 0) score += 1;
  if (analytics.FAVORITE_CATEGORY_1) score += 1;
  if (analytics.PEAK_ACTIVITY_DAY) score += 1;
  if (analytics.PEAK_ACTIVITY_HOUR !== null) score += 1;
  if (analytics.AVERAGE_SESSION_DURATION_MINUTES) score += 1;
  if (analytics.REVIEW_COUNT > 0) score += 1;

  return Math.min(score / maxPoints, 1);
};

/**
 * Save insights to database
 */
const saveUserInsights = async (userId, insights, allInsights) => {
  try {
    const checkQuery = `
      SELECT INSIGHT_ID FROM USER_AI_INSIGHTS WHERE USER_ID = :userId
    `;
    const checkResult = await executeQuery(checkQuery, { userId });

    const insightJson = JSON.stringify(allInsights);
    const confidence = calculateConfidenceScore(await getUserAnalytics(userId));

    if (checkResult.rows?.length > 0) {
      // Update
      const updateQuery = `
        UPDATE USER_AI_INSIGHTS
        SET READING_STYLE = :readingStyle,
            FAVORITE_GENRE_INSIGHT = :genreInsight,
            READING_PACE_INSIGHT = :paceInsight,
            ACTIVITY_PATTERN = :activityInsight,
            PEAK_TIME_INSIGHT = :peakInsight,
            SPENDING_PATTERN = :spendingInsight,
            ALL_INSIGHTS = :allInsights,
            INSIGHT_CONFIDENCE = :confidence,
            GENERATED_AT = SYSDATE,
            NEXT_UPDATE = SYSDATE + 7
        WHERE USER_ID = :userId
      `;

      await executeUpdate(updateQuery, {
        userId,
        readingStyle: insights.readingStyleInsight,
        genreInsight: insights.favoriteGenreInsight,
        paceInsight: insights.readingPaceInsight,
        activityInsight: insights.activityPatternInsight,
        peakInsight: insights.peakTimeInsight,
        spendingInsight: insights.spendingPatternInsight,
        allInsights: insightJson,
        confidence,
      });
    } else {
      // Insert
      const insertQuery = `
        INSERT INTO USER_AI_INSIGHTS
        (INSIGHT_ID, USER_ID, READING_STYLE, FAVORITE_GENRE_INSIGHT,
         READING_PACE_INSIGHT, ACTIVITY_PATTERN, PEAK_TIME_INSIGHT,
         SPENDING_PATTERN, ALL_INSIGHTS, INSIGHT_CONFIDENCE,
         GENERATED_AT, NEXT_UPDATE)
        VALUES (user_insight_seq.NEXTVAL, :userId, :readingStyle,
                :genreInsight, :paceInsight, :activityInsight,
                :peakInsight, :spendingInsight, :allInsights,
                :confidence, SYSDATE, SYSDATE + 7)
      `;

      await executeUpdate(insertQuery, {
        userId,
        readingStyle: insights.readingStyleInsight,
        genreInsight: insights.favoriteGenreInsight,
        paceInsight: insights.readingPaceInsight,
        activityInsight: insights.activityPatternInsight,
        peakInsight: insights.peakTimeInsight,
        spendingInsight: insights.spendingPatternInsight,
        allInsights: insightJson,
        confidence,
      });
    }

    return true;
  } catch (error) {
    console.error('Error saving insights:', error);
    return false;
  }
};

/**
 * Get cached insights for user
 */
const getUserInsights = async (userId) => {
  try {
    const query = `
      SELECT * FROM USER_AI_INSIGHTS 
      WHERE USER_ID = :userId
    `;
    const result = await executeQuery(query, { userId });
    
    if (result.rows?.length > 0) {
      const row = result.rows[0];
      return {
        readingStyleInsight: row.READING_STYLE,
        favoriteGenreInsight: row.FAVORITE_GENRE_INSIGHT,
        readingPaceInsight: row.READING_PACE_INSIGHT,
        activityPatternInsight: row.ACTIVITY_PATTERN,
        peakTimeInsight: row.PEAK_TIME_INSIGHT,
        spendingPatternInsight: row.SPENDING_PATTERN,
        allInsights: row.ALL_INSIGHTS ? JSON.parse(row.ALL_INSIGHTS) : [],
        confidenceScore: row.INSIGHT_CONFIDENCE,
        generatedAt: row.GENERATED_AT,
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting insights:', error);
    return null;
  }
};

/**
 * Update user analytics from recent activity
 */
const updateUserAnalytics = async (userId) => {
  try {
    // Calculate stats from purchase and viewing history
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT CASE WHEN brh.INTERACTION_TYPE = 'VIEWED' THEN brh.MASP END) as viewed_count,
        COUNT(DISTINCT CASE WHEN brh.INTERACTION_TYPE = 'PURCHASED' THEN brh.MASP END) as purchased_count,
        COUNT(DISTINCT CASE WHEN brh.INTERACTION_TYPE = 'REVIEWED' THEN brh.MASP END) as reviewed_count,
        SUM(CASE WHEN brh.INTERACTION_TYPE = 'PURCHASED' THEN sp.GIABAN ELSE 0 END) as total_spent,
        bm.CATEGORY_PRIMARY,
        COUNT(*) as category_count
      FROM BOOK_READING_HISTORY brh
      LEFT JOIN SANPHAM sp ON brh.MASP = sp.MASP
      LEFT JOIN BOOK_METADATA bm ON brh.MASP = bm.MASP
      WHERE brh.USER_ID = :userId
      GROUP BY bm.CATEGORY_PRIMARY
      ORDER BY category_count DESC
    `;

    const statsResult = await executeQuery(statsQuery, { userId });

    if (statsResult.rows && statsResult.rows.length > 0) {
      const stats = statsResult.rows[0];
      const categories = statsResult.rows;

      // Get or create analytics record
      const checkQuery = `
        SELECT ANALYTIC_ID FROM USER_READING_ANALYTICS WHERE USER_ID = :userId
      `;
      const checkResult = await executeQuery(checkQuery, { userId });

      const updateQuery = `
        UPDATE USER_READING_ANALYTICS
        SET TOTAL_BOOKS_VIEWED = :viewedCount,
            TOTAL_BOOKS_PURCHASED = :purchasedCount,
            TOTAL_BOOKS_REVIEWED = :reviewedCount,
            TOTAL_SPENT = :totalSpent,
            FAVORITE_CATEGORY_1 = :fav1,
            FAVORITE_CATEGORY_1_COUNT = :fav1Count,
            FAVORITE_CATEGORY_2 = :fav2,
            FAVORITE_CATEGORY_3 = :fav3,
            UPDATED_AT = SYSDATE
        WHERE USER_ID = :userId
      `;

      await executeUpdate(updateQuery, {
        userId,
        viewedCount: stats.VIEWED_COUNT || 0,
        purchasedCount: stats.PURCHASED_COUNT || 0,
        reviewedCount: stats.REVIEWED_COUNT || 0,
        totalSpent: stats.TOTAL_SPENT || 0,
        fav1: categories[0]?.CATEGORY_PRIMARY,
        fav1Count: categories[0]?.CATEGORY_COUNT || 0,
        fav2: categories[1]?.CATEGORY_PRIMARY,
        fav3: categories[2]?.CATEGORY_PRIMARY,
      });
    }

    return true;
  } catch (error) {
    console.error('Error updating analytics:', error);
    return false;
  }
};

module.exports = {
  generateUserInsights,
  getUserInsights,
  getUserAnalytics,
  updateUserAnalytics,
};
