const logger = require('../logger/logger');
const ResponseHandler = require('./response');

class ErrorHandler {
  /**
   * Custom error class for application errors
   */
  static AppError = class extends Error {
    constructor(message, statusCode, code = null, isOperational = true) {
      super(message);
      this.statusCode = statusCode;
      this.code = code;
      this.isOperational = isOperational;
      this.timestamp = new Date().toISOString();
      
      Error.captureStackTrace(this, this.constructor);
    }
  };

  /**
   * Create validation error
   * @param {string} message - Error message
   * @param {Array} errors - Validation errors
   */
  static createValidationError(message = 'Validation failed', errors = []) {
    return new this.AppError(message, 400, 'VALIDATION_ERROR', true);
  }

  /**
   * Create not found error
   * @param {string} message - Error message
   */
  static createNotFoundError(message = 'Resource not found') {
    return new this.AppError(message, 404, 'NOT_FOUND', true);
  }

  /**
   * Create unauthorized error
   * @param {string} message - Error message
   */
  static createUnauthorizedError(message = 'Unauthorized access') {
    return new this.AppError(message, 401, 'UNAUTHORIZED', true);
  }

  /**
   * Create forbidden error
   * @param {string} message - Error message
   */
  static createForbiddenError(message = 'Access forbidden') {
    return new this.AppError(message, 403, 'FORBIDDEN', true);
  }

  /**
   * Create conflict error
   * @param {string} message - Error message
   */
  static createConflictError(message = 'Resource already exists') {
    return new this.AppError(message, 409, 'CONFLICT', true);
  }

  /**
   * Create duplicate error
   * @param {string} message - Error message
   */
  static createDuplicateError(message = 'Duplicate resource') {
    return new this.AppError(message, 409, 'DUPLICATE', true);
  }

  /**
   * Create rate limit error
   * @param {string} message - Error message
   */
  static createRateLimitError(message = 'Rate limit exceeded') {
    return new this.AppError(message, 429, 'RATE_LIMIT', true);
  }

  /**
   * Create service unavailable error
   * @param {string} message - Error message
   */
  static createServiceUnavailableError(message = 'Service temporarily unavailable') {
    return new this.AppError(message, 503, 'SERVICE_UNAVAILABLE', true);
  }

  /**
   * Create database error
   * @param {string} message - Error message
   * @param {Error} originalError - Original database error
   */
  static createDatabaseError(message = 'Database operation failed', originalError = null) {
    const error = new this.AppError(message, 500, 'DATABASE_ERROR', false);
    error.originalError = originalError;
    return error;
  }

  /**
   * Create external service error
   * @param {string} message - Error message
   * @param {Error} originalError - Original external service error
   */
  static createExternalServiceError(message = 'External service error', originalError = null) {
    const error = new this.AppError(message, 502, 'EXTERNAL_SERVICE_ERROR', false);
    error.originalError = originalError;
    return error;
  }

  /**
   * Handle MongoDB errors
   * @param {Error} error - MongoDB error
   */
  static handleMongoError(error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return this.createValidationError('Validation failed', errors);
    }

    if (error.name === 'CastError') {
      return this.createValidationError('Invalid ID format');
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return this.createDuplicateError(`${field} already exists`);
    }

    if (error.name === 'MongoNetworkError') {
      return this.createServiceUnavailableError('Database connection failed');
    }

    return this.createDatabaseError('Database operation failed', error);
  }

  /**
   * Handle JWT errors
   * @param {Error} error - JWT error
   */
  static handleJWTError(error) {
    if (error.name === 'TokenExpiredError') {
      return this.createUnauthorizedError('Token expired');
    }

    if (error.name === 'JsonWebTokenError') {
      return this.createUnauthorizedError('Invalid token');
    }

    if (error.name === 'NotBeforeError') {
      return this.createUnauthorizedError('Token not active');
    }

    return this.createUnauthorizedError('Authentication failed');
  }

  /**
   * Handle validation errors
   * @param {Error} error - Joi validation error
   */
  static handleValidationError(error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    return this.createValidationError('Validation failed', errors);
  }

  /**
   * Global error handler middleware
   */
  static globalErrorHandler(err, req, res, next) {
    let error = err;

    // Log the error
    logger.error('Global Error Handler', {
      error: {
        message: error.message,
        stack: error.stack,
        statusCode: error.statusCode,
        code: error.code
      },
      request: {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }
    });

    // Handle specific error types
    if (error.name === 'ValidationError') {
      error = this.handleMongoError(error);
    }

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError' || error.name === 'NotBeforeError') {
      error = this.handleJWTError(error);
    }

    if (error.isJoi) {
      error = this.handleValidationError(error);
    }

    // Set default values if not set
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';
    const code = error.code || 'INTERNAL_ERROR';

    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    const errorDetails = isDevelopment ? {
      stack: error.stack,
      originalError: error.originalError
    } : {};

    // Send error response
    return ResponseHandler.error(res, statusCode, message, errorDetails, code);
  }

  /**
   * Async error wrapper for controllers
   * @param {Function} fn - Async function to wrap
   */
  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Handle unhandled promise rejections
   */
  static handleUnhandledRejection(reason, promise) {
    logger.error('Unhandled Promise Rejection', {
      reason: reason?.message || reason,
      stack: reason?.stack,
      promise
    });

    // Gracefully shutdown the server
    process.exit(1);
  }

  /**
   * Handle uncaught exceptions
   */
  static handleUncaughtException(error) {
    logger.error('Uncaught Exception', {
      error: error.message,
      stack: error.stack
    });

    // Gracefully shutdown the server
    process.exit(1);
  }

  /**
   * Setup global error handlers
   */
  static setupGlobalHandlers() {
    process.on('unhandledRejection', this.handleUnhandledRejection);
    process.on('uncaughtException', this.handleUncaughtException);
  }

  /**
   * Create error with custom context
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} code - Error code
   * @param {Object} context - Additional context
   */
  static createErrorWithContext(message, statusCode, code, context = {}) {
    const error = new this.AppError(message, statusCode, code);
    error.context = context;
    return error;
  }

  /**
   * Check if error is operational
   * @param {Error} error - Error to check
   */
  static isOperationalError(error) {
    return error.isOperational === true;
  }

  /**
   * Format error for logging
   * @param {Error} error - Error to format
   */
  static formatErrorForLogging(error) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
      stack: error.stack,
      timestamp: error.timestamp,
      context: error.context,
      originalError: error.originalError
    };
  }
}

module.exports = ErrorHandler;
