'use client';

import React from 'react';
import { Search, Plus, ArrowUpDown, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SortOption = 'updated' | 'title' | 'rating' | 'progress';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onOpenAddModal: () => void;
  totalFilteredCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  onOpenAddModal,
  totalFilteredCount,
}) => {
  return (
    <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Search Bar - Instant < 10ms local full-text search */}
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Sammlung durchsuchen (Titel, Genre, Schöpfer)..."
          className="w-full bg-surface/90 border border-border focus:border-primary/80 rounded-xl pl-10 pr-10 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all shadow-inner"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Controls & Add Button */}
      <div className="flex items-center gap-3 justify-between md:justify-end">
        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-1.5 text-xs text-slate-300">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 hidden sm:inline">Sortieren:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
          >
            <option value="updated" className="bg-slate-900">Zuletzt aktualisiert</option>
            <option value="title" className="bg-slate-900">Titel (A-Z)</option>
            <option value="rating" className="bg-slate-900">Beste Bewertung</option>
            <option value="progress" className="bg-slate-900">Höchster Fortschritt</option>
          </select>
        </div>

        {/* Counter Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
          <span>Treffer:</span>
          <span className="text-white font-bold">{totalFilteredCount}</span>
        </div>

        {/* "+ Medium hinzufügen" Button */}
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-primary/25 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Medium hinzufügen</span>
        </button>
      </div>
    </header>
  );
};
