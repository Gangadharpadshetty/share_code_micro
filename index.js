// Database utilities
const Database = require('./utils/database');

// Logger
const logger = require('./logger/logger');

// Constants
const { STATUS_CODES, MESSAGES } = require('./constants/statusCodes');

// Middlewares
const { auth, optionalAuth } = require('./middlewares/auth');

// Validation utilities
const {
  commonSchemas,
  userSchemas,
  jobSchemas,
  applicationSchemas,
  mentorSchemas,
  paymentSchemas,
  recommendationSchemas,
  querySchemas,
  validate,
  validateQuery,
  validateParams
} = require('./utils/validation');

// Response utilities
const ResponseHandler = require('./utils/response');

// Error handling utilities
const ErrorHandler = require('./utils/errorHandler');

// Rate limiting utilities
const rateLimiter = require('./utils/rateLimiter');

// Caching utilities
const cacheManager = require('./utils/cache');

// Export all utilities
module.exports = {
  // Database
  Database,
  
  // Logger
  logger,
  
  // Constants
  STATUS_CODES,
  MESSAGES,
  
  // Middlewares
  auth,
  optionalAuth,
  
  // Validation
  commonSchemas,
  userSchemas,
  jobSchemas,
  applicationSchemas,
  mentorSchemas,
  paymentSchemas,
  recommendationSchemas,
  querySchemas,
  validate,
  validateQuery,
  validateParams,
  
  // Response handling
  ResponseHandler,
  
  // Error handling
  ErrorHandler,
  
  // Rate limiting
  rateLimiter,
  
  // Caching
  cacheManager
};
