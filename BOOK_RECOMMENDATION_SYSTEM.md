# 📚 Book Recommendation System - Complete Implementation Guide

## 🎯 Overview

This document covers the complete integration of an AI-powered book recommendation system with your existing chatbot and e-commerce platform.

**System Architecture:**
```
User Interaction (Chat, Product Page, Cart)
    ↓
Interaction Tracking (recordReadingHistory)
    ↓
User Preferences Learning (updatePreferencesFromHistory)
    ↓
Recommendation Engine (generatePersonalizedRecommendations)
    ↓
Smart Display (ChatBotRecommendationIntegration, React Components)
    ↓
Feedback Collection & Learning (recordRecommendationFeedback)
```

---

## 📊 DATABASE SETUP

### 1. Create Recommendation Schema

Run the migration script to create all recommendation tables:

```bash
# From backend directory
sqlplus system/password@localhost:1521/orcl21pdb1 < database/book-recommendation-schema.sql
```

**Tables Created:**
- `BOOK_METADATA` - Enhanced product metadata (category, difficulty, topics)
- `USER_BOOK_PREFERENCES` - User preference storage
- `BOOK_READING_HISTORY` - User interaction tracking
- `BOOK_RECOMMENDATIONS` - Generated recommendations
- `RECOMMENDATION_FEEDBACK` - Feedback on recommendations
- `SIMILAR_BOOKS` - Pre-computed book similarities
- `RECOMMENDATION_ANALYTICS` - System performance metrics

### 2. Seed Book Metadata (One-time)

```sql
-- Example: Insert book metadata for existing products
INSERT INTO BOOK_METADATA (
  METADATA_ID, MASP, CATEGORY_PRIMARY, READING_DIFFICULTY, 
  AUTHOR_NAME, TOPICS, AVERAGE_RATING
)
SELECT 
  book_metadata_seq.NEXTVAL, MASP, 'Kinh doanh', 'TRUNG_BÌNH',
  'James Clear', '["productivity", "habits", "personal-growth"]', 4.5
FROM SANPHAM
WHERE TENSP LIKE '%Atomic Habits%';
```

---

## 🔧 BACKEND SETUP

### 1. API Endpoints Reference

```
GET    /api/recommendations/:userId
       → Get personalized recommendations (default: 5 books)

GET    /api/recommendations/:userId/preferences
       → Get user's book preferences

PUT    /api/recommendations/:userId/preferences
       → Update user preferences

POST   /api/recommendations/:userId/track-interaction
       → Track user actions (view, search, purchase)

GET    /api/recommendations/:userId/history
       → Get user's interaction history

POST   /api/recommendations/:userId/feedback
       → Submit feedback on recommendations

GET    /api/recommendations/trending
       → Get trending/popular books

GET    /api/recommendations/:userId/similar/:masp
       → Get books similar to a specific book
```

### 2. Integration with Chatbot

The chatbot now detects book recommendation intents and calls the recommendation engine:

**In `/backend/routes/chatbot-enhanced.js`**, add:

```javascript
const { handleRecommendationRequest } = require('../utils/chatbotRecommendationIntegration');

// Detect when user asks for book recommendations
if (intent === 'PRODUCT_SUGGESTION' || intent === 'BOOK_RECOMMENDATION') {
  const recResult = await handleRecommendationRequest(userId, message, {
    limit: 5
  });
  
  response = recResult.formattedResponse;
  metadata = recResult.metadata;
}
```

### 3. Key Backend Utilities

**`bookRecommendationEngine.js`**
- `generatePersonalizedRecommendations(userId, limit)` - Main recommendation algorithm
- `recordReadingHistory(userId, masp, interactionType)` - Track interactions
- `getUserBookPreferences(userId)` - Get user preferences
- `recordRecommendationFeedback(recId, userId, feedbackType)` - Collect feedback

**`chatbotRecommendationIntegration.js`**
- `handleRecommendationRequest(userId, message)` - Bridge chatbot to recommendations
- `parseRecommendationRequest(message)` - Extract recommendation context from user message
- `trackChatbotInteraction(userId, masp, type)` - Track interactions from chatbot
- `getSuggestionByContext(userId, history)` - AI-powered contextual suggestions

---

## 🎨 FRONTEND SETUP

### 1. Install Component

Place `BookRecommendation.tsx` in `/components/` folder.

### 2. Display in Chat Widget

Add to your ChatBot component:

