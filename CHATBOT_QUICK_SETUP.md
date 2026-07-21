# 🚀 Bắt Đầu Nhanh - Chatbot Nâng Cao

## ⚡ Setup trong 5 phút

### Bước 1: Tạo Database Schema

```bash
cd backend

# Chạy enhanced schema (Oracle SQL)
sqlplus username/password@database @database/chatbot-enhanced-schema.sql
```

**Hoặc chạy các file SQL riêng lẻ:**
```sql
-- Bật tuần tự
CREATE SEQUENCE chatbot_pool_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE chatbot_selection_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE chatbot_profile_seq START WITH 1 INCREMENT BY 1;

-- Tạo bảng
CREATE TABLE CHATBOT_RESPONSE_POOL (...)
CREATE TABLE CHATBOT_USER_PROFILE (...)
CREATE TABLE CHATBOT_RESPONSE_SELECTION_LOG (...)
...
```

### Bước 2: Initialize Response Pool

```bash
# Thêm response templates vào database
node setup-chatbot-enhanced.js
```

Output sẽ thế này:
```
Initializing chatbot response pool...
✅ Added: PAYMENT - SHORT
✅ Added: PAYMENT - DETAILED
✅ Added: PAYMENT - PERSONALIZED
...
Response pool initialization complete!
```

### Bước 3: Update Server Routes

**File: `server.js`**

```javascript
// Thay thế route chatbot cũ
// app.use('/api/chatbot', require('./routes/chatbot'));

// Bằng route mới (enhanced)
app.use('/api/chatbot', require('./routes/chatbot-enhanced'));
```

### Bước 4: Khởi Động Backend

```bash
npm run dev
# Server running on http://localhost:5000
```

### Bước 5: Frontend - Gửi Context

**File: `components/ChatBotClient.tsx` hoặc tương tự**

```typescript
const handleSendMessage = async (message: string) => {
  const response = await fetch('/api/chatbot/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: user?.id || 'guest',
      message,
      conversationId: conversation.id,
      contextData: {
        deviceType: isMobile() ? 'MOBILE' : 'DESKTOP',
        entryPoint: getCurrentPage(),
        userUrgency: detectUrgency(message),
        interactionPhase: getCurrentPhase()
      }
    })
  });

  const data = await response.json();
  // Handle response...
};
```

---

## 📊 Database Tables Được Tạo

```
✅ CHATBOT_RESPONSE_POOL              - Response variants
✅ CHATBOT_RESPONSE_SELECTION_LOG     - Selection tracking
✅ CHATBOT_USER_PROFILE               - User memory
✅ CHATBOT_CONVERSATION_CONTEXT       - Session context
✅ CHATBOT_QUESTION_VARIANTS          - Question patterns
✅ CHATBOT_PERFORMANCE_METRICS        - Analytics
```

---

## 🎯 Response Types Được Hỗ Trợ

| Type | Mô Tả | Khi Dùng |
|------|--------|----------|
| **SHORT** | Ngắn gọn, 1-2 dòng | User vội, mobile |
| **DETAILED** | Chi tiết, dễ hiểu | Desktop, analytical |
| **PERSONALIZED** | Có tên user, lịch sử | Returning customer |
| **UPSELL** | Gợi ý thêm sản phẩm | Checkout phase |
| **CONVERSATIONAL** | Thân thiện, hỏi lại | New user |

---

## 🧪 Test API

### Test 1: Gửi Message (New User)

```bash
curl -X POST http://localhost:5000/api/chatbot/message \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "guest",
    "message": "Có sách Java không?",
    "contextData": {
      "deviceType": "MOBILE",
      "userUrgency": "HIGH",
      "interactionPhase": "DISCOVERY"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "conversationId": 1,
    "response": "Bạn quan tâm loại sách nào? 📚...",
    "responseType": "SHORT",
    "selectionReason": "NEW_USER_SHORT",
    "confidence": 0.95
  }
}
```

### Test 2: Ghi Nhận Feedback

```bash
curl -X POST http://localhost:5000/api/chatbot/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "messageId": 1,
    "helpful": 1,
    "conversionResult": true
  }'
```

### Test 3: Lấy User Profile

