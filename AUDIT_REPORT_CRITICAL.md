# 🔍 AUDIT TOÀN HỆ THỐNG WEB BÁN SÁCH
**Date:** April 22, 2026  
**Auditor:** Senior Fullstack Developer  
**Status:** ⚠️ CRITICAL ISSUES FOUND

---

## 📋 TÓM TẮT KIẾN TRÚC

### Thực Tế vs. Bạn Nêu:
| Aspect | Bạn Nêu | Thực Tế |
|--------|---------|---------|
| Backend | ASP.NET MVC | ✅ Node.js + Express |
| Frontend | ReactJS | ✅ Next.js 16 (React 19) |
| Database | Oracle | ✅ Oracle ✓ |
| Auth | Session/Token | ✅ JWT + Token Management ✓ |

**Framework Stack:**
- Frontend: Next.js 16.2.1, React 19.2.4, TypeScript 5, Tailwind CSS 4
- Backend: Node.js + Express 4.18.2, bcryptjs, jsonwebtoken 9.0.0, Oracle DB 6.0.0
- Database: Oracle SQL (custom SQL + sequences)

---

## 🚨 LỖI CRITICAL (Độ Ưu Tiên NGAY LẬP TỨC)

### 1. **SECURITY: Credentials Exposed in .env**
**File:** `backend/.env` (Line 1-20)  
**Severity:** 🔴 CRITICAL  

```javascript
// ❌ HIỆN TẠI - LỖI BẢO MẬT NGHIÊM TRỌNG
DB_PASSWORD=123456
VNPAY_TMN_CODE=TESTMERCHANT
VNPAY_SECRET_KEY=TESTKEY
VNPAY_HASH_SECRET=TESTKEY
```

**Vấn đề:**
- Credentials hard-coded trong `.env` file
- `.env` không nên commit vào git (kiểm tra `.gitignore`)
- VNPay test keys nên thay đổi trước production

**Fix Ngay:**
```bash
# 1. Xóa .env khỏi git
git rm --cached backend/.env
echo "backend/.env" >> .gitignore

# 2. Tạo .env.example
cp backend/.env backend/.env.example
# Xóa values thực tế từ .env.example

# 3. Cập nhật environment variables
# Chuyển sang environment management:
# - AWS Secrets Manager
# - Azure Key Vault
# - HashiCorp Vault
# - Hoặc environment variables từ deployment platform
```

---

### 2. **SECURITY: SQL Injection Vulnerability in Check Scripts**
**Files:**  
- `backend/check-user-id-type.js` (Line 6)
- `backend/check-orders-columns.js` (Line 6)
- `backend/check-users-columns.js` (Line 6)
- `backend/check-wishlist-columns.js` (Line 6)

**Severity:** 🔴 CRITICAL

```javascript
// ❌ HIỆN TẠI - SQL INJECTION RISK (Tuy không được dùng thường xuyên)
const result = await executeQuery(
  `SELECT COLUMN_NAME, DATA_TYPE FROM USER_TAB_COLUMNS 
   WHERE TABLE_NAME = 'USERS'`,  // ✅ Nhưng nên xóa script này
  {}
);
```

**Vấn đề:**
- Những script này chỉ chạy 1 lần setup nhưng vẫn nên xóa
- Dư thừa file

**Fix:**
```bash
# Xóa những file check/setup không cần:
rm backend/check-*.js
rm backend/cleanup-db.js
rm backend/fix-sequence.js
rm backend/create-payment-tables.js
```

---

### 3. **SECURITY: Default JWT Secret**
**File:** `backend/utils/authUtils.js` (Line 48, 62, 77, 89)  
**Severity:** 🔴 CRITICAL

```javascript
// ❌ LỖI - Default secret
const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const secret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';
```

