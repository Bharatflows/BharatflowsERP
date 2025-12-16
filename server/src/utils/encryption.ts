/**
 * Encryption Utility - AES-256-GCM
 * Used for encrypting sensitive data at rest (bank details, GSTIN, PAN, etc.)
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits auth tag
const ENCODING: BufferEncoding = 'hex';

/**
 * Get encryption key from environment
 * Must be 32 bytes (64 hex characters)
 */
function getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;

    if (!key) {
        throw new Error('ENCRYPTION_KEY environment variable is not set');
    }

    // Key should be 64 hex characters (32 bytes)
    if (key.length !== 64) {
        throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
    }

    return Buffer.from(key, 'hex');
}

/**
 * Generate a secure encryption key
 * Use this once to generate a key and store in .env
 */
export function generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Encrypt a string using AES-256-GCM
 * Returns: iv:authTag:encryptedData (all in hex)
 */
export function encrypt(plaintext: string): string {
    if (!plaintext) return plaintext;

    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', ENCODING);
    encrypted += cipher.final(ENCODING);

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encryptedData
    return `${iv.toString(ENCODING)}:${authTag.toString(ENCODING)}:${encrypted}`;
}

/**
 * Decrypt a string encrypted with encrypt()
 * Input format: iv:authTag:encryptedData (all in hex)
 */
export function decrypt(ciphertext: string): string {
    if (!ciphertext) return ciphertext;

    // Check if it's already decrypted (doesn't have the expected format)
    if (!ciphertext.includes(':')) {
        return ciphertext;
    }

    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
        // Not encrypted or invalid format
        return ciphertext;
    }

    const [ivHex, authTagHex, encryptedHex] = parts;

    try {
        const key = getEncryptionKey();
        const iv = Buffer.from(ivHex, ENCODING);
        const authTag = Buffer.from(authTagHex, ENCODING);
        const encrypted = Buffer.from(encryptedHex, ENCODING);

        // Validate lengths
        if (iv.length !== IV_LENGTH || authTag.length !== TAG_LENGTH) {
            return ciphertext; // Invalid format, return as-is
        }

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString('utf8');
    } catch (error) {
        // If decryption fails, return original (might not be encrypted)
        console.error('Decryption failed:', error);
        return ciphertext;
    }
}

/**
 * Check if a string is encrypted (has correct format)
 */
export function isEncrypted(value: string): boolean {
    if (!value || typeof value !== 'string') return false;

    const parts = value.split(':');
    if (parts.length !== 3) return false;

    const [ivHex, authTagHex] = parts;

    // Check hex format and lengths
    try {
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        return iv.length === IV_LENGTH && authTag.length === TAG_LENGTH;
    } catch {
        return false;
    }
}

/**
 * Create a searchable hash of data (for looking up encrypted fields)
 * Uses HMAC-SHA256 for consistent one-way hashing
 */
export function hashForSearch(plaintext: string): string {
    if (!plaintext) return plaintext;

    const key = getEncryptionKey();
    return crypto.createHmac('sha256', key)
        .update(plaintext.toLowerCase().trim())
        .digest('hex');
}

/**
 * Encrypt an object's specified fields
 */
export function encryptFields<T extends Record<string, any>>(
    obj: T,
    fieldsToEncrypt: (keyof T)[]
): T {
    const result = { ...obj };

    for (const field of fieldsToEncrypt) {
        if (result[field] && typeof result[field] === 'string') {
            result[field] = encrypt(result[field]) as T[keyof T];
        }
    }

    return result;
}

/**
 * Decrypt an object's specified fields
 */
export function decryptFields<T extends Record<string, any>>(
    obj: T,
    fieldsToDecrypt: (keyof T)[]
): T {
    const result = { ...obj };

    for (const field of fieldsToDecrypt) {
        if (result[field] && typeof result[field] === 'string') {
            result[field] = decrypt(result[field]) as T[keyof T];
        }
    }

    return result;
}

/**
 * For E2E messaging: Encrypt with a provided key (for per-conversation keys)
 */
export function encryptWithKey(plaintext: string, keyHex: string): string {
    if (!plaintext) return plaintext;

    const key = Buffer.from(keyHex, 'hex');
    if (key.length !== 32) {
        throw new Error('Key must be 32 bytes (64 hex characters)');
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', ENCODING);
    encrypted += cipher.final(ENCODING);

    const authTag = cipher.getAuthTag();

    return `${iv.toString(ENCODING)}:${authTag.toString(ENCODING)}:${encrypted}`;
}

/**
 * For E2E messaging: Decrypt with a provided key
 */
export function decryptWithKey(ciphertext: string, keyHex: string): string {
    if (!ciphertext || !ciphertext.includes(':')) return ciphertext;

    const parts = ciphertext.split(':');
    if (parts.length !== 3) return ciphertext;

    const [ivHex, authTagHex, encryptedHex] = parts;

    try {
        const key = Buffer.from(keyHex, 'hex');
        const iv = Buffer.from(ivHex, ENCODING);
        const authTag = Buffer.from(authTagHex, ENCODING);
        const encrypted = Buffer.from(encryptedHex, ENCODING);

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString('utf8');
    } catch (error) {
        throw new Error('Failed to decrypt message');
    }
}

export default {
    encrypt,
    decrypt,
    isEncrypted,
    hashForSearch,
    encryptFields,
    decryptFields,
    encryptWithKey,
    decryptWithKey,
    generateEncryptionKey,
};
