/**
 * Gets the next document number for a given document type
 * Counts actual documents in the database to determine the next number
 */
export declare function getNextNumber(companyId: string, documentType: string): Promise<string>;
/**
 * Decrements the sequence number for a given document type
 * Called when a document is deleted to reuse the freed number
 * Note: This will never decrement below 1
 */
export declare function decrementSequence(companyId: string, documentType: string): Promise<void>;
/**
 * Gets all sequences for a company
 */
export declare function getSequences(companyId: string): Promise<{
    id: string;
    companyId: string;
    createdAt: Date;
    updatedAt: Date;
    documentType: string;
    fiscalYear: string | null;
    prefix: string;
    nextNumber: number;
    format: string | null;
}[]>;
/**
 * Gets a specific sequence for a document type
 * Always calculates the next number based on existing documents in the database
 */
export declare function getSequence(companyId: string, documentType: string): Promise<{
    id: string;
    documentType: string;
    prefix: string;
    format: string;
    nextNumber: number;
    fiscalYear: string | null;
    companyId: string;
    createdAt: Date;
    updatedAt: Date;
}>;
/**
 * Updates a sequence configuration
 */
export declare function updateSequence(companyId: string, documentType: string, data: {
    prefix?: string;
    nextNumber?: number;
    format?: string;
}): Promise<{
    id: string;
    companyId: string;
    createdAt: Date;
    updatedAt: Date;
    documentType: string;
    fiscalYear: string | null;
    prefix: string;
    nextNumber: number;
    format: string | null;
}>;
/**
 * Preview what the next number will look like
 */
export declare function previewNextNumber(prefix: string, nextNumber: number, format: string): string;
declare const _default: {
    getNextNumber: typeof getNextNumber;
    decrementSequence: typeof decrementSequence;
    getSequences: typeof getSequences;
    getSequence: typeof getSequence;
    updateSequence: typeof updateSequence;
    previewNextNumber: typeof previewNextNumber;
};
export default _default;
//# sourceMappingURL=sequenceService.d.ts.map