```typescript
import { BookRecommendationWidget } from '@/components/BookRecommendation';

export const ChatBotClient = ({ userId }) => {
  return (
    <div>
      {/* Existing chat UI */}
      <ChatContainer />
      
      {/* Add recommendation widget */}
      {userId && (
        <BookRecommendationWidget 
          userId={userId}
          onSelectBook={(book) => {
            // Navigate to product page or add to cart
            window.location.href = `/product/${book.masp}`;
          }}
        />
      )}
    </div>
  );
};
```

### 3. Add Preference Settings

Create a preferences modal for users:

```typescript
import { RecommendationPreferences } from '@/components/BookRecommendation';

export const ProfileSettings = ({ userId }) => {
  const [showPreferences, setShowPreferences] = useState(false);

  return (
    <div>
      <button onClick={() => setShowPreferences(true)}>
        ⚙️ Sở thích đọc sách
      </button>
      
      {showPreferences && (
        <Modal>
          <RecommendationPreferences 
            userId={userId}
            onSave={() => setShowPreferences(false)}
          />
        </Modal>
      )}
    </div>
  );
};
```

### 4. Track Product Page Views

When user views a product, track it:

```typescript
// In /app/product/[id]/page.tsx
useEffect(() => {
  if (userId) {
    axios.post(`/api/recommendations/${userId}/track-interaction`, {
      masp: productId,
      interactionType: 'VIEWED',
      additionalData: { viewDuration: Date.now() - startTime }
    });
  }
}, [productId, userId]);
```

---

## 🚀 RECOMMENDATION STRATEGIES

The system uses multiple strategies:

### 1. **Similar Books** (Highest Priority)
- User has viewed/purchased Book A
- System finds books similar to A using collaborative filtering
- Displays as: "Sách tương tự với những cuốn bạn thích"

### 2. **Category Matching** (Second Priority)
- User prefers "Kinh doanh" and "Self-help"
- System finds top-rated books in those categories
- Filters out books user has already interacted with

### 3. **Trending/Popular** (Fallback)
- If not enough recommendations from above
- Shows bestselling books or trending titles
- "Sách đang được quan tâm nhiều"

### 4. **Query-Based** (When user searches)
- User asks: "Sách về lập trình cho người mới"
- System extracts: category="lập trình", difficulty="DỄ"
- Returns matching books

---

## 📚 HOW LEARNING WORKS

### User Preference Learning Flow:

```
1. User VIEWS book
   → +1 weight to category
   
2. User ADDS to CART
   → +2 weight to category
   
3. User PURCHASES book
   → +3 weight to category
   → Record purchase in profile
   
4. User REVIEWS book
   → Update personal rating
   → Strong signal for learning
   
5. System RECORDS FEEDBACK
   → "HELPFUL" → Boost similar recommendations
   → "NOT_HELPFUL" → Reduce similar recommendations
```

The system automatically adjusts recommendations based on:
- Reading history
- Purchase behavior
- Explicit feedback (👍/👎)
- Category frequency
- Interaction patterns

---

## 🎯 CHATBOT INTEGRATION EXAMPLES

### Example 1: User Asks for Recommendations

**User:** "Bạn có thể gợi ý sách về kinh doanh cho tôi không?"

**Chatbot Flow:**
1. Detects intent: `PRODUCT_SUGGESTION`
2. Calls `handleRecommendationRequest(userId, message)`
3. Parses: category = "kinh doanh"
4. Generates recommendations matching category
5. Returns formatted response with books

**Response:**
```
🎯 Dựa trên sở thích của bạn, mình đề xuất những cuốn sách này:

1. Atomic Habits - James Clear
   📖 Tác giả: James Clear
   💰 Giá: 120,000₫
   ⭐ Đánh giá: 4.5/5
   📚 Độ khó: Trung bình
   💡 Phù hợp với thể loại bạn yêu thích

2. Deep Work - Cal Newport
   [...]
```

### Example 2: User Views Product

**User:** Visits product page of "Atomic Habits"

**Tracking Flow:**
1. Frontend calls: `POST /api/recommendations/:userId/track-interaction`
2. Backend records: VIEWED interaction
3. Updates user preferences: +1 weight to "Self-help"
4. Next recommendations consider this preference

### Example 3: User Gives Feedback

**User:** Clicks 👎 on a recommendation

**Feedback Flow:**
1. Frontend calls: `POST /api/recommendations/:userId/feedback`
2. Backend records feedback type: "NOT_HELPFUL"
3. Calls `learnFromFeedback()`
4. Adjusts future recommendations
5. Next time won't suggest similar books

---

## ⚙️ CONFIGURATION & CUSTOMIZATION

### Adjust Recommendation Weights

Edit `backend/utils/bookRecommendationEngine.js`:

