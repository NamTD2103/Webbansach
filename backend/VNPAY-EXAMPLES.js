/**
 * VNPay Integration - Example Request/Response
 * Complete working examples for testing
 */

// =============================================================================
// EXAMPLE 1: Create Payment URL Request
// =============================================================================

const createPaymentExample = {
  request: {
    method: 'POST',
    url: 'http://localhost:5000/api/payment/create-payment-url',
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      orderId: 12345,
      amount: 500000,
      userId: 1,
      email: 'customer@example.com',
      phone: '0901234567',
      bankCode: 'NCB',
      ipAddress: '192.168.1.1',
    },
  },

  response_success: {
    status: 200,
    body: {
      success: true,
      message: 'Payment URL created successfully',
      paymentUrl:
        'https://sandbox.vnpayment.vn/paygate?vnp_Amount=50000000&vnp_BankCode=NCB&vnp_Command=pay&vnp_CreateDate=20231220143000&vnp_CurrCode=VND&vnp_Locale=vn&vnp_OrderInfo=Payment+for+order+12345&vnp_OrderType=order&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A3000%2Forder-success&vnp_SecureHash=abcd1234...&vnp_TmnCode=TESTMERCHANT&vnp_TxnRef=12345_1703068200000&vnp_Version=2.1.0',
      transactionId: '12345_1703068200000',
      amount: 500000,
      orderId: 12345,
    },
  },

  response_error: {
    status: 400,
    body: {
      success: false,
      message: 'Order already paid',
    },
  },
};

// =============================================================================
// EXAMPLE 2: Return URL (After User Completes Payment)
// =============================================================================

const returnUrlExample = {
  request: {
    method: 'GET',
    url: 'http://localhost:5000/api/payment/return?vnp_Amount=50000000&vnp_BankCode=NCB&vnp_BankTranNo=VN123456&vnp_CardType=ATM&vnp_OrderInfo=Payment+for+order+12345&vnp_PayDate=20231220143045&vnp_ResponseCode=00&vnp_SecureHash=xyz789...&vnp_TMN_Code=TESTMERCHANT&vnp_TransactionNo=14270500&vnp_TxnRef=12345_1703068200000',
    queryParams: {
      vnp_Amount: '50000000', // In hundredths of VND
      vnp_BankCode: 'NCB',
      vnp_BankTranNo: 'VN123456',
      vnp_CardType: 'ATM',
      vnp_OrderInfo: 'Payment for order 12345',
      vnp_PayDate: '20231220143045', // YYYYMMDDHHmmss
      vnp_ResponseCode: '00', // 00 = success
      vnp_TMN_Code: 'TESTMERCHANT',
      vnp_TransactionNo: '14270500',
      vnp_TxnRef: '12345_1703068200000',
      vnp_SecureHash: 'xyz789...', // HMAC-SHA512 hash
      vnp_SecureHashType: 'SHA512',
    },
  },

  response_success: {
    status: 200,
    body: {
      success: true,
      message: 'Payment successful',
      transactionId: '12345_1703068200000',
      amount: 500000,
      responseCode: '00',
      bankTranNo: 'VN123456',
    },
  },

  response_failure: {
    status: 200,
    body: {
      success: false,
      message: 'Payment canceled by user',
      transactionId: '12345_1703068200000',
      amount: 500000,
      responseCode: '24', // User canceled
      bankTranNo: null,
    },
  },
};

// =============================================================================
// EXAMPLE 3: IPN Webhook (Server-to-Server)
// =============================================================================

const ipnWebhookExample = {
  request: {
    method: 'POST',
    url: 'http://localhost:5000/api/payment/ipn',
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      vnp_Amount: '50000000',
      vnp_BankCode: 'NCB',
      vnp_BankTranNo: 'VN123456',
      vnp_CardType: 'ATM',
      vnp_OrderInfo: 'Payment for order 12345',
      vnp_PayDate: '20231220143045',
      vnp_ResponseCode: '00',
      vnp_TMN_Code: 'TESTMERCHANT',
      vnp_TransactionNo: '14270500',
      vnp_TxnRef: '12345_1703068200000',
      vnp_SecureHash:
        'a1b2c3d4e5f6...(HMAC-SHA512 hash of sorted parameters)',
      vnp_SecureHashType: 'SHA512',
    },
  },

  response: {
    status: 200,
    body: {
      RspCode: '00',
      Message: 'Received',
    },
  },

  notes:
    'Always respond with 200 OK immediately. Process payment asynchronously.',
};

// =============================================================================
// EXAMPLE 4: Query Transaction History
// =============================================================================

