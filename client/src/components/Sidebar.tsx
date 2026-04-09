import { ReactNode } from 'react';
export function Sidebar({ children }: { children?: ReactNode }) { return <aside className="w-64 h-full bg-sidebar-bg border-r">{children}</aside>; }