# 🤖 Hệ Thống Chatbot AI Nâng Cao

Hệ thống chatbot thông minh cho website bán sách với khả năng ghi nhớ người dùng, lưu nhiều cách trả lời, và lựa chọn response tối ưu.

## 📁 Cấu Trúc Thư Mục

```
📦 webbansach/
├── 📄 CHATBOT_QUICK_SETUP.md           ⭐ Bắt đầu nhanh (5 phút)
├── 📄 CHATBOT_ENHANCED_GUIDE.md        📖 Hướng dẫn chi tiết
├── 📄 CHATBOT_SYSTEM_OVERVIEW.md       🏗️ Tổng quan kiến trúc (TẠO SAU)
│
├── backend/
│   ├── 📄 setup-chatbot-enhanced.js    🔧 Initialize response pool
│   ├── utils/
│   │   ├── responsePoolManager.js      ⭐ Chọn response tốt nhất
│   │   ├── userProfileManager.js       👤 Quản lý user memory
│   │   └── chatbotUtils.js             🧠 Intent detection
│   ├── routes/
│   │   ├── chatbot-enhanced.js         🚀 API endpoints (mới)
│   │   └── chatbot.js                  ⚙️ API cũ (keep for compat)
│   └── database/
│       ├── chatbot-enhanced-schema.sql  🗄️ Tables mới
│       └── chatbot-schema.sql           🗄️ Tables cũ
│
├── components/
│   └── EnhancedChatBot.tsx             💻 Frontend component (ví dụ)
│
└── lib/
    └── hooks/
        └── useChatbot.ts               🎣 Hook cho chat
```

## 🎯 Những Tính Năng Chính

### ✅ Multi-Response Pool
- Lưu **3-4 cách trả lời** cho mỗi loại câu hỏi
- Response types: SHORT, DETAILED, PERSONALIZED, UPSELL
- Ưu tiên dựa trên hiệu suất (rating, conversion)

### ✅ User Memory Profile
- Lưu **tên, sở thích, lịch sử mua hàng**
- Nhận dạng **personality** của user (DIRECT, ANALYTICAL, CONVERSATIONAL)
- Tính **churn risk** để chủ động giữ chân khách
- Track **interaction history**

### ✅ Smart Response Selection
- Chọn response dựa trên **context**: device, urgency, phase
- Tránh **lặp lại** cách trả lời giống nhau
- Thưởng những response có **conversion rate cao**
- Phạt những response **ít được dùng và rating thấp**

### ✅ Continuous Learning
- Ghi nhận **feedback** từ user (helpful/not helpful)
- Tính **exponential moving average** cho rating
- Update **conversion count** khi user mua hàng
- Tự động adjust response rank theo thời gian

### ✅ Personalization
- Gọi tên user trong response
- Gợi ý sách dựa trên **favorite categories**
- Hiển thị **price range** thích hợp
- Sử dụng **preferred response type** của user

---

## 🚀 Bước Bắt Đầu

### 1️⃣ Setup Database (2 phút)

```bash
# Chạy enhanced schema
sqlplus user/pass@db @backend/database/chatbot-enhanced-schema.sql

# Hoặc copy-paste SQL từ file
```

### 2️⃣ Initialize Response Pool (1 phút)

```bash
cd backend
node setup-chatbot-enhanced.js
```

Output:
```
✅ Added: PAYMENT - SHORT
✅ Added: PAYMENT - DETAILED
✅ Added: PAYMENT - PERSONALIZED
...
```

### 3️⃣ Update Backend Routes (1 phút)

**File: `backend/server.js`**

```javascript
// Thay cái này:
app.use('/api/chatbot', require('./routes/chatbot'));

// Bằng cái này:
app.use('/api/chatbot', require('./routes/chatbot-enhanced'));
```

### 4️⃣ Start Backend (30 giây)

```bash
npm run dev
# http://localhost:5000 ✅
```

### 5️⃣ Test Frontend (30 giây)

```bash
# Frontend sends message with context
const response = await fetch('/api/chatbot/message', {
  method: 'POST',
  body: JSON.stringify({
    userId: '123',
    message: 'Có sách Java không?',
    contextData: {
      deviceType: 'MOBILE',
      userUrgency: 'HIGH',
      interactionPhase: 'DISCOVERY'
    }
  })
});
```

---

## 📊 Response Selection Logic

### Score Calculation

