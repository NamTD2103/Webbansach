# 🚀 ORDER CANCELLATION FEATURE - IMPLEMENTATION GUIDE

**Status:** ✅ READY TO INTEGRATE  
**Priority:** 🔴 CRITICAL (Bắt Buộc)  
**Completion:** Phase 1 Complete

---

## 📋 DELIVERABLES

### 1. Database Migration
- ✅ File: `backend/database/order-cancellation-migration.sql`
- ✅ New Tables:
  - `REFUND_TRANSACTIONS` - Tracks all refunds
  - `STOCK_HISTORY` - Audit trail of stock changes
- ✅ New Columns in `ORDERS`:
  - `CANCELLED_BY`, `CANCELLED_AT`, `CANCELLATION_REASON`
  - `REFUND_STATUS`, `REFUND_AMOUNT`, `REFUND_METHOD`

### 2. Backend API Routes
- ✅ File: `backend/routes/order-cancellation.js`
- ✅ Endpoints:
  - `POST /api/order/:orderId/cancel` - Customer cancels own order
  - `POST /api/admin/orders/:orderId/cancel` - Admin force cancel
  - `GET /api/admin/refunds` - View all refunds
  - `GET /api/admin/stock-history` - Audit trail

### 3. Frontend Components
- ✅ File: `components/CancelOrderModal.tsx`
- ✅ Features:
  - Modal dialog for cancellation confirmation
  - Predefined cancellation reasons
  - Error handling & success message
  - Business logic: only PENDING/PROCESSING orders

### 4. API Client
- ✅ File: `lib/api.ts`
- ✅ New Method: `orderAPI.cancelOrder(orderId, reason)`

---

## 🔧 INTEGRATION STEPS

### Step 1: Run Database Migration

```bash
# Navigate to backend directory
cd backend

# Run migration script on Oracle Database
sqlplus system/password@localhost:1521/orcl21pdb1 < database/order-cancellation-migration.sql

# Or paste SQL from file directly in Oracle SQL Developer
```

**Verify migration:**
```sql
SELECT * FROM USER_TAB_COLS WHERE TABLE_NAME = 'ORDERS' AND COLUMN_NAME = 'CANCELLED_BY';
SELECT * FROM USER_TABLES WHERE TABLE_NAME = 'REFUND_TRANSACTIONS';
SELECT * FROM USER_TABLES WHERE TABLE_NAME = 'STOCK_HISTORY';
```

---

### Step 2: Update Backend Server Configuration

✅ **Already Done** - `backend/server.js` updated:
```javascript
const orderCancellationRoutes = require('./routes/order-cancellation');
app.use('/api/order', orderCancellationRoutes);
```

---

### Step 3: Add Cancel Button to Account Page

Update `app/account/page.tsx` to import and use `CancelOrderModal`:

```tsx
'use client';

import CancelOrderModal from '@/components/CancelOrderModal';
import { useState } from 'react';

export default function Account() {
  const [cancelOrderId, setCancelOrderId] = useState<number | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // ... existing code ...

  // Add this inside your orders table/list rendering:
  const handleCancelClick = (orderId: number) => {
    setCancelOrderId(orderId);
    setIsCancelModalOpen(true);
  };

  const handleCancelSuccess = () => {
    // Refresh orders after cancellation
    fetchOrders(user.userId);
  };

  return (
    <div>
      {/* Existing code */}

      {/* Add CancelOrderModal component */}
      {cancelOrderId && (
        <CancelOrderModal
          orderId={cancelOrderId}
          orderStatus={selectedOrder?.STATUS || 'UNKNOWN'}
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          onSuccess={handleCancelSuccess}
        />
      )}

      {/* In your order list, add cancel button */}
      {orders.map((order) => (
        <tr key={order.ORDER_ID}>
          {/* ... existing cells ... */}
          <td>
            {['PENDING', 'PROCESSING'].includes(order.STATUS) && (
              <button
                onClick={() => handleCancelClick(order.ORDER_ID)}
                className="text-red-600 hover:text-red-900 font-semibold"
              >
                ❌ Hủy đơn
              </button>
            )}
          </td>
        </tr>
      ))}
    </div>
  );
}
```

