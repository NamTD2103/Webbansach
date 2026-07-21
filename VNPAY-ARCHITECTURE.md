# VNPay Integration - Architecture & Data Flow

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  React + Next.js                                       │  │
│  │  ├─ VNPayCheckout.tsx      (Payment form)            │  │
│  │  ├─ OrderSuccessVNPay.tsx   (Result page)            │  │
│  │  └─ vnpayService.ts         (API client)             │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                              ↓ HTTPS
┌──────────────────────────────────────────────────────────────┐
│                   APPLICATION TIER (Backend)                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Node.js + Express                                     │  │
│  │  ├─ payment.js              (API Routes)              │  │
│  │  │  ├─ /create-payment-url  (Generate link)          │  │
│  │  │  ├─ /return              (Browser callback)        │  │
│  │  │  ├─ /ipn                 (Server webhook)         │  │
│  │  │  ├─ /query-status        (Status lookup)          │  │
│  │  │  ├─ /refund              (Refund request)         │  │
│  │  │  └─ /transaction-history (Transaction list)       │  │
│  │  ├─ vnpayUtils.js           (Utilities)               │  │
│  │  │  ├─ generateHash()         (HMAC-SHA512)          │  │
│  │  │  ├─ createPaymentUrl()     (URL generation)       │  │
│  │  │  └─ verifyHash()           (Hash verification)    │  │
│  │  └─ vnpay.js                (Configuration)           │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
     ↓ SQL                                          ↓ HTTPS
┌─────────────────────┐                  ┌──────────────────────┐
│   Oracle Database   │                  │   VNPay Gateway      │
│                     │                  │                      │
│ PAYMENT_TRANSACTIONS│                  │ Sandbox/Production   │
│ REFUND_REQUESTS     │                  │                      │
│ ORDERS (PAID status)│                  │ ┌────────────────┐   │
└─────────────────────┘                  │ │ Payment Form   │   │
     ↑ Update                            │ │ Card Details   │   │
     └──────────────┬─────────────────────├─┤ Processing    │   │
                    │                    │ │ Confirmation   │   │
                    │                    │ └────────────────┘   │
                    └────────────────────┴──────────────────────┘
