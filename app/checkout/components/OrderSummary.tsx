"use client";

import React from "react";
import { CartItem } from "@/lib/api";

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  loading?: boolean;
  voucher?: any;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

export default function OrderSummary({
  items,
  subtotal,
  shippingFee,
  discount,
  total,
  loading,
  voucher,
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
            <div
              key={item.MASP}
              className="flex items-center gap-4 p-4 rounded-2xl border border-gray-200 hover:shadow-md hover:border-red-200 transition-all duration-200"
            >
              {/* Product Image */}
              <div className="w-20 h-28 flex-shrink-0 overflow-hidden rounded-xl bg-gray-50 border border-gray-200">
                <img
                  src={item.IMAGE_URL || "/placeholder-book.jpg"}
                  alt={item.TENSP}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Product Info */}
              <div className="flex-1">
                <p className="font-semibold text-gray-800 leading-6 line-clamp-2">
                  {item.TENSP}
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Đơn giá: {formatPrice(item.GIABAN)}
                </p>
                <div className="text-sm text-gray-600 mt-1">
                  <div className="inline-flex items-center rounded-full bg-red-50 border border-red-200 px-3 py-1 mt-3">
                    <span className="text-xs text-gray-600">SL:</span>

                    <span className="ml-1 font-bold text-red-600">
                      {item.SOLUONG}
                    </span>
                  </div>
                </div>
              </div>

              {/* Total
              <div className="text-right">
    <p className="text-xs text-gray-400">
        Thành tiền
    </p>

    <p className="text-lg font-bold text-red-600 whitespace-nowrap">
        {formatPrice(item.GIABAN * item.SOLUONG)}
    </p>
</div> */}
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="space-y-3 mt-4">
        {voucher && (
          <div className="rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 via-emerald-50 to-green-100 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white text-xl">
                  🏷️
                </div>

                <div>
                  <p className="text-xs text-gray-500">Voucher đang áp dụng</p>

                  <p className="text-lg font-bold text-green-700">
                    {voucher.CODE}
                  </p>

                  <p className="text-sm text-gray-600">
                    {voucher.DISCOUNT_TYPE === "PERCENT"
                      ? `Giảm ${voucher.DISCOUNT_VALUE}%`
                      : `Giảm ${formatPrice(voucher.DISCOUNT_VALUE)}`}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-gray-500">Tiết kiệm</p>

                <p className="text-2xl font-bold text-red-600">
                  -{formatPrice(discount)}
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-between text-gray-700">
          <span>Tạm tính</span>
          <span>{formatPrice(subtotal)}</span>
        </div>

        <div className="flex justify-between text-gray-700">
          <span>Phí vận chuyển</span>
          <span>{formatPrice(shippingFee)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-green-600 font-semibold">
            <span>Giảm giá</span>
            <span>-{formatPrice(discount)}</span>
          </div>
        )}

        <hr />

        <div className="flex justify-between items-center">
          <span className="text-lg font-bold">Thành tiền</span>

          <span className="text-4xl font-black text-red-600">
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