**Fix:**
```javascript
// ✅ CẢI THIỆN
function getJWTSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  if (secret === 'your-secret-key-change-in-production') {
    throw new Error('JWT_SECRET must be changed from default value');
  }
  return secret;
}

function generateAccessToken(userId, email, role, expiresIn = 900) {
  const payload = { userId, email, role, type: 'access' };
  return jwt.sign(payload, getJWTSecret(), { expiresIn });
}
```

**Thêm vào .env.example:**
```
JWT_SECRET=your-super-secret-key-min-32-chars-here
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars-here
```

---

### 4. **SECURITY: Token Stored in localStorage (XSS Vulnerability)**
**Files:**  
- `components/LoginForm.tsx` (Line 43-44)
- `lib/authAPI.ts` (Line 90+)
- `components/RootLayoutContent.tsx` (Line 22)

**Severity:** 🔴 CRITICAL

```typescript
// ❌ HIỆN TẠI - XSS RISK
localStorage.setItem('accessToken', response.data.tokens.accessToken);
localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
localStorage.setItem('user', JSON.stringify(response.data.user));
```

**Vấn đề:**
- localStorage dễ bị XSS attack
- Nếu attacker inject script → lấy được token
- Best practice: Dùng httpOnly cookie

**Fix (Implement Secure Token Storage):**

```javascript
// backend/middleware/auth.js - Thêm middleware set cookie
function setSecureTokenCookie(req, res, accessToken, refreshToken) {
  // Access token: httpOnly, Secure, SameSite
  res.cookie('accessToken', accessToken, {
    httpOnly: true,        // ✅ Không access từ JavaScript
    secure: true,          // ✅ HTTPS only
    sameSite: 'strict',    // ✅ CSRF protection
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  // Refresh token: httpOnly, Secure, SameSite, Path restricted
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/auth/refresh' // Only send to refresh endpoint
  });
}
```

```typescript
// lib/authAPI.ts - Remove localStorage, use httpOnly cookies
class AuthAPI {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    // Cookies set by server (httpOnly)
    const response = await this.api.post('/auth/login', credentials);
    
    // Only store non-sensitive user info
    if (response.data.user) {
      sessionStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  }

  getAccessToken(): string | null {
    // Token comes from httpOnly cookie automatically
    return null; // Don't manage token here
  }
}
```

---

### 5. **SECURITY: Credentials in URL (Verification Link)**
**File:** `backend/routes/auth.js` (Line 133)  
**Severity:** 🟠 HIGH

```javascript
// ❌ HIỆN TẠI - Verification code in URL
const verificationLink = `${process.env.APP_URL}/verify-email?userId=${userId}&code=${verificationCode}`;
```

**Vấn đề:**
- Verification code lộ trong URL
- Nếu email forward → code bị leak
- Browser history lưu lại code

**Fix:**
```javascript
// ✅ CẢI THIỆN - Use token-based verification
const verificationToken = crypto.randomBytes(32).toString('hex');
const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

// Store hashed token in DB
await executeUpdate(
  `INSERT INTO EMAIL_VERIFICATIONS 
   (VERIFICATION_ID, USER_ID, TOKEN_HASH, EMAIL, EXPIRES_AT, CREATED_AT)
   VALUES (VERIFICATION_SEQ.NEXTVAL, :userId, :tokenHash, :email, 
           CURRENT_TIMESTAMP + INTERVAL '24' HOUR, CURRENT_TIMESTAMP)`,
  { userId, tokenHash: hashedToken, email: sanitizedEmail }
);

// Send link with token in body (POST) or short token
const verificationLink = `${process.env.APP_URL}/verify-email?token=${verificationToken}`;

// Frontend gửi POST request với token trong body
// Server hash token từ request + so sánh với DB
```

---

## 🟠 LỖI MAJOR (Phải Fix Trong Spprint Tiếp Theo)

### 6. **LOGIC: No Authorization Check in Admin Routes**
**File:** `backend/routes/admin.js` (Line 1-50)  
**Severity:** 🟠 MAJOR

