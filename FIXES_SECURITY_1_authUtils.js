/**
 * SECURITY FIX #1: JWT Secret Validation
 * File: backend/utils/authUtils.js
 * Replace the entire file with this version
 */

const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * ✅ IMPROVED: Validate JWT secrets on startup
 */
function validateJWTSecrets() {
  const accessSecret = process.env.JWT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!accessSecret) {
    throw new Error('❌ CRITICAL: JWT_SECRET environment variable is not set');
  }
  if (!refreshSecret) {
    throw new Error('❌ CRITICAL: JWT_REFRESH_SECRET environment variable is not set');
  }

  const defaultSecrets = ['your-secret-key-change-in-production', 'your-refresh-secret-key-change-in-production'];
  
  if (defaultSecrets.includes(accessSecret)) {
    throw new Error('❌ CRITICAL: JWT_SECRET has default value - change it immediately!');
  }
  if (defaultSecrets.includes(refreshSecret)) {
    throw new Error('❌ CRITICAL: JWT_REFRESH_SECRET has default value - change it immediately!');
  }

  // Minimum 32 characters recommended
  if (accessSecret.length < 32) {
    console.warn('⚠️  WARNING: JWT_SECRET is less than 32 characters. Recommended: 32+ chars');
  }

  console.log('✅ JWT secrets validated successfully');
}

// CALL ON MODULE LOAD
validateJWTSecrets();

/**
 * Hash password with bcrypt
 */
async function hashPassword(password) {
  try {
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    throw new Error(`Password hashing failed: ${error.message}`);
  }
}

/**
 * Compare plain password with hashed password
 */
async function comparePassword(password, hash) {
  try {
    return await bcryptjs.compare(password, hash);
  } catch (error) {
    throw new Error(`Password comparison failed: ${error.message}`);
  }
}

/**
 * ✅ IMPROVED: Generate access token with validation
 */
function generateAccessToken(userId, email, role, expiresIn = 900) {
  if (!userId || !email || !role) {
    throw new Error('userId, email, and role are required');
  }

  const payload = {
    userId,
    email,
    role,
    type: 'access',
    iat: Math.floor(Date.now() / 1000),
  };

  const secret = process.env.JWT_SECRET;
  return jwt.sign(payload, secret, { expiresIn, algorithm: 'HS256' });
}

/**
 * ✅ IMPROVED: Generate refresh token with validation
 */
function generateRefreshToken(userId, tokenId, expiresIn = 604800) {
  if (!userId || !tokenId) {
    throw new Error('userId and tokenId are required');
  }

  const payload = {
    userId,
    tokenId,
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000),
  };

  const secret = process.env.JWT_REFRESH_SECRET;
  return jwt.sign(payload, secret, { expiresIn, algorithm: 'HS256' });
}

/**
 * ✅ IMPROVED: Verify access token with better error handling
 */
function verifyAccessToken(token) {
  try {
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token format');
    }

    const secret = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });

    if (decoded.type !== 'access') {
      throw new Error('Invalid token type - expected access token');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Access token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid access token signature');
    }
    if (error.name === 'NotBeforeError') {
      throw new Error('Token not yet valid');
    }
    throw error;
  }
}

/**
 * ✅ IMPROVED: Verify refresh token with better error handling
 */
function verifyRefreshToken(token) {
  try {
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token format');
    }

    const secret = process.env.JWT_REFRESH_SECRET;
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type - expected refresh token');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token signature');
    }
    throw error;
  }
}

/**
 * Generate verification code (for email/phone verification)
 */
function generateVerificationCode(length = 6) {
  const chars = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generate secure random token (for password reset, email verification)
 */
function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * ✅ IMPROVED: Hash token for storage (safer than plaintext)
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * ✅ IMPROVED: Verify token hash
 */
function verifyTokenHash(token, hash) {
  const tokenHash = hashToken(token);
  return tokenHash === hash;
}

module.exports = {
  validateJWTSecrets,
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateVerificationCode,
  generateSecureToken,
  hashToken,
  verifyTokenHash,
};
