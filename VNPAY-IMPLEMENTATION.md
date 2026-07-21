# VNPay Integration - Complete Implementation Guide

## 📦 Package Contents

Your VNPay integration includes:

### Backend Files (Node.js + Express)
- **`backend/config/vnpay.js`** - VNPay configuration
- **`backend/utils/vnpayUtils.js`** - Utility functions (hash, URL generation)
- **`backend/routes/payment.js`** - Payment API endpoints
- **`backend/database/vnpay-schema.sql`** - Database schema
- **`backend/.env.vnpay.example`** - Environment template
- **`backend/server.js`** - Updated with payment routes
- **`backend/README-VNPAY.md`** - Complete guide
- **`backend/VNPAY-API-DOCS.js`** - API documentation
- **`backend/VNPAY-EXAMPLES.js`** - Code examples
- **`backend/VNPAY-POSTMAN.json`** - Postman collection

### Frontend Files (React/Next.js)
- **`lib/services/vnpayService.ts`** - Payment service
- **`components/VNPayCheckout.tsx`** - Checkout component
- **`components/OrderSuccessVNPay.tsx`** - Success page component

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Dependencies
```bash
cd backend
npm install  # crypto and querystring should be included
```

### Step 2: Setup Environment
```bash
cp .env.vnpay.example .env
# Edit .env with your VNPay credentials
```

### Step 3: Create Database Tables
```sql
-- In your Oracle database client:
@backend/database/vnpay-schema.sql
```

### Step 4: Restart Backend
```bash
npm start
```

### Step 5: Frontend Integration
Use `VNPayCheckout.tsx` component in your checkout page.

---

## 💳 Complete Payment Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        USER JOURNEY                          │
└─────────────────────────────────────────────────────────────┘

1. USER PLACES ORDER
   └─> Frontend: POST /api/order/create
       └─> Database: Order created with status PENDING

2. CREATE PAYMENT URL
   └─> Frontend: POST /api/payment/create-payment-url
       └─> Backend: Generate secure payment URL
           └─> Database: Transaction stored with status PENDING
               └─> Frontend: Get payment URL

3. REDIRECT TO VNPAY
   └─> Frontend: window.location.href = paymentUrl
       └─> User navigates to VNPay payment page
           └─> User enters card details
               └─> VNPay processes payment

4. PAYMENT CONFIRMATION (Two callbacks)
   ┌─ CALLBACK 1: Server-to-Server IPN
   │  └─> POST /api/payment/ipn (VNPay → Backend)
   │      └─> Backend: Verify hash, update payment status
   │          └─> Database: Transaction marked SUCCESS/FAILED
   │              └─> Database: Order status updated to PAID
   │
   └─ CALLBACK 2: Browser Redirect
      └─> GET /api/payment/return?vnp_Amount=...&vnp_ResponseCode=...
          └─> Backend: Verify hash, update payment status
              └─> Frontend: Display result
                  └─> User sees order confirmation
```

---

## 🔒 Security Implementation

### Hash Verification
All VNPay requests are verified using HMAC-SHA512:

```javascript
// Example: Verify IPN from VNPay
const isValidHash = vnpayUtils.verifyHash(req.body);

if (!isValidHash) {
  console.error('Invalid signature - potential tampering!');
  return;  // Do not process
}
```

### Data Flow
```
User Data
   ↓
[HTTPS - Encrypted]
   ↓
Backend (Validate & Hash Check)
   ↓
Database (Encrypted fields)
   ↓
