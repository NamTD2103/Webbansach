/**
 * Voucher Business Logic Utils
 * Xử lý validation, tính toán giảm giá
 */

import type { Voucher, VoucherGroup, DiscountResult, VoucherValidation } from './types';

/**
 * Validate voucher có thể áp dụng được không
 */
export const validateVoucher = (
  voucher: Voucher,
  subtotal: number,
  currentVouchers: VoucherGroup,
  userUsage?: number
): VoucherValidation => {
  // Kiểm tra voucher không null/undefined
  if (!voucher || !voucher.code) {
    return { isValid: false, reason: 'Voucher không hợp lệ', canApply: false };
  }

  // Kiểm tra đã hết hạn?
  if (voucher.validTo) {
    const validTo = new Date(voucher.validTo);
    if (validTo < new Date()) {
      return { isValid: false, reason: 'Voucher đã hết hạn', canApply: false };
    }
  }

  // Kiểm tra active
  if (voucher.isActive === false) {
    return { isValid: false, reason: 'Voucher không khả dụng', canApply: false };
  }

  // Kiểm tra giá tối thiểu
  if (subtotal < voucher.minOrder) {
    const remaining = voucher.minOrder - subtotal;
    return {
      isValid: false,
      reason: `Cần mua thêm ₫${remaining.toLocaleString('vi-VN')} để dùng voucher này`,
      canApply: false,
    };
  }

  // Kiểm tra usage limit
  if (voucher.usage?.maxUsage && (voucher.usage.totalUsage || 0) >= voucher.usage.maxUsage) {
    return { isValid: false, reason: 'Voucher đã hết lượt sử dụng', canApply: false };
  }

  if (voucher.usage?.userUsage && (userUsage || 0) >= 1) {
    return { isValid: false, reason: 'Bạn đã dùng voucher này rồi', canApply: false };
  }

  // Kiểm tra duplicate type
  if (voucher.type === 'product' && currentVouchers.product && currentVouchers.product !== voucher) {
    return {
      isValid: false,
      reason: 'Bạn đã áp dụng 1 voucher giảm giá sản phẩm',
      canApply: false,
    };
  }

  if (voucher.type === 'shipping' && currentVouchers.shipping && currentVouchers.shipping !== voucher) {
    return {
      isValid: false,
      reason: 'Bạn đã áp dụng 1 voucher giảm phí vận chuyển',
      canApply: false,
    };
  }

  if (voucher.type === 'platform' && currentVouchers.platform && currentVouchers.platform !== voucher) {
    return {
      isValid: false,
      reason: 'Bạn đã áp dụng 1 voucher hệ thống',
      canApply: false,
    };
  }

  return { isValid: true, canApply: true };
};

/**
 * Tính discount từ một voucher
 */
const calculateSingleDiscount = (voucher: Voucher, baseAmount: number): number => {
  if (baseAmount <= 0) return 0;

  let discount = 0;

  if (voucher.discountType === 'percent') {
    discount = Math.floor((baseAmount * voucher.discountValue) / 100);
  } else {
    discount = voucher.discountValue;
  }

  // Giới hạn bởi maxDiscount nếu có
  if (voucher.maxDiscount && discount > voucher.maxDiscount) {
    discount = voucher.maxDiscount;
  }

  // Không được vượt quá baseAmount
  return Math.min(discount, baseAmount);
};

/**
 * Áp dụng nhiều vouchers theo thứ tự ưu tiên
 * Thứ tự: Product → Platform → Shipping
 *
 * @param vouchers VoucherGroup chứa selected vouchers
 * @param subtotal Giá tiền hàng
 * @param shippingFee Phí vận chuyển
 * @returns DiscountResult với chi tiết giảm giá
 */
