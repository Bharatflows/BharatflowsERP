/**
 * Gets the next document number for a given document type
 * Creates the sequence if it doesn't exist
 */
export declare function getNextNumber(companyId: string, documentType: string): Promise<string>;
/**
 * Gets all sequences for a company
 */
export declare function getSequences(companyId: string): Promise<{
    format: string | null;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    companyId: string;
    fiscalYear: string | null;
    nextNumber: number;
    documentType: string;
    prefix: string;
}[]>;
/**
 * Gets a specific sequence for a document type
 * If no sequence exists, calculates the next number based on existing documents
 */
export declare function getSequence(companyId: string, documentType: string): Promise<{
    format: string | null;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    companyId: string;
    fiscalYear: string | null;
    nextNumber: number;
    documentType: string;
    prefix: string;
}>;
/**
 * Updates a sequence configuration
 */
export declare function updateSequence(companyId: string, documentType: string, data: {
    prefix?: string;
    nextNumber?: number;
    format?: string;
}): Promise<{
    format: string | null;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    companyId: string;
    fiscalYear: string | null;
    nextNumber: number;
    documentType: string;
    prefix: string;
}>;
/**
 * Preview what the next number will look like
 */
export declare function previewNextNumber(prefix: string, nextNumber: number, format: string): string;
declare const _default: {
    getNextNumber: typeof getNextNumber;
    getSequences: typeof getSequences;
    getSequence: typeof getSequence;
    updateSequence: typeof updateSequence;
    previewNextNumber: typeof previewNextNumber;
};
export default _default;
//# sourceMappingURL=sequenceService.d.ts.map