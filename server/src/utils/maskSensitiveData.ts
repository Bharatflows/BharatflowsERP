/**
 * Utility functions for masking sensitive data in settings
 */

/**
 * Mask bank account number - show only last 4 digits
 */
export function maskBankAccount(accountNumber: string | null | undefined): string {
    if (!accountNumber) return '****';
    const cleaned = accountNumber.toString().replace(/\s/g, '');
    if (cleaned.length < 4) return '****';
    return '****' + cleaned.slice(-4);
}

/**
 * Mask IFSC code - show first 4 and last 2 characters
 */
export function maskIFSC(ifsc: string | null | undefined): string {
    if (!ifsc) return '****';
    const cleaned = ifsc.toString().toUpperCase();
    if (cleaned.length < 6) return '****';
    return cleaned.slice(0, 4) + '****' + cleaned.slice(-2);
}

/**
 * Mask PAN number - show first 3 and last character
 */
export function maskPAN(pan: string | null | undefined): string {
    if (!pan) return '****';
    const cleaned = pan.toString().toUpperCase();
    if (cleaned.length !== 10) return '****';
    return cleaned.slice(0, 3) + '******' + cleaned.slice(-1);
}

/**
 * Mask Aadhaar number - show only last 4 digits
 */
export function maskAadhaar(aadhaar: string | null | undefined): string {
    if (!aadhaar) return '****';
    const cleaned = aadhaar.toString().replace(/\s/g, '');
    if (cleaned.length !== 12) return '****';
    return '****-****-' + cleaned.slice(-4);
}

/**
 * Mask sensitive data based on field type
 */
export function maskSensitiveData(value: any, fieldType: string): any {
    if (value === null || value === undefined) return value;

    switch (fieldType) {
        case 'BANK_ACCOUNT':
            return maskBankAccount(value);
        case 'IFSC':
            return maskIFSC(value);
        case 'PAN':
            return maskPAN(value);
        case 'AADHAAR':
            return maskAadhaar(value);
        case 'PASSWORD':
            return '********';
        default:
            return value;
    }
}

/**
 * Determine if a field contains sensitive data
 */
export function isSensitiveField(fieldName: string): boolean {
    const sensitiveFields = [
        'accountNumber',
        'ifscCode',
        'pan',
        'aadhaar',
        'password',
        'twoFactorSecret',
        'twoFactorBackup',
    ];

    return sensitiveFields.some(field =>
        fieldName.toLowerCase().includes(field.toLowerCase())
    );
}

/**
 * Mask all sensitive fields in an object
 */
export function maskObjectSensitiveFields(obj: Record<string, any>): Record<string, any> {
    const masked: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
        if (isSensitiveField(key)) {
            if (key.includes('account')) {
                masked[key] = maskBankAccount(value);
            } else if (key.includes('ifsc')) {
                masked[key] = maskIFSC(value);
            } else if (key.includes('pan')) {
                masked[key] = maskPAN(value);
            } else if (key.includes('password') || key.includes('secret')) {
                masked[key] = '********';
            } else {
                masked[key] = '****';
            }
        } else {
            masked[key] = value;
        }
    }

    return masked;
}

export default {
    maskBankAccount,
    maskIFSC,
    maskPAN,
    maskAadhaar,
    maskSensitiveData,
    isSensitiveField,
    maskObjectSensitiveFields,
};
