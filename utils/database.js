const mongoose = require('mongoose');
const logger = require('../logger/logger');

class Database {
  constructor() {
    this.connection = null;
  }

  async connect(uri) {
    try {
      this.connection = await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      
      logger.info('Database connected successfully');
      return this.connection;
    } catch (error) {
      logger.error('Database connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        logger.info('Database disconnected successfully');
      }
    } catch (error) {
      logger.error('Database disconnection failed:', error);
      throw error;
    }
  }

  getConnection() {
    return this.connection;
  }
}

module.exports = new Database(); 