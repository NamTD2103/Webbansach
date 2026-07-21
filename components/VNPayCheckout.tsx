/**
 * VNPay Checkout Component (React/TypeScript)
 * Handles payment method selection and VNPay payment processing
 */

'use client';

import React, { useState } from 'react';
import { createVNPayPayment } from '@/lib/services/vnpayService';

interface VNPayCheckoutProps {
  orderId: number;
  amount: number;
  userId: number;
  userEmail?: string;
  userPhone?: string;
  onPaymentStart?: () => void;
  onPaymentError?: (error: string) => void;
}

const VNPayCheckout: React.FC<VNPayCheckoutProps> = ({
  orderId,
  amount,
  userId,
  userEmail = '',
  userPhone = '',
  onPaymentStart,
  onPaymentError,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedBank, setSelectedBank] = useState('');
  const [error, setError] = useState('');

  // Popular Vietnamese banks for quick selection
  const bankOptions = [
    { code: 'NCB', name: 'Ngân hàng Quốc Tế' },
    { code: 'AGRIBANK', name: 'Ngân hàng Nông Nghiệp' },
    { code: 'ACB', name: 'Ngân hàng Á Châu' },
    { code: 'VCB', name: 'Ngân hàng Vietcombank' },
    { code: 'BIDV', name: 'Ngân hàng BIDV' },
    { code: 'TCB', name: 'Ngân hàng Techcombank' },
    { code: 'SHB', name: 'Ngân hàng ShinhanBank' },
  ];

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError('');

      if (!orderId || !amount || !userId) {
        throw new Error('Missing required payment information');
      }

      if (amount <= 0) {
        throw new Error('Invalid payment amount');
      }

      // Call backend to create payment URL
      const paymentData = {
        orderId,
        amount,
        userId,
        email: userEmail,
        phone: userPhone,
        bankCode: selectedBank || undefined,
        ipAddress: window.location.hostname,
      };

      onPaymentStart?.();

      const response = await createVNPayPayment(paymentData);

      if (response.success && response.paymentUrl) {
        // Redirect to VNPay payment page
        window.location.href = response.paymentUrl;
      } else {
        throw new Error(response.message || 'Failed to create payment URL');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment error';
      setError(errorMessage);
      onPaymentError?.(errorMessage);
      console.error('Payment error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vnpay-checkout">
      <div className="payment-container">
        <h2>Thanh toán qua VNPay</h2>

        <div className="payment-info">
          <div className="info-group">
            <label>Mã đơn hàng:</label>
            <span>{orderId}</span>
          </div>
          <div className="info-group">
            <label>Số tiền:</label>
            <span className="amount">
              {amount.toLocaleString('vi-VN')} VND
            </span>
          </div>
        </div>

        <div className="bank-selection">
          <label htmlFor="bankSelect">Chọn ngân hàng (Tùy chọn):</label>
          <select
            id="bankSelect"
            value={selectedBank}
            onChange={(e) => setSelectedBank(e.target.value)}
            disabled={loading}
            className="bank-select"
          >
            <option value="">-- Chọn ngân hàng --</option>
            {bankOptions.map((bank) => (
              <option key={bank.code} value={bank.code}>
                {bank.name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="error-message">
            <span>✗ {error}</span>
          </div>
        )}

        <button
          onClick={handlePayment}
          disabled={loading}
          className="pay-button"
        >
          {loading ? 'Đang xử lý...' : 'Thanh toán với VNPay'}
        </button>

        <div className="payment-info-note">
          <p className="note-title">Thông tin thanh toán:</p>
          <ul>
            <li>Bạn sẽ được chuyển hướng đến cổng thanh toán VNPay</li>
            <li>Nhập thông tin thẻ/tài khoản để hoàn tất thanh toán</li>
            <li>Quá trình thanh toán được mã hóa và bảo mật</li>
            <li>Khi hoàn thành, bạn sẽ trở lại trang xác nhận đơn hàng</li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        .vnpay-checkout {
          width: 100%;
          max-width: 500px;
          margin: 0 auto;
        }

        .payment-container {
          background: white;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .payment-container h2 {
          margin-top: 0;
          margin-bottom: 20px;
          color: #333;
          font-size: 20px;
        }

        .payment-info {
          background: #f5f5f5;
          padding: 16px;
          border-radius: 6px;
          margin-bottom: 20px;
        }

        .info-group {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .info-group:last-child {
          margin-bottom: 0;
        }

        .info-group label {
          color: #666;
          font-weight: 500;
        }

        .info-group span {
          color: #333;
        }

        .amount {
          color: #e74c3c;
          font-weight: bold;
          font-size: 18px;
        }

        .bank-selection {
          margin-bottom: 20px;
        }

        .bank-selection label {
          display: block;
          margin-bottom: 8px;
          color: #333;
          font-weight: 500;
        }

        .bank-select {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          color: #333;
          background-color: white;
          cursor: pointer;
          transition: border-color 0.3s;
        }

        .bank-select:hover:not(:disabled) {
          border-color: #3498db;
        }

        .bank-select:focus {
          outline: none;
          border-color: #3498db;
          box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
        }

        .bank-select:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .error-message {
          background: #fee;
          color: #c33;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 15px;
          font-size: 14px;
          border-left: 4px solid #c33;
        }

        .pay-button {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.3s, transform 0.2s;
          margin-bottom: 20px;
        }

        .pay-button:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-2px);
        }

        .pay-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .pay-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .payment-info-note {
          background: #f0f8ff;
          padding: 12px;
          border-radius: 4px;
          border-left: 4px solid #3498db;
        }

        .note-title {
          margin: 0 0 8px 0;
          color: #333;
          font-weight: 600;
          font-size: 14px;
        }

        .payment-info-note ul {
          margin: 0;
          padding-left: 20px;
          color: #555;
          font-size: 13px;
          line-height: 1.6;
        }

        .payment-info-note li {
          margin-bottom: 4px;
        }
      `}</style>
    </div>
  );
};

export default VNPayCheckout;