```javascript
// ❌ HIỆN TẠI - Không check role
router.get('/users', async (req, res) => {
  try {
    // Any logged-in user can access admin endpoints!
```

**Fix:**
```javascript
const { verifyToken, requireRole } = require('../middleware/auth');

// ✅ CẢI THIỆN
router.get('/users', verifyToken, requireRole('ADMIN'), async (req, res) => {
  try {
    console.log(`[ADMIN] Fetching users (admin: ${req.user.email})`);
    // ... rest of code
});
```

---

### 7. **LOGIC: Race Condition in Cart Operations**
**File:** `backend/routes/cart.js` (Line 30-50)  
**Severity:** 🟠 MAJOR

```javascript
// ❌ HIỆN TẠI - Race condition
const cartCheck = await executeQuery(
  'SELECT CART_ID FROM CART WHERE USER_ID = :userId'
);

if (!cartCheck.rows || cartCheck.rows.length === 0) {
  // Multiple requests at same time → multiple carts created
  await executeUpdate(
    `INSERT INTO CART (CART_ID, USER_ID) VALUES (cart_seq.NEXTVAL, :userId)`,
    { userId }
  );
}
```

**Fix (Use Database Constraint):**
```sql
-- Add unique constraint in Oracle
ALTER TABLE CART ADD CONSTRAINT UK_CART_USER_ID UNIQUE (USER_ID);

-- Hoặc use INSERT IF NOT EXISTS pattern
INSERT INTO CART (CART_ID, USER_ID) 
SELECT cart_seq.NEXTVAL, :userId FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM CART WHERE USER_ID = :userId);
```

```javascript
// ✅ CẢI THIỆN PHÍA APPLICATION
async function getOrCreateCart(userId) {
  let connection = await getConnection();
  try {
    // Use transaction + lock
    await connection.execute('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
    
    let cartResult = await connection.execute(
      'SELECT CART_ID FROM CART WHERE USER_ID = :userId FOR UPDATE',
      { userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    let cartId;
    if (cartResult.rows.length === 0) {
      const cartInsert = await connection.execute(
        'INSERT INTO CART (CART_ID, USER_ID) VALUES (cart_seq.NEXTVAL, :userId)',
        { userId },
        { autoCommit: false }
      );
      
      cartResult = await connection.execute(
        'SELECT CART_ID FROM CART WHERE USER_ID = :userId',
        { userId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      cartId = cartResult.rows[0].CART_ID;
    } else {
      cartId = cartResult.rows[0].CART_ID;
    }

    await connection.commit();
    return cartId;
  } finally {
    if (connection) await connection.close();
  }
}
```

---

### 8. **LOGIC: Stock Management Issues**
**File:** `backend/routes/order.js` (Line 85-95)  
**Severity:** 🟠 MAJOR

```javascript
// ❌ LỖI - Stock không check kỹ trước
const product = productCheck.rows[0];
if (product.SOLUONGTON < soluong) {
  return res.status(400).json({
    success: false,
    message: `Not enough stock. Available: ${product.SOLUONGTON}`,
  });
}
// ... later, manual update
UPDATE SANPHAM SET SOLUONGTON = SOLUONGTON - :soluong WHERE MASP = :masp
```

**Vấn đề:**
- Check rồi update → race condition
- 2 orders có thể buy hết stock cùng lúc
- Không atomic transaction

**Fix:**
```sql
-- Trigger in Oracle để auto deduct stock
CREATE OR REPLACE TRIGGER TRG_UPDATE_STOCK
AFTER INSERT ON ORDER_ITEMS
FOR EACH ROW
BEGIN
  UPDATE SANPHAM 
  SET SOLUONGTON = SOLUONGTON - :NEW.SOLUONG 
  WHERE MASP = :NEW.MASP 
  AND SOLUONGTON >= :NEW.SOLUONG;  -- ✅ Check stock khi update
  
  IF SQL%ROWCOUNT = 0 THEN
    RAISE_APPLICATION_ERROR(-20001, 'Insufficient stock for product ' || :NEW.MASP);
  END IF;
END;
```

