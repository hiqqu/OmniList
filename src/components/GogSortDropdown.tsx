'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUpDown,
  ChevronRight,
  Check,
  ArrowUp,
  ArrowDown,
  Layers,
} from 'lucide-react';
import { GalaxySortKey, GalaxyGroupKey, MediaType } from '@/types/media';
import { cn } from '@/lib/utils';

interface GogSortDropdownProps {
  sortBy: GalaxySortKey;
  sortDirection: 'asc' | 'desc';
  groupBy: GalaxyGroupKey;
  onSortChange: (sort: GalaxySortKey) => void;
  onDirectionToggle: () => void;
  onGroupChange: (group: GalaxyGroupKey) => void;
  activeType?: MediaType | 'all';
  className?: string;
}

const ALL_SORT_OPTIONS: { id: GalaxySortKey; label: string; gamesOnly?: boolean }[] = [
  { id: 'last_played', label: 'Zuletzt gespielt', gamesOnly: true },
  { id: 'game_time', label: 'Spielzeit gesamt', gamesOnly: true },
  { id: 'date_added', label: 'Hinzugefügt am' },
  { id: 'achievements', label: 'Erfolge %', gamesOnly: true },
  { id: 'critics_rating', label: 'Metacritic-Score' },
  { id: 'rating', label: 'Eigene Bewertung' },
  { id: 'title', label: 'Titel' },
  { id: 'release_date', label: 'Erscheinungsdatum' },
  { id: 'genre', label: 'Genre' },
  { id: 'platform', label: 'Plattform', gamesOnly: true },
  { id: 'tags', label: 'Tags' },
];

const ALL_GROUP_OPTIONS: { id: GalaxyGroupKey; label: string; gamesOnly?: boolean }[] = [
  { id: 'none', label: 'Nicht gruppieren' },
  { id: 'platform', label: 'Plattform', gamesOnly: true },
  { id: 'status', label: 'Status' },
  { id: 'genre', label: 'Genre' },
  { id: 'release_year', label: 'Erscheinungsjahr' },
];