```

---

## 💳 Payment Processing Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      STEP 1: ORDER CREATION                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User selects products → Click "Checkout"                      │
│       ↓                                                         │
│  Frontend sends: POST /api/order/create                        │
│  {                                                             │
│    userId, items[], paymentMethod: "VNPAY"                   │
│  }                                                             │
│       ↓                                                         │
│  Backend creates ORDER in DB:                                  │
│    ORDER_ID: 12345                                            │
│    STATUS: PENDING                                             │
│    TOTAL_AMOUNT: null (filled after payment)                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 STEP 2: CREATE PAYMENT URL                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Frontend displays VNPayCheckout component                     │
│       ↓                                                         │
│  User selects bank (optional) and clicks "Pay"                 │
│       ↓                                                         │
│  Frontend sends: POST /api/payment/create-payment-url          │
│  {                                                             │
│    orderId: 12345                                             │
│    amount: 500000 (VND)                                       │
│    userId: 1                                                   │
│    email: "user@example.com"                                  │
│    bankCode: "NCB" (optional)                                 │
│  }                                                             │
│       ↓                                                         │
│  Backend:                                                       │
│    1. Verify order exists                                      │
│    2. Generate transactionId: "12345_1703069800000"           │
│    3. Build VNPay parameters with secret hash                 │
│    4. Store PAYMENT_TRANSACTION (PENDING)                     │
│    5. Return paymentUrl                                        │
│                                                                 │
│  Response:                                                      │
│  {                                                             │
│    success: true                                              │
│    paymentUrl: "https://sandbox.vnpayment.vn/paygate?..."    │
│    transactionId: "12345_1703069800000"                       │
│    amount: 500000                                             │
│  }                                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              STEP 3: REDIRECT TO VNPAY GATEWAY                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Frontend: window.location.href = paymentUrl                  │
│       ↓                                                         │
│  Browser redirects to VNPay payment page                       │
│       ↓                                                         │
│  User enters:                                                   │
│    - Card number                                               │
│    - Expiry date                                               │
│    - CVV                                                       │
│    - OTP password                                              │
│       ↓                                                         │
│  VNPay processes payment on payment processor                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│           STEP 4: DUAL CALLBACKS (Two confirmations)           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ CALLBACK 1: IPN Webhook (Server-to-Server) ────────────┐  │
│  │                                                          │  │
│  │  VNPay → Backend (Server-to-Server)                     │  │
│  │  POST /api/payment/ipn                                  │  │
│  │  {                                                      │  │
│  │    vnp_Amount: 50000000 (in hundredths)                │  │
│  │    vnp_BankCode: "NCB"                                │  │
│  │    vnp_ResponseCode: "00" (success)                   │  │
│  │    vnp_TransactionNo: 14270500                        │  │
│  │    vnp_TxnRef: "12345_1703069800000"                 │  │
│  │    vnp_SecureHash: "abc123..." (HMAC-SHA512)         │  │
│  │  }                                                      │  │
│  │                                                          │  │
│  │  Backend verifies:                                       │  │
│  │    1. Secure hash (HMAC-SHA512)                         │  │
│  │    2. Merchant code matches                             │  │
│  │    3. Transaction not already processed                 │  │
│  │                                                          │  │
│  │  Backend responds IMMEDIATELY:                          │  │
│  │  { RspCode: "00", Message: "Received" }               │  │
│  │                                                          │  │
│  │  Backend processes ASYNCHRONOUSLY:                      │  │
│  │    1. Update PAYMENT_TRANSACTIONS (SUCCESS)             │  │
│  │    2. Update ORDERS status (PAID)                       │  │
│  │    3. Clear cart items                                  │  │
│  │    4. Send confirmation email                           │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ CALLBACK 2: Return URL (Browser Redirect) ──────────────┐  │
│  │                                                          │  │
│  │  VNPay → Frontend (Browser Redirect)                    │  │
│  │  GET /api/payment/return?vnp_Amount=...&              │  │
│  │      vnp_ResponseCode=00&vnp_TransactionNo=...&       │  │
│  │      vnp_SecureHash=...                               │  │
│  │                                                          │  │
│  │  Frontend receives return parameters                    │  │
│  │       ↓                                                  │  │
│  │  Backend verifies hash                                  │  │
│  │       ↓                                                  │  │
│  │  Response:                                              │  │
│  │  {                                                      │  │
│  │    success: true                                       │  │
│  │    message: "Payment successful"                       │  │
│  │    transactionId: "12345_1703069800000"                │  │
│  │    amount: 500000                                      │  │
│  │  }                                                      │  │
│  │                                                          │  │
│  │  Frontend displays OrderSuccessVNPay component          │  │
│  │  User sees: Order confirmation                          │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   STEP 5: COMPLETION                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Database State:                                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ ORDERS Table:                                           │  │
│  │  ORDER_ID: 12345                                       │  │
│  │  USER_ID: 1                                            │  │
│  │  STATUS: PAID ✓                                        │  │
│  │  TOTAL_AMOUNT: 500000                                  │  │
│  │  PAYMENT_METHOD: VNPAY                                │  │
│  │                                                         │  │
│  │ PAYMENT_TRANSACTIONS Table:                            │  │
│  │  TRANSACTION_ID: 12345_1703069800000                   │  │
│  │  ORDER_ID: 12345                                       │  │
│  │  AMOUNT: 500000                                        │  │
│  │  STATUS: SUCCESS ✓                                     │  │
│  │  RESPONSE_CODE: 00                                     │  │
│  │  TRANSACTION_NO: 14270500                              │  │
│  │  BANK_CODE: NCB                                        │  │
│  │  CREATED_AT: 2023-12-20 14:30:00                       │  │
│  │  PAY_DATE: 20231220143045                              │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Frontend displays:                                            │
│  ✓ Order confirmation                                         │
│  ✓ Payment status                                             │
│  ✓ Transaction details                                        │
│  ✓ Links to order tracking                                    │
│                                                                 │
│  User can:                                                     │
│  → View order details                                         │
│  → Continue shopping                                          │
│  → Track delivery                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔀 Alternate Flows

### Failed Payment
```
User enters wrong card details
         ↓
