/**
 * VNPay Payment Service (React/Frontend)
 * Service for calling VNPay payment API
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000/api';

interface VNPayPaymentData {
  orderId?: string | number;
  amount?: number;
  orderInfo?: string;
  [key: string]: unknown;
}

/**
 * Create payment URL and redirect to VNPay
 * @param {Object} paymentData - Payment details
 * @returns {Promise<Object>} Payment response with paymentUrl
 */
export const createVNPayPayment = async (paymentData: VNPayPaymentData) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/payment/create-payment-url`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      }
    );

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to create payment');
    }

    return data;
  } catch (error) {
    console.error('Error creating VNPay payment:', error);
    throw error;
  }
};

/**
 * Get user's transaction history
 * @param {number} userId - User ID
 * @param {number} limit - Results per page
 * @param {number} offset - Results offset
 * @returns {Promise<Object>} Transaction history
 */
export const getTransactionHistory = async (userId: number | string, limit = 10, offset = 0) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/payment/transaction-history/${userId}?limit=${limit}&offset=${offset}`
    );

    const data = await response.json();

    if (!data.success) {
      throw new Error('Failed to fetch transaction history');
    }

    return data;
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    throw error;
  }
};

/**
 * Request a refund
 * @param {Object} refundData - Refund details
 * @returns {Promise<Object>} Refund response
 */
export const requestRefund = async (refundData: Record<string, unknown>) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/payment/refund`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(refundData),
      }
    );

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to request refund');
    }

    return data;
  } catch (error) {
    console.error('Error requesting refund:', error);
    throw error;
  }
};

/**
 * Parse payment return parameters from URL
 * Used when returning from VNPay gateway
 * @returns {Object} Parsed parameters
 */
export const parsePaymentReturn = () => {
  const params = new URLSearchParams(window.location.search);

  const amountValue = params.get('vnp_Amount');

  return {
    transactionId: params.get('vnp_TxnRef'),
    amount: amountValue ? parseInt(amountValue, 10) / 100 : 0,
    responseCode: params.get('vnp_ResponseCode'),
    message: params.get('vnp_OrderInfo'),
    bankCode: params.get('vnp_BankCode'),
    bankTranNo: params.get('vnp_BankTranNo'),
    isSuccess: params.get('vnp_ResponseCode') === '00',
  };
};

/**
 * Get payment status description
 * @param {string} responseCode - VNPay response code
 * @returns {string} Status description
 */
export const getPaymentStatusDescription = (responseCode?: string | null) => {
  const statuses: Record<string, string> = {
    '00': 'Payment successful',
    '01': 'Bank connection timeout',
    '02': 'Invalid bank details',
    '04': 'Payment canceled by bank',
    '05': 'Payment canceled',
    '06': 'Transaction pending',
    '07': 'Transaction rejected',
    '09': 'Card/Account locked',
    '10': 'Confirmed timeout',
    '11': 'Out of session',
    '12': 'Invalid OTP',
    '24': 'User canceled payment',
  };

  return responseCode && statuses[responseCode] ? statuses[responseCode] : 'Unknown status';
};

export default {
  createVNPayPayment,
  getTransactionHistory,
  requestRefund,
  parsePaymentReturn,
  getPaymentStatusDescription,
};
