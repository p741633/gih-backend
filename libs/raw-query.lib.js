import connectdb from './connect-db.lib.js';
import logger from './winston-logger.lib.js';

const sequelize = new connectdb.getSequelize();

/**
 * Sequelize raw query warpper
 * @param {string} sql
 * @param {object} params
 * @returns {object} json
 */
async function exec(sql, params) {
  return sequelize
    .authenticate()
    .then(() => {
      return sequelize
        .query(sql, {
          replacements: params,
          type: sequelize.QueryTypes.SELECT,
        })
        .then((result) => {
          logger.verbose('Query data successfully', {
            sql,
            params,
            data: result,
          });

          return {
            success: true,
            message: 'Query data successfully',
            data: result,
          };
        })
        .catch((e) => {
          logger.error('Unable to query data !', {
            sql,
            params,
            data: e.message,
          });

          return {
            success: false,
            message: 'Unable to query data !',
            data: e.message,
          };
        });
    })
    .catch((e) => {
      logger.error('Unable to connect to the database !', {
        sql,
        params,
        data: e.message,
      });

      return {
        success: false,
        message: 'Unable to connect to the database !',
        data: e.message,
      };
    });
}

export default {
  exec,
};
