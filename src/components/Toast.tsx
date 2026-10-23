'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-5 right-3 sm:right-5 left-3 sm:left-auto z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl shadow-2xl border backdrop-blur-md text-xs animate-slideUp transition-all',
            t.type === 'success'
              ? 'bg-[#181B22]/95 border-emerald-500/40 text-emerald-400'
              : t.type === 'error'
              ? 'bg-[#181B22]/95 border-rose-500/40 text-rose-400'
              : t.type === 'warning'
              ? 'bg-[#181B22]/95 border-amber-500/40 text-amber-300'
              : 'bg-[#181B22]/95 border-zinc-700 text-zinc-200'
          )}
        >
          {t.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : t.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          ) : t.type === 'warning' ? (
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          ) : (
            <Info className="w-4 h-4 text-zinc-300 flex-shrink-0 mt-0.5" />
          )}

          <div className="flex-1 min-w-0">
            <h5 className="font-bold text-[#F1F3F7] text-xs truncate">{t.title}</h5>
            {t.description && <p className="text-zinc-400 mt-0.5 line-clamp-2">{t.description}</p>}
          </div>

          {t.action && (
            <button
              onClick={() => {
                t.action?.onClick();
                onDismiss(t.id);
              }}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold text-[11px] border border-zinc-600 transition-colors shrink-0 shadow-sm"
            >
              {t.action.label}
            </button>
          )}

          <button
            onClick={() => onDismiss(t.id)}
            className="text-zinc-400 hover:text-[#F1F3F7] transition-colors p-0.5"
            aria-label="Benachrichtigung schließen"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
