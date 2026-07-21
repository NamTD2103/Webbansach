# 🚀 Quick Start - Authentication System

> Hướng dẫn nhanh bắt đầu hệ thống xác thực production-ready

## 5 Phút Setup

### Bước 1: Backend Setup (2 phút)

```bash
# 1. Cài dependencies
cd backend
npm install

# 2. Khởi tạo database
node init-auth-system.js

# 3. Cấu hình environment
cp .env.example .env

# Sửa .env:
# - DB_USER, DB_PASSWORD, DB_CONNECT_STRING
# - JWT_SECRET (generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
# - SMTP_* (email config)

# 4. Chạy backend
npm run dev
# Backend running on http://localhost:5000
```

### Bước 2: Frontend Setup (2 phút)

```bash
# 1. Cài dependencies (nếu chưa có axios)
npm install axios

# 2. Cấu hình environment
cp .env.example .env.local

# Sửa .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:5000

# 3. Chạy frontend
npm run dev
# Frontend running on http://localhost:3000
```

### Bước 3: Test System (1 phút)

1. Mở http://localhost:3000/login
2. Click "Đăng ký"
3. Nhập thông tin:
   - Email: `test@example.com`
   - Username: `testuser`
   - Password: `TestPass123` (8+ chars, uppercase, lowercase, number)
   - Full Name: `Test User`
4. Click "Create Account"
5. Check email inbox for verification code
6. Enter verification code → Account activated
7. Login with credentials

---

## File Structure

```
Backend Created:
├── routes/auth.js                    ← All auth endpoints
├── middleware/auth.js                ← JWT verification
├── utils/authUtils.js                ← Bcrypt, JWT
├── utils/emailService.js             ← Email sending
├── utils/validators.js               ← Input validation
├── utils/rateLimiter.js              ← Rate limiting
├── init-auth-system.js               ← Database setup
└── .env.example                      ← Config template

Frontend Created:
├── components/LoginForm.tsx          ← Login UI
├── components/RegisterForm.tsx       ← Register UI
├── components/ForgotPasswordForm.tsx ← Password reset UI
├── lib/authAPI.ts                    ← API client
└── .env.example                      ← Config template
```

---

## Key Features

| Feature | Status | Details |
|---------|--------|---------|
| Register | ✅ | Email + password, validation, email verification |
| Login | ✅ | JWT tokens, remember me, rate limiting |
| Email Verification | ✅ | 6-digit code, 24-hour expiry |
| Password Reset | ✅ | Secure link, 15-minute expiry |
| Token Refresh | ✅ | Auto-refresh, token rotation |
| Account Lockout | ✅ | 5 failed attempts → 30 min lock |
| Rate Limiting | ✅ | Per-IP and per-email limits |
| Security Headers | ✅ | XSS, CSRF, clickjacking protection |

---

## API Endpoints

```
POST   /api/auth/register                 Register new user
POST   /api/auth/login                    Login user
POST   /api/auth/verify-email             Verify email
POST   /api/auth/resend-verification      Resend verification code
POST   /api/auth/forgot-password          Request password reset
POST   /api/auth/reset-password           Reset password
POST   /api/auth/refresh-token            Refresh access token
POST   /api/auth/logout                   Logout user
GET    /api/auth/profile                  Get user profile (protected)
PUT    /api/auth/profile                  Update profile (protected)
POST   /api/auth/change-password          Change password (protected)
```

---

## Using AuthAPI Client

```typescript
import { authAPI } from '@/lib/authAPI';

// Login
const loginResult = await authAPI.login({
  email: 'user@example.com',
  password: 'Password123!',
  rememberMe: true,
});

// Check if authenticated
if (authAPI.isAuthenticated()) {
  const user = authAPI.getUser();
  console.log(user); // { userId, email, username, fullName, role }
}

// Get profile
const profile = await authAPI.getProfile();

// Logout
await authAPI.logout();
```

---

## Common Tasks

### 1. Protect a Page

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/authAPI';

export default function ProtectedPage() {
  const router = useRouter();

  useEffect(() => {
    if (!authAPI.isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  return <div>Protected Content</div>;
}
```

### 2. Add Auth Header to Requests

```typescript
const token = localStorage.getItem('accessToken');
const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
};
```

### 3. Handle Token Expiry

```typescript
// AuthAPI automatically handles this!
// - Expired token → auto-refresh
// - Refresh fails → redirect to login
// No manual intervention needed
```

### 4. Custom Logout

```typescript
async function handleLogout() {
  await authAPI.logout();
  router.push('/login');
}
```

---

## Database Tables Created

| Table | Purpose |
|-------|---------|
| USERS | User accounts |
| REFRESH_TOKENS | Token rotation |
| EMAIL_VERIFICATIONS | Email verification codes |
| PHONE_VERIFICATIONS | OTP verification |
| PASSWORD_RESETS | Password reset tokens |
| LOGIN_ATTEMPTS | Failed login tracking |

---

## Password Requirements

✅ Minimum 8 characters  
✅ At least 1 uppercase letter (A-Z)  
✅ At least 1 lowercase letter (a-z)  
✅ At least 1 number (0-9)  

**Example Valid Passwords:**
- `MyPassword123`
- `SecurePass456`
- `Test@Pass789`

---

## Email Setup

### Option 1: Gmail (Easiest)

1. Enable 2-factor authentication
2. Create App Password: https://myaccount.google.com/apppasswords
3. Copy password (16 characters)
4. Update `.env`:
   ```
   EMAIL_PROVIDER=gmail
   GMAIL_EMAIL=your-email@gmail.com
   GMAIL_PASSWORD=your-app-password
   ```

### Option 2: Custom SMTP

```
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yourdomain.com
SMTP_PASSWORD=your-password
```

---

## Security Best Practices

- ✅ Never commit `.env` file
- ✅ Use strong JWT secrets (32+ characters)
- ✅ Enable HTTPS in production
- ✅ Set secure CORS origins
- ✅ Update dependencies regularly
- ✅ Monitor failed login attempts
- ✅ Implement rate limiting
- ✅ Log authentication events

---

## Troubleshooting

### Cannot register: "Email already exists"
→ Email is already registered. Use different email or reset password.

### Login fails: "Too many attempts"
→ Account locked for 30 minutes after 5 failed attempts.

### Email not received
→ Check spam folder, verify SMTP config, check logs.

### Verification code expired
→ Click "Resend Code" button (code valid 24 hours).

### Token not working
→ Token expires in 15 minutes. System auto-refreshes or login again.

---

## Next Steps

1. ✅ Test all auth flows
2. ✅ Configure production email
3. ✅ Set strong JWT secrets
4. ✅ Review security settings
5. ✅ Deploy to production
6. ✅ Monitor logs/errors
7. ✅ Implement 2FA (optional)
8. ✅ Add OAuth (Google, Facebook)

---

## Need Help?

📖 Read: [AUTH_SYSTEM_GUIDE.md](./AUTH_SYSTEM_GUIDE.md)  
🐛 Check: Terminal logs for errors  
📧 Email: Setup verification  
💾 Database: Check USERS table exists  

---

**System Ready to Use!** 🎉
