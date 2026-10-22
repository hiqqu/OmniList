'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  SlidersHorizontal,
  ChevronRight,
  Check,
  RotateCcw,
} from 'lucide-react';
import { GalaxyFilterState, MediaType } from '@/types/media';
import { cn } from '@/lib/utils';

interface GogFilterDropdownProps {
  filters: GalaxyFilterState;
  onFilterChange: (filters: GalaxyFilterState) => void;
  onResetFilters: () => void;
  availableTags?: string[];
  activeType?: MediaType | 'all';
  className?: string;
}

export type FilterCategory =
  | 'platform'
  | 'consoles'
  | 'rating'
  | 'tags'
  | 'status'
  | 'ownership'
  | 'eras'
  | 'formats'
  | 'bookFormats'
  | 'pageLengths'
  | 'types';

// Options definitions
const PLATFORM_OPTIONS = [
  { id: 'steam', label: 'Steam' },
  { id: 'psn', label: 'PlayStation' },
  { id: 'gog', label: 'GOG.com' },
  { id: 'epic', label: 'Epic Games' },
  { id: 'other', label: 'Andere Plattformen' },
];

const CONSOLE_OPTIONS = [
  { id: 'PS5', label: 'PS5' },
  { id: 'PS4', label: 'PS4' },
  { id: 'PS3', label: 'PS3' },
  { id: 'PC', label: 'PC (Windows)' },
  { id: 'other', label: 'Andere Systeme' },
];

const RATING_OPTIONS = [
  { id: '90', label: '90+ Score (Meisterwerk)' },
  { id: '80', label: '80+ Score (Herausragend)' },
  { id: '70', label: '70+ Score (Gut)' },
  { id: 'stars5', label: '5 Sterne (Eigene Wertung)' },
  { id: 'stars4', label: '4+ Sterne' },
  { id: 'stars3', label: '3+ Sterne' },
];

const OWNERSHIP_OPTIONS = [
  { id: 'owned', label: 'Im Besitz (Gekauft / Physisch / Digital)' },
  { id: 'wishlist', label: 'Wunschliste / Noch nicht im Besitz' },
];

const ERA_OPTIONS = [
  { id: '2020s', label: '2020er (Aktuell)' },
  { id: '2010s', label: '2010er' },
  { id: '2000s', label: '2000er' },
  { id: '1990s', label: '90er' },
  { id: 'classic', label: 'Klassiker (Vor 1990)' },
];

const FORMAT_OPTIONS_SHOW = [
  { id: 'miniseries', label: 'Miniserie (1 Staffel)' },
  { id: 'compact', label: 'Kompakt (2 - 4 Staffeln)' },
  { id: 'longrunning', label: 'Langläufer (5+ Staffeln)' },
];

const FORMAT_OPTIONS_ANIME = [
  { id: 'anime_tv', label: 'TV-Serie' },
  { id: 'anime_movie', label: 'Film (Movie)' },
  { id: 'anime_ova', label: 'OVA / Special' },
];

const BOOK_FORMAT_OPTIONS = [
  { id: 'physical', label: 'Physisch (Hardcover / Taschenbuch)' },
  { id: 'ebook', label: 'E-Book (Kindle / ePub)' },
  { id: 'audiobook', label: 'Hörbuch (Audible / Audio)' },
];

const PAGE_LENGTH_OPTIONS = [
  { id: 'short', label: 'Kurz (< 200 Seiten)' },
  { id: 'medium', label: 'Standard (200 - 500 Seiten)' },
  { id: 'long', label: 'Epischer Wälzer (> 500 Seiten)' },
];

const TYPE_OPTIONS = [
  { id: 'game', label: 'Videospiele' },
  { id: 'movie', label: 'Filme' },
  { id: 'show', label: 'Serien' },
  { id: 'anime', label: 'Anime' },
  { id: 'book', label: 'Bücher' },
];

