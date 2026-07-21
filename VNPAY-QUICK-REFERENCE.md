# VNPay Integration - Quick Reference & Checklist

## 📋 Files Overview

| File | Purpose | Location |
|------|---------|----------|
| `vnpay.js` | Configuration settings | `backend/config/` |
| `vnpayUtils.js` | Hash & URL utilities | `backend/utils/` |
| `payment.js` | All API routes | `backend/routes/` |
| `vnpay-schema.sql` | Database tables | `backend/database/` |
| `.env.vnpay.example` | Environment template | `backend/` |
| `vnpayService.ts` | Frontend service | `lib/services/` |
| `VNPayCheckout.tsx` | Checkout form | `components/` |
| `OrderSuccessVNPay.tsx` | Success page | `components/` |
| `README-VNPAY.md` | Full guide | `backend/` |
| `VNPAY-IMPLEMENTATION.md` | Implementation details | `root/` |

---

## ⚙️ Configuration Steps

### 1. Environment Setup
```bash
# Copy template
cp backend/.env.vnpay.example backend/.env

# Edit .env with your credentials
VNPAY_TMN_CODE=your_merchant_code
VNPAY_SECRET_KEY=your_secret_key
VNPAY_MERCHANT_NAME=Your Store Name
VNPAY_RETURN_URL=http://localhost:3000/order-success
VNPAY_IPN_URL=http://localhost:5000/api/payment/ipn
```

### 2. Database Setup
```sql
-- Execute in Oracle SQL Developer/Client
@backend/database/vnpay-schema.sql

-- Verify tables created
DESC PAYMENT_TRANSACTIONS;
DESC REFUND_REQUESTS;
```

### 3. Backend Configuration
✅ Already done - payment route added to `server.js`

### 4. Frontend Integration
Add to your checkout page:
```typescript
import VNPayCheckout from '@/components/VNPayCheckout';

// In checkout page
<VNPayCheckout 
  orderId={orderId}
  amount={totalAmount}
  userId={userId}
  userEmail={email}
/>
```

---

## 🔄 Payment API Endpoints

### Create Payment
```
POST /api/payment/create-payment-url
├─ Body: { orderId, amount, userId, email?, phone?, bankCode? }
└─ Returns: { success, paymentUrl, transactionId }
```

### Return Callback
```
GET /api/payment/return?vnp_Amount=...&vnp_ResponseCode=...
├─ Called by: Browser after user completes payment
└─ Auto-updates: Order status, transaction status
```

### IPN Webhook
```
POST /api/payment/ipn
├─ Called by: VNPay server-to-server
├─ Response: { RspCode: "00", Message: "Received" }
└─ Auto-updates: Order status, transaction status
```

### Query Status
```
POST /api/payment/query-status
├─ Body: { transactionId, transactionDate }
└─ Use for: Reconciliation if IPN fails
```

### Request Refund
```
POST /api/payment/refund
├─ Body: { transactionId, orderId, refundAmount, reason? }
└─ Note: Actual refund via VNPay merchant dashboard
```

### Transaction History
```
GET /api/payment/transaction-history/:userId?limit=10&offset=0
└─ Returns: User's payment transactions
```

---

## 🧪 Testing Checklist

### Sandbox Testing
- [ ] Create VNPay sandbox account
- [ ] Get sandbox credentials
- [ ] Update `.env` with sandbox URLs
- [ ] Use test card: `9704198526191432198`
- [ ] Test successful payment
- [ ] Test failed payment (card: `9704198526191432197`)
- [ ] Verify database updates
- [ ] Check transaction history

### Integration Testing
- [ ] Create order first
- [ ] Call `/api/payment/create-payment-url`
- [ ] Redirect to VNPay
- [ ] Complete payment on VNPay
- [ ] Verify return callback
- [ ] Verify IPN webhook (if deployed)
- [ ] Check order status = PAID
- [ ] Verify transaction recorded

---

## 🚀 Production Deployment

### Pre-Deployment
- [ ] Create production VNPay account
- [ ] Get production credentials
- [ ] Update `.env` with production values
- [ ] Change VNPAY_URL to production
- [ ] Update VNPAY_RETURN_URL to production domain
- [ ] Update VNPAY_IPN_URL to HTTPS

### Security Setup
- [ ] Install SSL certificate
- [ ] Verify HTTPS on IPN endpoint
- [ ] Register IPN URL with VNPay
- [ ] Whitelist return URL with VNPay
- [ ] Keep secret keys safe (never commit)

### Post-Deployment
- [ ] Test with small payment amount
- [ ] Monitor transaction logs
- [ ] Set up payment alerts
- [ ] Test IPN webhook delivery
- [ ] Verify email notifications

---

## 🔐 Environment Variables

