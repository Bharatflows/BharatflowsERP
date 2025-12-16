/**
 * Route-Level Error Boundary
 * 
 * A specialized error boundary for wrapping individual route modules.
 * Displays a compact error UI that allows users to retry or navigate away
 * without affecting the entire application.
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw, ChevronLeft } from 'lucide-react';
import { Button } from '../ui/button';

interface Props {
    children: ReactNode;
    moduleName?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class RouteErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`[${this.props.moduleName || 'Route'}] Error:`, error, errorInfo);
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    private handleGoBack = () => {
        window.history.back();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
                    <div className="bg-destructive/10 p-4 rounded-full mb-4">
                        <AlertCircle className="h-10 w-10 text-destructive" />
                    </div>

                    <h2 className="text-xl font-semibold text-foreground mb-2">
                        {this.props.moduleName || 'Module'} Error
                    </h2>

                    <p className="text-muted-foreground text-center max-w-md mb-6">
                        Something went wrong loading this section.
                        You can try again or go back to the previous page.
                    </p>

                    {import.meta.env.DEV && this.state.error && (
                        <div className="bg-muted rounded-lg p-4 mb-6 max-w-lg overflow-auto">
                            <code className="text-sm text-destructive">
                                {this.state.error.message}
                            </code>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button onClick={this.handleRetry} size="sm" className="gap-2">
                            <RefreshCcw className="h-4 w-4" />
                            Try Again
                        </Button>
                        <Button onClick={this.handleGoBack} variant="outline" size="sm" className="gap-2">
                            <ChevronLeft className="h-4 w-4" />
                            Go Back
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Higher-order component to wrap lazy-loaded route components with error boundary
 */
export function withRouteErrorBoundary<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    moduleName?: string
) {
    return function WithRouteErrorBoundary(props: P) {
        return (
            <RouteErrorBoundary moduleName={moduleName}>
                <WrappedComponent {...props} />
            </RouteErrorBoundary>
        );
    };
}
