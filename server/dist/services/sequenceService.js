"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextNumber = getNextNumber;
exports.getSequences = getSequences;
exports.getSequence = getSequence;
exports.updateSequence = updateSequence;
exports.previewNextNumber = previewNextNumber;
const prisma_1 = __importDefault(require("../config/prisma"));
const logger_1 = __importDefault(require("../config/logger"));
// Default sequence configurations
const DEFAULT_SEQUENCES = {
    INVOICE: { prefix: 'INV', format: '{PREFIX}-{YEAR}-{SEQ:3}' },
    ESTIMATE: { prefix: 'EST', format: '{PREFIX}-{YEAR}-{SEQ:3}' },
    QUOTATION: { prefix: 'QT', format: '{PREFIX}-{YEAR}-{SEQ:3}' },
    SALES_ORDER: { prefix: 'SO', format: '{PREFIX}-{YEAR}-{SEQ:3}' },
    DELIVERY_CHALLAN: { prefix: 'DC', format: '{PREFIX}-{YEAR}-{SEQ:3}' },
    PURCHASE_ORDER: { prefix: 'PO', format: '{PREFIX}-{YEAR}-{SEQ:3}' },
    PURCHASE_BILL: { prefix: 'BILL', format: '{PREFIX}-{YEAR}-{SEQ:3}' },
    GRN: { prefix: 'GRN', format: '{PREFIX}-{YEAR}-{SEQ:3}' },
    CUSTOMER: { prefix: 'CUST', format: '{PREFIX}-{SEQ:4}' },
    SUPPLIER: { prefix: 'SUPP', format: '{PREFIX}-{SEQ:4}' },
    EMPLOYEE: { prefix: 'EMP', format: '{PREFIX}-{SEQ:4}' },
    PRODUCT: { prefix: 'PROD', format: '{PREFIX}-{SEQ:4}' },
};
/**
 * Formats a sequence number based on the format pattern
 * Supported placeholders:
 * - {PREFIX} - The sequence prefix
 * - {YEAR} - Current 4-digit year
 * - {YY} - Current 2-digit year
 * - {SEQ:N} - Sequence number padded to N digits
 */
function formatSequenceNumber(prefix, nextNumber, format) {
    const now = new Date();
    const year = now.getFullYear().toString();
    const shortYear = year.slice(-2);
    let result = format || '{PREFIX}-{SEQ:4}';
    // Replace placeholders
    result = result.replace('{PREFIX}', prefix);
    result = result.replace('{YEAR}', year);
    result = result.replace('{YY}', shortYear);
    // Handle {SEQ:N} pattern
    const seqMatch = result.match(/\{SEQ:(\d+)\}/);
    if (seqMatch) {
        const padLength = parseInt(seqMatch[1], 10);
        result = result.replace(seqMatch[0], nextNumber.toString().padStart(padLength, '0'));
    }
    else {
        // Fallback if no SEQ pattern found
        result = result.replace('{SEQ}', nextNumber.toString());
    }
    return result;
}
/**
 * Gets the next document number for a given document type
 * Creates the sequence if it doesn't exist
 */
async function getNextNumber(companyId, documentType) {
    try {
        // Get or create sequence with atomic operation
        const sequence = await prisma_1.default.$transaction(async (tx) => {
            // Try to find existing sequence
            let seq = await tx.sequence.findFirst({
                where: {
                    companyId,
                    documentType,
                    fiscalYear: null, // For non-fiscal-year-based sequences
                },
            });
            // Create sequence if it doesn't exist
            if (!seq) {
                const defaults = DEFAULT_SEQUENCES[documentType] || {
                    prefix: documentType.substring(0, 3).toUpperCase(),
                    format: '{PREFIX}-{SEQ:4}',
                };
                seq = await tx.sequence.create({
                    data: {
                        companyId,
                        documentType,
                        prefix: defaults.prefix,
                        format: defaults.format,
                        nextNumber: 1,
                    },
                });
            }
            // Increment the sequence number
            const updatedSeq = await tx.sequence.update({
                where: { id: seq.id },
                data: { nextNumber: seq.nextNumber + 1 },
            });
            // Return the original sequence (before increment) for this document
            return { ...seq, nextNumber: seq.nextNumber };
        });
        // Format and return the number
        const formattedNumber = formatSequenceNumber(sequence.prefix, sequence.nextNumber, sequence.format);
        logger_1.default.info(`Generated ${documentType} number: ${formattedNumber} for company ${companyId}`);
        return formattedNumber;
    }
    catch (error) {
        logger_1.default.error(`Error generating sequence number for ${documentType}:`, error);
        throw new Error(`Failed to generate ${documentType} number: ${error.message}`);
    }
}
/**
 * Gets all sequences for a company
 */