---

### Step 4: Test the Feature

#### Test Case 1: Customer Cancels Order
```bash
# 1. Login as customer
# 2. Go to /account
# 3. Find an order with status "PENDING" or "PROCESSING"
# 4. Click "Hủy đơn" button
# 5. Select reason and confirm
# 6. Verify:
#    - Order status changed to CANCELLED
#    - Stock was restored
#    - Refund transaction created
```

#### Test Case 2: Verify Stock Recovery
```sql
-- Before cancellation
SELECT MASP, SOLUONGTON FROM SANPHAM WHERE MASP = 'SP001';

-- Cancel order
-- (through UI or API)

-- After cancellation
SELECT MASP, SOLUONGTON FROM SANPHAM WHERE MASP = 'SP001';
-- Stock should be higher by the cancelled quantity

-- Check audit trail
SELECT * FROM STOCK_HISTORY WHERE REFERENCE_ID = {orderId};
```

#### Test Case 3: Admin Force Cancel
```bash
# API call (as admin):
POST /api/admin/orders/123/cancel
{
  "reason": "Customer requested duplicate items",
  "sendNotification": true
}
```

---

## 🔄 BUSINESS LOGIC

### When Order is Cancelled:

```
1. ✅ Check order status (must be PENDING or PROCESSING)
2. ✅ Check authorization (customer can only cancel own orders)
3. ✅ Recover stock:
   - Get all items in ORDER_ITEMS
   - For each item: SOLUONGTON += quantity
   - Log in STOCK_HISTORY table
4. ✅ Create refund:
   - Create record in REFUND_TRANSACTIONS
   - Status: PENDING (automatic processing)
   - Determine refund method (original payment / wallet)
5. ✅ Update order:
   - STATUS = 'CANCELLED'
   - CANCELLED_BY = 'CUSTOMER' or 'ADMIN'
   - REFUND_STATUS = 'PENDING'
   - CANCELLATION_REASON = user input
6. ✅ Commit transaction atomically
```

### Stock Recovery Example:
```
Order #1001 contains:
  - Product SP001: 2 units @ 100,000 ₫
  - Product SP002: 1 unit @ 50,000 ₫

Before cancellation:
  SP001 stock: 5 units
  SP002 stock: 10 units

After cancellation:
  SP001 stock: 7 units (5 + 2)
  SP002 stock: 11 units (10 + 1)

STOCK_HISTORY records:
  - ID: 1, Action: RESTORE, SP001, +2 units, Order: 1001
  - ID: 2, Action: RESTORE, SP002, +1 unit, Order: 1001
```

### Refund Processing:
```
Refund Type: ORIGINAL_PAYMENT (for VNPay orders)
  → Money returned to customer's original payment source
  → Usually takes 3-5 business days

Refund Type: WALLET (for COD orders)
  → Money credited to customer account wallet
  → Instantly available
```

---

## ⚠️ IMPORTANT NOTES

### Cannot Cancel If:
- ❌ Order already `COMPLETED` or `CANCELLED`
- ❌ Order not owned by requesting user
- ❌ Too many days have passed (optional - add business rule)

### Refund Timeline:
- VNPay: 3-5 business days
- COD/Wallet: Immediate

### Edge Cases Handled:
- ✅ Partial cancellation (admin feature - separate)
- ✅ Duplicate cancellation attempts
- ✅ Race conditions with concurrent requests (transaction)
- ✅ Stock insufficient recovery (should not happen)

---

## 📊 API EXAMPLES

### Cancel Order (Customer)
```bash
curl -X POST http://localhost:5000/api/order/123/cancel \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "reason": "Tôi muốn hủy một số sản phẩm"
  }'

# Response:
{
  "success": true,
  "message": "Order cancelled successfully. Refund is being processed.",
  "data": {
    "orderId": 123,
    "status": "CANCELLED",
    "itemsRecovered": 2,
    "refund": {
      "refundId": 1001,
      "amount": 520000,
      "method": "ORIGINAL_PAYMENT",
      "status": "PENDING",
      "message": "Your refund of 520,000 ₫ will be processed within 3-5 business days"
    }
  }
}
```

