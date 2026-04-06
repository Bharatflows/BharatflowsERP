
import { PrismaClient, GroupBuyIntent, GroupBuyParticipation } from '@prisma/client';
import eventBus, { EventTypes } from './eventBus';
import logger from '../config/logger';

const prisma = new PrismaClient();

interface CreateGroupBuyData {
    companyId: string;
    title: string;
    productId?: string;
    productName: string;
    targetQuantity: number;
    expiresAt: Date;
}

interface JoinGroupBuyData {
    groupBuyId: string;
    companyId: string;
    quantity: number;
}

class GroupBuyingService {
    /**
     * Create a new Group Buy Intent
     */
    async createGroupBuy(data: CreateGroupBuyData): Promise<GroupBuyIntent> {
        return await prisma.$transaction(async (tx) => {
            const groupBuy = await tx.groupBuyIntent.create({
                data: {
                    initiatorId: data.companyId,
                    title: data.title,
                    productId: data.productId,
                    productName: data.productName,
                    targetQuantity: data.targetQuantity,
                    expiresAt: data.expiresAt,
                    status: 'ACTIVE',
                    // Auto-join the creator? Optional. Let's assume explicit join needed or separate call.
                }
            });

            await eventBus.emit({
                companyId: data.companyId,
                eventType: EventTypes.GROUP_BUY_CREATED,
                aggregateType: 'GroupBuy',
                aggregateId: groupBuy.id,
                payload: { title: groupBuy.title, targetQty: groupBuy.targetQuantity },
                metadata: { userId: 'system', source: 'system' }
            });

            return groupBuy;
        });
    }

    /**
     * Join an active Group Buy
     */
    async joinGroupBuy(data: JoinGroupBuyData): Promise<GroupBuyParticipation> {
        return await prisma.$transaction(async (tx) => {
            const groupBuy = await tx.groupBuyIntent.findUnique({
                where: { id: data.groupBuyId }
            });

            if (!groupBuy) throw new Error('Group Buy not found');
            if (groupBuy.status !== 'ACTIVE') throw new Error('Group Buy is not active');
            if (new Date() > groupBuy.expiresAt) throw new Error('Group Buy expired');

            // Create or Update Participation
            const participation = await tx.groupBuyParticipation.upsert({
                where: {
                    groupBuyId_companyId: {
                        groupBuyId: data.groupBuyId,
                        companyId: data.companyId
                    }
                },
                update: {
                    quantity: data.quantity // Overwrite or increment? Let's overwrite for simplicity
                },
                create: {
                    groupBuyId: data.groupBuyId,
                    companyId: data.companyId,
                    quantity: data.quantity,
                    status: 'COMMITTED'
                }
            });

            // Recalculate Total Quantity
            const allParticipations = await tx.groupBuyParticipation.findMany({
                where: { groupBuyId: data.groupBuyId }
            });

            const currentQuantity = allParticipations.reduce((sum, p) => sum + p.quantity, 0);

            // Update Group Buy State
            let newStatus: string = groupBuy.status;
            if (currentQuantity >= groupBuy.targetQuantity) {
                newStatus = 'FILLED'; // Threshold met!
            }

            const updatedGroupBuy = await tx.groupBuyIntent.update({
                where: { id: data.groupBuyId },
                data: {
                    currentQuantity,
                    status: newStatus as string
                }
            });

            await eventBus.emit({
                companyId: data.companyId,
                eventType: EventTypes.GROUP_BUY_JOINED,
                aggregateType: 'GroupBuyParticipation',
                aggregateId: participation.id,
                payload: {
                    groupBuyId: data.groupBuyId,
                    quantity: data.quantity,
                    totalQuantity: currentQuantity,
                    filled: newStatus === 'FILLED'
                },
                metadata: { userId: 'system', source: 'system' }
            });

            if (newStatus === 'FILLED') {
                await eventBus.emit({
                    companyId: groupBuy.initiatorId,
                    eventType: EventTypes.GROUP_BUY_FILLED,
                    aggregateType: 'GroupBuy',
                    aggregateId: groupBuy.id,
                    payload: { totalQuantity: currentQuantity },
                    metadata: { userId: 'system', source: 'system' }
                });
            }

            return participation;
        });
    }

    /**
     * List Active Pool Opportunities
     */
    async listActiveOpportunities(): Promise<GroupBuyIntent[]> {
        return await prisma.groupBuyIntent.findMany({
            where: {
                status: 'ACTIVE',
                expiresAt: { gt: new Date() }
            },
            include: { initiator: true },
            orderBy: { createdAt: 'desc' }
        });
    }
}

export default new GroupBuyingService();
