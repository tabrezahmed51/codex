import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../utils/config';
import logger from '../utils/logger';

export const rateLimitMiddleware = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
    });
  },
});

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`Unhandled error: ${error.message}`, { 
    stack: error.stack,
    url: req.url,
    method: req.method,
  });

  res.status(500).json({
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? error.message : 'Something went wrong',
  });
};

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });

  next();
};

export const validateContentType = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'POST' && !req.is('application/json')) {
    return res.status(400).json({
      error: 'Content-Type must be application/json',
    });
  }
  next();
};
