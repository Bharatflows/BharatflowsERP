import { ReactNode } from 'react';
export function WorkbenchLayout({ children }: { children: ReactNode }) {
  return <div className="flex h-screen overflow-hidden">{children}</div>;
}