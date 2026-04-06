/**
 * Shipping Label Generation Service
 * Generate PDF-based shipping labels for dispatched orders
 */
import logger from '../config/logger';

interface ShippingLabelData {
    // Sender
    senderName: string;
    senderAddress: string;
    senderCity: string;
    senderState: string;
    senderPincode: string;
    senderPhone: string;

    // Receiver
    receiverName: string;
    receiverAddress: string;
    receiverCity: string;
    receiverState: string;
    receiverPincode: string;
    receiverPhone: string;

    // Shipment
    trackingNumber: string;
    orderId: string;
    weight: string;
    dimensions?: string;
    carrier: string;
    serviceType?: string;
    invoiceNumber?: string;
    itemCount?: number;
    codAmount?: number;
}

export class ShippingLabelService {
    /**
     * Generate shipping label as HTML (for PDF conversion via pdfService)
     */
    static generateLabelHTML(data: ShippingLabelData): string {
        const isCOD = data.codAmount && data.codAmount > 0;

        return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
    @page { size: 4in 6in; margin: 0; }
    body { font-family: 'Courier New', monospace; margin: 0; padding: 8mm; width: 96mm; height: 144mm; box-sizing: border-box; }
    .border { border: 2px solid #000; padding: 8px; height: calc(100% - 20px); display: flex; flex-direction: column; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 8px; }
    .header h1 { margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; }
    .tracking { font-size: 18px; font-weight: bold; text-align: center; padding: 8px 0; border: 2px dashed #000; margin: 6px 0; letter-spacing: 2px; }
    .section { margin-bottom: 8px; }
    .section-label { font-size: 9px; text-transform: uppercase; font-weight: bold; color: #666; margin-bottom: 2px; }
    .section-content { font-size: 11px; line-height: 1.4; }
    .name { font-weight: bold; font-size: 13px; }
    .phone { font-size: 10px; color: #333; }
    .meta { display: flex; justify-content: space-between; font-size: 10px; border-top: 1px solid #ccc; padding-top: 6px; margin-top: auto; }
    .cod-badge { background: #000; color: #fff; padding: 4px 12px; text-align: center; font-weight: bold; font-size: 14px; margin: 6px 0; }
    .barcode-placeholder { text-align: center; border: 1px dashed #ccc; padding: 8px; font-size: 9px; color: #999; margin: 4px 0; }
</style></head>
<body><div class="border">
    <div class="header">
        <h1>${data.carrier}</h1>
        <div style="font-size:10px">${data.serviceType || 'Standard'}</div>
    </div>

    <div class="tracking">${data.trackingNumber}</div>

    <div class="barcode-placeholder">▮▮▯▮▯▮▮▯▯▮▮▯▮▮▯▮▯▯▮▮ (barcode placeholder)</div>

    ${isCOD ? `<div class="cod-badge">COD — ₹${Number(data.codAmount).toLocaleString('en-IN')}</div>` : ''}

    <div class="section">
        <div class="section-label">From (Sender)</div>
        <div class="section-content">
            <div class="name">${data.senderName}</div>
            <div>${data.senderAddress}</div>
            <div>${data.senderCity}, ${data.senderState} — ${data.senderPincode}</div>
            <div class="phone">📞 ${data.senderPhone}</div>
        </div>
    </div>

    <div class="section" style="border:2px solid #000; padding:8px; border-radius:4px">
        <div class="section-label" style="font-size:10px">To (Receiver)</div>
        <div class="section-content">
            <div class="name" style="font-size:14px">${data.receiverName}</div>
            <div>${data.receiverAddress}</div>
            <div style="font-weight:bold">${data.receiverCity}, ${data.receiverState} — ${data.receiverPincode}</div>
            <div class="phone">📞 ${data.receiverPhone}</div>
        </div>
    </div>

    <div class="meta">
        <span>Order: ${data.orderId}</span>
        <span>Wt: ${data.weight}</span>
        ${data.dimensions ? `<span>${data.dimensions}</span>` : ''}
        ${data.itemCount ? `<span>${data.itemCount} items</span>` : ''}
    </div>
    ${data.invoiceNumber ? `<div style="text-align:center;font-size:9px;color:#666;margin-top:4px">Invoice: ${data.invoiceNumber}</div>` : ''}
</div></body></html>`;
    }

    /**
     * Generate bulk labels HTML
     */
    static generateBulkLabelsHTML(shipments: ShippingLabelData[]): string {
        return shipments.map(s => this.generateLabelHTML(s)).join('<div style="page-break-after:always"></div>');
    }
}
