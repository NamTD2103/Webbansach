# 🔐 Production-Grade Authentication System

> Hệ thống xác thực cấp production cho website bán sách với Node.js + Next.js + Oracle DB

## 📋 Mục lục

1. [Tổng quan](#tổng-quan)
2. [Architecture](#architecture)
3. [Installation](#installation)
4. [Database Schema](#database-schema)
5. [API Documentation](#api-documentation)
6. [Frontend Integration](#frontend-integration)
7. [Security Features](#security-features)
8. [Configuration](#configuration)
9. [Troubleshooting](#troubleshooting)

---

## Tổng quan

Hệ thống auth production-ready với các tính năng:

✅ **Đăng ký (Register)**
- Email + password
- Email verification
- Password validation (8+ chars, uppercase, lowercase, numbers)
- Spam protection (rate limiting)

✅ **Đăng nhập (Login)**
- Email/username + password
- JWT tokens (access + refresh)
- Remember me (30 days)
- Failed login lockout (5 attempts → 30 min lock)
- Account status tracking

✅ **Quên mật khẩu**
- Reset link via email
- Token expiry (15 minutes)
- Secure password reset flow

✅ **Bảo mật**
- Bcrypt password hashing
- JWT token rotation
- Rate limiting
- SQL injection prevention
- XSS protection
- CSRF validation
- Secure headers

✅ **Advanced**
- Email verification workflow
- Phone verification (OTP)
- Account lockout mechanism
- Login attempt logging
- Refresh token revocation

---

## Architecture

### System Flow Diagram

```
┌─────────────────┐
│  Frontend       │
│  (Next.js)      │
└────────┬────────┘
         │
         ▼
    ┌────────────────────────────────┐
    │   API Gateway / Rate Limiter   │
    └────────┬─────────────────────────┘
             │
             ▼
    ┌────────────────────────────────┐
    │   Auth Routes (Express)        │
    │  - /api/auth/register          │
    │  - /api/auth/login             │
    │  - /api/auth/verify-email      │
    │  - /api/auth/refresh-token     │
    │  - /api/auth/reset-password    │
    └────────┬─────────────────────────┘
             │
             ▼
    ┌────────────────────────────────┐
    │   Auth Utilities               │
    │  - authUtils.js (JWT, bcrypt)  │
    │  - emailService.js             │
    │  - validators.js               │
    │  - middleware/auth.js          │
    └────────┬─────────────────────────┘
             │
             ▼
    ┌────────────────────────────────┐
    │   Oracle Database              │
    │  - USERS                       │
    │  - REFRESH_TOKENS              │
    │  - EMAIL_VERIFICATIONS         │
    │  - PASSWORD_RESETS             │
    │  - LOGIN_ATTEMPTS              │
    │  - PHONE_VERIFICATIONS         │
    └────────────────────────────────┘
```

### Component Structure

```
Backend:
├── routes/
│   └── auth.js                 (All auth endpoints)
├── middleware/
│   └── auth.js                 (JWT verification, roles, etc)
├── utils/
│   ├── authUtils.js            (Bcrypt, JWT operations)
│   ├── emailService.js         (Email sending)
│   ├── validators.js           (Input validation)
│   └── rateLimiter.js          (Rate limiting)
├── config/
│   └── db.js                   (Oracle connection)
└── init-auth-system.js         (Database initialization)

Frontend:
├── components/
│   ├── LoginForm.tsx           (Login UI)
│   ├── RegisterForm.tsx        (Register UI)
│   └── ForgotPasswordForm.tsx  (Password reset UI)
├── lib/
│   └── authAPI.ts              (Axios client with token management)
└── app/
    ├── login/
    ├── forgot-password/
    └── reset-password/
```

---

## Installation

### 1. Backend Setup

**Step 1: Install Dependencies**
```bash
cd backend
npm install
```

**Step 2: Initialize Database**
```bash
node init-auth-system.js
```

Điều này sẽ:
- Tạo bảng USERS
- Tạo bảng REFRESH_TOKENS
- Tạo bảng EMAIL_VERIFICATIONS
- Tạo bảng PHONE_VERIFICATIONS
- Tạo bảng PASSWORD_RESETS
- Tạo bảng LOGIN_ATTEMPTS
- Tạo sequences và indexes

**Step 3: Configure Environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
```
# Database
DB_USER=system
DB_PASSWORD=123456
DB_CONNECT_STRING=localhost:1521/orcl21pdb1

# JWT
JWT_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key

# Email
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# App
APP_URL=http://localhost:3000
APP_NAME=CloudyInSouth
```

**Step 4: Start Backend**
```bash
npm run dev
```

### 2. Frontend Setup

**Step 1: Install Dependencies**
```bash
npm install axios
```

**Step 2: Configure Environment**
```bash
cp .env.example .env.local
# Edit with your API URL
```

**Step 3: Update Login Page**
Update `app/login/page.tsx` to use new components:

```tsx
'use client';

import { useState } from 'react';
import LoginForm from '@/components/LoginForm';
import RegisterForm from '@/components/RegisterForm';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-4 font-semibold transition ${
                isLogin
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              👤 Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-4 font-semibold transition ${
                !isLogin
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📝 Register
            </button>
          </div>

          <div className="p-6">
            {isLogin ? (
              <LoginForm />
            ) : (
              <RegisterForm onSuccess={() => setIsLogin(true)} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Create Protected Pages**

Create `app/account/page.tsx`:
```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/authAPI';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authAPI.isAuthenticated()) {
      router.push('/login');
      return;
    }

    setUser(authAPI.getUser());
    setLoading(false);
  }, [router]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">My Account</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p><strong>Name:</strong> {user?.fullName}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Role:</strong> {user?.role}</p>
      </div>
    </div>
  );
}
```

---

## Database Schema

### USERS Table
```sql
CREATE TABLE USERS (
  USER_ID NUMBER PRIMARY KEY,
  EMAIL VARCHAR2(255) NOT NULL UNIQUE,
  USERNAME VARCHAR2(100) NOT NULL UNIQUE,
  PASSWORD_HASH VARCHAR2(500) NOT NULL,
  PHONE VARCHAR2(20),
  FULL_NAME VARCHAR2(200),
  STATUS VARCHAR2(50) DEFAULT 'PENDING',        -- PENDING, ACTIVE, BLOCKED
  EMAIL_VERIFIED NUMBER(1) DEFAULT 0,           -- 0=false, 1=true
  PHONE_VERIFIED NUMBER(1) DEFAULT 0,
  ACCOUNT_LOCKED NUMBER(1) DEFAULT 0,
  LOCKED_UNTIL TIMESTAMP,
  FAILED_LOGIN_ATTEMPTS NUMBER DEFAULT 0,
  LAST_LOGIN TIMESTAMP,
  LAST_PASSWORD_CHANGE TIMESTAMP,
  CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ROLE VARCHAR2(50) DEFAULT 'USER'              -- USER, ADMIN
);
```

### REFRESH_TOKENS Table
```sql
CREATE TABLE REFRESH_TOKENS (
  TOKEN_ID NUMBER PRIMARY KEY,
  USER_ID NUMBER NOT NULL,
  REFRESH_TOKEN VARCHAR2(1000) NOT NULL UNIQUE,
  ACCESS_TOKEN_HASH VARCHAR2(500),
  EXPIRES_AT TIMESTAMP NOT NULL,
  IS_REVOKED NUMBER(1) DEFAULT 0,
  DEVICE_INFO VARCHAR2(500),
  IP_ADDRESS VARCHAR2(45),
  USER_AGENT VARCHAR2(500),
  CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  LAST_USED_AT TIMESTAMP,
  FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID) ON DELETE CASCADE
);
```

### EMAIL_VERIFICATIONS Table
```sql
CREATE TABLE EMAIL_VERIFICATIONS (
  VERIFICATION_ID NUMBER PRIMARY KEY,
  USER_ID NUMBER NOT NULL,
  VERIFICATION_CODE VARCHAR2(100) NOT NULL,
  EMAIL VARCHAR2(255) NOT NULL,
  EXPIRES_AT TIMESTAMP NOT NULL,
  IS_VERIFIED NUMBER(1) DEFAULT 0,
  VERIFIED_AT TIMESTAMP,
  ATTEMPTS NUMBER DEFAULT 0,
  CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID) ON DELETE CASCADE
);
```

### PASSWORD_RESETS Table
```sql
CREATE TABLE PASSWORD_RESETS (
  RESET_ID NUMBER PRIMARY KEY,
  USER_ID NUMBER NOT NULL,
  RESET_TOKEN VARCHAR2(500) NOT NULL UNIQUE,
  EMAIL VARCHAR2(255) NOT NULL,
  EXPIRES_AT TIMESTAMP NOT NULL,
  IS_USED NUMBER(1) DEFAULT 0,
  USED_AT TIMESTAMP,
  CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID) ON DELETE CASCADE
);
```

### LOGIN_ATTEMPTS Table
```sql
CREATE TABLE LOGIN_ATTEMPTS (
  ATTEMPT_ID NUMBER PRIMARY KEY,
  USER_ID NUMBER,
  EMAIL VARCHAR2(255),
  IP_ADDRESS VARCHAR2(45),
  IS_SUCCESSFUL NUMBER(1) DEFAULT 0,
  FAILURE_REASON VARCHAR2(255),
  ATTEMPTED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID) ON DELETE CASCADE
);
```

---

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Headers
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

---

## ✅ Đăng ký (Register)

### Endpoint
```
POST /auth/register
```

### Request
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "Password123!",
  "fullName": "Full Name",
  "phone": "0123456789"
}
```

### Response (Success)
```json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "userId": 1,
  "email": "user@example.com"
}
```

### Response (Error)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": "Invalid email format",
    "password": [
      "Password must be at least 8 characters long",
      "Password must contain at least one uppercase letter"
    ]
  }
}
```

---

## ✅ Email Verification

### Endpoint
```
POST /auth/verify-email
```

### Request
```json
{
  "userId": 1,
  "verificationCode": "123456"
}
```

### Response
```json
{
  "success": true,
  "message": "Email verified successfully. Your account is now active."
}
```

---

## ✅ Đăng nhập (Login)

### Endpoint
```
POST /auth/login
```

### Request
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "rememberMe": true
}
```

