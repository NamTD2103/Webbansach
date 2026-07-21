/**
 * VNPay Utilities
 * Helper functions for VNPay integration
 */

const crypto = require('crypto');
const querystring = require('querystring');
const vnpayConfig = require('../config/vnpay');

/**
 * Generate secure hash for VNPay
 * @param {Object} data - Data to hash
 * @param {string} secretKey - Secret key from VNPay
 * @returns {string} HMAC-SHA512 hash
 */
const generateHash = (data, secretKey) => {
  // Sort data by keys
  const sortedData = {};
  Object.keys(data)
    .sort()
    .forEach(key => {
      sortedData[key] = data[key];
    });

  // Create query string
  const queryStr = querystring.stringify(sortedData);
  
  // Generate HMAC-SHA512
  const hash = crypto
    .createHmac('sha512', secretKey)
    .update(queryStr)
    .digest('hex');

  return hash;
};

/**
 * Create VNPay payment URL
 * @param {Object} paymentData - Payment details
 * @returns {string} VNPay payment URL
 */
const createPaymentUrl = (paymentData) => {
  const {
    orderId,
    amount, // In VND, must be integer
    orderInfo,
    ipAddress,
    userId,
  } = paymentData;

  // Generate transaction ID (unique)
  const transactionId = `${orderId}_${Date.now()}`;
  const expireDate = new Date(Date.now() + vnpayConfig.expireDate * 60000);

  // Build payment data
  const vnpParams = {
    vnp_Version: vnpayConfig.version,
    vnp_Command: 'pay',
    vnp_TmnCode: vnpayConfig.tmnCode,
    vnp_Locale: vnpayConfig.locale,
    vnp_CurrCode: vnpayConfig.currencyCode,
    vnp_TxnRef: transactionId,
    vnp_OrderInfo: orderInfo || `Payment for order ${orderId}`,
    vnp_OrderType: 'order',
    vnp_Amount: amount * 100, // VNPay requires amount in hundredths of VND
    vnp_ReturnUrl: vnpayConfig.returnUrl,
    vnp_IpAddr: ipAddress || '127.0.0.1',
    vnp_CreateDate: formatDate(new Date()), // YYYYMMDDHHmmss
    vnp_ExpireDate: formatDate(expireDate), // YYYYMMDDHHmmss
    vnp_Bill_FirstName: userId || '',
    vnp_Bill_Email: paymentData.email || '',
    vnp_Bill_Mobile: paymentData.phone || '',
  };

  // Add optional fields if provided
  if (paymentData.bankCode) {
    vnpParams.vnp_BankCode = paymentData.bankCode; // E.g., 'NCB', 'AGRIBANK'
  }

  // Generate secure hash
  const hash = generateHash(vnpParams, vnpayConfig.secretKey);
  vnpParams.vnp_SecureHash = hash;

  // Build payment URL
  const paymentUrl = `${vnpayConfig.vnpayUrl}?${querystring.stringify(vnpParams)}`;

  return {
    paymentUrl,
    transactionId,
    vnpParams,
  };
};

/**
 * Verify VNPay secure hash (for IPN/return)
 * @param {Object} vnpParams - Parameters from VNPay
 * @returns {boolean} Whether hash is valid
 */
const verifyHash = (vnpParams) => {
  const secureHash = vnpParams.vnp_SecureHash;
  
  // Create copy without signature
  const params = { ...vnpParams };
  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;

  // Generate hash
  const hash = generateHash(params, vnpayConfig.secretKey);

  // Compare hashes (constant-time comparison to prevent timing attacks)
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(secureHash ? secureHash : '')) === true;
};

/**
 * Format date to VNPay format (YYYYMMDDHHmmss)
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

/**
 * Parse VNPay return data
 * @param {Object} query - Query parameters from return URL
 * @returns {Object} Parsed payment result
 */
const parseReturnData = (query) => {
  return {
    orderId: query.vnp_TxnRef,
    amount: parseInt(query.vnp_Amount) / 100, // Convert back to VND
    bankCode: query.vnp_BankCode,
    bankTranNo: query.vnp_BankTranNo,
    cardType: query.vnp_CardType,
    OrderInfo: query.vnp_OrderInfo,
    payDate: query.vnp_PayDate,
    responseCode: query.vnp_ResponseCode,
    transactionStatus: query.vnp_TransactionStatus,
    transactionNo: query.vnp_TransactionNo,
    tmnCode: query.vnp_TmnCode,
  };
};

/**
 * Check if payment was successful
 * @param {string} responseCode - VNPay response code
 * @returns {boolean} Whether payment succeeded
 */
const isPaymentSuccessful = (responseCode) => {
  return responseCode === '00'; // 00 = Success
};

/**
 * Get payment status description
 * @param {string} responseCode - VNPay response code
 * @returns {string} Status description
 */
const getPaymentStatusDescription = (responseCode) => {
  const statuses = {
    '00': 'Payment successful',
    '01': 'Bank connection timeout',
    '02': 'Invalid bank details',
    '04': 'Payment canceled/rejected by bank',
    '05': 'Payment canceled',
    '06': 'Transaction pending',
    '07': 'Transaction rejected',
    '09': 'Card/Account locked',
    '10': 'Confirmed timeout',
    '11': 'Out of session',
    '12': 'Invalid OTP',
    '24': 'User canceled',
  };

  return statuses[responseCode] || 'Unknown status';
};

module.exports = {
  generateHash,
  createPaymentUrl,
  verifyHash,
  formatDate,
  parseReturnData,
  isPaymentSuccessful,
  getPaymentStatusDescription,
};
