# VNPay Payment Integration Guide

Complete VNPay integration for your React + Oracle e-commerce system.

## 📋 Table of Contents

- [Setup Instructions](#setup-instructions)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Payment Flow](#payment-flow)
- [Database Schema](#database-schema)
- [Testing](#testing)
- [Production Setup](#production-setup)

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install crypto querystring axios  # If not already installed
npm install
```

### 2. Create VNPay Account

- Visit: https://sandbox.vnpayment.vn/ (for testing)
- Or: https://vnpayment.vn/ (for production)
- Register merchant account
- Get credentials: TMN Code, Secret Key, Merchant ID

### 3. Configure Environment Variables

Copy `.env.vnpay.example` to `.env` and fill in your VNPay credentials:

```bash
# VNPay Merchant Configuration
VNPAY_TMN_CODE=your_tmn_code
VNPAY_SECRET_KEY=your_secret_key
VNPAY_HASH_SECRET=your_hash_secret
VNPAY_MERCHANT_ID=your_merchant_id
VNPAY_MERCHANT_NAME=Your Store Name

# VNPay URLs
VNPAY_URL=https://sandbox.vnpayment.vn/paygate
VNPAY_API_URL=https://sandbox.vnpayment.vn/merchant_webapi/merchant_information

# Application URLs
VNPAY_RETURN_URL=http://localhost:3000/order-success
VNPAY_IPN_URL=http://localhost:5000/api/payment/ipn

# Database Config
DB_USER=system
DB_PASSWORD=123456
DB_CONNECT_STRING=localhost:1521/orcl21pdb1
PORT=5000
```

### 4. Create Database Tables

Run the SQL script to create payment tables:

```sql
-- Connect to your Oracle database and run:
@backend/database/vnpay-schema.sql

-- Or manually create tables using the schema in vnpay-schema.sql
```

### 5. Register Payment Routes

Edit `backend/server.js` and add:

```javascript
// Import payment routes
const paymentRoutes = require('./routes/payment');

// Add to routes section
app.use('/api/payment', paymentRoutes);
```

### 6. Start Backend Server

```bash
npm start          # Production
npm run dev        # Development with nodemon
```

## ⚙️ Configuration

### VNPay Config File: `backend/config/vnpay.js`

```javascript
{
  vnpayUrl: 'https://sandbox.vnpayment.vn/paygate',
  tmnCode: 'TESTMERCHANT',
  secretKey: 'your_secret_key',
  returnUrl: 'http://localhost:3000/order-success',
  ipnUrl: 'http://localhost:5000/api/payment/ipn',
  currencyCode: 'VND',
  locale: 'vn',
  version: '2.1.0',
  expireDate: 15 // Payment expires in 15 minutes
}
```

## 🔄 API Endpoints

### 1. Create Payment URL

**POST** `/api/payment/create-payment-url`

Create a VNPay payment URL for an order.

```javascript
// Request
{
  "orderId": 123,
  "amount": 500000,          // VND
  "userId": 1,
  "email": "user@example.com",
  "phone": "0901234567",
  "ipAddress": "192.168.1.1"
}

// Response
{
  "success": true,
  "paymentUrl": "https://sandbox.vnpayment.vn/paygate?...",
  "transactionId": "123_1703069800000",
  "amount": 500000,
  "orderId": 123
}
```

### 2. Payment Return URL

**GET** `/api/payment/return`

VNPay redirects here after payment (called by browser).

Parameters: VNPay sends all data as query strings with signature verification.

### 3. IPN Webhook

**POST** `/api/payment/ipn`

VNPay server sends confirmation here (server-to-server).

**IMPORTANT NOTES:**
- Must be publicly accessible (HTTPS recommended)
- Always respond with `{"RspCode": "00", "Message": "Received"}` immediately
- Process payment verification asynchronously

### 4. Query Payment Status

**POST** `/api/payment/query-status`

```javascript
{
  "transactionId": "123_1703069800000",
  "transactionDate": "20231220"
}
```

### 5. Request Refund

**POST** `/api/payment/refund`

```javascript
{
  "transactionId": "123_1703069800000",
  "orderId": 123,
  "refundAmount": 500000,
  "reason": "Customer requested"
}
```

### 6. Transaction History

**GET** `/api/payment/transaction-history/:userId?limit=10&offset=0`

Get all transactions for a user.

## 💳 Payment Flow

### Step 1: User Places Order

```javascript
// Frontend calls order API
POST /api/order/create
{
  "userId": 1,
  "paymentMethod": "VNPAY",
  "items": [...]
}
// Returns: orderId
```

### Step 2: Create Payment URL

```javascript
// Frontend calls payment API
POST /api/payment/create-payment-url
{
  "orderId": 123,
  "amount": 500000,
  "userId": 1,
  "email": "user@example.com"
}
// Returns: paymentUrl
```

### Step 3: Redirect to VNPay

```javascript
// Frontend redirects user
window.location.href = paymentUrl
```

### Step 4: User Pays on VNPay

- User enters card details
- VNPay processes payment
- VNPay sends IPN to backend
- VNPay redirects user to returnUrl

### Step 5: Backend Confirms Payment

Two callbacks happen:
1. **IPN Webhook** (POST /api/payment/ipn) - Server-to-server confirmation
2. **Return URL** (GET /api/payment/return) - Browser redirect

Order status updated to PAID if payment succeeds.

### Step 6: Frontend Completes Order

```javascript
// Frontend detects success and shows order confirmation
// User sees order details on order-success page
```

## 🗄️ Database Schema

### PAYMENT_TRANSACTIONS Table

```sql
CREATE TABLE PAYMENT_TRANSACTIONS (
  TRANSACTION_ID VARCHAR2(100) PRIMARY KEY,
  ORDER_ID NUMBER NOT NULL,
  USER_ID NUMBER NOT NULL,
  AMOUNT NUMBER(10,2),
  STATUS VARCHAR2(50),        -- PENDING, SUCCESS, FAILED
  RESPONSE_CODE VARCHAR2(10), -- 00 = success
  PAYMENT_METHOD VARCHAR2(50),
  TRANSACTION_NO VARCHAR2(100),
  BANK_CODE VARCHAR2(50),
  CREATED_AT TIMESTAMP,
  UPDATED_AT TIMESTAMP
);
```

### REFUND_REQUESTS Table

```sql
CREATE TABLE REFUND_REQUESTS (
  REFUND_ID NUMBER PRIMARY KEY,
  TRANSACTION_ID VARCHAR2(100),
  ORDER_ID NUMBER,
  AMOUNT NUMBER(10,2),
  REASON VARCHAR2(500),
  STATUS VARCHAR2(50),        -- PENDING, APPROVED, REJECTED
  CREATED_AT TIMESTAMP
);
```

## 🧪 Testing

### Test with Sandbox

1. Use VNPay test merchant credentials
2. Use test card numbers:
   - **Success**: 9704198526191432198 (Any CVV)
   - **Failure**: 9704198526191432197 (Any CVV)

### Manual Test via cURL

```bash
# Create payment URL
curl -X POST http://localhost:5000/api/payment/create-payment-url \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": 123,
    "amount": 500000,
    "userId": 1,
    "email": "test@example.com"
  }'

# This returns a paymentUrl
# Open in browser and complete payment
```

### Postman Collection

Import the provided `VNPAY-POSTMAN.json` collection for easy testing.

## 🌐 Production Setup

### 1. Switch to Production VNPay

In `.env`:

```bash
VNPAY_URL=https://paygate.vnpayment.vn/paygate
VNPAY_API_URL=https://api.vnpayment.vn/merchant_webapi/merchant_information
VNPAY_TMN_CODE=your_production_tmn_code
VNPAY_SECRET_KEY=your_production_secret_key
```

### 2. Configure Public URLs

```bash
VNPAY_RETURN_URL=https://yourdomain.com/order-success
VNPAY_IPN_URL=https://yourdomain.com/api/payment/ipn
```

### 3. Enable HTTPS

- IPN webhook MUST use HTTPS
- Use SSL certificate for your domain
- Update VNPAY_IPN_URL to use HTTPS

### 4. Register IPN URL with VNPay

- Login to VNPay merchant dashboard
- Register your IPN URL (e.g., https://yourdomain.com/api/payment/ipn)
- VNPay will send confirmations to this URL

### 5. Security Checklist

- ✅ Keep VNPAY_SECRET_KEY safe (never commit to git)
- ✅ Use HTTPS for all payment endpoints
- ✅ Validate IPN signatures before processing
- ✅ Use database transactions for payment processing
- ✅ Log all payment transactions
- ✅ Implement retry logic for failed payments
- ✅ Monitor IPN failures and set up alerts

### 6. Monitoring

```javascript
// Log all payment transactions
console.log('[PAYMENT]', {
  transactionId,
  orderId,
  amount,
  status,
  responseCode,
  timestamp: new Date(),
});

// Set up error alerts
if (paymentStatus === 'FAILED') {
  // Send alert to admin
  sendAlertEmail('Payment failed for order ' + orderId);
}
```

## 📞 Support & Resources

- **VNPay Docs**: https://sandbox.vnpayment.vn/docs/
- **QA VNPay**: https://sandbox.vnpayment.vn/qadocs/
- **Merchant Support**: support@vnpayment.vn

## 🔑 VNPay Response Codes

| Code | Meaning |
|------|---------|
| 00   | Payment successful |
| 01   | Bank connection timeout |
| 04   | Payment canceled by bank |
| 05   | Payment canceled by user |
| 24   | User canceled payment |

## 📝 Files Created/Modified

```
backend/
├── config/
│   ├── vnpay.js                    # VNPay configuration
│   └── db.js                       # (existing)
├── routes/
│   ├── payment.js                  # Payment API routes
│   └── (existing routes)
├── utils/
│   └── vnpayUtils.js              # Payment utilities & hash generation
├── database/
│   └── vnpay-schema.sql           # Database tables
├── .env.vnpay.example             # Environment template
├── VNPAY-API-DOCS.js              # API documentation
├── server.js                       # (update with payment route)
└── package.json                   # (verify crypto/querystring)
```

## ✅ Quick Start Checklist

- [ ] Create VNPay merchant account
- [ ] Install dependencies
- [ ] Copy `.env.vnpay.example` to `.env` and configure
- [ ] Run `vnpay-schema.sql` to create database tables
- [ ] Add payment route to `server.js`
- [ ] Test with sandbox credentials
- [ ] Update frontend to call payment API
- [ ] Test end-to-end payment flow
- [ ] Deploy to production with HTTPS
- [ ] Register IPN URL with VNPay
- [ ] Monitor payment transactions