const transactionHistoryExample = {
  request: {
    method: 'GET',
    url: 'http://localhost:5000/api/payment/transaction-history/1?limit=10&offset=0',
  },

  response: {
    status: 200,
    body: {
      success: true,
      transactions: [
        {
          TRANSACTION_ID: '12345_1703068200000',
          ORDER_ID: 12345,
          AMOUNT: 500000,
          STATUS: 'SUCCESS',
          RESPONSE_CODE: '00',
          PAYMENT_METHOD: 'VNPAY',
          BANK_CODE: 'NCB',
          CREATED_AT: '2023-12-20 14:30:00.050000 +00:00',
          PAY_DATE: '20231220143045',
          ORDER_STATUS: 'PAID',
        },
        {
          TRANSACTION_ID: '12346_1703068300000',
          ORDER_ID: 12346,
          AMOUNT: 250000,
          STATUS: 'FAILED',
          RESPONSE_CODE: '24',
          PAYMENT_METHOD: 'VNPAY',
          BANK_CODE: null,
          CREATED_AT: '2023-12-20 14:31:40.050000 +00:00',
          PAY_DATE: null,
          ORDER_STATUS: 'PENDING',
        },
      ],
      limit: 10,
      offset: 0,
    },
  },
};

// =============================================================================
// EXAMPLE 5: Refund Request
// =============================================================================

const refundExample = {
  request: {
    method: 'POST',
    url: 'http://localhost:5000/api/payment/refund',
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      transactionId: '12345_1703068200000',
      orderId: 12345,
      refundAmount: 500000,
      reason: 'Customer changed mind',
    },
  },

  response: {
    status: 200,
    body: {
      success: true,
      message:
        'Refund request submitted. Please complete refund through VNPay merchant dashboard',
      transactionId: '12345_1703068200000',
      refundAmount: 500000,
      note: 'VNPay refunds must be processed through merchant dashboard for security',
    },
  },
};

// =============================================================================
// EXAMPLE 6: Complete Integration Flow (cURL commands)
// =============================================================================

const curlExamples = `
# Step 1: Create order first (existing order API)
curl -X POST http://localhost:5000/api/order/create \\
  -H "Content-Type: application/json" \\
  -d '{
    "userId": 1,
    "paymentMethod": "VNPAY",
    "items": [
      {
        "productId": 101,
        "quantity": 2,
        "price": 250000
      }
    ]
  }'

# Response: { "success": true, "orderId": 12345, "totalAmount": 500000 }

# ============================================================

# Step 2: Create payment URL
curl -X POST http://localhost:5000/api/payment/create-payment-url \\
  -H "Content-Type: application/json" \\
  -d '{
    "orderId": 12345,
    "amount": 500000,
    "userId": 1,
    "email": "customer@example.com",
    "phone": "0901234567",
    "bankCode": "NCB"
  }'

# Response: { "success": true, "paymentUrl": "https://...", "transactionId": "12345_..." }

# ============================================================

# Step 3: Redirect user to paymentUrl in browser
# User completes payment on VNPay page
# After payment, two callbacks happen:
#   1. Browser redirect to: http://localhost:3000/order-success (VNPAY_RETURN_URL)
#   2. Server-to-server IPN to: http://localhost:5000/api/payment/ipn (VNPAY_IPN_URL)

# ============================================================

# Step 4: Check transaction history (after payment is confirmed)
curl -X GET "http://localhost:5000/api/payment/transaction-history/1?limit=10&offset=0"

# Response: { "success": true, "transactions": [...] }
`;

// =============================================================================
// EXAMPLE 7: VNPay Test Cards
// =============================================================================

const testCards = {
  success: {
    cardNumber: '9704198526191432198',
    expiryDate: 'Any valid date',
    cvv: 'Any 3 digits',
    otpPassword: '123456',
    expectedResult: 'Payment successful',
  },

  failure: {
    cardNumber: '9704198526191432197',
    expiryDate: 'Any valid date',
    cvv: 'Any 3 digits',
    otpPassword: 'Any',
    expectedResult: 'Payment failed',
  },

  notes: 'Use test merchant code and sandbox URL for testing',
};

// =============================================================================
// EXAMPLE 8: Hash Verification (Node.js)
// =============================================================================

const hashVerificationExample = `
const crypto = require('crypto');
const querystring = require('querystring');

function verifyVNPayHash(params, secretKey) {
  const secureHash = params.vnp_SecureHash;
  
  // Create copy without signature
  const dataToHash = {};
  Object.keys(params)
    .sort()
    .forEach(key => {
      if (key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType') {
        dataToHash[key] = params[key];
      }
    });

  // Create query string
  const queryStr = querystring.stringify(dataToHash);
  
  // Generate HMAC-SHA512
  const hash = crypto
    .createHmac('sha512', secretKey)
    .update(queryStr)
    .digest('hex');

  // Compare
  return hash === secureHash;
}

// Usage:
const params = {
  vnp_Amount: '50000000',
  vnp_BankCode: 'NCB',
  vnp_ResponseCode: '00',
  vnp_TMN_Code: 'TESTMERCHANT',
  vnp_TxnRef: '12345_1703068200000',
  vnp_SecureHash: 'abc123...',
};

const isValid = verifyVNPayHash(params, 'YOUR_SECRET_KEY');
console.log('Hash valid:', isValid);
`;

module.exports = {
  createPaymentExample,
  returnUrlExample,
  ipnWebhookExample,
  transactionHistoryExample,
  refundExample,
  curlExamples,
  testCards,
  hashVerificationExample,
};
