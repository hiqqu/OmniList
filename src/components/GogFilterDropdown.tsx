'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  SlidersHorizontal,
  ChevronRight,
  Check,
  X,
  RotateCcw,
} from 'lucide-react';
import { GalaxyFilterState } from '@/types/media';
import { cn } from '@/lib/utils';

interface GogFilterDropdownProps {
  filters: GalaxyFilterState;
  onFilterChange: (filters: GalaxyFilterState) => void;
  onResetFilters: () => void;
  availableTags?: string[];
  className?: string;
}

type FilterCategory = 'platform' | 'consoles' | 'rating' | 'tags' | 'status';

const PLATFORM_OPTIONS = [
  { id: 'epic', label: 'Epic' },
  { id: 'gog', label: 'GOG.com' },
  { id: 'other', label: 'Other' },
  { id: 'psn', label: 'PlayStation' },
  { id: 'steam', label: 'Steam' },
];

const CONSOLE_OPTIONS = [
  { id: 'PS5', label: 'PS5' },
  { id: 'PS4', label: 'PS4' },
  { id: 'PS3', label: 'PS3' },
  { id: 'PC', label: 'PC (Windows)' },
  { id: 'other', label: 'Andere Konsolen' },
];

const RATING_OPTIONS = [
  { id: '90', label: '90+ Metacritic (Meisterwerk)' },
  { id: '80', label: '80+ Metacritic (Herausragend)' },
  { id: '70', label: '70+ Metacritic (Gut)' },
  { id: 'stars5', label: '5 Sterne (Eigene Wertung)' },
  { id: 'stars4', label: '4+ Sterne' },
  { id: 'stars3', label: '3+ Sterne' },
];

const STATUS_OPTIONS = [
  { id: 'in_progress', label: 'Gerade dabei' },
  { id: 'completed', label: 'Beendet' },
  { id: 'planned', label: 'Geplant' },
  { id: 'paused', label: 'Pausiert' },
  { id: 'dropped', label: 'Abgebrochen' },
  { id: 'live_service', label: 'Live-Service' },
];

