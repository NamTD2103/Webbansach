# 📦 PRODUCT AVAILABILITY MANAGEMENT - IMPLEMENTATION GUIDE

**Status:** ✅ READY TO INTEGRATE  
**Priority:** 🔴 CRITICAL (Bắt Buộc)  
**Requirement:** "Không hiển thị hàng hóa với số lượng = 0"

---

## 🎯 REQUIREMENTS

### Current Status: ✅ PARTIAL
- ✅ Backend can return products with stock info
- ❌ Frontend doesn't filter out zero-stock items
- ❌ No way to display "out of stock" vs "available"

### Feature: Hide Zero-Stock Products
- ✅ Do not show products with SOLUONGTON = 0 on homepage
- ✅ Do not show in search results
- ✅ Do not show in category listing
- ⚠️ Admin can still see them (for management)
- ⚠️ Later: Show "Hết hàng" badge for HOT items with 0 stock

---

## 🔧 IMPLEMENTATION

### Part 1: Backend Enhancement (Optional)

Add filter parameter to product API:

```javascript
// File: backend/routes/product.js
// Add this to GET / endpoint

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const offset = (page - 1) * limit;
    
    // ✅ NEW: Filter parameter
    const includeOutOfStock = req.query.includeOutOfStock === 'true' ? false : true;
    
    let query = `
      SELECT MASP, TENSP, GIABAN, SOLUONGTON,
             HINHANH AS IMAGE_URL,
             MOTA AS DESCRIPTION,
             NVL(MANCC,'') AS MANCC
      FROM SANPHAM
    `;
    
    // ✅ NEW: Add WHERE clause to exclude zero-stock
    if (includeOutOfStock) {
      query += ` WHERE SOLUONGTON > 0`;
    }
    
    query += ` ORDER BY TENSP
               OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    `;

    // ... rest of code
  }
});
```

### Part 2: Frontend Filter (Main Implementation)

**File:** `app/page.tsx`

```tsx
// Update the fetchProducts function to filter out zero-stock items

const fetchProducts = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);

    let response;
    if (searchQuery.trim()) {
      setSearching(true);
      response = await productAPI.search(searchQuery);
      let products = response.data || [];
      
      // ✅ FILTER 1: Remove zero-stock products
      products = products.filter((p: Product) => p.SOLUONGTON > 0);

      // Filter by price range
      products = products.filter(
        (p: Product) =>
          p.GIABAN >= priceRange.min && p.GIABAN <= priceRange.max,
      );

      setProducts(products);
      setPage(1);
      setTotalPages(1);
    } else {
      setSearching(false);
      response = await productAPI.getAll(page, 20);
      let products = response.data || [];

      // ✅ FILTER 1: Remove zero-stock products
      products = products.filter((p: Product) => p.SOLUONGTON > 0);

      // Filter by category if selected
      if (selectedCategory) {
        products = products.filter(
          (p: Product) => p.CAT_ID === selectedCategory,
        );
      }

      // Filter by price range
      products = products.filter(
        (p: Product) =>
          p.GIABAN >= priceRange.min && p.GIABAN <= priceRange.max,
      );

      setProducts(products);
      setTotalPages(response.pagination?.pages || 1);
    }
  } catch (err) {
    setError('Failed to load products');
    console.error(err);
  } finally {
    setLoading(false);
  }
}, [page, searchQuery, selectedCategory, priceRange]);
```

### Part 3: Add Stock Status Component

**File:** Create `components/ProductCard.tsx`