VNPay returns: responseCode = "24" (User canceled)
         ↓
IPN Webhook: UPDATE PAYMENT_TRANSACTIONS status = FAILED
         ↓
Order status remains: PENDING
         ↓
Frontend displays: "Payment failed, click to retry"
         ↓
User can retry with new payment method
```

### Lost IPN Webhook
```
VNPay fails to deliver IPN (network issue)
         ↓
Browser callback still works
         ↓
Frontend shows success to user
         ↓
Order status remains: PENDING (in database)
         ↓
Backend reconciliation job runs hourly:
  - Checks PENDING orders
  - Queries VNPay for status
  - Updates if payment confirmed
```

### Refund Request
```
User requests refund within 30 days
         ↓
Backend: POST /api/payment/refund
         ↓
REFUND_REQUESTS table: status = PENDING
         ↓
Admin reviews and processes in VNPay dashboard
         ↓
VNPay refunds customer account
         ↓
REFUND_REQUESTS table: status = COMPLETED
```

---

## 🗄️ Database Schema Diagram

```
ORDERS
├─ ORDER_ID (PK)
├─ USER_ID (FK) → USERS
├─ STATUS: PENDING | PAID | SHIPPED | DELIVERED | CANCELLED
├─ TOTAL_AMOUNT: 500000
├─ PAYMENT_METHOD: VNPAY
├─ CREATED_AT
└─ UPDATED_AT

PAYMENT_TRANSACTIONS
├─ TRANSACTION_ID (PK) "12345_1703069800000"
├─ ORDER_ID (FK) → ORDERS
├─ USER_ID (FK) → USERS
├─ AMOUNT: 500000
├─ STATUS: PENDING | SUCCESS | FAILED
├─ RESPONSE_CODE: "00"
├─ PAYMENT_METHOD: VNPAY
├─ TRANSACTION_NO: "14270500" (from VNPay)
├─ BANK_CODE: "NCB"
├─ BANK_TRAN_NO: "VN123456"
├─ CARD_TYPE: "ATM"
├─ PAY_DATE: "20231220143045"
├─ TRANSACTION_DATA: { ...full response... }
├─ CREATED_AT
└─ UPDATED_AT

REFUND_REQUESTS
├─ REFUND_ID (PK)
├─ TRANSACTION_ID (FK) → PAYMENT_TRANSACTIONS
├─ ORDER_ID (FK) → ORDERS
├─ AMOUNT: 500000
├─ REASON: "Customer changed mind"
├─ STATUS: PENDING | APPROVED | REJECTED | COMPLETED
├─ RESPONSE_CODE: "01"
├─ REFUND_TRANSACTION_NO: "20231220_001"
├─ NOTES: "Refund processed"
├─ CREATED_AT
├─ UPDATED_AT
└─ COMPLETED_AT

INDEX: idx_payment_order (PAYMENT_TRANSACTIONS.ORDER_ID)
INDEX: idx_payment_user (PAYMENT_TRANSACTIONS.USER_ID)
INDEX: idx_payment_status (PAYMENT_TRANSACTIONS.STATUS)
INDEX: idx_payment_created (PAYMENT_TRANSACTIONS.CREATED_AT)
INDEX: idx_refund_status (REFUND_REQUESTS.STATUS)
```

---

## 🔐 Security & Hashing

### Hash Generation Process
```
Parameters from Frontend:
{
  orderId: 12345,
  amount: 500000,
  userId: 1,
  email: "user@example.com"
}
         ↓
