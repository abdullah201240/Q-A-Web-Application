import { Router } from 'express';
import { uploadSingleWithLogs } from '../middlewares/upload.middleware';
import { uploadDocument, getDocument, askQuestion, askGroqQuestion } from '../controllers/document.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/upload', requireAuth, (req, res, next) => uploadSingleWithLogs(req, res, (err: unknown) => (err ? next(err as any) : uploadDocument(req, res, next))));
router.get('/:id', requireAuth, getDocument);
router.post('/:id/ask', requireAuth, askQuestion);
router.post('/groq/ask', requireAuth, askGroqQuestion);

export default router;


