'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning';
  title: string;
  description?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-2xl border backdrop-blur-md text-xs animate-slideUp transition-all',
            t.type === 'success'
              ? 'bg-slate-900/95 border-emerald-500/40 text-emerald-300'
              : t.type === 'warning'
              ? 'bg-slate-900/95 border-amber-500/40 text-amber-300'
              : 'bg-slate-900/95 border-indigo-500/40 text-indigo-300'
          )}
        >
          {t.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : t.type === 'warning' ? (
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          ) : (
            <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
          )}

          <div className="flex-1">
            <h5 className="font-bold text-white text-xs">{t.title}</h5>
            {t.description && <p className="text-slate-400 mt-0.5">{t.description}</p>}
          </div>

          <button
            onClick={() => onDismiss(t.id)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
