'use client';

import React from 'react';

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
    description: "Thanh toán bằng tiền mặt khi nhận hàng",
    badge: "",
  },
  {
    id: "vnpay",
    name: "VNPay",
    icon: "💳",
    description: "Thanh toán nhanh, an toàn",
    badge: "Khuyến nghị",
  },
  {
    id: "momo",
    name: "MoMo",
    icon: "📱",
    description: "Thanh toán bằng ví MoMo",
    badge: "Ưu đãi",
  },
];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
        <span>💰</span> Phương thức thanh toán
      </h3>

      <div className="space-y-3">
        {methods.map((method) => (
          <label
          key={method.id}
  className={`relative flex items-center gap-5 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300
  ${
    selected === method.id
      ? "border-red-500 bg-red-50 shadow-lg"
      : "border-gray-200 hover:border-red-300 hover:shadow-md"
  }`}
          >
            <input
              type="radio"
              name="payment"
              value={method.id}
              checked={selected === method.id}
              onChange={(e) => onChange(e.target.value)}
              className="w-5 h-5 text-red-500 cursor-pointer"
            />
            <div className="ml-4 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{method.icon}</span>
                <span className="font-semibold text-gray-800">{method.name}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{method.description}</p>
            </div>
          </label>
        ))}
      </div>

      {/* Warning for demo payments */}
      {selected !== 'cod' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
          <span className="font-semibold">⚠️ Lưu ý:</span> Đây là chế độ giả lập. Trong production, bạn sẽ được chuyển đến trang thanh toán chính thức.
        </div>
      )}
    </div>
  );
}
