'use strict';

/**
 * Chatbot AI Logic Utilities
 * Handles intent detection, response generation, and learning
 */

// ==================== INTENT DETECTION ====================
// Keyword patterns for different intents
const intentPatterns = {
  PAYMENT: {
    keywords: ['thanh toán', 'payment', 'card', 'thẻ', 'chuyển khoản', 'tiền'],
    regex: /thanh toán|payment|card|thẻ|chuyển khoản|tiền/i,
  },
  SHIPPING: {
    keywords: ['vận chuyển', 'ship', 'giao hàng', 'delivery', 'đơn hàng', 'track'],
    regex: /vận chuyển|ship|giao hàng|delivery|đơn hàng|track|tracking/i,
  },
  PRODUCT_SUGGESTION: {
    keywords: ['gợi ý', 'suggest', 'recommend', 'sách nào', 'sách gì', 'muốn mua'],
    regex: /gợi ý|suggest|recommend|sách nào|sách gì|muốn mua|tìm sách/i,
  },
  ORDER_STATUS: {
    keywords: ['đơn hàng', 'order', 'status', 'trạng thái', 'tình trạng'],
    regex: /đơn hàng|order|status|trạng thái|tình trạng|mã đơn/i,
  },
  REFUND: {
    keywords: ['hoàn', 'refund', 'return', 'trả hàng', 'hủy'],
    regex: /hoàn|refund|return|trả hàng|hủy|cancel/i,
  },
  ACCOUNT: {
    keywords: ['tài khoản', 'account', 'profile', 'login', 'đăng nhập'],
    regex: /tài khoản|account|profile|login|đăng nhập|quên|forgot/i,
  },
  FAQ: {
    keywords: ['giúp', 'help', 'cách', 'làm sao', 'hỏi'],
    regex: /giúp|help|cách|làm sao|hỏi|support/i,
  },
};

/**
 * Detect user intent from message
 * @param {string} message - User message
 * @returns {object} - { intent, confidence }
 */
const detectIntent = (message) => {
  if (!message || typeof message !== 'string') {
    return { intent: 'UNKNOWN', confidence: 0 };
  }

  const lowercaseMsg = message.toLowerCase();
  let bestMatch = { intent: 'UNKNOWN', confidence: 0 };

  for (const [intent, pattern] of Object.entries(intentPatterns)) {
    if (pattern.regex.test(lowercaseMsg)) {
      // Calculate confidence based on keyword matches
      const matches = pattern.keywords.filter((kw) => lowercaseMsg.includes(kw));
      const confidence = Math.min(0.5 + matches.length * 0.1, 1.0);

      if (confidence > bestMatch.confidence) {
        bestMatch = { intent, confidence };
      }
    }
  }

  return bestMatch;
};

// ==================== RESPONSE TEMPLATES ====================
const responseTemplates = {
  GREETING: (name) =>
    `Xin chào${name ? ' ' + name : ''}! 👋\n\nMình có thể giúp gì cho bạn?\n\n- 📚 Gợi ý sách\n- 💳 Hỗ trợ thanh toán\n- 📦 Theo dõi đơn hàng\n- ❓ Câu hỏi thường gặp`,

  PAYMENT_HELP:
    'Chúng tôi hỗ trợ 2 phương thức thanh toán:\n\n1️⃣ **COD** - Thanh toán khi nhận hàng (0đ phí)\n2️⃣ **Chuyển khoản** - Chuyển trước, giao sau\n\nBạn muốn thanh toán bằng cách nào?',

  SHIPPING_HELP:
    '📍 **Thông tin vận chuyển:**\n\n⏱️ Thời gian giao hàng:\n- Hà Nội/TP.HCM: 2-3 ngày\n- Tỉnh thành khác: 3-5 ngày\n\n💰 Phí vận chuyển:\n- Miễn phí từ 200.000đ\n- Dưới 200.000đ: 20.000đ\n\nCần trợ giúp thêm không?',

  REFUND_HELP:
    '🔄 **Chính sách hoàn hàng:**\n\n⏰ Thời hạn: 7 ngày kể từ khi nhận hàng\n✅ Điều kiện:\n- Sách chưa sử dụng\n- Nguyên vẹn, còn nguyên seal\n- Có hóa đơn/hoá đơn điện tử\n\n📞 Liên hệ Admin: support@webbansach.com',

  ORDER_TRACKING:
    'Để theo dõi đơn hàng, vui lòng cung cấp:\n\n📌 Mã đơn hàng (Order ID)\n\nBạn có mã đơn không?',

  PRODUCT_RECOMMEND: (categories) =>
    `Bạn quan tâm đến sách nào? 📚\n\nCác thể loại phổ biến:\n${categories.map((c, i) => `${i + 1}️⃣ ${c}`).join('\n')}`,

  NOT_FOUND:
    'Xin lỗi, mình không hiểu rõ ý của bạn. 😅\n\nVui lòng thử lại hoặc liên hệ Admin: support@webbansach.com',
};

