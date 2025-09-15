import { Router } from 'express';
import { header, cookie, param, query, body } from 'express-validator';
import rateLimiterMiddleware from '../middlewares/rate-limiter.middleware.js';
import authMiddleware from '../middlewares/authen.middleware.js';
import controllers from '../controllers/controllers.js';

const adminController = controllers.admin;

const router = Router();
router.use(rateLimiterMiddleware);

// List of sap products
router.get(
  '/users-view',
  [
    query('q')
      .isLength({
        max: 50,
      })
      .default(''),
    query('page').notEmpty().isInt(),
    query('limit').notEmpty().isInt({ min: 1, max: 100 }),
    query('role').isLength({ max: 3 }).default(''),
  ],
  [authMiddleware.authentication, authMiddleware.isAdmin],
  adminController.usersView,
);

export default router;
