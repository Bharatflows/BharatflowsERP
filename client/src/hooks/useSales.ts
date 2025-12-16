// TanStack Query hooks for Sales module
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesService, estimatesService, salesOrdersService, deliveryChallansService } from '../services/modules.service';
import { salesService as quotationSalesService } from '../services/sales.service';
import { toast } from 'sonner';
import type { Invoice, Estimate, SalesOrder, Quotation, QueryParams } from '../types';

// Query Keys
export const salesKeys = {
    all: ['sales'] as const,
    invoices: () => [...salesKeys.all, 'invoices'] as const,
    invoice: (id: string) => [...salesKeys.invoices(), id] as const,
    estimates: () => [...salesKeys.all, 'estimates'] as const,
    estimate: (id: string) => [...salesKeys.estimates(), id] as const,
    quotations: () => [...salesKeys.all, 'quotations'] as const,
    quotation: (id: string) => [...salesKeys.quotations(), id] as const,
    orders: () => [...salesKeys.all, 'orders'] as const,
    order: (id: string) => [...salesKeys.orders(), id] as const,
    challans: () => [...salesKeys.all, 'challans'] as const,
    challan: (id: string) => [...salesKeys.challans(), id] as const,
};

// ============ INVOICES ============

export function useInvoices(params?: QueryParams) {
    return useQuery({
        queryKey: [...salesKeys.invoices(), params],
        queryFn: () => salesService.getAll(params),
        staleTime: 5 * 60 * 1000,
    });
}

export function useInvoice(id: string) {
    return useQuery({
        queryKey: salesKeys.invoice(id),
        queryFn: () => salesService.getById(id),
        enabled: !!id,
    });
}

export function useCreateInvoice() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<Invoice>) => salesService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: salesKeys.invoices() });
            toast.success('Invoice created successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create invoice');
        },
    });
}

export function useUpdateInvoice() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Invoice> }) =>
            salesService.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: salesKeys.invoice(id) });
            queryClient.invalidateQueries({ queryKey: salesKeys.invoices() });
            toast.success('Invoice updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update invoice');
        },
    });
}

export function useDeleteInvoice() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => salesService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: salesKeys.invoices() });
            toast.success('Invoice deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete invoice');
        },
    });
}

// ============ ESTIMATES ============

export function useEstimates(params?: QueryParams) {
    return useQuery({
        queryKey: [...salesKeys.estimates(), params],
        queryFn: () => estimatesService.getAll(params),
        staleTime: 5 * 60 * 1000,
    });
}

export function useEstimate(id: string) {
    return useQuery({
        queryKey: salesKeys.estimate(id),
        queryFn: () => estimatesService.getById(id),
        enabled: !!id,
    });
}

export function useCreateEstimate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<Estimate>) => estimatesService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: salesKeys.estimates() });
            toast.success('Estimate created successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create estimate');
        },
    });
}

export function useUpdateEstimate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Estimate> }) =>
            estimatesService.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: salesKeys.estimate(id) });
            queryClient.invalidateQueries({ queryKey: salesKeys.estimates() });
            toast.success('Estimate updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update estimate');
        },
    });
}

export function useDeleteEstimate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => estimatesService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: salesKeys.estimates() });
            toast.success('Estimate deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete estimate');
        },
    });
}

// ============ SALES ORDERS ============

export function useSalesOrders(params?: QueryParams) {
    return useQuery({
        queryKey: [...salesKeys.orders(), params],
        queryFn: () => salesOrdersService.getAll(params),
        staleTime: 5 * 60 * 1000,
    });
}

export function useCreateSalesOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<SalesOrder>) => salesOrdersService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: salesKeys.orders() });
            toast.success('Sales order created successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create sales order');
        },
    });
}

export function useDeleteSalesOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => salesOrdersService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: salesKeys.orders() });
            toast.success('Sales order deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete sales order');
        },
    });
}

// ============ DELIVERY CHALLANS ============

export function useDeliveryChallans(params?: QueryParams) {
    return useQuery({
        queryKey: [...salesKeys.challans(), params],
        queryFn: () => deliveryChallansService.getAll(params),
        staleTime: 5 * 60 * 1000,
    });
}

export function useCreateDeliveryChallan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any) => deliveryChallansService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: salesKeys.challans() });
            toast.success('Delivery challan created successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create delivery challan');
        },
    });
}

export function useDeleteDeliveryChallan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deliveryChallansService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: salesKeys.challans() });
            toast.success('Delivery challan deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete delivery challan');
        },
    });
}

// ============ QUOTATIONS ============

export function useQuotations(params?: QueryParams) {
    return useQuery({
        queryKey: [...salesKeys.quotations(), params],
        queryFn: () => quotationSalesService.getQuotations(params),
        staleTime: 5 * 60 * 1000,
    });
}

export function useQuotation(id: string) {
    return useQuery({
        queryKey: salesKeys.quotation(id),
        queryFn: () => quotationSalesService.getQuotation(id),
        enabled: !!id,
    });
}

export function useCreateQuotation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<Quotation>) => quotationSalesService.createQuotation(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: salesKeys.quotations() });
            toast.success('Quotation created successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create quotation');
        },
    });
}

export function useDeleteQuotation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => quotationSalesService.deleteQuotation(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: salesKeys.quotations() });
            toast.success('Quotation deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete quotation');
        },
    });
}
