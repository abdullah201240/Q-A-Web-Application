import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import logger from '../config/logger';

// OCR removed: do not attempt OCR for images or scanned PDFs

export async function extractTextFromFile(filePath: string, mimeType: string): Promise<string> {
    if (mimeType === 'application/pdf') {
        // Reject PDFs that contain any embedded images
        try {
            const bufferForScan = fs.readFileSync(filePath);
            if (pdfContainsImages(bufferForScan)) {
                throw new Error('PDF contains images which are not allowed');
            }
        } catch (e) {
            // If we fail to read/scan, reject to be safe
            throw new Error('Unable to verify PDF contents');
        }
        // Try native PDF text first
        try {
            const buffer = fs.readFileSync(filePath);
            logger.info('pdf-parse:start', { filePath, sizeBytes: buffer.length });
            const data = await pdfParse(buffer);
            const text = (data.text || '').trim();
            logger.info('pdf-parse:done', { filePath, chars: text.length });
            if (text.length > 1000) return normalizeWhitespace(text);
            // too little text, likely scanned
        } catch (err) {
            logger.warn('pdf-parse:failed', { filePath, error: (err as any)?.message });
            // pdf-parse can fail on some PDFs (e.g., token length). We fall back to OCR.
        }
        // Reject scanned/problematic PDFs; do not OCR
        logger.info('pdf-parse:insufficient-text', { filePath });
        throw new Error('PDF appears to be scanned or contains no extractable text');
    }
    if (
        mimeType === 'application/msword' ||
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
        logger.info('mammoth:start', { filePath });
        const { value } = await mammoth.extractRawText({ path: filePath });
        logger.info('mammoth:done', { filePath, chars: (value || '').length });
        return normalizeWhitespace(value || '');
    }
    // Explicitly reject images
    if (mimeType.startsWith('image/')) {
        throw new Error('Image files are not allowed');
    }
    throw new Error('Unsupported file type for extraction');
}

function normalizeWhitespace(text: string): string {
    return text.replace(/\r\n|\r/g, '\n').replace(/[\t\f\v]+/g, ' ').replace(/\u00A0/g, ' ').replace(/ +/g, ' ');
}

function pdfContainsImages(buffer: Buffer): boolean {
    // Simple and effective detection: look for image XObject declarations
    // The latin1 encoding preserves byte values while allowing string search
    const content = buffer.toString('latin1');
    return /\/Subtype\s*\/Image/.test(content);
}


