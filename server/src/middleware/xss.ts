import { Request, Response, NextFunction } from 'express';

// Recursively sanitize strings in object
const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
        // Simple entity encoding to prevent XSS
        return obj.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }
    if (obj && typeof obj === 'object') {
        // Skip null
        if (obj === null) return null;

        // Handle arrays
        if (Array.isArray(obj)) {
            return obj.map(item => sanitize(item));
        }

        // Handle objects
        Object.keys(obj).forEach(key => {
            obj[key] = sanitize(obj[key]);
        });
    }
    return obj;
};

export const xssSanitizer = (req: Request, res: Response, next: NextFunction) => {
    if (req.body) req.body = sanitize(req.body);
    if (req.query) req.query = sanitize(req.query);
    if (req.params) req.params = sanitize(req.params);
    next();
};
