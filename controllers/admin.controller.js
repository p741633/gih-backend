import 'dotenv/config';
import { validationResult } from 'express-validator';
import seqQuery from '../libs/raw-query.lib.js';
import logger from '../libs/winston-logger.lib.js';

/**
 * List of users
 * @param {object} req
 * @param {object} res
 * @returns {string} json
 */
const usersView = async (req, res) => {
  // Server-Side Validation
  const validate = validationResult(req);
  if (!validate.isEmpty()) {
    return res.status(422).json({ success: false, message: validate.array() });
  }

  const { q, page, limit, role } = req.query;
  const query = await seqQuery.exec(
    'SELECT * FROM sp_users_view(:_q, :_page, :_limit, :_role)',
    {
      _q: q,
      _page: page,
      _limit: limit,
      _role: role,
    },
  );

  const { success } = query;

  let statusCode = 500;
  if (success) {
    statusCode = 200;
  }

  return res.status(statusCode).json(query);
};

export default {
  usersView,
};
