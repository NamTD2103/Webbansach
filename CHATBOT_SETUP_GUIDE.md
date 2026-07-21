# Chatbot System - Complete Setup Guide

## 📚 Overview

This is a complete chatbot system for the WebBanSach online bookstore with:
- ✅ AI-powered intent detection
- ✅ Personalized responses
- ✅ Learning mechanism (FAQ tracking)
- ✅ User preference tracking
- ✅ Feedback system
- ✅ Admin statistics dashboard

## 📁 Project Structure

```
Backend:
├── database/
│   └── chatbot-schema.sql          # Database schema
├── routes/
│   └── chatbot.js                  # API routes
└── utils/
    └── chatbotUtils.js             # AI logic & utilities

Frontend:
├── components/
│   ├── ChatBot.tsx                 # Main chatbot widget
│   ├── ChatMessage.tsx             # Message component
│   ├── ChatBotStatsAdmin.tsx       # Admin stats dashboard
│   └── RootLayoutContent.tsx       # Layout wrapper
└── lib/hooks/
    └── useChatbot.ts               # Chatbot state management hook
```

## 🚀 Quick Start

### 1. Database Setup

Run the SQL script to create chatbot tables:

```bash
# Connect to Oracle Database
sqlplus user/password@database

# Run the script
@backend/database/chatbot-schema.sql
```

Tables created:
- `CHATBOT_CONVERSATIONS` - Store conversation sessions
- `CHATBOT_MESSAGES` - Store individual messages
- `CHATBOT_USER_PREFERENCES` - Store learned user preferences
- `CHATBOT_LEARNING` - Store FAQ and common questions
- `CHATBOT_QUICK_RESPONSES` - Pre-defined quick responses

### 2. Backend Setup

The chatbot API is already integrated into `backend/server.js`:

```javascript
const chatbotRoutes = require('./routes/chatbot');
app.use('/api/chatbot', chatbotRoutes);
```

Start the backend server:

```bash
cd backend
npm start
```

### 3. Frontend Integration

The chatbot is ready to use! Update `app/layout.tsx` to include it:

```typescript
import { RootLayoutContent } from '@/components/RootLayoutContent';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <RootLayoutContent>{children}</RootLayoutContent>
      </body>
    </html>
  );
}
```

Start the frontend:

```bash
npm run dev
```

Visit http://localhost:3000 - you'll see the chatbot widget in the bottom-right corner!

## 📡 API Endpoints

### Core Endpoints

#### 1. Send Message
```bash
POST /api/chatbot/message

Body:
{
  "userId": 1,
  "message": "Tôi muốn mua sách lập trình",
  "conversationId": "conv_123" (optional),
  "sessionToken": "session_token" (optional)
}

Response:
{
  "success": true,
  "data": {
    "conversationId": "conv_123",
    "botMessageId": "msg_456",
    "response": "Bạn quan tâm đến sách nào? 📚",
    "intent": "PRODUCT_SUGGESTION",
    "confidence": 0.95,
    "responseTime": 124
  }
}
```

#### 2. Get Conversations
```bash
GET /api/chatbot/conversations/:userId?limit=5

Response:
{
  "success": true,
  "data": [
    {
      "CONVERSATION_ID": 1,
      "TOTAL_MESSAGES": 10,
      "LAST_MESSAGE_AT": "2024-04-17T10:30:00Z",
      "SATISFIED_FLAG": 1
    }
  ]
}
```

#### 3. Get Messages
```bash
GET /api/chatbot/messages/:conversationId?limit=50

Response:
{
  "success": true,
  "data": [
    {
      "MESSAGE_ID": 1,
      "MESSAGE_TYPE": "user",
      "CONTENT": "Hello",
      "INTENT": "GREETING",
      "CREATED_AT": "2024-04-17T10:30:00Z"
    }
  ]
}
```

