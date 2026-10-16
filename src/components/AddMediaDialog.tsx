'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Flame,
  PackageCheck,
  Building2,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { MediaType, SearchResultItem, MediaStatus, MediaItem } from '@/types/media';
import { getMediaTypeBadge, cn } from '@/lib/utils';
import { BookEditionItem } from '@/app/api/book-editions/route';
import { getMediaCoverFallback, createBookSvgCover } from '@/lib/book-cover';

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
  const [isOwned, setIsOwned] = useState<boolean>(false);

  // Book edition switcher state
  const [expandedEditionItemId, setExpandedEditionItemId] = useState<string | null>(null);
  const [editionsMap, setEditionsMap] = useState<Record<string, BookEditionItem[]>>({});
  const [loadingEditionsId, setLoadingEditionsId] = useState<string | null>(null);
  const [editionFilter, setEditionFilter] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Tab definitions with category-specific active colors
  const tabs: {
    id: MediaType;
    label: string;
    icon: React.ReactNode;
    color: string;
    activeClass: string;
  }[] = [
    {
      id: 'movie',
      label: 'Film & Serie',
      icon: <Film className="w-4 h-4" />,
      color: 'text-rose-400',
      activeClass: 'bg-rose-500 text-white shadow-rose-950/40',
    },
    {
      id: 'anime',
      label: 'Anime',
      icon: <Sparkles className="w-4 h-4" />,
      color: 'text-sky-400',
      activeClass: 'bg-sky-500 text-zinc-950 shadow-sky-950/40',
    },
    {
      id: 'book',
      label: 'Buch',
      icon: <BookOpen className="w-4 h-4" />,
      color: 'text-orange-400',
      activeClass: 'bg-orange-500 text-white shadow-orange-950/40',
    },
    {
      id: 'game',
      label: 'Videospiel',
      icon: <Gamepad2 className="w-4 h-4" />,
      color: 'text-purple-400',
      activeClass: 'bg-purple-500 text-white shadow-purple-950/40',
    },
  ];

  // Fetch search or trending items
  const executeSearch = useCallback(
    async (query: string, tab: MediaType) => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}&type=${tab}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }
      } catch (err) {
        console.error('Search request error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      executeSearch(searchQuery, activeTab);
    } else {
      setSearchQuery('');
      setResults([]);
      setIsLoading(false);
      setExpandedEditionItemId(null);
      setEditionFilter('');
    }
  }, [isOpen, activeTab, executeSearch]);

  const handleInputChange = (val: string) => {
    setSearchQuery(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      executeSearch(val, activeTab);
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      executeSearch(searchQuery, activeTab);
    }
  };

  const handleSelectTab = (tab: MediaType) => {
    setActiveTab(tab);
    executeSearch(searchQuery, tab);
  };

  const handleToggleEditions = async (result: SearchResultItem) => {
    if (expandedEditionItemId === result.id) {
      setExpandedEditionItemId(null);
      return;
    }

    setExpandedEditionItemId(result.id);
    setEditionFilter('');

    if (!editionsMap[result.id]) {
      setLoadingEditionsId(result.id);
      try {
        const queryParams = new URLSearchParams({
          title: result.title,
          author: result.creator || '',
          workKey: result.editionKey || '',
        });
        const res = await fetch(`/api/book-editions?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setEditionsMap((prev) => ({
            ...prev,
            [result.id]: data.editions || [],
          }));
        }
      } catch (err) {
        console.error('Failed to load book editions:', err);
      } finally {
        setLoadingEditionsId(null);
      }
    }
  };

  const handleAddEdition = (result: SearchResultItem, edition: BookEditionItem) => {
    const isCompleted = selectedStatus === 'completed';
    const totalUnits = edition.pages || result.totalUnits || 350;

    onAddMedia({
      title: edition.title || result.title,
      originalTitle: edition.subtitle || result.originalTitle,
      type: 'book',
      status: selectedStatus,
      coverUrl: edition.coverUrl || result.coverUrl,
      bannerUrl: result.bannerUrl,
      rating: undefined,
      communityRating: result.communityRating,
      communityRatingsCount: result.communityRatingsCount,
      releaseDate: edition.year ? `${edition.year}-01-01` : result.releaseDate,
      summary: result.summary,
      genres: result.genres,
      creator: result.creator,
      publisher: edition.publisher,
      isbn: edition.isbn,
      progress: {
        current: isCompleted ? totalUnits : selectedStatus === 'in_progress' ? 1 : 0,
        total: totalUnits,
        unit: 'pages',
      },
      external_id: edition.isbn ? `isbn:${edition.isbn}` : result.external_id,
      franchise_id: result.franchise_id,
      collection_name: edition.publisher ? `${edition.publisher} Ausgabe` : result.collection_name,
      isOwned: isOwned || selectedStatus === 'owned',
      last_sequel_check: new Date().toISOString(),
    });

    setAddedIds((prev) => {
      const next = new Set(prev);
      next.add(result.external_id);
      if (edition.isbn) next.add(`isbn:${edition.isbn}`);
      return next;
    });
  };

  const handleAdd = (result: SearchResultItem) => {
    const isCompleted = selectedStatus === 'completed';
    const isGame = result.type === 'game';
    const isMovie = result.type === 'movie';
    const totalUnits = isGame ? undefined : (result.totalUnits || (isMovie ? 120 : 10));

    onAddMedia({
      title: result.title,
      originalTitle: result.originalTitle,
      type: result.type,
      status: selectedStatus,
      coverUrl: result.coverUrl,
      bannerUrl: result.bannerUrl,
      rating: undefined,
      communityRating: result.communityRating,
      communityRatingsCount: result.communityRatingsCount,
      releaseDate: result.releaseDate,
      summary: result.summary,
      genres: result.genres,
      creator: result.creator,
      publisher: result.publisher,
      isbn: result.isbn,
      progress: {
        current: isCompleted ? (totalUnits || 0) : selectedStatus === 'in_progress' ? 1 : 0,
        total: totalUnits,
        unit: isMovie ? 'minutes' : result.unit,
        currentSeason: result.totalSeasons ? 1 : undefined,
        totalSeasons: result.totalSeasons,
      },
      gameTracker: isGame
        ? {
            storyCompleted: isCompleted,
            completionist100: false,
            playtimeHours: 0,
          }
        : undefined,
      external_id: result.external_id,
      franchise_id: result.franchise_id,
      collection_name: result.collection_name,
      isOwned: isOwned || selectedStatus === 'owned',
      last_sequel_check: new Date().toISOString(),
    });

    setAddedIds((prev) => new Set(prev).add(result.external_id));
  };

  const handleAddCustom = () => {
    if (!searchQuery.trim()) return;
    const title = searchQuery.trim().replace(/\b\w/g, (c) => c.toUpperCase());
    const isGame = activeTab === 'game';
    const isMovie = activeTab === 'movie';
    const unit = activeTab === 'book' ? 'pages' : isGame ? 'hours' : isMovie ? 'minutes' : 'episodes';
    const total = isGame ? undefined : (activeTab === 'book' ? 350 : isMovie ? 120 : 12);

    onAddMedia({
      title,
      type: activeTab,
      status: selectedStatus,
      coverUrl:
        activeTab === 'movie'
          ? 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80'
          : activeTab === 'anime'
          ? 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500&auto=format&fit=crop&q=80'
          : activeTab === 'book'
          ? 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=80',
      rating: undefined,
      releaseDate: new Date().toISOString().split('T')[0],
      summary: undefined,
      genres: [activeTab.toUpperCase()],
      progress: {
        current: selectedStatus === 'completed' ? (total || 0) : selectedStatus === 'in_progress' ? 1 : 0,
        total,
        unit,
      },
      gameTracker: isGame
        ? {
            storyCompleted: selectedStatus === 'completed',
            completionist100: false,
            playtimeHours: 0,
          }
        : undefined,
      isOwned: isOwned || selectedStatus === 'owned',
      external_id: `custom:${activeTab}:${Date.now()}`,
    });

    onClose();
  };

  if (!isOpen) return null;

  const isShowingRecommendations = !searchQuery.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      {/* Dialog Window */}
      <div className="relative w-full max-w-3xl bg-[#181B22] border border-[#282D37] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#282D37] flex items-center justify-between bg-[#0F1117]/60">
          <div>
            <h2 className="text-lg font-bold text-[#F1F3F7] flex items-center gap-2">
              <Plus className="w-5 h-5 text-zinc-300" />
              Medium zur Sammlung hinzufügen
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Live-Suche über TMDB, AniList, Google Books &amp; RAWG
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-[#F1F3F7] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Type Preselection Tabs */}
        <div className="px-5 pt-4 pb-2 border-b border-[#282D37] bg-[#181B22]">
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSelectTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all',
                    isActive
                      ? tab.activeClass
                      : 'bg-[#0F1117] text-zinc-400 hover:text-[#F1F3F7] hover:bg-zinc-800 border border-[#282D37]'
                  )}
                >
                  <span className={isActive ? 'text-inherit' : tab.color}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Input Bar */}
          <div className="relative mt-4 mb-2 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Suche nach ${
                  activeTab === 'movie'
                    ? 'Filmen oder Serien (z. B. Dune, Arcane, Breaking Bad)...'
                    : activeTab === 'anime'
                    ? 'Anime (z. B. Frieren, Solo Leveling, One Piece)...'
                    : activeTab === 'book'
                    ? 'Titel, Autor oder ISBN (z. B. 978-3-442-17858-2)...'
                    : 'Videospielen (z. B. Elden Ring, Zelda, Cyberpunk 2077)...'
                }`}
                className="w-full bg-[#0F1117] border border-[#282D37] focus:border-zinc-500 rounded-full pl-10 pr-20 py-2.5 text-sm text-[#F1F3F7] placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    executeSearch('', activeTab);
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#F1F3F7]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={() => executeSearch(searchQuery, activeTab)}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-[#F1F3F7] font-bold text-xs border border-zinc-700 transition-colors flex items-center gap-1.5"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-300" /> : <Search className="w-3.5 h-3.5" />}
              <span>Suchen</span>
            </button>
          </div>

          {/* Add-with-status selector */}
          <div className="flex items-center justify-between text-xs text-zinc-400 py-1.5">
            <span className="flex items-center gap-1.5">
              {isShowingRecommendations ? (
                <>
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[#F1F3F7] font-bold">Beliebte Empfehlungen</span>
                </>
              ) : (
                <span>Suchergebnisse für &quot;{searchQuery}&quot;</span>
              )}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-zinc-400 hidden sm:inline">Status:</span>
              {(['in_progress', 'planned', 'completed'] as MediaStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatus(st)}
                  className={cn(
                    'px-3 py-1 rounded-full font-bold transition-colors text-[11px]',
                    selectedStatus === st
                      ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                      : 'bg-[#0F1117] text-zinc-400 hover:text-[#F1F3F7] border border-[#282D37]'
                  )}
                >
                  {st === 'in_progress' ? 'Gerade dabei' : st === 'planned' ? 'Geplant' : 'Beendet'}
                </button>
              ))}

              <div className="h-4 w-[1px] bg-zinc-700 mx-1 hidden sm:block" />

              <button
                type="button"
                onClick={() => setIsOwned((prev) => !prev)}
                className={cn(
                  'px-3 py-1 rounded-full font-bold transition-all text-[11px] flex items-center gap-1.5 border',
                  isOwned
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                    : 'bg-[#0F1117] text-zinc-400 hover:text-zinc-200 border-[#282D37]'
                )}
                title="Im Besitz (kann mit jedem Status kombiniert werden)"
              >
                <PackageCheck className={cn('w-3.5 h-3.5', isOwned ? 'text-emerald-400' : 'text-zinc-500')} />
                <span>+ Im Besitz</span>
                {isOwned && <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />}
              </button>
            </div>
          </div>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 min-h-[320px]">
          {isLoading && results.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="flex gap-4 p-3 rounded-2xl bg-[#0F1117]/50 border border-[#282D37] animate-pulse"
                >
                  <div className="w-16 h-24 bg-[#181B22] rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-[#181B22] rounded w-1/3" />
                    <div className="h-3 bg-[#181B22] rounded w-1/4" />
                    <div className="h-3 bg-[#181B22] rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            results.map((result) => {
              const isAlreadyInLibrary =
                existingExternalIds.has(result.external_id) || addedIds.has(result.external_id);
              const typeBadge = getMediaTypeBadge(result.type);

              return (
                <div
                  key={result.id}
                  className="flex flex-col items-stretch p-3.5 rounded-2xl bg-[#0F1117]/60 hover:bg-[#0F1117] border border-[#282D37] hover:border-zinc-600 transition-all"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {/* Cover Thumbnail */}
                      <div className="w-14 h-20 rounded-lg overflow-hidden bg-[#0F1117] flex-shrink-0 border border-[#282D37]">
                        <img
                          src={result.coverUrl}
                          alt={result.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getMediaCoverFallback(result);
                          }}
                          onLoad={(e) => {
                            const img = e.currentTarget;
                            if (img.naturalWidth <= 1 || img.naturalHeight <= 1) {
                              img.src = getMediaCoverFallback(result);
                            }
                          }}
                        />
                      </div>

                      {/* Metadata */}
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide',
                              typeBadge.bgClass,
                              typeBadge.colorClass
                            )}
                          >
                            {typeBadge.label}
                          </span>
                          {result.external_id.startsWith('isbn:') && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
                              Exakte ISBN-Edition
                            </span>
                          )}
                          {result.publisher && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/10 text-orange-300 border border-orange-500/25 flex items-center gap-1">
                              <Building2 className="w-2.5 h-2.5 text-orange-400" />
                              {result.publisher}
                            </span>
                          )}
                          {result.type === 'book' && result.totalUnits && (
                            <span className="text-[11px] text-zinc-400 font-medium">
                              {result.totalUnits} Seiten
                            </span>
                          )}
                          {result.releaseDate && (
                            <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {result.releaseDate.split('-')[0]}
                            </span>
                          )}
                          {result.rating && (
                            <span className="text-[11px] text-amber-400 font-bold flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-amber-400" />
                              {result.rating.toFixed(1)}
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-sm text-[#F1F3F7] truncate">{result.title}</h4>

                        <p className="text-xs text-zinc-400 truncate">
                          {result.creator || result.originalTitle || '—'}
                        </p>

                        {result.genres && result.genres.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {result.genres.slice(0, 3).map((g) => (
                              <span key={g} className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                                {g}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Editions toggle button for books */}
                        {result.type === 'book' && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => handleToggleEditions(result)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/15 border border-orange-500/30 transition-all"
                            >
                              <Layers className="w-3 h-3" />
                              <span>
                                {expandedEditionItemId === result.id
                                  ? 'Ausgaben-Auswahl schließen'
                                  : `Andere Ausgabe / Verlag wählen ${result.editionCount ? `(${result.editionCount}+)` : ''}`}
                              </span>
                              {expandedEditionItemId === result.id ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Add Button */}
                    <div className="sm:self-center flex-shrink-0 w-full sm:w-auto">
                      {isAlreadyInLibrary ? (
                        <span className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 w-full sm:w-auto">
                          <Check className="w-4 h-4" />
                          <span>In Sammlung</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAdd(result)}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-zinc-100 hover:bg-white text-zinc-950 shadow-md shadow-black/20 active:scale-95 transition-all w-full sm:w-auto"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                          <span>Hinzufügen</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Collapsible Edition Selector Drawer */}
                  {expandedEditionItemId === result.id && (
                    <div className="w-full mt-3 pt-3 border-t border-[#282D37] space-y-3 bg-[#181B22]/90 p-3.5 rounded-xl border border-orange-500/20">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Verlagsausgaben für &quot;{result.title}&quot;</span>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            Treffer der Deutschen Nationalbibliothek (DNB) &amp; Open Library
                          </p>
                        </div>
                        <input
                          type="text"
                          placeholder="Verlag filtern (z. B. Carlsen, Heyne, dtv)..."
                          value={editionFilter}
                          onChange={(e) => setEditionFilter(e.target.value)}
                          className="bg-[#0F1117] border border-[#282D37] focus:border-orange-500 rounded-lg px-2.5 py-1 text-xs text-[#F1F3F7] placeholder-zinc-500 focus:outline-none w-full sm:w-60"
                        />
                      </div>

                      {loadingEditionsId === result.id ? (
                        <div className="py-6 flex flex-col items-center justify-center gap-2 text-zinc-400">
                          <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
                          <span className="text-xs">Ausgaben und Verlage werden geladen...</span>
                        </div>
                      ) : (
                        (() => {
                          const allEditions = editionsMap[result.id] || [];
                          const filteredEditions = allEditions.filter((ed) => {
                            if (!editionFilter.trim()) return true;
                            const q = editionFilter.toLowerCase();
                            return (
                              ed.publisher.toLowerCase().includes(q) ||
                              ed.title.toLowerCase().includes(q) ||
                              (ed.subtitle && ed.subtitle.toLowerCase().includes(q)) ||
                              (ed.isbn && ed.isbn.includes(q))
                            );
                          });

                          if (filteredEditions.length === 0) {
                            return (
                              <div className="py-4 text-center text-xs text-zinc-400">
                                {allEditions.length === 0
                                  ? 'Keine alternativen Verlagsausgaben gefunden. Du kannst diese Standard-Ausgabe hinzufügen oder die ISBN manuell anpassen.'
                                  : `Keine Ausgabe für "${editionFilter}" gefunden.`}
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                              {filteredEditions.map((ed) => {
                                const edIsAdded =
                                  (ed.isbn && existingExternalIds.has(`isbn:${ed.isbn}`)) ||
                                  (ed.isbn && addedIds.has(`isbn:${ed.isbn}`));

                                return (
                                  <div
                                    key={ed.id}
                                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[#0F1117]/80 hover:bg-[#0F1117] border border-[#282D37] transition-all"
                                  >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                      <div className="w-10 h-14 rounded overflow-hidden bg-zinc-900 border border-zinc-800 flex-shrink-0">
                                        <img
                                          src={ed.coverUrl}
                                          alt={ed.title}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src = createBookSvgCover(ed.title, undefined, ed.publisher);
                                          }}
                                          onLoad={(e) => {
                                            const img = e.currentTarget;
                                            if (img.naturalWidth <= 1 || img.naturalHeight <= 1) {
                                              img.src = createBookSvgCover(ed.title, undefined, ed.publisher);
                                            }
                                          }}
                                        />
                                      </div>
                                      <div className="min-w-0 flex-1 space-y-0.5">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="font-bold text-xs text-orange-300">
                                            {ed.publisher}
                                          </span>
                                          {ed.isGerman && (
                                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                              DE
                                            </span>
                                          )}
                                          {ed.year && (
                                            <span className="text-[10px] text-zinc-400">
                                              {ed.year}
                                            </span>
                                          )}
                                          <span className="text-[10px] text-zinc-400">
                                            {ed.pages} Seiten
                                          </span>
                                        </div>
                                        <p className="text-xs text-zinc-200 truncate">
                                          {ed.title}
                                          {ed.subtitle ? ` – ${ed.subtitle}` : ''}
                                        </p>
                                        {ed.formattedIsbn && (
                                          <p className="text-[10px] font-mono text-zinc-500">
                                            ISBN: {ed.formattedIsbn}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex-shrink-0">
                                      {edIsAdded ? (
                                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                          <Check className="w-3.5 h-3.5" />
                                          <span>In Sammlung</span>
                                        </span>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleAddEdition(result, ed)}
                                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-500 hover:bg-orange-400 text-zinc-950 active:scale-95 transition-all shadow-sm"
                                        >
                                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                          <span>Diese Ausgabe wählen</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-zinc-400 space-y-4">
              <Search className="w-8 h-8 mx-auto text-zinc-600" />
              <div>
                <p className="text-sm font-bold text-[#F1F3F7]">Keine externen Treffer für &quot;{searchQuery}&quot;</p>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                  Du kannst diesen Titel trotzdem sofort als individuelles Medium mit Titel und Typ zu deiner Sammlung hinzufügen.
                </p>
              </div>
              <button
                onClick={handleAddCustom}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold shadow-md shadow-black/20 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>&quot;{searchQuery}&quot; als {activeTab === 'movie' ? 'Film' : activeTab === 'anime' ? 'Anime' : activeTab === 'book' ? 'Buch' : 'Spiel'} hinzufügen</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
