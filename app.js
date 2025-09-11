import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import serveStatic from 'serve-static';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import errorHandler from 'errorhandler';
import bodyParser from 'body-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import logger from './libs/winston-logger.lib.js';
import {
  swaggerServe,
  swaggerSetup,
} from './middlewares/swagger-ui.middleware.js';
import routes from './routes/routes.js';

const mongoProvider = process.env.MONGO_PROVIDER;
const mongoUser = process.env.MONGO_USER;
const mongoPass = process.env.MONGO_PASS;
const mongoIP = process.env.MONGO_IP;
const mongoPort = process.env.MONGO_PORT;
const mongoName = process.env.MONGO_NAME;
const mongoURI = `${mongoProvider}://${mongoUser}:${mongoPass}@${mongoIP}:${mongoPort}/${mongoName}`;

const app = express();
const basepath = process.env.BASE_PATH;
const morganFormat =
  process.env.NODE_ENV === 'production' ? 'combined' : 'common';
const corsOptions = {
  origin: JSON.parse(process.env.CORS_LIST),
  credentials: true,
  exposedHeaders: ['set-cookie'],
};

/** Indicates the app is behind a front-facing proxy. */
app.enable('trust proxy');

/** Cookie for req.cookie */
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    name: 'gih.id',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: mongoURI,
    }),
    cookie: {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    },
  }),
);

/** Helmet protection */
app.use(helmet());

/** Gzip compression */
app.use(compression());

/** Serve static */
app.use(basepath + 'temp', serveStatic('./temp'));

/** body-parser settings */
app.use(
  bodyParser.json({
    limit: 8000 * 1000, // 8mb
  }),
); // Support json encoded bodies
app.use(
  bodyParser.urlencoded({
    limit: 8000 * 1000, // 8mb
    extended: true,
  }),
);

/** API route enable cors with options */
app.use(basepath, cors(corsOptions), routes.auth);
app.use(basepath, cors(corsOptions), routes.list);

/**
 * Switch environment
 */
switch (process.env.NODE_ENV) {
  case 'development':
    /** Logfile */
    app.use(
      morgan(morganFormat, {
        stream: {
          write: (message) => logger.http(message.trim()),
        },
      }),
    );

    /** Swagger UI */
    app.use(basepath + 'api-docs', swaggerServe, swaggerSetup);

    /** Display error detail  */
    app.use(errorHandler());

    break;
  case 'production':
    /** Logfile (statusCode >= 400) */
    app.use(
      morgan(morganFormat, {
        skip: function (req, res) {
          return res.statusCode < 400;
        },
        stream: {
          write: (message) => logger.http(message.trim()),
        },
      }),
    );

    /** Display Internal Server Error */
    app.use(function (err, req, res, next) {
      res.status(err.status || 500).json({
        success: false,
        message: 'Internal Server Error',
      });
    });

    /** Display Not Found */
    app.use(function (req, res, next) {
      res.status(404).json({
        success: false,
        message: 'Not Found',
      });
    });
}

/** Start server */
app.listen(process.env.SERVER_PORT, () => {
  logger.info(`GIH-API app listening on port ${process.env.SERVER_PORT}`);
});
