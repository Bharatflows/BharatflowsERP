import { useState } from 'react';
export function CommandPalette({ open, onClose }: { open?: boolean; onClose?: () => void }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-modal bg-black/50 flex items-start justify-center pt-32" onClick={onClose}><div className="bg-card rounded-xl shadow-xl w-full max-w-lg p-4" onClick={e => e.stopPropagation()}><input className="input-base" placeholder="Type a command..." autoFocus /></div></div>;
}