```javascript
// Change how much each interaction influences preferences
const incrementCategoryWeight = (categories, categoryName, weight) => {
  // Modify these weights:
  // VIEWED: +1
  // ADDED_CART: +2
  // PURCHASED: +3
  // REVIEWED: +5 (you can add this)
};
```

### Change Recommendation Count

```javascript
// Get more/fewer recommendations
const recs = await generatePersonalizedRecommendations(userId, 10); // Default: 5
```

### Adjust Similarity Threshold

```sql
-- In recommendationEngine.js, change similarity score minimum:
AND sb.SIMILARITY_SCORE >= 0.6  -- Increase for stricter matching
```

### Customize Response Messages

Edit `backend/utils/chatbotRecommendationIntegration.js`:

```javascript
const buildRecommendationMessage = (formattedRecs, userId, context) => {
  // Customize messages:
  message += '🎯 Dựa trên sở thích của bạn, mình đề xuất những cuốn sách này:\n\n';
  // Change emoji, wording, structure
};
```

---

## 📊 MONITORING & ANALYTICS

### Track Recommendation Performance

Access analytics via:

```bash
GET /api/recommendations/analytics/dashboard?fromDate=2024-04-01&toDate=2024-04-30
```

**Metrics Tracked:**
- Click-through rate (CTR)
- Conversion rate
- User satisfaction
- Revenue generated from recommendations
- Average time to purchase

### Database Queries

```sql
-- See most effective recommendations
SELECT RECOMMENDATION_TYPE, 
       COUNT(*) as total_recs,
       SUM(CASE WHEN PURCHASED = 1 THEN 1 ELSE 0 END) as purchases,
       SUM(CASE WHEN PURCHASED = 1 THEN 1 ELSE 0 END) / COUNT(*) as conversion_rate
FROM BOOK_RECOMMENDATIONS
GROUP BY RECOMMENDATION_TYPE
ORDER BY conversion_rate DESC;

-- See user feedback patterns
SELECT USER_ID, FEEDBACK_TYPE, COUNT(*) 
FROM RECOMMENDATION_FEEDBACK
GROUP BY USER_ID, FEEDBACK_TYPE;
```

---

## 🐛 TROUBLESHOOTING

### Issue: "No recommendations returned"
**Solution:**
- Check if BOOK_METADATA is populated
- Verify user preferences are set
- Check if user has interaction history

### Issue: "Same recommendations always shown"
**Solution:**
- Check if learning is working: `UPDATE CHATBOT_USER_PROFILE`
- Verify feedback is being recorded
- Increase variety: adjust recommendation strategy weights

### Issue: "Slow recommendation queries"
**Solution:**
- Add indexes on frequently queried columns
- Pre-compute similarities using batch job
- Limit recommendation generation frequency (cache results)

### Issue: "User preferences not updating"
**Solution:**
- Check `BOOK_READING_HISTORY` table has data
- Verify `updatePreferencesFromHistory()` is called
- Check database transaction commits

---

## 📝 MIGRATION CHECKLIST

Before going live:

- [ ] Database schema created successfully
- [ ] Book metadata seeded (at least 100 books)
- [ ] Backend API endpoints tested
- [ ] Frontend components integrated
- [ ] User tracking events verified
- [ ] Chatbot intent detection updated
- [ ] Recommendation feedback flow working
- [ ] Analytics queries tested
- [ ] Performance monitoring set up
- [ ] User preferences modal added
- [ ] Product page tracking implemented
- [ ] Error handling in place
- [ ] Rate limiting on API endpoints

---

## 🔄 CONTINUOUS IMPROVEMENT

### Batch Jobs to Implement

1. **Nightly: Compute Book Similarities**
   ```bash
   node backend/jobs/compute-similarities.js
   ```

2. **Daily: Update Trending Books**
   ```bash
   node backend/jobs/update-trending.js
   ```

3. **Weekly: Generate Analytics Report**
   ```bash
   node backend/jobs/generate-analytics.js
   ```

4. **Monthly: User Segmentation**
   ```bash
   node backend/jobs/segment-users.js
   ```

---

## 🎓 NEXT STEPS

1. **Phase 1:** Basic recommendations (similar books, trending)
2. **Phase 2:** User preference learning & personalization
3. **Phase 3:** Collaborative filtering & advanced ML
4. **Phase 4:** A/B testing different strategies
5. **Phase 5:** Real-time recommendations & notifications

---

## 📞 SUPPORT

For issues or questions:
1. Check troubleshooting section
2. Review database logs
3. Check browser console for frontend errors
4. Review backend logs: `backend/logs/`