```
Score = Base(AVERAGE_RATING)
      + ContextMatch(+0.1 per tag)
      + ConfidenceBonus(+0.1)
      + ConversionBonus(+0.2)
      - OverusepenALTY(-0.2)
      - RepetitionPenalty(-0.15)
      
[Normalized to 0-1 range]
```

### Example Selection Flow

```
User: "Có sách Java không?" (MOBILE, VIP, Returning Customer)

1. Detect Intent: PRODUCT_SUGGESTION (95% confidence)
2. Get Response Pool:
   - Response A (SHORT): score = 0.70
   - Response B (DETAILED): score = 0.85 ✅ BEST
   - Response C (PERSONALIZED): score = 0.80

3. Select Response B
   Reason: "RETURNING_VIP_CUSTOMER"

4. Render with user data:
   "Xin chào Nguyễn Văn A!
    Bạn thích Lập Trình, đúng không?
    Top sách bán chạy..."
```

---

## 🗄️ Database Tables

| Table | Mục Đích | Dòng |
|-------|---------|------|
| `CHATBOT_RESPONSE_POOL` | Lưu response variants | ~30-50 |
| `CHATBOT_USER_PROFILE` | User memory | Grows |
| `CHATBOT_CONVERSATION_CONTEXT` | Session context | Grows |
| `CHATBOT_RESPONSE_SELECTION_LOG` | Track selection | Grows |
| `CHATBOT_QUESTION_VARIANTS` | Learn patterns | Grows |
| `CHATBOT_PERFORMANCE_METRICS` | Analytics | Daily |

---

## 📡 API Endpoints

### POST /api/chatbot/message
Gửi message + context → nhận response tối ưu

**Request:**
```json
{
  "userId": "123",
  "message": "Có sách Java không?",
  "conversationId": 456,
  "contextData": {
    "deviceType": "MOBILE|DESKTOP|TABLET",
    "entryPoint": "PRODUCT_PAGE|CHECKOUT|HOMEPAGE",
    "userUrgency": "HIGH|MEDIUM|LOW",
    "interactionPhase": "DISCOVERY|CONSIDERATION|DECISION|SUPPORT"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "conversationId": 456,
    "botMessageId": 1002,
    "response": "Xin chào! Bạn thích...",
    "responseType": "PERSONALIZED",
    "selectionReason": "RETURNING_CUSTOMER",
    "confidence": 0.95,
    "responseTime": 234
  }
}
```

### POST /api/chatbot/feedback
Ghi nhận feedback → improve future responses

**Request:**
```json
{
  "messageId": 1002,
  "helpful": 1,  // 1: yes, -1: no
  "conversionResult": true
}
```

### GET /api/chatbot/profile/:userId
Lấy user profile (memory)

### POST /api/chatbot/profile/:userId
Cập nhật user profile

---

## 💡 Ví Dụ Thực Tế

### Scenario 1: New Mobile User (Busy)

```
👤 User: Mobile, First time, In a hurry
💬 Message: "Giá bao nhiêu?"

🤖 System Logic:
├─ isFirstTime = true
├─ deviceType = MOBILE
├─ userUrgency = HIGH
└─ Select: SHORT response

📝 Response: "Sách nào bạn quan tâm?
            Giá 100k - 200k: Sách phổ thông
            Giá 200k - 500k: Sách chuyên ngành"

✅ Reason: NEW_USER_SHORT (quick response for mobile)
```

### Scenario 2: Returning VIP Customer

```
👤 User: Desktop, VIP, 5+ interactions, Likes Programming
💬 Message: "Có sách Python nào mới không?"

🤖 System Logic:
├─ isVIP = true
├─ favoriteCategories = ["Programming", "Tech"]
├─ deviceType = DESKTOP
└─ Select: PERSONALIZED response

📝 Response: "Xin chào Anh Minh! 👋
            
            Vì bạn thích Python, mình suggest:
            ⭐ 'Lập trình Python nâng cao' (450k)
            ⭐ 'Data Science với Python' (520k)
            🆕 'FastAPI for Modern Web' (380k)
            
            Mã VIP: Giảm 15% tất cả!"

✅ Reason: RETURNING_VIP_CUSTOMER
```

### Scenario 3: Learning from Feedback

