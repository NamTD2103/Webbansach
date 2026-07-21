/**
 * Quick Start Guide - Voucher System Integration
 * 
 * Hướng dẫn nhanh cách sử dụng hệ thống voucher Shopee-style
 */

// ============================================
// 1️⃣ IMPORT TYPES & UTILS
// ============================================

import type { Voucher, VoucherGroup, DiscountResult } from '@/lib/vouchers/types';
import { applyVouchers, validateVoucher, findBestVouchers } from '@/lib/vouchers/utils';
import VoucherSelector from '@/app/checkout/components/VoucherSelector';

// ============================================
// 2️⃣ SETUP VOUCHERS (Demo Data)
// ============================================

const DEMO_VOUCHERS: Voucher[] = [
  // Product Vouchers
  {
    id: '1',
    code: 'DEMO50',
    type: 'product',
    discountType: 'percent',
    discountValue: 10,
    maxDiscount: 500000,
    minOrder: 100000,
    description: 'Giảm 10% sản phẩm (tối đa 500K)',
    isActive: true,
  },
  {
    id: '2',
    code: 'SAVE100K',
    type: 'product',
    discountType: 'fixed',
    discountValue: 100000,
    minOrder: 500000,
    description: 'Giảm 100K cho đơn từ 500K',
    isActive: true,
  },

  // Platform Vouchers
  {
    id: '3',
    code: 'WELCOME',
    type: 'platform',
    discountType: 'percent',
    discountValue: 5,
    maxDiscount: 200000,
    minOrder: 50000,
    description: 'Chào mừng mới! Giảm 5% hệ thống',
    isActive: true,
  },
  {
    id: '5',
    code: 'SYSCM99',
    type: 'platform',
    discountType: 'fixed',
    discountValue: 50000,
    minOrder: 300000,
    description: 'Mega Sale: Giảm 50K',
    isActive: true,
  },

  // Shipping Vouchers
  {
    id: '4',
    code: 'SHIP2K',
    type: 'shipping',
    discountType: 'fixed',
    discountValue: 20000,
    minOrder: 0,
    description: 'Giảm 20K phí vận chuyển',
    isActive: true,
  },
];

// ============================================
// 3️⃣ COMPONENT USAGE (dalam CheckoutPage)
// ============================================

