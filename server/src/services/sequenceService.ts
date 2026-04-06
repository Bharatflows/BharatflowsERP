import { PrismaClient } from '@prisma/client';
import prisma from '../config/prisma';
import logger from '../config/logger';

// Default sequence configurations
const DEFAULT_SEQUENCES: Record<string, { prefix: string; format: string }> = {
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
    CREDIT_NOTE: { prefix: 'CN', format: '{PREFIX}-{YEAR}-{SEQ:3}' },
    DEBIT_NOTE: { prefix: 'DN', format: '{PREFIX}-{YEAR}-{SEQ:3}' },
    STOCK_ADJUSTMENT: { prefix: 'SA', format: '{PREFIX}-{YEAR}-{SEQ:3}' },
};

/**
 * Formats a sequence number based on the format pattern
 * Supported placeholders:
 * - {PREFIX} - The sequence prefix
 * - {YEAR} - Current 4-digit year
 * - {YY} - Current 2-digit year
 * - {SEQ:N} - Sequence number padded to N digits
 */
function formatSequenceNumber(
    prefix: string,
    nextNumber: number,
    format: string | null
): string {
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
    } else {
        // Fallback if no SEQ pattern found
        result = result.replace('{SEQ}', nextNumber.toString());
    }

    return result;
}

/**
 * Gets the next document number for a given document type
 * Counts actual documents in the database to determine the next number
 */
export async function getNextNumber(
    companyId: string,
    documentType: string
): Promise<string> {
    try {
        // Get the sequence configuration (for prefix and format)
        let seq = await prisma.sequence.findFirst({
            where: {
                companyId,
                documentType,
                fiscalYear: null,
            },
        });

        // Create sequence config if it doesn't exist
        if (!seq) {
            const defaults = DEFAULT_SEQUENCES[documentType] || {
                prefix: documentType.substring(0, 3).toUpperCase(),
                format: '{PREFIX}-{SEQ:4}',
            };

            seq = await prisma.sequence.create({
                data: {
                    companyId,
                    documentType,
                    prefix: defaults.prefix,
                    format: defaults.format,
                    nextNumber: 1, // This is now just a fallback, actual count comes from DB
                },
            });
        }

        // Count existing documents in the database to determine the next number
        let existingCount = 0;
        switch (documentType) {
            case 'INVOICE':
                existingCount = await prisma.invoice.count({ where: { companyId } });
                break;
            case 'ESTIMATE':
                existingCount = await prisma.estimate.count({ where: { companyId } });
                break;
            case 'QUOTATION':
                existingCount = await prisma.quotation.count({ where: { companyId } });
                break;
            case 'SALES_ORDER':
                existingCount = await prisma.salesOrder.count({ where: { companyId } });
                break;
            case 'DELIVERY_CHALLAN':
                existingCount = await prisma.deliveryChallan.count({ where: { companyId } });
                break;
            case 'PURCHASE_ORDER':
                existingCount = await prisma.purchaseOrder.count({ where: { companyId } });
                break;
            case 'PURCHASE_BILL':
                existingCount = await prisma.purchaseBill.count({ where: { companyId } });
                break;
                break;
            case 'CREDIT_NOTE':
                existingCount = await prisma.creditNote.count({ where: { companyId } });
                break;
            case 'DEBIT_NOTE':
                existingCount = await prisma.debitNote.count({ where: { companyId } });
                break;
            case 'STOCK_ADJUSTMENT':
                existingCount = await prisma.stockAdjustment.count({ where: { companyId } });
                break;
            default:
                existingCount = 0;
        }

        // Next number is count + 1
        const nextNumber = existingCount + 1;

        // Format and return the number
        const formattedNumber = formatSequenceNumber(
            seq.prefix,
            nextNumber,
            seq.format
        );

        logger.info(`Generated ${documentType} number: ${formattedNumber} for company ${companyId} (count: ${existingCount})`);
        return formattedNumber;
    } catch (error: any) {
        logger.error(`Error generating sequence number for ${documentType}:`, error);
        throw new Error(`Failed to generate ${documentType} number: ${error.message}`);
    }
}

/**
 * Decrements the sequence number for a given document type
 * Called when a document is deleted to reuse the freed number
 * Note: This will never decrement below 1
 */
