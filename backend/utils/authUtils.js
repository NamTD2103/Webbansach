/**
 * Authentication Utilities
 * Handles password hashing, JWT token generation and validation
 */
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * ✅ NEW: Validate JWT secrets on startup
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

  if (accessSecret.length < 32) {
    console.warn('⚠️  WARNING: JWT_SECRET is less than 32 characters. Recommended: 32+ chars');
  }

  console.log('✅ JWT secrets validated successfully');
}

// NOTE: Validation is deferred until first token generation to allow dotenv to load first

/**
 * Hash password with bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
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
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} - True if password matches
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
 * Verify JWT refresh token
 * @param {string} token - Refresh token
 * @returns {object} - Decoded token payload
 * @throws {Error} - If token is invalid or expired
 */
function verifyRefreshToken(token) {
  try {
    const secret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';
    const decoded = jwt.verify(token, secret);
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
}

/**
 * Generate verification code (for email/phone verification)
 * @param {number} length - Length of code (default: 6)
 * @returns {string} - Random verification code
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
 * @param {number} length - Length in bytes (default: 32)
 * @returns {string} - Random token
 */
function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash a token (for storing in database)
 * @param {string} token - Plain token
 * @returns {string} - Hashed token
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Verify token against hash
 * @param {string} token - Plain token
 * @param {string} hash - Token hash from database
 * @returns {boolean} - True if token matches hash
 */
function verifyTokenHash(token, hash) {
  return hashToken(token) === hash;
}

/**
 * Decode JWT without verification (for debugging)
 * Use with caution - only for non-security purposes
 * @param {string} token - JWT token
 * @returns {object} - Decoded payload
 */
function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch (error) {
    throw new Error('Failed to decode token');
  }
}

module.exports = {
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
  decodeToken,
};