```javascript
// ✅ Backend: Rely on trigger, catch error
try {
  await connection.execute(
    `INSERT INTO ORDER_ITEMS (ITEM_ID, ORDER_ID, MASP, SOLUONG, PRICE)
     VALUES (:itemId, :orderId, :masp, :soluong, :price)`,
    { ... },
    { autoCommit: false }
  );
} catch (err) {
  if (err.message.includes('Insufficient stock')) {
    await connection.rollback();
    return res.status(400).json({
      success: false,
      message: 'Product out of stock'
    });
  }
  throw err;
}
```

---

### 9. **API: Inconsistent Error Responses**
**Files:** Multiple route files  
**Severity:** 🟠 MAJOR

```javascript
// ❌ Inconsistent responses
res.json({ success: false, message: 'Error' });              // 200 status
res.status(400).json({ success: false, message: 'Error' });  // 400 status
res.status(500).json({ success: false, ... });               // 500 status
throw new Error('message');                                  // Crashes without response
```

**Fix (Create Centralized Response Handler):**

```javascript
// backend/utils/apiResponse.js
class APIResponse {
  static success(data, message = 'Success', statusCode = 200) {
    return {
      statusCode,
      body: {
        success: true,
        message,
        data
      }
    };
  }

  static error(message, errors = null, statusCode = 400) {
    return {
      statusCode,
      body: {
        success: false,
        message,
        ...(errors && { errors })
      }
    };
  }

  static paginated(data, pagination, message = 'Success') {
    return {
      statusCode: 200,
      body: {
        success: true,
        message,
        data,
        pagination
      }
    };
  }
}

module.exports = APIResponse;
```

```javascript
// backend/routes/product.js
const APIResponse = require('../utils/apiResponse');

router.get('/', async (req, res) => {
  try {
    const result = await APIResponse.paginated(
      data.rows,
      { page, limit, total, pages },
      'Products fetched successfully'
    );
    res.status(result.statusCode).json(result.body);
  } catch (err) {
    const result = APIResponse.error(err.message, null, 500);
    res.status(result.statusCode).json(result.body);
  }
});
```

---

### 10. **FRONTEND: No Error Boundary**
**File:** `app/page.tsx`  
**Severity:** 🟠 MAJOR

```typescript
// ❌ HIỆN TẠI - Crash whole app on error
const fetchProducts = useCallback(async () => {
  try {
    const response = await productAPI.search(searchQuery);
    // If API fails → component crashes
  } catch (err: any) {
    setError(err.message);
  }
});
```

**Fix:**
```typescript
// ✅ CẢI THIỆN - Add Error Boundary
// app/error.tsx (Next.js 13+)
'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-gray-100'>
      <div className='bg-white p-8 rounded-lg shadow'>
        <h2 className='text-2xl font-bold text-red-600 mb-4'>
          Oops! Something went wrong
        </h2>
        <p className='text-gray-600 mb-6'>{error.message}</p>
        <button
          onClick={() => reset()}
          className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
        >
          Try again
        </button>
      </div>
    </div>
  );
}
```

---

## 🟡 LỖI MINOR (Nên Fix Để Chuẩn Hóa)

### 11. **CODE: Inconsistent Naming Conventions**
**Issue:** Mix of snake_case (SQL), camelCase (JS), PascalCase  

```javascript
// ❌ Inconsistent
MASP, TENSP, GIABAN, SOLUONGTON  // SQL columns
const { MASP } = product;         // JS destructuring
product.GIABAN                    // Mix uppercase-snake

// ✅ Nên
const { productId, productName, price, stockQuantity } = product;
// Hoặc map từ DB:
const mapProductFromDB = (row) => ({
  productId: row.MASP,
  productName: row.TENSP,
  price: row.GIABAN,
  stockQuantity: row.SOLUONGTON
});
```

