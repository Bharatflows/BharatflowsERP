import React from 'react';
import { Skeleton } from './Skeleton';

// Table skeleton for data lists
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
    rows = 5,
    columns = 5
}) => {
    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex gap-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-t-lg">
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={i} className="h-5 flex-1" />
                ))}
            </div>

            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div
                    key={rowIndex}
                    className="flex gap-4 p-4 border-b border-gray-200 dark:border-gray-700"
                >
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Skeleton key={colIndex} className="h-4 flex-1" />
                    ))}
                </div>
            ))}
        </div>
    );
};

// Card skeleton for dashboard stats
export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <Skeleton className="h-6 w-16" />
                    </div>
                    <Skeleton className="h-7 w-24 mb-2" />
                    <Skeleton className="h-4 w-32" />
                </div>
            ))}
        </div>
    );
};

// Form skeleton
export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 4 }) => {
    return (
        <div className="space-y-6">
            {Array.from({ length: fields }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full rounded-md" />
                </div>
            ))}
            <div className="flex gap-4 pt-4">
                <Skeleton className="h-10 w-24 rounded-md" />
                <Skeleton className="h-10 w-24 rounded-md" />
            </div>
        </div>
    );
};

// List skeleton
export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/5" />
                        <Skeleton className="h-3 w-2/5" />
                    </div>
                    <Skeleton className="h-8 w-20 rounded-md" />
                </div>
            ))}
        </div>
    );
};

// Page header skeleton
export const PageHeaderSkeleton: React.FC = () => {
    return (
        <div className="flex justify-between items-center mb-6">
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex gap-3">
                <Skeleton className="h-10 w-32 rounded-lg" />
                <Skeleton className="h-10 w-32 rounded-lg" />
            </div>
        </div>
    );
};

export { TableSkeleton as default };