```bash
curl http://localhost:5000/api/chatbot/profile/123
```

---

## 🔧 Cấu Hình

### Environment Variables

**File: `.env.backend`**

```env
PORT=5000
DB_USER=username
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=1521
DB_NAME=database

# Chatbot settings
CHATBOT_MAX_RESPONSE_TIME=5000
CHATBOT_LEARNING_ENABLED=true
CHATBOT_PERSONALIZATION_ENABLED=true
```

### Customize Response Pool

**File: `backend/setup-chatbot-enhanced.js`**

```javascript
const responsePoolData = [
  {
    INTENT_CATEGORY: 'PAYMENT',
    RESPONSE_TYPE: 'SHORT',
    RESPONSE_TEMPLATE: 'Bạn muốn thanh toán bằng cách nào?',
    RESPONSE_RANK: 1,
    CONTEXT_TAGS: 'busy,mobile',
  },
  // ... thêm responses khác
];
```

---

## 🎓 Flow Chính

```
User sends message
     ↓
Detect Intent
     ↓
Get User Profile
     ↓
Get Conversation Context
     ↓
Query Response Pool
     ↓
Calculate Score (Rating + Context + Performance)
     ↓
Select Best Response
     ↓
Render (Replace placeholders)
     ↓
Store in DB + Log Selection
     ↓
Update User Profile
     ↓
Return Response
     ↓
[Wait for Feedback]
     ↓
Update Response Stats
```

---

## 📈 Monitoring

### Check Response Performance

```sql
SELECT 
  INTENT_CATEGORY,
  RESPONSE_TYPE,
  USAGE_COUNT,
  AVERAGE_RATING,
  CONVERSION_COUNT,
  (CONVERSION_COUNT / USAGE_COUNT) as CONVERSION_RATE
FROM CHATBOT_RESPONSE_POOL
ORDER BY AVERAGE_RATING DESC;
```

### Check User Engagement

```sql
SELECT 
  USER_ID,
  INTERACTION_COUNT,
  TOTAL_PURCHASES,
  USER_PERSONALITY,
  CHURN_RISK
FROM CHATBOT_USER_PROFILE
WHERE INTERACTION_COUNT > 5
ORDER BY CHURN_RISK DESC;
```

### Check Selection Log

```sql
SELECT 
  SELECTION_REASON,
  WAS_HELPFUL,
  CONVERSION_RESULT,
  COUNT(*) as TOTAL
FROM CHATBOT_RESPONSE_SELECTION_LOG
GROUP BY SELECTION_REASON, WAS_HELPFUL, CONVERSION_RESULT;
```

---

## 🐛 Troubleshooting

### Error: "Route not found"

✅ Chắc chắn đã update `server.js` dùng route mới

### Error: "Table not found"

✅ Chạy lại database schema
✅ Kiểm tra connection string

### Response quá giống nhau

✅ Thêm more response variants
✅ Check CONTEXT_TAGS trong response pool

### Chậm lắm

✅ Add indexes trên `CONVERSATION_ID`
✅ Cache user profiles
✅ Optimize SQL queries

---

## 📚 Tài Liệu Chi Tiết

- [CHATBOT_ENHANCED_GUIDE.md](CHATBOT_ENHANCED_GUIDE.md) - Hướng dẫn đầy đủ
- [backend/utils/responsePoolManager.js](backend/utils/responsePoolManager.js) - Response selection logic
- [backend/utils/userProfileManager.js](backend/utils/userProfileManager.js) - User memory
- [backend/routes/chatbot-enhanced.js](backend/routes/chatbot-enhanced.js) - API endpoints

---

## ✅ Checklist Hoàn Tất

- [ ] Tạo database schema
- [ ] Initialize response pool
- [ ] Update server routes
- [ ] Test API endpoints
- [ ] Deploy backend
- [ ] Update frontend
- [ ] Monitor performance
- [ ] Collect feedback
- [ ] Iterate responses

---

## 🎉 Done!

Chatbot của bạn giờ đã có:
✅ Ghi nhớ thông tin người dùng
✅ Lưu nhiều response variants
✅ Chọn response phù hợp theo context
✅ Học từ feedback người dùng
✅ Cá nhân hóa trải nghiệm

Bắt đầu!