export const applyVouchers = (
  vouchers: VoucherGroup,
  subtotal: number,
  shippingFee: number
): DiscountResult => {
  let productDiscount = 0;
  let platformDiscount = 0;
  let shippingDiscount = 0;
  const appliedVouchers: Voucher[] = [];

  const beforeDiscount = subtotal + shippingFee;

  // 1️⃣ Apply Product Voucher (trên subtotal)
  if (vouchers.product) {
    productDiscount = calculateSingleDiscount(vouchers.product, subtotal);
    appliedVouchers.push(vouchers.product);
  }

  // 2️⃣ Apply Platform Voucher (trên subtotal sau product discount)
  if (vouchers.platform) {
    const baseForPlatform = subtotal - productDiscount;
    platformDiscount = calculateSingleDiscount(vouchers.platform, baseForPlatform);
    appliedVouchers.push(vouchers.platform);
  }

  // 3️⃣ Apply Shipping Voucher (trên shippingFee)
  if (vouchers.shipping) {
    shippingDiscount = calculateSingleDiscount(vouchers.shipping, shippingFee);
    appliedVouchers.push(vouchers.shipping);
  }

  const totalDiscount = productDiscount + platformDiscount + shippingDiscount;
  const finalTotal = beforeDiscount - totalDiscount;

  return {
    productDiscount,
    platformDiscount,
    shippingDiscount,
    totalDiscount,
    finalTotal: Math.max(0, finalTotal), // Đảm bảo không âm
    appliedVouchers,
    details: {
      subtotal,
      shippingFee,
      beforeDiscount,
    },
  };
};

/**
 * Tìm best voucher có thể áp dụng từ danh sách
 * (Dùng cho auto-apply feature)
 */
export const findBestVouchers = (
  allVouchers: Voucher[],
  subtotal: number,
  shippingFee: number,
  currentVouchers: VoucherGroup
): VoucherGroup => {
  const result: VoucherGroup = {
    product: currentVouchers.product,
    shipping: currentVouchers.shipping,
    platform: currentVouchers.platform,
  };

  // Tìm best product voucher
  if (!result.product) {
    let bestProductVoucher: Voucher | null = null;
    let maxDiscount = 0;

    allVouchers
      .filter((v) => v.type === 'product')
      .forEach((v) => {
        if (validateVoucher(v, subtotal, result).isValid) {
          const discount = calculateSingleDiscount(v, subtotal);
          if (discount > maxDiscount) {
            maxDiscount = discount;
            bestProductVoucher = v;
          }
        }
      });

    if (bestProductVoucher) {
      result.product = bestProductVoucher;
    }
  }

  // Tìm best platform voucher
  if (!result.platform) {
    let bestPlatformVoucher: Voucher | null = null;
    let maxDiscount = 0;

    allVouchers
      .filter((v) => v.type === 'platform')
      .forEach((v) => {
        if (validateVoucher(v, subtotal, result).isValid) {
          const baseAmount = subtotal - (result.product ? calculateSingleDiscount(result.product, subtotal) : 0);
          const discount = calculateSingleDiscount(v, baseAmount);
          if (discount > maxDiscount) {
            maxDiscount = discount;
            bestPlatformVoucher = v;
          }
        }
      });

    if (bestPlatformVoucher) {
      result.platform = bestPlatformVoucher;
    }
  }

  // Tìm best shipping voucher
  if (!result.shipping) {
    let bestShippingVoucher: Voucher | null = null;
    let maxDiscount = 0;

    allVouchers
      .filter((v) => v.type === 'shipping')
      .forEach((v) => {
        if (validateVoucher(v, subtotal, result).isValid) {
          const discount = calculateSingleDiscount(v, shippingFee);
          if (discount > maxDiscount) {
            maxDiscount = discount;
            bestShippingVoucher = v;
          }
        }
      });

    if (bestShippingVoucher) {
      result.shipping = bestShippingVoucher;
    }
  }

  return result;
};

/**
 * Format tiền VND
 */
export const formatPrice = (value: number): string => {
  return value.toLocaleString('vi-VN');
};

/**
 * Get voucher tag color by type
 */
export const getVoucherColor = (type: string) => {
  const colors = {
    product: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100' },
    shipping: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100' },
    platform: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100' },
    shop: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100' },
  };
  return colors[type as keyof typeof colors] || colors.platform;
};

/**
 * Get voucher type label
 */
export const getVoucherTypeLabel = (type: string): string => {
  const labels = {
    product: '🛍️ Giảm giá sản phẩm',
    shipping: '🚚 Giảm phí vận chuyển',
    platform: '⭐ Voucher hệ thống',
    shop: '🏪 Voucher cửa hàng',
  };
  return labels[type as keyof typeof labels] || type;
};
