import 'dotenv/config';
import models from '../models/models.js';

const User = models.user;
const Role = models.role;

User.hasOne(Role, {
  foreignKey: 'role_id',
  sourceKey: 'role_id',
});

/**
 * Authentication by checking token
 * @param {object} req
 * @param {object} res
 * @param {object} next
 * @returns {string} HTTP status code when auth token is invalid
 */
const authentication = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    return res.status(401).send({
      success: false,
      message: 'Unauthorized!',
    });
  }
};

const isAdmin = (req, res, next) => {
  User.findOne({
    where: { id: req.session.userId },
    include: [{ model: Role, required: true }],
  }).then((user) => {
    if (user.role.role_type === 'admin') {
      next();
      return;
    }

    res.status(403).send({
      success: false,
      message: 'Forbidden!',
    });
    return;
  });
};

const isHospitalOrAdmin = (req, res, next) => {
  User.findOne({
    where: { id: req.session.userId },
    include: [{ model: Role, required: true }],
  }).then((user) => {
    if (user.role.role_type === 'hospital') {
      next();
      return;
    }

    if (user.role.role_type === 'admin') {
      next();
      return;
    }

    res.status(403).send({
      success: false,
      message: 'Forbidden!',
    });
    return;
  });
};

const isSuperUserOrAdmin = (req, res, next) => {
  User.findOne({
    where: { id: req.session.userId },
    include: [{ model: Role, required: true }],
  }).then((user) => {
    if (user.role.role_type === 'superuser') {
      next();
      return;
    }

    if (user.role.role_type === 'admin') {
      next();
      return;
    }

    res.status(403).send({
      success: false,
      message: 'Forbidden!',
    });
    return;
  });
};

const auth = {
  authentication: authentication,
  isAdmin: isAdmin,
  isHospitalOrAdmin: isHospitalOrAdmin,
  isSuperUserOrAdmin: isSuperUserOrAdmin,
};

export default auth;
