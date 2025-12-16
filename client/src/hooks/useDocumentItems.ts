/**
 * useDocumentItems Hook
 * 
 * Shared hook for managing document line items across all document forms.
 * Provides common CRUD operations and calculations.
 */

import { useState, useCallback, useMemo } from 'react';
import {
    DocumentLineItem,
    createEmptyLineItem,
    calculateDocumentTotals,
    calculateTaxAmount
} from '../types/documentTypes';
import { Product } from '../types';

interface UseDocumentItemsReturn {
    items: DocumentLineItem[];
    setItems: React.Dispatch<React.SetStateAction<DocumentLineItem[]>>;
    addItem: () => void;
    removeItem: (id: string) => void;
    updateItem: (id: string, field: keyof DocumentLineItem, value: any) => void;
    selectProduct: (itemId: string, product: Product) => void;
    totals: {
        subtotal: number;
        totalTax: number;
        totalAmount: number;
    };
}

/**
 * Hook for managing document line items
 * 
 * @param initialItems - Initial items to populate
 * @returns Object with items state and CRUD operations
 */
export function useDocumentItems(
    initialItems: DocumentLineItem[] = []
): UseDocumentItemsReturn {
    const [items, setItems] = useState<DocumentLineItem[]>(
        initialItems.length > 0 ? initialItems : [createEmptyLineItem()]
    );

    // Add a new empty item
    const addItem = useCallback(() => {
        setItems(prev => [...prev, createEmptyLineItem()]);
    }, []);

    // Remove an item by ID
    const removeItem = useCallback((id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    }, []);

    // Update a specific field on an item
    const updateItem = useCallback((
        id: string,
        field: keyof DocumentLineItem,
        value: any
    ) => {
        setItems(prev => prev.map(item => {
            if (item.id !== id) return item;

            const updated = { ...item, [field]: value };

            // Recalculate amount when quantity, rate, or taxRate changes
            if (field === 'quantity' || field === 'rate' || field === 'taxRate') {
                const subtotal = updated.quantity * updated.rate;
                const taxAmount = subtotal * (updated.taxRate / 100);
                updated.amount = subtotal + taxAmount;
                updated.taxAmount = taxAmount;
                updated.total = updated.amount;
            }

            return updated;
        }));
    }, []);

    // Select a product and populate item fields
    const selectProduct = useCallback((itemId: string, product: Product) => {
        setItems(prev => prev.map(item => {
            if (item.id !== itemId) return item;

            const rate = product.salePrice || 0;
            const taxRate = product.gstRate || 0;
            const quantity = item.quantity || 1;
            const subtotal = quantity * rate;
            const taxAmount = subtotal * (taxRate / 100);

            return {
                ...item,
                productId: product.id,
                product,
                name: product.name,
                productName: product.name,
                unit: product.unit || 'PCS',
                rate,
                taxRate,
                taxAmount,
                amount: subtotal + taxAmount,
                total: subtotal + taxAmount,
            };
        }));
    }, []);

    // Calculate totals
    const totals = useMemo(() => calculateDocumentTotals(items), [items]);

    return {
        items,
        setItems,
        addItem,
        removeItem,
        updateItem,
        selectProduct,
        totals,
    };
}
