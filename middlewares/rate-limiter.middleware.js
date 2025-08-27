import 'dotenv/config';
import { RateLimiterMongo } from 'rate-limiter-flexible';
import { MongoClient } from 'mongodb';

// Connect mongoDB
const mongoProvider = process.env.MONGO_PROVIDER;
const mongoUser = process.env.MONGO_USER;
const mongoPass = process.env.MONGO_PASS;
const mongoIP = process.env.MONGO_IP;
const mongoPort = process.env.MONGO_PORT;
const mongoName = process.env.MONGO_NAME;
const mongoURI = `${mongoProvider}://${mongoUser}:${mongoPass}@${mongoIP}:${mongoPort}/${mongoName}`;
const mongoConnect = MongoClient.connect(mongoURI);

// Default ratelimiter options
let points = 120;
let duration = 20;

// Exclude ratelimiter except production env
if (process.env.NODE_ENV !== 'production') {
  points = 99999;
  duration = 1;
}

// Ratelimiter options
const opts = {
  points,
  duration, // Per second
  storeClient: mongoConnect,
  dbName: mongoName,
  tableName: 'rate-limit',
  blockDuration: 60 * 10, // Block for 5 minute, if 10 wrong attempts per second
};

// Ratelimit middleware
const rateLimiterMongo = new RateLimiterMongo(opts);

/**
 *
 * @param {object} req
 * @param {object} res
 * @param {object} next
 * @returns {string} HTTP status code when rate limit reach
 */
const rateLimiterMiddleware = (req, res, next) => {
  rateLimiterMongo
    .consume(req.headers['x-forwarded-for'] || req.connection.remoteAddress)
    .then(() => {
      next();
    })
    .catch(() => {
      return res
        .status(429)
        .json({ success: false, message: 'Too Many Requests' });
    });
};

export default rateLimiterMiddleware;
