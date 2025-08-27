import 'dotenv/config';
import sequelize from 'sequelize';
import logger from './winston-logger.lib.js';

/**
 * Connect database with sequelize
 * @returns {Object} sequelize
 */
const getSequelize = function () {
  return new sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: process.env.DB_IP,
      dialect: process.env.DB_PROVIDER,
      port: process.env.DB_PORT,
      /**
       * Show logging on development env.
       * @param {object} msg
       */
      logging: function (msg) {
        if (process.env.NODE_ENV !== 'production') {
          logger.verbose(msg);
        }
      },
    },
  );
};

export default {
  getSequelize,
};
