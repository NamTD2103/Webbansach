# 🚀 Backend Quick Reference Guide

## API Endpoints Summary

### Authentication API (`/api/auth`)
```
POST   /register                   - Register new user
POST   /verify-email               - Verify email
POST   /resend-verification        - Resend verification code
POST   /login                      - Login user
POST   /refresh-token              - Refresh access token
POST   /forgot-password            - Request password reset
POST   /reset-password             - Reset password
POST   /logout                     - Logout user
GET    /profile                    - Get user profile
PUT    /profile                    - Update user profile
POST   /change-password            - Change password
```

### Products API (`/api/product`)
```
GET    /                           - List products (paginated)
GET    /search/query?q=keyword     - Search products
GET    /:id                        - Get product details
POST   /                           - Create product (ADMIN)
PUT    /:id                        - Update product (ADMIN)
DELETE /:id                        - Delete product (ADMIN)
```

### Cart API (`/api/cart`)
```
POST   /add                        - Add product to cart
GET    /:userId                    - Get user's cart
DELETE /item/:userId/:masp         - Remove item from cart
```

### Orders API (`/api/order`)
```
POST   /create                     - Create order from cart
POST   /add-item                   - Add item to order
GET    /:orderId                   - Get order details
GET    /user/:userId               - Get user's orders
```

### Payments API (`/api/payment`)
```
POST   /create-payment-url         - Create VNPay payment link
GET    /return                     - VNPay callback (redirect)
POST   /ipn                        - VNPay callback (webhook)
POST   /query-status               - Query payment status
POST   /refund                     - Request refund
GET    /transaction-history/:userId- Payment history
```

### Admin API (`/api/admin`)
```
GET    /users                      - List all users
GET    /users/:userId              - Get user details
PUT    /users/:userId              - Update user
DELETE /users/:userId              - Delete user
GET    /orders                     - List all orders
GET    /orders/:orderId            - Get order details
PUT    /orders/:orderId            - Update order status
```

### Categories API (`/api/category`)
```
GET    /                           - List categories
```

### Profile API (`/api/profile`)
```
GET    /:userId                    - Get user profile
PUT    /:userId                    - Update profile
GET    /:userId/insights           - Get reading insights
GET    /:userId/analytics          - Get analytics
GET    /:userId/wishlist           - Get wishlist
POST   /:userId/wishlist           - Add to wishlist
DELETE /:userId/wishlist/:wid      - Remove from wishlist
GET    /:userId/reviews            - Get user reviews
GET    /:userId/personalized-recommendations
```

### Recommendations API (`/api/recommendations`)
```
GET    /:userId                    - Get recommendations
GET    /:userId/preferences        - Get preferences
PUT    /:userId/preferences        - Update preferences
POST   /:userId/track-interaction  - Track interaction
GET    /:userId/history            - Get interaction history
POST   /:userId/feedback           - Submit feedback
GET    /trending                   - Get trending books
GET    /:userId/similar/:masp      - Get similar books
GET    /analytics/dashboard        - Get analytics
```

### Reviews API (`/api/review`)
```
POST   /                           - Create review
GET    /product/:productId         - Get product reviews
GET    /product/:productId/summary - Get review summary
POST   /:reviewId/like             - Mark as helpful
POST   /:reviewId/report           - Report review
```

### Chatbot API (`/api/chatbot`)
```
POST   /message                    - Send message
GET    /conversations/:userId      - Get conversations
GET    /messages/:conversationId   - Get messages
POST   /feedback                   - Send feedback
GET    /preferences/:userId        - Get preferences
POST   /preferences/:userId        - Update preferences
GET    /faq                        - Get FAQ
GET    /stats                      - Get statistics
```

---

## Database Tables Overview

### Core Tables
```
USERS (USER_ID, USERNAME, EMAIL, PASSWORD_HASH, FULLNAME, ROLE)
CART (CART_ID, USER_ID)
CART_ITEM (ITEM_ID, CART_ID, MASP, SOLUONG)
ORDERS (ORDER_ID, USER_ID, STATUS, TOTAL_AMOUNT, PAYMENT_METHOD)
ORDER_ITEMS (ITEM_ID, ORDER_ID, MASP, SOLUONG, PRICE)
PAYMENTS (PAYMENT_ID, ORDER_ID, AMOUNT, STATUS)
ADDRESS (ADDR_ID, USER_ID, ADDRESS, CITY, PHONE)
```

