import { Request, Response, NextFunction } from 'express';
import Document from '../models/document.model';
import path from 'path';
import { extractTextFromFile } from '../services/text-extraction.service';
import { fetch } from 'undici';
import logger from '../config/logger';
import fs from 'fs';

interface GroqMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

async function callGroqAPI(messages: GroqMessage[], model: string = 'openai/gpt-oss-20b') {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error('GROQ_API_KEY is not set in environment variables');
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model,
            temperature: 1,
            max_completion_tokens: 8192,
            top_p: 1,
            stream: true,
            reasoning_effort: 'medium',
            stop: null,
            messages,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Groq API error: ${error}`);
    }

    const data = await response.json() as {
        choices: Array<{
            message: {
                content: string;
            };
        }>;
    };
    return data.choices[0]?.message?.content || '';
}

const MAX_TEXT_CHARS = parseInt(process.env.MAX_TEXT_CHARS || '', 10) || 1_000_000; // 1M chars cap to avoid OOM

export async function uploadDocument(req: Request, res: Response, next: NextFunction) {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const { originalname, mimetype, size, path: storagePath } = file as any;

        const startAll = Date.now();
        logger.info('upload:start', { filename: originalname, mimetype, sizeBytes: size });

        const startExtract = Date.now();
        logger.info('extract:start', { filename: originalname, mimetype });
        let extracted: string;
        try {
            extracted = await extractTextFromFile(storagePath, mimetype);
        } catch (e) {
            const message = (e as any)?.message || 'Unable to extract text from the provided file';
            logger.warn('extract:failed', { filename: originalname, mimetype, error: message });
            try { fs.unlinkSync(storagePath); } catch {}
            return res.status(422).json({ message });
        }
        const textContent = (extracted || '').slice(0, MAX_TEXT_CHARS);
        logger.info('extract:done', { filename: originalname, durationMs: Date.now() - startExtract, chars: textContent.length });
        if (!textContent || textContent.trim().length === 0) {
            try { fs.unlinkSync(storagePath); } catch {}
            return res.status(422).json({ message: 'Unable to extract text from the provided file' });
        }

        const userId = req.auth?.sub;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const relativePath = `/uploads/${path.basename(storagePath)}`;

        const startCreateDoc = Date.now();
        logger.info('db:document:create:start', { filename: originalname, chars: textContent.length });
        const doc = await Document.create({
            userId,
            originalFilename: originalname,
            mimeType: mimetype,
            sizeBytes: size,
            storagePath: relativePath,
            textContent: textContent,
        });
        logger.info('db:document:create:done', { documentId: doc.id, durationMs: Date.now() - startCreateDoc });

        const mem = process.memoryUsage();
        logger.info('upload:done', { documentId: doc.id, totalDurationMs: Date.now() - startAll, rss: mem.rss, heapUsed: mem.heapUsed, heapTotal: mem.heapTotal });
        return res.status(201).json({ id: doc.id });
    } catch (err) {
        const mem = process.memoryUsage();
        logger.error('upload:error', { error: { message: (err as any)?.message, stack: (err as any)?.stack }, rss: mem.rss, heapUsed: mem.heapUsed, heapTotal: mem.heapTotal });
        return next(err);
    }
}

export async function getDocument(req: Request, res: Response, next: NextFunction) {
    try {
        const id = parseInt(req.params.id, 10);
        const doc = await Document.findByPk(id);
        if (!doc) return res.status(404).json({ message: 'Not found' });
        return res.json({ id: doc.id, originalFilename: doc.originalFilename, sizeBytes: doc.sizeBytes, mimeType: doc.mimeType, createdAt: doc.createdAt });
    } catch (err) {
        return next(err);
    }
}

export async function askGroqQuestion(req: Request, res: Response, next: NextFunction) {
    try {
        const { messages, model } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ message: 'Messages array is required' });
        }

        const response = await callGroqAPI(messages, model);
        return res.json({ response });

    } catch (error) {
        logger.error('Error calling Groq API:', error);
        return next(error);
    }
}

export async function askQuestion(req: Request, res: Response, next: NextFunction) {
    try {
        const id = parseInt(req.params.id, 10);
        const { question } = req.body as { question: string };
        if (!question) return res.status(400).json({ message: 'Question is required' });
        const doc = await Document.findByPk(id);
        if (!doc) return res.status(404).json({ message: 'Not found' });

        const groqApiKey = process.env.GROQ_API_KEY || process.env.GROQ_API_TOKEN;
        if (!groqApiKey) return res.status(500).json({ message: 'Groq API key not configured' });

        // Use full text content with a hard cap of 90,000 words
        const MAX_WORDS = 90_000;
        const fullText = (doc.textContent || '').trim();
        const words = fullText.length ? fullText.split(/\s+/g) : [];
        const truncatedText = words.length > MAX_WORDS ? words.slice(0, MAX_WORDS).join(' ') : fullText;
        const context = truncatedText;
        
        // Log the text content being passed to the model
        logger.info('model:input', { 
            documentId: doc.id,
            originalLength: fullText.length,
            truncatedLength: context.length,
            first100Chars: context.slice(0, 100) + (context.length > 100 ? '...' : ''),
            last100Chars: context.length > 100 ? '...' + context.slice(-100) : ''
        });
        
        // Log full text to console (be careful with large texts in production)
        console.log('=== MODEL INPUT TEXT ===');
        console.log(context);
        console.log('=== END OF MODEL INPUT TEXT ===');

        const payload = {
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: 'You are an assistant that answers questions based only on the provided PDF context.' },
                { role: 'user', content: `Context:\n${context}\n\nQuestion: ${question}` },
            ],
        };

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const txt = await response.text();
            logger.error('model:error', { status: response.status, statusText: response.statusText, detail: txt });
            return res.status(502).json({ message: 'Groq API error', detail: txt });
        }
        
        type GroqChatResponse = { choices?: Array<{ message?: { content?: string } }>; };
        const data = (await response.json()) as GroqChatResponse;
        const modelResponse = data.choices?.[0]?.message?.content ?? '';
        
        // Log the model's response
        logger.info('model:output', { 
            responseLength: modelResponse.length,
            first100Chars: modelResponse.slice(0, 100) + (modelResponse.length > 100 ? '...' : '')
        });
        
        // Log full response to console
        console.log('\n=== MODEL OUTPUT ===');
        console.log(modelResponse);
        console.log('=== END OF MODEL OUTPUT ===\n');
        
        return res.json({ answer: modelResponse });
    } catch (err) {
        return next(err);
    }
}


