import { Router } from 'express';
import authRoutes from './auth.routes';
import documentRoutes from './document.routes';
import conversationRoutes from './conversation.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);
router.use('/conversations', conversationRoutes);

export default router;