### Payment Tables
```
PAYMENT_TRANSACTIONS (TRANSACTION_ID, ORDER_ID, AMOUNT, STATUS, BANK_CODE)
REFUND_REQUESTS (REFUND_ID, TRANSACTION_ID, ORDER_ID, AMOUNT, STATUS)
```

### Chatbot Tables
```
CHATBOT_CONVERSATIONS (CONVERSATION_ID, USER_ID, SESSION_TOKEN)
CHATBOT_MESSAGES (MESSAGE_ID, CONVERSATION_ID, USER_ID, MESSAGE_TYPE, CONTENT)
CHATBOT_USER_PREFERENCES (PREF_ID, USER_ID, CATEGORY_INTEREST, PRICE_RANGE)
CHATBOT_RESPONSE_POOL (RESPONSE_ID, INTENT, RESPONSE_TEXT)
CHATBOT_USER_PROFILE (PROFILE_ID, USER_ID, CHURN_RISK)
```

### Review Tables
```
PRODUCT_REVIEWS (REVIEW_ID, PRODUCT_ID, USER_ID, RATING, CONTENT, SENTIMENT)
REVIEW_IMAGES (IMAGE_ID, REVIEW_ID, IMAGE_URL)
REVIEW_LIKES (LIKE_ID, REVIEW_ID, USER_ID)
USER_WISHLIST (WISHLIST_ID, USER_ID, MASP, IS_ACTIVE)
```

### Recommendation Tables
```
USER_BOOK_PREFERENCES (PREF_ID, USER_ID, FAVORITE_CATEGORIES, FAVORITE_AUTHORS)
BOOK_METADATA (BOOK_ID, TITLE, AUTHOR, CATEGORY)
BOOK_READING_HISTORY (HISTORY_ID, USER_ID, BOOK_ID, ACTION_TYPE)
BOOK_RECOMMENDATIONS (REC_ID, USER_ID, BOOK_ID, SCORE, REASON)
SIMILAR_BOOKS (SIMILAR_ID, BOOK_ID_1, BOOK_ID_2, SIMILARITY_SCORE)
```

---

## Authentication Details

### JWT Token Structure
```
Access Token:
{
  userId: number,
  email: string,
  role: 'USER' | 'ADMIN',
  type: 'access',
  iat: timestamp,
  exp: timestamp + 900 seconds
}

Refresh Token:
{
  userId: number,
  tokenId: string,
  type: 'refresh',
  exp: timestamp + 604800 seconds
}
```

### Request Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Rate Limits
- Login: 5 attempts per 15 minutes
- Register: 3 per hour
- Password Reset: 3 per hour
- Email Resend: 5 per hour

---

## Environment Variables Required

### Database
```
DB_USER=system
DB_PASSWORD=<secure_password>
DB_CONNECT_STRING=localhost:1521/orcl21pdb1
DB_POOL_MIN=2
DB_POOL_MAX=10
```

### JWT Security ⚠️
```
JWT_SECRET=<min 32 chars, must change from default>
JWT_REFRESH_SECRET=<min 32 chars, must change from default>
JWT_ACCESS_EXPIRY=900
JWT_REFRESH_EXPIRY=604800
```

### VNPay
```
VNPAY_TMN_CODE=<merchant_code>
VNPAY_SECRET_KEY=<secret_key>
VNPAY_RETURN_URL=http://localhost:3000/order-success
VNPAY_IPN_URL=http://localhost:5000/api/payment/ipn
```

### Email
```
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<email>
SMTP_PASSWORD=<app_password>
EMAIL_FROM=noreply@example.com
```

