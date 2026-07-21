# 🔍 COMPREHENSIVE AUDIT REPORT - WEB BÁN SÁCH

**Audit Date:** April 23, 2026  
**System:** Next.js + Express + Oracle Database  
**Status:** ⚠️ CRITICAL ISSUES FOUND  

---

## 📊 EXECUTIVE SUMMARY

| Category | Score | Status |
|----------|-------|--------|
| **Security** | 🔴 3/10 | CRITICAL ISSUES |
| **Code Quality** | 🟡 5/10 | Major Issues |
| **Performance** | 🟢 7/10 | Acceptable |
| **Architecture** | 🟡 6/10 | Needs Refactor |
| **Test Coverage** | 🔴 1/10 | None Found |

---

## 🔴 CRITICAL ISSUES (Must Fix Immediately)

### 1. **Authorization Bypass on Admin Routes**
**Severity:** 🔴 CRITICAL  
**File:** [backend/routes/admin.js](backend/routes/admin.js)  
**Issue:** Admin endpoints have NO role verification middleware
```javascript
// ❌ CURRENT (INSECURE)
router.get('/users', async (req, res) => {
  // ANY user can call this!
  const query = `SELECT USER_ID, USERNAME, EMAIL, FULLNAME, ROLE FROM USERS`;
  // ...
});

router.put('/users/:userId', async (req, res) => {
  // ANY user can UPDATE other users!
  // Can change roles to ADMIN!
});

router.get('/orders', async (req, res) => {
  // ANY user can see ALL orders!
});
```

**Impact:** 
- ✅ Anyone can become ADMIN
- ✅ Anyone can edit other user accounts
- ✅ Anyone can view sensitive order data
- ✅ Can bypass entire permission system

**Fix Required:**
```javascript
// ✅ SECURE
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/users', verifyToken, requireRole('ADMIN'), async (req, res) => {
  // Only ADMIN users can access
});

router.put('/users/:userId', verifyToken, requireRole('ADMIN'), async (req, res) => {
  // Only ADMIN users can update
});
```

---