### Response (Success)
```json
{
  "success": true,
  "message": "Login successful",
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  },
  "user": {
    "userId": 1,
    "email": "user@example.com",
    "username": "username",
    "fullName": "Full Name",
    "role": "USER"
  }
}
```

---

## ✅ Refresh Token

### Endpoint
```
POST /auth/refresh-token
```

### Request
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Response
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

---

## ✅ Quên Mật Khẩu

### Endpoint
```
POST /auth/forgot-password
```

### Request
```json
{
  "email": "user@example.com"
}
```

### Response
```json
{
  "success": true,
  "message": "If the email exists, a password reset link has been sent."
}
```

---

## ✅ Reset Password

### Endpoint
```
POST /auth/reset-password
```

### Request
```json
{
  "resetToken": "abc123def456...",
  "newPassword": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

### Response
```json
{
  "success": true,
  "message": "Password reset successful. You can now login with your new password."
}
```

---

## ✅ Get Profile

### Endpoint
```
GET /auth/profile
Authorization: Bearer {accessToken}
```

### Response
```json
{
  "success": true,
  "user": {
    "userId": 1,
    "email": "user@example.com",
    "username": "username",
    "fullName": "Full Name",
    "phone": "0123456789",
    "role": "USER",
    "status": "ACTIVE",
    "emailVerified": true,
    "lastLogin": "2024-04-21T10:00:00Z",
    "createdAt": "2024-04-20T15:00:00Z"
  }
}
```

---

## ✅ Logout

### Endpoint
```
POST /auth/logout
Authorization: Bearer {accessToken}
```

### Request
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Response
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## Frontend Integration

### Using AuthAPI Client

```tsx
import { authAPI } from '@/lib/authAPI';

