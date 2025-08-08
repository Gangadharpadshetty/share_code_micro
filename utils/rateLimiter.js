const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');
const logger = require('../logger/logger');

class RateLimiter {
  constructor() {
    this.redisClient = null;
    this.limiters = new Map();
  }

  /**
   * Initialize Redis client for rate limiting
   */
  async initializeRedis() {
    try {
      this.redisClient = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        password: process.env.REDIS_PASSWORD
      });

      await this.redisClient.connect();
      logger.info('Redis client initialized for rate limiting');
    } catch (error) {
      logger.error('Failed to initialize Redis for rate limiting:', error);
      // Fallback to memory store
      this.redisClient = null;
    }
  }

  /**
   * Create a rate limiter
   * @param {Object} options - Rate limiter options
   */
  createLimiter(options = {}) {
    const {
      windowMs = 15 * 60 * 1000, // 15 minutes
      max = 100, // limit each IP to 100 requests per windowMs
      message = 'Too many requests from this IP, please try again later',
      standardHeaders = true,
      legacyHeaders = false,
      keyGenerator = null,
      skipSuccessfulRequests = false,
      skipFailedRequests = false,
      name = 'default'
    } = options;

    const limiter = rateLimit({
      windowMs,
      max,
      message: {
        success: false,
        message,
        code: 'RATE_LIMIT_EXCEEDED'
      },
      standardHeaders,
      legacyHeaders,
      store: this.redisClient ? new RedisStore({
        sendCommand: (...args) => this.redisClient.sendCommand(args)
      }) : undefined,
      keyGenerator: keyGenerator || this.defaultKeyGenerator,
      skipSuccessfulRequests,
      skipFailedRequests,
      handler: (req, res) => {
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          url: req.url,
          method: req.method
        });
        res.status(429).json({
          success: false,
          message,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }
    });

    this.limiters.set(name, limiter);
    return limiter;
  }

  /**
   * Default key generator for rate limiting
   * @param {Object} req - Express request object
   */
  defaultKeyGenerator(req) {
    // Use user ID if authenticated, otherwise use IP
    if (req.user && req.user.id) {
      return `user:${req.user.id}`;
    }
    return req.ip;
  }

  /**
   * Create authentication rate limiter
   */
  createAuthLimiter() {
    return this.createLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // limit each IP to 5 requests per windowMs
      message: 'Too many authentication attempts, please try again later',
      name: 'auth',
      skipSuccessfulRequests: true
    });
  }

  /**
   * Create API rate limiter
   */
  createApiLimiter() {
    return this.createLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs
      message: 'Too many API requests, please try again later',
      name: 'api'
    });
  }

  /**
   * Create strict API rate limiter
   */
  createStrictApiLimiter() {
    return this.createLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests to this endpoint, please try again later',
      name: 'strict-api'
    });
  }

  /**
   * Create user-specific rate limiter
   */
  createUserLimiter() {
    return this.createLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 500, // limit each user to 500 requests per windowMs
      message: 'Too many requests for this user, please try again later',
      name: 'user',
      keyGenerator: (req) => {
        if (!req.user || !req.user.id) {
          return req.ip; // Fallback to IP if no user
        }
        return `user:${req.user.id}`;
      }
    });
  }

  /**
   * Create file upload rate limiter
   */
  createFileUploadLimiter() {
    return this.createLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // limit each IP to 10 uploads per hour
      message: 'Too many file uploads, please try again later',
      name: 'file-upload'
    });
  }

  /**
   * Create search rate limiter
   */
  createSearchLimiter() {
    return this.createLimiter({
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 50, // limit each IP to 50 searches per 5 minutes
      message: 'Too many search requests, please try again later',
      name: 'search'
    });
  }

  /**
   * Create recommendation rate limiter
   */
  createRecommendationLimiter() {
    return this.createLimiter({
      windowMs: 10 * 60 * 1000, // 10 minutes
      max: 20, // limit each user to 20 recommendation requests per 10 minutes
      message: 'Too many recommendation requests, please try again later',
      name: 'recommendation',
      keyGenerator: (req) => {
        if (!req.user || !req.user.id) {
          return req.ip;
        }
        return `user:${req.user.id}`;
      }
    });
  }

  /**
   * Create payment rate limiter
   */
  createPaymentLimiter() {
    return this.createLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // limit each user to 10 payment attempts per hour
      message: 'Too many payment attempts, please try again later',
      name: 'payment',
      keyGenerator: (req) => {
        if (!req.user || !req.user.id) {
          return req.ip;
        }
        return `user:${req.user.id}`;
      }
    });
  }

  /**
   * Create mentor session rate limiter
   */
  createMentorSessionLimiter() {
    return this.createLimiter({
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
      max: 5, // limit each user to 5 session bookings per day
      message: 'Too many session bookings, please try again tomorrow',
      name: 'mentor-session',
      keyGenerator: (req) => {
        if (!req.user || !req.user.id) {
          return req.ip;
        }
        return `user:${req.user.id}`;
      }
    });
  }

  /**
   * Create email rate limiter
   */
  createEmailLimiter() {
    return this.createLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5, // limit each IP to 5 email requests per hour
      message: 'Too many email requests, please try again later',
      name: 'email'
    });
  }

  /**
   * Create webhook rate limiter
   */
  createWebhookLimiter() {
    return this.createLimiter({
      windowMs: 60 * 1000, // 1 minute
      max: 100, // limit each IP to 100 webhook requests per minute
      message: 'Too many webhook requests',
      name: 'webhook'
    });
  }

  /**
   * Get rate limit info for a key
   * @param {string} key - Rate limit key
   * @param {string} limiterName - Name of the limiter
   */
  async getRateLimitInfo(key, limiterName = 'default') {
    if (!this.redisClient) {
      return null;
    }

    try {
      const limiter = this.limiters.get(limiterName);
      if (!limiter) {
        return null;
      }

      const windowMs = limiter.windowMs;
      const max = limiter.max;
      const current = await this.redisClient.get(`${limiterName}:${key}`);
      const remaining = Math.max(0, max - (current || 0));
      const resetTime = new Date(Date.now() + windowMs);

      return {
        limit: max,
        remaining,
        reset: resetTime,
        resetTime: Math.ceil(resetTime.getTime() / 1000)
      };
    } catch (error) {
      logger.error('Failed to get rate limit info:', error);
      return null;
    }
  }

  /**
   * Reset rate limit for a key
   * @param {string} key - Rate limit key
   * @param {string} limiterName - Name of the limiter
   */
  async resetRateLimit(key, limiterName = 'default') {
    if (!this.redisClient) {
      return false;
    }

    try {
      await this.redisClient.del(`${limiterName}:${key}`);
      logger.info('Rate limit reset', { key, limiterName });
      return true;
    } catch (error) {
      logger.error('Failed to reset rate limit:', error);
      return false;
    }
  }

  /**
   * Get all active limiters
   */
  getLimiters() {
    return Array.from(this.limiters.keys());
  }

  /**
   * Close Redis connection
   */
  async close() {
    if (this.redisClient) {
      await this.redisClient.quit();
      logger.info('Redis connection closed for rate limiting');
    }
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

module.exports = rateLimiter;
