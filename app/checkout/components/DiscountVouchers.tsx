'use client';

import React, { useState } from 'react';

interface Voucher {
  code: string;
  discount: number;
  type: 'percent' | 'fixed'; // percent (%) hoặc fixed (₫)
  description?: string;
}

interface DiscountVouchersProps {
  subtotal: number;
  selectedVouchers: Voucher[];
  onVouchersChange: (vouchers: Voucher[]) => void;
  totalDiscount: number;
}

// Demo vouchers
const AVAILABLE_VOUCHERS: Voucher[] = [
  { code: 'DEMO50', discount: 10, type: 'percent', description: 'Giảm 10%' },
  { code: 'SAVE100K', discount: 100000, type: 'fixed', description: 'Giảm 100K' },
  { code: 'SHIP2K', discount: 20000, type: 'fixed', description: 'Giảm ship 20K' },
  { code: 'WELCOME', discount: 5, type: 'percent', description: 'Giảm 5%' },
];

export default function DiscountVouchers({
  subtotal,
  selectedVouchers,
  onVouchersChange,
  totalDiscount,
}: DiscountVouchersProps) {
  const [voucherCode, setVoucherCode] = useState('');
  const [error, setError] = useState('');

  const calculateDiscount = (voucher: Voucher, base: number) => {
    if (voucher.type === 'percent') {
      return Math.floor(base * voucher.discount / 100);
    }
    return voucher.discount;
  };

  const handleAddVoucher = () => {
    if (!voucherCode.trim()) {
      setError('Vui lòng nhập mã voucher');
      return;
    }

    // Kiểm tra nếu mã đã được chọn
    if (selectedVouchers.some((v) => v.code === voucherCode.toUpperCase())) {
      setError('Mã này đã được áp dụng');
      setVoucherCode('');
      return;
    }

    // Tìm voucher
    const found = AVAILABLE_VOUCHERS.find(
      (v) => v.code === voucherCode.toUpperCase()
    );

    if (!found) {
      setError('Mã voucher không hợp lệ');
      setVoucherCode('');
      return;
    }

    // Thêm voucher (giới hạn tối đa 3 mã)
    if (selectedVouchers.length >= 3) {
      setError('Tối đa chỉ được áp dụng 3 mã voucher');
      return;
    }

    // Kiểm tra không vượt quá subtotal
    const newVouchers = [...selectedVouchers, found];
    let tempDiscount = 0;
    newVouchers.forEach((v) => {
      tempDiscount += calculateDiscount(v, subtotal);
    });

    if (tempDiscount > subtotal) {
      setError('Tổng giảm giá không được vượt quá giá sản phẩm');
      return;
    }

    onVouchersChange(newVouchers);
    setVoucherCode('');
    setError('');
  };

  const handleRemoveVoucher = (code: string) => {
    onVouchersChange(selectedVouchers.filter((v) => v.code !== code));
    setError('');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span>🎁</span> Khuyến mãi & Voucher
      </h3>

      {/* Input voucher */}
      <div className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={voucherCode}
            onChange={(e) => {
              setVoucherCode(e.target.value.toUpperCase());
              setError('');
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddVoucher();
              }
            }}
            placeholder="Nhập mã voucher"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
          />
          <button
            onClick={handleAddVoucher}
            className="px-6 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition"
          >
            Áp dụng
          </button>
        </div>

        {/* Error message */}
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        {/* Demo vouchers */}
        <div className="mt-3 pt-3 border-t">
          <p className="text-sm text-gray-600 mb-2">💡 Mã demo:</p>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_VOUCHERS.map((v) => (
              <button
                key={v.code}
                onClick={() => {
                  setVoucherCode(v.code);
                  setError('');
                }}
                className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 font-medium transition"
              >
                {v.code} ({v.description})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected vouchers */}
      {selectedVouchers.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-700">Voucher đã áp dụng:</p>
          {selectedVouchers.map((voucher) => (
            <div
              key={voucher.code}
              className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200"
            >
              <div>
                <p className="font-semibold text-green-700">{voucher.code}</p>
                <p className="text-sm text-green-600">
                  {voucher.type === 'percent'
                    ? `Giảm ${voucher.discount}%`
                    : `Giảm ₫${voucher.discount.toLocaleString('vi-VN')}`}
                  {' '}(
                  {voucher.type === 'percent'
                    ? `₫${calculateDiscount(voucher, subtotal).toLocaleString('vi-VN')}`
                    : `₫${voucher.discount.toLocaleString('vi-VN')}`}
                  )
                </p>
              </div>
              <button
                onClick={() => handleRemoveVoucher(voucher.code)}
                className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition text-sm font-medium"
              >
                Xóa
              </button>
            </div>
          ))}

          {/* Total discount */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">Tổng giảm giá:</span>{' '}
              <span className="text-lg font-bold">
                ₫{totalDiscount.toLocaleString('vi-VN')}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
