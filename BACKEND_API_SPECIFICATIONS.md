# 📋 Detailed API Endpoint Specifications

## 1. AUTHENTICATION ENDPOINTS (`/api/auth`)

### POST /register
**Purpose:** Register new user account

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123",
  "fullName": "John Doe",
  "phone": "0123456789"
}
```

**Validation:**
- Email: Valid format, max 255 chars, must be unique
- Username: Unique, alphanumeric
- Password: Min 8 chars, 1 uppercase, 1 lowercase, 1 number
- Phone: Optional

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "data": {
    "userId": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "verification": {
      "status": "PENDING",
      "expiresAt": "2026-04-24T12:34:56Z"
    }
  }
}
```

**Response (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must contain at least one uppercase letter"
    }
  ]
}
```

**Rate Limit:** 3 registrations per hour per IP

---

### POST /verify-email
**Purpose:** Verify email with verification code

**Request Body:**
```json
{
  "userId": 1,
  "code": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "userId": 1,
    "emailVerified": true
  }
}
```

**Response (400):**
```json
{
  "success": false,
  "message": "Invalid or expired verification code"
}
```

---

### POST /resend-verification
**Purpose:** Resend verification email

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Verification email sent. Check your inbox.",
  "data": {
    "expiresAt": "2026-04-24T12:34:56Z"
  }
}
```

**Rate Limit:** 5 requests per hour per email

---

### POST /login
**Purpose:** Authenticate user

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userId": 1,
    "username": "johndoe",
    "email": "user@example.com",
    "role": "USER",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  }
}
```

**Response (401):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

**Rate Limit:** 5 attempts per 15 minutes per IP

---

### POST /refresh-token
**Purpose:** Get new access token using refresh token

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  }
}
```

---

### POST /forgot-password
**Purpose:** Request password reset

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "If this email exists, you will receive a password reset link.",
  "expiresAt": "2026-04-24T14:34:56Z"
}
```

**Note:** Same message regardless of whether email exists (security)

**Rate Limit:** 3 requests per hour per email

---

### POST /reset-password
**Purpose:** Reset password with token

**Request Body:**
```json
{
  "token": "secure_token_from_email",
  "password": "NewSecurePass456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully. You can now login with your new password."
}
```

---

### POST /logout
**Purpose:** Logout user (invalidate tokens)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### GET /profile
**Purpose:** Get current user's profile

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "username": "johndoe",
    "email": "user@example.com",
    "fullName": "John Doe",
    "phone": "0123456789",
    "role": "USER",
    "createdAt": "2026-04-20T10:00:00Z",
    "emailVerified": true,
    "accountStatus": "ACTIVE"
  }
}
```

---

### PUT /profile
**Purpose:** Update user profile

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "fullName": "John Doe Updated",
  "phone": "0987654321"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "userId": 1,
    "fullName": "John Doe Updated",
    "phone": "0987654321"
  }
}
```

---

### POST /change-password
**Purpose:** Change user password

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "oldPassword": "SecurePass123",
  "newPassword": "NewSecurePass456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## 2. PRODUCT ENDPOINTS (`/api/product`)

### GET / (List Products)
**Purpose:** List all products with pagination

**Query Parameters:**
```
?page=1&limit=20
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "MASP": "SP20260420001",
      "TENSP": "Lập Trình Python Cơ Bản",
      "GIABAN": 250000,
      "SOLUONGTON": 45,
      "IMAGE_URL": "https://example.com/image.jpg",
      "DESCRIPTION": "Sách hướng dẫn lập trình Python cho người mới bắt đầu",
      "MANCC": "NC001"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

### GET /search/query
**Purpose:** Search products by name or description

**Query Parameters:**
```
?q=python
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "MASP": "SP20260420001",
      "TENSP": "Lập Trình Python Cơ Bản",
      "GIABAN": 250000,
      "SOLUONGTON": 45,
      "IMAGE_URL": "https://example.com/image.jpg",
      "DESCRIPTION": "Sách hướng dẫn lập trình Python cho người mới bắt đầu",
      "MANCC": "NC001"
    }
  ],
  "count": 1
}
```

---

### GET /:id
**Purpose:** Get single product details

**Response (200):**
```json
{
  "success": true,
  "data": {
    "MASP": "SP20260420001",
    "TENSP": "Lập Trình Python Cơ Bản",
    "GIABAN": 250000,
    "SOLUONGTON": 45,
    "IMAGE_URL": "https://example.com/image.jpg",
    "DESCRIPTION": "Sách hướng dẫn lập trình Python cho người mới bắt đầu",
    "MANCC": "NC001"
  }
}
```

**Response (404):**
```json
{
  "success": false,
  "message": "Không tìm thấy sản phẩm"
}
```

---

