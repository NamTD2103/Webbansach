# 🤖 Hệ Thống Chatbot Nâng Cao - Web Bán Sách

## 📋 Mục Lục
1. [Tổng Quan](#tổng-quan)
2. [Kiến Trúc](#kiến-trúc)
3. [Thành Phần Chính](#thành-phần-chính)
4. [Cách Hoạt Động](#cách-hoạt-động)
5. [Hướng Dẫn Sử Dụng](#hướng-dẫn-sử-dụng)
6. [API Endpoints](#api-endpoints)
7. [Ví Dụ Thực Tế](#ví-dụ-thực-tế)

---

## 🎯 Tổng Quan

Hệ thống chatbot nâng cao này được thiết kế để:

✅ **Ghi nhớ thông tin người dùng** - Lưu trữ profile, sở thích, lịch sử mua hàng
✅ **Multi-Response Pool** - Lưu nhiều cách trả lời cho cùng một câu hỏi
✅ **Smart Selection** - Chọn response tốt nhất dựa trên context
✅ **Continuous Learning** - Cải thiện chất lượng từ feedback người dùng
✅ **Personalization** - Tùy chỉnh câu trả lời dựa trên từng user

---

## 🏗️ Kiến Trúc

### Cơ Sở Dữ Liệu

```
┌─────────────────────────────────────┐
│    CHATBOT_RESPONSE_POOL            │ ← Lưu nhiều response variants
├─────────────────────────────────────┤
│ - POOL_ID                           │
│ - INTENT_CATEGORY                   │
│ - RESPONSE_TYPE (SHORT/DETAILED...) │
│ - RESPONSE_TEMPLATE                 │
│ - RESPONSE_RANK (ưu tiên)           │
│ - USAGE_COUNT                       │
│ - AVERAGE_RATING                    │
│ - CONVERSION_COUNT                  │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│   CHATBOT_USER_PROFILE              │ ← User memory
├─────────────────────────────────────┤
│ - USER_ID                           │
│ - FAVORITE_CATEGORIES               │
│ - PRICE_RANGE                       │
│ - PURCHASE_BEHAVIOR                 │
│ - USER_PERSONALITY                  │
│ - INTERACTION_COUNT                 │
│ - CHURN_RISK                        │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│   CHATBOT_CONVERSATION_CONTEXT      │ ← Session context
├─────────────────────────────────────┤
│ - DEVICE_TYPE                       │
│ - ENTRY_POINT                       │
│ - USER_URGENCY                      │
│ - INTERACTION_PHASE                 │
│ - TIME_OF_DAY                       │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ CHATBOT_RESPONSE_SELECTION_LOG      │ ← Tracking selection
├─────────────────────────────────────┤
│ - MESSAGE_ID                        │
│ - POOL_ID                           │
│ - RESPONSE_TYPE                     │
│ - SELECTION_REASON                  │
│ - WAS_HELPFUL                       │
│ - CONVERSION_RESULT                 │
└─────────────────────────────────────┘
```

---

## 🔧 Thành Phần Chính

### 1. **Response Pool Manager** (`responsePoolManager.js`)

Quản lý việc chọn response tốt nhất từ pool.

**Functions:**
- `calculateResponseScore()` - Tính điểm cho mỗi response
- `selectBestResponse()` - Chọn response tốt nhất
- `prepareSelectionContext()` - Chuẩn bị context
- `renderResponse()` - Thay thế placeholders
- `createSelectionLog()` - Ghi lại lựa chọn
- `updateResponseStats()` - Cập nhật stats

### 2. **User Profile Manager** (`userProfileManager.js`)

Quản lý user memory và preferences.

**Functions:**
- `getUserProfile()` - Lấy profile
- `upsertUserProfile()` - Tạo/cập nhật profile
- `updateUserPreferences()` - Cập nhật sở thích
- `recordUserPurchase()` - Ghi lại mua hàng
- `calculateChurnRisk()` - Tính churn risk
- `getConversationContext()` - Lấy context cuộc trò chuyện
- `upsertConversationContext()` - Tạo/cập nhật context

### 3. **Enhanced Chatbot Routes** (`chatbot-enhanced.js`)

API endpoints cho chatbot.

**Endpoints:**
- `POST /api/chatbot/message` - Gửi message (smart response selection)
- `POST /api/chatbot/feedback` - Ghi nhận feedback
- `GET /api/chatbot/profile/:userId` - Lấy user profile
- `POST /api/chatbot/profile/:userId` - Cập nhật profile
- `POST /api/chatbot/profile/:userId/purchase` - Ghi lại purchase

---

## 🧠 Cách Hoạt Động

### Flow Chính: Khi User Gửi Message

```
1. RECEIVE MESSAGE
   └─ Validate message content
   
2. GET OR CREATE CONVERSATION
   └─ Check if exists, if not create
   
3. GET USER PROFILE & CONTEXT
   └─ Query CHATBOT_USER_PROFILE
   └─ Query CHATBOT_CONVERSATION_CONTEXT
   
4. DETECT INTENT
   └─ Analyze user message
   └─ Determine category (PAYMENT, SHIPPING, etc)
   
5. SELECT BEST RESPONSE
   ├─ Get response pool for intent
   ├─ Calculate score for each response:
   │  ├─ Base score = AVERAGE_RATING
   │  ├─ Bonus for context match = +0.1
   │  ├─ Bonus for confidence = +0.1
   │  ├─ Bonus for conversions = +0.2
   │  └─ Penalty for repetition = -0.15
   │
   └─ Sort and select top response
   
6. RENDER RESPONSE
   └─ Replace placeholders with user data
   
7. STORE IN DATABASE
   ├─ Save user message
   ├─ Save bot response
   ├─ Log selection reason
   ├─ Update stats
   └─ Update conversation metadata
   
8. UPDATE USER PROFILE
   ├─ Update interaction count
   ├─ Learn personality from interaction
   ├─ Update preferences
   └─ Update churn risk
   
9. RETURN RESPONSE TO USER
   └─ Include metadata for feedback
```

### Score Calculation Logic

```javascript
score = AVERAGE_RATING (base)
     + (context_matches × 0.1)        // Tag matching
     + 0.1 (if confidence >= threshold)
     + (conversion_rate × 0.2)        // Conversion bonus
     - 0.2 (if rarely used & low rated)
     - 0.15 (if recently used - avoid repetition)
```

---

## 💡 Hướng Dẫn Sử Dụng

### Setup Ban Đầu

#### 1. Chạy Database Schema

```bash
# Chạy file enhanced schema
cd backend
sqlplus username/password@database @database/chatbot-enhanced-schema.sql
```

#### 2. Initialize Response Pool

```bash
# Thêm các response variants vào database
node setup-chatbot-enhanced.js
```

### Sử Dụng Trong Frontend

#### 1. Gửi Message Với Context

```javascript
const response = await fetch('/api/chatbot/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 123,
    message: "Có sách Java không?",
    conversationId: existingConvId,
    contextData: {
      deviceType: 'MOBILE',        // or 'DESKTOP'
      entryPoint: 'PRODUCT_PAGE',  // Where user started
      userUrgency: 'HIGH',         // or 'MEDIUM', 'LOW'
      interactionPhase: 'DISCOVERY' // or 'CONSIDERATION', 'CHECKOUT'
    }
  })
});

const data = await response.json();
console.log(data.data.response);        // Bot response
console.log(data.data.responseType);    // 'SHORT', 'DETAILED', etc
console.log(data.data.selectionReason); // Why this response was chosen
```

#### 2. Ghi Nhận Feedback

```javascript
await fetch('/api/chatbot/feedback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messageId: 12345,
    helpful: 1,              // 1: helpful, -1: not helpful
    sentiment: 'SATISFIED',  // for tracking
    conversionResult: true   // Did user make purchase?
  })
});
```

#### 3. Cập Nhật User Profile

```javascript
await fetch('/api/chatbot/profile/123', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fullName: 'Nguyễn Văn A',
    email: 'user@example.com',
    favoriteCategories: ['Lập trình', 'Kỹ năng sống'],
    priceRange: { min: 100000, max: 500000 },
    budgetType: 'REGULAR'
  })
});
```

---

## 📡 API Endpoints

### POST /api/chatbot/message

**Mục đích:** Gửi message đến chatbot

**Request:**
```json
{
  "userId": "123",
  "message": "Có sách Java không?",
  "conversationId": "456",
  "sessionToken": "abc123",
  "contextData": {
    "deviceType": "MOBILE",
    "entryPoint": "PRODUCT_PAGE",
    "userUrgency": "MEDIUM",
    "interactionPhase": "DISCOVERY"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "conversationId": 456,
    "userMessageId": 1001,
    "botMessageId": 1002,
    "response": "Có, mình gợi ý một số sách Java sau...",
    "intent": "PRODUCT_SUGGESTION",
    "confidence": 0.95,
    "responseType": "PERSONALIZED",
    "selectionReason": "NEW_USER_PERSONALIZED",
    "responseTime": 234
  }
}
```

### POST /api/chatbot/feedback

**Mục đích:** Ghi nhận feedback từ user

**Request:**
```json
{
  "messageId": 1002,
  "helpful": 1,
  "sentiment": "SATISFIED",
  "conversionResult": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Feedback recorded"
}
```

### GET /api/chatbot/profile/:userId

**Mục đích:** Lấy profile của user

**Response:**
```json
{
  "success": true,
  "data": {
    "PROFILE_ID": 1,
    "USER_ID": "123",
    "FULL_NAME": "Nguyễn Văn A",
    "FAVORITE_CATEGORIES": [
      {
        "category": "Lập trình",
        "frequency": 3,
        "lastMentionedAt": "2024-01-15T10:00:00Z"
      }
    ],
    "INTERACTION_COUNT": 5,
    "TOTAL_PURCHASES": 2,
    "TOTAL_SPENT": 450000,
    "USER_PERSONALITY": "ANALYTICAL",
    "CHURN_RISK": 0.3
  }
}
```

### POST /api/chatbot/profile/:userId

**Mục đích:** Cập nhật user profile

**Request:**
```json
{
  "fullName": "Nguyễn Văn A",
  "email": "user@example.com",
  "favoriteCategories": ["Lập trình", "Kỹ năng sống"],
  "priceRange": { "min": 100000, "max": 500000 },
  "budgetType": "REGULAR"
}
```

### POST /api/chatbot/profile/:userId/purchase

**Mục đích:** Ghi lại lịch sử mua hàng

**Request:**
```json
{
  "amount": 150000,
  "categories": ["Lập trình"]
}
```

---

## 🎨 Ví Dụ Thực Tế

### Ví Dụ 1: User Hỏi Lần Đầu (New User)

```
User (Mobile, Busy): "Có sách Java không?"

SYSTEM LOGIC:
├─ Get profile → NOT EXISTS (new user)
├─ Detect intent → PRODUCT_SUGGESTION (0.95 confidence)
├─ Prepare context:
│  ├─ isFirstTime = true
│  ├─ deviceType = MOBILE
│  ├─ userUrgency = HIGH
│  └─ contextFlags = ['first_time', 'mobile', 'urgent']
│
├─ Get response pool for PRODUCT_SUGGESTION:
│  ├─ Response A (SHORT) - score = 0.7
│  ├─ Response B (DETAILED) - score = 0.4
│  └─ Response C (PERSONALIZED) - score = 0.6
│
└─ Select Response A (SHORT) - Best for busy new user

RESPONSE: "Bạn quan tâm loại sách nào? 📚
          🔵 Lập trình & Công nghệ
          🟢 Tiểu thuyết
          🟡 Tâm lý & Phát triển bản thân
          🟣 Kinh doanh"

METADATA:
- responseType: "SHORT"
- selectionReason: "NEW_USER_SHORT"
```

### Ví Dụ 2: User Quay Lại (Returning Customer)

```
User (Desktop, VIP): "Có sách Java không?"

SYSTEM LOGIC:
├─ Get profile → EXISTS (3 lần chat trước)
│  ├─ favoriteCategories = [{category: "Lập trình", frequency: 2}]
│  ├─ purchaseFrequency = FREQUENT
│  ├─ isVIP = true
│  └─ preferredResponseType = DETAILED
│
├─ Detect intent → PRODUCT_SUGGESTION (0.98)
├─ Prepare context:
│  ├─ isFirstTime = false
│  ├─ isVIP = true
│  ├─ deviceType = DESKTOP
│  └─ contextFlags = ['vip', 'returning_customer', 'desktop']
│
├─ Get response pool:
│  ├─ Response A (SHORT) - score = 0.5
│  ├─ Response B (DETAILED) - score = 0.85 ✅ BEST
│  └─ Response C (PERSONALIZED) - score = 0.8
│
└─ Select Response C (PERSONALIZED) - VIP + returning + detailed

RESPONSE: "Xin chào Nguyễn Văn A! 👋

          Bạn thích Lập trình, đúng không? 📚

          Top 5 sách Lập trình bán chạy:
          1. 'Lập Trình Python' - 250k
          2. 'Clean Code' - 320k
          3. 'Design Patterns' - 280k
          ...

          Bạn muốn xem chi tiết sách nào?"

METADATA:
- responseType: "PERSONALIZED"
- selectionReason: "RETURNING_VIP_CUSTOMER"
```

### Ví Dụ 3: Learning từ Feedback

```
Message 1 (Bot response A - DETAILED):
├─ Response: "Chúng tôi hỗ trợ 2 phương thức..."
├─ User feedback: helpful = 1, conversionResult = true ✅
└─ Impact:
   ├─ AVERAGE_RATING += 0.3
   ├─ CONVERSION_COUNT += 1
   └─ RESPONSE_RANK nâng lên

Message 2 (Bot response B - SHORT):
├─ Response: "COD hoặc Chuyển khoản"
├─ User feedback: helpful = -1 ❌
└─ Impact:
   ├─ AVERAGE_RATING -= 0.3
   └─ RESPONSE_RANK giảm xuống

Result:
→ Hệ thống sẽ ưu tiên Response A hơn trong tương lai
→ Tăng chất lượng response dần dần
```

---

## 📊 Response Types

| Type | Khi Nào Dùng | Ví Dụ |
|------|-------------|--------|
| **SHORT** | User vội, mobile | "COD hoặc Chuyển khoản?" |
| **DETAILED** | Desktop, analytical user | Chi tiết từng option |
| **PERSONALIZED** | Returning customer | "Hi Nguyễn Văn A, bạn thích..." |
| **UPSELL** | Checkout phase, VIP | "Thêm combo này giảm 20%?" |
| **CONVERSATIONAL** | New user, uncertain | "Bạn muốn tìm gì? 😊" |

---

## 🎯 Selection Factors

Khi chọn response, hệ thống xem xét:

1. **User Profile**
   - Lần đầu hay returning customer?
   - VIP hay regular?
   - Personality (DIRECT, ANALYTICAL, CONVERSATIONAL)?
   - Churn risk cao không?

2. **Conversation Context**
   - Device type (mobile vs desktop)?
   - Urgency level?
   - Entry point?
   - Time of day?

3. **Recent History**
   - Có repeat không để tránh lặp lại?
   - Response nào hiệu quả trước?

4. **Performance Metrics**
   - Average rating của response?
   - Conversion rate?
   - Usage count?

---

## 🚀 Best Practices

### 1. Admin - Quản Lý Response Pool

✅ Tạo 3-4 variants cho mỗi intent
✅ Test từng response type
✅ Monitor performance metrics
✅ Update dựa trên feedback

### 2. Frontend - Gửi Đủ Context

✅ Luôn gửi `contextData`
✅ Track `deviceType` chính xác
✅ Gửi `interactionPhase`
✅ Ghi nhận feedback sau mỗi response

### 3. Backend - Optimize Learning

✅ Normalize response score (0-1)
✅ Use exponential moving average cho rating
✅ Penalize overused responses
✅ Reward high-conversion responses

---

## 📈 Metrics Để Monitor

- **Response Quality**: Average rating per response type
- **Conversion Rate**: % responses leading to purchase
- **Churn Risk**: User segments at risk of leaving
- **User Segmentation**: Personality types, budget types
- **Peak Hours**: Khi nào user active nhất?
- **Device Distribution**: Mobile vs Desktop engagement

---

## 🔐 Security Notes

- Lưu userId securely, không expose
- Hash sensitive preference data nếu cần
- Validate tất cả input trước processing
- Log mọi feedback cho audit trail
- GDPR compliant data retention policy

---

## 📞 Support

Để thêm response mới:
1. Add vào `responsePoolData` trong `setup-chatbot-enhanced.js`
2. Chạy setup script
3. Monitor performance
4. Adjust dựa trên feedback

