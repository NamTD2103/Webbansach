# 🎁 Voucher System Documentation (Shopee-style)

## 📋 Overview

Hệ thống voucher nâng cấp theo chuẩn Shopee, cho phép khách hàng áp dụng đồng thời nhiều loại voucher với quy tắc rõ ràng.

---

## 🏗️ Architecture

### Folder Structure

```
lib/vouchers/
├── types.ts          # Interfaces & Types
└── utils.ts          # Business logic

app/checkout/
└── components/
    └── VoucherSelector.tsx  # Main UI Component
```

---

## 📦 Types (`lib/vouchers/types.ts`)

### VoucherType (4 loại)

```typescript
type VoucherType = 'product' | 'shipping' | 'platform' | 'shop';
```

| Type | Mô tả | Áp dụng trên |
|------|-------|-------------|
| `product` | Giảm giá sản phẩm | Subtotal |
| `shipping` | Giảm phí vận chuyển | Shipping Fee |
| `platform` | Voucher hệ thống | Subtotal (sau product) |
| `shop` | Voucher cửa hàng | (Tuỳ chỉnh) |

### Voucher Interface

```typescript
interface Voucher {
  id: string;                          // Unique ID
  code: string;                        // Mã voucher (ví dụ: DEMO50)
  type: VoucherType;                   // Loại voucher
  discountType: 'percent' | 'fixed';   // % hoặc ₫
  discountValue: number;               // Giá trị giảm
  maxDiscount?: number;                // Giới hạn giảm tối đa (cho percent)
  minOrder: number;                    // Giá trị đơn tối thiểu
  description: string;                 // Mô tả
  validFrom?: Date | string;           // Ngày bắt đầu
  validTo?: Date | string;             // Ngày kết thúc
  isActive?: boolean;                  // Có hoạt động không
  usage?: {
    totalUsage?: number;               // Tổng lượt sử dụng
    maxUsage?: number;                 // Giới hạn sử dụng tối đa
    userUsage?: number;                // Người dùng đã sử dụng bao lần
  };
}
```

### VoucherGroup (Quản lý theo Type)

```typescript
interface VoucherGroup {
  product: Voucher | null;     // 1 voucher sản phẩm
  shipping: Voucher | null;    // 1 voucher vận chuyển
  platform: Voucher | null;    // 1 voucher hệ thống
}
```

---

## 🔧 Business Logic (`lib/vouchers/utils.ts`)

### 1. `validateVoucher()`

Kiểm tra xem voucher có thể áp dụng được không.

**Tham số:**
- `voucher`: Voucher cần kiểm tra
- `subtotal`: Giá trị đơn hàng
- `currentVouchers`: Danh sách vouchers đã chọn
- `userUsage?`: Số lần người dùng đã sử dụng

**Kiểm tra:**
- ✅ Voucher không null
- ✅ Chưa hết hạn
- ✅ Đang hoạt động (isActive)
- ✅ Đơn hàng >= minOrder
- ✅ Chưa hết lượt sử dụng
- ✅ Chưa áp dụng cùng type

**Trả về:**
```typescript
{
  isValid: boolean;
  reason?: string;      // Lý do không hợp lệ
  canApply?: boolean;
}
```

---

### 2. `calculateSingleDiscount()`

Tính giảm giá từ 1 voucher.

**Logic:**
```typescript
// Percent: 10% của 1,000,000 = 100,000
if (discountType === 'percent') {
  discount = Math.floor((amount * discountValue) / 100);
}

// Fixed: giảm 100,000 ₫
if (discountType === 'fixed') {
  discount = discountValue;
}

// Giới hạn bởi maxDiscount
if (discount > maxDiscount) {
  discount = maxDiscount;
}

// Không vượt quá amount
discount = Math.min(discount, amount);
```

---

### 3. `applyVouchers()` ⭐ (Hàm chính)

Áp dụng **tất cả** vouchers theo thứ tự ưu tiên.

**Thứ tự áp dụng:**
```
1️⃣ Product Voucher   → áp dụng trên Subtotal
2️⃣ Platform Voucher  → áp dụng trên (Subtotal - productDiscount)
3️⃣ Shipping Voucher  → áp dụng trên Shipping Fee
```

**Ví dụ:**
```
Subtotal: 1,000,000
Shipping: 30,000
Before discount: 1,030,000

Product voucher (10%, max 500K):
  → 100,000 (10% của 1M, chưa vượt max)

Platform voucher (5%, max 200K):
  → 45,000 (5% của 900K (1M - 100K), chưa vượt max)

Shipping voucher (20K fixed):
  → 20,000

Total discount: 165,000
Final total: 865,000
```

**Trả về:**
```typescript
interface DiscountResult {
  productDiscount: number;      // Giảm sản phẩm
  platformDiscount: number;     // Giảm hệ thống
  shippingDiscount: number;     // Giảm vận chuyển
  totalDiscount: number;        // Tổng cộng
  finalTotal: number;           // Tổng tiền cuối cùng
  appliedVouchers: Voucher[];   // Danh sách vouchers đã dùng
  details: {
    subtotal: number;
    shippingFee: number;
    beforeDiscount: number;
  };
}
```

---

### 4. `findBestVouchers()` (Bonus: Auto-apply)

Tìm vouchers tốt nhất có thể áp dụng (cho nút "Tự động chọn").

**Logic:**
- Duyệt tất cả vouchers theo loại
- Chọn voucher cho giảm giá cao nhất
- Đảm bảo hợp lệ theo điều kiện

---

## 🎨 Component (`app/checkout/components/VoucherSelector.tsx`)

### Props

