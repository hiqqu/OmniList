'use client';

import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-6 text-slate-100">
      <h2 className="text-2xl font-bold mb-2">Seite nicht gefunden</h2>
      <p className="text-sm text-slate-400 mb-6">Die angeforderte Seite existiert nicht.</p>
      <Link
        href="/"
        className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold shadow-md hover:bg-primary-hover transition-colors"
      >
        Zurück zum Dashboard
      </Link>
    </div>
  );
}