```
Message 1:
- Bot response: "Phương thức thanh toán..."
- Feedback: helpful = 1 ✅ → AVERAGE_RATING +0.3
- Result: RESPONSE_RANK goes up

Message 2:
- Bot response: "Bạn chọn cách nào?"
- Feedback: helpful = -1 ❌ → AVERAGE_RATING -0.3
- Result: RESPONSE_RANK goes down

Over time: High-quality responses bubble up
           Low-quality responses sink
```

---

## 🔍 Monitoring & Analytics

### Check Response Performance

```sql
SELECT INTENT_CATEGORY, RESPONSE_TYPE, USAGE_COUNT, 
       AVERAGE_RATING, CONVERSION_COUNT
FROM CHATBOT_RESPONSE_POOL
ORDER BY AVERAGE_RATING DESC;
```

### Check User Segments

```sql
SELECT USER_PERSONALITY, COUNT(*) as TOTAL,
       AVG(CHURN_RISK) as AVG_CHURN_RISK
FROM CHATBOT_USER_PROFILE
GROUP BY USER_PERSONALITY;
```

### Selection Analysis

```sql
SELECT SELECTION_REASON, WAS_HELPFUL, COUNT(*) as TOTAL
FROM CHATBOT_RESPONSE_SELECTION_LOG
GROUP BY SELECTION_REASON, WAS_HELPFUL;
```

---

## 🎓 Files Explained

### `responsePoolManager.js`
- **calculateResponseScore()**: Tính điểm cho response
- **selectBestResponse()**: Chọn response tốt nhất
- **prepareSelectionContext()**: Chuẩn bị context
- **renderResponse()**: Thay placeholder (name, price, etc)

### `userProfileManager.js`
- **getUserProfile()**: Get user memory
- **updateUserPreferences()**: Learn from interaction
- **recordUserPurchase()**: Track purchases
- **calculateChurnRisk()**: Risk assessment

### `chatbot-enhanced.js`
- **POST /message**: Main endpoint with smart selection
- **POST /feedback**: Learn from feedback
- **GET/POST /profile**: User memory management

---

## 🛠️ Customization

### Add New Response

1. Edit `backend/setup-chatbot-enhanced.js`:
```javascript
responsePoolData.push({
  INTENT_CATEGORY: 'REFUND',
  RESPONSE_TYPE: 'SHORT',
  RESPONSE_TEMPLATE: 'Hoàn hàng trong 7 ngày...',
  RESPONSE_RANK: 1,
  CONTEXT_TAGS: 'frustrated,urgent'
});
```

2. Run: `node setup-chatbot-enhanced.js`

### Add New Intent

1. Update `chatbotUtils.js` - add keywords
2. Create responses in pool
3. Backend automatically routes

### Customize User Profile

Edit `userProfileManager.js` - add new fields like:
- `FAVORITE_AUTHORS`
- `READING_LEVEL`
- `SUBSCRIPTION_STATUS`

---

## ⚠️ Common Issues

| Problem | Solution |
|---------|----------|
| 404 Not Found | Update server.js routes |
| Slow response | Add DB indexes |
| Same response every time | Add context tags diversity |
| Low conversion | Monitor metrics, update responses |
| Memory bloat | Archive old conversations |

---

## 📚 Documentation

1. **Quick Start** → [CHATBOT_QUICK_SETUP.md](CHATBOT_QUICK_SETUP.md)
2. **Full Guide** → [CHATBOT_ENHANCED_GUIDE.md](CHATBOT_ENHANCED_GUIDE.md)
3. **Frontend Example** → [components/EnhancedChatBot.tsx](components/EnhancedChatBot.tsx)
4. **Setup Script** → [backend/setup-chatbot-enhanced.js](backend/setup-chatbot-enhanced.js)

---

## ✅ Implementation Checklist

- [ ] Database schema created
- [ ] Response pool initialized
- [ ] Backend routes updated
- [ ] Frontend integrated
- [ ] User profiles loading
- [ ] Feedback system working
- [ ] Monitoring dashboard (optional)
- [ ] Response variants A/B tested

---

## 🎉 You're Ready!

Chatbot của bạn giờ có:
- ✅ **Memory**: Nhớ user preferences & history
- ✅ **Smart Selection**: Chọn response tối ưu per context
- ✅ **Multi-Variant**: 3-4 cách trả lời cho mỗi intent
- ✅ **Learning**: Improve từ feedback
- ✅ **Personalization**: Tailored to each user
- ✅ **Analytics**: Track performance & optimize

**Bước tiếp theo**: Monitor, collect feedback, iterate! 🚀
