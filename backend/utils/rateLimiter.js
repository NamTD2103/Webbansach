/**
 * Rate Limiting Configuration
 * Protects against brute force attacks and spam
 */
const rateLimit = require('express-rate-limit');

/**
 * Login rate limiter
 * Max 5 attempts per 15 minutes per IP
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many login attempts. Please try again after 15 minutes.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req, res) => {
    // Skip rate limiting for GET requests
    return req.method === 'GET';
  },
  keyGenerator: (req, res) => {
    // Use user IP address or email if provided
    return req.body?.email || req.ip || req.connection.remoteAddress;
  },
});

/**
 * Registration rate limiter
 * Max 3 registrations per 60 minutes per IP (prevent spam)
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutes
  max: 3, // Limit each IP to 3 requests per windowMs
  message: 'Too many accounts created from this IP. Please try again after 1 hour.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    return req.ip || req.connection.remoteAddress;
  },
});

/**
 * Password reset request limiter
 * Max 3 reset requests per 60 minutes per email
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutes
  max: 3, // Limit to 3 requests per windowMs
  message: 'Too many password reset requests. Please try again after 1 hour.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    return req.body?.email || req.ip || req.connection.remoteAddress;
  },
});

/**
 * Email verification resend limiter
 * Max 5 resends per 60 minutes per email
 */
const verificationResendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutes
  max: 5,
  message: 'Too many verification email requests. Please try again after 1 hour.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    return req.body?.email || req.ip || req.connection.remoteAddress;
  },
});

/**
 * General API rate limiter
 * Max 100 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    // Prioritize user ID if authenticated, fallback to IP
    return req.user?.userId || req.ip || req.connection.remoteAddress;
  },
});

/**
 * Strict API rate limiter (for sensitive operations)
 * Max 10 requests per 60 minutes
 */
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutes
  max: 10,
  message: 'Too many requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    return req.user?.userId || req.ip || req.connection.remoteAddress;
  },
});

module.exports = {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  verificationResendLimiter,
  apiLimiter,
  strictLimiter,
};