### App
```
PORT=5000
NODE_ENV=development
APP_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

---

## Error Response Format

### Standard Error
```json
{
  "success": false,
  "message": "Error description",
  "status": 400,
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Authentication Error
```json
{
  "success": false,
  "message": "Invalid token" | "Missing authorization header" | "Access denied"
}
```

---

## Common Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `429` - Too many requests (rate limited)
- `500` - Server error

---

## Database Sequences

```
users_seq              - For USERS.USER_ID
cart_seq               - For CART.CART_ID
cart_item_seq          - For CART_ITEM.ITEM_ID
orders_seq             - For ORDERS.ORDER_ID
order_items_seq        - For ORDER_ITEMS.ITEM_ID
payments_seq           - For PAYMENTS.PAYMENT_ID
address_seq            - For ADDRESS.ADDR_ID
audit_log_seq          - For AUDIT_LOG.LOG_ID
chatbot_conversation_seq - For conversations
chatbot_message_seq    - For messages
```

**Usage in SQL:**
```sql
INSERT INTO USERS VALUES (users_seq.NEXTVAL, ...)
```

---

## Key Utilities

### Password & Auth
- `hashPassword(password)` - Hash password
- `comparePassword(password, hash)` - Verify password
- `generateAccessToken(userId, email, role)` - Create JWT
- `verifyAccessToken(token)` - Validate JWT

### Validation
- `validateEmail(email)` - Check email format
- `validatePassword(password)` - Check password strength
- `validateUsername(username)` - Check username
- `validateRegistration(data)` - Full registration validation

### Email
- `sendVerificationEmail(email, code)` - Send verification
- `sendPasswordResetEmail(email, token)` - Send reset email

### VNPay
- `createPaymentUrl(paymentData)` - Generate payment link
- `verifyHash(params)` - Verify VNPay signature
- `parseReturnData(params)` - Parse VNPay response
- `isPaymentSuccessful(responseCode)` - Check payment status

### Recommendation
- `generatePersonalizedRecommendations(userId)` - Get recommendations
- `calculateSimilarBooks(productId)` - Find similar books

---

## Middleware Stack

```
express.json()
express.urlencoded()
cors()
requestLogger
↓
routes (with auth middleware)
↓
404 handler
errorHandler
```

### Auth Middleware
- `verifyToken` - Require authentication
- `verifyTokenOptional` - Optional authentication
- `requireRole(role)` - Role-based access
- `requireAdmin` - Admin-only
- `requireEmailVerified` - Email verified check

---

## Common Request/Response Patterns

### List with Pagination
**Request:**
```
GET /api/product?page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Create Resource
**Request:**
```
POST /api/product
Authorization: Bearer <token>
Content-Type: application/json

{
  "TENSP": "Book Name",
  "GIABAN": 150000,
  "SOLUONGTON": 50
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "MASP": "SP...",
    ...
  }
}
```

### Authentication
**Login Request:**
```
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Login Response:**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "username": "user",
    "email": "user@example.com",
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 900
  }
}
```

---

## VNPay Payment Flow

```
1. POST /create-payment-url
   Request: { orderId, amount, userId, ... }
   Response: { paymentUrl, transactionId }

2. User redirected to VNPay (paymentUrl)

3. User completes payment

4. GET /return (browser redirect)
   Params: vnp_Amount, vnp_ResponseCode, vnp_SecureHash, ...
   Updates: PAYMENT_TRANSACTIONS, ORDERS

5. POST /ipn (background webhook from VNPay)
   Body: VNPay IPN data
   Confirms payment, updates database
```

**Important:** Always verify secure hash in both return and IPN

---

## Order Status Flow

```
PENDING → PAID → PROCESSING → COMPLETED
  ↓
CANCELLED (from PENDING)
```

---

## Critical Security Notes

⚠️ **MUST DO BEFORE PRODUCTION:**

1. Change JWT_SECRET and JWT_REFRESH_SECRET (min 32 chars)
2. Change database credentials (DB_USER, DB_PASSWORD)
3. Disable CORS `*` - configure ALLOWED_ORIGINS
4. Switch VNPay to production credentials
5. Enable HTTPS
6. Set NODE_ENV=production
7. Review all error messages (no database details exposed)
8. Implement request size limits
9. Add CSRF protection
10. Set up proper logging/monitoring

---

## File Paths Reference

| Purpose | Path |
|---------|------|
| Entry point | `server.js` |
| Database config | `config/db.js` |
| VNPay config | `config/vnpay.js` |
| Auth routes | `routes/auth.js` |
| Product routes | `routes/product.js` |
| Cart routes | `routes/cart.js` |
| Order routes | `routes/order.js` |
| Payment routes | `routes/payment.js` |
| Admin routes | `routes/admin.js` |
| Auth middleware | `middleware/auth.js` |
| Auth utilities | `utils/authUtils.js` |
| Validators | `utils/validators.js` |
| Email service | `utils/emailService.js` |
| Rate limiter | `utils/rateLimiter.js` |
| VNPay utils | `utils/vnpayUtils.js` |
| DB init | `init-db.js` |
| Environment template | `.env.example` |

---

## Quick Start

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Setup environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your config
   ```

3. **Initialize database:**
   ```bash
   node init-db.js
   ```

4. **Start server:**
   ```bash
   npm start        # production
   npm run dev      # development (nodemon)
   ```

5. **Test health:**
   ```bash
   curl http://localhost:5000/health
   ```

---

**Last Updated:** April 23, 2026  
**Database:** Oracle Database  
**Framework:** Express.js + Node.js  
**Total Endpoints:** 74
