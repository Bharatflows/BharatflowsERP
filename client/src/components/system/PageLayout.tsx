import { ReactNode } from 'react';
export function PageLayout({ children, title }: { children: ReactNode; title?: string }) {
  return <div className="flex flex-col h-full"><div className="p-6">{title && <h1 className="text-2xl font-bold mb-4">{title}</h1>}{children}</div></div>;
}