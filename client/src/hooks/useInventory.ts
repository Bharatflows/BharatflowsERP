// TanStack Query hooks for Inventory/Products module
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsService, inventoryService } from '../services/modules.service';
import { toast } from 'sonner';
import type { Product, QueryParams } from '../types';

// Query Keys
export const inventoryKeys = {
    all: ['inventory'] as const,
    products: () => [...inventoryKeys.all, 'products'] as const,
    product: (id: string) => [...inventoryKeys.products(), id] as const,
    lowStock: () => [...inventoryKeys.all, 'low-stock'] as const,
    warehouses: () => [...inventoryKeys.all, 'warehouses'] as const,
    valuation: () => [...inventoryKeys.all, 'valuation'] as const,
    stockMovements: () => [...inventoryKeys.all, 'stock-movements'] as const,
};

// ============ PRODUCTS ============

export function useProducts(params?: QueryParams) {
    return useQuery({
        queryKey: [...inventoryKeys.products(), params],
        queryFn: () => productsService.getAll(params),
        staleTime: 5 * 60 * 1000,
    });
}

export function useProduct(id: string) {
    return useQuery({
        queryKey: inventoryKeys.product(id),
        queryFn: () => productsService.getById(id),
        enabled: !!id,
    });
}

export function useCreateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<Product>) => productsService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.products() });
            toast.success('Product created successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create product');
        },
    });
}

export function useUpdateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
            productsService.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.product(id) });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.products() });
            toast.success('Product updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update product');
        },
    });
}

export function useDeleteProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => productsService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.products() });
            toast.success('Product deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete product');
        },
    });
}

// ============ STOCK OPERATIONS ============

export function useLowStock() {
    return useQuery({
        queryKey: inventoryKeys.lowStock(),
        queryFn: () => inventoryService.getLowStock(),
        staleTime: 2 * 60 * 1000, // More frequent updates for alerts
    });
}

export function useAdjustStock() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            productId: string;
            quantity: number;
            type: 'ADD' | 'REMOVE' | 'DAMAGE' | 'RETURN' | 'CORRECTION';
            reason: string;
            notes?: string;
        }) => inventoryService.adjustStock(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.products() });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.lowStock() });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.stockMovements() });
            toast.success('Stock adjusted successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to adjust stock');
        },
    });
}

export function useTransferStock() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            productId: string;
            fromWarehouseId: string;
            toWarehouseId: string;
            quantity: number;
            notes?: string;
        }) => inventoryService.transferStock(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.products() });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.stockMovements() });
            toast.success('Stock transferred successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to transfer stock');
        },
    });
}

// ============ WAREHOUSES ============

export function useWarehouses() {
    return useQuery({
        queryKey: inventoryKeys.warehouses(),
        queryFn: () => inventoryService.getWarehouses(),
        staleTime: 10 * 60 * 1000,
    });
}

export function useCreateWarehouse() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: inventoryService.createWarehouse,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.warehouses() });
            toast.success('Warehouse created successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create warehouse');
        },
    });
}

export function useUpdateWarehouse() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<any> }) =>
            inventoryService.updateWarehouse(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.warehouses() });
            toast.success('Warehouse updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update warehouse');
        },
    });
}

export function useDeleteWarehouse() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => inventoryService.deleteWarehouse(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.warehouses() });
            toast.success('Warehouse deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete warehouse');
        },
    });
}

export function useStockMovements(params?: { type?: string; startDate?: string; endDate?: string; limit?: number }) {
    return useQuery({
        queryKey: [...inventoryKeys.stockMovements(), params],
        queryFn: () => inventoryService.getStockMovements(params),
        staleTime: 2 * 60 * 1000,
    });
}

// ============ VALUATION ============

export function useInventoryValuation() {
    return useQuery({
        queryKey: inventoryKeys.valuation(),
        queryFn: () => inventoryService.getValuation(),
        staleTime: 5 * 60 * 1000,
    });
}

