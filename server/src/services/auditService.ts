/**
 * AuditService - MCA Compliance Sentinel
 * Writes immutable edit logs to the database with tamper-evident hashing.
 */

import prisma from '../config/prisma';
import crypto from 'crypto';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT' | 'RESTORE';
// H6 FIX: Expanded to include all financial entities for comprehensive audit trail
export type EntityType =
    | 'INVOICE'
    | 'PARTY'
    | 'PRODUCT'
    | 'USER'
    | 'COMPANY'
    | 'SETTINGS'
    | 'STOCK_MOVEMENT'
    | 'PDC'              // H6: Post-dated cheques
    | 'EXPENSE'          // H6: Expenses
    | 'TRANSACTION'      // H6: Banking transactions
    | 'CREDIT_NOTE'      // Sales credit notes
    | 'DEBIT_NOTE'       // Purchase debit notes
    | 'PURCHASE_BILL';   // Purchase bills

export class AuditService {
    /**
     * Calculate SHA-256 hash for a log entry to ensure immutability
     */
    private static calculateHash(
        companyId: string,
        entityId: string,
        action: string,
        oldValue: any,
        newValue: any,
        previousHash: string | null,
        timestamp: string
    ): string {
        const data = JSON.stringify({
            companyId,
            entityId,
            action,
            oldValue,
            newValue,
            previousHash,
            timestamp
        });
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * logChange
     * Records a change with a cryptographic hash linking it to the previous record.
     */
    static async logChange(
        companyId: string,
        userId: string,
        entityType: EntityType,
        entityId: string,
        action: AuditAction,
        oldValue: any,
        newValue: any,
        ip: string = 'UNKNOWN',
        userAgent: string = 'UNKNOWN',
        resourceGroup: string = 'General'
    ) {
        try {
            // Find the last audit log for this company to chain the hash
            // (In a high-throughput system, we might chain per-entity or use a global simpler chain. 
            // Here we chain per-company for simplicity and effectiveness).
            const lastLog = await prisma.auditLog.findFirst({
                where: { companyId },
                orderBy: { changedAt: 'desc' }
            });

            const previousHash = lastLog?.hash || null;
            const changedAt = new Date();

            // Calculate new hash
            const hash = this.calculateHash(
                companyId,
                entityId,
                action,
                oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
                newValue ? JSON.parse(JSON.stringify(newValue)) : null,
                previousHash,
                changedAt.toISOString()
            );

            await prisma.auditLog.create({
                data: {
                    companyId,
                    changedBy: userId,
                    entityType,
                    entityId,
                    action,
                    oldValue: oldValue ? JSON.stringify(oldValue) : undefined,
                    newValue: newValue ? JSON.stringify(newValue) : undefined,
                    userIp: ip,
                    userAgent,
                    resourceGroup,
                    hash,
                    previousHash,
                    changedAt
                }
            });
        } catch (error) {
            console.error('CRITICAL: Failed to write Audit Log:', error);
            // In strict mode, we should throw.
        }
    }

    /**
     * Verifies the integrity of the audit log chain for a company.
     * Returns true if valid, or the ID of the first tampered record.
     */
    static async verifyChain(companyId: string): Promise<boolean | string> {
        const logs = await prisma.auditLog.findMany({
            where: { companyId },
            orderBy: { changedAt: 'asc' }
        });

        if (logs.length === 0) return true;

        for (let i = 0; i < logs.length; i++) {
            const log = logs[i];
            const prevLog = i > 0 ? logs[i - 1] : null;

            // 1. Check Linkage
            if (prevLog) {
                if (log.previousHash !== prevLog.hash) {
                    return log.id; // Broken Link
                }
            } else {
                if (log.previousHash !== null) {
                    return log.id; // Genesis block shouldn't have previous hash
                }
            }

            // 2. Check Integrity (Re-hash)
            const calculatedHash = this.calculateHash(
                log.companyId,
                log.entityId,
                log.action,
                log.oldValue,
                log.newValue,
                log.previousHash,
                log.changedAt.toISOString()
            );

            if (calculatedHash !== log.hash) {
                return log.id; // Data Tampered
            }
        }

        return true;
    }

    /**
     * Restore an entity to a previous state found in an audit log
     * (Only works if the entity structure hasn't drifted significantly)
     */
    static async restoreVersion(auditLogId: string): Promise<any> {
        const log = await prisma.auditLog.findUnique({ where: { id: auditLogId } });
        if (!log || !log.oldValue) {
            throw new Error('Invalid restore point');
        }

        // Logic to restore depends on entity type. 
        // Ideally, we return the data to the controller to handle the actual DB update 
        // because different entities have different relation dependent logic.
        return log.oldValue;
    }
}