---

### 12. **CODE: Missing Input Sanitization**
**Files:** `backend/routes/category.js`, `backend/routes/product.js`  

```javascript
// ❌ Partial sanitization only in auth
router.get('/search/query', async (req, res) => {
  const q = req.query.q?.trim();  // ✅ Trim
  // ❌ Missing sanitization for other routes
});
```

**Fix:**
```javascript
// Create utility function
function sanitizeQueryParam(param, maxLength = 100) {
  if (!param) return '';
  return String(param)
    .trim()
    .substring(0, maxLength)
    .replace(/[^\w\s-]/g, '');  // Remove special chars
}

// Use in all routes
router.get('/search/query', async (req, res) => {
  const q = sanitizeQueryParam(req.query.q);
  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Search keyword required'
    });
  }
  // ... continue
});
```

---

### 13. **API: Missing Rate Limiting on Non-Auth Routes**
**Files:** Product, Cart, Order routes  

```javascript
// ❌ Only auth routes have rate limiting
const loginLimiter = require('../utils/rateLimiter').loginLimiter;
router.post('/login', loginLimiter, ...);

// ❌ But product/cart/order endpoints unprotected
router.get('/product', ...);  // No rate limit
router.post('/cart/add', ...);  // No rate limit
```

**Fix:**
```javascript
// backend/utils/rateLimiter.js
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                    // 100 requests per window
  message: 'Too many requests, please try again later'
});

const strictLimiter = rateLimit({
  windowMs: 60 * 1000,         // 1 minute
  max: 30,                     // 30 requests per minute
  message: 'Too many requests from this IP'
});

module.exports = { apiLimiter, strictLimiter };

// backend/server.js
const { apiLimiter } = require('./utils/rateLimiter');
app.use('/api/', apiLimiter);  // Apply to all API routes
```

---

### 14. **DATABASE: Missing Indexes**
**Severity:** 🟡 Performance  

```sql
-- ❌ No indexes = Slow queries
SELECT * FROM ORDERS WHERE USER_ID = :userId;        -- ⚠️ Full table scan
SELECT * FROM CART_ITEM WHERE CART_ID = :cartId;    -- ⚠️ Full table scan
SELECT * FROM ORDER_ITEMS WHERE ORDER_ID = :orderId; -- ⚠️ Full table scan

-- ✅ Add indexes
CREATE INDEX IDX_ORDERS_USER_ID ON ORDERS(USER_ID);
CREATE INDEX IDX_ORDERS_STATUS ON ORDERS(STATUS);
CREATE INDEX IDX_ORDERS_DATE ON ORDERS(ORDER_DATE);
CREATE INDEX IDX_CART_ITEM_CART_ID ON CART_ITEM(CART_ID);
CREATE INDEX IDX_CART_ITEM_MASP ON CART_ITEM(MASP);
CREATE INDEX IDX_ORDER_ITEMS_ORDER_ID ON ORDER_ITEMS(ORDER_ID);
CREATE INDEX IDX_ORDER_ITEMS_MASP ON ORDER_ITEMS(MASP);
CREATE INDEX IDX_USERS_EMAIL ON USERS(LOWER(EMAIL));
CREATE INDEX IDX_USERS_USERNAME ON USERS(LOWER(USERNAME));
CREATE INDEX IDX_EMAIL_VERIFICATIONS_USER_ID ON EMAIL_VERIFICATIONS(USER_ID);
```

---

### 15. **FRONTEND: No Loading States Optimization**
**File:** `app/page.tsx`  

```typescript
// ❌ HIỆN TẠI
const [loading, setLoading] = useState(true);
const [searching, setSearching] = useState(false);
// Duplicate state for different operations

// ✅ CẢI THIỆN
const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'searching' | 'error'>('idle');
```

---

## 📦 DEAD CODE & UNUSED FILES

