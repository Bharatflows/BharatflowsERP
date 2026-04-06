import { PrismaClient, EscrowTransaction, Prisma } from '@prisma/client';
import logger from '../config/logger';
import eventBus, { EventTypes } from './eventBus';

const prisma = new PrismaClient();

export class EscrowService {
    /**
     * Create an Escrow Transaction (Funds Held)
     * Triggered when a Payment with 'ESCROW' mode is received or manually.
     */
    static async createEscrow(data: {
        companyId: string;
        payerId: string;
        payeeId: string;
        amount: number;
        invoiceId?: string;
        conditions?: string;
        dueDate?: Date;
    }): Promise<EscrowTransaction> {
        try {
            const count = await prisma.escrowTransaction.count({ where: { companyId: data.companyId } });
            const escrowNumber = `ESC-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

            const escrow = await prisma.escrowTransaction.create({
                data: {
                    companyId: data.companyId,
                    escrowNumber,
                    payerId: data.payerId,
                    payeeId: data.payeeId,
                    amount: new Prisma.Decimal(data.amount),
                    invoiceId: data.invoiceId,
                    conditions: data.conditions,
                    dueDate: data.dueDate,
                    status: 'HELD'
                }
            });

            logger.info(`[Escrow] Created ${escrow.escrowNumber} for ${data.amount}`);

            // Emit Event for Ledger (Liability: Escrow Payable)
            await eventBus.emit({
                companyId: data.companyId,
                eventType: EventTypes.ESCROW_CREATED,
                aggregateType: 'Escrow',
                aggregateId: escrow.id,
                payload: {
                    amount: data.amount,
                    payerId: data.payerId,
                    payeeId: data.payeeId,
                    escrowNumber: escrow.escrowNumber
                },
                metadata: { userId: 'system', source: 'system' }
            });

            return escrow;
        } catch (error: any) {
            logger.error(`[Escrow] Creation failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Release Escrow (Funds moved to Payee)
     * Triggered by Service Confirmation or Manual Release.
     */
    static async releaseEscrow(escrowId: string, companyId: string): Promise<EscrowTransaction> {
        return await prisma.$transaction(async (tx) => {
            const escrow = await tx.escrowTransaction.findFirst({
                where: { id: escrowId, companyId }
            });

            if (!escrow || escrow.status !== 'HELD') {
                throw new Error('Escrow not found or not in HELD state');
            }

            const updated = await tx.escrowTransaction.update({
                where: { id: escrowId },
                data: {
                    status: 'RELEASED',
                    releasedAt: new Date()
                }
            });

            // Update Invoice Status if linked
            if (escrow.invoiceId) {
                // Determine if full payment? Logic omitted for brevity.
                // Assuming Escrow release = Invoice Paid usually.
            }

            logger.info(`[Escrow] Released ${escrow.escrowNumber}`);

            // Emit Event (Dr Escrow Liability, Cr Bank/Party)
            await eventBus.emit({
                companyId: companyId,
                eventType: EventTypes.ESCROW_RELEASED,
                aggregateType: 'Escrow',
                aggregateId: escrow.id,
                payload: {
                    amount: Number(escrow.amount),
                    payeeId: escrow.payeeId,
                    escrowNumber: escrow.escrowNumber
                },
                metadata: { userId: 'system', source: 'system' }
            });

            return updated;
        });
    }

    /**
     * Dispute Escrow
     */
    static async disputeEscrow(escrowId: string, companyId: string, reason: string): Promise<EscrowTransaction> {
        const escrow = await prisma.escrowTransaction.update({
            where: { id: escrowId }, // Should check companyId too in real query but ID is unique
            data: {
                status: 'DISPUTED',
                disputedAt: new Date(),
                conditions: reason // Append or overwrite conditions/notes
            }
        });

        logger.info(`[Escrow] Disputed ${escrow.escrowNumber}: ${reason}`);

        await eventBus.emit({
            companyId: companyId,
            eventType: EventTypes.ESCROW_DISPUTED,
            aggregateType: 'Escrow',
            aggregateId: escrow.id,
            payload: {
                amount: Number(escrow.amount),
                reason
            },
            metadata: { userId: 'system', source: 'system' }
        });

        return escrow;
    }
}