### POST / (Create Product - Admin Only)
**Purpose:** Create new product

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "TENSP": "Lập Trình JavaScript Advanced",
  "GIABAN": 320000,
  "SOLUONGTON": 30,
  "HINHANH": "https://example.com/image.jpg",
  "MOTA": "Sách nâng cao JavaScript cho lập trình viên",
  "MANCC": "NC002"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "MASP": "SP20260423123456789",
    "TENSP": "Lập Trình JavaScript Advanced",
    ...
  }
}
```

**Response (403):**
```json
{
  "success": false,
  "message": "Access denied. Required role: ADMIN"
}
```

---

### PUT /:id (Update Product - Admin Only)
**Purpose:** Update product

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "TENSP": "Lập Trình JavaScript Advanced - Updated",
  "GIABAN": 290000,
  "SOLUONGTON": 25
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "MASP": "SP20260420001",
    "TENSP": "Lập Trình JavaScript Advanced - Updated",
    ...
  }
}
```

---

### DELETE /:id (Delete Product - Admin Only)
**Purpose:** Delete product

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

## 3. CART ENDPOINTS (`/api/cart`)

### POST /add
**Purpose:** Add product to cart

**Request Body:**
```json
{
  "userId": 1,
  "masp": "SP20260420001",
  "soluong": 2
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Product added to cart successfully",
  "cartId": 5
}
```

**Response (400):**
```json
{
  "success": false,
  "message": "Not enough stock. Available: 5"
}
```

---

### GET /:userId
**Purpose:** Get user's cart with items

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "MASP": "SP20260420001",
      "TENSP": "Lập Trình Python Cơ Bản",
      "IMAGE_URL": "https://example.com/image.jpg",
      "GIABAN": 250000,
      "SOLUONG": 2,
      "TOTAL_PRICE": 500000
    },
    {
      "MASP": "SP20260420002",
      "TENSP": "Lập Trình JavaScript Advanced",
      "IMAGE_URL": "https://example.com/image2.jpg",
      "GIABAN": 320000,
      "SOLUONG": 1,
      "TOTAL_PRICE": 320000
    }
  ],
  "total": 820000,
  "count": 2
}
```

---

### DELETE /item/:userId/:masp
**Purpose:** Remove item from cart

**Response (200):**
```json
{
  "success": true,
  "message": "Item removed from cart successfully"
}
```

---

## 4. ORDER ENDPOINTS (`/api/order`)

### POST /create
**Purpose:** Create order from cart

**Request Body:**
```json
{
  "userId": 1,
  "paymentMethod": "VNPAY"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Order created successfully",
  "orderId": 42,
  "totalAmount": 820000,
  "itemCount": 2,
  "paymentMethod": "VNPAY"
}
```

**Response (400):**
```json
{
  "success": false,
  "message": "Cart is empty"
}
```

---

### GET /:orderId
**Purpose:** Get order details

**Response (200):**
```json
{
  "success": true,
  "data": {
    "orderId": 42,
    "userId": 1,
    "status": "PENDING",
    "totalAmount": 820000,
    "paymentMethod": "VNPAY",
    "orderDate": "2026-04-23T10:30:00Z",
    "items": [
      {
        "itemId": 1,
        "masp": "SP20260420001",
        "tensp": "Lập Trình Python Cơ Bản",
        "soluong": 2,
        "price": 250000,
        "subtotal": 500000
      }
    ]
  }
}
```

---

### GET /user/:userId
**Purpose:** Get user's order history

**Query Parameters:**
```
?page=1&limit=10
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "orderId": 42,
      "orderDate": "2026-04-23T10:30:00Z",
      "status": "PENDING",
      "totalAmount": 820000,
      "itemCount": 2
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

---

## 5. PAYMENT ENDPOINTS (`/api/payment`)

### POST /create-payment-url
**Purpose:** Create VNPay payment URL

**Request Body:**
```json
{
  "orderId": 42,
  "amount": 820000,
  "userId": 1,
  "email": "user@example.com",
  "phone": "0123456789",
  "bankCode": "NCB",
  "ipAddress": "192.168.1.1"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Payment URL created successfully",
  "paymentUrl": "https://sandbox.vnpayment.vn/paygate?vnp_Amount=820000&vnp_Command=pay&...",
  "transactionId": "TXN_42_1682234400000",
  "amount": 820000,
  "orderId": 42
}
```

---

### GET /return
**Purpose:** VNPay return redirect (user returns from payment)

**Query Parameters (from VNPay):**
```
?vnp_Amount=820000&vnp_BankCode=NCB&vnp_BankTranNo=123456&vnp_CardType=ATM&vnp_OrderInfo=Payment+for+order+42&vnp_PayDate=20260423103000&vnp_ResponseCode=00&vnp_TMN_Code=TESTMERCHANT&vnp_TransactionNo=789123&vnp_TxnRef=TXN_42_1682234400000&vnp_SecureHash=...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Payment successful",
  "transactionId": "TXN_42_1682234400000",
  "amount": 820000,
  "responseCode": "00",
  "bankTranNo": "123456"
}
```

