import { NextFunction, Request, Response } from 'express';
import { ValidationError } from 'sequelize';
import jwt from 'jsonwebtoken';

export class ApiError extends Error {
  public statusCode: number;
  public details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const notFoundHandler = (req: Request, res: Response, _next: NextFunction) => {
  res.status(404).json({ message: 'Not Found' });
};

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  // Known typed error
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ message: err.message, details: err.details });
  }

  // Sequelize validation errors
  if (err instanceof ValidationError) {
    return res.status(400).json({
      message: 'Validation failed',
      details: err.errors.map(e => ({ message: e.message, path: e.path })),
    });
  }

  // JWT-specific errors
  if (err instanceof jwt.JsonWebTokenError || err instanceof jwt.TokenExpiredError) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  // CORS error shape from our custom origin callback
  if (err && err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'Origin not allowed' });
  }

  // Fallback 500
  // Do not leak internals in production
  const isProd = process.env.NODE_ENV === 'production';
  const payload: Record<string, unknown> = { message: 'Internal Server Error' };
  if (!isProd) {
    payload.error = { message: err?.message, stack: err?.stack };
  }
  return res.status(500).json(payload);
};