export const GogFilterDropdown: React.FC<GogFilterDropdownProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  availableTags = [],
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('platform');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicked outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const toggleItem = (category: FilterCategory, id: string) => {
    const nextFilters = { ...filters };
    if (category === 'platform') {
      const set = new Set(nextFilters.platforms);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      nextFilters.platforms = Array.from(set);
    } else if (category === 'consoles') {
      const set = new Set(nextFilters.consoles);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      nextFilters.consoles = Array.from(set);
    } else if (category === 'rating') {
      const set = new Set(nextFilters.ratings);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      nextFilters.ratings = Array.from(set);
    } else if (category === 'tags') {
      const set = new Set(nextFilters.tags);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      nextFilters.tags = Array.from(set);
    } else if (category === 'status') {
      const set = new Set(nextFilters.statuses);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      nextFilters.statuses = Array.from(set);
    }
    onFilterChange(nextFilters);
  };

  const totalActiveFilters =
    filters.platforms.length +
    filters.consoles.length +
    filters.ratings.length +
    filters.tags.length +
    filters.statuses.length;

  const categories: { id: FilterCategory; label: string; count: number }[] = [
    { id: 'platform', label: 'Platform', count: filters.platforms.length },
    { id: 'consoles', label: 'OS & consoles', count: filters.consoles.length },
    { id: 'rating', label: 'Rating', count: filters.ratings.length },
    { id: 'tags', label: 'Tags', count: filters.tags.length },
    { id: 'status', label: 'Status', count: filters.statuses.length },
  ];

  return (
    <div className={cn('relative inline-block text-left', className)} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all shadow-sm',
          totalActiveFilters > 0
            ? 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border-purple-500/40 shadow-purple-950/20'
            : 'bg-[#181B22] hover:bg-[#20242D] text-zinc-300 hover:text-white border-[#282D37]'
        )}
        title="GOG Galaxy Filter öffnen"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
        <span>Filter</span>
        {totalActiveFilters > 0 && (
          <span className="px-1.5 py-0.2 rounded-full bg-purple-500 text-white text-[10px] font-bold">
            {totalActiveFilters}
          </span>
        )}
      </button>

      {/* Flyout Filter Popover (GOG Galaxy Style) */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-50 flex flex-col bg-[#1A1D23] border border-[#2B303C] rounded-2xl shadow-2xl overflow-hidden animate-fadeIn min-w-[340px] sm:min-w-[400px]">
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-[#2B303C]/70 flex items-center justify-between bg-[#15171C]">
            <span className="text-xs font-bold text-zinc-200 tracking-wide uppercase">
              Filter
            </span>
            {totalActiveFilters > 0 && (
              <button
                type="button"
                onClick={onResetFilters}
                className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Zurücksetzen ({totalActiveFilters})</span>
              </button>
            )}
          </div>

          {/* Two-Column Galaxy Menu Layout */}
          <div className="flex divide-x divide-[#2B303C]/70 min-h-[220px] max-h-[360px]">
            {/* Left Column: Categories */}
            <div className="w-[150px] sm:w-[170px] py-1.5 bg-[#171A20] shrink-0">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <div
                    key={cat.id}
                    onMouseEnter={() => setActiveCategory(cat.id)}
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      'flex items-center justify-between px-3.5 py-2 text-xs cursor-pointer transition-colors',
                      isActive
                        ? 'bg-[#272B35] text-white font-semibold'
                        : 'text-zinc-300 hover:bg-[#20232B] hover:text-zinc-100'
                    )}
                  >
                    <span className="truncate">{cat.label}</span>
                    <div className="flex items-center gap-1">
                      <span className="px-1.5 py-0.5 rounded bg-[#101216] text-[10px] text-zinc-400 font-mono">
                        {cat.count}
                      </span>
                      <ChevronRight className="w-3 h-3 text-zinc-500" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column: Checkboxes for Active Category */}
            <div className="flex-1 p-2.5 overflow-y-auto scrollbar-thin bg-[#1D2027]">
              {/* PLATFORM CHECKBOXES */}
              {activeCategory === 'platform' && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 py-0.5 mb-1">
                    Plattformen ({filters.platforms.length} gewählt)
                  </div>
                  {PLATFORM_OPTIONS.map((opt) => {
                    const isChecked = filters.platforms.includes(opt.id);
                    return (
                      <label
                        key={opt.id}
                        onClick={() => toggleItem('platform', opt.id)}
                        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-[#282C37] cursor-pointer text-xs text-zinc-200 transition-colors select-none"
                      >
                        <div
                          className={cn(
                            'w-4 h-4 rounded border flex items-center justify-center transition-all',
                            isChecked
                              ? 'bg-purple-600 border-purple-500 text-white'
                              : 'bg-[#14161B] border-zinc-600 hover:border-zinc-500'
                          )}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className={cn(isChecked && 'text-white font-medium')}>{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* OS & CONSOLES CHECKBOXES */}
              {activeCategory === 'consoles' && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 py-0.5 mb-1">
                    Konsolen &amp; Systeme
                  </div>
                  {CONSOLE_OPTIONS.map((opt) => {
                    const isChecked = filters.consoles.includes(opt.id);
                    return (
                      <label
                        key={opt.id}
                        onClick={() => toggleItem('consoles', opt.id)}
                        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-[#282C37] cursor-pointer text-xs text-zinc-200 transition-colors select-none"
                      >
                        <div
                          className={cn(
                            'w-4 h-4 rounded border flex items-center justify-center transition-all',
                            isChecked
                              ? 'bg-blue-600 border-blue-500 text-white'
                              : 'bg-[#14161B] border-zinc-600 hover:border-zinc-500'
                          )}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className={cn(isChecked && 'text-white font-medium')}>{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* RATING CHECKBOXES */}
              {activeCategory === 'rating' && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 py-0.5 mb-1">
                    Bewertung &amp; Kritiken
                  </div>
                  {RATING_OPTIONS.map((opt) => {
                    const isChecked = filters.ratings.includes(opt.id);
                    return (
                      <label
                        key={opt.id}
                        onClick={() => toggleItem('rating', opt.id)}
                        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-[#282C37] cursor-pointer text-xs text-zinc-200 transition-colors select-none"
                      >
                        <div
                          className={cn(
                            'w-4 h-4 rounded border flex items-center justify-center transition-all',
                            isChecked
                              ? 'bg-amber-600 border-amber-500 text-white'
                              : 'bg-[#14161B] border-zinc-600 hover:border-zinc-500'
                          )}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className={cn(isChecked && 'text-white font-medium')}>{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* STATUS CHECKBOXES */}
              {activeCategory === 'status' && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 py-0.5 mb-1">
                    Status ({filters.statuses.length} gewählt)
                  </div>
                  {STATUS_OPTIONS.map((opt) => {
                    const isChecked = filters.statuses.includes(opt.id);
                    return (
                      <label
                        key={opt.id}
                        onClick={() => toggleItem('status', opt.id)}
                        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-[#282C37] cursor-pointer text-xs text-zinc-200 transition-colors select-none"
                      >
                        <div
                          className={cn(
                            'w-4 h-4 rounded border flex items-center justify-center transition-all',
                            isChecked
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : 'bg-[#14161B] border-zinc-600 hover:border-zinc-500'
                          )}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className={cn(isChecked && 'text-white font-medium')}>{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* TAGS / GENRES CHECKBOXES */}
              {activeCategory === 'tags' && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 py-0.5 mb-1">
                    Genres &amp; Tags
                  </div>
                  {availableTags.length === 0 ? (
                    <div className="p-3 text-center text-xs text-zinc-500">
                      Keine Tags in deiner Sammlung hinterlegt.
                    </div>
                  ) : (
                    availableTags.slice(0, 30).map((tag) => {
                      const isChecked = filters.tags.includes(tag);
                      return (
                        <label
                          key={tag}
                          onClick={() => toggleItem('tags', tag)}
                          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-[#282C37] cursor-pointer text-xs text-zinc-200 transition-colors select-none"
                        >
                          <div
                            className={cn(
                              'w-4 h-4 rounded border flex items-center justify-center transition-all',
                              isChecked
                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                : 'bg-[#14161B] border-zinc-600 hover:border-zinc-500'
                            )}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className={cn(isChecked && 'text-white font-medium truncate')}>{tag}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
