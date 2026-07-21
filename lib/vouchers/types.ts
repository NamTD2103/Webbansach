/**
 * Voucher Types & Interfaces
 * Tương tự hệ thống Shopee
 */

export type VoucherType = 'product' | 'shipping' | 'platform' | 'shop';
export type DiscountType = 'percent' | 'fixed';

export interface Voucher {
  id: string;
  code: string;
  type: VoucherType;
  discountType: DiscountType;
  discountValue: number; // % hoặc ₫
  maxDiscount?: number; // Giới hạn giảm tối đa (₫)
  minOrder: number; // Giá trị đơn tối thiểu
  description: string;
  validFrom?: Date | string;
  validTo?: Date | string;
  isActive?: boolean;
  usage?: {
    totalUsage?: number;
    maxUsage?: number;
    userUsage?: number;
  };
}

export interface VoucherGroup {
  product: Voucher | null;
  shipping: Voucher | null;
  platform: Voucher | null;
  // shop: Voucher | null; // Có thể bỏ nếu không dùng
}

export interface DiscountResult {
  productDiscount: number;
  shippingDiscount: number;
  platformDiscount: number;
  totalDiscount: number;
  finalTotal: number;
  appliedVouchers: Voucher[];
  details: {
    subtotal: number;
    shippingFee: number;
    beforeDiscount: number;
  };
}

export interface VoucherValidation {
  isValid: boolean;
  reason?: string;
  canApply?: boolean;
}
