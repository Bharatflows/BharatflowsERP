/**
 * Upload Middleware
 * Uses multer with memory storage — buffers are passed to Cloudinary.
 * Limits: 5 MB for images, 10 MB for documents.
 */

import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const DOC_MIME_TYPES   = ['application/pdf', 'application/vnd.ms-excel',
                          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                          'text/csv'];

// In-memory storage — no temp files on disk
const storage = multer.memoryStorage();

// Image uploads (logos, product photos, etc.)
export const uploadImage = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (_req, file, cb) => {
        if (IMAGE_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid file type. Allowed: ${IMAGE_MIME_TYPES.join(', ')}`));
        }
    },
});

// Document uploads (bank statements, bulk CSVs, etc.)
export const uploadDocument = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (_req, file, cb) => {
        const allowed = [...IMAGE_MIME_TYPES, ...DOC_MIME_TYPES];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid file type. Allowed types: images, PDF, Excel, CSV`));
        }
    },
});

// Error handler for multer errors
export function handleUploadError(err: any, _req: Request, res: Response, next: NextFunction) {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ success: false, message: 'File too large. Maximum size allowed is 10 MB.' });
        }
        return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
    next();
}