### Get All Refunds (Admin)
```bash
curl -X GET "http://localhost:5000/api/admin/refunds?status=PENDING&page=1" \
  -H "Authorization: Bearer {admin_token}"

# Response:
{
  "success": true,
  "data": [
    {
      "REFUND_ID": 1001,
      "ORDER_ID": 123,
      "USER_ID": 456,
      "ORIGINAL_PAYMENT_METHOD": "VNPAY",
      "REFUND_AMOUNT": 520000,
      "REFUND_METHOD": "ORIGINAL_PAYMENT",
      "STATUS": "PENDING",
      "CREATED_AT": "2026-06-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

---

## 🔐 SECURITY CONSIDERATIONS

### Authentication & Authorization
```javascript
// ✅ Only authenticated users can cancel
router.post('/:orderId/cancel', verifyToken, ...);

// ✅ Users can only cancel their own orders
if (parseInt(order.USER_ID) !== parseInt(userId)) {
  return res.status(403).json({ message: 'You can only cancel your own orders' });
}

// ✅ Admins can cancel any order
router.post('/admin/:orderId/cancel', verifyToken, requireRole('ADMIN'), ...);
```

### Data Validation
```javascript
// ✅ Validate reason is not empty
if (!reason || reason.trim().length === 0) {
  return res.status(400).json({ message: 'Cancellation reason is required' });
}

// ✅ Validate order exists
if (!orderResult.rows || orderResult.rows.length === 0) {
  return res.status(404).json({ message: 'Order not found' });
}
```

### Atomic Transactions
```javascript
// ✅ All operations in one transaction
// If any step fails, entire transaction rolls back
await connection.commit();
// If error: await connection.rollback();
```

---

## 📈 MONITORING & ANALYTICS

### Track Cancellations:
```sql
SELECT 
  COUNT(*) as total_cancellations,
  SUM(REFUND_AMOUNT) as total_refund_amount,
  AVG(REFUND_AMOUNT) as avg_refund_amount
FROM REFUND_TRANSACTIONS
WHERE CREATED_AT >= TRUNC(SYSDATE, 'MM');
```

### Top Cancellation Reasons:
```sql
SELECT 
  CANCELLATION_REASON,
  COUNT(*) as frequency
FROM ORDERS
WHERE STATUS = 'CANCELLED' AND CREATED_AT >= TRUNC(SYSDATE, 'MM')
GROUP BY CANCELLATION_REASON
ORDER BY frequency DESC;
```

---

## 📚 FILES CREATED/MODIFIED

| File | Status | Purpose |
|------|--------|---------|
| `backend/database/order-cancellation-migration.sql` | ✅ NEW | Database schema |
| `backend/routes/order-cancellation.js` | ✅ NEW | API endpoints |
| `components/CancelOrderModal.tsx` | ✅ NEW | UI component |
| `lib/api.ts` | ✅ UPDATED | Added `cancelOrder()` method |
| `backend/server.js` | ✅ UPDATED | Registered routes |

---

## 🎯 NEXT STEPS

1. ✅ Execute database migration
2. ✅ Restart backend server
3. ✅ Integrate CancelOrderModal into account page
4. ✅ Test all scenarios
5. ✅ Deploy to production

---

## ❓ FAQ

**Q: Can customers cancel orders after payment?**  
A: Yes, refund will be processed automatically to original payment source.

**Q: How long does refund take?**  
A: VNPay: 3-5 days, COD/Wallet: Immediate

**Q: Can admin cancel any order?**  
A: Yes, admin can cancel any order (except already completed).

**Q: Is stock restored before or after refund?**  
A: Stock is restored immediately as part of the same transaction.

**Q: What if stock update fails during cancellation?**  
A: Entire transaction rolls back - order remains unchanged and customer is notified.

---

## 📞 SUPPORT

For issues or questions:
1. Check error logs in backend console
2. Verify database migration was successful
3. Ensure authentication tokens are valid
4. Test API endpoints directly with curl/Postman
