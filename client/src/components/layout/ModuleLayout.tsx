import { ReactNode } from 'react';
export function ModuleLayout({ children }: { children: ReactNode }) { return <div className="module-layout">{children}</div>; }
export function ModuleHeader({ children }: { children: ReactNode }) { return <div className="module-header flex items-center justify-between py-4">{children}</div>; }
export function ModuleContent({ children }: { children: ReactNode }) { return <div className="module-content flex-1 overflow-auto">{children}</div>; }
export function ModuleControls({ children }: { children: ReactNode }) { return <div className="flex items-center gap-2">{children}</div>; }
export function ControlGroup({ children }: { children: ReactNode }) { return <div className="flex items-center gap-1">{children}</div>; }
export function FilterBar({ children }: { children: ReactNode }) { return <div className="flex items-center gap-2 py-2">{children}</div>; }