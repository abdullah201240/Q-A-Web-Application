import { Request, Response, NextFunction } from 'express';
import Conversation from '../models/conversation.model';
import Message from '../models/message.model';
import ConversationDocument from '../models/conversation_document.model';
import Document from '../models/document.model';
import logger from '../config/logger';

export async function listConversations(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.auth?.sub;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        const rows = await Conversation.findAll({ where: { userId }, order: [['updatedAt', 'DESC']] });
        return res.json({ conversations: rows.map(r => ({ id: r.id, title: r.title, updatedAt: r.updatedAt })) });
    } catch (err) {
        return next(err);
    }
}

export async function getConversation(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.auth?.sub;
        const id = parseInt(req.params.id, 10);
        const convo = await Conversation.findByPk(id);
        if (!convo || convo.userId !== userId) return res.status(404).json({ message: 'Not found' });
        const messages = await Message.findAll({ where: { conversationId: id }, order: [['createdAt', 'ASC']] });
        const docLinks = await ConversationDocument.findAll({ where: { conversationId: id } });
        return res.json({ id: convo.id, title: convo.title, messages: messages.map(m => ({ id: m.id, role: m.role, content: m.content, attachments: m.attachmentsJson ? JSON.parse(m.attachmentsJson) : undefined })), documentIds: docLinks.map(l => l.documentId) });
    } catch (err) {
        return next(err);
    }
}

export async function createConversation(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.auth?.sub;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        const title = (req.body?.title as string | undefined) || 'New chat';
        const convo = await Conversation.create({ userId, title });
        // Seed with assistant greeting to match client behavior
        await Message.create({ conversationId: convo.id, role: 'assistant', content: 'Hi! How can I help you today?' });
        return res.status(201).json({ id: convo.id, title: convo.title });
    } catch (err) {
        return next(err);
    }
}

export async function deleteConversation(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.auth?.sub;
        const id = parseInt(req.params.id, 10);
        const convo = await Conversation.findByPk(id);
        if (!convo || convo.userId !== userId) return res.status(404).json({ message: 'Not found' });
        await Message.destroy({ where: { conversationId: id } });
        await ConversationDocument.destroy({ where: { conversationId: id } });
        await Conversation.destroy({ where: { id } });
        return res.status(204).send();
    } catch (err) {
        return next(err);
    }
}

export async function addMessage(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.auth?.sub;
        const id = parseInt(req.params.id, 10);
        const convo = await Conversation.findByPk(id);
        if (!convo || convo.userId !== userId) return res.status(404).json({ message: 'Not found' });
        const { role, content, attachments } = req.body as { role?: 'user' | 'assistant'; content?: string; attachments?: unknown };
        if (!role || !content) return res.status(400).json({ message: 'role and content are required' });
        const msg = await Message.create({ conversationId: id, role, content, attachmentsJson: attachments ? JSON.stringify(attachments) : null });
        await convo.update({ updatedAt: new Date() });
        return res.status(201).json({ id: msg.id });
    } catch (err) {
        return next(err);
    }
}

export async function linkDocuments(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.auth?.sub;
        const id = parseInt(req.params.id, 10);
        const convo = await Conversation.findByPk(id);
        if (!convo || convo.userId !== userId) return res.status(404).json({ message: 'Not found' });
        const { documentIds } = req.body as { documentIds?: number[] };
        if (!Array.isArray(documentIds)) return res.status(400).json({ message: 'documentIds is required' });
        // Validate that documents belong to the user
        const docs = await Document.findAll({ where: { id: documentIds } });
        const invalid = docs.some(d => d.userId !== userId);
        if (invalid) return res.status(403).json({ message: 'Forbidden' });
        // Upsert links
        for (const docId of documentIds) {
            await ConversationDocument.findOrCreate({ where: { conversationId: id, documentId: docId }, defaults: { conversationId: id, documentId: docId } });
        }
        return res.status(200).json({ ok: true });
    } catch (err) {
        return next(err);
    }
}