export async function decrementSequence(
    companyId: string,
    documentType: string
): Promise<void> {
    try {
        const sequence = await prisma.sequence.findFirst({
            where: {
                companyId,
                documentType,
                fiscalYear: null,
            },
        });

        if (sequence && sequence.nextNumber > 1) {
            await prisma.sequence.update({
                where: { id: sequence.id },
                data: { nextNumber: sequence.nextNumber - 1 },
            });
            logger.info(`Decremented ${documentType} sequence to ${sequence.nextNumber - 1} for company ${companyId}`);
        }
    } catch (error: any) {
        logger.error(`Error decrementing sequence for ${documentType}:`, error);
        // Don't throw - sequence decrement failure shouldn't break delete operations
    }
}

/**
 * Gets all sequences for a company
 */
export async function getSequences(companyId: string) {
    try {
        const sequences = await prisma.sequence.findMany({
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
    } catch (error: any) {
        logger.error('Error fetching sequences:', error);
        throw new Error(`Failed to fetch sequences: ${error.message}`);
    }
}

/**
 * Gets a specific sequence for a document type
 * Always calculates the next number based on existing documents in the database
 */
export async function getSequence(companyId: string, documentType: string) {
    try {
        const sequence = await prisma.sequence.findFirst({
            where: { companyId, documentType },
        });

        // Get defaults for prefix/format
        const defaults = DEFAULT_SEQUENCES[documentType] || {
            prefix: documentType.substring(0, 3).toUpperCase(),
            format: '{PREFIX}-{SEQ:4}',
        };

        // Always count existing documents to determine the next number
        let existingCount = 0;
        try {
            switch (documentType) {
                case 'INVOICE':
                    existingCount = await prisma.invoice.count({ where: { companyId } });
                    break;
                case 'ESTIMATE':
                    existingCount = await prisma.estimate.count({ where: { companyId } });
                    break;
                case 'QUOTATION':
                    existingCount = await prisma.quotation.count({ where: { companyId } });
                    break;
                case 'SALES_ORDER':
                    existingCount = await prisma.salesOrder.count({ where: { companyId } });
                    break;
                case 'DELIVERY_CHALLAN':
                    existingCount = await prisma.deliveryChallan.count({ where: { companyId } });
                    break;
                case 'PURCHASE_ORDER':
                    existingCount = await prisma.purchaseOrder.count({ where: { companyId } });
                    break;
                case 'PURCHASE_BILL':
                    existingCount = await prisma.purchaseBill.count({ where: { companyId } });
                    break;
                case 'GRN':
                    existingCount = await prisma.goodsReceivedNote.count({ where: { companyId } });
                    break;
                    break;
                case 'CREDIT_NOTE':
                    existingCount = await prisma.creditNote.count({ where: { companyId } });
                    break;
                case 'STOCK_ADJUSTMENT':
                    existingCount = await prisma.stockAdjustment.count({ where: { companyId } });
                    break;
                default:
                    existingCount = 0;
            }
        } catch (countError) {
            logger.warn(`Could not count existing ${documentType} documents:`, countError);
        }

        const nextNumber = existingCount + 1;

        // Return sequence config with the count-based nextNumber
        return {
            id: sequence?.id || `default-${documentType}`,
            documentType,
            prefix: sequence?.prefix || defaults.prefix,
            format: sequence?.format || defaults.format,
            nextNumber, // Always use count-based number
            fiscalYear: sequence?.fiscalYear || null,
            companyId,
            createdAt: sequence?.createdAt || new Date(),
            updatedAt: sequence?.updatedAt || new Date(),
        };
    } catch (error: any) {
        logger.error(`Error fetching sequence for ${documentType}:`, error);
        throw new Error(`Failed to fetch sequence: ${error.message}`);
    }
}

/**
 * Updates a sequence configuration
 */
export async function updateSequence(
    companyId: string,
    documentType: string,
    data: { prefix?: string; nextNumber?: number; format?: string }
) {
    try {
        // Upsert: create if doesn't exist, update if exists
        const sequence = await prisma.sequence.upsert({
            where: {
                companyId_documentType_fiscalYear: {
                    companyId,
                    documentType,
                    fiscalYear: null as any, // null is part of the unique constraint
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

        logger.info(`Updated sequence for ${documentType}: ${JSON.stringify(data)}`);
        return sequence;
    } catch (error: any) {
        logger.error(`Error updating sequence for ${documentType}:`, error);
        throw new Error(`Failed to update sequence: ${error.message}`);
    }
}

/**
 * Preview what the next number will look like
 */
export function previewNextNumber(
    prefix: string,
    nextNumber: number,
    format: string
): string {
    return formatSequenceNumber(prefix, nextNumber, format);
}

export default {
    getNextNumber,
    decrementSequence,
    getSequences,
    getSequence,
    updateSequence,
    previewNextNumber,
};
