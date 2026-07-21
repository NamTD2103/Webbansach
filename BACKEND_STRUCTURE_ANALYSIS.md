# 📊 Web Bán Sách - Backend Node.js Structure Analysis

**Generated:** April 23, 2026  
**Project Path:** `d:\webbansach\backend\`  
**Database:** Oracle Database  
**Framework:** Express.js + Node.js

---

## 📑 Table of Contents

1. [Entry Point & Configuration](#entry-point--configuration)
2. [API Routes Structure](#api-routes-structure)
3. [Database Architecture](#database-architecture)
4. [Utilities & Helpers](#utilities--helpers)
5. [Middleware](#middleware)
6. [Environment Configuration](#environment-configuration)
7. [Potential Issues & Missing Features](#potential-issues--missing-features)

---

## Entry Point & Configuration

### Server Entry Point

**File:** [server.js](server.js)  
**Lines:** 1-150

**Key Information:**
- **Port:** `5000` (configurable via `PORT` env var)
- **Health Check Endpoint:** `GET /health`
- **Database:** Initialized via `initializePool()` from `config/db.js`
- **CORS:** Enabled globally
- **Request Logger:** Active for all requests
- **Graceful Shutdown:** Handles `SIGINT` and `SIGTERM` signals

**Server Initialization Flow:**
```
startServer()
  → initializePool() - Oracle connection pool
  → app.listen() - Start Express server
  → console logging
