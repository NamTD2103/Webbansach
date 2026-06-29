'use client';

import React from 'react';

interface AddressFormProps {
  address: {
    province: string;
    district: string;
    ward: string;
    street: string;
  };
  onChange: (field: string, value: string) => void;
  errors: { [key: string]: string };
}

// Mock data - in real app, fetch from API
const PROVINCES = [
  { id: 'HN', name: 'Hà Nội', fee: 0 },
  { id: 'HCM', name: 'Hồ Chí Minh', fee: 0 },
  { id: 'DN', name: 'Đà Nẵng', fee: 15000 },
  { id: 'HP', name: 'Hải Phòng', fee: 20000 },
  { id: 'OTHER', name: 'Tỉnh khác', fee: 30000 },
];

const DISTRICTS: { [key: string]: Array<{ id: string; name: string }> } = {
  HN: [
    { id: 'BA_DINH', name: 'Ba Đình' },
    { id: 'DONG_DA', name: 'Đống Đa' },
    { id: 'HAI_BA_TRUNG', name: 'Hai Bà Trưng' },
    { id: 'HOANG_MAI', name: 'Hoàng Mai' },
  ],
  HCM: [
    { id: 'Q1', name: 'Quận 1' },
    { id: 'Q2', name: 'Quận 2' },
    { id: 'Q3', name: 'Quận 3' },
    { id: 'Q4', name: 'Quận 4' },
  ],
  DN: [
    { id: 'HAI_CHAU', name: 'Hải Châu' },
    { id: 'THANH_KHE', name: 'Thanh Khê' },
  ],
  HP: [
    { id: 'HONG_BANG', name: 'Hồng Bàng' },
    { id: 'NG_HA', name: 'Ngô Hộ' },
  ],
  OTHER: [{ id: 'OTHER', name: 'Khác' }],
};

export default function AddressForm({
  address,
  onChange,
  errors,
}: AddressFormProps) {
  const selectedProvince = PROVINCES.find((p) => p.id === address.province);
  const districts = address.province ? DISTRICTS[address.province] || [] : [];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
        <span>📍</span> Địa chỉ giao hàng
      </h3>

      {/* Province */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Tỉnh / Thành phố <span className="text-red-500">*</span>
        </label>
        <select
          value={address.province}
          onChange={(e) => {
            onChange('province', e.target.value);
            onChange('district', '');
            onChange('ward', '');
          }}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-red-500 transition ${
            errors.province ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">-- Chọn tỉnh/thành phố --</option>
          {PROVINCES.map((prov) => (
            <option key={prov.id} value={prov.id}>
              {prov.name}
              {prov.fee > 0 ? ` (+${(prov.fee / 1000).toFixed(0)}k)` : ''}
            </option>
          ))}
        </select>
        {errors.province && (
          <p className="text-red-500 text-sm mt-1">{errors.province}</p>
        )}
      </div>

      {/* District */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Quận / Huyện <span className="text-red-500">*</span>
        </label>
        <select
          value={address.district}
          onChange={(e) => {
            onChange('district', e.target.value);
            onChange('ward', '');
          }}
          disabled={!address.province}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-red-500 transition disabled:bg-gray-100 ${
            errors.district ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">-- Chọn quận/huyện --</option>
          {districts.map((dist) => (
            <option key={dist.id} value={dist.id}>
              {dist.name}
            </option>
          ))}
        </select>
        {errors.district && (
          <p className="text-red-500 text-sm mt-1">{errors.district}</p>
        )}
      </div>

      {/* Street Address */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Địa chỉ chi tiết (số nhà, tên đường) <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={address.street}
          onChange={(e) => onChange('street', e.target.value)}
          placeholder="Ví dụ: 123 Trần Phú, Phường 1"
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-red-500 transition ${
            errors.street ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.street && (
          <p className="text-red-500 text-sm mt-1">{errors.street}</p>
        )}
      </div>

      {/* Shipping Fee Info */}
      {selectedProvince && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          <span className="font-semibold">Phí vận chuyển:</span> {selectedProvince.fee === 0 ? 'Miễn phí' : `${(selectedProvince.fee / 1000).toFixed(0)}k`}
        </div>
      )}
    </div>
  );
}