// Register
await authAPI.register({
  email: 'user@example.com',
  username: 'username',
  password: 'Password123!',
});

// Login
await authAPI.login({
  email: 'user@example.com',
  password: 'Password123!',
  rememberMe: true,
});

// Verify Email
await authAPI.verifyEmail({
  userId: 1,
  verificationCode: '123456',
});

// Get Profile
const profile = await authAPI.getProfile();

// Update Profile
await authAPI.updateProfile({
  fullName: 'New Name',
  phone: '0123456789',
});

// Change Password
await authAPI.changePassword({
  currentPassword: 'OldPassword123!',
  newPassword: 'NewPassword123!',
  confirmPassword: 'NewPassword123!',
});

// Logout
await authAPI.logout();

// Check Authentication
if (authAPI.isAuthenticated()) {
  const user = authAPI.getUser();
}
```

---

## Security Features

### 🔒 Password Security
- **Bcryptjs**: Password hashing with salt (10 rounds)
- **Validation**: 8+ chars, uppercase, lowercase, numbers
- **Storage**: Never store plaintext passwords

### 🔐 JWT Security
- **Access Token**: 15 minutes expiry
- **Refresh Token**: 7 days expiry (30 days with "Remember Me")
- **Token Rotation**: Old token revoked on refresh
- **Secure Signing**: HMAC-SHA256

### 🛡️ Attack Prevention
- **SQL Injection**: Parameterized queries
- **XSS**: Input sanitization, output escaping
- **CSRF**: Token validation middleware
- **Brute Force**: Rate limiting + account lockout
- **Email Spam**: Registration rate limit (3 per hour per IP)

### 🔑 Rate Limiting
| Operation | Limit | Window |
|-----------|-------|--------|
| Login | 5 attempts | 15 minutes |
| Register | 3 attempts | 1 hour |
| Password Reset | 3 requests | 1 hour |
| Email Verification | 5 resends | 1 hour |

### 📧 Email Verification
- 6-digit verification code
- 24-hour expiry
- Max 5 failed attempts per verification
- HTML email template with branding

### 🚫 Account Lockout
- Locked after 5 failed login attempts
- Auto-unlock after 30 minutes
- Failed attempts logged for audit

---

## Configuration

### JWT Configuration

```typescript
// Generate strong secrets:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

