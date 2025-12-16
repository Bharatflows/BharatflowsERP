/**
 * Document Line Item Types
 * 
 * Shared TypeScript types for line items across all document types:
 * - Invoice, Estimate, Quotation, Sales Order, Delivery Challan
 * - Purchase Order, Purchase Bill, GRN
 * 
 * These types reduce duplication and ensure consistency.
 */

import { Product } from './index';

/**
 * Base line item interface shared across all document types.
 * Contains the common fields present in every document line.
 */
export interface DocumentLineItem {
    id: string;
    productId?: string;
    product?: Product;
    name: string;
    productName?: string; // Alias for name, used by some forms
    description?: string;
    quantity: number;
    unit: string;
    rate: number;
    taxRate: number;
    taxAmount?: number;
    amount: number;
    total?: number; // Alias for amount
}

/**
 * Invoice line item with productName field
 */
export interface InvoiceLineItem extends DocumentLineItem {
    productName: string;
}

/**
 * Sales Order line item with shipped quantity tracking
 */
export interface SalesOrderLineItem extends DocumentLineItem {
    shippedQuantity: number;
}

/**
 * Purchase Order line item with received quantity tracking
 */
export interface PurchaseOrderLineItem extends DocumentLineItem {
    receivedQuantity: number;
}

/**
 * Delivery Challan line item (uses base)
 */
export type DeliveryChallanLineItem = DocumentLineItem;

/**
 * Estimate line item (uses base)
 */
export type EstimateLineItem = DocumentLineItem;

/**
 * Quotation line item (uses base)
 */
export type QuotationLineItem = DocumentLineItem;

/**
 * GRN line item with acceptance tracking
 */
export interface GRNLineItem extends DocumentLineItem {
    acceptedQuantity: number;
    rejectedQuantity: number;
}

/**
 * Create empty line item with default values
 */
export function createEmptyLineItem(): DocumentLineItem {
    return {
        id: crypto.randomUUID(),
        productId: undefined,
        name: '',
        description: '',
        quantity: 1,
        unit: 'PCS',
        rate: 0,
        taxRate: 0,
        amount: 0,
    };
}

/**
 * Calculate line item amount based on quantity, rate, and tax
 */
export function calculateLineItemAmount(item: DocumentLineItem): number {
    const subtotal = item.quantity * item.rate;
    const taxAmount = subtotal * (item.taxRate / 100);
    return subtotal + taxAmount;
}

/**
 * Calculate tax amount for a line item
 */
export function calculateTaxAmount(item: DocumentLineItem): number {
    const subtotal = item.quantity * item.rate;
    return subtotal * (item.taxRate / 100);
}

/**
 * Calculate totals for an array of line items
 */
export function calculateDocumentTotals(items: DocumentLineItem[]): {
    subtotal: number;
    totalTax: number;
    totalAmount: number;
} {
    let subtotal = 0;
    let totalTax = 0;

    items.forEach(item => {
        const lineSubtotal = item.quantity * item.rate;
        const lineTax = lineSubtotal * (item.taxRate / 100);
        subtotal += lineSubtotal;
        totalTax += lineTax;
    });

    return {
        subtotal,
        totalTax,
        totalAmount: subtotal + totalTax,
    };
}
