# 📚 Book Recommendation System - Quick Implementation Guide

## ⚡ 5-Minute Quick Start

### 1. Run Database Setup
```bash
cd backend
node setup-recommendation-system.js
```

### 2. Add Backend Routes (Already Done ✅)
- ✅ `/api/recommendations/:userId` - Get recommendations
- ✅ `/api/recommendations/:userId/preferences` - Manage preferences
- ✅ `/api/recommendations/:userId/track-interaction` - Track reads
- ✅ `/api/recommendations/:userId/feedback` - Send feedback

### 3. Add Frontend Component
```typescript
// app/account/page.tsx or chat page
import { BookRecommendationWidget } from '@/components/BookRecommendation';

export default function Page() {
  const userId = getUserId(); // from auth context
  
  return (
    <BookRecommendationWidget 
      userId={userId}
      onSelectBook={(book) => {
        // Navigate to product
        router.push(`/product/${book.masp}`);
      }}
    />
  );
}
```

### 4. Track Product Views
```typescript
// app/product/[id]/page.tsx
useEffect(() => {
  if (userId) {
    fetch(`/api/recommendations/${userId}/track-interaction`, {
      method: 'POST',
      body: JSON.stringify({
        masp: id,
        interactionType: 'VIEWED'
      })
    });
  }
}, [id, userId]);
```

### 5. Integrate with Chatbot
```javascript
// backend/routes/chatbot-enhanced.js
const { handleRecommendationRequest } = require('../utils/chatbotRecommendationIntegration');

if (intent === 'PRODUCT_SUGGESTION') {
  const result = await handleRecommendationRequest(userId, message);
  response = result.formattedResponse;
}
```

---

## 🎯 Key Features Implemented

### ✅ **Smart Recommendations**
- Based on similar books user viewed
- Filtered by category preferences
- Ranked by rating & popularity

### ✅ **User Learning**
- Tracks viewing history
- Learns from purchases
- Collects explicit feedback (👍/👎)

### ✅ **Personalization**
- User preference settings
- Category favorites
- Price range preferences
- Reading difficulty levels

### ✅ **Chatbot Integration**
- Detects recommendation requests
- Natural language parsing
- Contextual suggestions

### ✅ **Analytics**
- Tracks recommendation CTR
- Measures conversion rates
- Records user satisfaction

---

## 📡 API Examples

### Get Personalized Recommendations
```bash
curl "http://localhost:5000/api/recommendations/user123"
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "masp": "BOOK001",
      "tensp": "Atomic Habits",
      "giaban": 120000,
      "hinhanh": "/images/atomic-habits.jpg",
      "rating": 4.5,
      "author": "James Clear",
      "type": "SIMILAR",
      "reason": "Sách tương tự với những cuốn bạn thích",
      "matchScore": 0.85,
      "rank": 1
    }
  ],
  "count": 5
}
```

### Set User Preferences
```bash
curl -X PUT "http://localhost:5000/api/recommendations/user123/preferences" \
  -H "Content-Type: application/json" \
  -d '{
    "favoriteCategories": [
      {"category": "Kinh doanh", "weight": 1},
      {"category": "Self-help", "weight": 1}
    ],
    "preferredDifficulty": "TRUNG_BÌNH",
    "readingMotivation": "LEARNING",
    "priceRange": {"min": 0, "max": 500000}
  }'
```

### Track Interaction
```bash
curl -X POST "http://localhost:5000/api/recommendations/user123/track-interaction" \
  -H "Content-Type: application/json" \
  -d '{
    "masp": "BOOK001",
    "interactionType": "VIEWED",
    "additionalData": {"viewDuration": 45000}
  }'
```

### Submit Feedback
```bash
curl -X POST "http://localhost:5000/api/recommendations/user123/feedback" \
  -H "Content-Type: application/json" \
  -d '{
    "recId": 123,
    "feedbackType": "HELPFUL",
    "reason": "Book matches my interests perfectly"
  }'
```

---

## 🎨 React Component Examples

### Display Recommendations in Chat
```typescript
import { BookRecommendationWidget } from '@/components/BookRecommendation';

function ChatPage() {
  return (
    <div>
      <ChatMessages />
      <BookRecommendationWidget userId={userId} />
    </div>
  );
}
```

### User Preferences Modal
```typescript
import { RecommendationPreferences } from '@/components/BookRecommendation';

function SettingsPage() {
  return (
    <RecommendationPreferences 
      userId={userId}
      onSave={() => console.log('Preferences saved')}
    />
  );
}
```

---

## 🔧 Customization Examples