### Files to Delete:
```
backend/check-*.js              # 6 files - Not needed after initial setup
backend/cleanup-db.js
backend/fix-sequence.js
backend/create-payment-tables.js
backend/add-payment-method-column.js
backend/test-*.js              # 5 files - Use integration tests instead
backend/VNPAY-API-DOCS.js
backend/VNPAY-EXAMPLES.js
backend/*.sh                   # Bash scripts not needed
```

### Excessive Documentation:
```
CHATBOT_ENHANCED_GUIDE.md
CHATBOT_SETUP_GUIDE.md
CHATBOT_SYSTEM_COMPLETE.md
CHATBOT_SYSTEM_OVERVIEW.md
CHATBOT_IMPLEMENTATION_COMPLETE.md
CHATBOT_INTEGRATION_EXAMPLES.md
CHATBOT_QUICK_REFERENCE.md
CHATBOT_QUICK_SETUP.md
BOOK_RECOMMENDATION_*.md (6 files)
VOUCHER_*.md (2 files)
USER_PROFILE_*.md (2 files)
ORDER_CREATION_FIXES.md
PLACEHOLDER_AND_CART_FIXES.md
VNPAY_*.md (6 files)
QUICK_START_ADMIN.md
AUTH_QUICK_START.md
AUTH_SYSTEM_GUIDE.md
IMPLEMENTATION_SUMMARY*.md (2 files)
FIXES_AND_ENHANCEMENTS.md
```

**Recommendation:** Keep only `README.md` + one setup guide

---

## 🔧 REFACTORING ARCHITECTURE

### Current vs. Recommended Structure:

```
❌ HIỆN TẠI
backend/
├── routes/          # All logic mixed with routes
├── config/
├── middleware/
├── utils/
└── database/

✅ RECOMMENDED
backend/
├── routes/          # Only route definitions
├── controllers/     # Business logic
├── services/        # Database operations
├── models/          # Data models & schemas
├── middleware/
├── utils/
├── validation/      # Input validation
├── config/
├── database/        # Pool & migrations
├── exceptions/      # Custom error classes
└── constants/       # App constants
```

### Service Layer Example:

```javascript
// backend/controllers/product.js
router.get('/', async (req, res, next) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
    
    const result = await productService.getProducts(page, limit);
    res.json(APIResponse.paginated(result.data, result.pagination));
  } catch (err) {
    next(err);  // Pass to error handler
  }
});

// backend/services/productService.js
class ProductService {
  async getProducts(page, limit) {
    const offset = (page - 1) * limit;
    
    const [products, total] = await Promise.all([
      productRepository.getAll(offset, limit),
      productRepository.count()
    ]);

    return {
      data: products.map(this.mapToDTO),
      pagination: { page, limit, total, pages: Math.ceil(total/limit) }
    };
  }

  mapToDTO(row) {
    return {
      productId: row.MASP,
      productName: row.TENSP,
      price: row.GIABAN,
      stockQuantity: row.SOLUONGTON
    };
  }
}

// backend/repositories/productRepository.js
class ProductRepository {
  async getAll(offset, limit) {
    return await executeQuery(
      `SELECT * FROM SANPHAM ORDER BY TENSP 
       OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
      { offset, limit }
    );
  }
}
```

---

## 🧪 TESTING RECOMMENDATIONS

### 1. Unit Tests (Jest)
```javascript
// backend/__tests__/auth.test.js
describe('Authentication', () => {
  test('Register with valid credentials', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      username: 'testuser',
      password: 'SecurePass123!',
      fullName: 'Test User'
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.userId).toBeDefined();
  });

  test('Reject weak password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      username: 'testuser',
      password: 'weak'
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
```

### 2. Integration Tests
```javascript
// backend/__tests__/order.integration.test.js
describe('Order Flow', () => {
  test('Complete order creation flow', async () => {
    // 1. Login user
    const loginRes = await request(app).post('/api/auth/login').send({...});
    const token = loginRes.body.tokens.accessToken;

    // 2. Add to cart
    await request(app).post('/api/cart/add')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId, masp, soluong: 1 });

    // 3. Create order
    const orderRes = await request(app).post('/api/order/create')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId, paymentMethod: 'COD' });

    expect(orderRes.statusCode).toBe(200);
    expect(orderRes.body.orderId).toBeDefined();
  });
});
```

### 3. Selenium Tests (E2E)
```python
# tests/e2e_checkout.py
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

