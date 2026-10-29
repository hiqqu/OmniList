'use client';

import React from 'react';
import { Search, Plus, X, Menu, Radar } from 'lucide-react';
import { GalaxySortKey, GalaxyGroupKey, GalaxyFilterState, MediaType } from '@/types/media';
import { GogSortDropdown } from './GogSortDropdown';
import { GogFilterDropdown } from './GogFilterDropdown';
import { cn } from '@/lib/utils';

export type SortOption = GalaxySortKey;

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: GalaxySortKey;
  sortDirection: 'asc' | 'desc';
  groupBy: GalaxyGroupKey;
  onSortChange: (sort: GalaxySortKey) => void;
  onDirectionToggle: () => void;
  onGroupChange: (group: GalaxyGroupKey) => void;
  filters: GalaxyFilterState;
  onFilterChange: (filters: GalaxyFilterState) => void;
  onResetFilters: () => void;
  availableTags?: string[];
  activeType?: MediaType | 'all';
  onOpenAddModal: () => void;
  onOpenAddModalWithQuery?: (query: string) => void;
  onOpenSyncModal?: () => void;
  onQuickGamingSync?: () => void;
  isQuickSyncing?: boolean;
  onOpenMobileMenu?: () => void;
  totalFilteredCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  sortBy,
  sortDirection,
  groupBy,
  onSortChange,
  onDirectionToggle,
  onGroupChange,
  filters,
  onFilterChange,
  onResetFilters,
  availableTags = [],
  activeType = 'all',
  onOpenAddModal,
  onOpenAddModalWithQuery,
  onOpenSyncModal,
  onQuickGamingSync,
  isQuickSyncing = false,
  onOpenMobileMenu,
  totalFilteredCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#0F1117]/90 backdrop-blur-md border-b border-[#282D37] px-3 sm:px-6 py-2.5 sm:py-3.5 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 max-w-[1920px] mx-auto w-full">
        {/* Top row on mobile: Menu button + Brand + Search bar */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          {/* Mobile Menu Button + Brand Logo */}
          <div className="flex items-center gap-2 lg:hidden shrink-0">
            {onOpenMobileMenu && (
              <button
                type="button"
                onClick={onOpenMobileMenu}
                className="p-2 rounded-xl bg-[#181B22] border border-[#282D37] text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                title="Filter & Menü öffnen"
                aria-label="Menü öffnen"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <div className="flex items-center gap-1.5 font-bold text-sm tracking-tight text-[#F1F3F7] sm:hidden">
              <div className="w-6 h-6 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                <Radar className="w-3.5 h-3.5 text-zinc-200" />
              </div>
              <span>OmniList</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Sammlung durchsuchen..."
              className="w-full bg-[#181B22] border border-[#282D37] focus:border-zinc-500 rounded-full pl-10 pr-9 py-2 text-xs sm:text-sm text-[#F1F3F7] placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600/50 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#F1F3F7] p-0.5"
                title="Suche leeren"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Global Catalog Search Pill when 0 collection results */}
            {searchQuery.trim().length > 0 && totalFilteredCount === 0 && onOpenAddModalWithQuery && (
              <div className="absolute left-0 top-full mt-2 z-30 w-full bg-[#181B22] border border-purple-500/40 rounded-2xl p-2.5 shadow-2xl flex items-center justify-between gap-2 backdrop-blur-md">
                <span className="text-xs text-zinc-300 truncate pl-1">
                  Nicht in Sammlung: &quot;{searchQuery}&quot;
                </span>
                <button
                  onClick={() => onOpenAddModalWithQuery(searchQuery)}
                  className="flex-shrink-0 px-3 py-1 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] shadow-sm transition-all"
                >
                  Im Katalog suchen &rarr;
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Controls: Filter Button, Sort Dropdown, Sync Button & Add Button */}
        <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-end shrink-0">
          {/* GOG Galaxy Filter Dropdown */}
          <GogFilterDropdown
            filters={filters}
            onFilterChange={onFilterChange}
            onResetFilters={onResetFilters}
            availableTags={availableTags}
            activeType={activeType}
          />

          {/* GOG Galaxy Sort & Group Dropdown */}
          <GogSortDropdown
            sortBy={sortBy}
            sortDirection={sortDirection}
            groupBy={groupBy}
            onSortChange={onSortChange}
            onDirectionToggle={onDirectionToggle}
            onGroupChange={onGroupChange}
            activeType={activeType}
          />

          {/* Counter Pill */}
          <div className="hidden xl:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#181B22] border border-[#282D37] text-xs text-zinc-400 shrink-0">
            <span>Treffer:</span>
            <span className="text-[#F1F3F7] font-bold">{totalFilteredCount}</span>
          </div>

          {/* "+ Medium hinzufügen" Button */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs shadow-lg shadow-black/25 active:scale-95 transition-all shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden xs:inline sm:inline">Medium hinzufügen</span>
            <span className="inline xs:hidden sm:hidden">Neu</span>
          </button>
        </div>
      </div>
    </header>
  );
};
