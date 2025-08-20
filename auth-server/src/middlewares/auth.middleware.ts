import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from './error.middleware';

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
    return next(new ApiError(401, 'Unauthorized'));
  }
  const token = header.substring('Bearer '.length);
  try {
    const decoded = jwt.verify(token, getEnv('JWT_ACCESS_SECRET'));
    if (typeof decoded === 'string' || decoded.sub == null) {
      return next(new ApiError(401, 'Unauthorized'));
    }
    const sub = typeof decoded.sub === 'string' ? parseInt(decoded.sub, 10) : (decoded.sub as number);
    if (!Number.isFinite(sub)) {
      return next(new ApiError(401, 'Unauthorized'));
    }
    req.auth = { sub };
    return next();
  } catch (e) {
    return next(new ApiError(401, 'Unauthorized'));
  }
};


