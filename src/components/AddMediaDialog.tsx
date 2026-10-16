'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Search,
  Film,
  Sparkles,
  BookOpen,
  Gamepad2,
  Loader2,
  Plus,
  Check,
  Star,
  Calendar,
  Layers,
} from 'lucide-react';
import { MediaType, SearchResultItem, MediaStatus, MediaItem } from '@/types/media';
import { getMediaTypeBadge, cn } from '@/lib/utils';

interface AddMediaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMedia: (item: Omit<MediaItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  existingExternalIds: Set<string>;
}

export const AddMediaDialog: React.FC<AddMediaDialogProps> = ({
  isOpen,
  onClose,
  onAddMedia,
  existingExternalIds,
}) => {
  const [activeTab, setActiveTab] = useState<MediaType>('movie');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [selectedStatus, setSelectedStatus] = useState<MediaStatus>('in_progress');

  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery('');
      setResults([]);
      setIsLoading(false);
    }
  }, [isOpen]);

  // Tab definitions
  const tabs: { id: MediaType; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'movie', label: 'Film & Serie', icon: <Film className="w-4 h-4" />, color: 'text-rose-400' },
    { id: 'anime', label: 'Anime', icon: <Sparkles className="w-4 h-4" />, color: 'text-blue-400' },
    { id: 'book', label: 'Buch', icon: <BookOpen className="w-4 h-4" />, color: 'text-orange-400' },
    { id: 'game', label: 'Videospiel', icon: <Gamepad2 className="w-4 h-4" />, color: 'text-purple-400' },
  ];

  // 300 ms Debounced search with AbortController
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(searchQuery)}&type=${activeTab}`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Search request error:', err);
        }
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, activeTab]);

  const handleSelectTab = (tab: MediaType) => {
    setActiveTab(tab);
    // If search query exists, it will automatically re-run via effect
  };

  const handleAdd = (result: SearchResultItem) => {
    const isCompleted = selectedStatus === 'completed';
    const totalUnits = result.totalUnits || 10;

    onAddMedia({
      title: result.title,
      originalTitle: result.originalTitle,
      type: result.type,
      status: selectedStatus,
      coverUrl: result.coverUrl,
      bannerUrl: result.bannerUrl,
      rating: result.rating || 4.5,
      releaseDate: result.releaseDate,
      summary: result.summary,
      genres: result.genres,
      creator: result.creator,
      progress: {
        current: isCompleted ? totalUnits : selectedStatus === 'in_progress' ? 1 : 0,
        total: totalUnits,
        unit: result.unit,
        currentSeason: result.totalSeasons ? 1 : undefined,
        totalSeasons: result.totalSeasons,
      },
      external_id: result.external_id,
      franchise_id: result.franchise_id,
      collection_name: result.collection_name,
      last_sequel_check: new Date().toISOString(),
    });

    setAddedIds((prev) => new Set(prev).add(result.external_id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      {/* Dialog Window */}
      <div className="relative w-full max-w-3xl bg-surface border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-slate-950/40">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Medium zur Sammlung hinzufügen
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live-Suche über TMDB, AniList, Google Books & RAWG mit automatischem Mock-Fallback
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Type Preselection Tabs */}
        <div className="px-5 pt-4 pb-2 border-b border-border/60 bg-surface/50">
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSelectTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all',
                    isActive
                      ? 'bg-primary text-white shadow-md shadow-primary/30 border border-primary/40'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                  )}
                >
                  <span className={isActive ? 'text-white' : tab.color}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Input Bar */}
          <div className="relative mt-4 mb-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Suche nach ${
                activeTab === 'movie'
                  ? 'Filmen oder Serien (z. B. Dune, Arcane, Severance)...'
                  : activeTab === 'anime'
                  ? 'Anime (z. B. Frieren, Solo Leveling, Jujutsu Kaisen)...'
                  : activeTab === 'book'
                  ? 'Büchern (z. B. Die drei Sonnen, Der Herr der Ringe, Atomic Habits)...'
                  : 'Videospielen (z. B. Elden Ring, Cyberpunk 2077, The Witcher)...'
              }`}
              className="w-full bg-slate-950/80 border border-slate-700 focus:border-primary rounded-xl pl-10 pr-28 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
            {isLoading && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-primary font-medium">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Suche...</span>
              </div>
            )}
          </div>

          {/* Add-with-status selector */}
          <div className="flex items-center justify-between text-xs text-slate-400 py-1.5">
            <span>Hinzufügen als Status:</span>
            <div className="flex items-center gap-1.5">
              {(['in_progress', 'planned', 'completed'] as MediaStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg font-medium transition-colors text-[11px]',
                    selectedStatus === st
                      ? 'bg-slate-700 text-white font-semibold'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  )}
                >
                  {st === 'in_progress' ? 'Gerade dabei' : st === 'planned' ? 'Geplant' : 'Beendet'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 min-h-[300px]">
          {isLoading && results.length === 0 ? (
            /* Skeleton Loading State */
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="flex gap-4 p-3 rounded-xl bg-slate-900/50 border border-slate-800 animate-pulse"
                >
                  <div className="w-16 h-24 bg-slate-800 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-slate-800 rounded w-1/3" />
                    <div className="h-3 bg-slate-800 rounded w-1/4" />
                    <div className="h-3 bg-slate-800 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            /* Results List */
            results.map((result) => {
              const isAlreadyInLibrary =
                existingExternalIds.has(result.external_id) || addedIds.has(result.external_id);
              const typeBadge = getMediaTypeBadge(result.type);

              return (
                <div
                  key={result.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Cover Thumbnail */}
                    <div className="w-14 h-20 rounded-lg overflow-hidden bg-slate-950 flex-shrink-0 border border-slate-800">
                      <img
                        src={result.coverUrl}
                        alt={result.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80';
                        }}
                      />
                    </div>

                    {/* Metadata */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide',
                            typeBadge.bgClass,
                            typeBadge.colorClass
                          )}
                        >
                          {typeBadge.label}
                        </span>
                        {result.releaseDate && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {result.releaseDate.split('-')[0]}
                          </span>
                        )}
                        {result.rating && (
                          <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-amber-400" />
                            {result.rating.toFixed(1)}
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-sm text-white line-clamp-1">{result.title}</h4>

                      <p className="text-xs text-slate-400 line-clamp-1">
                        {result.creator || result.originalTitle || '—'}
                      </p>

                      {result.genres && result.genres.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {result.genres.slice(0, 3).map((g) => (
                            <span key={g} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                              {g}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add Button */}
                  <div className="sm:self-center flex-shrink-0 w-full sm:w-auto">
                    {isAlreadyInLibrary ? (
                      <span className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 w-full sm:w-auto">
                        <Check className="w-4 h-4" />
                        <span>In Sammlung</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAdd(result)}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary-hover text-white shadow-md shadow-primary/20 active:scale-95 transition-all w-full sm:w-auto"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Hinzufügen</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : searchQuery.trim().length > 0 ? (
            /* No Results Found */
            <div className="py-12 text-center text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-semibold text-slate-300">Keine Treffer für &quot;{searchQuery}&quot; gefunden</p>
              <p className="text-xs text-slate-500 mt-1">
                Versuche einen anderen Suchbegriff oder wechsle den Medien-Tab.
              </p>
            </div>
          ) : (
            /* Initial Prompt / Popular Picks */
            <div className="py-12 text-center text-slate-400">
              <Layers className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-semibold text-slate-300">Gib einen Titel in die Suchleiste ein</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Tippe z. B. auf &quot;Dune&quot;, &quot;Arcane&quot;, &quot;Frieren&quot;, &quot;Elden Ring&quot; oder &quot;Die drei Sonnen&quot;, um live zu suchen.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
