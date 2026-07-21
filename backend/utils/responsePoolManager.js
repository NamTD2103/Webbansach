'use strict';

/**
 * Response Pool Manager
 * Handles selection of best response variant based on context
 */

/**
 * Calculate selection score for each response variant
 * Higher score = better match for current context
 */
const calculateResponseScore = (response, context) => {
  let score = response.AVERAGE_RATING || 0.5; // Base score from rating
  
  // Bonus for context match
  if (response.CONTEXT_TAGS) {
    const responseTags = response.CONTEXT_TAGS.split(',').map(t => t.trim());
    const contextFlags = context.contextFlags || [];
    
    const matchedTags = responseTags.filter(tag => contextFlags.includes(tag));
    score += matchedTags.length * 0.1; // +0.1 for each matched tag
  }

  // Bonus for confidence threshold
  if (context.confidence >= response.MIN_CONFIDENCE) {
    score += 0.1;
  }

  // Penalize if rarely used and low rated
  if (response.USAGE_COUNT < 10 && response.AVERAGE_RATING < 0.6) {
    score -= 0.2;
  }

  // Bonus for good conversion
  if (response.CONVERSION_COUNT > 0) {
    const conversionRate = response.CONVERSION_COUNT / response.USAGE_COUNT;
    score += conversionRate * 0.2;
  }

  // Penalty for overused responses to avoid repetition
  if (context.recentResponseTypes && context.recentResponseTypes.includes(response.RESPONSE_TYPE)) {
    score -= 0.15;
  }

  return Math.max(0, Math.min(1, score)); // Normalize to 0-1
};

/**
 * Select best response from pool based on context
 * @param {array} responsePool - Array of responses from database
 * @param {object} context - Current context
 * @returns {object} - Selected response and reason
 */
const selectBestResponse = (responsePool, context) => {
  if (!responsePool || responsePool.length === 0) {
    return {
      response: null,
      reason: 'NO_RESPONSE_AVAILABLE',
      score: 0,
    };
  }

  // Filter by active status
  let activeResponses = responsePool.filter(r => r.IS_ACTIVE === 1);
  
  if (activeResponses.length === 0) {
    activeResponses = responsePool;
  }

  // Calculate scores for all responses
  const scoredResponses = activeResponses.map(response => ({
    ...response,
    selectionScore: calculateResponseScore(response, context),
  }));

  // Sort by score (descending)
  scoredResponses.sort((a, b) => b.selectionScore - a.selectionScore);

  const selectedResponse = scoredResponses[0];
  
  let reason = 'BEST_MATCH';
  
  // Determine selection reason
  if (context.isFirstTime) {
    if (selectedResponse.RESPONSE_TYPE === 'PERSONALIZED') {
      reason = 'NEW_USER_PERSONALIZED';
    } else if (selectedResponse.RESPONSE_TYPE === 'SHORT') {
      reason = 'NEW_USER_SHORT';
    }
  } else if (context.userUrgency === 'HIGH') {
    if (selectedResponse.RESPONSE_TYPE === 'SHORT') {
      reason = 'URGENT_SHORT_RESPONSE';
    }
  } else if (context.userPersonality === 'ANALYTICAL') {
    if (selectedResponse.RESPONSE_TYPE === 'DETAILED') {
      reason = 'ANALYTICAL_DETAILED_RESPONSE';
    }
  }

  return {
    response: selectedResponse,
    reason,
    score: selectedResponse.selectionScore,
    alternatives: scoredResponses.slice(1, 3), // Top 2 alternatives
  };
};

/**
 * Prepare context flags for response selection
 * @param {object} userProfile - User profile from database
 * @param {object} conversationContext - Conversation context
 * @returns {object} - Prepared context
 */