#### 4. Send Feedback
```bash
POST /api/chatbot/feedback

Body:
{
  "messageId": "msg_456",
  "helpful": 1,           # 1 = helpful, -1 = not helpful
  "conversationId": "conv_123",
  "feedbackText": "Very helpful!"
}
```

#### 5. Get User Preferences
```bash
GET /api/chatbot/preferences/:userId

Response:
{
  "success": true,
  "data": {
    "PREFERENCE_ID": 1,
    "USER_ID": 1,
    "CATEGORY_INTEREST": "Lập trình,Tiểu thuyết",
    "PRICE_RANGE": "100000-500000",
    "FAVORITE_AUTHORS": "Author1,Author2",
    "INTERACTION_COUNT": 5
  }
}
```

#### 6. Update User Preferences
```bash
POST /api/chatbot/preferences/:userId

Body:
{
  "categoryInterest": "Lập trình,Tiểu thuyết",
  "priceRange": "100000-500000",
  "favoriteAuthors": "Author1,Author2"
}
```

#### 7. Get FAQ
```bash
GET /api/chatbot/faq?category=PAYMENT

Response:
{
  "success": true,
  "data": [
    {
      "LEARNING_ID": 1,
      "QUESTION_PATTERN": "thanh toán|payment method",
      "CATEGORY": "PAYMENT",
      "RESPONSE_TEMPLATE": "Chúng tôi hỗ trợ 2 phương thức...",
      "FREQUENCY": 25,
      "AVERAGE_RATING": 0.95
    }
  ]
}
```

#### 8. Get Chatbot Stats (Admin)
```bash
GET /api/chatbot/stats

Response:
{
  "success": true,
  "data": {
    "total_conversations": 1250,
    "total_messages": 8945,
    "unique_users": 892,
    "avg_messages_per_conv": 7.2,
    "satisfied_conversations": 1100
  }
}
```

## 🧠 Intent Detection

The chatbot automatically detects user intent from messages:

| Intent | Keywords | Example |
|--------|----------|---------|
| **PAYMENT** | thanh toán, payment, card, chuyển khoản | "Thanh toán như thế nào?" |
| **SHIPPING** | vận chuyển, ship, giao hàng, delivery | "Thời gian giao hàng bao lâu?" |
| **PRODUCT_SUGGESTION** | gợi ý, recommend, sách nào | "Gợi ý sách cho tôi" |
| **ORDER_STATUS** | đơn hàng, order, status | "Đơn hàng của tôi ở đâu?" |
| **REFUND** | hoàn, refund, trả hàng | "Làm thế nào để hoàn hàng?" |
| **ACCOUNT** | tài khoản, account, login | "Quên mật khẩu" |
| **FAQ** | giúp, help, câu hỏi | "Giúp tôi cái" |

## 💡 Learning Mechanism

### How It Works

1. **Message Recording**: Every user message is stored with:
   - Intent (detected)
   - Confidence score
   - Response time
   - User feedback

2. **Pattern Learning**: Frequently asked questions are tracked and optimized:
   - Frequency counter (how many times asked)
   - Average rating (user satisfaction)
   - Response template updates

3. **User Preferences**:
   - Category interests (from product suggestions viewed)
   - Price range preferences
   - Favorite authors
   - Interaction count

4. **Feedback Loop**:
   - Users rate each response (👍 helpful / 👎 not helpful)
   - Low-rated responses are flagged for improvement
   - High-rated responses are prioritized

### Example Learning Scenario

```
User 1: "Thanh toán như thế nào?"
Bot: "Chúng tôi hỗ trợ 2 phương thức..."
User 1: 👍 Helpful (Feedback = 1)

[System records]
- CHATBOT_LEARNING table: frequency + 1, rating improved
- CHATBOT_MESSAGES: IS_HELPFUL = 1

User 2: "Thanh toán như thế nào?" (same question)
Bot: (Uses optimized response from learning data)
User 2: 👍 Helpful

[Pattern]: This question gets higher confidence & faster responses
```

## 🎨 Customization

### Add Custom Intent

Edit `backend/utils/chatbotUtils.js`:

