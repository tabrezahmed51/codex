import winston from 'winston';
import path from 'path';

const createLogger = () => {
  const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  );

  const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.simple(),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      return `${timestamp} [${level}]: ${message}${stack ? '\n' + stack : ''}`;
    })
  );

  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'telegram-bot-emulator' },
    transports: [
      new winston.transports.File({
        filename: path.join(__dirname, '../../logs/error.log'),
        level: 'error',
      }),
      new winston.transports.File({
        filename: path.join(__dirname, '../../logs/combined.log'),
      }),
      new winston.transports.Console({
        format: consoleFormat,
      }),
    ],
  });
};

export const logger = createLogger();

export default logger;
