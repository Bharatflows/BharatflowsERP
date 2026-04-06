
import { PrismaClient, Shipment } from '@prisma/client';
import eventBus, { EventTypes } from './eventBus';
import logger from '../config/logger';

const prisma = new PrismaClient();

interface CreateShipmentData {
    companyId: string;
    provider: string; // DHL, FEDEX, LOCAL
    estimatedDelivery?: Date;
    cost?: number;

    // One of these must be provided
    invoiceId?: string;
    purchaseOrderId?: string;
}

class LogisticsService {
    /**
     * Schedule a Pickup / Create Shipment
     */
    async scheduleShipment(data: CreateShipmentData): Promise<Shipment> {
        if (!data.invoiceId && !data.purchaseOrderId) {
            throw new Error('Shipment must be linked to Invoice or Purchase Order');
        }

        const shipment = await prisma.shipment.create({
            data: {
                companyId: data.companyId,
                provider: data.provider,
                status: 'SCHEDULED',
                estimatedDelivery: data.estimatedDelivery,
                cost: data.cost,
                invoiceId: data.invoiceId,
                purchaseOrderId: data.purchaseOrderId,
                trackingNumber: 'TRK-' + Date.now().toString().slice(-6) // Mock tracking
            }
        });

        eventBus.emit({
            eventType: EventTypes.SHIPMENT_CREATED,
            aggregateType: 'Shipment',
            companyId: data.companyId,
            aggregateId: shipment.id,
            payload: {
                trackingNumber: shipment.trackingNumber,
                provider: shipment.provider,
                source: data.invoiceId ? 'INVOICE' : 'PO',
                sourceId: data.invoiceId || data.purchaseOrderId
            },
            metadata: {
                userId: 'SYSTEM',
                source: 'api',
                timestamp: new Date().toISOString()
            }
        });

        return shipment;
    }

    /**
     * Update Shipment Status (Simulating Webhook)
     */
    async updateShipmentStatus(shipmentId: string, status: string, companyId: string) {
        const shipment = await prisma.shipment.update({
            where: { id: shipmentId },
            data: { status }
        });

        if (status === 'DELIVERED') {
            await prisma.shipment.update({
                where: { id: shipmentId },
                data: { actualDelivery: new Date() }
            });

            eventBus.emit({
                eventType: EventTypes.SHIPMENT_DELIVERED,
                aggregateType: 'Shipment',
                companyId: companyId,
                aggregateId: shipmentId,
                payload: {
                    trackingNumber: shipment.trackingNumber,
                    deliveredAt: new Date()
                },
                metadata: {
                    userId: 'SYSTEM',
                    source: 'api',
                    timestamp: new Date().toISOString()
                }
            });
        }

        return shipment;
    }
}

export default new LogisticsService();
