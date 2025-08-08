const redis = require('redis');
const logger = require('../logger/logger');

class CacheManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  /**
   * Initialize Redis client
   */
  async initialize() {
    try {
      this.client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        password: process.env.REDIS_PASSWORD,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            logger.error('Redis server refused connection');
            return new Error('Redis server refused connection');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            logger.error('Redis retry time exhausted');
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            logger.error('Redis max retry attempts reached');
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        logger.error('Redis client error:', err);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        logger.info('Redis client disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Failed to initialize Redis client:', error);
      this.isConnected = false;
    }
  }

  /**
   * Set a key-value pair in cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   */
  async set(key, value, ttl = 3600) {
    if (!this.isConnected) {
      logger.warn('Redis not connected, skipping cache set');
      return false;
    }

    try {
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      await this.client.setEx(key, ttl, serializedValue);
      logger.debug('Cache set', { key, ttl });
      return true;
    } catch (error) {
      logger.error('Failed to set cache:', error);
      return false;
    }
  }

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @param {boolean} parseJson - Whether to parse JSON response
   */
  async get(key, parseJson = true) {
    if (!this.isConnected) {
      logger.warn('Redis not connected, skipping cache get');
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (value === null) {
        return null;
      }
      
      if (parseJson) {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      
      return value;
    } catch (error) {
      logger.error('Failed to get from cache:', error);
      return null;
    }
  }

  /**
   * Delete a key from cache
   * @param {string} key - Cache key
   */
  async del(key) {
    if (!this.isConnected) {
      logger.warn('Redis not connected, skipping cache delete');
      return false;
    }

    try {
      await this.client.del(key);
      logger.debug('Cache deleted', { key });
      return true;
    } catch (error) {
      logger.error('Failed to delete from cache:', error);
      return false;
    }
  }

  /**
   * Delete multiple keys from cache
   * @param {Array} keys - Array of cache keys
   */
  async delMultiple(keys) {
    if (!this.isConnected) {
      logger.warn('Redis not connected, skipping cache delete multiple');
      return false;
    }

    try {
      await this.client.del(keys);
      logger.debug('Multiple cache keys deleted', { keys });
      return true;
    } catch (error) {
      logger.error('Failed to delete multiple from cache:', error);
      return false;
    }
  }

  /**
   * Check if a key exists in cache
   * @param {string} key - Cache key
   */
  async exists(key) {
    if (!this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Failed to check cache existence:', error);
      return false;
    }
  }

  /**
   * Get TTL for a key
   * @param {string} key - Cache key
   */
  async ttl(key) {
    if (!this.isConnected) {
      return -1;
    }

    try {
      return await this.client.ttl(key);
    } catch (error) {
      logger.error('Failed to get cache TTL:', error);
      return -1;
    }
  }

  /**
   * Set hash field
   * @param {string} key - Hash key
   * @param {string} field - Field name
   * @param {*} value - Field value
   * @param {number} ttl - Time to live in seconds
   */
  async hset(key, field, value, ttl = 3600) {
    if (!this.isConnected) {
      return false;
    }

    try {
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      await this.client.hSet(key, field, serializedValue);
      if (ttl > 0) {
        await this.client.expire(key, ttl);
      }
      return true;
    } catch (error) {
      logger.error('Failed to set hash field:', error);
      return false;
    }
  }

  /**
   * Get hash field
   * @param {string} key - Hash key
   * @param {string} field - Field name
   * @param {boolean} parseJson - Whether to parse JSON response
   */
  async hget(key, field, parseJson = true) {
    if (!this.isConnected) {
      return null;
    }

    try {
      const value = await this.client.hGet(key, field);
      if (value === null) {
        return null;
      }
      
      if (parseJson) {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      
      return value;
    } catch (error) {
      logger.error('Failed to get hash field:', error);
      return null;
    }
  }

  /**
   * Get all hash fields
   * @param {string} key - Hash key
   * @param {boolean} parseJson - Whether to parse JSON values
   */
  async hgetall(key, parseJson = true) {
    if (!this.isConnected) {
      return null;
    }

    try {
      const hash = await this.client.hGetAll(key);
      if (Object.keys(hash).length === 0) {
        return null;
      }
      
      if (parseJson) {
        const result = {};
        for (const [field, value] of Object.entries(hash)) {
          try {
            result[field] = JSON.parse(value);
          } catch {
            result[field] = value;
          }
        }
        return result;
      }
      
      return hash;
    } catch (error) {
      logger.error('Failed to get all hash fields:', error);
      return null;
    }
  }

  /**
   * Delete hash field
   * @param {string} key - Hash key
   * @param {string} field - Field name
   */
  async hdel(key, field) {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.client.hDel(key, field);
      return true;
    } catch (error) {
      logger.error('Failed to delete hash field:', error);
      return false;
    }
  }

  /**
   * Increment a counter
   * @param {string} key - Cache key
   * @param {number} increment - Increment value
   * @param {number} ttl - Time to live in seconds
   */
  async incr(key, increment = 1, ttl = 3600) {
    if (!this.isConnected) {
      return null;
    }

    try {
      const result = await this.client.incrBy(key, increment);
      if (ttl > 0) {
        await this.client.expire(key, ttl);
      }
      return result;
    } catch (error) {
      logger.error('Failed to increment counter:', error);
      return null;
    }
  }

  /**
   * Set with pattern matching
   * @param {string} pattern - Key pattern
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   */
  async setPattern(pattern, value, ttl = 3600) {
    if (!this.isConnected) {
      return false;
    }

    try {
      const keys = await this.client.keys(pattern);
      const pipeline = this.client.pipeline();
      
      for (const key of keys) {
        const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
        pipeline.setEx(key, ttl, serializedValue);
      }
      
      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error('Failed to set pattern:', error);
      return false;
    }
  }

  /**
   * Delete by pattern
   * @param {string} pattern - Key pattern
   */
  async delPattern(pattern) {
    if (!this.isConnected) {
      return false;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      logger.error('Failed to delete pattern:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    if (!this.isConnected) {
      return null;
    }

    try {
      const info = await this.client.info();
      const memory = await this.client.memoryUsage();
      
      return {
        info: info.split('\r\n').reduce((acc, line) => {
          const [key, value] = line.split(':');
          if (key && value) {
            acc[key] = value;
          }
          return acc;
        }, {}),
        memory
      };
    } catch (error) {
      logger.error('Failed to get cache stats:', error);
      return null;
    }
  }

  /**
   * Clear all cache
   */
  async clear() {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.client.flushDb();
      logger.info('Cache cleared');
      return true;
    } catch (error) {
      logger.error('Failed to clear cache:', error);
      return false;
    }
  }

  /**
   * Close Redis connection
   */
  async close() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis connection closed');
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.client.ping();
      return true;
    } catch (error) {
      logger.error('Cache health check failed:', error);
      return false;
    }
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

module.exports = cacheManager;
