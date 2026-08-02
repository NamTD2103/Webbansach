"use client";

import React from "react";

interface PaymentMethodProps {
  selected: string;
  onChange: (method: string) => void;
}

export default function PaymentMethod({
  selected,
  onChange,
}: PaymentMethodProps) {
  const methods = [
    {
      id: "cod",
      name: "Thanh toán khi nhận hàng (COD)",
      icon: "🚚",
      description: "Thanh toán bằng tiền mặt khi nhận hàng.",
      badge: "",
    },
    {
      id: "vnpay",
      name: "VNPay",
      icon: "💳",
      description: "Thanh toán qua cổng VNPay bằng ATM, Visa, QR.",
      badge: "Khuyến nghị",
    },
    {
      id: "momo",
      name: "Ví điện tử MoMo",
      icon: "📱",
      description: "Thanh toán nhanh bằng ứng dụng MoMo.",
      badge: "Ưu đãi",
    },
  ];

  return (
    <div className="space-y-5">
      <h3 className="text-xl font-bold flex items-center gap-2">
        💰 Phương thức thanh toán
      </h3>

      <div className="space-y-4">
        {methods.map((method) => (
          <label
            key={method.id}
            className={`
              relative flex items-center gap-5 p-5 rounded-2xl border-2
              cursor-pointer transition-all duration-300
              ${
                selected === method.id
                  ? "border-red-500 bg-red-50 shadow-lg"
                  : "border-gray-200 hover:border-red-300 hover:shadow-md"
              }
            `}
          >
            <input
              type="radio"
              name="payment"
              value={method.id}
              checked={selected === method.id}
              onChange={(e) => onChange(e.target.value)}
              className="w-5 h-5 accent-red-500"
            />

            <div className="text-4xl">{method.icon}</div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg">
                  {method.name}
                </span>

                {method.badge && (
                  <span className="px-2 py-1 rounded-full text-xs bg-red-500 text-white">
                    {method.badge}
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-500 mt-1">
                {method.description}
              </p>
            </div>
          </label>
        ))}
      </div>

      {selected === "cod" && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-700">
          🚚 Bạn sẽ thanh toán khi nhận được hàng.
        </div>
      )}

      {selected === "vnpay" && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-700">
          💳 Sau khi nhấn <b>Đặt hàng</b>, bạn sẽ được chuyển đến cổng thanh toán
          VNPay.
        </div>
      )}

      {selected === "momo" && (
        <div className="rounded-xl bg-pink-50 border border-pink-200 p-4 text-sm text-pink-700">
          📱 Sau khi nhấn <b>Đặt hàng</b>, bạn sẽ được chuyển đến ví MoMo để hoàn
          tất thanh toán.
        </div>
      )}
    </div>
  );
}