const prepareSelectionContext = (userProfile, conversationContext, recentMessages) => {
  const context = {
    confidence: 0.5,
    contextFlags: [],
    recentResponseTypes: [],
  };

  // User profile flags
  if (userProfile) {
    context.isFirstTime = userProfile.INTERACTION_COUNT <= 1;
    context.isVIP = userProfile.IS_VIP === 1;
    context.userPersonality = userProfile.USER_PERSONALITY || 'CONVERSATIONAL';
    context.preferredResponseType = userProfile.PREFERRED_RESPONSE_TYPE || 'CONVERSATIONAL';
    context.budgetType = userProfile.BUDGET_TYPE || 'REGULAR';
    context.purchaseFrequency = userProfile.PURCHASE_FREQUENCY || 'OCCASIONAL';

    // Add context flags
    if (context.isFirstTime) context.contextFlags.push('first_time');
    if (context.isVIP) context.contextFlags.push('vip');
    if (userProfile.CHURN_RISK > 0.7) context.contextFlags.push('high_churn_risk');
  }

  // Conversation context flags
  if (conversationContext) {
    context.userUrgency = conversationContext.USER_URGENCY || 'MEDIUM';
    context.deviceType = conversationContext.DEVICE_TYPE || 'DESKTOP';
    context.entryPoint = conversationContext.ENTRY_POINT;
    context.interactionPhase = conversationContext.INTERACTION_PHASE;

    // Add flags
    if (context.deviceType === 'MOBILE') context.contextFlags.push('mobile');
    if (context.userUrgency === 'HIGH') context.contextFlags.push('busy');
    if (context.interactionPhase === 'CHECKOUT') context.contextFlags.push('checkout_phase');

    if (context.userUrgency === 'HIGH') {
      context.contextFlags.push('urgent');
    }
  }

  // Recent response types (to avoid repetition)
  if (recentMessages && recentMessages.length > 0) {
    context.recentResponseTypes = recentMessages
      .filter(m => m.RESPONSE_TYPE)
      .slice(-3) // Last 3 messages
      .map(m => m.RESPONSE_TYPE);
  }

  return context;
};

/**
 * Extract response variants and templates
 * @param {string} template - Template with placeholders
 * @param {object} userData - User data for personalization
 * @returns {string} - Rendered response
 */
const renderResponse = (template, userData = {}) => {
  let rendered = template;

  // Replace placeholders
  const placeholders = {
    '{name}': userData.name || 'bạn',
    '{first_name}': (userData.name || '').split(' ')[0] || 'bạn',
    '{category}': userData.preferredCategory || 'sách',
    '{price_range}': userData.priceRange || 'giá phù hợp',
    '{loyalty_status}': userData.loyaltyStatus || 'khách hàng',
  };

  for (const [placeholder, value] of Object.entries(placeholders)) {
    rendered = rendered.replaceAll(placeholder, value);
  }

  return rendered;
};

/**
 * Log response selection for analytics
 * @param {object} selectionData - Data about the selection
 * @returns {object} - Formatted log entry
 */
const createSelectionLog = (selectionData) => {
  return {
    messageId: selectionData.messageId,
    poolId: selectionData.poolId,
    responseType: selectionData.responseType,
    selectionReason: selectionData.reason,
    contextFlags: JSON.stringify(selectionData.contextFlags),
    userSentimentBefore: selectionData.sentimentBefore,
    userSentimentAfter: selectionData.sentimentAfter,
    wasHelpful: selectionData.wasHelpful || 0,
    conversionResult: selectionData.conversionResult || 0,
  };
};

/**
 * Update response stats based on feedback
 * @param {object} stats - Stats to update
 * @returns {object} - Updated stats
 */
const updateResponseStats = (stats) => {
  const {
    poolId,
    wasHelpful,
    conversionResult,
    currentUsageCount,
    currentRating,
    currentConversionCount,
  } = stats;

  // Recalculate average rating using exponential moving average
  const alpha = 0.3; // Weight for new data
  let newRating = currentRating;

  if (wasHelpful !== 0) {
    // Convert helpful (-1, 0, 1) to rating (0, 0.5, 1)
    const newFeedback = (wasHelpful + 1) / 2;
    newRating = currentRating * (1 - alpha) + newFeedback * alpha;
  }

  return {
    poolId,
    usageCount: currentUsageCount + 1,
    averageRating: Math.round(newRating * 100) / 100,
    conversionCount: currentConversionCount + (conversionResult ? 1 : 0),
  };
};

module.exports = {
  calculateResponseScore,
  selectBestResponse,
  prepareSelectionContext,
  renderResponse,
  createSelectionLog,
  updateResponseStats,
};
