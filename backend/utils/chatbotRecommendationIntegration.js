'use strict';

/**
 * Chatbot-Recommendation Integration
 * Bridges chatbot intent detection with smart book recommendations
 */

const bookRecommendationEngine = require('./bookRecommendationEngine');
const { executeQuery } = require('../config/db');

/**
 * Handle book recommendation intent
 * Called when chatbot detects user is asking for book suggestions
 */
const handleRecommendationRequest = async (userId, message, context = {}) => {
  try {
    // Extract recommendation context from message
    const recommendationContext = parseRecommendationRequest(message);

    // Get personalized recommendations
    let recommendations = [];

    if (recommendationContext.specificQuery) {
      // User asking for specific type (e.g., "sách về kinh doanh")
      recommendations = await getRecommendationsByQuery(
        userId,
        recommendationContext.specificQuery,
        context
      );
    } else {
      // General personalized recommendations
      recommendations = await bookRecommendationEngine.generatePersonalizedRecommendations(
        userId,
        5
      );
    }

    // Format recommendations for chatbot response
    const formattedRecs = formatRecommendationsForChat(recommendations);

    return {
      type: 'RECOMMENDATION',
      recommendations,
      formattedResponse: buildRecommendationMessage(
        formattedRecs,
        userId,
        recommendationContext
      ),
      metadata: {
        count: recommendations.length,
        context: recommendationContext,
      },
    };
  } catch (error) {
    console.error('Error handling recommendation request:', error);
    return {
      type: 'ERROR',
      formattedResponse: 'Xin lỗi, tôi không thể tìm kiếm sách phù hợp lúc này. Vui lòng thử lại sau.',
    };
  }
};

/**
 * Parse user message to extract recommendation context
 */
const parseRecommendationRequest = (message) => {
  const categories = [
    'kinh doanh', 'kĩ năng', 'công nghệ', 'self-help', 'tiểu thuyết',
    'tâm lý', 'giáo dục', 'lịch sử', 'khoa học', 'tự truyện',
    'phát triển bản thân', 'quản lý', 'marketing', 'lập trình'
  ];

  const difficulties = ['dễ', 'trung bình', 'nâng cao', 'cho người mới'];
  
  const lowerMessage = message.toLowerCase();
  
  let foundCategory = null;
  for (const cat of categories) {
    if (lowerMessage.includes(cat)) {
      foundCategory = cat;
      break;
    }
  }

  let foundDifficulty = null;
  for (const diff of difficulties) {
    if (lowerMessage.includes(diff)) {
      foundDifficulty = diff;
      break;
    }
  }

  return {
    specificQuery: foundCategory || null,
    difficulty: foundDifficulty || null,
    isForLearning: lowerMessage.includes('học') || lowerMessage.includes('phát triển'),
    isForEntertainment: lowerMessage.includes('giải trí') || lowerMessage.includes('thư giãn'),
  };
};

/**
 * Get recommendations by specific query
 */
const getRecommendationsByQuery = async (userId, query, context = {}) => {
  try {
    const limit = context.limit || 5;
    
    const sqlQuery = `
      SELECT bm.MASP, bm.TENSP, bm.GIABAN, bm.HINHANH, bm.AVERAGE_RATING,
             bm.CATEGORY_PRIMARY, bm.READING_DIFFICULTY, bm.AUTHOR_NAME
      FROM BOOK_METADATA bm
      JOIN SANPHAM sp ON bm.MASP = sp.MASP
      WHERE LOWER(bm.CATEGORY_PRIMARY) LIKE LOWER(:query)
        OR LOWER(bm.TOPICS) LIKE LOWER(:query)
        OR LOWER(bm.KEYWORDS) LIKE LOWER(:query)
      AND bm.MASP NOT IN (
        SELECT MASP FROM BOOK_READING_HISTORY 
        WHERE USER_ID = :userId
      )
      ORDER BY bm.AVERAGE_RATING DESC, bm.REVIEW_COUNT DESC
      FETCH FIRST :limit ROWS ONLY
    `;

    const result = await executeQuery(sqlQuery, {
      query: '%' + query + '%',
      userId,
      limit,
    });

    return result.rows?.map((row, idx) => ({
      masp: row.MASP,
      tensp: row.TENSP,
      giaban: row.GIABAN,
      hinhanh: row.HINHANH,
      rating: row.AVERAGE_RATING,
      category: row.CATEGORY_PRIMARY,
      difficulty: row.READING_DIFFICULTY,
      author: row.AUTHOR_NAME,
      type: 'QUERY_MATCH',
      rank: idx + 1,
    })) || [];
  } catch (error) {
    console.error('Error getting recommendations by query:', error);
    return [];
  }
};

