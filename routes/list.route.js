import { Router } from 'express';
import { header, cookie, param, query, body } from 'express-validator';
import rateLimiterMiddleware from '../middlewares/rate-limiter.middleware.js';
import authMiddleware from '../middlewares/authen.middleware.js';
import controllers from '../controllers/controllers.js';

const listController = controllers.list;

const router = Router();
router.use(rateLimiterMiddleware);

// List of sap products
router.get(
  '/sap-products-list',
  [
    query('q')
      .isLength({
        max: 50,
      })
      .default(''),
  ],
  authMiddleware.authentication,
  listController.sapProductsList,
);

export default router;
