'use client';

import React, { useState, useMemo } from 'react';
import type { Voucher, VoucherGroup, DiscountResult } from '@/lib/vouchers/types';
import {
  validateVoucher,
  applyVouchers,
  findBestVouchers,
  formatPrice,
  getVoucherColor,
  getVoucherTypeLabel,
} from '@/lib/vouchers/utils';

interface VoucherSelectorProps {
  allVouchers: Voucher[];
  subtotal: number;
  shippingFee: number;
  selectedVouchers: VoucherGroup;
  onVouchersChange: (vouchers: VoucherGroup) => void;
  onDiscountChange?: (discount: DiscountResult) => void;
}

export default function VoucherSelector({
  allVouchers,
  subtotal,
  shippingFee,
  selectedVouchers,
  onVouchersChange,
  onDiscountChange,
}: VoucherSelectorProps) {
  const [expandedTab, setExpandedTab] = useState<'product' | 'shipping' | 'platform' | null>(null);
  const [showAutoApply, setShowAutoApply] = useState(false);

  // Filter vouchers by type
  const groupedVouchers = useMemo(() => {
    return {
      product: allVouchers.filter((v) => v.type === 'product'),
      shipping: allVouchers.filter((v) => v.type === 'shipping'),
      platform: allVouchers.filter((v) => v.type === 'platform'),
    };
  }, [allVouchers]);

  // Calculate discount (memoized, no side effects)
  const discountResult = useMemo(() => {
    return applyVouchers(selectedVouchers, subtotal, shippingFee);
  }, [selectedVouchers, subtotal, shippingFee]);

  // Call parent callback in useEffect (not in render)
  React.useEffect(() => {
    onDiscountChange?.(discountResult);
  }, [discountResult, onDiscountChange]);

  // Kiểm tra voucher có hợp lệ
  const isVoucherValid = (voucher: Voucher) => {
    return validateVoucher(voucher, subtotal, selectedVouchers).isValid;
  };

  // Xử lý chọn voucher
  const handleSelectVoucher = (voucher: Voucher) => {
    const updated = { ...selectedVouchers };
    const voucherType = voucher.type as keyof VoucherGroup;

    if (updated[voucherType]?.id === voucher.id) {
      // Deselect
      updated[voucherType] = null;
    } else {
      // Select
      updated[voucherType] = voucher;
    }

    onVouchersChange(updated);
  };

  // Auto apply best vouchers
  const handleAutoApply = () => {
    const best = findBestVouchers(allVouchers, subtotal, shippingFee, selectedVouchers);
    onVouchersChange(best);
    setShowAutoApply(false);
  };

  const renderVoucherCard = (voucher: Voucher) => {
    const isValid = isVoucherValid(voucher);
    const isSelected = selectedVouchers[voucher.type as keyof VoucherGroup]?.id === voucher.id;
    const colors = getVoucherColor(voucher.type);
    const validation = validateVoucher(voucher, subtotal, selectedVouchers);

    return (
      <div
        key={voucher.id}
        className={`p-4 rounded-lg border-2 transition cursor-pointer ${
          isSelected
            ? `${colors.border} bg-blue-50 border-blue-500`
            : isValid
              ? `${colors.border} ${colors.bg} hover:border-blue-300`
              : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
        }`}
        onClick={() => isValid && handleSelectVoucher(voucher)}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-1 rounded text-xs font-bold ${colors.badge}`}>
                {voucher.discountType === 'percent' ? `${voucher.discountValue}%` : `₫${formatPrice(voucher.discountValue)}`}
              </span>
              <span className="text-xs font-semibold text-gray-600">{getVoucherTypeLabel(voucher.type)}</span>
            </div>
            <p className="font-semibold text-gray-800">{voucher.code}</p>
          </div>

          {/* Checkbox */}
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
              isSelected
                ? 'bg-blue-500 border-blue-500'
                : isValid
                  ? 'border-blue-300'
                  : 'border-gray-300'
            }`}
          >
            {isSelected && <span className="text-white text-xs">✓</span>}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-700 mb-2">{voucher.description}</p>

        {/* Conditions */}
        <div className="text-xs text-gray-600 space-y-1">
          <p>
            💰 <span className="font-medium">Đơn tối thiểu:</span> ₫{formatPrice(voucher.minOrder)}
          </p>
          {voucher.maxDiscount && (
            <p>
              📊 <span className="font-medium">Giảm tối đa:</span> ₫{formatPrice(voucher.maxDiscount)}
            </p>
          )}
        </div>

        {/* Validation message */}
        {!isValid && validation.reason && (
          <p className="text-xs text-red-600 mt-2 font-medium">⚠️ {validation.reason}</p>
        )}

        {/* Best badge */}
        {isSelected && (
          <div className="mt-2 text-xs font-bold text-green-600">✨ Được chọn</div>
        )}
      </div>
    );
  };

  const renderTab = (type: 'product' | 'shipping' | 'platform', label: string) => {
    const vouchers = groupedVouchers[type];
    const selected = selectedVouchers[type];
    const hasValid = vouchers.some((v) => isVoucherValid(v));

    return (
      <div key={type} className="mb-4">
        <button
          onClick={() => setExpandedTab(expandedTab === type ? null : type)}
          className="w-full p-3 flex items-center justify-between bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">{label.split(' ')[0]}</span>
            <div>
              <p className="font-semibold text-left">{label}</p>
              {selected && (
                <p className="text-xs text-green-600 font-medium">
                  ✓ {selected.code}: {selected.discountType === 'percent' ? `${selected.discountValue}%` : `₫${formatPrice(selected.discountValue)}`}
                </p>
              )}
            </div>
          </div>
          <span className={`transform transition ${expandedTab === type ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {expandedTab === type && (
          <div className="mt-2 space-y-2 pl-2">
            {vouchers.length === 0 ? (
              <p className="text-sm text-gray-500">Không có voucher loại này</p>
            ) : !hasValid ? (
              <p className="text-sm text-gray-500">Không có voucher phù hợp với đơn hàng của bạn</p>
            ) : (
              vouchers.map((v) => renderVoucherCard(v))
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span>🎁</span> Chọn Mã Giảm Giá
        </h3>
        <button
          onClick={handleAutoApply}
          className="text-sm px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition font-medium"
        >
          🌟 Tự động chọn tốt nhất
        </button>
      </div>

      {/* Tabs */}
      <div className="space-y-3 mb-6">
        {renderTab('product', '🛍️ Giảm sản phẩm')}
        {renderTab('platform', '⭐ Mã hệ thống')}
        {renderTab('shipping', '🚚 Giảm vận chuyển')}
      </div>

      {/* Applied Vouchers Summary */}
      {discountResult.appliedVouchers.length > 0 && (
        <div className="bg-linear-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-sm font-semibold text-green-700 mb-3">✨ Voucher đã áp dụng:</p>

          <div className="space-y-2 mb-4">
            {discountResult.appliedVouchers.map((v) => (
              <div key={v.id} className="flex justify-between items-center text-sm">
                <div>
                  <p className="font-medium text-green-800">{v.code}</p>
                  <p className="text-xs text-green-600">{v.description}</p>
                </div>
                <p className="font-bold text-green-700">
                  -₫{formatPrice(
                    v.type === 'product'
                      ? discountResult.productDiscount
                      : v.type === 'platform'
                        ? discountResult.platformDiscount
                        : discountResult.shippingDiscount
                  )}
                </p>
              </div>
            ))}
          </div>

          {/* Discount breakdown */}
          <div className="border-t border-green-200 pt-3 space-y-2 text-sm">
            {discountResult.productDiscount > 0 && (
              <div className="flex justify-between">
                <span>Giảm sản phẩm:</span>
                <span className="font-semibold">-₫{formatPrice(discountResult.productDiscount)}</span>
              </div>
            )}
            {discountResult.platformDiscount > 0 && (
              <div className="flex justify-between">
                <span>Giảm từ hệ thống:</span>
                <span className="font-semibold">-₫{formatPrice(discountResult.platformDiscount)}</span>
              </div>
            )}
            {discountResult.shippingDiscount > 0 && (
              <div className="flex justify-between">
                <span>Giảm vận chuyển:</span>
                <span className="font-semibold">-₫{formatPrice(discountResult.shippingDiscount)}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-bold text-green-700 pt-2 border-t border-green-200">
              <span>Tổng tiết kiệm:</span>
              <span>-₫{formatPrice(discountResult.totalDiscount)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Price Summary */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Tạm tính:</span>
          <span>₫{formatPrice(discountResult.details.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Phí vận chuyển:</span>
          <span>₫{formatPrice(discountResult.details.shippingFee)}</span>
        </div>
        {discountResult.totalDiscount > 0 && (
          <div className="flex justify-between text-green-600 font-semibold">
            <span>Giảm giá:</span>
            <span>-₫{formatPrice(discountResult.totalDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold pt-2 border-t">
          <span>Tổng cộng:</span>
          <span className="text-red-600">₫{formatPrice(discountResult.finalTotal)}</span>
        </div>
      </div>

      {/* Help text */}
      <p className="text-xs text-gray-500 mt-4 text-center">
        💡 Bạn có thể kết hợp: 1 voucher sản phẩm + 1 voucher hệ thống + 1 voucher vận chuyển
      </p>
    </div>
  );
}
