import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { listConversations, getConversation, createConversation, deleteConversation, addMessage, linkDocuments } from '../controllers/conversation.controller';

const router = Router();

router.get('/', requireAuth, listConversations);
router.post('/', requireAuth, createConversation);
router.get('/:id', requireAuth, getConversation);
router.delete('/:id', requireAuth, deleteConversation);
router.post('/:id/messages', requireAuth, addMessage);
router.post('/:id/documents', requireAuth, linkDocuments);

export default router;