// Set in .env:
JWT_SECRET=your-generated-secret-here
JWT_REFRESH_SECRET=your-generated-refresh-secret-here
```

### Email Configuration

**Option 1: Gmail**
```
EMAIL_PROVIDER=gmail
GMAIL_EMAIL=your-email@gmail.com
GMAIL_PASSWORD=your-app-password
```

**Option 2: Custom SMTP**
```
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yourdomain.com
SMTP_PASSWORD=your-password
```

### CORS Configuration
```
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

---

## Troubleshooting

### Issue: "Email sending failed"

**Solution:**
1. Check email configuration in `.env`
2. For Gmail: Use App Password, not regular password
3. Verify SMTP credentials
4. Check firewall/network access to SMTP server

### Issue: "Invalid token"

**Solution:**
1. Token may have expired (15 min)
2. Use refresh token to get new access token
3. Check JWT_SECRET matches between requests

### Issue: "Account locked"

**Solution:**
1. Account locks after 5 failed login attempts
2. Automatically unlocks after 30 minutes
3. Or admin can manually unlock in database

### Issue: "Email verification expired"

**Solution:**
1. Verification code expires after 24 hours
2. Click "Resend Code" button
3. Check spam folder

### Issue: Database connection error

**Solution:**
1. Verify Oracle is running
2. Check DB credentials in `.env`
3. Test connection: `sqlplus system/password@localhost:1521/orcl21pdb1`

---

## Production Checklist

- [ ] Update JWT_SECRET with strong random string
- [ ] Update JWT_REFRESH_SECRET with strong random string
- [ ] Configure production email provider
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS
- [ ] Configure proper CORS origins
- [ ] Set up database backups
- [ ] Configure SSL for Oracle connection
- [ ] Set up monitoring/logging
- [ ] Review rate limiting settings
- [ ] Test email notifications
- [ ] Load test the system
- [ ] Security audit
- [ ] Implement 2FA (optional)

---

## Additional Resources

- [Bcryptjs Documentation](https://github.com/dcodeIO/bcrypt.js)
- [JWT Handbook](https://auth0.com/resources/ebooks/jwt-handbook)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

## Support

For issues or questions, please:
1. Check the Troubleshooting section
2. Review logs in console
3. Check Database schema
4. Verify environment configuration

---

**Last Updated:** April 21, 2024
**Version:** 1.0.0
