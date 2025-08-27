import 'dotenv/config';
import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import seqQuery from '../libs/raw-query.lib.js';
import models from '../models/models.js';
import logger from '../libs/winston-logger.lib.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Sign in with username & password
 * @param {object} req
 * @param {object} res
 * @returns {string} json
 */
const login = async (req, res) => {
  // Server-Side Validation
  const validate = validationResult(req);
  if (!validate.isEmpty()) {
    return res.status(422).json({ success: false, message: validate.array() });
  }

  const { username, password, remember } = req.body;
  const query = await seqQuery.exec(
    'SELECT * FROM sp_login(:_username, :_ip)',
    {
      _username: username,
      _ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress || '',
    },
  );
  const { success, data } = query;

  if (success) {
    if (data.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: 'User Not found.' });
    }

    const [userData] = data;
    if (!userData.is_enabled) {
      return res
        .status(401)
        .json({ success: false, message: 'Account is disabled.' });
    }

    const passwordIsValid = bcrypt.compareSync(password, userData.password);

    if (!passwordIsValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Password!',
      });
    }

    req.session.regenerate(function (err) {
      if (err) {
        logger.error(err);

        return res.status(500).json({ success: false, message: err.message });
      }

      let second = 60 * 60 * 8; // 8 hours
      if (remember) {
        second = 60 * 60 * 24 * 3; // 3 days
      }

      var cookieTime = new Date();
      cookieTime.setSeconds(cookieTime.getSeconds() + second);
      req.session.cookie.expires = cookieTime;

      // set session
      req.session.userId = userData.id;
      req.session.roleType = userData.role_type;
      req.session.nhso_code = userData.nhso_code;
      req.session.supplier_code = userData.supplier_code;

      req.session.save(function (err) {
        if (err) {
          logger.error(err);

          return res.status(500).json({ success: false, message: err.message });
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Successfully logged in',
        data: {
          userId: userData.id,
          username: username,
          displayName: userData.display_name,
          isResetPassword: userData.is_reset_password,
          roleType: userData.role_type,
        },
      });
    });
  } else {
    logger.error(query);

    return res
      .status(500)
      .json({ success: false, message: 'Internal Server Error' });
  }
};

/**
 * Sign out user
 * @param {object} req
 * @param {object} res
 * @returns {string} json
 */
const logout = async (req, res) => {
  req.session.userId = null;

  req.session.save(function (err) {
    if (err) next(err);

    req.session.regenerate(function (err) {
      if (err) {
        logger.error(err);

        return res.status(500).json({ success: false, message: err.message });
      }

      return res
        .status(200)
        .json({ success: true, message: 'Successfully logged out' });
    });
  });
};

/**
 * Check auth
 * @param {object} req
 * @param {object} res
 * @returns {string} json
 */
const isAuth = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Authorized! ',
  });
};

/**
 * Check admin
 * @param {object} req
 * @param {object} res
 * @returns {string} json
 */
const isAdmin = async (req, res) => {
  if (req.session.roleType === 'admin') {
    return res.status(200).json({
      success: true,
      message: 'Authorized! ',
    });
  }

  return res.status(403).json({
    success: false,
    message: 'Forbidden! ',
  });
};

/**
 * Check hospital or admin
 * @param {object} req
 * @param {object} res
 * @returns {string} json
 */
const isHospitalOrAdmin = async (req, res) => {
  if (req.session.roleType === 'hospital' || req.session.roleType === 'admin') {
    return res.status(200).json({
      success: true,
      message: 'Authorized! ',
    });
  }

  return res.status(403).json({
    success: false,
    message: 'Forbidden! ',
  });
};

/**
 * Check supperUser or admin
 * @param {object} req
 * @param {object} res
 * @returns {string} json
 */
const isSuperUserOrAdmin = async (req, res) => {
  if (
    req.session.roleType === 'superuser' ||
    req.session.roleType === 'admin'
  ) {
    return res.status(200).json({
      success: true,
      message: 'Authorized! ',
    });
  }

  return res.status(403).json({
    success: false,
    message: 'Forbidden! ',
  });
};

/**
 * Check auth by user id
 * @param {object} req
 * @param {object} res
 * @returns {string} json
 */
const isAuthUserid = async (req, res) => {
  if (req.session.userId === parseInt(req.params.userid)) {
    // check reset-password
    let isResetPwd = false;
    const query = await seqQuery.exec(
      'SELECT is_reset_password FROM users WHERE id = :id',
      {
        id: req.session.userId,
      },
    );

    const { success, data } = query;

    if (success) {
      let [firstElem] = data;
      isResetPwd = firstElem.is_reset_password;
    }

    return res.status(200).json({
      success: true,
      message: 'Authorized! ',
      data: {
        isResetPassword: isResetPwd,
      },
    });
  }

  return res.status(403).json({
    success: false,
    message: 'Forbidden! ',
  });
};

/**
 * Reset password
 * @param {object} req
 * @param {object} res
 * @returns {string} json
 */