export const GogFilterDropdown: React.FC<GogFilterDropdownProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  availableTags = [],
  activeType = 'all',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
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

  // Status options tailored by category
  const getStatusOptions = () => {
    switch (activeType) {
      case 'game':
        return [
          { id: 'live_service', label: 'Live-Service / Endlos' },
          { id: 'in_progress', label: 'Gerade dabei' },
          { id: 'completed', label: 'Beendet' },
          { id: 'planned', label: 'Geplant' },
          { id: 'paused', label: 'Pausiert' },
          { id: 'dropped', label: 'Abgebrochen' },
        ];
      case 'movie':
        return [
          { id: 'completed', label: 'Gesehen (Beendet)' },
          { id: 'in_progress', label: 'Am Schauen' },
          { id: 'planned', label: 'Watchlist (Geplant)' },
          { id: 'paused', label: 'Pausiert' },
          { id: 'dropped', label: 'Abgebrochen' },
        ];
      case 'show':
        return [
          { id: 'in_progress', label: 'Aktuell am Schauen' },
          { id: 'planned', label: 'Watchlist (Geplant)' },
          { id: 'completed', label: 'Komplett geschaut' },
          { id: 'paused', label: 'Pausiert (Warte auf neue Staffel)' },
          { id: 'dropped', label: 'Abgebrochen' },
        ];
      case 'anime':
        return [
          { id: 'in_progress', label: 'Watching (Gerade dabei)' },
          { id: 'planned', label: 'Plan to Watch (Geplant)' },
          { id: 'completed', label: 'Completed (Beendet)' },
          { id: 'paused', label: 'On Hold (Pausiert)' },
          { id: 'dropped', label: 'Dropped (Abgebrochen)' },
        ];
      case 'book':
        return [
          { id: 'in_progress', label: 'Lese ich aktuell' },
          { id: 'planned', label: 'TBR / Leseliste (Geplant)' },
          { id: 'completed', label: 'Gelesen (Beendet)' },
          { id: 'paused', label: 'Pausiert' },
          { id: 'dropped', label: 'Abgebrochen (DNF)' },
        ];
      case 'all':
      default:
        return [
          { id: 'in_progress', label: 'Gerade dabei' },
          { id: 'completed', label: 'Beendet' },
          { id: 'planned', label: 'Geplant' },
          { id: 'paused', label: 'Pausiert' },
          { id: 'dropped', label: 'Abgebrochen' },
          { id: 'live_service', label: 'Live-Service' },
        ];
    }
  };

  // Categories tailored by active type
  const getCategories = (): { id: FilterCategory; label: string; count: number }[] => {
    switch (activeType) {
      case 'game':
        return [
          { id: 'platform', label: 'Plattformen', count: filters.platforms.length },
          { id: 'consoles', label: 'Konsolen & Systeme', count: filters.consoles.length },
          { id: 'status', label: 'Status', count: filters.statuses.length },
          { id: 'rating', label: 'Bewertung & Metacritic', count: filters.ratings.length },
          { id: 'tags', label: 'Genres & Tags', count: filters.tags.length },
          { id: 'ownership', label: 'Besitz', count: (filters.ownership || []).length },
        ];
      case 'movie':
        return [
          { id: 'tags', label: 'Genres', count: filters.tags.length },
          { id: 'eras', label: 'Erscheinungsjahrzehnt', count: (filters.eras || []).length },
          { id: 'rating', label: 'Bewertung & Metascore', count: filters.ratings.length },
          { id: 'status', label: 'Status', count: filters.statuses.length },
          { id: 'ownership', label: 'Besitz & Verfügbarkeit', count: (filters.ownership || []).length },
        ];
      case 'show':
        return [
          { id: 'formats', label: 'Staffel-Umfang', count: (filters.formats || []).length },
          { id: 'tags', label: 'Genres', count: filters.tags.length },
          { id: 'eras', label: 'Erscheinungsjahrzehnt', count: (filters.eras || []).length },
          { id: 'rating', label: 'Bewertung', count: filters.ratings.length },
          { id: 'status', label: 'Status', count: filters.statuses.length },
          { id: 'ownership', label: 'Besitz', count: (filters.ownership || []).length },
        ];
      case 'anime':
        return [
          { id: 'formats', label: 'Format', count: (filters.formats || []).length },
          { id: 'tags', label: 'Genres & Tropes', count: filters.tags.length },
          { id: 'eras', label: 'Erscheinungsjahrzehnt', count: (filters.eras || []).length },
          { id: 'rating', label: 'Bewertung', count: filters.ratings.length },
          { id: 'status', label: 'Status', count: filters.statuses.length },
          { id: 'ownership', label: 'Besitz', count: (filters.ownership || []).length },
        ];
      case 'book':
        return [
          { id: 'bookFormats', label: 'Format & Ausgabe', count: (filters.bookFormats || []).length },
          { id: 'pageLengths', label: 'Seitenumfang', count: (filters.pageLengths || []).length },
          { id: 'tags', label: 'Genres & Themen', count: filters.tags.length },
          { id: 'rating', label: 'Bewertung', count: filters.ratings.length },
          { id: 'status', label: 'Status', count: filters.statuses.length },
          { id: 'ownership', label: 'Besitz', count: (filters.ownership || []).length },
        ];
      case 'all':
      default:
        return [
          { id: 'types', label: 'Medientyp', count: (filters.types || []).length },
          { id: 'status', label: 'Status', count: filters.statuses.length },
          { id: 'rating', label: 'Bewertung', count: filters.ratings.length },
          { id: 'ownership', label: 'Besitz', count: (filters.ownership || []).length },
          { id: 'tags', label: 'Genres & Tags', count: filters.tags.length },
        ];
    }
  };

  const categories = getCategories();

  // Active Category State - ensure it's valid for the current active type
  const [activeCategory, setActiveCategory] = useState<FilterCategory>(categories[0].id);

  // Sync active category if current one is not in the active category list
  useEffect(() => {
    if (!categories.some((c) => c.id === activeCategory)) {
      setActiveCategory(categories[0].id);
    }
  }, [activeType, categories, activeCategory]);

  const toggleItem = (category: FilterCategory, id: string) => {
    const nextFilters = {
      ...filters,
      platforms: [...filters.platforms],
      consoles: [...filters.consoles],
      ratings: [...filters.ratings],
      tags: [...filters.tags],
      statuses: [...filters.statuses],
      ownership: [...(filters.ownership || [])],
      eras: [...(filters.eras || [])],
      formats: [...(filters.formats || [])],
      bookFormats: [...(filters.bookFormats || [])],
      pageLengths: [...(filters.pageLengths || [])],
      types: [...(filters.types || [])],
    };

    const toggleInArray = (arr: string[]) => {
      const set = new Set(arr);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return Array.from(set);
    };

    if (category === 'platform') nextFilters.platforms = toggleInArray(nextFilters.platforms);
    else if (category === 'consoles') nextFilters.consoles = toggleInArray(nextFilters.consoles);
    else if (category === 'rating') nextFilters.ratings = toggleInArray(nextFilters.ratings);
    else if (category === 'tags') nextFilters.tags = toggleInArray(nextFilters.tags);
    else if (category === 'status') nextFilters.statuses = toggleInArray(nextFilters.statuses);
    else if (category === 'ownership') nextFilters.ownership = toggleInArray(nextFilters.ownership);
    else if (category === 'eras') nextFilters.eras = toggleInArray(nextFilters.eras);
    else if (category === 'formats') nextFilters.formats = toggleInArray(nextFilters.formats);
    else if (category === 'bookFormats') nextFilters.bookFormats = toggleInArray(nextFilters.bookFormats);
    else if (category === 'pageLengths') nextFilters.pageLengths = toggleInArray(nextFilters.pageLengths);
    else if (category === 'types') nextFilters.types = toggleInArray(nextFilters.types);

    onFilterChange(nextFilters);
  };

  const totalActiveFilters = categories.reduce((sum, cat) => sum + cat.count, 0);

  // Render options list for right pane
  const renderOptions = () => {
    switch (activeCategory) {
      case 'platform':
        return (
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 py-0.5 mb-1">
              Plattformen ({filters.platforms.length} gewählt)
            </div>
            {PLATFORM_OPTIONS.map((opt) => renderCheckbox('platform', opt.id, opt.label, filters.platforms.includes(opt.id), 'bg-purple-600 border-purple-500'))}
          </div>
        );

      case 'consoles':
        return (
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 py-0.5 mb-1">
              Konsolen &amp; Systeme
            </div>
            {CONSOLE_OPTIONS.map((opt) => renderCheckbox('consoles', opt.id, opt.label, filters.consoles.includes(opt.id), 'bg-blue-600 border-blue-500'))}
          </div>
        );

      case 'rating':
        return (
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 py-0.5 mb-1">
              Bewertung &amp; Kritiken
            </div>
            {RATING_OPTIONS.map((opt) => renderCheckbox('rating', opt.id, opt.label, filters.ratings.includes(opt.id), 'bg-amber-600 border-amber-500'))}
          </div>
        );

      case 'status':
        return (
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 py-0.5 mb-1">
              Status ({filters.statuses.length} gewählt)
            </div>
            {getStatusOptions().map((opt) => renderCheckbox('status', opt.id, opt.label, filters.statuses.includes(opt.id), 'bg-emerald-600 border-emerald-500'))}
          </div>
        );

      case 'ownership':
        return (
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 py-0.5 mb-1">
              Besitz &amp; Verfügbarkeit
            </div>
            {OWNERSHIP_OPTIONS.map((opt) => renderCheckbox('ownership', opt.id, opt.label, (filters.ownership || []).includes(opt.id), 'bg-teal-600 border-teal-500'))}
          </div>
        );

      case 'eras':
        return (
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 py-0.5 mb-1">
              Erscheinungsjahrzehnt
            </div>
            {ERA_OPTIONS.map((opt) => renderCheckbox('eras', opt.id, opt.label, (filters.eras || []).includes(opt.id), 'bg-rose-600 border-rose-500'))}
          </div>
        );

      case 'formats':
        const formatOptions = activeType === 'anime' ? FORMAT_OPTIONS_ANIME : FORMAT_OPTIONS_SHOW;
        return (
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 py-0.5 mb-1">
              Format &amp; Umfang
            </div>
            {formatOptions.map((opt) => renderCheckbox('formats', opt.id, opt.label, (filters.formats || []).includes(opt.id), 'bg-indigo-600 border-indigo-500'))}
          </div>
        );

      case 'bookFormats':
        return (
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 py-0.5 mb-1">
              Ausgabe &amp; Format
            </div>
            {BOOK_FORMAT_OPTIONS.map((opt) => renderCheckbox('bookFormats', opt.id, opt.label, (filters.bookFormats || []).includes(opt.id), 'bg-orange-600 border-orange-500'))}
          </div>
        );

      case 'pageLengths':
        return (
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 py-0.5 mb-1">
              Seitenumfang
            </div>
            {PAGE_LENGTH_OPTIONS.map((opt) => renderCheckbox('pageLengths', opt.id, opt.label, (filters.pageLengths || []).includes(opt.id), 'bg-amber-600 border-amber-500'))}
          </div>
        );

      case 'types':
        return (
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 py-0.5 mb-1">
              Medientypen
            </div>
            {TYPE_OPTIONS.map((opt) => renderCheckbox('types', opt.id, opt.label, (filters.types || []).includes(opt.id), 'bg-purple-600 border-purple-500'))}
          </div>
        );

      case 'tags':
        return (
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 py-0.5 mb-1">
              Genres &amp; Tags
            </div>
            {availableTags.length === 0 ? (
              <div className="p-3 text-center text-xs text-zinc-500">
                Keine Genres für diese Kategorie hinterlegt.
              </div>
            ) : (
              availableTags.slice(0, 40).map((tag) =>
                renderCheckbox('tags', tag, tag, filters.tags.includes(tag), 'bg-indigo-600 border-indigo-500')
              )
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const renderCheckbox = (category: FilterCategory, id: string, label: string, isChecked: boolean, checkedColor: string) => (
    <label
      key={id}
      onClick={() => toggleItem(category, id)}
      className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-[#282C37] cursor-pointer text-xs text-zinc-200 transition-colors select-none"
    >
      <div
        className={cn(
          'w-4 h-4 rounded border flex items-center justify-center transition-all',
          isChecked ? `${checkedColor} text-white` : 'bg-[#14161B] border-zinc-600 hover:border-zinc-500'
        )}
      >
        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
      </div>
      <span className={cn(isChecked && 'text-white font-medium truncate')}>{label}</span>
    </label>
  );

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
        title="Kategorie-Filter öffnen"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
        <span>Filter</span>
        {totalActiveFilters > 0 && (
          <span className="px-1.5 py-0.2 rounded-full bg-purple-500 text-white text-[10px] font-bold">
            {totalActiveFilters}
          </span>
        )}
      </button>

      {/* Flyout Filter Popover */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-50 flex flex-col bg-[#1A1D23] border border-[#2B303C] rounded-2xl shadow-2xl overflow-hidden animate-fadeIn min-w-[340px] sm:min-w-[420px]">
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-[#2B303C]/70 flex items-center justify-between bg-[#15171C]">
            <span className="text-xs font-bold text-zinc-200 tracking-wide uppercase">
              {activeType === 'game'
                ? 'Spiele-Filter'
                : activeType === 'movie'
                ? 'Film-Filter'
                : activeType === 'show'
                ? 'Serien-Filter'
                : activeType === 'anime'
                ? 'Anime-Filter'
                : activeType === 'book'
                ? 'Buch-Filter'
                : 'Sammlungs-Filter'}
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

          {/* Two-Column Layout */}
          <div className="flex divide-x divide-[#2B303C]/70 min-h-[240px] max-h-[380px]">
            {/* Left Column: Categories */}
            <div className="w-[155px] sm:w-[175px] py-1.5 bg-[#171A20] shrink-0 overflow-y-auto">
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
                      {cat.count > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold font-mono">
                          {cat.count}
                        </span>
                      )}
                      <ChevronRight className="w-3 h-3 text-zinc-500" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column: Checkboxes for Active Category */}
            <div className="flex-1 p-2.5 overflow-y-auto scrollbar-thin bg-[#1D2027]">
              {renderOptions()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
