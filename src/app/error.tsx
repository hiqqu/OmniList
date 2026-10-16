'use client';

import React from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-6 text-slate-100">
      <h2 className="text-xl font-bold mb-2 text-rose-400">Ein Fehler ist aufgetreten</h2>
      <p className="text-xs text-slate-400 mb-6 max-w-md">{error.message || 'Unerwarteter Fehler.'}</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors"
      >
        Erneut versuchen
      </button>
    </div>
  );
}
