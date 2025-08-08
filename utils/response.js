const { STATUS_CODES, MESSAGES } = require('../constants/statusCodes');
const logger = require('../logger/logger');

class ResponseHandler {
  /**
   * Send success response
   * @param {Object} res - Express response object
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Response message
   * @param {*} data - Response data
   * @param {Object} meta - Additional metadata
   */
  static success(res, statusCode = STATUS_CODES.OK, message = MESSAGES.SUCCESS, data = null, meta = {}) {
    const response = {
      success: true,
      message,
      ...(data !== null && { data }),
      ...(Object.keys(meta).length > 0 && { meta })
    };

    logger.info('API Response', {
      statusCode,
      message,
      dataSize: data ? (Array.isArray(data) ? data.length : 1) : 0,
      meta
    });

    return res.status(statusCode).json(response);
  }

  /**
   * Send error response
   * @param {Object} res - Express response object
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {*} errors - Error details
   * @param {string} code - Error code
   */
  static error(res, statusCode = STATUS_CODES.INTERNAL_SERVER_ERROR, message = MESSAGES.INTERNAL_ERROR, errors = null, code = null) {
    const response = {
      success: false,
      message,
      ...(errors && { errors }),
      ...(code && { code })
    };

    logger.error('API Error Response', {
      statusCode,
      message,
      errors,
      code
    });

    return res.status(statusCode).json(response);
  }

  /**
   * Send created response
   * @param {Object} res - Express response object
   * @param {string} message - Response message
   * @param {*} data - Created resource data
   */
  static created(res, message = MESSAGES.CREATED, data = null) {
    return this.success(res, STATUS_CODES.CREATED, message, data);
  }

  /**
   * Send no content response
   * @param {Object} res - Express response object
   */
  static noContent(res) {
    logger.info('API Response - No Content');
    return res.status(STATUS_CODES.NO_CONTENT).send();
  }

  /**
   * Send bad request response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {*} errors - Validation errors
   */
  static badRequest(res, message = MESSAGES.VALIDATION_ERROR, errors = null) {
    return this.error(res, STATUS_CODES.BAD_REQUEST, message, errors);
  }

  /**
   * Send unauthorized response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static unauthorized(res, message = MESSAGES.UNAUTHORIZED) {
    return this.error(res, STATUS_CODES.UNAUTHORIZED, message);
  }

  /**
   * Send forbidden response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static forbidden(res, message = MESSAGES.FORBIDDEN) {
    return this.error(res, STATUS_CODES.FORBIDDEN, message);
  }

  /**
   * Send not found response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static notFound(res, message = MESSAGES.NOT_FOUND) {
    return this.error(res, STATUS_CODES.NOT_FOUND, message);
  }

  /**
   * Send conflict response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static conflict(res, message = 'Resource already exists') {
    return this.error(res, STATUS_CODES.CONFLICT, message);
  }

  /**
   * Send unprocessable entity response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {*} errors - Validation errors
   */
  static unprocessableEntity(res, message = MESSAGES.VALIDATION_ERROR, errors = null) {
    return this.error(res, STATUS_CODES.UNPROCESSABLE_ENTITY, message, errors);
  }

  /**
   * Send paginated response
   * @param {Object} res - Express response object
   * @param {Array} data - Array of items
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @param {number} total - Total number of items
   * @param {string} message - Response message
   */
  static paginated(res, data, page, limit, total, message = MESSAGES.SUCCESS) {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const meta = {
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null
      }
    };

    return this.success(res, STATUS_CODES.OK, message, data, meta);
  }

  /**
   * Send list response with optional pagination
   * @param {Object} res - Express response object
   * @param {Array} data - Array of items
   * @param {string} message - Response message
   * @param {Object} pagination - Pagination info (optional)
   */
  static list(res, data, message = MESSAGES.SUCCESS, pagination = null) {
    if (pagination) {
      return this.paginated(res, data, pagination.page, pagination.limit, pagination.total, message);
    }
    return this.success(res, STATUS_CODES.OK, message, data);
  }

  /**
   * Send single item response
   * @param {Object} res - Express response object
   * @param {*} data - Item data
   * @param {string} message - Response message
   */
  static item(res, data, message = MESSAGES.SUCCESS) {
    return this.success(res, STATUS_CODES.OK, message, data);
  }

  /**
   * Send updated response
   * @param {Object} res - Express response object
   * @param {*} data - Updated item data
   * @param {string} message - Response message
   */
  static updated(res, data = null, message = MESSAGES.UPDATED) {
    return this.success(res, STATUS_CODES.OK, message, data);
  }

  /**
   * Send deleted response
   * @param {Object} res - Express response object
   * @param {string} message - Response message
   */
  static deleted(res, message = MESSAGES.DELETED) {
    return this.success(res, STATUS_CODES.OK, message);
  }

  /**
   * Send service unavailable response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static serviceUnavailable(res, message = 'Service temporarily unavailable') {
    return this.error(res, STATUS_CODES.SERVICE_UNAVAILABLE, message);
  }

  /**
   * Send rate limit exceeded response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static rateLimitExceeded(res, message = 'Rate limit exceeded') {
    return this.error(res, 429, message);
  }

  /**
   * Send file download response
   * @param {Object} res - Express response object
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} filename - Filename
   * @param {string} contentType - Content type
   */
  static fileDownload(res, fileBuffer, filename, contentType = 'application/octet-stream') {
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', fileBuffer.length);
    
    logger.info('File Download', { filename, contentType, size: fileBuffer.length });
    
    return res.send(fileBuffer);
  }

  /**
   * Send file upload response
   * @param {Object} res - Express response object
   * @param {string} filename - Uploaded filename
   * @param {string} url - File URL
   * @param {number} size - File size
   */
  static fileUpload(res, filename, url, size) {
    const data = {
      filename,
      url,
      size,
      uploadedAt: new Date().toISOString()
    };

    logger.info('File Upload', data);
    
    return this.success(res, STATUS_CODES.CREATED, 'File uploaded successfully', data);
  }
}

module.exports = ResponseHandler;
