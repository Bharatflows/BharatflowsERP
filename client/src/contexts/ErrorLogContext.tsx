import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface ErrorLog {
    id: string;
    message: string;
    type: 'error' | 'warning' | 'unhandled';
    timestamp: number;
    stack?: string;
    source?: string;
}

interface ErrorLogContextType {
    errors: ErrorLog[];
    clearErrors: () => void;
    addError: (error: Omit<ErrorLog, 'id' | 'timestamp'>) => void;
}

const ErrorLogContext = createContext<ErrorLogContextType | undefined>(undefined);

export const ErrorLogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [errors, setErrors] = useState<ErrorLog[]>([]);

    const addError = useCallback((error: Omit<ErrorLog, 'id' | 'timestamp'>) => {
        setErrors(prev => [
            {
                ...error,
                id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36),
                timestamp: Date.now(),
            },
            ...prev,
        ].slice(0, 100)); // Keep last 100 errors
    }, []);

    const clearErrors = useCallback(() => setErrors([]), []);

    useEffect(() => {
        const originalConsoleError = console.error;

        console.error = (...args: any[]) => {
            // Call original first
            originalConsoleError.apply(console, args);

            try {
                const message = args.map(arg => {
                    if (arg instanceof Error) return arg.message;
                    if (typeof arg === 'object') {
                        try {
                            return JSON.stringify(arg);
                        } catch (e) {
                            return '[Circular or Non-Serializable Object]';
                        }
                    }
                    return String(arg);
                }).join(' ');

                const stack = args.find(arg => arg instanceof Error)?.stack;

                addError({
                    message,
                    type: 'error',
                    stack,
                    source: 'console.error'
                });
            } catch (e) {
                // Fallback if something fails in our logger to prevent loops
                originalConsoleError.call(console, 'Failed to log error to ErrorLogContext', e);
            }
        };

        const handleGlobalError = (event: ErrorEvent) => {
            addError({
                message: event.message,
                type: 'unhandled',
                stack: event.error?.stack,
                source: `${event.filename}:${event.lineno}:${event.colno}`,
            });
        };

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            addError({
                message: typeof event.reason === 'object' && event.reason instanceof Error
                    ? event.reason.message
                    : String(event.reason),
                type: 'unhandled',
                stack: typeof event.reason === 'object' && event.reason instanceof Error
                    ? event.reason.stack
                    : undefined,
                source: 'Unhandled Promise Rejection',
            });
        };

        window.addEventListener('error', handleGlobalError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        return () => {
            console.error = originalConsoleError;
            window.removeEventListener('error', handleGlobalError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, [addError]);

    return (
        <ErrorLogContext.Provider value={{ errors, clearErrors, addError }}>
            {children}
        </ErrorLogContext.Provider>
    );
};

export const useErrorLog = () => {
    const context = useContext(ErrorLogContext);
    if (context === undefined) {
        throw new Error('useErrorLog must be used within an ErrorLogProvider');
    }
    return context;
};

// Safe version that doesn't throw - returns empty defaults if provider not found
export const useSafeErrorLog = () => {
    const context = useContext(ErrorLogContext);
    if (context === undefined) {
        return { errors: [] as ErrorLog[], clearErrors: () => { }, addError: () => { } };
    }
    return context;
};