async function getSequences(companyId) {
    try {
        const sequences = await prisma_1.default.sequence.findMany({
            where: { companyId },
            orderBy: { documentType: 'asc' },
        });
        // Include default sequences that haven't been created yet
        const existingTypes = new Set(sequences.map((s) => s.documentType));
        const allSequences = [...sequences];
        for (const [docType, defaults] of Object.entries(DEFAULT_SEQUENCES)) {
            if (!existingTypes.has(docType)) {
                allSequences.push({
                    id: `default-${docType}`,
                    documentType: docType,
                    prefix: defaults.prefix,
                    format: defaults.format,
                    nextNumber: 1,
                    fiscalYear: null,
                    companyId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }
        }
        return allSequences.sort((a, b) => a.documentType.localeCompare(b.documentType));
    }
    catch (error) {
        logger_1.default.error('Error fetching sequences:', error);
        throw new Error(`Failed to fetch sequences: ${error.message}`);
    }
}
/**
 * Gets a specific sequence for a document type
 * If no sequence exists, calculates the next number based on existing documents
 */
async function getSequence(companyId, documentType) {
    try {
        const sequence = await prisma_1.default.sequence.findFirst({
            where: { companyId, documentType },
        });
        if (!sequence) {
            const defaults = DEFAULT_SEQUENCES[documentType] || {
                prefix: documentType.substring(0, 3).toUpperCase(),
                format: '{PREFIX}-{SEQ:4}',
            };
            // Count existing documents to determine the next number
            let existingCount = 0;
            try {
                switch (documentType) {
                    case 'INVOICE':
                        existingCount = await prisma_1.default.invoice.count({ where: { companyId } });
                        break;
                    case 'ESTIMATE':
                        existingCount = await prisma_1.default.estimate.count({ where: { companyId } });
                        break;
                    case 'QUOTATION':
                        existingCount = await prisma_1.default.quotation.count({ where: { companyId } });
                        break;
                    case 'SALES_ORDER':
                        existingCount = await prisma_1.default.salesOrder.count({ where: { companyId } });
                        break;
                    case 'DELIVERY_CHALLAN':
                        existingCount = await prisma_1.default.deliveryChallan.count({ where: { companyId } });
                        break;
                    case 'PURCHASE_ORDER':
                        existingCount = await prisma_1.default.purchaseOrder.count({ where: { companyId } });
                        break;
                    case 'PURCHASE_BILL':
                        existingCount = await prisma_1.default.purchaseBill.count({ where: { companyId } });
                        break;
                    case 'GRN':
                        existingCount = await prisma_1.default.goodsReceivedNote.count({ where: { companyId } });
                        break;
                    default:
                        existingCount = 0;
                }
            }
            catch (countError) {
                logger_1.default.warn(`Could not count existing ${documentType} documents:`, countError);
            }
            const nextNumber = existingCount + 1;
            return {
                id: `default-${documentType}`,
                documentType,
                prefix: defaults.prefix,
                format: defaults.format,
                nextNumber,
                fiscalYear: null,
                companyId,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        }
        return sequence;
    }
    catch (error) {
        logger_1.default.error(`Error fetching sequence for ${documentType}:`, error);
        throw new Error(`Failed to fetch sequence: ${error.message}`);
    }
}
/**
 * Updates a sequence configuration
 */
async function updateSequence(companyId, documentType, data) {
    try {
        // Upsert: create if doesn't exist, update if exists
        const sequence = await prisma_1.default.sequence.upsert({
            where: {
                companyId_documentType_fiscalYear: {
                    companyId,
                    documentType,
                    fiscalYear: null, // null is part of the unique constraint
                },
            },
            update: {
                ...(data.prefix && { prefix: data.prefix }),
                ...(data.nextNumber !== undefined && { nextNumber: data.nextNumber }),
                ...(data.format && { format: data.format }),
            },
            create: {
                companyId,
                documentType,
                prefix: data.prefix || DEFAULT_SEQUENCES[documentType]?.prefix || documentType.substring(0, 3).toUpperCase(),
                nextNumber: data.nextNumber || 1,
                format: data.format || DEFAULT_SEQUENCES[documentType]?.format || '{PREFIX}-{SEQ:4}',
            },
        });
        logger_1.default.info(`Updated sequence for ${documentType}: ${JSON.stringify(data)}`);
        return sequence;
    }
    catch (error) {
        logger_1.default.error(`Error updating sequence for ${documentType}:`, error);
        throw new Error(`Failed to update sequence: ${error.message}`);
    }
}
/**
 * Preview what the next number will look like
 */
function previewNextNumber(prefix, nextNumber, format) {
    return formatSequenceNumber(prefix, nextNumber, format);
}
exports.default = {
    getNextNumber,
    getSequences,
    getSequence,
    updateSequence,
    previewNextNumber,
};
//# sourceMappingURL=sequenceService.js.map