'use client';

import React from 'react';
import { CartItem } from '@/lib/api';

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  loading?: boolean;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
};

export default function OrderSummary({
  items,
  subtotal,
  shippingFee,
  discount,
  total,
  loading,
}: OrderSummaryProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span>📋</span> Đơn hàng của bạn
      </h3>

      {/* Items List */}
      <div className="space-y-3 border-b border-gray-200 pb-4 max-h-96 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Giỏ hàng trống</p>
        ) : (
          items.map((item) => (
            <div key={item.MASP} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0">
              {/* Product Image */}
              <div className="w-16 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={item.IMAGE_URL || '/placeholder-book.jpg'}
                  alt={item.TENSP}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Product Info */}
              <div className="flex-1">
                <p className="font-semibold text-gray-800 text-sm line-clamp-2">
                  {item.TENSP}
                </p>
                <p className="text-red-500 font-bold mt-1">
                  {formatPrice(item.GIABAN)}
                </p>
                <div className="text-sm text-gray-600 mt-1">
                  Qty: <span className="font-semibold">{item.SOLUONG}</span>
                </div>
              </div>

              {/* Total */}
              <div className="text-right">
                <p className="text-red-500 font-bold">
                  {formatPrice((item.GIABAN || 0) * item.SOLUONG)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="space-y-3 mt-4">
        <div className="flex justify-between text-gray-700">
          <span>Tạm tính:</span>
          <span className="font-semibold">{formatPrice(subtotal)}</span>
        </div>

        <div className="flex justify-between text-gray-700">
          <span>Phí vận chuyển:</span>
          <span className="font-semibold text-orange-600">{formatPrice(shippingFee)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Giảm giá:</span>
            <span className="font-semibold">-{formatPrice(discount)}</span>
          </div>
        )}

        {/* Total */}
        <div className="flex justify-between pt-3 border-t-2 border-gray-200">
          <span className="font-bold text-gray-800">Tổng cộng:</span>
          <span className="text-2xl font-bold text-red-500">
            {formatPrice(total)}
          </span>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-center">
          <p className="text-blue-600 font-semibold animate-pulse">
            ⏳ Đang xử lý...
          </p>
        </div>
      )}
    </div>
  );
}
