/**
 * Generic TanStack Query Hook Factory
 * 
 * Creates standardized query and mutation hooks for any entity type.
 * Reduces code duplication across hook files.
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CrudService } from '../services/createCrudService';
import type { ApiResponse, PaginatedResponse, QueryParams } from '../types';

/**
 * Configuration options for creating CRUD hooks
 */
export interface CrudHooksConfig {
    /** Singular name for toast messages (e.g., 'Invoice', 'Customer') */
    entityName: string;
    /** Query key prefix for cache management */
    queryKeyPrefix: string;
}

/**
 * Return type of createCrudHooks factory
 */
export interface CrudHooks<T> {
    /** Hook to fetch all entities with optional pagination/filtering */
    useList: (params?: QueryParams, options?: Omit<UseQueryOptions<PaginatedResponse<T>>, 'queryKey' | 'queryFn'>) => ReturnType<typeof useQuery<PaginatedResponse<T>>>;
    /** Hook to fetch a single entity by ID */
    useOne: (id: string, options?: Omit<UseQueryOptions<ApiResponse<T>>, 'queryKey' | 'queryFn'>) => ReturnType<typeof useQuery<ApiResponse<T>>>;
    /** Hook to create a new entity */
    useCreate: (options?: UseMutationOptions<ApiResponse<T>, Error, Partial<T>>) => ReturnType<typeof useMutation<ApiResponse<T>, Error, Partial<T>>>;
    /** Hook to update an existing entity */
    useUpdate: (options?: UseMutationOptions<ApiResponse<T>, Error, { id: string; data: Partial<T> }>) => ReturnType<typeof useMutation<ApiResponse<T>, Error, { id: string; data: Partial<T> }>>;
    /** Hook to delete an entity */
    useDelete: (options?: UseMutationOptions<ApiResponse<void>, Error, string>) => ReturnType<typeof useMutation<ApiResponse<void>, Error, string>>;
    /** Query keys for cache invalidation */
    keys: {
        all: readonly string[];
        list: (params?: QueryParams) => readonly (string | QueryParams | undefined)[];
        one: (id: string) => readonly string[];
    };
}

/**
 * Creates TanStack Query hooks for a CRUD service
 * 
 * @param service - The CRUD service to wrap with hooks
 * @param config - Configuration for entity names and query keys
 * @returns Object containing useList, useOne, useCreate, useUpdate, useDelete hooks
 * 
 * @example
 * ```ts
 * const invoiceHooks = createCrudHooks(salesService, {
 *   entityName: 'Invoice',
 *   queryKeyPrefix: 'invoices',
 * });
 * 
 * // In component:
 * const { data, isLoading } = invoiceHooks.useList({ page: 1 });
 * const createMutation = invoiceHooks.useCreate();
 * ```
 */
export function createCrudHooks<T>(
    service: CrudService<T>,
    config: CrudHooksConfig
): CrudHooks<T> {
    const { entityName, queryKeyPrefix } = config;

    // Query keys factory
    const keys = {
        all: [queryKeyPrefix] as const,
        list: (params?: QueryParams) => [queryKeyPrefix, 'list', params] as const,
        one: (id: string) => [queryKeyPrefix, id] as const,
    };

    return {
        keys,

        useList: (params?: QueryParams, options?) => {
            return useQuery({
                queryKey: keys.list(params),
                queryFn: () => service.getAll(params),
                ...options,
            });
        },

        useOne: (id: string, options?) => {
            return useQuery({
                queryKey: keys.one(id),
                queryFn: () => service.getById(id),
                enabled: !!id,
                ...options,
            });
        },

        useCreate: (options?) => {
            const queryClient = useQueryClient();

            return useMutation({
                mutationFn: (data: Partial<T>) => service.create(data),
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: keys.all });
                    toast.success(`${entityName} created successfully`);
                },
                onError: (error: Error) => {
                    toast.error(`Failed to create ${entityName.toLowerCase()}: ${error.message}`);
                },
                ...options,
            });
        },

        useUpdate: (options?) => {
            const queryClient = useQueryClient();

            return useMutation({
                mutationFn: ({ id, data }: { id: string; data: Partial<T> }) => service.update(id, data),
                onSuccess: (_, { id }) => {
                    queryClient.invalidateQueries({ queryKey: keys.all });
                    queryClient.invalidateQueries({ queryKey: keys.one(id) });
                    toast.success(`${entityName} updated successfully`);
                },
                onError: (error: Error) => {
                    toast.error(`Failed to update ${entityName.toLowerCase()}: ${error.message}`);
                },
                ...options,
            });
        },

        useDelete: (options?) => {
            const queryClient = useQueryClient();

            return useMutation({
                mutationFn: (id: string) => service.delete(id),
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: keys.all });
                    toast.success(`${entityName} deleted successfully`);
                },
                onError: (error: Error) => {
                    toast.error(`Failed to delete ${entityName.toLowerCase()}: ${error.message}`);
                },
                ...options,
            });
        },
    };
}