/**
 * Format recommendations for display in chat
 */
const formatRecommendationsForChat = (recommendations) => {
  return recommendations.map((rec, idx) => ({
    rank: idx + 1,
    masp: rec.masp,
    title: rec.tensp,
    price: rec.giaban,
    image: rec.hinhanh,
    rating: rec.rating,
    author: rec.author || 'Unknown',
    difficulty: rec.difficulty || 'Trung bình',
    reason: rec.reason || 'Được đề xuất cho bạn',
  }));
};

/**
 * Build recommendation message for chatbot
 */
const buildRecommendationMessage = (formattedRecs, userId, context) => {
  if (formattedRecs.length === 0) {
    return 'Xin lỗi, tôi không tìm thấy sách phù hợp với yêu cầu của bạn. Bạn có thể cho tôi biết thêm chi tiết?';
  }

  let message = '🎯 Dựa trên sở thích của bạn, mình đề xuất những cuốn sách này:\n\n';

  formattedRecs.slice(0, 3).forEach((rec, idx) => {
    message += `${idx + 1}. **${rec.title}**\n`;
    message += `   📖 Tác giả: ${rec.author}\n`;
    message += `   💰 Giá: ${rec.price.toLocaleString('vi-VN')}đ\n`;
    message += `   ⭐ Đánh giá: ${rec.rating || 'Chưa có'}/5\n`;
    message += `   📚 Độ khó: ${rec.difficulty}\n`;
    message += `   💡 ${rec.reason}\n\n`;
  });

  message += '👉 Bạn có thích cuốn nào không? Hoặc muốn tôi gợi ý thêm?';

  return message;
};

/**
 * Track book interaction from chatbot
 * Called when user clicks on a recommendation or searches for a book
 */
const trackChatbotInteraction = async (userId, masp, interactionType) => {
  try {
    await bookRecommendationEngine.recordReadingHistory(
      userId,
      masp,
      interactionType,
      { source: 'chatbot' }
    );
    return true;
  } catch (error) {
    console.error('Error tracking interaction:', error);
    return false;
  }
};

/**
 * Get smart suggestion for current conversation state
 * AI-powered contextual suggestion based on conversation flow
 */
const getSuggestionByContext = async (userId, conversationHistory = []) => {
  try {
    // Analyze conversation history
    const lastMessages = conversationHistory.slice(-5);
    const messageText = lastMessages.map(m => m.content).join(' ').toLowerCase();

    // Determine if user is asking for help
    const isAskingForHelp = /giúp|gợi ý|recommend|tìm|muốn|cần|sách.*nào/i.test(messageText);
    
    if (!isAskingForHelp) {
      return null;
    }

    // Get recommendations
    const recs = await bookRecommendationEngine.generatePersonalizedRecommendations(userId, 3);
    
    return {
      suggestions: recs,
      message: '👉 Có thể bạn quan tâm đến những cuốn sách này?',
    };
  } catch (error) {
    console.error('Error getting context suggestion:', error);
    return null;
  }
};

module.exports = {
  handleRecommendationRequest,
  parseRecommendationRequest,
  getRecommendationsByQuery,
  formatRecommendationsForChat,
  buildRecommendationMessage,
  trackChatbotInteraction,
  getSuggestionByContext,
};