VNPay (Sandbox/Production Gateway)
```

---

## 🗄️ Database Schema

### PAYMENT_TRANSACTIONS Table
Stores all payment attempts and results.

```sql
Column            | Type      | Purpose
-----------------|-----------|------------------
TRANSACTION_ID    | VARCHAR   | Unique transaction identifier
ORDER_ID          | NUMBER    | Reference to order
USER_ID           | NUMBER    | Reference to user
AMOUNT            | NUMBER    | Payment amount (VND)
STATUS            | VARCHAR   | PENDING, SUCCESS, FAILED
RESPONSE_CODE     | VARCHAR   | VNPay response code (00=success)
PAYMENT_METHOD    | VARCHAR   | VNPAY, COD, etc.
TRANSACTION_NO    | VARCHAR   | VNPay transaction number
BANK_CODE         | VARCHAR   | Bank used (NCB, VCB, etc.)
CREATED_AT        | TIMESTAMP | Transaction creation time
UPDATED_AT        | TIMESTAMP | Last update time
```

### REFUND_REQUESTS Table
Stores refund requests for reconciliation.

```sql
Column            | Type      | Purpose
-----------------|-----------|------------------
REFUND_ID         | NUMBER    | Unique refund ID
TRANSACTION_ID    | VARCHAR   | Reference to payment
ORDER_ID          | NUMBER    | Reference to order
AMOUNT            | NUMBER    | Refund amount
REASON            | VARCHAR   | Refund reason
STATUS            | VARCHAR   | PENDING, APPROVED, REJECTED
CREATED_AT        | TIMESTAMP | Request creation time
```

---

## API Reference

### 1. Create Payment URL
```javascript
POST /api/payment/create-payment-url

Request:
{
  "orderId": 12345,
  "amount": 500000,
  "userId": 1,
  "email": "user@example.com",
  "phone": "0901234567",
  "bankCode": "NCB"  // Optional
}

Response:
{
  "success": true,
  "paymentUrl": "https://sandbox.vnpayment.vn/paygate?...",
  "transactionId": "12345_1703069800000"
}
```

### 2. Return URL Callback
```javascript
GET /api/payment/return?vnp_Amount=...&vnp_ResponseCode=...

// Called by browser after user completes payment
// Automatically updates order and payment status
// Note: IPN webhook is the authoritative confirmation
```

### 3. IPN Webhook
```javascript
POST /api/payment/ipn

// Called by VNPay server-to-server
// Must be publicly accessible
// Always respond with 200 OK immediately
// Process payment verification asynchronously

Response (Required):
{
  "RspCode": "00",
  "Message": "Received"
}
```

### 4. Query Payment Status
```javascript
POST /api/payment/query-status

Request:
{
  "transactionId": "12345_1703069800000",
  "transactionDate": "20231220"
}

// For reconciliation if IPN fails
```

### 5. Request Refund
```javascript
POST /api/payment/refund

Request:
{
  "transactionId": "12345_1703069800000",
  "orderId": 12345,
  "refundAmount": 500000,
  "reason": "Customer changed mind"
}

// Note: Actual refund via VNPay merchant dashboard
```

### 6. Transaction History
```javascript
GET /api/payment/transaction-history/:userId?limit=10&offset=0

Response:
{
  "transactions": [
    {
      "TRANSACTION_ID": "...",
      "ORDER_ID": 12345,
      "AMOUNT": 500000,
      "STATUS": "SUCCESS",
      "PAYMENT_METHOD": "VNPAY",
      "CREATED_AT": "2023-12-20 14:30:00"
    }
  ]
}
```

---

## 🔑 VNPay Response Codes

| Code | Meaning | Action |
|------|---------|--------|
| 00 | Payment successful | Update order to PAID ✓ |
| 01 | Bank connection timeout | Retry later |
| 04 | Payment canceled by bank | Mark as FAILED |
| 05 | Payment canceled by user | Mark as FAILED |
| 24 | User canceled payment | Mark as FAILED |

---

## 👥 Bank Codes

Vietnam's major banks for payment selection:

| Code | Bank Name |
|------|-----------|
| NCB | Ngân hàng Quốc Tế (National Commercial Bank) |
| VCB | Ngân hàng Vietcombank |
| BIDV | Ngân hàng BIDV |
| ACB | Ngân hàng Á Châu |
| TCB | Ngân hàng Techcombank |
| SHB | Ngân hàng ShinhanBank |
| VIB | Ngân hàng Quốc Tế |
| EIB | Ngân hàng Xuất Nhập Khẩu |

---

## 🧪 Testing

### Test with Sandbox

1. **Create VNPay Test Account**
   - Visit: https://sandbox.vnpayment.vn/
   - Register merchant account
   - Get test credentials

2. **Test Card Numbers**
   ```
   SUCCESS:  9704198526191432198 (Any CVV, Any Date)
   FAILURE:  9704198526191432197 (Any CVV, Any Date)
   ```

3. **Test Payment Flow**
   ```bash
   # Create payment URL
   curl -X POST http://localhost:5000/api/payment/create-payment-url \
     -H "Content-Type: application/json" \
     -d '{"orderId": 1, "amount": 50000, "userId": 1}'

   # Copy returned paymentUrl
   # Open in browser
   # Enter test card details
   # Complete payment
   # Check order status updates
   ```

### Test with Postman

Import `VNPAY-POSTMAN.json` into Postman for easy testing.

---

## 🌐 Production Setup

### 1. VNPay Production Account
- Create production account at https://vnpayment.vn/
- Get production credentials
- Whitelist your IPN URL

### 2. Update Configuration
```bash
# .env
VNPAY_TMN_CODE=your_production_code
VNPAY_SECRET_KEY=your_production_key
VNPAY_URL=https://paygate.vnpayment.vn/paygate
VNPAY_RETURN_URL=https://yourdomain.com/order-success
VNPAY_IPN_URL=https://yourdomain.com/api/payment/ipn
```

### 3. SSL/HTTPS
```bash
# IPN webhook MUST use HTTPS

