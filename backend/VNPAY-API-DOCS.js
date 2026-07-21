/**
 * VNPay Payment Integration - API Documentation
 * Complete guide for payment processing flow
 */

/**
 * ============================================================================
 * FLOW OVERVIEW
 * ============================================================================
 * 
 * 1. User places order -> Order created with PENDING status
 * 2. Frontend calls POST /api/payment/create-payment-url
 * 3. Backend generates VNPay payment URL
 * 4. User redirected to VNPay payment page
 * 5. User completes payment on VNPay gateway
 * 6. Two callbacks:
 *    a) Browser redirect to /api/payment/return (HTTP GET)
 *    b) Server-to-server IPN webhook to /api/payment/ipn (HTTP POST)
 * 7. Database updated with payment status
 * 8. Frontend redirects to order success/failure page
 * 
 * ============================================================================
 * API ENDPOINTS
 * ============================================================================
 */

// =============================================================================
// 1. CREATE PAYMENT URL
// =============================================================================
/**
 * POST /api/payment/create-payment-url
 * 
 * Create a VNPay payment URL for an order
 * 
 * Request Body:
 * {
 *   "orderId": 123,                      // Order ID (required)
 *   "amount": 500000,                    // Amount in VND (required)
 *   "userId": 1,                         // User ID (required)
 *   "email": "user@example.com",         // User email (optional)
 *   "phone": "0901234567",               // User phone (optional)
 *   "bankCode": "NCB",                   // Bank code like NCB, AGRIBANK (optional)
 *   "ipAddress": "192.168.1.1"          // Client IP address (optional)
 * }
 * 
 * Response (Success):
 * {
 *   "success": true,
 *   "message": "Payment URL created successfully",
 *   "paymentUrl": "https://sandbox.vnpayment.vn/paygate?vnp_Amount=50000000&...",
 *   "transactionId": "123_1703069800000",
 *   "amount": 500000,
 *   "orderId": 123
 * }
 * 
 * Response (Error):
 * {
 *   "success": false,
 *   "message": "Order already paid"
 * }
 * 
 * Notes:
 * - Amount must be positive integer
 * - Order must exist and belong to the user
 * - Order status must not be PAID or COMPLETED
 * - Transaction expires in 15 minutes by default
 */

// Example Request (cURL):
/*
curl -X POST http://localhost:5000/api/payment/create-payment-url \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": 123,
    "amount": 500000,
    "userId": 1,
    "email": "user@example.com",
    "phone": "0901234567",
    "bankCode": "NCB"
  }'
*/

// =============================================================================
// 2. PAYMENT RETURN (Browser Redirect)
// =============================================================================
/**
 * GET /api/payment/return
 * 
 * VNPay redirects user back to this URL after payment completion
 * Called by browser, so user sees the response
 * 
 * Query Parameters (from VNPay):
 * All VNPay response parameters are passed as query strings:
 * - vnp_Amount: Payment amount (in hundredths of VND)
 * - vnp_BankCode: Bank code used for payment
 * - vnp_BankTranNo: Bank transaction number
 * - vnp_CardType: Credit/Debit card type
 * - vnp_OrderInfo: Order information
 * - vnp_PayDate: Payment date (YYYYMMDDHHmmss)
 * - vnp_ResponseCode: Payment status code
 * - vnp_TMN_Code: Merchant code
 * - vnp_TransactionNo: VNPay transaction number
 * - vnp_TxnRef: Transaction reference (our transaction ID)
 * - vnp_SecureHash: Secure hash for verification
 * 
 * Response (Success):
 * {
 *   "success": true,
 *   "message": "Payment successful",
 *   "transactionId": "123_1703069800000",
 *   "amount": 500000,
 *   "responseCode": "00",
 *   "bankTranNo": "123456789"
 * }
 * 
 * Response (Failed):
 * {
 *   "success": false,
 *   "message": "Payment canceled by user",
 *   "transactionId": "123_1703069800000",
 *   "amount": 500000,
 *   "responseCode": "24"
 * }
 * 
 * Notes:
 * - Order status is updated to PAID if responseCode == '00'
 * - This is called by browser, so user can see the result
 * - IPN webhook may also be called by VNPay server-to-server
 */