```

**Middleware Stack:**
```javascript
express.json()
express.urlencoded({ extended: true })
cors()
requestLogger
// ... route handlers
404 handler
errorHandler
```

---

## API Routes Structure

### 1. **Authentication Routes** (`/api/auth`)

**File:** [routes/auth.js](routes/auth.js)  
**Lines:** 1-1100+  
**Auth Type:** JWT-based (Access Token + Refresh Token)  
**Rate Limiting:** Multiple limiters applied

#### Endpoints:

| Method | Endpoint | Authentication | Description |
|--------|----------|----------------|-------------|
| POST | `/register` | None | User registration with email verification |
| POST | `/verify-email` | None | Verify email with verification code |
| POST | `/resend-verification` | None | Resend verification email (rate limited) |
| POST | `/login` | None | User login with credentials (rate limited) |
| POST | `/refresh-token` | None | Refresh access token using refresh token |
| POST | `/forgot-password` | None | Initiate password reset (rate limited) |
| POST | `/reset-password` | None | Reset password with token |
| POST | `/logout` | Bearer Token | User logout |
| GET | `/profile` | Bearer Token | Get current user profile |
| PUT | `/profile` | Bearer Token | Update user profile |
| POST | `/change-password` | Bearer Token | Change account password |

**Key Features:**
- Email verification system
- Password reset with email token
- JWT access + refresh token system
- Rate limiting (3 registers/hour, 5 logins/15 min)
- Request logging
- Account status checking
- Password strength validation

**Parameters Validation:**
- `email`: Valid email format, max 255 chars
- `username`: Unique, sanitized
- `password`: Min 8 chars, uppercase, lowercase, numbers required
- `fullName`, `phone`: Optional

**Response Format:**
```json
{
  "success": true/false,
  "message": "...",
  "data": {
    "userId": number,
    "accessToken": "jwt...",
    "refreshToken": "jwt...",
    "expiresIn": 900
  },
  "errors": []
}
```

---

### 2. **Product Routes** (`/api/product`)

**File:** [routes/product.js](routes/product.js)  
**Lines:** 1-250+

#### Endpoints:

| Method | Endpoint | Auth | Query/Body Parameters | Description |
|--------|----------|------|----------------------|-------------|
| GET | `/` | None | `limit` (0-100), `page` | List all products with pagination |
| GET | `/search/query` | None | `q` (keyword) | Search products by name or description |
| GET | `/:id` | None | `id` (product ID) | Get single product details |
| POST | `/` | ADMIN | `TENSP`, `GIABAN`, `SOLUONGTON`, `HINHANH`, `MOTA`, `MANCC` | Create new product (admin only) |
| PUT | `/:id` | ADMIN | `TENSP`, `GIABAN`, `SOLUONGTON`, `HINHANH`, `MOTA`, `MANCC` | Update product (admin only) |
| DELETE | `/:id` | ADMIN | `id` | Delete product (admin only) |

**Database Columns:**
- `MASP` (varchar2): Product ID
- `TENSP` (varchar2): Product name
- `GIABAN` (number): Price
- `SOLUONGTON` (number): Stock quantity
- `HINHANH` (varchar2): Image URL
- `MOTA` (varchar2): Description
- `MANCC` (varchar2): Supplier code

**Response Structure:**
```json
{
  "success": true,
  "data": [{
    "MASP": "SP...",
    "TENSP": "Book Name",
    "GIABAN": 150000,
    "SOLUONGTON": 50,
    "IMAGE_URL": "...",
    "DESCRIPTION": "...",
    "MANCC": "..."
  }],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

### 3. **Cart Routes** (`/api/cart`)

**File:** [routes/cart.js](routes/cart.js)  
**Lines:** 1-200+

#### Endpoints:

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|-----------|
| POST | `/add` | Add product to cart | `userId`, `masp`, `soluong` |
| GET | `/:userId` | Get user's cart | `userId` (path) |
| DELETE | `/item/:userId/:masp` | Remove item from cart | `userId`, `masp` (path) |

**Logic:**
- Auto-creates cart if not exists
- Validates product stock before adding
- Merges quantities if item already in cart
- Tracks `CART_ID`, `ITEM_ID` via sequences

**Cart Structure:**
```
CART
├── CART_ID (PK)
├── USER_ID (FK)
└── CART_ITEM
    ├── ITEM_ID (PK)
    ├── CART_ID (FK)
    ├── MASP (FK)
    └── SOLUONG
```

---

### 4. **Order Routes** (`/api/order`)

**File:** [routes/order.js](routes/order.js)  
**Lines:** 1-400+

#### Endpoints:

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|-----------|
| POST | `/create` | Create order from cart | `userId`, `paymentMethod` |
| POST | `/add-item` | Manually add item to order | `orderId`, `masp`, `soluong`, `price` |
| GET | `/:orderId` | Get order details | `orderId` (path) |
| GET | `/user/:userId` | Get user's orders | `userId` (path), `limit`, `page` |

**Order Creation Process:**
1. Fetch cart items for user
2. Calculate total amount
3. Create order record (status: PENDING)
4. Create order items from cart items
5. Reduce stock for each product
6. Clear cart items
7. Return `orderId`, `totalAmount`, `itemCount`

**Order Status:**
- `PENDING` - Order created, waiting for payment
- `PAID` - Payment confirmed
- `PROCESSING` - Order processing
- `COMPLETED` - Order delivered
- `CANCELLED` - Order cancelled

---

### 5. **Payment Routes** (`/api/payment`)

**File:** [routes/payment.js](routes/payment.js)  
**Lines:** 1-600+

#### Endpoints:

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|-----------|
| POST | `/create-payment-url` | Create VNPay payment URL | `orderId`, `amount`, `userId`, `email`, `phone`, `bankCode`, `ipAddress` |
| GET | `/return` | Handle VNPay return redirect | VNPay query params (`vnp_*`) |
| POST | `/ipn` | VNPay IPN webhook | VNPay IPN data |
| POST | `/query-status` | Query payment status | `transactionId`, `transactionNo`, `transactionDate` |
| POST | `/refund` | Request refund | `transactionId`, `orderId`, `refundAmount`, `reason` |
| GET | `/transaction-history/:userId` | Get payment history | `userId`, `limit`, `offset` |

**VNPay Integration:**
- **Sandbox URL:** `https://sandbox.vnpayment.vn/paygate`
- **Config File:** [config/vnpay.js](config/vnpay.js)
- **Required ENV Vars:**
  - `VNPAY_TMN_CODE` - Merchant code
  - `VNPAY_SECRET_KEY` - Secret key for hashing
  - `VNPAY_RETURN_URL` - Return URL after payment
  - `VNPAY_IPN_URL` - IPN webhook URL

**Payment Flow:**
```
POST /create-payment-url
  ↓
Generate VNPay URL (with secure hash)
  ↓
Store PAYMENT_TRANSACTIONS record
  ↓
Return paymentUrl to frontend
  ↓
User redirected to VNPay
  ↓
After payment → GET /return (browser redirect)
  ↓
VNPay server → POST /ipn (background webhook)
  ↓
Update PAYMENT_TRANSACTIONS & ORDERS status
```

**Transaction Table:**
```
PAYMENT_TRANSACTIONS
├── TRANSACTION_ID (PK, varchar2)
├── ORDER_ID (FK)
├── USER_ID (FK)
├── AMOUNT (number)
├── STATUS (PENDING/SUCCESS/FAILED)
├── RESPONSE_CODE (VNPay response)
├── PAYMENT_METHOD (VNPAY, COD)
├── BANK_CODE (NCB, AGRIBANK, etc.)
├── BANK_TRAN_NO
├── TRANSACTION_NO
├── PAY_DATE (YYYYMMDDHHmmss)
└── TRANSACTION_DATA (CLOB - full response JSON)
```

---

### 6. **Admin Routes** (`/api/admin`)

**File:** [routes/admin.js](routes/admin.js)  
**Lines:** 1-400+  
**Auth Required:** ADMIN role only

#### Endpoints:

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|-----------|
| GET | `/users` | Get all users | None |
| GET | `/users/:userId` | Get user details with orders | `userId` |
| PUT | `/users/:userId` | Update user info/role | `email`, `fullname`, `role` |
| GET | `/orders` | Get all orders | `limit`, `offset`, `status` |
| GET | `/orders/:orderId` | Get order details | `orderId` |
| PUT | `/orders/:orderId` | Update order status | `status` |
| DELETE | `/users/:userId` | Delete user account | `userId` |

**Admin Permissions:**
- User management
- Order management
- Status tracking
- User role assignment

---

### 7. **Category Routes** (`/api/category`)

**File:** [routes/category.js](routes/category.js)  
**Lines:** 1-50

#### Endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all categories |

**Database Table:**
```
CATEGORY
├── CAT_ID
└── CAT_NAME
```

---

### 8. **Profile Routes** (`/api/profile`)

**File:** [routes/profile.js](routes/profile.js)  
**Lines:** 1-500+

#### Endpoints:

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|-----------|
| GET | `/:userId` | Get complete user profile | `userId` |
| PUT | `/:userId` | Update user profile | `email`, `fullname` |
| GET | `/:userId/insights` | Get reading insights | `userId` |
| GET | `/:userId/analytics` | Get user analytics | `userId` |
| GET | `/:userId/wishlist` | Get wishlist items | `userId` |
| POST | `/:userId/wishlist` | Add to wishlist | `userId`, `masp` |
| DELETE | `/:userId/wishlist/:wishlistId` | Remove from wishlist | `userId`, `wishlistId` |
| GET | `/:userId/reviews` | Get user's reviews | `userId`, `limit` |
| GET | `/:userId/personalized-recommendations` | Get personalized book recommendations | `userId` |

**Profile Data Includes:**
- User basic info
- Addresses
- Reading analytics
- Insights & preferences
- Recent orders
- Wishlist count
- Review count

---

### 9. **Recommendations Routes** (`/api/recommendations`)

**File:** [routes/recommendations.js](routes/recommendations.js)  
**Lines:** 1-400+

#### Endpoints:

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|-----------|
| GET | `/:userId` | Get personalized recommendations | `userId`, `limit` |
| GET | `/:userId/preferences` | Get user book preferences | `userId` |
| PUT | `/:userId/preferences` | Update book preferences | `userId`, preference data |
| POST | `/:userId/track-interaction` | Track user interaction | `userId`, `masp`, `interactionType` |
| GET | `/:userId/history` | Get interaction history | `userId`, `limit` |
| POST | `/:userId/feedback` | Submit recommendation feedback | `userId`, `feedbackData` |
| GET | `/trending` | Get trending books | `limit` |
| GET | `/:userId/similar/:masp` | Get similar books | `userId`, `masp` |
| GET | `/analytics/dashboard` | Get recommendation analytics | None |

**Recommendation Engine:**
- Based on user preferences
- Similar book matching
- Interaction tracking
- Trending analysis

---

### 10. **Review Routes** (`/api/review`)

**File:** [routes/review.js](routes/review.js)  
**Lines:** 1-300+

#### Endpoints:

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|-----------|
| POST | `/` | Create new review | `productId`, `userId`, `rating`, `title`, `content`, `verifiedPurchase` |
| GET | `/product/:productId` | Get product reviews | `productId`, `limit`, `offset`, `sort` |
| GET | `/product/:productId/summary` | Get review summary | `productId` |
| POST | `/:reviewId/like` | Mark review as helpful | `reviewId` |
| POST | `/:reviewId/report` | Report inappropriate review | `reviewId`, `reason` |

**Review Table Structure:**
```
PRODUCT_REVIEWS
├── REVIEW_ID (PK)
├── PRODUCT_ID (FK)
├── USER_ID (FK)
├── RATING (1-5)
├── TITLE
├── CONTENT
├── VERIFIED_PURCHASE (boolean)
├── SENTIMENT (analyzed)
├── HELPFUL_COUNT
├── UNHELPFUL_COUNT
├── STATUS (PUBLISHED/PENDING/HIDDEN)
└── CREATED_AT
```

**Sentiment Analysis:** Using `reviewAIEngine` utility

---

### 11. **Chatbot Routes** (`/api/chatbot`)

**File:** [routes/chatbot.js](routes/chatbot.js)  
**Lines:** 1-500+

#### Endpoints:

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|-----------|
| POST | `/message` | Send message to chatbot | `userId`, `message`, `conversationId`, `sessionToken` |
| GET | `/conversations/:userId` | Get user conversations | `userId`, `limit` |
| GET | `/messages/:conversationId` | Get conversation messages | `conversationId`, `limit` |
| POST | `/feedback` | Submit chatbot feedback | `conversationId`, `feedback` |
| GET | `/preferences/:userId` | Get chat preferences | `userId` |
| POST | `/preferences/:userId` | Update chat preferences | `userId`, preferences |
| GET | `/faq` | Get FAQ list | None |
| GET | `/stats` | Get chatbot statistics | None |

**Chatbot Tables:**
```
CHATBOT_CONVERSATIONS
├── CONVERSATION_ID
├── USER_ID
├── SESSION_TOKEN
└── CREATED_AT

CHATBOT_MESSAGES
├── MESSAGE_ID
├── CONVERSATION_ID
├── USER_ID
├── MESSAGE_TYPE (user/bot)
├── CONTENT
└── CREATED_AT

CHATBOT_USER_PREFERENCES
├── PREF_ID
├── USER_ID
├── CATEGORY_INTEREST
├── PRICE_RANGE
└── CREATED_AT
```

---

### 12. **Chatbot Enhanced Routes** (`/api/chatbot` via enhanced)

**File:** [routes/chatbot-enhanced.js](routes/chatbot-enhanced.js)  
**Lines:** 1-500+

**Advanced Features:**
- Smart response selection
- User profile tracking
- Purchase recording
- Conversation context
- Churn risk calculation

#### Additional Endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/feedback` | Record chatbot feedback with metrics |
| GET | `/profile/:userId` | Get chatbot user profile |
| POST | `/profile/:userId` | Update chatbot user profile |
| POST | `/profile/:userId/purchase` | Record user purchase for analytics |

---

## Database Architecture

### Core Database Configuration

**File:** [config/db.js](config/db.js)  
**Database:** Oracle (oracledb v6.0.0)

**Connection Pool Configuration:**
```javascript
{
  poolMin: 2 (default),
  poolMax: 10 (default),
  poolIncrement: 1,
  poolTimeout: 60s,
  queueTimeout: 60000ms,
  stmtCacheSize: 30,
  poolPingInterval: 60s
}
```

**Key Functions:**
- `initializePool()` - Initialize Oracle connection pool
- `getConnection()` - Get connection from pool
- `executeQuery(sql, binds)` - SELECT operations
- `executeUpdate(sql, binds)` - INSERT/UPDATE/DELETE operations
- `closePool()` - Close all connections (graceful shutdown)

**Output Format:** `OUT_FORMAT_OBJECT` (returns objects instead of arrays)  
**CLOB Handling:** Automatically converts CLOB to STRING

---

### Database Initialization

**File:** [init-db.js](init-db.js)  
**Lines:** 1-250

**Tables Created:**

| Table | Purpose | Key Columns |
|-------|---------|------------|
| `USERS` | User accounts | USER_ID, USERNAME, EMAIL, PASSWORD_HASH, FULLNAME, ROLE (USER/ADMIN), CREATED_AT |
| `CART` | Shopping carts | CART_ID, USER_ID, CREATED_AT |
| `CART_ITEM` | Cart items | ITEM_ID, CART_ID, MASP, SOLUONG, UNIQUE(CART_ID, MASP) |
| `ORDERS` | Orders | ORDER_ID, USER_ID, STATUS (PENDING/PROCESSING/COMPLETED/CANCELLED), TOTAL_AMOUNT, PAYMENT_METHOD, ORDER_DATE |
| `ORDER_ITEMS` | Order line items | ITEM_ID, ORDER_ID, MASP, SOLUONG, PRICE |
| `PAYMENTS` | Payment records | PAYMENT_ID, ORDER_ID, AMOUNT, STATUS (PENDING/COMPLETED/FAILED), PAYMENT_DATE |
| `ADDRESS` | User addresses | ADDR_ID, USER_ID, ADDRESS, CITY, PHONE, IS_DEFAULT |
| `AUDIT_LOG` | Audit trail | LOG_ID, TABLE_NAME, OPERATION, USER_ID, TIMESTAMP, DETAILS |

**Sequences Created:**
```sql
users_seq, cart_seq, cart_item_seq, orders_seq, 
order_items_seq, payments_seq, address_seq, audit_log_seq
```

---

### Payment-Related Schema

**File:** [database/vnpay-schema.sql](database/vnpay-schema.sql)

**Additional Tables:**

| Table | Purpose | Columns |
|-------|---------|---------|
| `PAYMENT_TRANSACTIONS` | Payment tracking | TRANSACTION_ID, ORDER_ID, USER_ID, AMOUNT, STATUS, RESPONSE_CODE, PAYMENT_METHOD, BANK_CODE, BANK_TRAN_NO, TRANSACTION_NO, PAY_DATE, TRANSACTION_DATA (CLOB) |
| `REFUND_REQUESTS` | Refund management | REFUND_ID, TRANSACTION_ID, ORDER_ID, AMOUNT, REASON, STATUS, RESPONSE_CODE, REFUND_TRANSACTION_NO, NOTES |

**Indexes:**
- `idx_payment_order` on ORDER_ID
- `idx_payment_user` on USER_ID
- `idx_payment_status` on STATUS
- `idx_payment_created` on CREATED_AT
- `idx_refund_transaction`, `idx_refund_order`, `idx_refund_status`

---

### Chatbot Schema

**File:** [database/chatbot-schema.sql](database/chatbot-schema.sql)

**Tables:**
- `CHATBOT_CONVERSATIONS` - Conversation tracking
- `CHATBOT_MESSAGES` - Message history
- `CHATBOT_USER_PREFERENCES` - User preferences
- `CHATBOT_LEARNING` - Learning data
- `CHATBOT_QUICK_RESPONSES` - Pre-defined responses

**Enhanced Schema:** [database/chatbot-enhanced-schema.sql](database/chatbot-enhanced-schema.sql)
- `CHATBOT_RESPONSE_POOL` - Response library
- `CHATBOT_RESPONSE_SELECTION_LOG` - Selection history
- `CHATBOT_USER_PROFILE` - Advanced user profiling
- `CHATBOT_QUESTION_VARIANTS` - Question pattern matching
- `CHATBOT_CONVERSATION_CONTEXT` - Context management
- `CHATBOT_PERFORMANCE_METRICS` - Performance tracking

---

### Recommendation Schema

**File:** [database/book-recommendation-schema.sql](database/book-recommendation-schema.sql)

**Tables:**
- `BOOK_METADATA` - Book details & attributes
- `USER_BOOK_PREFERENCES` - User reading preferences
- `BOOK_READING_HISTORY` - Reading history
- `BOOK_RECOMMENDATIONS` - Generated recommendations
- `RECOMMENDATION_FEEDBACK` - User feedback on recommendations
- `SIMILAR_BOOKS` - Book similarity scores
- `RECOMMENDATION_ANALYTICS` - Analytics data

---

### Review & Wishlist Schema

**File:** [database/review-wishlist-system.sql](database/review-wishlist-system.sql)

**Tables:**
- `PRODUCT_REVIEWS` - Product reviews with sentiment
- `REVIEW_IMAGES` - Review images
- `REVIEW_LIKES` - Review helpfulness tracking
- `USER_WISHLIST` - User wishlist items

---

### Profile Enhancement Schema

**File:** [database/user-profile-enhancement-schema.sql](database/user-profile-enhancement-schema.sql)

**Tables:**
- `USER_READING_ANALYTICS` - Reading behavior analytics
- `USER_PROFILE_COMPLETENESS` - Profile completeness tracking
- Additional profile-related tables

---

## Utilities & Helpers

### 1. **Authentication Utilities**

**File:** [utils/authUtils.js](utils/authUtils.js)  
**Lines:** 1-150+

**Key Functions:**

| Function | Purpose | Returns |
|----------|---------|---------|
| `hashPassword(password)` | Hash password with bcrypt | Promise<string> |
| `comparePassword(password, hash)` | Verify password | Promise<boolean> |
| `generateAccessToken(userId, email, role, expiresIn)` | Create access JWT | string |
| `generateRefreshToken(userId, tokenId, expiresIn)` | Create refresh JWT | string |
| `verifyAccessToken(token)` | Validate access token | object (decoded) |
| `verifyRefreshToken(token)` | Validate refresh token | object (decoded) |
| `generateVerificationCode(length)` | Generate email verification code | string |
| `generateSecureToken()` | Generate password reset token | string |
| `hashToken(token)` | Hash token for storage | string |
| `verifyTokenHash(token, hash)` | Verify token hash | boolean |

**JWT Configuration:**
- Access Token: 900 seconds (15 minutes)
- Refresh Token: 604800 seconds (7 days)
- Algorithm: HS256
- Secrets: `JWT_SECRET`, `JWT_REFRESH_SECRET` (env vars)

**Validation:**
- Checks for minimum 32-character secrets
- Warns if secrets are default values
- Throws error if secrets not configured

---

### 2. **Validators**

**File:** [utils/validators.js](utils/validators.js)  
**Lines:** 1-200+

**Validation Functions:**

| Function | Purpose |
|----------|---------|
| `validateEmail(email)` | Email format & length check |
| `validatePassword(password, options)` | Password strength validation |
| `validateUsername(username)` | Username format check |
| `validatePhoneNumber(phone)` | Phone format validation |
| `validateRegistration(data)` | Complete registration validation |
| `sanitizeInput(input)` | Input sanitization |

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Optional special characters
- Maximum 128 characters

---

### 3. **Email Service**

**File:** [utils/emailService.js](utils/emailService.js)

**Functions:**
- `initializeEmailService()` - Initialize email provider
- `sendVerificationEmail(email, verificationCode)` - Send verification email
- `sendPasswordResetEmail(email, resetToken)` - Send reset password email

**Email Providers Supported:**
- Gmail
- SendGrid
- Custom SMTP

**Configuration (ENV vars):**
```
EMAIL_PROVIDER=smtp|gmail|sendgrid
EMAIL_FROM=noreply@...
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
GMAIL_EMAIL, GMAIL_PASSWORD
SENDGRID_API_KEY
```

---

### 4. **Rate Limiter**

**File:** [utils/rateLimiter.js](utils/rateLimiter.js)

**Limiters:**

| Limiter | Limits | Window |
|---------|--------|--------|
| `loginLimiter` | 5 attempts | 15 minutes |
| `registerLimiter` | 3 registrations | 1 hour |
| `passwordResetLimiter` | 3 attempts | 1 hour |
| `verificationResendLimiter` | 5 requests | 1 hour |

**Implementation:** express-rate-limit (v6.7.0)

---

### 5. **Book Recommendation Engine**

**File:** [utils/bookRecommendationEngine.js](utils/bookRecommendationEngine.js)

**Key Methods:**
- `generatePersonalizedRecommendations(userId, limit)` - Generate personalized book recommendations
- `getUserBookPreferences(userId)` - Get user preferences
- `calculateSimilarBooks(masp, limit)` - Find similar books
- `trackUserInteraction(userId, masp, interactionType)` - Track user behavior

**Algorithm Factors:**
- User purchase history
- Review ratings
- Wishlist items
- Category preferences
- Reading history
- Similar user behavior

---

### 6. **Chatbot Utilities**

**File:** [utils/chatbotUtils.js](utils/chatbotUtils.js)

**Functions:**
- `detectIntent(message)` - Detect user intent
- `generateResponse(message, userContext)` - Generate bot response
- `extractKeywords(message)` - Extract keywords
- `recordFeedback(conversationId, feedback)` - Record feedback
- `calculateUserPreferences(userId)` - Calculate preferences

**Intent Detection:**
- Product inquiry
- Order status
- Payment issues
- General questions
- Recommendations
- Support requests

---

### 7. **Review AI Engine**

**File:** [utils/reviewAIEngine.js](utils/reviewAIEngine.js)

**Functions:**
- `generateReviewSummary(reviews)` - Summarize reviews
- `analyzeSentiment(content)` - Analyze review sentiment

**Sentiment Analysis:**
- Positive (score > 0.6)
- Neutral (0.4 ≤ score ≤ 0.6)
- Negative (score < 0.4)

---

### 8. **User Insights Generator**

**File:** [utils/userInsightsGenerator.js](utils/userInsightsGenerator.js)

**Functions:**
- `generateUserInsights(userId)` - Generate reading insights
- `getUserInsights(userId)` - Retrieve insights
- `updateUserAnalytics(userId)` - Update analytics

**Insights Include:**
- Total books viewed
- Total books purchased
- Total books reviewed
- Total spending
- Favorite categories
- Reading frequency
- Preferred authors

---

### 9. **VNPay Utilities**

**File:** [utils/vnpayUtils.js](utils/vnpayUtils.js)

**Functions:**
- `createPaymentUrl(paymentData)` - Generate VNPay URL
- `verifyHash(params)` - Verify secure hash
- `parseReturnData(params)` - Parse VNPay response
- `isPaymentSuccessful(responseCode)` - Check payment status
- `getPaymentStatusDescription(responseCode)` - Get status message
- `generateHash(params, secret)` - Generate secure hash
- `formatDate(date)` - Format date (YYYYMMDDHHmmss)

**Hash Algorithm:** SHA-256 (HMAC)  
**Payment Status Codes:**
- `00` - Success
- `01` - Unknown error
- `02` - Bad request
- `04` - Fraud detection
- `05` - Invalid merchant
- `07` - Temporary error

---

### 10. **Response Pool Manager** (Chatbot Enhancement)

**File:** [utils/responsePoolManager.js](utils/responsePoolManager.js)

**Functions:**
- `selectBestResponse(intent, context)` - Select best response
- `prepareSelectionContext(userId, conversationId)` - Prepare context
- `renderResponse(template, data)` - Render response
- `createSelectionLog(data)` - Log response selection
- `updateResponseStats(responseId, metrics)` - Update statistics

---

### 11. **User Profile Manager** (Chatbot Enhancement)

**File:** [utils/userProfileManager.js](utils/userProfileManager.js)

**Functions:**
- `getUserProfile(userId)` - Retrieve user profile
- `upsertUserProfile(userId, data)` - Create/update profile
- `updateUserPreferences(userId, preferences)` - Update preferences
- `recordUserPurchase(userId, orderData)` - Record purchase
- `calculateChurnRisk(userId)` - Calculate churn risk
- `getConversationContext(conversationId)` - Get context
- `upsertConversationContext(conversationId, data)` - Update context

---

### 12. **Chatbot Integration** (with Recommendations)

**File:** [utils/chatbotRecommendationIntegration.js](utils/chatbotRecommendationIntegration.js)

**Functions:**
- `getContextualRecommendations(userId, conversationContext)` - Recommendations based on chat context
- `integrateRecommendationsInResponse(message, recommendations)` - Add recommendations to response

---

## Middleware

### Authentication Middleware

**File:** [middleware/auth.js](middleware/auth.js)

**Functions:**

| Function | Purpose | Behavior |
|----------|---------|----------|
| `verifyToken(req, res, next)` | Verify JWT token | Extracts from Authorization header, validates, attaches to req.user |
| `verifyTokenOptional(req, res, next)` | Optional verification | Validates if present, doesn't fail if absent |
| `requireRole(roles)` | Role check | Returns 403 if user lacks required role |
| `requireAdmin(req, res, next)` | Admin-only | Shorthand for role: ADMIN |
| `requireEmailVerified(req, res, next)` | Email verification check | Checks if email verified |
| `checkAccountStatus(req, res, next)` | Account status check | Prevents locked/blocked accounts |
| `logAuthRequest(req, res, next)` | Auth request logging | Logs authentication attempts |

**Token Location:** Authorization header  
**Format:** `Bearer <jwt_token>`

**Error Responses:**
```json
{
  "success": false,
  "message": "Missing or invalid authorization header" | "Invalid token" | "Access denied"
}
```

---

### Error & Request Middleware

**File:** [middleware/index.js](middleware/index.js)

**Exported Middleware:**

| Middleware | Purpose |
|-----------|---------|
| `errorHandler(err, req, res, next)` | Global error handler |
| `requestLogger(req, res, next)` | Request/response logging |
| `cors(req, res, next)` | CORS headers (custom) |

**Error Handler Response:**
```json
{
  "success": false,
  "status": 500,
  "message": "...",
  "stack": "..." (dev only)
}
```

**Request Logger:** Logs method, path, status code, duration (ms)

---

## Environment Configuration

### Environment Variables

**File:** [.env.example](.env.example)

**Template Variables:**

#### Database Configuration
```env
DB_USER=system
DB_PASSWORD=your-secure-oracle-password
DB_CONNECT_STRING=localhost:1521/orcl21pdb1
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_INCREMENT=1
DB_POOL_TIMEOUT=60
DB_QUEUE_TIMEOUT=60000
DB_STMT_CACHE=30
DB_PING_INTERVAL=60
```

#### JWT Configuration
```env
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_ACCESS_EXPIRY=900
JWT_REFRESH_EXPIRY=604800
```

#### Email Configuration
```env
EMAIL_PROVIDER=smtp
EMAIL_FROM=noreply@cloudyinsouth.com
APP_NAME=CloudyInSouth
APP_URL=http://localhost:3000

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

#### VNPay Configuration
```env
VNPAY_TMN_CODE=TESTMERCHANT
VNPAY_SECRET_KEY=TESTKEY
VNPAY_HASH_SECRET=TESTKEY
VNPAY_MERCHANT_ID=000000
VNPAY_MERCHANT_NAME=Web Bán Sách
VNPAY_RETURN_URL=http://localhost:3000/order-success
VNPAY_IPN_URL=http://localhost:5000/api/payment/ipn
VNPAY_URL=https://sandbox.vnpayment.vn/paygate
VNPAY_API_URL=https://sandbox.vnpayment.vn/merchant_webapi/merchant_information
```

#### Security Configuration
```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,https://yourdomain.com
RATE_LIMIT_ENABLED=true
LOGIN_RATE_LIMIT_ATTEMPTS=5
LOGIN_RATE_LIMIT_WINDOW=900000
```

#### Server Configuration
```env
PORT=5000
NODE_ENV=development
LOG_LEVEL=info
```

---

## Potential Issues & Missing Features

### ⚠️ Critical Issues

1. **JWT Secrets in Code**
   - **File:** [utils/authUtils.js](utils/authUtils.js#L7)
   - **Issue:** Default secrets used if env vars not set
   - **Risk:** Security vulnerability in production
   - **Fix:** Always set `JWT_SECRET` and `JWT_REFRESH_SECRET` env vars

2. **Database Credentials**
   - **File:** [config/db.js](config/db.js#L4)
   - **Issue:** Default credentials (system/123456)
   - **Risk:** Unauthorized database access
   - **Fix:** Use strong credentials in production

3. **CORS Configuration**
   - **File:** [server.js](server.js#L25)
   - **Issue:** CORS enabled globally with `*`
   - **Risk:** CSRF, unauthorized cross-origin requests
   - **Fix:** Configure `ALLOWED_ORIGINS` env var properly

4. **VNPay Sandbox Mode**
   - **File:** [config/vnpay.js](config/vnpay.js#L6)
   - **Issue:** Using sandbox URLs by default
   - **Risk:** Real payments not processed
   - **Fix:** Switch to production URLs with real credentials

5. **Database Connection Pool**
   - **File:** [config/db.js](config/db.js#L25)
   - **Issue:** No connection timeout handling
   - **Risk:** Hanging connections, resource leaks
   - **Fix:** Implement connection validation & retry logic

---

### 🔴 Missing Features

1. **Input Validation in Routes**
   - **Issue:** Not all routes validate input thoroughly
   - **Example:** [routes/order.js](routes/order.js#L10) doesn't validate `soluong` > 0
   - **Impact:** Could accept invalid data
   - **Fix:** Add comprehensive validation middleware

2. **Transaction Rollback Errors**
   - **Issue:** Limited error recovery in multi-step operations
   - **Example:** [routes/order.js](routes/order.js#L100) - rollback logs but doesn't retry
   - **Impact:** Partial transactions may occur
   - **Fix:** Implement circuit breaker pattern

3. **API Documentation**
   - **Issue:** No OpenAPI/Swagger documentation
   - **Impact:** Harder to maintain, integrate, or debug
   - **Fix:** Generate Swagger/OpenAPI docs

4. **Request Logging Details**
   - **Issue:** [middleware/index.js](middleware/index.js#L20) only logs duration, not body/params
   - **Impact:** Hard to debug requests
   - **Fix:** Log request params (sanitize sensitive data)

5. **Error Response Consistency**
   - **Issue:** Error responses vary by route
   - **Examples:**
     - Auth routes return `errors` array
     - Product routes return `message` string
     - Cart routes return `error` field
   - **Impact:** Frontend inconsistent error handling
   - **Fix:** Standardize error response format

6. **Rate Limiting Scope**
   - **Issue:** Rate limits only on auth routes
   - **File:** [utils/rateLimiter.js](utils/rateLimiter.js)
   - **Impact:** No protection on other endpoints (DDoS risk)
   - **Fix:** Apply rate limiting to all mutation endpoints

7. **Database Query Caching**
   - **Issue:** No caching layer for read operations
   - **Impact:** High database load, slow responses
   - **Fix:** Implement Redis or in-memory caching

8. **Audit Logging**
   - **Issue:** `AUDIT_LOG` table created but not used
   - **File:** [init-db.js](init-db.js#L120)
   - **Impact:** No audit trail of operations
   - **Fix:** Log all mutations to AUDIT_LOG

9. **File Upload Handling**
   - **Issue:** No file upload endpoints (images)
   - **Impact:** Product images, review images not handled
   - **Fix:** Implement multer + S3/local storage

10. **Email Delivery Verification**
    - **Issue:** No confirmation if email sent successfully
    - **File:** [routes/auth.js](routes/auth.js#L140)
    - **Impact:** Users may not receive emails
    - **Fix:** Track email delivery status

11. **Refresh Token Blacklist**
    - **Issue:** No blacklist for invalidated tokens
    - **Impact:** Revoked tokens still valid until expiry
    - **Fix:** Implement Redis-based blacklist

12. **Pagination Consistency**
    - **Issue:** Some routes don't support pagination
    - **Examples:** `/api/admin/orders`, `/api/profile/:userId/reviews`
    - **Impact:** Large datasets slow down
    - **Fix:** Add pagination to all list endpoints

13. **Search Functionality**
    - **Issue:** Only basic LIKE searches
    - **File:** [routes/product.js](routes/product.js#L53)
    - **Impact:** No full-text search, filtering, sorting
    - **Fix:** Implement advanced search with filters

14. **Payment Refund Implementation**
    - **Issue:** Refund endpoint stubbed, not implemented
    - **File:** [routes/payment.js](routes/payment.js#L444)
    - **Note:** Message says "Full refund must be done through merchant dashboard"
    - **Fix:** Implement complete refund flow via VNPay API

15. **Query Status Endpoint**
    - **Issue:** Query status not fully implemented
    - **File:** [routes/payment.js](routes/payment.js#L389)
    - **Note:** Has TODO comment for actual API call
    - **Fix:** Implement VNPay queryDr API call

---

### 🟡 Security Concerns

1. **No HTTPS Enforcement**
   - **Impact:** Credentials transmitted in plain text
   - **Fix:** Force HTTPS in production

2. **No SQL Injection Protection** (specific checks)
   - **Status:** Using parameterized queries is good, but manual escaping should be verified
   - **Fix:** Audit all SQL queries for injection risks

3. **No Password Reset Token Expiry Check**
   - **Impact:** Token valid indefinitely
   - **Fix:** Add time-based validation

4. **No Account Lockout**
   - **Issue:** No lockout after failed login attempts
   - **Impact:** Brute force attacks possible
   - **Fix:** Implement account lockout after N failures

5. **No IP Whitelist/Blacklist**
   - **Impact:** No geographic/IP-based access control
   - **Fix:** Implement IP whitelist for admin routes

6. **Sensitive Data in Error Messages**
   - **Example:** Database errors exposed to frontend
   - **Fix:** Generic error messages in production

7. **No Request Size Limits**
   - **Issue:** No explicit body size limits
   - **Fix:** Add `express.json({ limit: '10kb' })`

8. **No CSRF Protection**
   - **Impact:** Vulnerable to CSRF attacks
   - **Fix:** Implement CSRF token validation

---

### 📋 Missing Endpoints

1. **User Authentication:**
   - ✅ Register, Login, Logout - Implemented
   - ❌ Social login (Google, Facebook) - Missing
   - ❌ 2FA/MFA - Missing
   - ❌ Session management - Partial

2. **Product Management:**
   - ✅ List, Search, Detail, Create, Update, Delete - Implemented
   - ❌ Bulk import - Missing
   - ❌ Category management - Partial (read-only)
   - ❌ Product ratings aggregation - Missing

3. **Order Management:**
   - ✅ Create, Get, List - Implemented
   - ❌ Cancel order - Missing
   - ❌ Return/exchange - Missing
   - ❌ Order tracking - Missing
   - ❌ Notification on status change - Missing

4. **Inventory Management:**
   - ❌ Stock adjustment - Missing
   - ❌ Low stock alerts - Missing
   - ❌ Inventory forecasting - Missing

5. **Analytics & Reports:**
   - ❌ Sales analytics - Missing
   - ❌ User behavior analytics - Partial
   - ❌ Revenue reports - Missing
   - ❌ Inventory reports - Missing

---

### 📊 Performance Considerations

1. **Database Query Optimization**
   - **Issue:** No EXPLAIN plans checked
   - **Fix:** Add indexes for frequently queried columns
   - **Example:** Consider indexing on USER_ID in multiple tables

2. **Connection Pool Monitoring**
   - **Issue:** No monitoring of pool utilization
   - **Fix:** Add metrics tracking

3. **Async Logging**
   - **Issue:** Synchronous logging can block requests
   - **File:** [middleware/index.js](middleware/index.js)
   - **Fix:** Use async logging library

4. **Batch Operations**
   - **Issue:** No batch insert/update support
   - **Impact:** High latency for bulk operations
   - **Fix:** Implement batch endpoints

5. **Caching Strategy**
   - **Missing:** Cache for products, categories
   - **Impact:** Same product fetched repeatedly
   - **Fix:** Implement Redis caching layer

---

### 🔧 Code Quality Issues

1. **Error Handling Inconsistency**
   - Different routes handle errors differently
   - Some use try/catch, some use async/await patterns
   - **Fix:** Standardize error handling

2. **Magic Numbers**
   - Default limits (20, 100) hardcoded
   - JWT expiry (900, 604800) should be constants
   - **Fix:** Create constants file

3. **Code Duplication**
   - Similar queries repeated in multiple routes
   - **Fix:** Create utility query functions

4. **Missing JSDoc Comments**
   - Some functions lack documentation
   - **Fix:** Add comprehensive JSDoc

5. **No TypeScript**
   - JavaScript has no type safety
   - **Fix:** Migrate to TypeScript

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Total Route Files | 12 |
| Total Routes | 74 |
| Database Tables | 20+ |
| Database Sequences | 8+ |
| Utility Functions | 50+ |
| Middleware Functions | 8 |
| Config Files | 2 |

**Total Endpoints:**
- **GET:** ~35
- **POST:** ~25
- **PUT:** ~8
- **DELETE:** ~6

**Protected Routes:** ~15 (require authentication)  
**Admin-Only Routes:** ~6

---

## Deployment Checklist

- [ ] Set strong JWT secrets (min 32 chars)
- [ ] Configure database credentials
- [ ] Set environment to `production`
- [ ] Enable HTTPS
- [ ] Configure CORS origins
- [ ] Set up VNPay production credentials
- [ ] Configure email service (Gmail/SendGrid/SMTP)
- [ ] Set up database backups
- [ ] Configure monitoring/logging
- [ ] Set up CI/CD pipeline
- [ ] Load testing
- [ ] Security audit (SQL injection, XSS, CSRF)
- [ ] Update package.json dependencies
- [ ] Review all environment variables

---

## File Structure Reference

```
backend/
├── server.js                          # Entry point
├── package.json                       # Dependencies
├── .env.example                       # Environment template
├── config/
│   ├── db.js                         # Oracle connection pool
│   └── vnpay.js                      # VNPay configuration
├── routes/
│   ├── auth.js                       # 11 authentication endpoints
│   ├── product.js                    # 6 product endpoints
│   ├── cart.js                       # 3 cart endpoints
│   ├── order.js                      # 4 order endpoints
│   ├── payment.js                    # 6 payment endpoints
│   ├── admin.js                      # 7 admin endpoints
│   ├── category.js                   # 1 category endpoint
│   ├── profile.js                    # 10 profile endpoints
│   ├── recommendations.js            # 8 recommendation endpoints
│   ├── review.js                     # 5 review endpoints
│   ├── chatbot.js                    # 8 chatbot endpoints
│   └── chatbot-enhanced.js           # 4 enhanced chatbot endpoints
├── middleware/
│   ├── auth.js                       # JWT & role verification
│   └── index.js                      # Error, logging, CORS
├── utils/
│   ├── authUtils.js                  # Password & JWT utilities
│   ├── validators.js                 # Input validation
│   ├── emailService.js               # Email handling
│   ├── rateLimiter.js                # Rate limiting
│   ├── bookRecommendationEngine.js   # Recommendation algorithm
│   ├── chatbotUtils.js               # Chatbot functions
│   ├── reviewAIEngine.js             # Review analysis
│   ├── userInsightsGenerator.js      # User analytics
│   ├── vnpayUtils.js                 # VNPay integration
│   ├── responsePoolManager.js        # Chatbot response selection
│   ├── userProfileManager.js         # User profiling
│   └── chatbotRecommendationIntegration.js
├── database/
│   ├── vnpay-schema.sql              # Payment tables
│   ├── chatbot-schema.sql            # Basic chatbot tables
│   ├── chatbot-enhanced-schema.sql   # Advanced chatbot tables
│   ├── book-recommendation-schema.sql # Recommendation tables
│   ├── review-wishlist-system.sql    # Review & wishlist tables
│   └── user-profile-enhancement-schema.sql
├── init-db.js                        # Database initialization
├── check-schema.js                   # Schema verification
└── various test & setup scripts...
```

---

**Report End**

---

*For latest updates, refer to specific file documentation in code comments.*
