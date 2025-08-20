import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from './error.middleware';
import logger from '../config/logger';

export interface AuthPayload {
  sub: number;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

const getEnv = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (!value) throw new Error(`Missing required env var ${key}`);
  return value;
};

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    logger.warn('Missing or malformed Authorization header', { path: req.path, method: req.method });
    return next(new ApiError(401, 'Unauthorized'));
  }
  const token = header.substring('Bearer '.length);
  try {
    const decoded = jwt.verify(token, getEnv('ACCESS_TOKEN_SECRET'));
    if (typeof decoded === 'string' || decoded.sub == null) {
      logger.warn('Invalid token payload', { path: req.path, method: req.method });
      return next(new ApiError(401, 'Unauthorized'));
    }
    const sub = typeof decoded.sub === 'string' ? parseInt(decoded.sub, 10) : (decoded.sub as number);
    if (!Number.isFinite(sub)) {
      logger.warn('Non-numeric sub in token', { path: req.path, method: req.method });
      return next(new ApiError(401, 'Unauthorized'));
    }
    req.auth = { sub };
    return next();
  } catch (e) {
    logger.warn('JWT verification failed', { path: req.path, method: req.method });
    return next(new ApiError(401, 'Unauthorized'));
  }
};


