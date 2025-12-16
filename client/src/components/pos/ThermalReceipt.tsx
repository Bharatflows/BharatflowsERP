import React from 'react';

interface ReceiptItem {
    name: string;
    quantity: number;
    price: number;
    total: number;
}

interface ReceiptData {
    companyName: string;
    address?: string;
    phone?: string;
    gstin?: string; // Tax ID
    orderNumber: string;
    date: Date;
    items: ReceiptItem[];
    subtotal: number;
    tax: number;
    discount?: number;
    roundOff?: number;
    total: number;
    paymentMode: string;
    cashierName?: string;
}

interface ThermalReceiptProps {
    data: ReceiptData | null;
    width?: '58mm' | '80mm';
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({ data, width = '80mm' }) => {
    if (!data) return null;

    return (
        <div className="thermal-receipt hidden print:block bg-white text-black font-mono text-xs leading-tight">
            <style>
                {`
                    @media print {
                        @page { margin: 0; size: auto; }
                        body * { visibility: hidden; }
                        .thermal-receipt, .thermal-receipt * { visibility: visible; }
                        .thermal-receipt {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: ${width === '58mm' ? '58mm' : '80mm'};
                            padding: 2mm;
                        }
                    }
                `}
            </style>

            <div className="text-center mb-2">
                <h1 className="text-lg font-bold uppercase">{data.companyName}</h1>
                {data.address && <p>{data.address}</p>}
                {data.phone && <p>Phone: {data.phone}</p>}
                {data.gstin && <p>GSTIN: {data.gstin}</p>}
            </div>

            <div className="border-b border-dashed border-black mb-2 pb-1">
                <div className="flex justify-between">
                    <span>Date: {new Date(data.date).toLocaleDateString()}</span>
                    <span>Time: {new Date(data.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                    <span>Order: {data.orderNumber}</span>
                    <span>Mode: {data.paymentMode}</span>
                </div>
            </div>

            <div className="mb-2">
                {/* Header */}
                <div className="grid grid-cols-12 font-bold border-b border-black pb-1 mb-1">
                    <span className="col-span-6">Item</span>
                    <span className="col-span-2 text-right">Qty</span>
                    <span className="col-span-4 text-right">Amount</span>
                </div>

                {/* Items */}
                {data.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 mb-1">
                        <span className="col-span-6 truncate">{item.name}</span>
                        <span className="col-span-2 text-right">{item.quantity}</span>
                        <span className="col-span-4 text-right">{item.total.toFixed(2)}</span>
                    </div>
                ))}
            </div>

            <div className="border-t border-dashed border-black pt-1 mb-2">
                <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{data.subtotal.toFixed(2)}</span>
                </div>
                {data.tax > 0 && (
                    <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>{data.tax.toFixed(2)}</span>
                    </div>
                )}
                {data.discount && data.discount > 0 ? (
                    <div className="flex justify-between">
                        <span>Discount:</span>
                        <span>-{data.discount.toFixed(2)}</span>
                    </div>
                ) : null}
                {data.roundOff && data.roundOff !== 0 ? (
                    <div className="flex justify-between">
                        <span>Round Off:</span>
                        <span>{data.roundOff.toFixed(2)}</span>
                    </div>
                ) : null}
                <div className="flex justify-between font-bold text-sm mt-1 border-t border-black pt-1">
                    <span>Total:</span>
                    <span>{data.total.toFixed(2)}</span>
                </div>
            </div>

            <div className="text-center mt-4">
                <p>*** THANK YOU ***</p>
                <p>Visit Again</p>
            </div>
        </div>
    );
};