class TestCheckout:
    def test_complete_purchase_flow(self):
        driver = webdriver.Chrome()
        driver.get('http://localhost:3000')

        # Click product
        product = driver.find_element(By.CSS_SELECTOR, '[data-testid="product-item"]')
        product.click()

        # Add to cart
        add_btn = driver.find_element(By.CSS_SELECTOR, '[data-testid="add-to-cart"]')
        add_btn.click()

        # Proceed to checkout
        checkout_btn = driver.find_element(By.CSS_SELECTOR, '[data-testid="checkout"]')
        checkout_btn.click()

        # Verify payment page
        assert 'checkout' in driver.current_url
        driver.quit()
```

---

## 📊 PERFORMANCE ISSUES

### N+1 Query Problem
```javascript
// ❌ HIỆN TẠI - N+1 queries
const orders = await executeQuery('SELECT * FROM ORDERS WHERE USER_ID = ?');
for (let order of orders.rows) {
  const items = await executeQuery('SELECT * FROM ORDER_ITEMS WHERE ORDER_ID = ?', [order.ORDER_ID]);
  order.items = items.rows;  // N database calls!
}

// ✅ CẢI THIỆN - Single query
const result = await executeQuery(`
  SELECT 
    o.ORDER_ID, o.STATUS, o.TOTAL_AMOUNT,
    oi.ITEM_ID, oi.MASP, oi.SOLUONG, oi.PRICE
  FROM ORDERS o
  LEFT JOIN ORDER_ITEMS oi ON o.ORDER_ID = oi.ORDER_ID
  WHERE o.USER_ID = ?
`);

// Map to objects
const ordersMap = {};
result.rows.forEach(row => {
  if (!ordersMap[row.ORDER_ID]) {
    ordersMap[row.ORDER_ID] = { ...order, items: [] };
  }
  ordersMap[row.ORDER_ID].items.push(orderItem);
});
```

### Missing Pagination
```javascript
// ❌ HIỆN TẠI - No pagination
SELECT * FROM ORDERS;  // ⚠️ Could return 1M rows!

// ✅ CẢI THIỆN
SELECT * FROM ORDERS 
OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY;  // 20 rows max
```

---

## ✅ RECOMMENDED IMMEDIATE ACTIONS

### Priority 1 (This Week):
- [ ] Remove `.env` from git + generate new secrets
- [ ] Fix token storage (httpOnly cookies)
- [ ] Add authorization check to admin routes
- [ ] Remove credentials from verification links

### Priority 2 (Sprint 1):
- [ ] Delete dead code & setup scripts
- [ ] Implement Service layer
- [ ] Add database indexes
- [ ] Fix race conditions in cart

### Priority 3 (Sprint 2):
- [ ] Implement comprehensive testing
- [ ] Add Error Boundary component
- [ ] Standardize API responses
- [ ] Implement logging system

---

## 📝 REFERENCE FILES FOR FIXES

**Security:**
- `backend/utils/authUtils.js` - JWT secret issue
- `backend/.env` - Exposed credentials
- `backend/routes/auth.js` - Verification link issue
- `lib/authAPI.ts` - localStorage security

**Logic:**
- `backend/routes/cart.js` - Race condition
- `backend/routes/order.js` - Stock management

**Code Quality:**
- All `backend/routes/*.js` - Inconsistent responses
- `backend/middleware/index.js` - Add CORS security headers

