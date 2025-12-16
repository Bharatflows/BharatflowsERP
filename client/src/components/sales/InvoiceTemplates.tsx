import React from "react";
import { Separator } from "../ui/separator";

interface InvoiceTemplateProps {
    invoice: any;
    company: any;
}

const formatAddress = (addr: any) => {
    if (!addr) return "";
    if (typeof addr === 'string') return addr;
    const { street, city, state, pincode, country } = addr;
    return [street, city, state, pincode, country].filter(Boolean).join(", ");
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(amount || 0);
};

const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
};

export const ModernTemplate: React.FC<InvoiceTemplateProps> = ({ invoice, company }) => {
    return (
        <div className="bg-white p-8 max-w-[210mm] mx-auto min-h-[297mm] text-sm">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-primary mb-2">INVOICE</h1>
                    <p className="text-muted-foreground">#{invoice.invoiceNumber}</p>
                </div>
                <div className="text-right">
                    <h2 className="font-bold text-xl">{company?.businessName}</h2>
                    <p className="text-muted-foreground max-w-[250px] ml-auto">
                        {formatAddress(company?.address)}
                    </p>
                    {company?.gstin && <p className="text-muted-foreground">GSTIN: {company.gstin}</p>}
                    {company?.email && <p className="text-muted-foreground">{company.email}</p>}
                    {company?.phone && <p className="text-muted-foreground">{company.phone}</p>}
                </div>
            </div>

            {/* Client & Invoice Details */}
            <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                    <h3 className="text-gray-500 uppercase text-xs font-bold mb-2">Bill To</h3>
                    <p className="font-bold text-lg">{invoice.customer?.name || invoice.customerName}</p>
                    <p className="text-muted-foreground max-w-[250px]">
                        {formatAddress(invoice.customer?.billingAddress || invoice.customer?.shippingAddress)}
                    </p>
                    {invoice.customer?.gstin && <p className="text-muted-foreground">GSTIN: {invoice.customer.gstin}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h3 className="text-gray-500 uppercase text-xs font-bold mb-1">Invoice Date</h3>
                        <p>{formatDate(invoice.date || invoice.invoiceDate)}</p>
                    </div>
                    <div>
                        <h3 className="text-gray-500 uppercase text-xs font-bold mb-1">Due Date</h3>
                        <p>{formatDate(invoice.dueDate)}</p>
                    </div>
                    <div>
                        <h3 className="text-gray-500 uppercase text-xs font-bold mb-1">Status</h3>
                        <p className="capitalize">{invoice.status}</p>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <table className="w-full mb-8">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="text-left py-3 px-4 font-semibold">Item</th>
                        <th className="text-center py-3 px-4 font-semibold">Qty</th>
                        <th className="text-right py-3 px-4 font-semibold">Rate</th>
                        <th className="text-center py-3 px-4 font-semibold">Tax</th>
                        <th className="text-right py-3 px-4 font-semibold">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {invoice.items?.map((item: any, index: number) => (
                        <tr key={index} className="border-b border-gray-100">
                            <td className="py-3 px-4">
                                <p className="font-medium">{item.productName || item.name}</p>
                                {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                            </td>
                            <td className="text-center py-3 px-4">{item.quantity} {item.unit}</td>
                            <td className="text-right py-3 px-4">{formatCurrency(item.rate)}</td>
                            <td className="text-center py-3 px-4">{item.taxRate}%</td>
                            <td className="text-right py-3 px-4 font-medium">{formatCurrency(item.total || item.amount)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-12">
                <div className="w-64 space-y-2">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Subtotal</span>
                        <span>{formatCurrency(invoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Tax (GST)</span>
                        <span>{formatCurrency(invoice.totalTax)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>{formatCurrency(invoice.totalAmount || invoice.amount)}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            {(invoice.notes || invoice.termsConditions) && (
                <div className="border-t pt-8 grid grid-cols-2 gap-8 text-xs text-gray-500">
                    {invoice.notes && (
                        <div>
                            <h4 className="font-bold mb-1">Notes</h4>
                            <p>{invoice.notes}</p>
                        </div>
                    )}
                    {invoice.termsConditions && (
                        <div>
                            <h4 className="font-bold mb-1">Terms & Conditions</h4>
                            <p>{invoice.termsConditions}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const ClassicTemplate: React.FC<InvoiceTemplateProps> = ({ invoice, company }) => {
    return (
        <div className="bg-white p-8 max-w-[210mm] mx-auto min-h-[297mm] text-sm font-serif">
            <div className="text-center mb-8 border-b-2 border-black pb-4">
                <h1 className="text-3xl font-bold uppercase tracking-widest mb-2">{company?.businessName}</h1>
                <p>{formatAddress(company?.address)}</p>
                <p>GSTIN: {company?.gstin} | Email: {company?.email} | Phone: {company?.phone}</p>
            </div>

            <div className="flex justify-between mb-8">
                <div className="border p-4 w-[48%]">
                    <h3 className="font-bold border-b mb-2 pb-1">BILL TO:</h3>
                    <p className="font-bold">{invoice.customer?.name || invoice.customerName}</p>
                    <p>{formatAddress(invoice.customer?.billingAddress || invoice.customer?.shippingAddress)}</p>
                    {invoice.customer?.gstin && <p>GSTIN: {invoice.customer.gstin}</p>}
                </div>
                <div className="border p-4 w-[48%]">
                    <div className="flex justify-between mb-1">
                        <span className="font-bold">INVOICE #:</span>
                        <span>{invoice.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                        <span className="font-bold">DATE:</span>
                        <span>{formatDate(invoice.date || invoice.invoiceDate)}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                        <span className="font-bold">DUE DATE:</span>
                        <span>{formatDate(invoice.dueDate)}</span>
                    </div>
                </div>
            </div>

            <table className="w-full mb-8 border-collapse border border-black">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="border border-black py-2 px-3 text-left">Item Description</th>
                        <th className="border border-black py-2 px-3 text-center">Qty</th>
                        <th className="border border-black py-2 px-3 text-right">Rate</th>
                        <th className="border border-black py-2 px-3 text-center">Tax</th>
                        <th className="border border-black py-2 px-3 text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {invoice.items?.map((item: any, index: number) => (
                        <tr key={index}>
                            <td className="border border-black py-2 px-3">
                                <p className="font-bold">{item.productName || item.name}</p>
                                {item.description && <p className="text-xs italic">{item.description}</p>}
                            </td>
                            <td className="border border-black py-2 px-3 text-center">{item.quantity} {item.unit}</td>
                            <td className="border border-black py-2 px-3 text-right">{formatCurrency(item.rate)}</td>
                            <td className="border border-black py-2 px-3 text-center">{item.taxRate}%</td>
                            <td className="border border-black py-2 px-3 text-right">{formatCurrency(item.total || item.amount)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-end mb-12">
                <table className="w-64 border-collapse border border-black">
                    <tbody>
                        <tr>
                            <td className="border border-black py-2 px-3 font-bold">Subtotal</td>
                            <td className="border border-black py-2 px-3 text-right">{formatCurrency(invoice.subtotal)}</td>
                        </tr>
                        <tr>
                            <td className="border border-black py-2 px-3 font-bold">Tax</td>
                            <td className="border border-black py-2 px-3 text-right">{formatCurrency(invoice.totalTax)}</td>
                        </tr>
                        <tr className="bg-gray-200">
                            <td className="border border-black py-2 px-3 font-bold text-lg">TOTAL</td>
                            <td className="border border-black py-2 px-3 text-right font-bold text-lg">{formatCurrency(invoice.totalAmount || invoice.amount)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {(invoice.notes || invoice.termsConditions) && (
                <div className="mt-auto">
                    <h4 className="font-bold border-b border-black mb-2">Terms & Notes</h4>
                    <p className="text-sm">{invoice.notes}</p>
                    <p className="text-sm mt-2">{invoice.termsConditions}</p>
                </div>
            )}
        </div>
    );
};

export const MinimalTemplate: React.FC<InvoiceTemplateProps> = ({ invoice, company }) => {
    return (
        <div className="bg-white p-8 max-w-[210mm] mx-auto min-h-[297mm] text-sm font-mono">
            <div className="mb-12">
                <h1 className="text-2xl font-bold mb-4">{company?.businessName}</h1>
                <p className="text-gray-600">{formatAddress(company?.address)}</p>
            </div>

            <div className="mb-12">
                <h2 className="text-4xl font-light mb-8">Invoice {invoice.invoiceNumber}</h2>
                <div className="grid grid-cols-2 gap-12">
                    <div>
                        <p className="text-gray-500 mb-1">Billed To</p>
                        <p className="font-bold">{invoice.customer?.name || invoice.customerName}</p>
                        <p>{formatAddress(invoice.customer?.billingAddress || invoice.customer?.shippingAddress)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-gray-500 mb-1">Issued</p>
                        <p className="mb-4">{formatDate(invoice.date || invoice.invoiceDate)}</p>
                        <p className="text-gray-500 mb-1">Due</p>
                        <p>{formatDate(invoice.dueDate)}</p>
                    </div>
                </div>
            </div>

            <div className="mb-12">
                {invoice.items?.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between py-4 border-b border-dashed border-gray-300">
                        <div className="flex-1">
                            <p className="font-bold">{item.productName || item.name}</p>
                            <p className="text-xs text-gray-500">{item.quantity} x {formatCurrency(item.rate)}</p>
                        </div>
                        <div className="text-right">
                            <p>{formatCurrency(item.total || item.amount)}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-end mb-12">
                <div className="w-64">
                    <div className="flex justify-between py-2">
                        <span>Subtotal</span>
                        <span>{formatCurrency(invoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-black">
                        <span>Tax</span>
                        <span>{formatCurrency(invoice.totalTax)}</span>
                    </div>
                    <div className="flex justify-between py-4 font-bold text-xl">
                        <span>Total</span>
                        <span>{formatCurrency(invoice.totalAmount || invoice.amount)}</span>
                    </div>
                </div>
            </div>

            <div className="text-center text-gray-500 text-xs mt-auto pt-12">
                <p>Thank you for your business.</p>
            </div>
        </div>
    );
};