Backend builds VNPay params:
{
  vnp_Version: "2.1.0",
  vnp_Command: "pay",
  vnp_TmnCode: "TESTMERCHANT",
  vnp_Locale: "vn",
  vnp_CurrCode: "VND",
  vnp_TxnRef: "12345_1703069800000",
  vnp_OrderInfo: "Payment for order 12345",
  vnp_Amount: 50000000,  // In hundredths
  vnp_ReturnUrl: "http://localhost:3000/order-success",
  vnp_CreateDate: "20231220143000",
  vnp_ExpireDate: "20231220143015"
}
         ↓
Sort params alphabetically:
{
  vnp_Amount: "50000000",
  vnp_Command: "pay",
  vnp_CreateDate: "20231220143000",
  vnp_CurrCode: "VND",
  vnp_ExpireDate: "20231220143015",
  vnp_Locale: "vn",
  vnp_OrderInfo: "Payment for order 12345",
  vnp_ReturnUrl: "http://localhost:3000/order-success",
  vnp_TmnCode: "TESTMERCHANT",
  vnp_TxnRef: "12345_1703069800000",
  vnp_Version: "2.1.0"
}
         ↓
Convert to query string:
"vnp_Amount=50000000&vnp_Command=pay&vnp_CreateDate=20231220143000&..."
         ↓
Generate HMAC-SHA512 with secret key:
HMAC = crypto.createHmac('sha512', 'SECRET_KEY')
                 .update(queryString)
                 .digest('hex')
         ↓
Result: abc123...xyz789
         ↓
Add to params:
{
  ...all params...
  vnp_SecureHash: "abc123...xyz789"
}
         ↓
Build payment URL:
https://sandbox.vnpayment.vn/paygate?
  vnp_Amount=50000000&
  vnp_Command=pay&
  vnp_SecureHash=abc123...xyz789&
  ...other params...
```

### Hash Verification Process
```
Receive callback from VNPay:
{
  vnp_Amount: "50000000",
  vnp_BankCode: "NCB",
  vnp_ResponseCode: "00",
  vnp_SecureHash: "abc123...xyz789"  ← Secure hash from VNPay
}
         ↓
Extract secure hash:
receivedHash = "abc123...xyz789"
         ↓
Recalculate hash with same parameters:
(excluding vnp_SecureHash from calculation)
         ↓
Sort & create query string again
         ↓
Generate HMAC-SHA512:
calculatedHash = crypto.createHmac('sha512', 'SECRET_KEY')
                          .update(queryString)
                          .digest('hex')
         ↓
Compare with timing-safe equality:
if (calculatedHash !== receivedHash) {
  // INVALID - Potential tampering!
  throw new Error('Invalid signature');
}
         ↓
If hash valid:
✓ Data integrity verified
✓ Request from VNPay (not attacker)
✓ Process payment safely
```

---

## 📊 Request/Response Sequence

```
Time    Client              Backend             Oracle            VNPay
─────────────────────────────────────────────────────────────────────────────
T0  ┌─POST /order/create
    │─────────────────────→ ┌─Create ORDER
    │                       │ Write to DB
                            │─────────────────→ ORDER_ID=12345
    │                       │                   status=PENDING
    │                       │                   ←─────────────────
    │ ←─────────────────────┤ Return orderId
    │ orderId=12345

T1  │ ┌─POST /payment/create-payment-url
    │ │ orderId=12345
    │ │ amount=500000
    │─────────────────────→ ┌─Verify order exists
    │                       │ Check status != PAID
    │                       │ Generate transactionId
    │                       │ Build VNPay params
    │                       │ Create secure hash
    │                       │ Insert PAYMENT_TRANSACTION
    │                       │─────────────────→ TRANSACTION_ID=12345_xxx
    │                       │                   status=PENDING
    │                       │                   ←─────────────────
    │ ←─────────────────────┤ Return paymentUrl
    │ paymentUrl=https://...&vnp_SecureHash=...

T2  │ ┌─Redirect to paymentUrl
    │─────────────────────────────────────────────────────────────→ VNPay
    │                                                               Gateway
    │                                                               Opens

