import { ReactNode } from 'react';

/**
 * DesignSystemProvider
 * Provides global design system context (theme tokens, breakpoints, etc.)
 * Currently a pass-through wrapper; extend as needed.
 */
export function DesignSystemProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
