import 'dotenv/config';
import { validationResult } from 'express-validator';
import seqQuery from '../libs/raw-query.lib.js';
import models from '../models/models.js';
import logger from '../libs/winston-logger.lib.js';

/**
 * List of sap products
 * @param {object} req
 * @param {object} res
 * @returns {string} json
 */
const sapProductsList = async (req, res) => {
  // Server-Side Validation
  const validate = validationResult(req);
  if (!validate.isEmpty()) {
    return res.status(422).json({ success: false, message: validate.array() });
  }

  const { q } = req.query;
  const query = await seqQuery.exec('SELECT * FROM sp_sap_products_list(:_q)', {
    _q: q,
  });

  const { success } = query;

  let statusCode = 500;
  if (success) {
    statusCode = 200;
  }

  return res.status(statusCode).json(query);
};

export default {
  sapProductsList,
};