export default function CheckoutPageExample() {
  const [selectedVouchers, setSelectedVouchers] = React.useState<VoucherGroup>({
    product: null,
    shipping: null,
    platform: null,
  });

  const [discountResult, setDiscountResult] = React.useState<DiscountResult | null>(null);

  const subtotal = 1000000; // 1 triệu
  const shippingFee = 30000; // 30K

  return (
    <div className="checkout-page">
      {/* Render Voucher Selector Component */}
      <VoucherSelector
        allVouchers={DEMO_VOUCHERS}
        subtotal={subtotal}
        shippingFee={shippingFee}
        selectedVouchers={selectedVouchers}
        onVouchersChange={setSelectedVouchers}
        onDiscountChange={setDiscountResult}
      />

      {/* Use Discount Result */}
      {discountResult && (
        <div className="price-summary">
          <p>Tạm tính: ₫{subtotal.toLocaleString('vi-VN')}</p>
          <p>Vận chuyển: ₫{shippingFee.toLocaleString('vi-VN')}</p>

          {discountResult.productDiscount > 0 && (
            <p className="discount">
              Giảm sản phẩm: -₫{discountResult.productDiscount.toLocaleString('vi-VN')}
            </p>
          )}
          {discountResult.platformDiscount > 0 && (
            <p className="discount">
              Giảm hệ thống: -₫{discountResult.platformDiscount.toLocaleString('vi-VN')}
            </p>
          )}
          {discountResult.shippingDiscount > 0 && (
            <p className="discount">
              Giảm vận chuyển: -₫{discountResult.shippingDiscount.toLocaleString('vi-VN')}
            </p>
          )}

          <p className="total">
            Tổng cộng: ₫{discountResult.finalTotal.toLocaleString('vi-VN')}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================
// 4️⃣ MANUAL USAGE (If not using component)
// ============================================

function manualVoucherCalculation() {
  const subtotal = 1000000;
  const shippingFee = 30000;

  // Select vouchers manually
  const selectedVouchers: VoucherGroup = {
    product: DEMO_VOUCHERS.find((v) => v.code === 'DEMO50') || null,
    platform: DEMO_VOUCHERS.find((v) => v.code === 'WELCOME') || null,
    shipping: DEMO_VOUCHERS.find((v) => v.code === 'SHIP2K') || null,
  };

  // Validate each voucher
  if (selectedVouchers.product) {
    const validation = validateVoucher(
      selectedVouchers.product,
      subtotal,
      selectedVouchers
    );
    console.log('Product voucher valid?', validation.isValid);
  }

  // Apply all vouchers and calculate discount
  const result = applyVouchers(selectedVouchers, subtotal, shippingFee);

  console.log('Discount Result:', {
    productDiscount: result.productDiscount, // 100000 (10%)
    platformDiscount: result.platformDiscount, // 45000 (5% of 900k)
    shippingDiscount: result.shippingDiscount, // 20000
    totalDiscount: result.totalDiscount, // 165000
    finalTotal: result.finalTotal, // 865000
  });

  return result;
}

// ============================================
// 5️⃣ AUTO-APPLY BEST VOUCHERS
// ============================================

function autoApplyBestVouchers() {
  const subtotal = 1000000;
  const shippingFee = 30000;
  const currentVouchers: VoucherGroup = {
    product: null,
    shipping: null,
    platform: null,
  };

  // Find best vouchers automatically
  const best = findBestVouchers(
    DEMO_VOUCHERS,
    subtotal,
    shippingFee,
    currentVouchers
  );

  console.log('Best vouchers:', {
    product: best.product?.code,
    platform: best.platform?.code,
    shipping: best.shipping?.code,
  });

  // Apply them
  const result = applyVouchers(best, subtotal, shippingFee);
  return result;
}

// ============================================
// 6️⃣ CALCULATED EXAMPLES
// ============================================

/**
 * Scenario 1: Multi-voucher
 * Subtotal: 1,000,000
 * Shipping: 30,000
 * 
 * Applied:
 * - DEMO50: 10% product (max 500K) = 100,000
 * - WELCOME: 5% platform (max 200K) on (1M - 100K) = 45,000
 * - SHIP2K: 20K shipping = 20,000
 * 
 * Result:
 * Before: 1,030,000
 * Discount: 165,000
 * Total: 865,000
 */

/**
 * Scenario 2: Only product voucher
 * Subtotal: 2,000,000
 * Shipping: 30,000
 * 
 * Applied:
 * - SAVE100K: 100K fixed = 100,000
 * 
 * Result:
 * Before: 2,030,000
 * Discount: 100,000
 * Total: 1,930,000
 */

/**
 * Scenario 3: Invalid - Below minOrder
 * Subtotal: 50,000
 * Shipping: 0
 * 
 * Applied:
 * - DEMO50: ❌ (min 100K, but subtotal 50K)
 * 
 * Only valid can apply
 */

// ============================================
// 7️⃣ INTEGRATION WITH ORDER API
// ============================================

async function submitOrderWithVouchers() {
  const user = { userId: 123 };
  const selectedVouchers: VoucherGroup = {
    product: DEMO_VOUCHERS.find((v) => v.code === 'DEMO50') || null,
    platform: null,
    shipping: DEMO_VOUCHERS.find((v) => v.code === 'SHIP2K') || null,
  };

  const discountResult = applyVouchers(selectedVouchers, 1000000, 30000);

  // Create order payload
  const orderPayload = {
    userId: user.userId,
    items: [
      { masp: 'SP001', quantity: 1, price: 500000 },
      { masp: 'SP002', quantity: 1, price: 500000 },
    ],
    subtotal: 1000000,
    shippingFee: 30000,
    discount: discountResult.totalDiscount, // 120000
    totalAmount: discountResult.finalTotal, // 910000
    appliedVouchers: {
      product: selectedVouchers.product?.code || null, // 'DEMO50'
      platform: selectedVouchers.platform?.code || null, // null
      shipping: selectedVouchers.shipping?.code || null, // 'SHIP2K'
    },
  };

  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });

    const result = await response.json();
    console.log('Order created:', result);
  } catch (error) {
    console.error('Order error:', error);
  }
}

// ============================================
// 8️⃣ EXTENDING: Custom Voucher Types
// ============================================

/**
 * Để thêm voucher type mới:
 * 
 * 1. Update VoucherType enum trong types.ts:
 *    type VoucherType = 'product' | 'shipping' | 'platform' | 'shop' | 'category'
 * 
 * 2. Update VoucherGroup interface:
 *    interface VoucherGroup {
 *      product: Voucher | null;
 *      shipping: Voucher | null;
 *      platform: Voucher | null;
 *      category: Voucher | null;  // NEW
 *    }
 * 
 * 3. Update applyVouchers() logic:
 *    if (vouchers.category) {
 *      categoryDiscount = calculateSingleDiscount(vouchers.category, subtotal);
 *    }
 * 
 * 4. Update DiscountResult interface:
 *    categoryDiscount: number;
 * 
 * 5. Update VoucherSelector UI:
 *    {renderTab('category', '📚 Voucher thể loại')}
 */

export { DEMO_VOUCHERS, manualVoucherCalculation, autoApplyBestVouchers };