const resetPassword = async (req, res) => {
  // Server-Side Validation
  const validate = validationResult(req);
  if (!validate.isEmpty()) {
    return res.status(422).json({ success: false, message: validate.array() });
  }

  const saltRounds = 12;

  const { id, username, newPassword } = req.body;

  const hashPassword = bcrypt.hashSync(newPassword, saltRounds);

  const query = await seqQuery.exec(
    'SELECT * FROM sp_reset_password(:_id, :_username, :_hash_password )',
    {
      _id: id,
      _username: username,
      _hash_password: hashPassword,
    },
  );

  const { success } = query;

  let statusCode = 500;
  if (success) {
    statusCode = 200;
  }

  return res.status(statusCode).json(query);
};

/**
 * Change password
 * @param {object} req
 * @param {object} res
 * @returns {string} json
 */
const changePassword = async (req, res) => {
  // Server-Side Validation
  const validate = validationResult(req);
  if (!validate.isEmpty()) {
    return res.status(422).json({ success: false, message: validate.array() });
  }

  const { password, newPassword } = req.body;

  // Check current password
  const queryCurrentPwd = await seqQuery.exec(
    'SELECT password FROM users WHERE id = :id',
    {
      id: req.session.userId,
    },
  );

  let currentPwd;
  const { success: successCurrentPwd, data: dataCurrentPwd } = queryCurrentPwd;
  if (successCurrentPwd) {
    let [firstElem] = dataCurrentPwd;
    currentPwd = firstElem.password;
  }

  const isPasswordValid = bcrypt.compareSync(password, currentPwd);

  if (!isPasswordValid) {
    return res.status(200).json({
      success: true,
      message: 'Incorrect password',
      data: [{ status: 409, message: 'Incorrect password' }],
    });
  }

  const hashPassword = bcrypt.hashSync(newPassword, 12);
  const query = await seqQuery.exec(
    'SELECT * FROM sp_change_password(:_password, :_hash_password, :_user_id)',
    {
      _password: password,
      _hash_password: hashPassword,
      _user_id: req.session.userId,
    },
  );

  const { success } = query;

  let statusCode = 500;
  if (success) {
    statusCode = 200;
  }

  return res.status(statusCode).json(query);
};

/**
 * Forget password
 * @param {object} req
 * @param {object} res
 * @returns {string} json
 */
const forgetPassword = async (req, res) => {
  // Server-Side Validation
  const validate = validationResult(req);
  if (!validate.isEmpty()) {
    return res.status(422).json({ success: false, message: validate.array() });
  }

  const { username, email } = req.body;

  const query = await seqQuery.exec(
    'SELECT * FROM sp_forget_password_check(:_username , :_email)',
    {
      _username: username,
      _email: email,
    },
  );
  const { data, success } = query;

  if ((!success, data.length === 0)) {
    return res.status(401).json({ success: false, message: 'User Not found.' });
  }

  if (success) {
    const userId = data[0].id;

    //  Genetator token
    const genToken = uuidv4();
    const queryToken = await seqQuery.exec(
      'SELECT * FROM sp_forget_password_create(:_username, :_tokens, :_user_id)',
      {
        _username: username,
        _tokens: genToken,
        _user_id: userId,
      },
    );

    let statusCode = 500;
    if (queryToken.success) {
      statusCode = 200;
    }
    if (!queryToken.success) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid Token!' });
    }

    const hostEmail = process.env.EMAIL_SMTP;
    const portEmail = process.env.EMAIL_PORT;
    const usrEmail = process.env.EMAIL_USER;
    const pasEmail = process.env.EMAIL_PASS;
    // create send from
    const transporter = nodemailer.createTransport({
      host: hostEmail,
      port: portEmail,
      secure: false,
      auth: {
        user: usrEmail,
        pass: pasEmail,
      },
    });

    if (queryToken.success) {
      ejs.renderFile(
        './views/formConfirm.ejs',
        { token: genToken },
        function (err, str) {
          if (err) {
            return res
              .status(401)
              .json({ success: false, message: 'Error Render File!' });
          } else {
            const mailOption = {
              from: process.env.EMAIL_USER,
              to: email,
              subject: 'Reset Password Stent mds.',
              html: str,
            };
            transporter.sendMail(mailOption, function (err) {
              if (err) {
                return res
                  .status(401)
                  .json({ success: false, message: 'Error Send to E-mail!' });
              }
            });
          }
        },
      );
    }

    return res.status(statusCode).json(queryToken);
  }
};

/*
 * Forget password token check
 * @param {object} req
 * @param {object} res
 * @returns {string} json
 */
const forgetPasswordTokenCheck = async (req, res) => {
  // Server-Side Validation
  const validate = validationResult(req);
  if (!validate.isEmpty()) {
    return res.status(422).json({ success: false, message: validate.array() });
  }

  const { token } = req.query;
  const query = await seqQuery.exec(
    'SELECT * FROM sp_forget_password_token_check(:_token)',
    {
      _token: token,
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
  login,
  logout,
  isAuth,
  isAdmin,
  isHospitalOrAdmin,
  isSuperUserOrAdmin,
  isAuthUserid,
  resetPassword,
  changePassword,
  forgetPassword,
  forgetPasswordTokenCheck,
};