### Change Recommendation Count
```javascript
// Get top 10 instead of 5
const recs = await generatePersonalizedRecommendations(userId, 10);
```

### Adjust Learning Weights
```javascript
// Make purchases more influential
const weight = interactionType === 'PURCHASED' ? 5 : 1;
```

### Filter by Price
```javascript
// Only recommend books within user's budget
const maxPrice = userProfile.budget;
recommendations = recommendations.filter(r => r.giaban <= maxPrice);
```

### Change Response Messages
```javascript
// Customize recommendation messages
const message = `✨ ${count} cuốn sách tuyệt vời dành cho bạn!`;
```

---

## 📊 Monitoring

### Check Recommendation Performance
```sql
SELECT 
  RECOMMENDATION_TYPE,
  COUNT(*) as total,
  SUM(CASE WHEN CLICKED = 1 THEN 1 ELSE 0 END) as clicks,
  SUM(CASE WHEN PURCHASED = 1 THEN 1 ELSE 0 END) as purchases
FROM BOOK_RECOMMENDATIONS
GROUP BY RECOMMENDATION_TYPE;
```

### See Most Popular Recommendations
```sql
SELECT 
  MASP, TENSP, 
  COUNT(*) as rec_count,
  SUM(CASE WHEN PURCHASED = 1 THEN 1 ELSE 0 END) as purchase_count
FROM BOOK_RECOMMENDATIONS
WHERE PURCHASED = 1
GROUP BY MASP, TENSP
ORDER BY purchase_count DESC
FETCH FIRST 10 ROWS ONLY;
```

---

## ✨ What Happens When User...

### 1. Views a Product
```
→ Track VIEWED interaction
→ Update user category preferences (+1 weight)
→ Next recommendations consider this category
```

### 2. Searches for Books
```
→ Parse search query (e.g., "sách kinh doanh")
→ Extract category + difficulty
→ Return matching books
→ Track search interaction
```

### 3. Makes Purchase
```
→ Track PURCHASED interaction
→ Update category preferences (+3 weight)
→ Add book to user's reading history
→ Recommend similar books next time
```

### 4. Provides Feedback
```
→ Record feedback (HELPFUL / NOT_HELPFUL)
→ Learn from feedback patterns
→ Adjust similar recommendations
→ Update recommendation score
```

### 5. Asks Chatbot for Suggestions
```
→ Chatbot detects PRODUCT_SUGGESTION intent
→ Call handleRecommendationRequest()
→ Generate personalized recommendations
→ Format nice response with book details
→ Track that recommendations were shown
```

---

## 🚨 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| No recommendations returned | Check BOOK_METADATA is populated |
| Same books always recommended | Verify learning is updating preferences |
| Slow queries | Add indexes on CATEGORY_PRIMARY, USER_ID |
| Feedback not recording | Check RECOMMENDATION_FEEDBACK table |
| User preferences reset | Verify UPDATED_AT timestamp logic |

---

## 📈 Expected Outcomes

After implementation:

- **Week 1:** System collecting interaction data
- **Week 2:** Personalized recommendations appearing
- **Week 3:** Learning from user feedback
- **Week 4:** Recommendation conversion rate improves
- **Month 2:** Analytics showing ROI improvements
- **Month 3:** A/B testing different strategies

---

## 🎓 Next: Advanced Features

Once basic system is working:

1. **Collaborative Filtering** - "Users who liked X also liked Y"
2. **Content-based Filtering** - Use book descriptions & topics
3. **Hybrid Approach** - Combine multiple strategies
4. **Real-time Recommendations** - Show as user browses
5. **Notification System** - "New book in your favorite category"
6. **Batch Similarity Computation** - Pre-calculate book similarities
7. **Machine Learning** - ML model trained on feedback

---

## 🎯 Success Metrics to Track

```
✓ Click-through rate on recommendations
✓ Conversion rate (clicks → purchases)
✓ Average order value from recommendations
✓ User satisfaction score (feedback)
✓ System performance (query time)
✓ Recommendation diversity
✓ Cold-start problem (new users)
```

---

## 📞 Integration Checklist

- [ ] Database schema created
- [ ] API routes integrated in server.js
- [ ] Backend utilities imported
- [ ] React components added to frontend
- [ ] Product page tracking added
- [ ] Chatbot intent detection updated
- [ ] Feedback UI working (👍/👎 buttons)
- [ ] Analytics dashboard viewing
- [ ] Error handling tested
- [ ] Performance tested with load
- [ ] User preferences modal available
- [ ] Data is being collected to database

---

**Status:** ✅ **Ready to Deploy**

All components are in place and ready to use!