T3  │ User enters card details on VNPay page
    │                                                               ↓
    │                                                               Process
    │                                                               Payment

T4  │                                           IPN Webhook:
    │                                           POST /payment/ipn
    │                                           ←────────────────

    │                                           ┌─Verify hash
    │                                           │ Extract params
    │                                           │ Update PAYMENT_TRANSACTIONS
    │                                           │─────────────→ UPDATE status=SUCCESS
    │                                           │                ←────────────────
    │                                           │ Update ORDERS
    │                                           │─────────────→ UPDATE status=PAID
    │                                           │                ←────────────────
    │                                           │ Response 200 OK
    │                                           │ (Async complete)

T5  │                                           Browser Redirect:
    │                                           GET /payment/return?...
    │ ←────────────────────────────────────────←────────────────

    │ ┌─Parse return params
    │ │ Display OrderSuccessVNPay
    │ └─Show payment result

T6  │ ┌─GET /transaction-history/1
    │─────────────────────→ ┌─Query PAYMENT_TRANSACTIONS
    │                       │─────────────────→ SELECT * WHERE USER_ID=1
    │                       │                   Returns transaction records
    │                       │                   ←─────────────────
    │ ←─────────────────────┤ Return history
    │ transactions=[...]

```

---

## 🧪 Error Handling Flows

```
ERROR: Hash Verification Failed
├─ Cause: Secret key mismatch OR tampering attempt
├─ Detection: crypto.timingSafeEqual() returns false
├─ Action: Log security alert, do NOT process payment
├─ Response: 400 Bad Request "Invalid signature"
└─ Recovery: Check VNPAY_SECRET_KEY in environment

ERROR: Order Not Found
├─ Cause: Invalid orderId or unauthorized user
├─ Detection: Database query returns no results
├─ Action: Log attempt
├─ Response: 404 Not Found "Order not found"
└─ Recovery: Verify order exists before creating payment

ERROR: Duplicate Payment
├─ Cause: User clicked "Pay" multiple times
├─ Detection: Check PAYMENT_TRANSACTIONS status is not PENDING
├─ Action: Return existing payment URL
├─ Response: 400 Bad Request "Payment already in progress"
└─ Recovery: Reuse existing transaction ID

ERROR: IPN Webhook Timeout
├─ Cause: VNPay cannot reach your IPN URL
├─ Detection: No POST to /payment/ipn received
├─ Action: Reconciliation job queries VNPay hourly
├─ Response: User sees browser redirect instead
├─ Recovery: Manual query via /payment/query-status

ERROR: Invalid Bank Code
├─ Cause: User selects unsupported bank
├─ Detection: Bank code not in VNPay supported list
├─ Action: VNPay rejects payment with response code 02
├─ Response: User sees "Invalid bank details"
└─ Recovery: Select different bank or payment method
```

---

## 📈 Performance Optimization

```
Database Indexes:
├─ idx_payment_order (PAYMENT_TRANSACTIONS.ORDER_ID)
│  └─ For: Quick lookup payments for order
├─ idx_payment_user (PAYMENT_TRANSACTIONS.USER_ID)
│  └─ For: Transaction history queries
├─ idx_payment_status (PAYMENT_TRANSACTIONS.STATUS)
│  └─ For: Find pending/failed payments
└─ idx_payment_created (PAYMENT_TRANSACTIONS.CREATED_AT)
   └─ For: Date-range queries, reports

Connection Pooling:
├─ Min: 2 connections
├─ Max: 10 connections
├─ Reuse: Connection kept alive for 60 seconds
└─ Benefit: No connection overhead per request

Query Optimization:
├─ Use indexes for WHERE clauses
├─ LIMIT joins with conditions
├─ Avoid full table scans
└─ Use OFFSET pagination for large result sets
```

---

This complete architecture ensures:
✅ Secure payment processing  
✅ Reliable order tracking  
✅ Audit trail for all transactions  
✅ Quick recovery from failures  
✅ High performance at scale  
