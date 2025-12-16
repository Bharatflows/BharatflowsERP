/**
 * Network Status Indicator
 * 
 * A floating UI component that shows the current network and sync status.
 * Positioned at the bottom-right corner with collapse/expand toggle.
 */

import React, { useState } from 'react';
import {
    Wifi,
    WifiOff,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    CloudOff,
    ChevronUp,
    ChevronDown,
    Cloud
} from 'lucide-react';
import { useNetworkStatus } from '../../contexts/NetworkStatusContext';
import { cn } from '../../lib/utils';

export function NetworkStatusIndicator() {
    const {
        isOnline,
        isSyncing,
        pendingChanges,
        lastSyncedAt,
        syncError,
        triggerSync
    } = useNetworkStatus();

    const [isExpanded, setIsExpanded] = useState(false);

    // Determine status
    const getStatus = () => {
        if (!isOnline) return 'offline';
        if (isSyncing) return 'syncing';
        if (syncError) return 'error';
        if (pendingChanges > 0) return 'pending';
        return 'synced';
    };

    const status = getStatus();

    // Status configurations
    const statusConfig = {
        offline: {
            icon: WifiOff,
            color: 'bg-red-500',
            textColor: 'text-red-600',
            bgColor: 'bg-red-50 dark:bg-red-900/20',
            borderColor: 'border-red-200 dark:border-red-800',
            label: 'Offline',
            description: `${pendingChanges} changes will sync when back online`
        },
        syncing: {
            icon: RefreshCw,
            color: 'bg-yellow-500',
            textColor: 'text-yellow-600',
            bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
            borderColor: 'border-yellow-200 dark:border-yellow-800',
            label: 'Syncing...',
            description: 'Synchronizing your changes'
        },
        error: {
            icon: AlertCircle,
            color: 'bg-red-500',
            textColor: 'text-red-600',
            bgColor: 'bg-red-50 dark:bg-red-900/20',
            borderColor: 'border-red-200 dark:border-red-800',
            label: 'Sync Error',
            description: syncError || 'Failed to sync. Tap to retry.'
        },
        pending: {
            icon: Cloud,
            color: 'bg-blue-500',
            textColor: 'text-blue-600',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
            borderColor: 'border-blue-200 dark:border-blue-800',
            label: 'Changes Pending',
            description: `${pendingChanges} changes waiting to sync`
        },
        synced: {
            icon: CheckCircle2,
            color: 'bg-green-500',
            textColor: 'text-green-600',
            bgColor: 'bg-green-50 dark:bg-green-900/20',
            borderColor: 'border-green-200 dark:border-green-800',
            label: 'All Synced',
            description: lastSyncedAt
                ? `Last synced ${formatTimeAgo(lastSyncedAt)}`
                : 'All changes are saved'
        }
    };

    const config = statusConfig[status];
    const StatusIcon = config.icon;

    // Don't show if synced and no recent activity
    if (status === 'synced' && !isExpanded) {
        // Show minimal indicator
        return (
            <button
                onClick={() => setIsExpanded(true)}
                className={cn(
                    "fixed bottom-4 right-4 z-50",
                    "flex items-center gap-2 px-3 py-2",
                    "bg-white dark:bg-gray-800",
                    "border border-gray-200 dark:border-gray-700",
                    "rounded-full shadow-lg",
                    "transition-all duration-200 hover:shadow-xl",
                    "group"
                )}
            >
                <div className={cn("w-2 h-2 rounded-full", config.color)} />
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400 hidden group-hover:inline">
                    Online
                </span>
            </button>
        );
    }

    return (
        <div
            className={cn(
                "fixed bottom-4 right-4 z-50",
                "min-w-[280px] max-w-[320px]",
                "rounded-xl shadow-2xl",
                "border",
                config.bgColor,
                config.borderColor,
                "transition-all duration-300",
                isExpanded ? "p-4" : "p-3"
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* Status dot */}
                    <div className={cn(
                        "w-3 h-3 rounded-full",
                        config.color,
                        isSyncing && "animate-pulse"
                    )} />

                    {/* Icon */}
                    <StatusIcon
                        className={cn(
                            "w-5 h-5",
                            config.textColor,
                            isSyncing && "animate-spin"
                        )}
                    />

                    {/* Label */}
                    <span className={cn("font-medium text-sm", config.textColor)}>
                        {config.label}
                    </span>
                </div>

                {/* Toggle/Action buttons */}
                <div className="flex items-center gap-2">
                    {(status === 'error' || status === 'pending') && isOnline && (
                        <button
                            onClick={triggerSync}
                            disabled={isSyncing}
                            className={cn(
                                "p-1.5 rounded-lg",
                                "bg-white/50 dark:bg-gray-900/50",
                                "hover:bg-white dark:hover:bg-gray-900",
                                "transition-colors"
                            )}
                            title="Sync now"
                        >
                            <RefreshCw className={cn(
                                "w-4 h-4",
                                config.textColor,
                                isSyncing && "animate-spin"
                            )} />
                        </button>
                    )}

                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={cn(
                            "p-1.5 rounded-lg",
                            "bg-white/50 dark:bg-gray-900/50",
                            "hover:bg-white dark:hover:bg-gray-900",
                            "transition-colors"
                        )}
                    >
                        {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                            <ChevronUp className="w-4 h-4 text-gray-500" />
                        )}
                    </button>
                </div>
            </div>

            {/* Expanded content */}
            {isExpanded && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        {config.description}
                    </p>

                    {/* Additional info */}
                    <div className="mt-3 space-y-2">
                        {/* Connection status */}
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Connection</span>
                            <span className={cn(
                                "flex items-center gap-1",
                                isOnline ? "text-green-600" : "text-red-600"
                            )}>
                                {isOnline ? <Wifi className="w-3 h-3" /> : <CloudOff className="w-3 h-3" />}
                                {isOnline ? 'Online' : 'Offline'}
                            </span>
                        </div>

                        {/* Pending changes */}
                        {pendingChanges > 0 && (
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Pending changes</span>
                                <span className="text-blue-600 font-medium">{pendingChanges}</span>
                            </div>
                        )}

                        {/* Last synced */}
                        {lastSyncedAt && (
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Last synced</span>
                                <span className="text-gray-700 dark:text-gray-300">
                                    {formatTimeAgo(lastSyncedAt)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ============ HELPER FUNCTIONS ============

function formatTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return date.toLocaleDateString();
}

export default NetworkStatusIndicator;
