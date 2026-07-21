/**
 * Input Validators
 * Validates user inputs for registration, login, and other auth operations
 */
const validator = require('validator');

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {object} - { isValid: boolean, error?: string }
 */
function validateEmail(email) {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }

  const trimmedEmail = email.trim();

  if (!validator.isEmail(trimmedEmail)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  if (trimmedEmail.length > 255) {
    return { isValid: false, error: 'Email is too long' };
  }

  return { isValid: true };
}

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character (optional, but recommended)
 * 
 * @param {string} password - Password to validate
 * @param {object} options - Validation options
 * @returns {object} - { isValid: boolean, errors: string[] }
 */
function validatePassword(password, options = {}) {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = false,
    maxLength = 128,
  } = options;

  const errors = [];

  if (!password) {
    return { isValid: false, errors: ['Password is required'] };
  }

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }

  if (password.length > maxLength) {
    errors.push(`Password cannot exceed ${maxLength} characters`);
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter (A-Z)');
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter (a-z)');
  }

  if (requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number (0-9)');
  }

  if (requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate username
 * @param {string} username - Username to validate
 * @returns {object} - { isValid: boolean, error?: string }
 */
function validateUsername(username) {
  if (!username) {
    return { isValid: false, error: 'Username is required' };
  }

  const trimmedUsername = username.trim();

  if (trimmedUsername.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters' };
  }

  if (trimmedUsername.length > 50) {
    return { isValid: false, error: 'Username cannot exceed 50 characters' };
  }

  // Allow letters, numbers, dots, hyphens, underscores
  if (!/^[a-zA-Z0-9._-]+$/.test(trimmedUsername)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, dots, hyphens, and underscores' };
  }

  return { isValid: true };
}

/**
 * Validate phone number (Vietnamese format)
 * @param {string} phone - Phone number to validate
 * @returns {object} - { isValid: boolean, error?: string }
 */
function validatePhoneNumber(phone) {
  if (!phone) {
    return { isValid: false, error: 'Phone number is required' };
  }

  const trimmedPhone = phone.trim();

  // Vietnamese phone numbers: 10 digits, can start with 0 or +84
  const vietnamPhoneRegex = /^(0|(\+84))[0-9]{9}$/;

  if (!vietnamPhoneRegex.test(trimmedPhone.replace(/\s/g, ''))) {
    return { isValid: false, error: 'Invalid Vietnamese phone number format' };
  }

  return { isValid: true };
}

/**
 * Validate full name
 * @param {string} name - Full name to validate
 * @returns {object} - { isValid: boolean, error?: string }
 */
function validateFullName(name) {
  if (!name) {
    return { isValid: false, error: 'Full name is required' };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' };
  }

  if (trimmedName.length > 200) {
    return { isValid: false, error: 'Name cannot exceed 200 characters' };
  }

  // Allow letters, spaces, hyphens, dots
  if (!/^[a-zA-Zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ\s\-\.]+$/i.test(trimmedName)) {
    return { isValid: false, error: 'Invalid characters in name' };
  }

  return { isValid: true };
}

/**
 * Validate verification code (6 digits)
 * @param {string} code - Verification code
 * @returns {object} - { isValid: boolean, error?: string }
 */
function validateVerificationCode(code) {
  if (!code) {
    return { isValid: false, error: 'Verification code is required' };
  }

  if (!/^[0-9]{6}$/.test(code.trim())) {
    return { isValid: false, error: 'Verification code must be 6 digits' };
  }

  return { isValid: true };
}

/**
 * Validate reset token format
 * @param {string} token - Reset token
 * @returns {object} - { isValid: boolean, error?: string }
 */
function validateResetToken(token) {
  if (!token) {
    return { isValid: false, error: 'Reset token is required' };
  }

  // Token should be a hexadecimal string (at least 32 chars from crypto.randomBytes(16))
  if (!/^[a-f0-9]{64}$/i.test(token.trim())) {
    return { isValid: false, error: 'Invalid reset token format' };
  }

  return { isValid: true };
}

/**
 * Sanitize email
 * @param {string} email - Email to sanitize
 * @returns {string} - Sanitized email
 */
function sanitizeEmail(email) {
  return validator.normalizeEmail(email);
}

/**
 * Sanitize string input (prevent XSS)
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  // Escape HTML special characters
  return validator.escape(input.trim());
}

/**
 * Validate registration data
 * @param {object} data - Registration data
 * @returns {object} - { isValid: boolean, errors: object }
 */
function validateRegistration(data) {
  const errors = {};

  // Validate email
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error;
  }

  // Validate username
  const usernameValidation = validateUsername(data.username);
  if (!usernameValidation.isValid) {
    errors.username = usernameValidation.error;
  }

  // Validate password
  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.errors;
  }

  // Validate phone if provided
  if (data.phone) {
    const phoneValidation = validatePhoneNumber(data.phone);
    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.error;
    }
  }

  // Validate full name if provided
  if (data.fullName) {
    const nameValidation = validateFullName(data.fullName);
    if (!nameValidation.isValid) {
      errors.fullName = nameValidation.error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate login data
 * @param {object} data - Login data
 * @returns {object} - { isValid: boolean, errors: object }
 */
function validateLogin(data) {
  const errors = {};

  // Email or username
  if (!data.email && !data.username) {
    errors.emailOrUsername = 'Email or username is required';
  }

  // Validate password
  if (!data.password) {
    errors.password = 'Password is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

module.exports = {
  validateEmail,
  validatePassword,
  validateUsername,
  validatePhoneNumber,
  validateFullName,
  validateVerificationCode,
  validateResetToken,
  sanitizeEmail,
  sanitizeInput,
  validateRegistration,
  validateLogin,
};
