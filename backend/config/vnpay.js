/**
 * VNPay Configuration
 * Vietnamese payment gateway integration
 */

const vnpayConfig = {
  // VNPay API endpoints
  vnpayUrl: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paygate',
  vnpayApiUrl: process.env.VNPAY_API_URL || 'https://sandbox.vnpayment.vn/merchant_webapi/merchant_information',
  
  // Merchant credentials (from VNPay dashboard)
  tmnCode: process.env.VNPAY_TMN_CODE || 'TESTMERCHANT', // Merchant code
  secretKey: process.env.VNPAY_SECRET_KEY || 'TESTKEY', // Secret key for hash
  hashSecret: process.env.VNPAY_HASH_SECRET || 'TESTKEY', // Same as secret key
  
  // Merchant info
  merchantId: process.env.VNPAY_MERCHANT_ID || '000000',
  merchantName: process.env.VNPAY_MERCHANT_NAME || 'Web Bán Sách',
  
  // URLs for payment flow
  returnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:3000/order-success',
  ipnUrl: process.env.VNPAY_IPN_URL || 'http://localhost:5000/api/payment/ipn',
  
  // Payment settings
  currencyCode: 'VND',
  locale: 'vn', // vn or en
  version: '2.1.0',
  
  // Timeout settings (in seconds)
  expireDate: 15, // Payment expires in 15 minutes
  
  // Command types
  commands: {
    queryDr: 'queryDr', // Query payment result
    refund: 'refund', // Refund transaction
    queryRefund: 'queryRefund', // Query refund status
  },
};

module.exports = vnpayConfig;
