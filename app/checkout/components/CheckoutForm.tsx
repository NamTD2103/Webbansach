'use client';

import React from 'react';

interface CheckoutFormProps {
  customer: {
    fullname: string;
    phone: string;
    email: string;
  };
  onChange: (field: string, value: string) => void;
  errors: { [key: string]: string };
}

export default function CheckoutForm({
  customer,
  onChange,
  errors,
}: CheckoutFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
        <span>👤</span> Thông tin khách hàng
      </h3>

      {/* Full Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Họ và tên <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={customer.fullname}
          onChange={(e) => onChange('fullname', e.target.value)}
          placeholder="Ví dụ: Nguyễn Văn A"
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-red-500 transition ${
            errors.fullname ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.fullname && (
          <p className="text-red-500 text-sm mt-1">{errors.fullname}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Số điện thoại <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          value={customer.phone}
          onChange={(e) => onChange('phone', e.target.value)}
          placeholder="Ví dụ: 0912345678"
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-red-500 transition ${
            errors.phone ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.phone && (
          <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={customer.email}
          onChange={(e) => onChange('email', e.target.value)}
          placeholder="Ví dụ: email@example.com"
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-red-500 transition ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email}</p>
        )}
      </div>
    </div>
  );
}
