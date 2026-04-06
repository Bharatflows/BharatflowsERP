import React from 'react';
import { Package, Users, FileText, TrendingUp, Inbox, Search, Database, Receipt } from 'lucide-react';

interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: 'package' | 'users' | 'file' | 'trending' | 'inbox' | 'search' | 'database' | 'receipt' | React.ReactNode;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    package: Package,
    users: Users,
    file: FileText,
    trending: TrendingUp,
    inbox: Inbox,
    search: Search,
    database: Database,
    receipt: Receipt
};

export const EmptyState: React.FC<EmptyStateProps> = ({
    title,
    description,
    icon = 'inbox',
    action,
    className = ''
}) => {
    const IconComponent = typeof icon === 'string' ? iconMap[icon] : null;

    return (
        <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center mb-6">
                {IconComponent ? (
                    <IconComponent className="w-10 h-10 text-blue-500 dark:text-blue-400" />
                ) : (
                    icon
                )}
            </div>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {title}
            </h3>

            {description && (
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6 whitespace-normal">
                    {description}
                </p>
            )}

            {action && (
                <button
                    onClick={action.onClick}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-medium rounded-lg shadow-lg shadow-primary/25 transition-all duration-200 hover:-translate-y-0.5"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
};

// Preset empty states for common scenarios
export const NoDataEmptyState: React.FC<{ onAdd?: () => void; itemName?: string }> = ({
    onAdd,
    itemName = 'items'
}) => (
    <EmptyState
        icon="inbox"
        title={`No ${itemName} yet`}
        description={`Get started by creating your first ${itemName.slice(0, -1)}. It only takes a moment.`}
        action={onAdd ? { label: `Add ${itemName.slice(0, -1)}`, onClick: onAdd } : undefined}
    />
);

export const SearchEmptyState: React.FC<{ query?: string }> = ({ query }) => (
    <EmptyState
        icon="search"
        title="No results found"
        description={query
            ? `We couldn't find anything matching "${query}". Try adjusting your search terms.`
            : 'Try adjusting your filters or search terms to find what you\'re looking for.'
        }
    />
);

export const ErrorEmptyState: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
    <EmptyState
        icon="database"
        title="Something went wrong"
        description="We encountered an error while loading the data. Please try again."
        action={onRetry ? { label: 'Retry', onClick: onRetry } : undefined}
    />
);

export default EmptyState;
