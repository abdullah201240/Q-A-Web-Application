import { NextFunction, Request, Response } from 'express';
import { ValidationError } from 'sequelize';
import type multer from 'multer';
import jwt from 'jsonwebtoken';
import logger from '../config/logger';

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
  logger.warn('Route not found', { path: req.path, method: req.method });
  res.status(404).json({ message: 'Not Found' });
};

export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  // Known typed error
  if (err instanceof ApiError) {
    logger.warn('API error', { path: req.path, method: req.method, statusCode: err.statusCode, message: err.message, details: err.details });
    return res.status(err.statusCode).json({ message: err.message, details: err.details });
  }

  // Sequelize validation errors
  if (err instanceof ValidationError) {
    logger.warn('Validation failed', { path: req.path, method: req.method, errors: err.errors.map(e => ({ message: e.message, path: e.path })) });
    return res.status(400).json({
      message: 'Validation failed',
      details: err.errors.map(e => ({ message: e.message, path: e.path })),
    });
  }

  // JWT-specific errors
  if (err instanceof jwt.JsonWebTokenError || err instanceof jwt.TokenExpiredError) {
    logger.warn('JWT error', { path: req.path, method: req.method, name: err.name, message: err.message });
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  // CORS error shape from our custom origin callback
  if (err && err.message === 'Not allowed by CORS') {
    logger.warn('CORS blocked', { origin: req.headers.origin });
    return res.status(403).json({ message: 'Origin not allowed' });
  }

  // Multer errors (file uploads)
  if (err && (err as multer.MulterError)?.code) {
    const mErr = err as multer.MulterError;
    if (mErr.code === 'LIMIT_FILE_SIZE') {
      logger.warn('Upload too large', { path: req.path, limit: process.env.MAX_UPLOAD_MB });
      return res.status(413).json({ message: 'Uploaded file is too large' });
    }
    logger.warn('Upload failed', { code: mErr.code, message: mErr.message });
    return res.status(400).json({ message: 'Upload failed', details: { code: mErr.code } });
  }

  if (err && err.message === 'Unsupported file type') {
    logger.warn('Unsupported file type', { path: req.path });
    return res.status(415).json({ message: 'Unsupported file type' });
  }

  // Fallback 500
  // Do not leak internals in production
  const isProd = process.env.NODE_ENV === 'production';
  const payload: Record<string, unknown> = { message: 'Internal Server Error' };
  if (!isProd) {
    payload.error = { message: err?.message, stack: err?.stack };
  }
  logger.error('Unhandled error', { path: req.path, method: req.method, error: { message: err?.message, stack: err?.stack } });
  return res.status(500).json(payload);
};