// ==================== RESPONSE GENERATION ====================
/**
 * Generate response based on user message
 * @param {string} message - User message
 * @param {object} userData - User data { id, name, preferences, history }
 * @returns {object} - { response, intent, confidence }
 */
const generateResponse = (message, userData = {}) => {
  // Detect intent
  const { intent, confidence } = detectIntent(message);

  let response = '';

  // Check for greeting
  if (message.toLowerCase().includes('xin chào') || message.toLowerCase().includes('hello')) {
    response = responseTemplates.GREETING(userData.name);
  }
  // Handle intents
  else if (intent === 'PAYMENT') {
    response = responseTemplates.PAYMENT_HELP;
  } else if (intent === 'SHIPPING') {
    response = responseTemplates.SHIPPING_HELP;
  } else if (intent === 'REFUND') {
    response = responseTemplates.REFUND_HELP;
  } else if (intent === 'ORDER_STATUS') {
    response = responseTemplates.ORDER_TRACKING;
  } else if (intent === 'PRODUCT_SUGGESTION') {
    const defaultCategories = ['Lập trình', 'Tiểu thuyết', 'Tâm lý học', 'Kinh doanh', 'Kỹ năng sống'];
    const userCategories = userData.preferences?.categories || defaultCategories;
    response = responseTemplates.PRODUCT_RECOMMEND(userCategories);
  } else {
    response = responseTemplates.NOT_FOUND;
  }

  return {
    response,
    intent,
    confidence,
    timestamp: new Date(),
  };
};

// ==================== LEARNING MECHANISM ====================
/**
 * Extract keywords from message for learning
 * @param {string} message - User message
 * @returns {array} - Keywords
 */
const extractKeywords = (message) => {
  const stopWords = [
    'là',
    'của',
    'cái',
    'cái',
    'bao',
    'vậy',
    'được',
    'không',
    'có',
    'cái',
    'để',
    'với',
  ];

  return message
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.includes(word));
};

/**
 * Record user feedback for learning
 * @param {number} messageId - Message ID
 * @param {number} helpful - 1 for helpful, -1 for not helpful
 * @returns {object}
 */
const recordFeedback = async (messageId, helpful, db) => {
  try {
    const query = `
      UPDATE CHATBOT_MESSAGES 
      SET IS_HELPFUL = :helpful,
          UPDATED_AT = SYSDATE
      WHERE MESSAGE_ID = :messageId
    `;

    await db.executeUpdate(query, { messageId, helpful });

    return { success: true, message: 'Feedback recorded' };
  } catch (error) {
    console.error('Error recording feedback:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Calculate user preferences from interaction history
 * @param {array} messages - Array of messages
 * @returns {object} - { categories, topProducts, avgPrice }
 */
const calculateUserPreferences = (messages = []) => {
  const preferences = {
    categories: [],
    topProducts: [],
    avgPrice: 0,
    interactionCount: messages.length,
  };

  // Extract categories mentioned in bot responses
  const categoryMentions = {};
  messages.forEach((msg) => {
    if (msg.intent === 'PRODUCT_SUGGESTION') {
      // Parse categories from content if needed
    }
  });

  return preferences;
};

// ==================== PERSONALIZATION ====================
/**
 * Personalize response based on user history
 * @param {object} userData - User data
 * @param {string} intent - Intent
 * @returns {string} - Personalized greeting
 */
const personalizeResponse = (userData, intent) => {
  if (!userData || !userData.name) return '';

  const { preferences = {} } = userData;
  const { categoryInterest } = preferences;

  let personalization = '';

  if (categoryInterest) {
    if (intent === 'PRODUCT_SUGGESTION') {
      personalization =
        `\n\n💡 Dựa trên lịch sử của bạn, mình thấy bạn quan tâm đến sách ${categoryInterest}. ` +
        `Có muốn xem những cuốn mới trong thể loại này không?`;
    }
  }

  return personalization;
};

module.exports = {
  detectIntent,
  generateResponse,
  extractKeywords,
  recordFeedback,
  calculateUserPreferences,
  personalizeResponse,
  responseTemplates,
};
