/**
 * Order Success Component with VNPay Payment Verification
 * Displays payment result and order confirmation
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  parsePaymentReturn,
  getPaymentStatusDescription,
} from '@/lib/services/vnpayService';

interface PaymentResult {
  transactionId: string | null;
  amount: number;
  responseCode: string | null;
  isSuccess: boolean;
  message: string | null;
  bankCode?: string | null;
  bankTranNo?: string | null;
}

const OrderSuccessPage: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Parse return data from VNPay
    const result = parsePaymentReturn();

    if (result.transactionId) {
      setPaymentResult(result);
    } else {
      // No payment data, this might be a direct visit
      setLoading(false);
    }

    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="order-success-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang xử lý...</p>
        </div>
      </div>
    );
  }

  if (!paymentResult) {
    return (
      <div className="order-success-container">
        <div className="no-data">
          <h2>Không có thông tin thanh toán</h2>
          <p>Vui lòng quay lại giỏ hàng hoặc liên hệ hỗ trợ</p>
          <button onClick={() => router.push('/cart')}>
            Quay lại giỏ hàng
          </button>
        </div>
      </div>
    );
  }

  const statusDescription = getPaymentStatusDescription(paymentResult.responseCode);

  return (
    <div className="order-success-container">
      <div className="success-card">
        {paymentResult.isSuccess ? (
          <>
            <div className="success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d="M9 16.17L4.83 12m0 0l-1.42 1.41L9 19 21 7m0 0l-1.41-1.41L9 16.17"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1>Thanh toán thành công!</h1>
            <p className="status-message">
              Đơn hàng của bạn đã được xác nhận
            </p>
          </>
        ) : (
          <>
            <div className="error-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d="M6 18L18 6M6 6l12 12"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1>Thanh toán thất bại</h1>
            <p className="status-message">{statusDescription}</p>
          </>
        )}

        <div className="payment-details">
          <div className="detail-row">
            <span className="label">Mã giao dịch:</span>
            <span className="value">{paymentResult.transactionId}</span>
          </div>

          <div className="detail-row">
            <span className="label">Số tiền:</span>
            <span className="value amount">
              {paymentResult.amount.toLocaleString('vi-VN')} VND
            </span>
          </div>

          <div className="detail-row">
            <span className="label">Trạng thái:</span>
            <span className={`value status ${paymentResult.isSuccess ? 'success' : 'failed'}`}>
              {statusDescription}
            </span>
          </div>

          {paymentResult.bankCode && (
            <div className="detail-row">
              <span className="label">Ngân hàng:</span>
              <span className="value">{paymentResult.bankCode}</span>
            </div>
          )}

          {paymentResult.bankTranNo && (
            <div className="detail-row">
              <span className="label">Mã giao dịch ngân hàng:</span>
              <span className="value">{paymentResult.bankTranNo}</span>
            </div>
          )}
        </div>

        <div className="action-buttons">
          {paymentResult.isSuccess ? (
            <>
              <button className="btn btn-primary" onClick={() => router.push('/account')}>
                Xem đơn hàng của tôi
              </button>
              <button className="btn btn-secondary" onClick={() => router.push('/')}>
                Tiếp tục mua sắm
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-primary" onClick={() => router.push('/checkout')}>
                Thử lại thanh toán
              </button>
              <button className="btn btn-secondary" onClick={() => router.push('/cart')}>
                Quay lại giỏ hàng
              </button>
            </>
          )}
        </div>

        <div className="support-info">
          <p>
            Cần hỗ trợ?{' '}
            <a href="mailto:support@example.com">Liên hệ hỗ trợ</a>
          </p>
        </div>
      </div>

      <style jsx>{`
        .order-success-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .loading-spinner {
          text-align: center;
          color: white;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .no-data {
          background: white;
          padding: 40px;
          border-radius: 8px;
          text-align: center;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }

        .success-card {
          background: white;
          border-radius: 8px;
          padding: 40px;
          max-width: 500px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          text-align: center;
        }

        .success-icon,
        .error-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          font-weight: bold;
        }

        .success-icon {
          background: #d4edda;
          color: #28a745;
        }

        .success-icon svg,
        .error-icon svg {
          width: 100%;
          height: 100%;
        }

        .error-icon {
          background: #f8d7da;
          color: #dc3545;
        }

        h1 {
          margin: 0 0 10px 0;
          color: #333;
          font-size: 28px;
        }

        .status-message {
          color: #666;
          margin: 0 0 30px 0;
          font-size: 16px;
        }

        .payment-details {
          background: #f5f5f5;
          padding: 20px;
          border-radius: 6px;
          margin-bottom: 30px;
          text-align: left;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #ddd;
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .detail-row .label {
          color: #666;
          font-weight: 500;
        }

        .detail-row .value {
          color: #333;
          text-align: right;
          word-break: break-word;
        }

        .value.amount {
          color: #e74c3c;
          font-weight: bold;
          font-size: 18px;
        }

        .value.status {
          padding: 4px 12px;
          border-radius: 4px;
          font-weight: 500;
          font-size: 14px;
        }

        .value.status.success {
          background: #d4edda;
          color: #28a745;
        }

        .value.status.failed {
          background: #f8d7da;
          color: #dc3545;
        }

        .action-buttons {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .btn {
          flex: 1;
          padding: 12px 20px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
          background: #f0f0f0;
          color: #333;
        }

        .btn-secondary:hover {
          background: #e0e0e0;
          transform: translateY(-2px);
        }

        .support-info {
          color: #666;
          font-size: 14px;
        }

        .support-info a {
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
        }

        .support-info a:hover {
          text-decoration: underline;
        }

        @media (max-width: 600px) {
          .success-card {
            padding: 20px;
          }

          h1 {
            font-size: 24px;
          }

          .action-buttons {
            flex-direction: column;
          }

          .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default OrderSuccessPage;