# Update your server
# - Install SSL certificate
# - Update VNPAY_IPN_URL to use https://
# - Ensure port 443 is open
```

### 4. Register IPN with VNPay
- Login to VNPay merchant dashboard
- Navigate to Settings → IPN URL
- Register your IPN endpoint
- Save and verify

### 5. Security Checklist
- [ ] Keep secret keys in environment variables
- [ ] Use HTTPS for all payment endpoints
- [ ] Implement rate limiting on payment endpoints
- [ ] Log all payment transactions
- [ ] Set up monitoring and alerts
- [ ] Test IPN webhook delivery
- [ ] Implement retry logic for failed payments
- [ ] Backup database regularly

---

## 📊 Monitoring & Logging

### Payment Event Logging
Every payment event is logged for reconciliation:

```javascript
console.log('[PAYMENT]', {
  transactionId,
  orderId,
  amount,
  status,
  responseCode,
  timestamp: new Date(),
});
```

### Database Queries for Reporting
```sql
-- Recent payments
SELECT * FROM PAYMENT_TRANSACTIONS 
ORDER BY CREATED_AT DESC 
LIMIT 10;

-- Failed payments
SELECT * FROM PAYMENT_TRANSACTIONS 
WHERE STATUS = 'FAILED' 
ORDER BY CREATED_AT DESC;

-- Total revenue (today)
SELECT SUM(AMOUNT) FROM PAYMENT_TRANSACTIONS 
WHERE STATUS = 'SUCCESS'
AND TRUNC(CREATED_AT) = TRUNC(SYSDATE);

