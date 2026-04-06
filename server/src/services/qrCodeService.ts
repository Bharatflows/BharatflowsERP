/**
 * QR Code Generation Service
 * Generate QR codes for e-invoices and payment links
 */

// Using a lightweight QR generation approach without external deps
// In production, use 'qrcode' npm package for better output

export class QRCodeService {
    /**
     * Generate e-invoice QR data string (per GST e-invoice schema)
     */
    static generateEInvoiceQRData(data: {
        sellerGstin: string;
        buyerGstin: string;
        invoiceNumber: string;
        invoiceDate: string;
        invoiceValue: number;
        hsnCodes: string[];
        irn: string;
    }): string {
        // NIC e-invoice QR contains signed JWT — here we produce the raw data
        const qrPayload = {
            SellerGstin: data.sellerGstin,
            BuyerGstin: data.buyerGstin,
            DocNo: data.invoiceNumber,
            DocDt: data.invoiceDate,
            TotVal: data.invoiceValue,
            MainHsnCode: data.hsnCodes[0] || '',
            Irn: data.irn,
        };
        return JSON.stringify(qrPayload);
    }

    /**
     * Generate UPI payment QR data string
     */
    static generateUPIQRData(data: {
        vpa: string;
        payeeName: string;
        amount: number;
        invoiceNumber?: string;
        currency?: string;
    }): string {
        const params = [
            `pa=${data.vpa}`,
            `pn=${encodeURIComponent(data.payeeName)}`,
            `am=${data.amount.toFixed(2)}`,
            `cu=${data.currency || 'INR'}`,
        ];
        if (data.invoiceNumber) params.push(`tn=${encodeURIComponent(`Invoice ${data.invoiceNumber}`)}`);
        return `upi://pay?${params.join('&')}`;
    }

    /**
     * Generate SVG QR code (basic implementation)
     * For production, swap with 'qrcode' npm package
     */
    static async generateQRSVG(data: string, size = 200): Promise<string> {
        // Simple placeholder that encodes data as a data URI
        // In production: const QRCode = require('qrcode'); return QRCode.toString(data, { type: 'svg', width: size });
        const encoded = Buffer.from(data).toString('base64').slice(0, 20);
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
            <rect width="${size}" height="${size}" fill="#fff" stroke="#e5e7eb"/>
            <text x="50%" y="45%" text-anchor="middle" font-size="12" fill="#6b7280">QR Code</text>
            <text x="50%" y="60%" text-anchor="middle" font-size="9" fill="#9ca3af">${encoded}...</text>
            <text x="50%" y="80%" text-anchor="middle" font-size="8" fill="#0f62fe">Install 'qrcode' pkg</text>
        </svg>`;
    }

    /**
     * Generate QR data URL for embedding in PDF
     */
    static async generateQRDataURL(data: string, size = 200): Promise<string> {
        const svg = await this.generateQRSVG(data, size);
        return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
    }
}
