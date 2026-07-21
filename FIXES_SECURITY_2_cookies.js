/**
 * SECURITY FIX #2: Token Storage with HttpOnly Cookies
 * File: backend/middleware/auth.js
 * ADD these functions to existing middleware
 */

const { verifyAccessToken, verifyRefreshToken } = require('../utils/authUtils');

/**
 * ✅ NEW: Set secure cookies for tokens
 * Usage: Call in login/register routes after user verification
 */
function setSecureTokenCookies(res, accessToken, refreshToken) {
  // Access token: HttpOnly, Secure, SameSite, Short expiry
  res.cookie('accessToken', accessToken, {
    httpOnly: true,           // ✅ Cannot access from JavaScript (XSS protection)
    secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
    sameSite: 'strict',       // ✅ CSRF protection
    maxAge: 15 * 60 * 1000,   // 15 minutes
    path: '/',
  });

  // Refresh token: HttpOnly, Secure, SameSite, Long expiry, Path restricted
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
    path: '/api/auth/refresh',        // Only sent to refresh endpoint
  });

  console.log('✅ Secure token cookies set');
}

/**
 * ✅ NEW: Clear cookies on logout
 */
function clearTokenCookies(res) {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
  console.log('✅ Token cookies cleared');
}

/**
 * ✅ IMPROVED: Extract token from cookies (priority: Authorization header, then cookies)
 */
function getTokenFromRequest(req) {
  // Priority 1: Authorization header (for API clients)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Priority 2: httpOnly cookie (for browser clients)
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }

  return null;
}

/**
 * ✅ IMPROVED: Verify token middleware with cookie support
 */
function verifyToken(req, res, next) {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Missing token.',
      });
    }

    try {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      // Token expired, try refresh
      if (error.message.includes('expired')) {
        return res.status(401).json({
          success: false,
          message: 'Access token expired',
          code: 'TOKEN_EXPIRED',
        });
      }

      return res.status(401).json({
        success: false,
        message: error.message || 'Invalid token',
      });
    }
  } catch (error) {
    console.error('[AUTH MIDDLEWARE ERROR]', error.message);
    return res.status(500).json({
      success: false,
      message: 'Token verification failed',
    });
  }
}

/**
 * ✅ IMPROVED: Optional token verification (doesn't fail if missing)
 */
function verifyTokenOptional(req, res, next) {
  try {
    const token = getTokenFromRequest(req);

    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        req.user = decoded;
      } catch (error) {
        console.log('[AUTH] Optional token invalid:', error.message);
        // Continue without user
      }
    }

    next();
  } catch (error) {
    console.error('[AUTH MIDDLEWARE ERROR]', error.message);
    next(); // Always continue
  }
}

/**
 * ✅ IMPROVED: Refresh token endpoint handler
 */
async function handleTokenRefresh(req, res) {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not found',
      });
    }

    try {
      const decoded = verifyRefreshToken(refreshToken);

      // ✅ TODO: Verify tokenId exists in database
      // const refreshRecord = await executeQuery(
      //   'SELECT * FROM REFRESH_TOKENS WHERE TOKEN_ID = ? AND USER_ID = ? AND REVOKED = 0',
      //   [decoded.tokenId, decoded.userId]
      // );

      const { generateAccessToken } = require('../utils/authUtils');
      const newAccessToken = generateAccessToken(
        decoded.userId,
        decoded.email,  // ✅ Need to fetch from DB
        decoded.role    // ✅ Need to fetch from DB
      );

      // Set new access token
      res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
        path: '/',
      });

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        accessToken: newAccessToken,  // For API clients
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: error.message || 'Refresh token invalid',
      });
    }
  } catch (error) {
    console.error('[REFRESH ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed',
    });
  }
}

/**
 * Role-based access control middleware
 */
function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`,
      });
    }

    next();
  };
}

module.exports = {
  verifyToken,
  verifyTokenOptional,
  requireRole,
  setSecureTokenCookies,
  clearTokenCookies,
  getTokenFromRequest,
  handleTokenRefresh,
};
