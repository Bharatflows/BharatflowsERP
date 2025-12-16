// TanStack Query hooks for Parties (Customers/Suppliers)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partiesService, reportsService } from '../services/modules.service';
import { toast } from 'sonner';
import type { Party, QueryParams } from '../types';

// Query Keys
export const partiesKeys = {
    all: ['parties'] as const,
    list: (params?: QueryParams) => [...partiesKeys.all, 'list', params] as const,
    detail: (id: string) => [...partiesKeys.all, 'detail', id] as const,
    customers: () => [...partiesKeys.all, 'customers'] as const,
    suppliers: () => [...partiesKeys.all, 'suppliers'] as const,
    ledger: (id: string) => [...partiesKeys.all, 'ledger', id] as const,
};

// ============ PARTIES (ALL) ============

export function useParties(params?: QueryParams) {
    return useQuery({
        queryKey: partiesKeys.list(params),
        queryFn: () => partiesService.getAll(params),
        staleTime: 5 * 60 * 1000,
    });
}

export function useCustomers(params?: Omit<QueryParams, 'type'>) {
    return useQuery({
        queryKey: [...partiesKeys.customers(), params],
        queryFn: () => partiesService.getAll({ ...params, type: 'CUSTOMER' }),
        staleTime: 5 * 60 * 1000,
    });
}

export function useSuppliers(params?: Omit<QueryParams, 'type'>) {
    return useQuery({
        queryKey: [...partiesKeys.suppliers(), params],
        queryFn: () => partiesService.getAll({ ...params, type: 'SUPPLIER' }),
        staleTime: 5 * 60 * 1000,
    });
}

export function useParty(id: string) {
    return useQuery({
        queryKey: partiesKeys.detail(id),
        queryFn: () => partiesService.getById(id),
        enabled: !!id,
    });
}

export function usePartyLedger(id: string, params?: { startDate?: string; endDate?: string }) {
    return useQuery({
        queryKey: [...partiesKeys.ledger(id), params],
        queryFn: () => reportsService.getPartyStatement(id, params),
        enabled: !!id,
        staleTime: 2 * 60 * 1000,
    });
}

export function useCreateParty() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<Party>) => partiesService.create(data),
        onSuccess: (response) => {
            // Invalidate all party lists
            queryClient.invalidateQueries({ queryKey: partiesKeys.all });
            const type = response.data?.type;
            toast.success(`${type === 'CUSTOMER' ? 'Customer' : type === 'SUPPLIER' ? 'Supplier' : 'Party'} created successfully`);
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create party');
        },
    });
}

export function useUpdateParty() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Party> }) =>
            partiesService.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: partiesKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: partiesKeys.all });
            toast.success('Party updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update party');
        },
    });
}

export function useDeleteParty() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => partiesService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: partiesKeys.all });
            toast.success('Party deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete party');
        },
    });
}
