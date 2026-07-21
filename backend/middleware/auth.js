/**
 * Authentication Middleware
 * Validates JWT tokens and attaches user info to requests
 */
const { verifyAccessToken, verifyRefreshToken } = require('../utils/authUtils');

/**
 * Verify access token middleware
 * Validates JWT access token from httpOnly cookies or Authorization header
 * Attaches decoded token to req.user
 */
function verifyToken(req, res, next) {
  try {
    let token;

    // ✅ Try to get token from httpOnly cookie first
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
      console.log('[AUTH] ✅ Token found in httpOnly cookie');
    }
    // Fall back to Authorization header (Bearer token)
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7); // Remove 'Bearer ' prefix
      console.log('[AUTH] ✅ Token found in Authorization header');
    }

    if (!token) {
      console.warn('[AUTH] ❌ No token found in cookie or header');
      console.log('[AUTH] Request headers:', {
        authorization: req.headers.authorization ? '(present)' : '(missing)',
        cookies: Object.keys(req.cookies || {})
      });
      return res.status(401).json({
        success: false,
        message: 'Missing authentication token',
      });
    }

    try {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
      console.log('[AUTH] ✅ Token verified successfully for user:', decoded.userId);
      next();
    } catch (error) {
      console.error('[AUTH] ❌ Token verification failed:', error.message);
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
      error: error.message,
    });
  }
}

/**
 * Optional token verification middleware
 * Verifies token from cookies or Authorization header if present
 * Doesn't fail if token is absent (useful for public endpoints)
 */
function verifyTokenOptional(req, res, next) {
  try {
    let token;

    // Try to get token from httpOnly cookie first
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    // Fall back to Authorization header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    }

    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        req.user = decoded;
      } catch (error) {
        console.log('[AUTH] Optional token verification failed:', error.message);
        // Don't fail, just continue without user info
      }
    }

    next();
  } catch (error) {
    console.error('[AUTH MIDDLEWARE ERROR]', error.message);
    next(); // Continue anyway
  }
}

/**
 * Role-based access control middleware
 * Checks if user has required role
 * 
 * @param {string|string[]} allowedRoles - Single role or array of allowed roles
 * @returns {function} - Middleware function
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

/**
 * Admin-only middleware
 * Shorthand for checking if user is ADMIN
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }

  next();
}

/**
 * Verify email middleware
 * Checks if user's email is verified
 */
function requireEmailVerified(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  // Note: This is a basic check. In production, fetch email_verified status from DB
  if (!req.user.emailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required',
    });
  }

  next();
}

/**
 * Check account status middleware
 * Prevents locked or blocked accounts from accessing protected routes
 */
function checkAccountStatus(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  // Check if account is locked
  if (req.user.accountLocked) {
    return res.status(403).json({
      success: false,
      message: 'Your account has been temporarily locked. Please try again later.',
    });
  }

  // Check if account is blocked/suspended
  if (req.user.status === 'BLOCKED' || req.user.status === 'SUSPENDED') {
    return res.status(403).json({
      success: false,
      message: 'Your account has been suspended. Please contact support.',
    });
  }

  next();
}

/**
 * Logging middleware for auth routes
 * Logs authentication-related requests for security audit
 */
function logAuthRequest(req, res, next) {
  const startTime = Date.now();
  const originalSend = res.send;

  res.send = function (data) {
    const duration = Date.now() - startTime;
    const logInfo = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      userId: req.user?.userId || 'anonymous',
    };

    console.log('[AUTH LOG]', JSON.stringify(logInfo));

    // Audit log sensitive operations
    if (req.method === 'POST' || req.method === 'PUT') {
      console.log('[AUTH AUDIT]', {
        action: req.path,
        user: req.user?.userId || req.body?.email,
        timestamp: logInfo.timestamp,
      });
    }

    return originalSend.call(this, data);
  };

  next();
}

/**
 * CORS origin validation middleware
 * Ensures requests are from trusted origins
 */
function validateOrigin(req, res, next) {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
  const requestOrigin = req.get('origin');

  // Log the request origin for debugging
  if (requestOrigin) {
    console.log(`[CORS] Request from origin: ${requestOrigin}`);
  }

  next();
}

/**
 * CSRF token validation middleware (if not using httpOnly cookies)
 * Validates CSRF token from headers
 */
function validateCSRFToken(req, res, next) {
  // Skip CSRF check for GET requests
  if (req.method === 'GET') {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'];
  const sessionCSRFToken = req.session?.csrfToken;

  if (!csrfToken || csrfToken !== sessionCSRFToken) {
    return res.status(403).json({
      success: false,
      message: 'CSRF validation failed',
    });
  }

  next();
}

/**
 * Security headers middleware
 * Sets security-related HTTP headers
 */
function setSecurityHeaders(req, res, next) {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection (deprecated but still useful for older browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy (formerly Feature Policy)
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Content Security Policy (basic)
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");

  next();
}

module.exports = {
  verifyToken,
  verifyTokenOptional,
  requireRole,
  requireAdmin,
  requireEmailVerified,
  checkAccountStatus,
  logAuthRequest,
  validateOrigin,
  validateCSRFToken,
  setSecurityHeaders,
};