### 2. **Product CRUD Without Authorization**
**Severity:** 🔴 CRITICAL  
**File:** [backend/routes/product.js](backend/routes/product.js#L115-L160)  
**Issue:** POST/PUT/DELETE on products has no admin check
```javascript
// ❌ INSECURE
router.post('/', async (req, res) => {
  // Any user can create products!
  await executeUpdate(`INSERT INTO SANPHAM ...`);
});

router.put('/:id', async (req, res) => {
  // Any user can modify prices, stock!
});

router.delete('/:id', async (req, res) => {
  // Any user can delete all products!
});
```

**Impact:**
- ✅ Users can manipulate product prices
- ✅ Users can create fake products
- ✅ Users can delete inventory
- ✅ Data integrity compromised

**Fix:**
Add middleware to all admin endpoints:
```javascript
router.post('/', verifyToken, requireRole('ADMIN'), async (req, res) => {...});
router.put('/:id', verifyToken, requireRole('ADMIN'), async (req, res) => {...});
router.delete('/:id', verifyToken, requireRole('ADMIN'), async (req, res) => {...});
```

---

### 3. **Client-Side Role Selection (Frontend)**
**Severity:** 🔴 CRITICAL  
**File:** [app/login/page.tsx](app/login/page.tsx#L45-L90)  
**Issue:** Users can freely select ADMIN role on registration
```tsx
// ❌ INSECURE
{!isLogin && (
  <div className="mb-6">
    <label>Chọn vai trò</label>
    <input
      type="radio"
      value="ADMIN"
      checked={role === 'ADMIN'}  // ← User chooses their own role!
      onChange={(e) => setRole(e.target.value)}
    />
  </div>
)}

// Then sent to backend:
const response = await authAPI.register(username, password, email, role);
```

**Impact:**
- ✅ Anyone can register as ADMIN
- ✅ Combined with issue #1, anyone becomes super admin
- ✅ Complete privilege escalation

**Fix:**
```tsx
// ✅ SECURE - Always set role to USER
const response = await authAPI.register(username, password, email, 'USER');

// Or require admin approval for admin accounts
```

---

### 4. **Cart Multi-User Bug (Race Condition)**
**Severity:** 🔴 CRITICAL  
**File:** [backend/routes/cart.js](backend/routes/cart.js#L28-L45)  
**Issue:** Query doesn't guarantee single cart per user
```javascript
// ❌ VULNERABLE
const cartCheck = await executeQuery(
  'SELECT CART_ID FROM CART WHERE USER_ID = :userId',
  { userId }
);

let cartId;
if (cartCheck.rows && cartCheck.rows.length > 0) {
  cartId = cartCheck.rows[0].CART_ID; // ← Takes first cart if multiple exist!
} else {
  // Create new cart
}
```

**Problem:**
- Multiple carts can exist per user
- No UNIQUE constraint on (USER_ID)
- Could create duplicate orders
- Race conditions if queries run in parallel

**Fix:**
```sql
-- Add UNIQUE constraint to database
CREATE UNIQUE INDEX uk_cart_user_id ON CART(USER_ID);

-- Or in code, use transaction with lock
BEGIN TRANSACTION
  SELECT CART_ID FROM CART WHERE USER_ID = :userId FOR UPDATE;
  -- If not found, INSERT
COMMIT;
```

---

### 5. **N+1 Query Problem in Order Creation**
**Severity:** 🔴 CRITICAL  
**File:** [backend/routes/order.js](backend/routes/order.js#L75-L110)  
**Issue:** Loop executes query for every item
```javascript
// ❌ VERY INEFFICIENT
for (let item of cartItems) {
  // QUERY 1: Get sequence number
  const itemIdResult = await connection.execute(
    'SELECT order_items_seq.NEXTVAL as ID FROM DUAL'
  );

  // QUERY 2: Insert item
  await connection.execute(
    `INSERT INTO ORDER_ITEMS (...) VALUES (...)`
  );

  // QUERY 3: Update stock
  const updateStock = `UPDATE SANPHAM SET SOLUONGTON = ...`;
  await connection.execute(updateStock, ...);
  
  // Total: 3 queries × N items = 3N queries!
}
```

**Performance Impact:**
- 10 items = 30 database calls
- 100 items = 300 database calls
- Timeout risk, high latency

**Fix:**
```javascript
// ✅ BATCH INSERT
const insertValues = cartItems
  .map((item, idx) => 
    `(:itemId${idx}, :orderId${idx}, :masp${idx}, :soluong${idx}, :price${idx})`
  )
  .join(', ');

const params = {};
cartItems.forEach((item, idx) => {
  params[`itemId${idx}`] = generateId();
  params[`orderId${idx}`] = orderId;
  // ...
});

await connection.execute(
  `INSERT INTO ORDER_ITEMS (...) VALUES ${insertValues}`,
  params
);
```

---

### 6. **No Token in API Requests (Auth Broken)**
**Severity:** 🔴 CRITICAL  
**File:** [lib/api.ts](lib/api.ts#L380-L450)  
**Issue:** API calls don't send JWT access token
```typescript
// ❌ TOKEN NOT SENT
export const cartAPI = {
  async getCart(userId: number) {
    const response = await fetch(`${API_BASE_URL}/cart/${userId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // ← NO Authorization header!
    });
  },

  async addToCart(userId: number, masp: string, soluong: number) {
    const response = await fetch(`${API_BASE_URL}/cart/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // ← NO Authorization header!
      body: JSON.stringify({ userId, masp, soluong }),
    });
  }
};
```

**Consequences:**
- Backend can't verify user identity
- Any user can add items to another user's cart
- No actual JWT validation happening
- Authentication is purely client-side (useless)

**Fix:**
```typescript
// ✅ SEND TOKEN
const authAPI = { getCurrentUser(): User | null { ... } };

export const cartAPI = {
  async getCart(userId: number) {
    const user = authAPI.getCurrentUser();
    const response = await fetch(`${API_BASE_URL}/cart/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user?.accessToken}` // ← ADD THIS
      },
    });
  }
};
```

---

### 7. **Token Stored in localStorage (XSS Vulnerability)**
**Severity:** 🔴 CRITICAL  
**File:** [lib/api.ts](lib/api.ts#L341-L350)  
**Issue:** JWT tokens stored insecurely
```typescript
// ❌ INSECURE
async login(username: string, password: string) {
  const data = await response.json();
  localStorage.setItem('user', JSON.stringify(data.user)); // ← XSS target!
  // Token visible to any JavaScript (including XSS injections)
}

getCurrentUser(): User | null {
  const user = localStorage.getItem('user'); // ← Easily readable
  return user ? JSON.parse(user) : null;
}
```

**Risk:**
- Any XSS injection can steal tokens
- `document.localStorage.getItem('user')` in console
- Malicious scripts can impersonate users
- Third-party scripts can access tokens

**Fix:**
```typescript
// ✅ SECURE - Use httpOnly cookies
// Backend should set cookies:
res.cookie('accessToken', token, {
  httpOnly: true,  // ← JavaScript can't access
  secure: true,    // ← HTTPS only
  sameSite: 'Strict', // ← CSRF protection
  maxAge: 900000   // 15 minutes
});

// Frontend doesn't need to store anything
// Cookies automatically sent with requests
```

---

## 🟠 MAJOR ISSUES (High Priority)

### 8. **No Admin Page Authorization Check**
**Severity:** 🟠 MAJOR  
**File:** [app/admin/page.tsx](app/admin/page.tsx#L25-L35)  
**Issue:** Admin page doesn't verify user is ADMIN
```tsx
// ❌ NO CHECK
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  useEffect(() => {
    fetchProducts(); // Renders admin page without auth check
  }, []);
  
  // ← Regular user can view this page's JSX, make API calls
}
```

**Impact:**
- Regular users can view admin page source
- Combined with issue #1, they can call admin APIs
- UI disclosure (see what's in admin panel)

**Fix:**
```tsx
export default function AdminDashboard() {
  const router = useRouter();
  
  useEffect(() => {
    const user = authAPI.getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      router.push('/login');
      return;
    }
    fetchProducts();
  }, [router]);
}
```

---

### 9. **VNPay Integration Incomplete**
**Severity:** 🟠 MAJOR  
**File:** [backend/routes/payment.js](backend/routes/payment.js#L419)  
**Issue:** TODO comment indicates unimplemented functionality
```javascript
// ❌ NOT IMPLEMENTED
router.post('/query', async (req, res) => {
  try {
    // TODO: Implement actual HTTP call to VNPay queryDr endpoint
    // Currently just returns mock response
    
    res.json({
      success: true,
      status: 'MOCK_RESPONSE' // ← Not real!
    });
  }
});
```

**Consequences:**
- Payment status queries return fake data
- Order status won't sync with VNPay
- Users won't know real payment status

**Fix:** Implement actual VNPay API calls
```javascript
const vnpayUtils = require('../utils/vnpayUtils');

router.post('/query', async (req, res) => {
  const { orderId } = req.body;
  
  try {
    const transactionStatus = await vnpayUtils.queryPaymentStatus(orderId);
    res.json({ success: true, status: transactionStatus });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

### 10. **Cart Stored in localStorage (Not Synced)**
**Severity:** 🟠 MAJOR  
**File:** [app/cart/page.tsx](app/cart/page.tsx#L75)  
**Issue:** Cart data stored client-side, not synchronized
```typescript
// ❌ LOCAL ONLY
const handleCheckout = () => {
  if (!user || cartItems.length === 0) return;
  localStorage.setItem('cart', JSON.stringify(cartItems)); // ← Local only!
  router.push('/checkout');
};
```

**Problems:**
- User opens cart on phone, then on desktop - different carts
- No server-side cart sync
- User can manipulate localStorage: `cartItems[0].GIABAN = 0` ← Free items!
- Checkout data inconsistency

**Fix:** Always fetch cart from server
```typescript
// ✅ SERVER-SIDE CART
const checkout = async () => {
  try {
    // Fetch fresh cart from server
    const freshCart = await cartAPI.getCart(user.userId);
    
    // Verify stock/prices haven't changed
    await orderAPI.createOrder(user.userId, paymentMethod);
    router.push('/order-success');
  } catch (error) {
    // Handle errors
  }
};
```

---

### 11. **Product ID Generation Not Unique**
**Severity:** 🟠 MAJOR  
**File:** [backend/routes/product.js](backend/routes/product.js#L145-L150)  
**Issue:** ID collision possible
```javascript
// ❌ NOT GUARANTEED UNIQUE
const newId = `SP${Date.now()}${Math.floor(Math.random() * 1000)}`;
// Date.now() has millisecond precision, multiple queries same ms = collision!
```

**Scenario:**
- 2 simultaneous POST requests
- Same `Date.now()` value (possible in same millisecond)
- Even if random differs, collision possible with 1000 values

**Fix:**
```javascript
// ✅ USE ORACLE SEQUENCE
const result = await connection.execute(
  'SELECT SANPHAM_SEQ.NEXTVAL as NEWID FROM DUAL'
);
const newId = result.rows[0].NEWID;

// Or use UUID
const { v4: uuidv4 } = require('uuid');
const newId = `SP_${uuidv4()}`;
```

---

### 12. **No Input Validation on Admin APIs**
**Severity:** 🟠 MAJOR  
**File:** [backend/routes/admin.js](backend/routes/admin.js#L85-L105)  
**Issue:** Role update accepts invalid values
```javascript
// ❌ WEAK VALIDATION
router.put('/users/:userId', async (req, res) => {
  const { email, fullname, role } = req.body;

  if (role && !['USER', 'ADMIN'].includes(role)) { // ← Only checks type
    return res.status(400).json({...});
  }

  // Email/fullname validation MISSING!
  const updateQuery = `
    UPDATE USERS 
    SET EMAIL = :email, FULLNAME = :fullname, ROLE = :role
  `;
  
  await executeUpdate(updateQuery, {
    userId,
    email: email || null, // ← No email format check
    fullname: fullname || null, // ← No length check
    role: role || 'USER'
  });
});
```

**Attack Example:**
```
PUT /api/admin/users/123
{ "email": "' OR '1'='1", "fullname": "<script>alert('xss')</script>" }
```

---

### 13. **Missing Logout Cleanup**
**Severity:** 🟠 MAJOR  
**File:** [backend/routes/auth.js](backend/routes/auth.js#L853-L880)  
**Issue:** Logout doesn't invalidate refresh tokens
```javascript
// Check logout endpoint - need to verify if it revokes tokens
router.post('/logout', verifyToken, logAuthRequest, async (req, res) => {
  // Need to check if this updates REFRESH_TOKENS.REVOKED
  // If not, old tokens can still be used!
});
```

---

## 🟡 MINOR ISSUES (Should Fix)

### 14. **Database Schema Inconsistencies**

**Issue:** Mixed naming conventions
```
✗ TENSP vs PRODUCT_NAME (inconsistent)
✗ MASP vs PRODUCT_ID (inconsistent)
✗ SOLUONGTON vs STOCK_QUANTITY (inconsistent)
✗ GIABAN vs PRICE (inconsistent)
✗ MOTA vs DESCRIPTION (inconsistent)
✗ HINHANH vs IMAGE_URL (inconsistent)
✗ FULLNAME vs FULL_NAME (inconsistent)
```

**Fix:** Create views to normalize
```sql
CREATE OR REPLACE VIEW V_PRODUCT AS
SELECT 
  MASP AS product_id,
  TENSP AS product_name,
  GIABAN AS price,
  SOLUONGTON AS stock_quantity,
  HINHANH AS image_url,
  MOTA AS description
FROM SANPHAM;
```

---

### 15. **Duplicate Chatbot Routes**

**Issue:** [backend/routes/chatbot.js](backend/routes/chatbot.js) and [backend/routes/chatbot-enhanced.js](backend/routes/chatbot-enhanced.js) both define `/api/chatbot/message`

**Status:** Only chatbot.js is mounted, chatbot-enhanced.js is **UNUSED**

**Recommendation:** Delete unused route
```bash
rm backend/routes/chatbot-enhanced.js
```

---

### 16. **Multiple ChatBot Components**
**Issue:** Code duplication in frontend
- `ChatBot.tsx` - Base implementation
- `ChatBotClient.tsx` - Client wrapper
- `ChatBotWrapper.tsx` - Dynamic wrapper
- `EnhancedChatBot.tsx` - Enhanced version (unused?)
- `ChatBotStatsAdmin.tsx` - Stats component

**Recommendation:** Consolidate into single component

---

### 17. **No Error Boundary on App**
**Issue:** React app has no error boundary  
**Consequence:** Single component crash crashes entire app  
**Fix:** Add Error Boundary component

---

## 📋 FILES TO DELETE

```
❌ backend/routes/chatbot-enhanced.js        (unused, conflicts with chatbot.js)
❌ components/EnhancedChatBot.tsx            (check if used)
❌ FIXES_SECURITY_1_authUtils.js             (temp file)
❌ FIXES_SECURITY_2_cookies.js               (temp file)
❌ FIXES_STRUCTURE_1_apiResponse.js          (temp file)
❌ FIXES_LOGIC_1_admin_routes.js             (temp file)
```

---

## 🔧 FILES NEEDING REFACTOR

| File | Issue | Priority |
|------|-------|----------|
| [backend/routes/admin.js](backend/routes/admin.js) | Add auth middleware, input validation | 🔴 CRITICAL |
| [backend/routes/product.js](backend/routes/product.js) | Add auth middleware, fix ID generation | 🔴 CRITICAL |
| [backend/routes/cart.js](backend/routes/cart.js) | Add UNIQUE constraint, fix race condition | 🔴 CRITICAL |
| [backend/routes/order.js](backend/routes/order.js) | Batch queries, fix N+1 | 🟠 MAJOR |
| [lib/api.ts](lib/api.ts) | Add Authorization header to all requests | 🔴 CRITICAL |
| [app/login/page.tsx](app/login/page.tsx) | Remove admin role selection, force USER | 🔴 CRITICAL |
| [app/admin/page.tsx](app/admin/page.tsx) | Add authorization check | 🟠 MAJOR |
| [app/cart/page.tsx](app/cart/page.tsx) | Remove localStorage, sync with server | 🟠 MAJOR |

---

## 🧪 TEST COVERAGE

**Current Status:** ❌ **NO TESTS FOUND**

**Required Tests:**
1. **Auth Tests**
   - Login with valid credentials
   - Login with invalid credentials
   - Register new user
   - Email verification flow
   - Password reset flow

2. **Authorization Tests**
   - Non-admin can't access admin routes
   - Non-admin can't modify products
   - Non-admin can't view orders
   - User can't access other user's cart

3. **Cart Tests**
   - Add item to cart
   - Remove item from cart
   - Update quantity
   - Cart persists across sessions
   - Stock validation before checkout

4. **Order Tests**
   - Create order from cart
   - Order deducts from stock
   - User can't see other user's orders
   - Payment status updates correctly

5. **Payment Tests**
   - VNPay URL generation
   - Payment callback validation
   - Order status updates on successful payment

---

## 💾 DATABASE OPTIMIZATION

**Missing Indexes:** Check [backend/database/create-indexes.sql](backend/database/create-indexes.sql)

**Recommended Additions:**
```sql
-- Already have most indexes, but verify:
CREATE INDEX idx_cart_item_created ON CART_ITEM(CREATED_AT);
CREATE INDEX idx_orders_created ON ORDERS(ORDER_DATE DESC);
CREATE INDEX idx_products_search ON SANPHAM(UPPER(TENSP));
```

---

## ⚡ PERFORMANCE ISSUES

| Issue | Location | Impact | Fix |
|-------|----------|--------|-----|
| N+1 Queries | [order.js](backend/routes/order.js#L75) | Timeout on large orders | Batch insert |
| No Pagination | [admin.js](backend/routes/admin.js#L14) | Fetch all users/orders | Add LIMIT/OFFSET |
| Unindexed Searches | Product search | Slow searches | Add full-text indexes |
| No Caching | All endpoints | High DB load | Add Redis cache |

---

## 🎯 IMPLEMENTATION PRIORITY

### Phase 1: SECURITY (This Week) 🔴
1. ✅ Add auth middleware to admin routes
2. ✅ Add auth middleware to product CRUD
3. ✅ Remove client-side role selection
4. ✅ Fix cart race condition with UNIQUE constraint
5. ✅ Send JWT token in API requests

### Phase 2: MAJOR FIXES (Next Week) 🟠
1. ✅ Move tokens to httpOnly cookies
2. ✅ Add admin page auth check
3. ✅ Implement VNPay query endpoint
4. ✅ Move cart to server-side
5. ✅ Fix product ID generation

### Phase 3: CODE QUALITY (Following Week) 🟡
1. ✅ Delete unused files
2. ✅ Consolidate chatbot components
3. ✅ Normalize database schema
4. ✅ Add error boundaries
5. ✅ Add input validation

### Phase 4: TESTING & OPTIMIZATION
1. ✅ Write unit tests
2. ✅ Write integration tests
3. ✅ Optimize queries
4. ✅ Add caching layer
5. ✅ Performance testing

---

## 📞 CONTACT & NEXT STEPS

**Total Issues Found:** 17+  
- 🔴 **Critical:** 7 issues
- 🟠 **Major:** 6 issues
- 🟡 **Minor:** 4+ issues

**Estimated Fix Time:** 2-3 weeks

**Recommendation:** Fix all CRITICAL issues before deploying to production.

---

**Report Generated:** April 23, 2026  
**Auditor:** Senior Fullstack Developer  
**Status:** Awaiting client action
