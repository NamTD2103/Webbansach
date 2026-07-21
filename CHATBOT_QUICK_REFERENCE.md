# Chatbot System - Quick Reference

## 🎯 Key Features

| Feature | Description | Status |
|---------|-------------|--------|
| Intent Detection | Auto-detect user intent from message | ✅ Active |
| Personalization | Learn user preferences over time | ✅ Active |
| FAQ Tracking | Track and optimize common questions | ✅ Active |
| Feedback System | Users rate bot responses | ✅ Active |
| Admin Dashboard | View chatbot statistics | ✅ Active |
| Multi-Intent | Support 7+ different intents | ✅ Active |

## 🚀 Quick Usage

### For Users (Frontend)

```tsx
// Component automatically appears in bottom-right corner
// Just integrate into root layout:

import { RootLayoutContent } from '@/components/RootLayoutContent';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <RootLayoutContent>{children}</RootLayoutContent>
      </body>
    </html>
  );
}
```

### For Developers (Backend API)

```bash
# Send message
curl -X POST http://localhost:5000/api/chatbot/message \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "message": "Tôi muốn mua sách lập trình",
    "conversationId": "conv_123"
  }'

# Get stats
curl http://localhost:5000/api/chatbot/stats
```

## 📚 Intent Categories

- 🏷️ **PAYMENT** - Questions about payment methods
- 📦 **SHIPPING** - Questions about delivery
- 📚 **PRODUCT_SUGGESTION** - Book recommendations
- 📋 **ORDER_STATUS** - Track orders
- 🔄 **REFUND** - Returns and refunds
- 👤 **ACCOUNT** - Account issues
- ❓ **FAQ** - General help

## 💾 Database Tables

```
CHATBOT_CONVERSATIONS
├── conversation_id (PK)
├── user_id (FK)
├── total_messages
├── satisfied_flag (-1, 0, 1)
└── created_at

CHATBOT_MESSAGES
├── message_id (PK)
├── conversation_id (FK)
├── message_type (user/bot)
├── content
├── intent
├── confidence_score
├── is_helpful (-1, 0, 1)
└── created_at

CHATBOT_USER_PREFERENCES
├── preference_id (PK)
├── user_id (FK, unique)
├── category_interest
├── price_range
├── favorite_authors
└── interaction_count

CHATBOT_LEARNING
├── learning_id (PK)
├── question_pattern
├── category
├── response_template
├── frequency
├── average_rating
└── is_active
```

## 🔗 API Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/chatbot/message` | POST | Send user message, get bot response |
| `/api/chatbot/conversations/:userId` | GET | Get user's conversation history |
| `/api/chatbot/messages/:conversationId` | GET | Get messages in conversation |
| `/api/chatbot/feedback` | POST | Send feedback on response |
| `/api/chatbot/preferences/:userId` | GET/POST | Get/update user preferences |
| `/api/chatbot/faq` | GET | Get FAQ list |
| `/api/chatbot/stats` | GET | Get admin statistics |

## 🧠 How AI Works

```
User Message
    ↓
Intent Detection (regex + keywords)
    ↓
Confidence Calculation (0-1)
    ↓
Response Generation (from templates)
    ↓
Personalization (using user preferences)
    ↓
Bot Response + Store in DB
    ↓
User Feedback
    ↓
Learning Update (update FAQ frequency & rating)
```

## 📝 Response Templates

Pre-defined responses for:
- Greeting
- Payment methods
- Shipping info
- Refund policy
- Order tracking
- Product recommendations
- Error handling

## 🎓 Learning Examples

### Example 1: FAQ Frequency Increase
```
User: "Thanh toán như thế nào?"
Count: 25 → 26 (frequency++)

If frequently asked:
- Bot prioritizes this response
- Confidence increases
- Response time optimized
```

### Example 2: User Preference Tracking
```
User mentions: "Tôi thích sách lập trình"
System records:
- category_interest: "Lập trình"
- interaction_count: 5+
- Last updated: today

Next interaction:
Bot: "Bạn thích sách Lập trình. Có muốn xem sách mới không?"
```

### Example 3: Satisfaction Rating
```
User sees response → 👍 (helpful) or 👎 (not helpful)
System updates:
- is_helpful: 1 or -1
- average_rating: recalculated
- Response optimized for next user
```

## 📊 Admin Dashboard Example

```tsx
import { ChatBotStatsAdmin } from '@/components/ChatBotStatsAdmin';

export default function AdminChatbot() {
  return (
    <div>
      <h1>Chatbot Admin</h1>
      <ChatBotStatsAdmin />
    </div>
  );
}
```

Shows:
- Total conversations
- Total messages
- Unique users
- Avg messages per conversation
- Satisfaction rate

## 🔧 Customization

### Add New Intent Pattern

File: `backend/utils/chatbotUtils.js`

```javascript
const intentPatterns = {
  NEW_INTENT: {
    keywords: ['keyword1', 'keyword2'],
    regex: /keyword1|keyword2/i,
  },
};
```

### Add Response Template

```javascript
const responseTemplates = {
  NEW_RESPONSE: 'Your response here with emoji 🎉',
};
```

### Change Widget Position

```jsx
<ChatBot position='bottom-left' /> // or 'bottom-right'
```

### Change Theme

```jsx
<ChatBot theme='dark' /> // or 'light'
```

## ⚡ Performance Notes

- Response time: ~100-200ms (depends on DB)
- Message storage: ~1KB per message
- Indexed queries for fast retrieval
- Session caching enabled

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| Bot not showing | Check userId in localStorage, verify RootLayoutContent imported |
| No API response | Check backend running, database connection, route registration |
| Intent not detected | Check regex in intentPatterns, verify keywords |
| Feedback not saving | Verify messageId exists, check database connection |
| Stats showing 0 | Check if conversations/messages exist, verify admin access |

## 📈 Next Steps

1. ✅ Set up database: `chatbot-schema.sql`
2. ✅ Verify backend routes: `/api/chatbot/*`
3. ✅ Add to layout: `RootLayoutContent`
4. ✅ Test in browser
5. ✅ Train with real conversations
6. ✅ Monitor analytics
7. ✅ Optimize responses

## 📞 Files Reference

```
Backend:
- backend/routes/chatbot.js (API routes)
- backend/utils/chatbotUtils.js (AI logic)
- backend/database/chatbot-schema.sql (DB schema)

Frontend:
- components/ChatBot.tsx (main widget)
- components/ChatMessage.tsx (message display)
- components/ChatBotStatsAdmin.tsx (stats)
- components/RootLayoutContent.tsx (layout wrapper)
- lib/hooks/useChatbot.ts (state management)
```

---

**Last Updated**: April 17, 2024  
**Version**: 1.0  
**Status**: Production Ready ✅