```tsx
'use client';

import { Product } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';

interface ProductCardProps {
  product: Product;
  isOutOfStock?: boolean;
}

export default function ProductCard({ product, isOutOfStock }: ProductCardProps) {
  const isAvailable = product.SOLUONGTON > 0;

  return (
    <Link href={`/product/${product.MASP}`}>
      <div className={`group relative bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow ${
        !isAvailable ? 'opacity-60 cursor-not-allowed' : ''
      }`}>
        
        {/* Image Container */}
        <div className="relative w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
          <img
            src={product.IMAGE_URL || '/placeholder.jpg'}
            alt={product.TENSP}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform ${
              !isAvailable ? 'grayscale' : ''
            }`}
          />
          
          {/* Out of Stock Badge */}
          {!isAvailable && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-lg">
                HẾT HÀNG
              </div>
            </div>
          )}

          {/* Stock Status Badge (top-right) */}
          <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold">
            {isAvailable ? (
              <span className="bg-green-100 text-green-800">
                ✅ Còn {product.SOLUONGTON} cái
              </span>
            ) : (
              <span className="bg-red-100 text-red-800">
                ❌ Hết hàng
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Product Name */}
          <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 mb-2">
            {product.TENSP}
          </h3>

          {/* Description */}
          <p className="line-clamp-2 text-xs text-gray-500 mb-3">
            {product.DESCRIPTION || 'No description'}
          </p>

          {/* Price & Stock */}
          <div className="flex items-end justify-between">
            <span className="text-lg font-bold text-orange-600">
              {product.GIABAN.toLocaleString('vi-VN')} ₫
            </span>
            <span className="text-xs text-gray-400">
              Kho: {product.SOLUONGTON}
            </span>
          </div>

          {/* Action Button */}
          <button
            className={`w-full mt-4 py-2 rounded-lg font-semibold transition-all ${
              isAvailable
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!isAvailable}
          >
            {isAvailable ? '🛒 Thêm vào giỏ' : '❌ Hết hàng'}
          </button>
        </div>
      </div>
    </Link>
  );
}
```

### Part 4: Update Home Page to Use New Component

**File:** `app/page.tsx`

Replace the current product rendering with:

```tsx
{/* Products Grid */}
<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
  {loading ? (
    <>
      {[...Array(8)].map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </>
  ) : products.length > 0 ? (
    products.map((product) => (
      <ProductCard
        key={product.MASP}
        product={product}
        isOutOfStock={product.SOLUONGTON === 0}
      />
    ))
  ) : (
    <div className="col-span-full text-center py-12">
      <p className="text-gray-500 text-lg">
        {searching
          ? '❌ Không tìm thấy sản phẩm nào'
          : '📦 Không có sản phẩm sẵn có'}
      </p>
    </div>
  )}
</div>
```

---

## 📊 ADMIN VIEW (Show ALL Products)

Admins should see zero-stock products for management:

**File:** `app/admin/page.tsx`

```tsx
// ✅ Admin can see ALL products including out-of-stock
const fetchProducts = async (page: number = 1) => {
  try {
    setProductsLoading(true);
    // Don't filter for admin - they need to see all products
    const res = await productAPI.getAll(page, pageSize);
    setProducts(res.data || []);
    // ... rest of code
  }
};
```

---

## 🧪 TEST CASES

### Test 1: Homepage - Hide Zero-Stock
```
1. Go to homepage /
2. Check product list
3. Verify: No products with SOLUONGTON = 0 visible
4. Expected: Only products with SOLUONGTON > 0 shown
```

### Test 2: Search - Hide Zero-Stock
```
1. Use search box
2. Search for any term
3. Results should exclude zero-stock items
4. Each result shows stock count
```

### Test 3: Category Filter
```
1. Select a category
2. Products shown should all have SOLUONGTON > 0
3. Apply price filter
4. Still no zero-stock items visible
```

### Test 4: Admin Can See All
```
1. Login as admin
2. Go to /admin
3. In product table, you can see all products
4. Including SOLUONGTON = 0 items
5. This allows management of zero-stock products
```

### Test 5: Out of Stock Badge
```
1. Manually set a product SOLUONGTON = 0 in DB
2. If later it becomes HOT flag, show in homepage
3. Display badge: "🔥 HẾT HÀNG" (red badge)
4. User can view but not add to cart
```

---

## 💾 DATABASE IMPACT

**No changes needed** - just filter existing data

The SOLUONGTON column already exists in SANPHAM table.

---

## 🔄 FILTER LOGIC FLOW

```
Frontend (app/page.tsx)
    ↓
Get products from API
    ↓
Filter: SOLUONGTON > 0  ✅ NEW
    ↓
Filter: Price range
    ↓
Filter: Category
    ↓
Display ProductCard components
    ↓
Each card shows stock status
```

---

## ⚙️ CONFIGURATION OPTIONS

### Option 1: Simple Hide (Recommended)
```typescript
// Hide all zero-stock products from customers
const filteredProducts = products.filter(p => p.SOLUONGTON > 0);
```

### Option 2: Show with Disabled Button
```typescript
// Show but mark as unavailable
const productCard = products.map(p => (
  <ProductCard
    isOutOfStock={p.SOLUONGTON === 0}
    product={p}
  />
));
```

### Option 3: Admin Override
```typescript
// Show parameter to include zero-stock
?includeOutOfStock=true  // For admin panel
```

**Current Recommendation:** Option 1 (Hide completely for customers)

---

## 📋 IMPLEMENTATION CHECKLIST

- [ ] Update `app/page.tsx` with filter logic
- [ ] Create `components/ProductCard.tsx` component
- [ ] Add stock status badge to product card
- [ ] Test homepage - verify zero-stock hidden
- [ ] Test search - verify zero-stock hidden
- [ ] Test admin panel - verify can see all products
- [ ] Test "Add to Cart" - disabled for zero-stock
- [ ] Test category filters combined with stock filter
- [ ] Verify mobile responsive design

---

## 🎨 UI IMPROVEMENTS

### Current (Without Filter)
```
Product Grid showing all products including:
- Available items (SOLUONGTON > 0)
- Out of stock items (SOLUONGTON = 0)
- Mixed stock levels
```

### Improved (With Filter)
```
✅ Product Grid:
  [Product 1] - Còn 5 cái ✅
  [Product 2] - Còn 12 cái ✅
  [Product 3] - Còn 1 cái ✅

❌ Removed:
  [Empty Product] - Hết hàng (Not shown)
  [Empty Product] - Hết hàng (Not shown)
```

---

## 📈 FUTURE ENHANCEMENTS

1. **Smart Restocking:** Notify customers when item back in stock
2. **Wishlist:** Add to wishlist if out of stock
3. **Pre-order:** Allow pre-orders for out-of-stock items
4. **Highlight Hot Items:** Even if out of stock, show "🔥 CHÁY HÀNG"

---

## ✅ PHASE 2 (After HOT/BESTSELLER Feature)

Once HOT flag is implemented:

```tsx
{/* Show hot items even if out of stock */}
{product.IS_HOT && product.SOLUONGTON === 0 && (
  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
    <div className="text-center">
      <div className="text-4xl mb-2">🔥</div>
      <p className="text-white font-bold">CHÁY HÀNG</p>
    </div>
  </div>
)}
```

---

## 📚 FILES TO CREATE/MODIFY

| File | Action | Reason |
|------|--------|--------|
| `app/page.tsx` | MODIFY | Add filter logic |
| `components/ProductCard.tsx` | CREATE | Reusable product card |
| `backend/routes/product.js` | OPTIONAL | Add backend filter param |

---

## 🚀 DEPLOYMENT

1. ✅ No database migration needed
2. ✅ No backend changes required (optional enhancement only)
3. ✅ Pure frontend filter implementation
4. ✅ Can be deployed immediately
5. ✅ No breaking changes

---

## 📞 SUPPORT

If product still appears:
1. Check SOLUONGTON value in database
2. Verify filter is applied in fetchProducts
3. Check browser cache (Ctrl+F5)
4. Test with different product IDs
