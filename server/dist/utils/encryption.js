"use strict";
/**
 * Encryption Utility - AES-256-GCM
 * Used for encrypting sensitive data at rest (bank details, GSTIN, PAN, etc.)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEncryptionKey = generateEncryptionKey;
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.isEncrypted = isEncrypted;
exports.hashForSearch = hashForSearch;
exports.encryptFields = encryptFields;
exports.decryptFields = decryptFields;
exports.encryptWithKey = encryptWithKey;
exports.decryptWithKey = decryptWithKey;
const crypto_1 = __importDefault(require("crypto"));
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits auth tag
const ENCODING = 'hex';
/**
 * Get encryption key from environment
 * Must be 32 bytes (64 hex characters)
 */
function getEncryptionKey() {
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
function generateEncryptionKey() {
    return crypto_1.default.randomBytes(32).toString('hex');
}
/**
 * Encrypt a string using AES-256-GCM
 * Returns: iv:authTag:encryptedData (all in hex)
 */
function encrypt(plaintext) {
    if (!plaintext)
        return plaintext;
    const key = getEncryptionKey();
    const iv = crypto_1.default.randomBytes(IV_LENGTH);
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, key, iv);
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
function decrypt(ciphertext) {
    if (!ciphertext)
        return ciphertext;
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
        const decipher = crypto_1.default.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString('utf8');
    }
    catch (error) {
        // If decryption fails, return original (might not be encrypted)
        console.error('Decryption failed:', error);
        return ciphertext;
    }
}
/**
 * Check if a string is encrypted (has correct format)
 */
function isEncrypted(value) {
    if (!value || typeof value !== 'string')
        return false;
    const parts = value.split(':');
    if (parts.length !== 3)
        return false;
    const [ivHex, authTagHex] = parts;
    // Check hex format and lengths
    try {
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        return iv.length === IV_LENGTH && authTag.length === TAG_LENGTH;
    }
    catch {
        return false;
    }
}
/**
 * Create a searchable hash of data (for looking up encrypted fields)
 * Uses HMAC-SHA256 for consistent one-way hashing
 */
function hashForSearch(plaintext) {
    if (!plaintext)
        return plaintext;
    const key = getEncryptionKey();
    return crypto_1.default.createHmac('sha256', key)
        .update(plaintext.toLowerCase().trim())
        .digest('hex');
}
/**
 * Encrypt an object's specified fields
 */
function encryptFields(obj, fieldsToEncrypt) {
    const result = { ...obj };
    for (const field of fieldsToEncrypt) {
        if (result[field] && typeof result[field] === 'string') {
            result[field] = encrypt(result[field]);
        }
    }
    return result;
}
/**
 * Decrypt an object's specified fields
 */
function decryptFields(obj, fieldsToDecrypt) {
    const result = { ...obj };
    for (const field of fieldsToDecrypt) {
        if (result[field] && typeof result[field] === 'string') {
            result[field] = decrypt(result[field]);
        }
    }
    return result;
}
/**
 * For E2E messaging: Encrypt with a provided key (for per-conversation keys)
 */
function encryptWithKey(plaintext, keyHex) {
    if (!plaintext)
        return plaintext;
    const key = Buffer.from(keyHex, 'hex');
    if (key.length !== 32) {
        throw new Error('Key must be 32 bytes (64 hex characters)');
    }
    const iv = crypto_1.default.randomBytes(IV_LENGTH);
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', ENCODING);
    encrypted += cipher.final(ENCODING);
    const authTag = cipher.getAuthTag();
    return `${iv.toString(ENCODING)}:${authTag.toString(ENCODING)}:${encrypted}`;
}
/**
 * For E2E messaging: Decrypt with a provided key
 */
function decryptWithKey(ciphertext, keyHex) {
    if (!ciphertext || !ciphertext.includes(':'))
        return ciphertext;
    const parts = ciphertext.split(':');
    if (parts.length !== 3)
        return ciphertext;
    const [ivHex, authTagHex, encryptedHex] = parts;
    try {
        const key = Buffer.from(keyHex, 'hex');
        const iv = Buffer.from(ivHex, ENCODING);
        const authTag = Buffer.from(authTagHex, ENCODING);
        const encrypted = Buffer.from(encryptedHex, ENCODING);
        const decipher = crypto_1.default.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString('utf8');
    }
    catch (error) {
        throw new Error('Failed to decrypt message');
    }
}
exports.default = {
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
//# sourceMappingURL=encryption.js.map