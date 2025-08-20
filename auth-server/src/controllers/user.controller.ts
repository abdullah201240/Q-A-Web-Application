import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/user.model';
import { ApiError } from '../middlewares/error.middleware';
import logger from '../config/logger';

const getEnv = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing required env var ${key}`);
  }
  return value;
};

const ACCESS_TOKEN_SECRET = getEnv('ACCESS_TOKEN_SECRET');
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

const signAccessToken = (userId: number) => {
  const secret = ACCESS_TOKEN_SECRET;
  return jwt.sign({ sub: userId }, secret, { expiresIn: ACCESS_TOKEN_TTL_SECONDS });
};

const signRefreshToken = (userId: number) => {
  const secret = getEnv('JWT_REFRESH_SECRET');
  return jwt.sign({ sub: userId }, secret, { expiresIn: REFRESH_TOKEN_TTL_SECONDS });
};

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required');
    }
    const existing = await User.scope('withSensitive').findOne({ where: { email } });
    if (existing) {
      throw new ApiError(409, 'Email already in use');
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashed });
    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);
    await User.update({ refreshToken }, { where: { id: user.id } });
    logger.info('User signed up', { userId: user.id, email: user.email });
    return res.status(201).json({ user: user.toJSON(), accessToken, refreshToken });
  } catch (error) {
    return next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required');
    }
    const user = await User.scope('withSensitive').findOne({ where: { email } });
    if (!user || !user.password) {
      throw new ApiError(401, 'Invalid credentials');
    }
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new ApiError(401, 'Invalid credentials');
    }
    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);
    await User.update({ refreshToken }, { where: { id: user.id } });
    logger.info('User logged in', { userId: user.id, email: user.email });
    return res.status(200).json({ user: user.toJSON(), accessToken, refreshToken });
  } catch (error) {
    return next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken) {
      throw new ApiError(400, 'Refresh token is required');
    }
    const secret = getEnv('JWT_REFRESH_SECRET');
    const decoded = jwt.verify(refreshToken, secret);
    if (typeof decoded === 'string' || decoded.sub == null) {
      throw new ApiError(401, 'Invalid refresh token');
    }
    const sub = typeof decoded.sub === 'string' ? parseInt(decoded.sub, 10) : (decoded.sub as number);
    if (!Number.isFinite(sub)) {
      throw new ApiError(401, 'Invalid refresh token');
    }
    const user = await User.scope('withSensitive').findByPk(sub);
    if (!user || user.refreshToken !== refreshToken) {
      throw new ApiError(401, 'Invalid refresh token');
    }
    const newAccess = signAccessToken(user.id);
    const newRefresh = signRefreshToken(user.id);
    await User.update({ refreshToken: newRefresh }, { where: { id: user.id } });
    logger.info('Token refreshed', { userId: user.id });
    return res.status(200).json({ accessToken: newAccess, refreshToken: newRefresh });
  } catch (error) {
    return next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken) {
      throw new ApiError(400, 'Refresh token is required');
    }
    const payload = jwt.decode(refreshToken) as { sub?: number } | null;
    if (payload?.sub) {
      await User.update({ refreshToken: null }, { where: { id: payload.sub } });
    }
    logger.info('User logged out', { userId: payload?.sub });
    return res.status(200).json({ message: 'Logged out' });
  } catch (error) {
    return next(error);
  }
};

export const profile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }
    const user = await User.findByPk(userId);
    if (!user) throw new ApiError(404, 'User not found');
    return res.json({ user: user.toJSON() });
  } catch (error) {
    return next(error);
  }
};