```javascript
const intentPatterns = {
  // ... existing patterns
  RETURN_POLICY: {
    keywords: ['trả', 'return', 'đổi', 'exchange'],
    regex: /trả|return|đổi|exchange/i,
  },
};
```

### Add Custom Response

Edit response templates:

```javascript
const responseTemplates = {
  RETURN_HELP:
    '🔄 **Chính sách đổi trả:** ...',
};
```

### Change Chatbot Appearance

Use ChatBot props:

```jsx
<ChatBot
  userId={123}
  position='bottom-left'     // or 'bottom-right'
  theme='dark'               // or 'light'
  initialMessage='Custom greeting'
/>
```

## 📊 Admin Dashboard

View chatbot stats at the admin panel:

```jsx
import { ChatBotStatsAdmin } from '@/components/ChatBotStatsAdmin';

export default function AdminPage() {
  return <ChatBotStatsAdmin />;
}
```

Displays:
- Total conversations
- Total messages
- Unique users
- Average messages per conversation
- User satisfaction rate

## 🔒 Security Considerations

1. **User Authentication**: Always send `userId` from authenticated session
2. **Rate Limiting**: Consider adding rate limits to prevent abuse:
   ```javascript
   // Add to backend/server.js
   const rateLimit = require('express-rate-limit');
   const chatbotLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });
   app.use('/api/chatbot/', chatbotLimiter);
   ```

3. **Input Validation**: Messages are automatically trimmed and validated
4. **Privacy**: Store only necessary user data in preferences

## 🐛 Troubleshooting

### Chatbot not showing up
- Check if `RootLayoutContent` is properly imported in `app/layout.tsx`
- Ensure `userId` is available in localStorage or sessionStorage
- Check browser console for errors

### API errors
- Verify database tables are created with `chatbot-schema.sql`
- Check if backend route is registered in `server.js`
- Ensure database connection is working

### No responses from bot
- Check intent patterns in `chatbotUtils.js`
- Verify response templates exist
- Check API logs for errors

## 📈 Performance Optimization

### Database Indexes
Already created for:
- `CHATBOT_CONVERSATIONS`: user_id, created_at, satisfied_flag
- `CHATBOT_MESSAGES`: conversation_id, user_id, intent, type, created_at
- `CHATBOT_LEARNING`: category, frequency, active

### Caching Suggestions
```javascript
// Cache frequently accessed FAQs
const faqCache = new Map();

// Refresh every 5 minutes
setInterval(refreshFAQCache, 5 * 60 * 1000);
```

## 🚀 Deployment

### Environment Variables
Create `.env.local` for frontend:
```
NEXT_PUBLIC_API_URL=https://your-backend.com
```

### Backend Production
```bash
NODE_ENV=production npm start
```

### Database Optimization
```sql
-- For Oracle, create additional indexes for large datasets
CREATE INDEX idx_learning_category_active 
  ON CHATBOT_LEARNING(CATEGORY, IS_ACTIVE);

CREATE INDEX idx_messages_intent_helpful 
  ON CHATBOT_MESSAGES(INTENT, IS_HELPFUL);
```

## 📝 Future Enhancements

- [ ] Voice input/output support
- [ ] Multi-language support (Tiếng Anh, 中文, etc.)
- [ ] Integration with product catalog for better suggestions
- [ ] Real-time analytics dashboard
- [ ] Admin panel for manually updating FAQ
- [ ] Chatbot sentiment analysis
- [ ] Integration with order system for better support
- [ ] Machine learning for intent prediction improvement
- [ ] Context-aware responses (remember conversation history)
- [ ] Handoff to human agent

## 📞 Support

For issues or questions:
1. Check API logs: `backend/logs/`
2. Review database schema: `backend/database/chatbot-schema.sql`
3. Inspect browser console for frontend errors
4. Check componentLogger in `components/ChatBot.tsx`

---

**Created**: April 17, 2024  
**Version**: 1.0  
**Status**: Production Ready ✅
