'use client';

import { useState } from 'react';
import { orderAPI } from '@/lib/api';

interface CancelOrderModalProps {
  orderId: number;
  orderStatus: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Cancel Order Modal Component
 * Allows customers to cancel their orders with reason
 */
export default function CancelOrderModal({
  orderId,
  orderStatus,
  isOpen,
  onClose,
  onSuccess,
}: CancelOrderModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const cancellationReasons = [
    'Tôi muốn thay đổi địa chỉ giao hàng',
    'Tôi muốn hủy một số sản phẩm',
    'Giá quá cao',
    'Tôi không cần nữa',
    'Lý do khác',
  ];

  const handleCancel = async () => {
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do hủy đơn');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('[Modal] Cancelling order:', orderId, 'reason:', reason);

      const result = await orderAPI.cancelOrder(orderId, reason);

      console.log('[Modal] Cancel response:', result);

      setSuccess(true);
      setReason('');

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      console.error('[Modal] Cancel error:', err);
      setError(err.message || 'Không thể hủy đơn hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ BUSINESS RULE: Only PENDING and PROCESSING orders can be cancelled
  const canCancel = ['PENDING', 'PROCESSING'].includes(orderStatus);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Hủy Đơn Hàng</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            disabled={loading}
          >
            ×
          </button>
        </div>

        {!canCancel ? (
          // ❌ Cannot cancel message
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-700 font-semibold">❌ Không thể hủy đơn hàng này</p>
            <p className="text-red-600 text-sm mt-2">
              Chỉ có thể hủy đơn hàng ở trạng thái "Chờ xử lý" hoặc "Đang xử lý".
            </p>
            <p className="text-gray-500 text-xs mt-3">
              Trạng thái hiện tại: <strong>{orderStatus}</strong>
            </p>
          </div>
        ) : success ? (
          // ✅ Success message
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-green-700 font-semibold">Đơn hàng đã được hủy</p>
            <p className="text-green-600 text-sm mt-2">
              Hoàn tiền sẽ được xử lý trong 3-5 ngày làm việc
            </p>
          </div>
        ) : (
          // Form to cancel order
          <div className="space-y-4">
            {/* Order ID display */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Mã đơn hàng</p>
              <p className="text-lg font-bold text-gray-900">ORD-{orderId}</p>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">⚠️ {error}</p>
              </div>
            )}

            {/* Reason selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Lý do hủy đơn <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {cancellationReasons.map((r) => (
                  <label key={r} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="reason"
                      value={r}
                      checked={reason === r}
                      onChange={(e) => setReason(e.target.value)}
                      disabled={loading}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">{r}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Custom reason */}
            {reason === 'Lý do khác' && (
              <textarea
                value={reason === 'Lý do khác' ? '' : reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Vui lòng nhập lý do hủy đơn của bạn..."
                className="w-full p-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                rows={3}
                disabled={loading}
              />
            )}

            {/* Warning message */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-800 text-sm">
                ⚠️ <strong>Lưu ý:</strong> Sau khi hủy, bạn không thể khôi phục đơn hàng.
                Hoàn tiền sẽ được xử lý tự động.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Không hủy
              </button>
              <button
                onClick={handleCancel}
                disabled={loading || !reason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? '⏳ Đang xử lý...' : '❌ Hủy đơn hàng'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
