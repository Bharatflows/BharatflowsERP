import { ReactNode } from 'react';
export default function FormSection({ children, title }: { children: ReactNode; title?: string }) {
  return <div className="space-y-4"><h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">{title}</h3>{children}</div>;
}