import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import logger from '../config/logger';

const uploadsRoot = path.resolve(process.cwd(), 'uploads');

if (!fs.existsSync(uploadsRoot)) {
    fs.mkdirSync(uploadsRoot, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsRoot);
    },
    filename: (_req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9_.-]+/g, '_');
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}-${safeName}`);
    },
});

const allowedMimes = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
    if (!allowedMimes.has(file.mimetype)) {
        logger.warn('upload:fileFilter:reject', { originalname: file.originalname, mimetype: file.mimetype });
        return cb(new Error('Unsupported file type'));
    }
    logger.info('upload:fileFilter:accept', { originalname: file.originalname, mimetype: file.mimetype, size: (file as any)?.size });
    cb(null, true);
}

const MAX_UPLOAD_MB = parseInt(process.env.MAX_UPLOAD_MB || '', 10) || 50; // default 50MB
export const uploadSingle = multer({ storage, fileFilter, limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 } }).single('file');

// Wrap to log start/end at middleware boundary if used directly
export function uploadSingleWithLogs(req: Request, res: any, next: any) {
    logger.info('upload:middleware:start');
    (uploadSingle as any)(req, res, (err: any) => {
        if (err) {
            logger.warn('upload:middleware:error', { error: { message: err?.message } });
            return next(err);
        }
        logger.info('upload:middleware:done', { filename: (req as any)?.file?.originalname, savedPath: (req as any)?.file?.path, sizeBytes: (req as any)?.file?.size });
        return next();
    });
}


