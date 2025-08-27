import 'dotenv/config';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

const rotateFile = './logs/gih-backend-%DATE%.log';
const logFile = './logs/gih-backend.log';
const appName = 'gih-backend';

const DailyRotateFile = new winston.transports.DailyRotateFile({
  filename: rotateFile,
  datePattern: 'DD-MM-YYYY',
  zippedArchive: true,
  maxSize: '5m',
  maxFiles: '7d',
});

/** Set timezone */
const timezoned = () =>
  new Date().toLocaleString('en-GB', {
    timeZone: 'Asia/Bangkok',
  });

/**
 * Log level
 * error: 0
 * warn: 1
 * info: 2
 * http: 3
 * verbose: 4
 * debug: 5
 * silly: 6
 */
const level = process.env.NODE_ENV === 'production' ? 'warn' : 'verbose';

/** Options for logger object */
const options = {
  file: {
    json: true,
    filename: logFile,
    maxsize: 5242880, // 5MB
    maxFiles: 1,
    format: winston.format.combine(
      winston.format.timestamp({ format: timezoned }),
      winston.format.simple(),
    ),
  },
  console: {
    json: false,
    colorize: true,
    format: winston.format.prettyPrint(),
  },
};

/** Logger object with above defined options */
const logger = winston.createLogger({
  defaultMeta: { application: appName },
  level,
  handleExceptions: true,
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [DailyRotateFile, new winston.transports.File(options.file)],
  exitOnError: false,
});

/** If not in production then log to the 'console' */
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console(options.console));
}

/** Write log file */
logger.stream = {
  write(message) {
    logger.info(message);
  },
};

export default logger;