```typescript
interface VoucherSelectorProps {
  allVouchers: Voucher[];                    // Danh sách vouchers
  subtotal: number;                         // Giá hàng
  shippingFee: number;                      // Phí ship
  selectedVouchers: VoucherGroup;           // Vouchers đã chọn
  onVouchersChange: (vouchers: VoucherGroup) => void;  // Callback khi thay đổi
  onDiscountChange?: (discount: DiscountResult) => void;  // Callback khi discount thay đổi
}
```

### Features

✨ **UI/UX:**
- Giao diện accordion theo loại voucher (Product | Platform | Shipping)
- Hiển thị danh sách vouchers dạng selectable card
- Checkbox để chọn/bỏ chọn
- Hiển thị điều kiện áp dụng
- Nút "Tự động chọn tốt nhất"
- Disabled automation nếu không hợp lệ

📊 **Thông tin hiển thị:**
- Mã voucher + loại giảm giá
- Mô tả ngắn gọn
- Điều kiện: Đơn tối thiểu, Giới hạn giảm tối đa
- Lý do không hợp lệ (nếu không thể dùng)

💰 **Tóm tắt giảm giá:**
- Chi tiết từng loại giảm giá
- Tổng tiền tiết kiệm
- Tổng cộng cuối cùng

---

## 📝 Usage Example

### 1. Setup Demo Vouchers

```typescript
const DEMO_VOUCHERS: Voucher[] = [
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
    code: 'SHIP2K',
    type: 'shipping',
    discountType: 'fixed',
    discountValue: 20000,
    minOrder: 0,
    description: 'Giảm 20K phí vận chuyển',
    isActive: true,
  },
  // ...
];
```

### 2. Use in Checkout Page

```typescript
'use client';

import VoucherSelector from './components/VoucherSelector';
import type { VoucherGroup, DiscountResult } from '@/lib/vouchers/types';

export default function CheckoutPage() {
  const [selectedVouchers, setSelectedVouchers] = useState<VoucherGroup>({
    product: null,
    shipping: null,
    platform: null,
  });
  const [discountResult, setDiscountResult] = useState<DiscountResult | null>(null);

  return (
    <>
      <VoucherSelector
        allVouchers={DEMO_VOUCHERS}
        subtotal={subtotal}
        shippingFee={shippingFee}
        selectedVouchers={selectedVouchers}
        onVouchersChange={setSelectedVouchers}
        onDiscountChange={setDiscountResult}
      />

      {/* Sử dụng discount result */}
      <p>Tổng giảm giá: ₫{discountResult?.totalDiscount?.toLocaleString()}</p>
    </>
  );
}
```

### 3. Calculate Order Total

```typescript
const discount = discountResult?.totalDiscount || 0;
const total = subtotal + shippingFee - discount;

// Lưu thông tin vouchers vào order
const orderData = {
  // ...
  discount,
  totalAmount: total,
  appliedVouchers: {
    product: selectedVouchers.product?.code || null,
    shipping: selectedVouchers.shipping?.code || null,
    platform: selectedVouchers.platform?.code || null,
  },
};
```

---

## 🎯 Quy Tắc Áp Dụng

### Được phép kết hợp:
- ✅ 1 voucher sản phẩm + 1 voucher hệ thống + 1 voucher vận chuyển
- ✅ 1 voucher sản phẩm + 1 voucher hệ thống
- ✅ 1 voucher sản phẩm + 1 voucher vận chuyển
- ✅ Chỉ 1 voucher sản phẩm
- ✅ Chỉ 1 voucher hệ thống
- ✅ Chỉ 1 voucher vận chuyển

### Không được phép:
- ❌ 2 vouchers cùng loại (ví dụ: 2 voucher sản phẩm)
- ❌ Voucher quá hạn
- ❌ Voucher không hoạt động
- ❌ Đơn hàng < minOrder
- ❌ Hết lượt sử dụng

---

## 🔌 Integration Checklist

- [x] Tạo types & interfaces
- [x] Viết business logic (validate, apply)
- [x] Component UI (VoucherSelector)
- [x] Cập nhật checkout page
- [x] Demo vouchers
- [ ] Kết nối backend API (tuỳ chỉnh)
- [ ] Unit tests
- [ ] E2E tests

---

## 🚀 Mở Rộng (Future Features)

1. **Backend Integration:**
   - API endpoint lấy danh sách vouchers
   - Validate voucher code từ backend
   - Tracking usage/redemption

2. **Advanced Features:**
   - Voucher theo category (sách, ebooks, etc)
   - Voucher combo (bắt buộc mua 2+ items)
   - Flash sale vouchers
   - Referral vouchers

3. **UX Improvements:**
   - Search/filter vouchers
   - Voucher history
   - Notification khi voucher sắp hết hạn
   - Animation & micro-interactions

---

## 📚 File References

| File | Mục đích |
|------|---------|
| `lib/vouchers/types.ts` | Types & Interfaces |
| `lib/vouchers/utils.ts` | Business logic (validate, apply, calculate) |
| `app/checkout/components/VoucherSelector.tsx` | React component UI |
| `app/checkout/page.tsx` | Integration công cổng thanh toán |

---

## 💡 Code Quality

✅ **Clean Architecture:**
- Logic tách biệt khỏi UI
- Helper functions pure & testable
- Type-safe với TypeScript
- Dễ mở rộng & maintain

✅ **Performance:**
- useMemo để tối ưu re-render
- Lazy validation
- Efficient discount calculation

✅ **UX:**
- Real-time discount preview
- Clear error messages
- Visual feedback
- Accessibility friendly

---

## 🎓 Học Tập

**Concepts applied:**
- React Hooks (useState, useMemo)
- TypeScript Interfaces & Types
- Business logic separation
- Component composition
- State management
- Form handling

Đây là template production-ready có thể mở rộng theo nhu cầu! 🚀