export const GogSortDropdown: React.FC<GogSortDropdownProps> = ({
  sortBy,
  sortDirection,
  groupBy,
  onSortChange,
  onDirectionToggle,
  onGroupChange,
  activeType = 'all',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<'sort' | 'group' | null>('sort');
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

  const isGameActive = activeType === 'game';
  const sortOptions = isGameActive
    ? ALL_SORT_OPTIONS
    : ALL_SORT_OPTIONS.filter((s) => !s.gamesOnly);
  const groupOptions = isGameActive
    ? ALL_GROUP_OPTIONS
    : ALL_GROUP_OPTIONS.filter((g) => !g.gamesOnly);

  const currentSortLabel = sortOptions.find((s) => s.id === sortBy)?.label || 'Titel';
  const currentGroupLabel = groupOptions.find((g) => g.id === groupBy)?.label || 'Nicht gruppieren';

  return (
    <div className={cn('relative inline-block text-left', className)} ref={containerRef}>
      {/* Trigger Button */}
      <div className="flex items-center bg-[#181B22] border border-[#282D37] hover:border-zinc-600 rounded-full text-xs text-zinc-300 transition-all shadow-sm">
        <button
          type="button"
          onClick={() => {
            setIsOpen((prev) => !prev);
            setActiveSubmenu('sort');
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 hover:text-white transition-colors"
          title="Sortier- und Gruppierungsmenü öffnen"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="text-zinc-500 hidden sm:inline">Sortierung:</span>
          <span className="font-semibold text-[#F1F3F7]">{currentSortLabel}</span>
          {groupBy !== 'none' && (
            <span className="hidden lg:inline text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {currentGroupLabel}
            </span>
          )}
        </button>

        <div className="w-[1px] h-4 bg-[#282D37]" />

        {/* Direction toggle */}
        <button
          type="button"
          onClick={onDirectionToggle}
          className="px-2 py-1.5 hover:text-white text-zinc-400 transition-colors"
          title={sortDirection === 'asc' ? 'Aufsteigend' : 'Absteigend'}
        >
          {sortDirection === 'asc' ? (
            <ArrowUp className="w-3.5 h-3.5 text-zinc-200" />
          ) : (
            <ArrowDown className="w-3.5 h-3.5 text-zinc-200" />
          )}
        </button>
      </div>

      {/* Galaxy Style Popover */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-50 flex items-start animate-fadeIn shadow-2xl">
          {/* Submenu pane (flies out to the left or appears side-by-side) */}
          {activeSubmenu === 'sort' && (
            <div className="w-48 bg-[#1E2024] border border-[#2E323D] rounded-xl shadow-2xl py-1.5 mr-1 overflow-hidden animate-fadeIn">
              <div className="px-3 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-[#2E323D]/60 mb-1 flex items-center justify-between">
                <span>Sort by</span>
                <button
                  type="button"
                  onClick={onDirectionToggle}
                  className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 normal-case font-normal"
                >
                  {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                  {sortDirection === 'asc' ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                </button>
              </div>
              <div className="max-h-[360px] overflow-y-auto scrollbar-thin">
                {sortOptions.map((opt) => {
                  const isSelected = sortBy === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onSortChange(opt.id);
                        setIsOpen(false);
                      }}
                      className={cn(
                        'w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-left transition-colors',
                        isSelected
                          ? 'bg-[#2A2E38] text-white font-semibold'
                          : 'text-zinc-300 hover:bg-[#252830] hover:text-white'
                      )}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-zinc-200 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeSubmenu === 'group' && (
            <div className="w-44 bg-[#1E2024] border border-[#2E323D] rounded-xl shadow-2xl py-1.5 mr-1 overflow-hidden animate-fadeIn">
              <div className="px-3 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-[#2E323D]/60 mb-1 flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-purple-400" />
                <span>Group by</span>
              </div>
              <div className="space-y-0.5">
                {groupOptions.map((opt) => {
                  const isSelected = groupBy === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onGroupChange(opt.id);
                        setIsOpen(false);
                      }}
                      className={cn(
                        'w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-left transition-colors',
                        isSelected
                          ? 'bg-[#2A2E38] text-white font-semibold'
                          : 'text-zinc-300 hover:bg-[#252830] hover:text-white'
                      )}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-zinc-200 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Main GOG Galaxy Menu Card */}
          <div className="w-48 bg-[#1E2024] border border-[#2E323D] rounded-xl shadow-2xl py-2 space-y-1">
            {/* Row 1: Sort by */}
            <div
              onMouseEnter={() => setActiveSubmenu('sort')}
              onClick={() => setActiveSubmenu(activeSubmenu === 'sort' ? null : 'sort')}
              className={cn(
                'flex items-center justify-between px-3 py-1.5 text-xs cursor-pointer transition-colors group',
                activeSubmenu === 'sort' ? 'bg-[#2A2E38] text-white' : 'text-zinc-300 hover:bg-[#252830] hover:text-white'
              )}
            >
              <span className="font-medium">Sort by</span>
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-[#121316] text-[11px] text-zinc-300 border border-[#2E323D] truncate max-w-[80px]">
                  {currentSortLabel}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white" />
              </div>
            </div>

            {/* Row 2: Group by */}
            <div
              onMouseEnter={() => setActiveSubmenu('group')}
              onClick={() => setActiveSubmenu(activeSubmenu === 'group' ? null : 'group')}
              className={cn(
                'flex items-center justify-between px-3 py-1.5 text-xs cursor-pointer transition-colors group',
                activeSubmenu === 'group' ? 'bg-[#2A2E38] text-white' : 'text-zinc-300 hover:bg-[#252830] hover:text-white'
              )}
            >
              <span className="font-medium">Group by</span>
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-[#121316] text-[11px] text-zinc-300 border border-[#2E323D] truncate max-w-[80px]">
                  {currentGroupLabel}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
