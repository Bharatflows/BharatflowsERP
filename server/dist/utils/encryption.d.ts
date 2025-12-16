/**
 * Encryption Utility - AES-256-GCM
 * Used for encrypting sensitive data at rest (bank details, GSTIN, PAN, etc.)
 */
/**
 * Generate a secure encryption key
 * Use this once to generate a key and store in .env
 */
export declare function generateEncryptionKey(): string;
/**
 * Encrypt a string using AES-256-GCM
 * Returns: iv:authTag:encryptedData (all in hex)
 */
export declare function encrypt(plaintext: string): string;
/**
 * Decrypt a string encrypted with encrypt()
 * Input format: iv:authTag:encryptedData (all in hex)
 */
export declare function decrypt(ciphertext: string): string;
/**
 * Check if a string is encrypted (has correct format)
 */
export declare function isEncrypted(value: string): boolean;
/**
 * Create a searchable hash of data (for looking up encrypted fields)
 * Uses HMAC-SHA256 for consistent one-way hashing
 */
export declare function hashForSearch(plaintext: string): string;
/**
 * Encrypt an object's specified fields
 */
export declare function encryptFields<T extends Record<string, any>>(obj: T, fieldsToEncrypt: (keyof T)[]): T;
/**
 * Decrypt an object's specified fields
 */
export declare function decryptFields<T extends Record<string, any>>(obj: T, fieldsToDecrypt: (keyof T)[]): T;
/**
 * For E2E messaging: Encrypt with a provided key (for per-conversation keys)
 */
export declare function encryptWithKey(plaintext: string, keyHex: string): string;
/**
 * For E2E messaging: Decrypt with a provided key
 */
export declare function decryptWithKey(ciphertext: string, keyHex: string): string;
declare const _default: {
    encrypt: typeof encrypt;
    decrypt: typeof decrypt;
    isEncrypted: typeof isEncrypted;
    hashForSearch: typeof hashForSearch;
    encryptFields: typeof encryptFields;
    decryptFields: typeof decryptFields;
    encryptWithKey: typeof encryptWithKey;
    decryptWithKey: typeof decryptWithKey;
    generateEncryptionKey: typeof generateEncryptionKey;
};
export default _default;
//# sourceMappingURL=encryption.d.ts.map