// =============================================================================
// 3. IPN WEBHOOK (Server-to-Server)
// =============================================================================
/**
 * POST /api/payment/ipn
 * 
 * VNPay sends payment confirmation to this endpoint via server-to-server
 * This is the authoritative payment confirmation
 * IMPORTANT: This endpoint must be accessible from the internet!
 * 
 * Request Body:
 * {
 *   "vnp_Amount": 50000000,              // Amount in hundredths of VND
 *   "vnp_BankCode": "NCB",
 *   "vnp_BankTranNo": "123456789",
 *   "vnp_CardType": "ATM",
 *   "vnp_OrderInfo": "Payment for order 123",
 *   "vnp_PayDate": "20231220142030",
 *   "vnp_ResponseCode": "00",            // 00 = Success
 *   "vnp_TMN_Code": "TESTMERCHANT",
 *   "vnp_TransactionNo": "14270500",
 *   "vnp_TxnRef": "123_1703069800000",
 *   "vnp_SecureHash": "...",
 *   "vnp_SecureHashType": "SHA512"
 * }
 * 
 * Important Response (to VNPay):
 * Always return HTTP 200 immediately:
 * {
 *   "RspCode": "00",
 *   "Message": "Received"
 * }
 * 
 * Notes:
 * - Always respond with 200 OK to acknowledge receipt
 * - Payment verification happens after acknowledgment
 * - This is called by VNPay server, so HTTPS/Security is important
 * - Order and transaction updated asynchronously after response
 */

// =============================================================================
// 4. QUERY PAYMENT STATUS
// =============================================================================
/**
 * POST /api/payment/query-status
 * 
 * Query payment status from VNPay if confirmation not received
 * Used for reconciliation and error recovery
 * 
 * Request Body:
 * {
 *   "transactionId": "123_1703069800000",  // Our transaction ID (required)
 *   "transactionNo": "14270500",           // VNPay transaction number (optional)
 *   "transactionDate": "20231220"          // Transaction date (required, format: YYYYMMDD)
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Query request prepared",
 *   "transactionId": "123_1703069800000",
 *   "queryParams": { ... }
 * }
 * 
 * Notes:
 * - Implementation requires actual HTTP call to VNPay API
 * - Useful for reconciliation between DB and VNPay
 */

// =============================================================================
// 5. REQUEST REFUND
// =============================================================================
/**
 * POST /api/payment/refund
 * 
 * Request refund for a paid transaction
 * Note: Full refunds are typically processed via VNPay merchant dashboard
 * 
 * Request Body:
 * {
 *   "transactionId": "123_1703069800000",  // Transaction ID (required)
 *   "orderId": 123,                        // Order ID (required)
 *   "refundAmount": 500000,                // Refund amount in VND (required)
 *   "reason": "Customer requested refund"  // Refund reason (optional)
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Refund request submitted...",
 *   "transactionId": "123_1703069800000",
 *   "refundAmount": 500000,
 *   "note": "VNPay refunds must be processed through merchant dashboard..."
 * }
 */

// =============================================================================
// 6. TRANSACTION HISTORY
// =============================================================================
/**
 * GET /api/payment/transaction-history/:userId
 * 
 * Get payment transaction history for a user
 * 
 * Query Parameters:
 * - limit: Results per page (default: 10)
 * - offset: Results offset (default: 0)
 * 
 * Response:
 * {
 *   "success": true,
 *   "transactions": [
 *     {
 *       "TRANSACTION_ID": "123_1703069800000",
 *       "ORDER_ID": 123,
 *       "AMOUNT": 500000,
 *       "STATUS": "SUCCESS",
 *       "RESPONSE_CODE": "00",
 *       "PAYMENT_METHOD": "VNPAY",
 *       "BANK_CODE": "NCB",
 *       "CREATED_AT": "2023-12-20 14:30:00",
 *       "PAY_DATE": "20231220143000"
 *     }
 *   ],
 *   "limit": 10,
 *   "offset": 0
 * }
 */

// =============================================================================
// VNPAY RESPONSE CODES
// =============================================================================
/*
Code  | Meaning
------|--------
00    | Success
01    | Bank connection timeout
02    | Invalid bank details
04    | Payment canceled/rejected by bank
05    | Payment canceled (by user)
06    | Transaction pending
07    | Transaction rejected
09    | Card/Account locked
10    | Confirmed timeout
11    | Out of session
12    | Invalid OTP
24    | User canceled payment
*/

// =============================================================================
// BANK CODES (Examples)
// =============================================================================
/*
NCB     | Ngân hàng Quốc Tế (National Commercial Bank)
AGRIBANK| Ngân hàng Nông nghiệp & Phát triển Nông thôn
ACB     | Ngân hàng Á Châu (Asia Commercial Bank)
VBA     | Ngân hàng Đầu tư và Phát triển Việt Nam
SACOMBANK| Ngân hàng Sài Gòn Công Thương
BIDV    | Ngân hàng Khoa học Kỹ thuật Việt Nam
VCB     | Ngân hàng Vietcombank
EIB     | Ngân hàng Xuất Nhập Khẩu Việt Nam
TCB     | Ngân hàng Kỹ Thương (Techcombank)
SHB     | Ngân hàng ShinhanBank
IVB     | Ngân hàng Quốc Tế Việt Nam (VNIBID)
MSB     | Ngân hàng Hàng Hải
OCB     | Ngân hàng Phương Đông
VIB     | Ngân hàng Quốc Tế
*/

module.exports = {
  // API documentation reference only
  // See README-VNPAY.md for implementation details
};