**Response (400):**
```json
{
  "success": false,
  "message": "Payment failed"
}
```

---

### POST /ipn
**Purpose:** VNPay IPN webhook (server-to-server callback)

**Request Body (from VNPay):**
```json
{
  "vnp_Amount": 820000,
  "vnp_BankCode": "NCB",
  "vnp_OrderInfo": "Payment for order 42",
  "vnp_PayDate": "20260423103000",
  "vnp_ResponseCode": "00",
  "vnp_TMN_Code": "TESTMERCHANT",
  "vnp_TransactionNo": "789123",
  "vnp_TxnRef": "TXN_42_1682234400000",
  "vnp_SecureHash": "..."
}
```

**Response (200):**
```json
{
  "RspCode": "00",
  "Message": "Received"
}
```

**Note:** This endpoint always returns 200 OK immediately, then processes in background

---

### POST /query-status
**Purpose:** Query payment status from VNPay

**Request Body:**
```json
{
  "transactionId": "TXN_42_1682234400000",
  "transactionNo": "789123",
  "transactionDate": "20260423103000"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Query request prepared",
  "transactionId": "TXN_42_1682234400000",
  "queryParams": { ... }
}
```

---

### POST /refund
**Purpose:** Request refund

**Request Body:**
```json
{
  "transactionId": "TXN_42_1682234400000",
  "orderId": 42,
  "refundAmount": 820000,
  "reason": "Customer requested"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Refund request created",
  "refundId": 10,
  "status": "PENDING"
}
```

---

### GET /transaction-history/:userId
**Purpose:** Get user's payment history

**Query Parameters:**
```
?limit=20&offset=0
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "transactionId": "TXN_42_1682234400000",
      "orderId": 42,
      "amount": 820000,
      "status": "SUCCESS",
      "paymentMethod": "VNPAY",
      "bankCode": "NCB",
      "createdAt": "2026-04-23T10:30:00Z",
      "updatedAt": "2026-04-23T10:35:00Z"
    }
  ],
  "count": 1
}
```

---

## 6. ADMIN ENDPOINTS (`/api/admin`)

### GET /users
**Purpose:** List all users (Admin only)

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "userId": 1,
      "username": "johndoe",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "USER"
    }
  ],
  "total": 1
}
```

---

### GET /users/:userId
**Purpose:** Get user details with orders (Admin only)

**Response (200):**
```json
{
  "success": true,
  "user": {
    "userId": 1,
    "username": "johndoe",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "USER"
  },
  "orders": [
    {
      "orderId": 42,
      "orderDate": "2026-04-23T10:30:00Z",
      "status": "PENDING",
      "totalAmount": 820000
    }
  ]
}
```

---

### PUT /users/:userId
**Purpose:** Update user information (Admin only)

**Request Body:**
```json
{
  "email": "newemail@example.com",
  "fullname": "John Doe Updated",
  "role": "ADMIN"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User updated successfully"
}
```

---

### DELETE /users/:userId
**Purpose:** Delete user account (Admin only)

**Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

### GET /orders
**Purpose:** Get all orders (Admin only)

**Query Parameters:**
```
?status=PENDING&limit=20&offset=0
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "orderId": 42,
      "userId": 1,
      "username": "johndoe",
      "orderDate": "2026-04-23T10:30:00Z",
      "status": "PENDING",
      "totalAmount": 820000
    }
  ],
  "total": 1
}
```

---

### PUT /orders/:orderId
**Purpose:** Update order status (Admin only)

**Request Body:**
```json
{
  "status": "PROCESSING"
}
```

**Valid Statuses:** `PENDING`, `PROCESSING`, `COMPLETED`, `CANCELLED`

**Response (200):**
```json
{
  "success": true,
  "message": "Order status updated successfully"
}
```

---

## 7. PROFILE ENDPOINTS (`/api/profile`)

### GET /:userId
**Purpose:** Get complete user profile

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "userId": 1,
      "username": "johndoe",
      "fullName": "John Doe",
      "email": "user@example.com",
      "role": "USER",
      "joinDate": "2026-04-20T10:00:00Z"
    },
    "addresses": [
      {
        "addressId": 1,
        "address": "123 Main St",
        "city": "Ho Chi Minh",
        "phone": "0123456789",
        "isDefault": true
      }
    ],
    "analytics": {
      "totalBooksViewed": 25,
      "totalBooksPurchased": 5,
      "totalBooksReviewed": 3,
      "totalSpent": 4100000,
      "favoriteCategory1": "Programming",
      "favoriteCategory2": "Technology"
    },
    "insights": {
      "readingFrequency": "HIGH",
      "preferredAuthors": ["Author A", "Author B"],
      "readingLevel": "INTERMEDIATE"
    },
    "recentOrders": [
      {
        "orderId": 42,
        "orderDate": "2026-04-23T10:30:00Z",
        "status": "PENDING",
        "totalAmount": 820000
      }
    ],
    "wishlistCount": 8,
    "reviewCount": 3
  }
}
```

