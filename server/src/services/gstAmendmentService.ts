/**
 * GST Amendment Service
 * 
 * P2: Track and manage amendments to filed GST returns
 */

import prisma from '../config/prisma';

export type AmendmentType =
    | 'B2B_MODIFY'
    | 'B2B_ADD'
    | 'B2B_DELETE'
    | 'CDNR_MODIFY'
    | 'CDNR_ADD'
    | 'CDNR_DELETE'
    | 'EXPORT_MODIFY';

export type AmendmentStatus = 'PENDING' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED';

interface AmendmentRecord {
    id: string;
    originalInvoiceId: string;
    originalInvoiceNumber: string;
    originalPeriod: string;     // Original return period (e.g., "2024-01")
    amendmentPeriod: string;    // Period in which amendment is filed
    amendmentType: AmendmentType;
    reason: string;

    // Original values
    originalGstin?: string;
    originalAmount?: number;
    originalTaxableValue?: number;
    originalIgst?: number;
    originalCgst?: number;
    originalSgst?: number;

    // Revised values
    revisedGstin?: string;
    revisedAmount?: number;
    revisedTaxableValue?: number;
    revisedIgst?: number;
    revisedCgst?: number;
    revisedSgst?: number;

    status: AmendmentStatus;
    submittedAt?: Date;
    createdAt: Date;
}

interface GSTR1AmendmentSection {
    b2bAmendments: any[];
    cdnrAmendments: any[];
    exportAmendments: any[];
    summary: {
        totalAmendments: number;
        pendingCount: number;
        taxDifference: number;
    };
}

class GSTAmendmentService {
    /**
     * Create an amendment record
     */
    async createAmendment(
        companyId: string,
        data: Omit<AmendmentRecord, 'id' | 'status' | 'createdAt'>
    ): Promise<AmendmentRecord> {
        // Store in company features or separate model
        // For now, using a pseudo-implementation
        const amendment: AmendmentRecord = {
            id: `AMD-${Date.now()}`,
            ...data,
            status: 'PENDING',
            createdAt: new Date()
        };

        // In production, save to database
        console.log('Amendment created:', amendment);

        return amendment;
    }

    /**
     * Get pending amendments for a period
     */
    async getPendingAmendments(
        companyId: string,
        period: string
    ): Promise<AmendmentRecord[]> {
        // Mock - would query from database
        const mockAmendments: AmendmentRecord[] = [];

        // In production, query actual amendments
        return mockAmendments;
    }

    /**
     * Generate GSTR-1 Amendment sections
     */
    async getGSTR1Amendments(
        companyId: string,
        period: string
    ): Promise<GSTR1AmendmentSection> {
        const amendments = await this.getPendingAmendments(companyId, period);

        const b2bAmendments = amendments.filter(a =>
            a.amendmentType.startsWith('B2B')
        );

        const cdnrAmendments = amendments.filter(a =>
            a.amendmentType.startsWith('CDNR')
        );

        const exportAmendments = amendments.filter(a =>
            a.amendmentType.startsWith('EXPORT')
        );

        // Calculate tax difference
        const taxDifference = amendments.reduce((sum, a) => {
            const originalTax = (a.originalIgst || 0) + (a.originalCgst || 0) + (a.originalSgst || 0);
            const revisedTax = (a.revisedIgst || 0) + (a.revisedCgst || 0) + (a.revisedSgst || 0);
            return sum + (revisedTax - originalTax);
        }, 0);

        return {
            b2bAmendments: b2bAmendments.map(a => this.formatB2BAmendment(a)),
            cdnrAmendments: cdnrAmendments.map(a => this.formatCDNRAmendment(a)),
            exportAmendments: exportAmendments.map(a => this.formatExportAmendment(a)),
            summary: {
                totalAmendments: amendments.length,
                pendingCount: amendments.filter(a => a.status === 'PENDING').length,
                taxDifference
            }
        };
    }

    /**
     * Format B2B amendment for GSTR-1
     */
    private formatB2BAmendment(amendment: AmendmentRecord): any {
        return {
            oinum: amendment.originalInvoiceNumber,
            oidt: amendment.originalPeriod,
            ctin: amendment.revisedGstin || amendment.originalGstin,
            inum: amendment.originalInvoiceNumber,
            idt: amendment.createdAt.toISOString().split('T')[0],
            val: amendment.revisedAmount,
            txval: amendment.revisedTaxableValue,
            iamt: amendment.revisedIgst,
            camt: amendment.revisedCgst,
            samt: amendment.revisedSgst,
            reason: amendment.reason
        };
    }

    /**
     * Format CDNR amendment for GSTR-1
     */
    private formatCDNRAmendment(amendment: AmendmentRecord): any {
        return {
            ont: amendment.originalInvoiceNumber,
            odt: amendment.originalPeriod,
            ctin: amendment.originalGstin,
            nt: amendment.originalInvoiceNumber,
            dt: amendment.createdAt.toISOString().split('T')[0],
            val: amendment.revisedAmount,
            reason: amendment.reason
        };
    }

    /**
     * Format Export amendment for GSTR-1
     */
    private formatExportAmendment(amendment: AmendmentRecord): any {
        return {
            oexp_typ: 'WPAY',
            oinum: amendment.originalInvoiceNumber,
            oidt: amendment.originalPeriod,
            exp_typ: 'WPAY',
            inum: amendment.originalInvoiceNumber,
            idt: amendment.createdAt.toISOString().split('T')[0],
            val: amendment.revisedAmount,
            sbnum: '',
            sbdt: ''
        };
    }

    /**
     * Submit amendments
     */
    async submitAmendments(
        companyId: string,
        amendmentIds: string[]
    ): Promise<{ success: boolean; message: string }> {
        // In production, would update status and potentially call GST API
        return {
            success: true,
            message: `${amendmentIds.length} amendments submitted for filing`
        };
    }

    /**
     * Check if invoice can be amended
     */
    canAmendInvoice(
        invoiceDate: Date,
        originalReturnDate: Date
    ): { canAmend: boolean; reason?: string } {
        const now = new Date();
        const monthsDiff = (now.getFullYear() - originalReturnDate.getFullYear()) * 12 +
            (now.getMonth() - originalReturnDate.getMonth());

        // Amendments allowed up to November of the following year
        // For FY 2024-25, amendments allowed until Nov 2025
        const invoiceFY = invoiceDate.getMonth() >= 3
            ? invoiceDate.getFullYear()
            : invoiceDate.getFullYear() - 1;
        const deadlineMonth = 10; // November (0-indexed)
        const deadlineYear = invoiceFY + 1;
        const deadline = new Date(deadlineYear, deadlineMonth + 1, 30);

        if (now > deadline) {
            return {
                canAmend: false,
                reason: `Amendment deadline (Nov ${deadlineYear}) has passed`
            };
        }

        return { canAmend: true };
    }
}

export default new GSTAmendmentService();