-- Payment by bank
SELECT BANK_CODE, COUNT(*), SUM(AMOUNT) 
FROM PAYMENT_TRANSACTIONS 
WHERE STATUS = 'SUCCESS'
GROUP BY BANK_CODE;
```

---

## 🐛 Troubleshooting

### Issue: "Hash verification failed"
**Cause:** Secret key mismatch or request tampering
**Solution:** 
- Verify VNPAY_SECRET_KEY in .env matches VNPay dashboard
- Check IPN URL is accessible from internet

### Issue: "Order already paid"
**Cause:** Duplicate payment request for same order
**Solution:**
- Check database for existing successful payment
- Use different orderId for retry

### Issue: IPN not received
**Cause:** Network/firewall issue
**Solution:**
- Verify VNPAY_IPN_URL points to public, HTTPS endpoint
- Check firewall allows incoming connections
- Test with manual POST to /api/payment/ipn

### Issue: Payment Amount Mismatch
**Cause:** Amount calculation error
**Solution:**
- Verify amount is submitted as integer (not float)
- VNPay expects amount in hundredths of VND
- Example: 500,000 VND = 50,000,000

### Issue: "Invalid bank code"
**Cause:** Bank code not supported
**Solution:**
- Use bank codes from VNPay list
- Bank code is optional - user can select on VNPay page

---

## 📞 VNPay Support

- **Website:** https://vnpayment.vn/
- **Documentation:** https://sandbox.vnpayment.vn/docs/
- **Support Email:** support@vnpayment.vn
- **Merchant Dashboard:** https://merchant.vnpayment.vn/

---

## 📝 Implementation Checklist

### Backend Setup
- [ ] Install payment route
- [ ] Create database tables with vnpay-schema.sql
- [ ] Configure .env with VNPay credentials
- [ ] Update server.js with payment routes
- [ ] Test payment URL creation locally

### Frontend Setup
- [ ] Add VNPayCheckout component to checkout page
- [ ] Update OrderSuccessPage component
- [ ] Configure REACT_APP_API_URL environment variable
- [ ] Test payment URL generation

### Testing
- [ ] Set VNPAY_URL to sandbox endpoint
- [ ] Test with sandbox account and test card numbers
- [ ] Verify payment status updates
- [ ] Check database records are created
- [ ] Test transaction history API

### Production
- [ ] Create production VNPay account
- [ ] Obtain production credentials
- [ ] Update .env with production credentials
- [ ] Enable HTTPS on backend
- [ ] Register IPN URL with VNPay
- [ ] Update return and IPN URLs to production domain
- [ ] Test end-to-end with real card (small amount)
- [ ] Monitor transactions and set up alerts
- [ ] Document any custom payment rules

---

## 🎓 Key Concepts

### Transaction ID
```
Format: {orderId}_{timestamp}
Example: 12345_1703069800000
Purpose: Unique identifier for tracking payments
```

### Secure Hash
```
Algorithm: HMAC-SHA512
Input: All VNPay parameters (sorted)
Key: VNPAY_SECRET_KEY
Purpose: Verify data integrity and prevent tampering
```

### IPN Webhook
```
Type: Server-to-server callback
Frequency: Immediate after payment
Reliability: May fail - implement retry/reconciliation
Authentication: Secure hash verification
```

### Return URL
```
Type: Browser redirect callback
When: User returns from VNPay page
Purpose: Inform user of payment result
Note: Not error-proof - use IPN for authoritative confirmation
```

---

## 📚 File Structure

```
webbansach/
├── app/
│   └── order-success/
│       └── page.tsx          ← Use OrderSuccessVNPay component
├── components/
│   ├── VNPayCheckout.tsx     ← Checkout form
│   └── OrderSuccessVNPay.tsx ← Success page
├── lib/
│   └── services/
│       └── vnpayService.ts   ← API client
├── backend/
│   ├── config/
│   │   ├── db.js
│   │   └── vnpay.js          ← VNPay config
│   ├── routes/
│   │   ├── payment.js        ← All payment endpoints
│   │   └── ...
│   ├── utils/
│   │   └── vnpayUtils.js     ← Hash, URL utilities
│   ├── database/
│   │   └── vnpay-schema.sql  ← Database setup
│   ├── .env.vnpay.example    ← Config template
│   ├── README-VNPAY.md       ← Implementation guide
│   ├── VNPAY-API-DOCS.js     ← API reference
│   ├── VNPAY-EXAMPLES.js     ← Code examples
│   ├── VNPAY-POSTMAN.json    ← Postman collection
│   └── server.js             ← Updated with payment routes
```

---

## ✅ Verification Checklist

After implementation, verify:

1. **Backend**
   - [ ] `npm start` runs without errors
   - [ ] Payment endpoints are accessible
   - [ ] Database tables created successfully
   - [ ] Environment variables loaded correctly

2. **Frontend**
   - [ ] Components display correctly
   - [ ] Can create payment URL
   - [ ] Redirect to VNPay works
   - [ ] Return page displays results

3. **Payment Flow**
   - [ ] Order created before payment
   - [ ] Payment URL generated with correct amount
   - [ ] User redirected to VNPay
   - [ ] Return callback received
   - [ ] IPN webhook processed (if configured)
   - [ ] Database updated with payment status
   - [ ] Order status changed to PAID

4. **Security**
   - [ ] Hash verification working
   - [ ] Secret key not exposed
   - [ ] IPN URL is HTTPS (production)
   - [ ] Database transactions atomic

---

## 🎉 You're Ready!

Your VNPay integration is complete. Follow this checklist to get started:

1. ✅ Copy `.env.vnpay.example` to `.env` and configure
2. ✅ Run `vnpay-schema.sql` in Oracle
3. ✅ Start backend with `npm start`
4. ✅ Add VNPayCheckout component to checkout page
5. ✅ Test with sandbox credentials
6. ✅ Deploy to production with HTTPS
7. ✅ Monitor payment transactions

**Questions?** Check `README-VNPAY.md` and `VNPAY-API-DOCS.js` for details.
