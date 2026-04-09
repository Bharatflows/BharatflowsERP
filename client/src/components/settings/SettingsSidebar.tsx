import { ReactNode } from 'react';
export type SettingsPage = string;
export const SETTINGS_NAV: Array<{ id: SettingsPage; label: string; icon?: string }> = [
  { id: 'general', label: 'General' },
  { id: 'branch', label: 'Branches' },
  { id: 'fy', label: 'Financial Year' },
  { id: 'users', label: 'Users & Roles' },
  { id: 'subscription', label: 'Subscription' },
  { id: 'payment-gateway', label: 'Payment Gateway' },
];
export function SettingsSidebar({ active, onSelect }: { active?: SettingsPage; onSelect?: (p: SettingsPage) => void }) {
  return <nav className="w-56 border-r p-4 space-y-1">{SETTINGS_NAV.map(n => <button key={n.id} className={`w-full text-left px-3 py-2 rounded-md text-sm ${active === n.id ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}`} onClick={() => onSelect?.(n.id)}>{n.label}</button>)}</nav>;
}