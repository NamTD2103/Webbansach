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
      id: 'cod',
      name: 'Thanh toán khi nhận hàng (COD)',
      icon: '🚚',
      description: 'Thanh toán bằng tiền mặt khi nhận hàng',
    },
    {
      id: 'vnpay',
      name: 'VNPay',
      icon: '💳',
      description: 'Thanh toán qua cổng VNPay (giả lập)',
    },
    {
      id: 'momo',
      name: 'Momo',
      icon: '📱',
      description: 'Thanh toán qua Momo (giả lập)',
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
            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
              selected === method.id
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 hover:border-gray-300'
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
