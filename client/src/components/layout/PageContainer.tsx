import { ReactNode } from 'react';
export function PageContainer({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`page-container-constrained ${className}`}>{children}</div>;
}