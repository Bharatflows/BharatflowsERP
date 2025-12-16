// TanStack Query hooks for Purchase module
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseService } from '../services/modules.service';
import { toast } from 'sonner';
import type { PurchaseOrder, QueryParams } from '../types';

// Query Keys
export const purchaseKeys = {
    all: ['purchase'] as const,
    orders: () => [...purchaseKeys.all, 'orders'] as const,
    order: (id: string) => [...purchaseKeys.orders(), id] as const,
    bills: () => [...purchaseKeys.all, 'bills'] as const,
    bill: (id: string) => [...purchaseKeys.bills(), id] as const,
    grns: () => [...purchaseKeys.all, 'grns'] as const,
    grn: (id: string) => [...purchaseKeys.grns(), id] as const,
};

// ============ PURCHASE ORDERS ============

export function usePurchaseOrders(params?: QueryParams) {
    return useQuery({
        queryKey: [...purchaseKeys.orders(), params],
        queryFn: () => purchaseService.getAll(params),
        staleTime: 5 * 60 * 1000,
    });
}

export function usePurchaseOrder(id: string) {
    return useQuery({
        queryKey: purchaseKeys.order(id),
        queryFn: () => purchaseService.getById(id),
        enabled: !!id,
    });
}

export function useCreatePurchaseOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any) => purchaseService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: purchaseKeys.orders() });
            toast.success('Purchase order created successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create purchase order');
        },
    });
}

export function useUpdatePurchaseOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            purchaseService.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: purchaseKeys.order(id) });
            queryClient.invalidateQueries({ queryKey: purchaseKeys.orders() });
            toast.success('Purchase order updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update purchase order');
        },
    });
}

export function useDeletePurchaseOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => purchaseService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: purchaseKeys.orders() });
            toast.success('Purchase order deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete purchase order');
        },
    });
}

export function useUpdatePurchaseOrderStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            purchaseService.updateStatus(id, status),
        onSuccess: (_, { id, status }) => {
            queryClient.invalidateQueries({ queryKey: purchaseKeys.order(id) });
            queryClient.invalidateQueries({ queryKey: purchaseKeys.orders() });
            const statusLabels: Record<string, string> = {
                DRAFT: 'Draft',
                SENT: 'Sent to Supplier',
                PARTIAL: 'Partial',
                RECEIVED: 'Received',
                CANCELLED: 'Cancelled'
            };
            toast.success(`Order status updated to ${statusLabels[status] || status}`);
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update order status');
        },
    });
}

// ============ PURCHASE BILLS ============

export function usePurchaseBills(params?: QueryParams) {
    return useQuery({
        queryKey: [...purchaseKeys.bills(), params],
        queryFn: () => purchaseService.getBills(params),
        staleTime: 5 * 60 * 1000,
    });
}

export function usePurchaseBill(id: string) {
    return useQuery({
        queryKey: purchaseKeys.bill(id),
        queryFn: () => purchaseService.getBillById(id),
        enabled: !!id,
    });
}

export function useCreatePurchaseBill() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any) => purchaseService.createBill(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: purchaseKeys.bills() });
            toast.success('Purchase bill created successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create purchase bill');
        },
    });
}

export function useDeletePurchaseBill() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => purchaseService.deleteBill(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: purchaseKeys.bills() });
            toast.success('Purchase bill deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete purchase bill');
        },
    });
}

// ============ GRN ============

export function useGRNs(params?: QueryParams) {
    return useQuery({
        queryKey: [...purchaseKeys.grns(), params],
        queryFn: () => purchaseService.getGRNs(params),
        staleTime: 5 * 60 * 1000,
    });
}

export function useGRN(id: string) {
    return useQuery({
        queryKey: purchaseKeys.grn(id),
        queryFn: () => purchaseService.getGRNById(id),
        enabled: !!id,
    });
}

export function useCreateGRN() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any) => purchaseService.createGRN(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: purchaseKeys.grns() });
            toast.success('GRN created successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create GRN');
        },
    });
}

export function useDeleteGRN() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => purchaseService.deleteGRN(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: purchaseKeys.grns() });
            toast.success('GRN deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete GRN');
        },
    });
}

export function useUpdateGRN() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            purchaseService.updateGRN(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: purchaseKeys.grn(id) });
            queryClient.invalidateQueries({ queryKey: purchaseKeys.grns() });
            toast.success('GRN updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update GRN');
        },
    });
}