---

### GET /:userId/wishlist
**Purpose:** Get user's wishlist

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "wishlistId": 1,
      "masp": "SP20260420001",
      "tensp": "Lập Trình Python Cơ Bản",
      "giaban": 250000,
      "hinhanh": "https://example.com/image.jpg",
      "addedAt": "2026-04-22T15:00:00Z"
    }
  ],
  "count": 1
}
```

---

### POST /:userId/wishlist
**Purpose:** Add product to wishlist

**Request Body:**
```json
{
  "masp": "SP20260420001"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Added to wishlist",
  "wishlistId": 1
}
```

---

### DELETE /:userId/wishlist/:wishlistId
**Purpose:** Remove from wishlist

**Response (200):**
```json
{
  "success": true,
  "message": "Removed from wishlist"
}
```

---

## 8. RECOMMENDATIONS ENDPOINTS (`/api/recommendations`)

### GET /:userId
**Purpose:** Get personalized recommendations

**Query Parameters:**
```
?limit=10
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "masp": "SP20260420003",
      "tensp": "Data Science with Python",
      "giaban": 350000,
      "score": 0.95,
      "reason": "Based on your Python preference"
    }
  ],
  "count": 1
}
```

---

### GET /:userId/preferences
**Purpose:** Get user book preferences

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "favoriteCategories": ["Programming", "Technology"],
    "favoriteAuthors": ["Author A"],
    "preferredDifficulty": "INTERMEDIATE",
    "readingMotivation": "PROFESSIONAL_DEVELOPMENT",
    "priceRange": {
      "min": 100000,
      "max": 500000
    }
  }
}
```

---

### PUT /:userId/preferences
**Purpose:** Update preferences

**Request Body:**
```json
{
  "favoriteCategories": ["Programming", "Technology", "Business"],
  "favoriteAuthors": ["Author A", "Author B"],
  "preferredDifficulty": "ADVANCED",
  "priceRange": {
    "min": 100000,
    "max": 600000
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Preferences updated"
}
```

---

## 9. CHATBOT ENDPOINTS (`/api/chatbot`)

### POST /message
**Purpose:** Send message to chatbot

**Request Body:**
```json
{
  "userId": "1",
  "message": "I want to buy a Python book",
  "conversationId": "CONV_123",
  "sessionToken": "web_1682234400000"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "conversationId": "CONV_123",
    "userMessage": {
      "messageId": 1,
      "content": "I want to buy a Python book",
      "createdAt": "2026-04-23T10:30:00Z"
    },
    "botMessage": {
      "messageId": 2,
      "content": "Great! I found several Python books for you. Here are my top recommendations...",
      "intent": "PRODUCT_INQUIRY",
      "confidence": 0.92,
      "createdAt": "2026-04-23T10:30:01Z"
    },
    "processingTime": 156
  }
}
```

---

### GET /conversations/:userId
**Purpose:** Get user conversations

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "conversationId": "CONV_123",
      "createdAt": "2026-04-23T10:30:00Z",
      "lastMessage": "I want to buy a Python book",
      "messageCount": 5
    }
  ]
}
```

---

### GET /messages/:conversationId
**Purpose:** Get conversation messages

**Query Parameters:**
```
?limit=50
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "messageId": 1,
      "type": "user",
      "content": "I want to buy a Python book",
      "createdAt": "2026-04-23T10:30:00Z"
    },
    {
      "messageId": 2,
      "type": "bot",
      "content": "Great! I found several Python books...",
      "intent": "PRODUCT_INQUIRY",
      "createdAt": "2026-04-23T10:30:01Z"
    }
  ]
}
```

---

## Response Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful GET/PUT/DELETE |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Validation error, missing fields |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions (role-based) |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Internal server error |

---

## Error Response Format

**Standard Error:**
```json
{
  "success": false,
  "message": "Error description",
  "status": 400,
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation message"
    }
  ]
}
```

**Authentication Error:**
```json
{
  "success": false,
  "message": "Missing or invalid authorization header"
}
```

**Permission Error:**
```json
{
  "success": false,
  "message": "Access denied. Required role: ADMIN"
}
```

---

**Note:** All timestamps are in ISO 8601 format (UTC)  
**Note:** All amounts are in VND (Vietnamese Dong)  
**Note:** All IDs are numeric except MASP which is varchar2  

