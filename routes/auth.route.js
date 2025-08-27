import { Router } from 'express';
import { header, cookie, param, query, body } from 'express-validator';
import rateLimiterMiddleware from '../middlewares/rate-limiter.middleware.js';
import authMiddleware from '../middlewares/authen.middleware.js';
import controllers from '../controllers/controllers.js';

const authController = controllers.auth;

const router = Router();
router.use(rateLimiterMiddleware);

// Login
router.post(
  '/login',
  [
    body('username').notEmpty().isLength({
      max: 30,
    }),
    body('password').notEmpty().isLength({
      max: 100,
    }),
    body('remember').isBoolean(),
  ],
  authController.login,
);

// Logout
router.get('/logout', authController.logout);

// Check authenticate
router.get('/is-auth', authMiddleware.authentication, authController.isAuth);

// Check authorize is admin
router.get('/is-admin', authMiddleware.authentication, authController.isAdmin);

// Check authorize is hospital or admin
router.get(
  '/is-hospital-admin',
  authMiddleware.authentication,
  authController.isHospitalOrAdmin,
);

// Check authorize is superuser or admin
router.get(
  '/is-superUser-admin',
  authMiddleware.authentication,
  authController.isSuperUserOrAdmin,
);

// Check authorize with userid
router.get(
  '/is-auth-userid/:userid',
  [param('userid').notEmpty().isInt()],
  authMiddleware.authentication,
  authController.isAuthUserid,
);

// Reset password
router.put(
  '/reset-password',
  [
    body('id').notEmpty().isInt(),
    body('username').notEmpty(),
    body('newPassword')
      .exists()
      .isLength({
        max: 100,
      })
      .isStrongPassword(),
    body('confirmPassword')
      .exists()
      .custom((value, { req }) => value === req.body.newPassword),
  ],
  authController.resetPassword,
);

// Change password
router.put(
  '/change-password',
  [
    body('password').notEmpty().isLength({
      max: 100,
    }),
    body('newPassword')
      .exists()
      .isLength({
        max: 100,
      })
      .isStrongPassword(),
    body('confirmPassword')
      .exists()
      .custom((value, { req }) => value === req.body.newPassword),
  ],
  authMiddleware.authentication,
  authController.changePassword,
);

// Forget password
router.post(
  '/forget-password',
  [
    body('username').notEmpty().isLength({
      max: 30,
    }),
    body('email').isEmail().notEmpty().isLength({
      max: 50,
    }),
  ],
  authController.forgetPassword,
);

// Forget password token check
router.get(
  '/forget-password-token-check',
  [
    query('token').notEmpty().isLength({
      max: 255,
    }),
  ],
  authController.forgetPasswordTokenCheck,
);

export default router;