```bash
# VNPay Credentials (from dashboard)
VNPAY_TMN_CODE=MERCHANT_CODE
VNPAY_SECRET_KEY=SECRET_KEY_1234...
VNPAY_HASH_SECRET=SECRET_KEY_1234...
VNPAY_MERCHANT_ID=000000

# VNPay URLs
VNPAY_URL=https://sandbox.vnpayment.vn/paygate        # Sandbox
VNPAY_API_URL=https://sandbox.vnpayment.vn/merchant_webapi/merchant_information

# Application URLs
VNPAY_RETURN_URL=http://localhost:3000/order-success
VNPAY_IPN_URL=http://localhost:5000/api/payment/ipn

# Database
DB_USER=system
DB_PASSWORD=123456
DB_CONNECT_STRING=localhost:1521/orcl21pdb1

# App
PORT=5000
NODE_ENV=development
```

---

## 💡 Code Examples

### Frontend - Trigger Payment
```typescript
import { createVNPayPayment } from '@/lib/services/vnpayService';

const handlePayment = async () => {
  const response = await createVNPayPayment({
    orderId: 123,
    amount: 500000,
    userId: 1,
    email: 'user@example.com'
  });
  
  // Redirect to VNPay
  window.location.href = response.paymentUrl;
};
```

### Frontend - Handle Return
```typescript
import { parsePaymentReturn } from '@/lib/services/vnpayService';

useEffect(() => {
  const result = parsePaymentReturn();
  
  if (result.isSuccess) {
    // Payment successful
    showSuccessMessage();
  } else {
    // Payment failed
    showErrorMessage(result.message);
  }
}, []);
```

### Backend - Verify IPN
```javascript
router.post('/ipn', async (req, res) => {
  // Always respond 200 OK first
  res.status(200).json({ RspCode: '00', Message: 'Received' });
  
  // Verify secure hash
  const isValid = vnpayUtils.verifyHash(req.body);
  if (!isValid) return; // Invalid signature
  
  // Process payment
  const paymentResult = vnpayUtils.parseReturnData(req.body);
  const isSuccessful = vnpayUtils.isPaymentSuccessful(paymentResult.responseCode);
  
  // Update database
  // ...
});
```

---

## 🐛 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Hash verification failed | Secret key mismatch | Verify VNPAY_SECRET_KEY in .env |
| Order already paid | Duplicate payment | Use unique orderId |
| IPN not received | Network blocked | Check firewall, use HTTPS |
| Amount mismatch | Incorrect calculation | Ensure amount is integer |
| Invalid bank code | Unsupported bank | Use bank codes from list |
| Redirect loop | Incorrect URLs | Verify VNPAY_RETURN_URL |

---

## 📊 Database Queries

### Recent Transactions
```sql
SELECT * FROM PAYMENT_TRANSACTIONS 
ORDER BY CREATED_AT DESC 
LIMIT 10;
```

### Failed Payments
```sql
SELECT * FROM PAYMENT_TRANSACTIONS 
WHERE STATUS = 'FAILED' 
ORDER BY CREATED_AT DESC;
```

### Daily Revenue
```sql
SELECT SUM(AMOUNT) as REVENUE 
FROM PAYMENT_TRANSACTIONS 
WHERE STATUS = 'SUCCESS'
AND TRUNC(CREATED_AT) = TRUNC(SYSDATE);
```

### Payment By Bank
```sql
SELECT BANK_CODE, COUNT(*) as COUNT, SUM(AMOUNT) as TOTAL 
FROM PAYMENT_TRANSACTIONS 
WHERE STATUS = 'SUCCESS'
GROUP BY BANK_CODE
ORDER BY TOTAL DESC;
```

---

## 📞 Support Resources

| Resource | URL |
|----------|-----|
| VNPay Website | https://vnpayment.vn/ |
| Sandbox | https://sandbox.vnpayment.vn/ |
| Documentation | https://sandbox.vnpayment.vn/docs/ |
| Support Email | support@vnpayment.vn |
| Merchant Dashboard | https://merchant.vnpayment.vn/ |

---

## ✅ Final Checklist

### Before Going Live
- [ ] Database tables created
- [ ] Environment variables configured
- [ ] Backend routes registered
- [ ] Frontend components integrated
- [ ] Tested with sandbox account
- [ ] SSL certificate installed
- [ ] IPN URL registered with VNPay
- [ ] Production credentials configured
- [ ] Return URL updated to production
- [ ] Monitoring/alerts set up
- [ ] Documentation reviewed

### After Going Live
- [ ] Monitor first few transactions
- [ ] Check payment notifications
- [ ] Verify order status updates
- [ ] Test with small amount first
- [ ] Monitor logs for errors
- [ ] Set up backup payment method
- [ ] Plan for payment failures

---

## 🎯 Usage Summary

```
1. User clicks "Pay with VNPay"
   ↓
2. Frontend calls POST /api/payment/create-payment-url
   ↓
3. Backend creates transaction record and returns paymentUrl
   ↓
4. Frontend redirects to paymentUrl (VNPay gateway)
   ↓
5. User enters payment details on VNPay
   ↓
6. VNPay processes payment
   ↓
7. Two callbacks:
   ├─ GET /api/payment/return (browser redirect)
   └─ POST /api/payment/ipn (server-to-server)
   ↓
8. Backend updates PAYMENT_TRANSACTIONS status
   ↓
9. Backend updates ORDERS status to PAID
   ↓
10. Frontend displays success/failure message
    ↓
11. User can view order in account section
```

---

**Ready to integrate? Start with Setup Steps above!** 🚀
