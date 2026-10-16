'use client';

import React from 'react';
import { Search, Plus, ArrowUpDown, X, Cloud } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SortOption = 'updated' | 'title' | 'rating' | 'progress';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onOpenAddModal: () => void;
  onOpenSyncModal?: () => void;
  totalFilteredCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  onOpenAddModal,
  onOpenSyncModal,
  totalFilteredCount,
}) => {
  return (
    <header className="sticky top-0 z-20 bg-[#0F1117]/90 backdrop-blur-md border-b border-[#282D37] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Search Bar */}
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Sammlung durchsuchen (Titel, Genre, Schöpfer)..."
          className="w-full bg-[#181B22] border border-[#282D37] focus:border-zinc-500 rounded-full pl-10 pr-10 py-2 text-sm text-[#F1F3F7] placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600/50 transition-all shadow-inner"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#F1F3F7]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Controls & Add Button */}
      <div className="flex items-center gap-3 justify-between md:justify-end">
        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 bg-[#181B22] border border-[#282D37] rounded-full px-3.5 py-1.5 text-xs text-zinc-400">
          <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-500 hidden sm:inline">Sortieren:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="bg-transparent text-[#F1F3F7] font-semibold focus:outline-none cursor-pointer"
          >
            <option value="updated" className="bg-[#181B22] text-[#F1F3F7]">Zuletzt aktualisiert</option>
            <option value="title" className="bg-[#181B22] text-[#F1F3F7]">Titel (A-Z)</option>
            <option value="rating" className="bg-[#181B22] text-[#F1F3F7]">Beste Bewertung</option>
            <option value="progress" className="bg-[#181B22] text-[#F1F3F7]">Höchster Fortschritt</option>
          </select>
        </div>

        {/* Cloud-Sync & Backup Button */}
        {onOpenSyncModal && (
          <button
            onClick={onOpenSyncModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#181B22] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-[#282D37] text-xs font-semibold transition-all active:scale-95"
            title="Mediensammlung zwischen Geräten abgleichen oder Backup erstellen"
          >
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Sync &amp; Backup</span>
          </button>
        )}

        {/* Counter Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#181B22] border border-[#282D37] text-xs text-zinc-400">
          <span>Treffer:</span>
          <span className="text-[#F1F3F7] font-bold">{totalFilteredCount}</span>
        </div>

        {/* "+ Medium hinzufügen" Button */}
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-2 px-5 py-2 rounded-full bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs shadow-lg shadow-black/25 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Medium hinzufügen</span>
        </button>
      </div>
    </header>
  );
};
