/**
 * API RESPONSE HANDLER - Unified Error/Success Response
 * File: backend/utils/apiResponse.js
 * 
 * Standardizes all API responses across the application
 */

class APIResponse {
  /**
   * ✅ Success response
   * @param {any} data - Response data
   * @param {string} message - Success message
   * @param {number} statusCode - HTTP status code (default: 200)
   * @returns {object} - Formatted response
   */
  static success(data, message = 'Success', statusCode = 200) {
    return {
      statusCode,
      body: {
        success: true,
        message,
        data: data || null,
      },
    };
  }

  /**
   * ✅ Paginated response
   * @param {array} data - Array of items
   * @param {object} pagination - Pagination info { page, limit, total, pages }
   * @param {string} message - Message (default: 'Success')
   * @returns {object} - Formatted response
   */
  static paginated(data, pagination, message = 'Success') {
    if (!pagination || typeof pagination !== 'object') {
      throw new Error('Pagination object required: { page, limit, total, pages }');
    }

    return {
      statusCode: 200,
      body: {
        success: true,
        message,
        data: Array.isArray(data) ? data : [],
        pagination: {
          page: pagination.page || 1,
          limit: pagination.limit || 20,
          total: pagination.total || 0,
          pages: pagination.pages || 1,
        },
      },
    };
  }

  /**
   * ❌ Error response
   * @param {string} message - Error message
   * @param {string} code - Error code for client handling
   * @param {number} statusCode - HTTP status code
   * @param {object} errors - Additional error details (validation errors, etc.)
   * @returns {object} - Formatted error response
   */
  static error(message, code = 'UNKNOWN_ERROR', statusCode = 400, errors = null) {
    const response = {
      statusCode,
      body: {
        success: false,
        message,
        code,
      },
    };

    if (errors) {
      response.body.errors = errors;
    }

    if (process.env.NODE_ENV === 'development') {
      response.body.timestamp = new Date().toISOString();
    }

    return response;
  }

  /**
   * ❌ Validation error (422)
   * @param {object} errors - Validation errors object
   * @param {string} message - Error message
   * @returns {object} - Formatted validation error response
   */
  static validationError(errors, message = 'Validation failed') {
    return {
      statusCode: 422,
      body: {
        success: false,
        message,
        code: 'VALIDATION_ERROR',
        errors,
      },
    };
  }

  /**
   * ❌ Not found error (404)
   * @param {string} resource - Resource type (e.g., 'User', 'Product')
   * @returns {object} - Formatted not found response
   */
  static notFound(resource) {
    return this.error(`${resource} not found`, 'NOT_FOUND', 404);
  }

  /**
   * ❌ Unauthorized error (401)
   * @param {string} message - Error message
   * @returns {object} - Formatted unauthorized response
   */
  static unauthorized(message = 'Authentication required') {
    return this.error(message, 'UNAUTHORIZED', 401);
  }

  /**
   * ❌ Forbidden error (403)
   * @param {string} message - Error message
   * @returns {object} - Formatted forbidden response
   */
  static forbidden(message = 'Access denied') {
    return this.error(message, 'FORBIDDEN', 403);
  }

  /**
   * ❌ Server error (500)
   * @param {string} message - Error message
   * @param {Error} error - Error object (for logging)
   * @returns {object} - Formatted server error response
   */
  static serverError(message = 'Internal server error', error = null) {
    if (error && process.env.NODE_ENV === 'development') {
      console.error('[SERVER ERROR]', error);
    }

    return this.error(message, 'SERVER_ERROR', 500);
  }

  /**
   * ❌ Too many requests error (429)
   * @param {string} message - Error message
   * @returns {object} - Formatted rate limit response
   */
  static rateLimited(message = 'Too many requests, please try again later') {
    return this.error(message, 'RATE_LIMIT', 429);
  }

  /**
   * ✅ Created response (201)
   * @param {any} data - Created resource data
   * @param {string} message - Message
   * @returns {object} - Formatted created response
   */
  static created(data, message = 'Resource created successfully') {
    return this.success(data, message, 201);
  }
}

module.exports = APIResponse;
