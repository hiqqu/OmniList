'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Sidebar,
} from '@/components/Sidebar';
import { Header, SortOption } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { MediaCard } from '@/components/MediaCard';
import { SequelCard } from '@/components/SequelCard';
import { AddMediaDialog } from '@/components/AddMediaDialog';
import { EditMediaModal } from '@/components/EditMediaModal';
import { SyncModal } from '@/components/SyncModal';
import { GameImportModal } from '@/components/GameImportModal';
import { StatsBar } from '@/components/StatsBar';
import { ImportResult, getItemPlatform } from '@/lib/game-import';
import { ToastContainer, ToastMessage } from '@/components/Toast';
import { MediaItem, MediaType, MediaStatus, SequelNotification } from '@/types/media';
import {
  getStoredMedia,
  saveStoredMedia,
  getStoredSequels,
  saveStoredSequels,
  addMediaItem,
  updateMediaItem,
  deleteMediaItem,
  dismissSequel,
  acceptSequel,
  resetLibraryToDefault,
} from '@/lib/storage';
import { getUnitIncrement, getMediaStatusBadge, cn } from '@/lib/utils';
import { Radar, Plus, Sparkles, RefreshCw, Layers, Library, Film, BookOpen, Gamepad2, X, PackageCheck, Search } from 'lucide-react';

export default function Home() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [sequels, setSequels] = useState<SequelNotification[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Navigation & View Filters
  const [currentView, setCurrentView] = useState<'dashboard' | 'sequel_radar'>('dashboard');
  const [selectedType, setSelectedType] = useState<MediaType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<MediaStatus | 'all'>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'steam' | 'psn' | 'gog'>('all');
  const [onlyOwned, setOnlyOwned] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('updated');
  const [sequelFilterType, setSequelFilterType] = useState<MediaType | 'all'>('all');

  // Modals & States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalInitialTab, setAddModalInitialTab] = useState<MediaType | undefined>(undefined);
  const [addModalInitialQuery, setAddModalInitialQuery] = useState<string>('');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isGameImportModalOpen, setIsGameImportModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [isCheckingSequels, setIsCheckingSequels] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const isFilterActive = selectedType !== 'all' || selectedStatus !== 'all' || onlyOwned || selectedPlatform !== 'all';

  const handleOpenAddModal = (tab?: MediaType, query?: string) => {
    let targetTab: MediaType | undefined = tab;
    if (!targetTab) {
      if (selectedType === 'game') targetTab = 'game';
      else if (selectedType === 'anime') targetTab = 'anime';
      else if (selectedType === 'book') targetTab = 'book';
      else if (selectedType === 'movie' || selectedType === 'show') targetTab = 'movie';
      else if (query) {
        const qLower = query.toLowerCase();
        if (
          qLower.includes('arkham') ||
          qLower.includes('game') ||
          qLower.includes('zelda') ||
          qLower.includes('mario') ||
          qLower.includes('witcher') ||
          qLower.includes('playstation') ||
          qLower.includes('xbox') ||
          qLower.includes('steam') ||
          qLower.includes('elden ring') ||
          qLower.includes('pokemon') ||
          qLower.includes('gta')
        ) {
          targetTab = 'game';
        }
      }
    }
    setAddModalInitialTab(targetTab);
    setAddModalInitialQuery(query || '');
    setIsAddModalOpen(true);
  };

  // Toast Helper
  const addToast = useCallback((type: 'success' | 'info' | 'warning' | 'error', title: string, description?: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Initialize data on mount
  useEffect(() => {
    const loadedMedia = getStoredMedia();
    const loadedSequels = getStoredSequels();
    setMedia(loadedMedia);
    setSequels(loadedSequels);
    setIsLoaded(true);
  }, []);

  // Quick-Increment Handler (Optimistic UI Update)
  const handleQuickIncrement = (id: string) => {
    const item = media.find((m) => m.id === id);
    if (!item) return;

    if (item.type === 'game') {
      const currentHours = item.gameTracker?.playtimeHours ?? item.progress.current;
      const nextHours = currentHours + 1;
      const updated = updateMediaItem(id, {
        progress: {
          ...item.progress,
          current: nextHours,
          total: undefined,
        },
        gameTracker: {
          ...(item.gameTracker || {}),
          playtimeHours: nextHours,
        },
        status: item.status === 'planned' ? 'in_progress' : item.status,
      });

      if (updated) {
        setMedia((prev) => prev.map((m) => (m.id === id ? updated : m)));
        addToast(
          'success',
          `${item.title}: +1 Std. Spielzeit`,
          `${nextHours} Std. insgesamt geloggt`
        );
      }
      return;
    }

    const total = item.progress.total;
    if (total && total > 0 && item.progress.current >= total) {
      addToast('info', item.title, 'Bereits alle Einheiten abgeschlossen!');
      return;
    }

    const { amount, label } = getUnitIncrement(item.type, item.progress.unit);
    const nextCurrent = item.progress.current + amount;
    const newCurrent = total && total > 0 ? Math.min(total, nextCurrent) : nextCurrent;
    const isNowCompleted = total ? newCurrent >= total : false;

    const updated = updateMediaItem(id, {
      progress: {
        ...item.progress,
        current: newCurrent,
      },
      status: isNowCompleted ? 'completed' : item.status,
    });

    if (updated) {
      setMedia((prev) => prev.map((m) => (m.id === id ? updated : m)));
      addToast(
        'success',
        `${item.title}: ${label}`,
        isNowCompleted ? 'Status automatisch auf "Beendet" gesetzt!' : undefined
      );
    }
  };

  // Toggle Game Story Handler
  const handleToggleGameStory = (id: string) => {
    const item = media.find((m) => m.id === id);
    if (!item) return;
    const newStory = !item.gameTracker?.storyCompleted;
    const updated = updateMediaItem(id, {
      gameTracker: {
        ...(item.gameTracker || {}),
        storyCompleted: newStory,
      },
      status: newStory && item.status !== 'owned' ? 'completed' : item.status,
    });
    if (updated) {
      setMedia((prev) => prev.map((m) => (m.id === id ? updated : m)));
      addToast(
        'info',
        item.title,
        newStory ? 'Hauptstory als beendet markiert' : 'Story-Status auf offen gesetzt'
      );
    }
  };

  // Toggle Game 100% Handler
  const handleToggleGame100 = (id: string) => {
    const item = media.find((m) => m.id === id);
    if (!item) return;
    const new100 = !item.gameTracker?.completionist100;
    const updated = updateMediaItem(id, {
      gameTracker: {
        ...(item.gameTracker || {}),
        completionist100: new100,
        storyCompleted: new100 ? true : item.gameTracker?.storyCompleted,
      },
      status: new100 && item.status !== 'owned' ? 'completed' : item.status,
    });
    if (updated) {
      setMedia((prev) => prev.map((m) => (m.id === id ? updated : m)));
      addToast(
        'info',
        item.title,
        new100 ? '100% Completionist Meisterung erreicht!' : '100% Status zurückgesetzt'
      );
    }
  };

  // Toggle Game Achievements Handler (Checkbox)
  const handleToggleGameAchievements = (id: string) => {
    const item = media.find((m) => m.id === id);
    if (!item) return;
    const isCurrentlyDone = Boolean(
      item.gameTracker?.allAchievementsCompleted ||
      (item.gameTracker?.achievements &&
        item.gameTracker.achievements.total > 0 &&
        item.gameTracker.achievements.current >= item.gameTracker.achievements.total)
    );
    const newDone = !isCurrentlyDone;
    const updated = updateMediaItem(id, {
      gameTracker: {
        ...(item.gameTracker || {}),
        allAchievementsCompleted: newDone,
        achievements: undefined,
        completionist100: newDone ? true : item.gameTracker?.completionist100,
        storyCompleted: newDone ? true : item.gameTracker?.storyCompleted,
      },
      status: newDone && item.status !== 'owned' ? 'completed' : item.status,
    });
    if (updated) {
      setMedia((prev) => prev.map((m) => (m.id === id ? updated : m)));
      addToast(
        'info',
        item.title,
        newDone
          ? 'Alle Erfolge (100% Achievements) als freigeschaltet markiert'
          : 'Erfolgs-Status zurückgesetzt'
      );
    }
  };

  // Status Change Handler
  const handleUpdateStatus = (id: string, newStatus: MediaStatus) => {
    const item = media.find((m) => m.id === id);
    if (!item) return;

    const isCompleted = newStatus === 'completed';
    const total = item.progress?.total;

    const updated = updateMediaItem(id, {
      status: newStatus,
      progress:
        isCompleted && total && total > 0
          ? { ...item.progress, current: total }
          : item.progress,
    });

    if (updated) {
      setMedia((prev) => prev.map((m) => (m.id === id ? updated : m)));
      addToast(
        'info',
        `Status aktualisiert: ${updated.title}`,
        newStatus === 'dropped'
          ? 'Medium als abgebrochen markiert.'
          : isCompleted && total
          ? `Alle ${total} Einheiten als abgeschlossen markiert.`
          : undefined
      );
    }
  };

  // Toggle Owned Status
  const handleToggleOwned = (id: string) => {
    const item = media.find((m) => m.id === id);
    if (!item) return;
    const newOwned = !item.isOwned;
    const updated = updateMediaItem(id, { isOwned: newOwned });
    if (updated) {
      setMedia((prev) => prev.map((m) => (m.id === id ? updated : m)));
      addToast(
        'info',
        newOwned ? 'Im Besitz' : 'Besitzstatus entfernt',
        `${item.title} ${newOwned ? 'als gekauft markiert' : 'nicht mehr als gekauft markiert'}`
      );
    }
  };

  // Edit Save Handler
  const handleSaveEdit = (id: string, updates: Partial<MediaItem>) => {
    const updated = updateMediaItem(id, updates);
    if (updated) {
      setMedia((prev) => prev.map((m) => (m.id === id ? updated : m)));
      addToast('success', `Änderungen gespeichert: ${updated.title}`);
    }
  };

  // Delete Handler
  const handleDeleteMedia = (id: string) => {
    const target = media.find((m) => m.id === id);
    deleteMediaItem(id);
    setMedia((prev) => prev.filter((m) => m.id !== id));
    setSequels((prev) =>
      prev.filter(
        (s) =>
          s.parentMediaId !== id &&
          (!target || s.parentMediaTitle.trim().toLowerCase() !== target.title.trim().toLowerCase())
      )
    );
    if (target) {
      addToast('info', `Aus Sammlung entfernt`, target.title);
    }
  };

  // Add Medium from Search Modal
  const handleAddMedia = (newItemData: Omit<MediaItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const created = addMediaItem(newItemData);
    setMedia((prev) => [created, ...prev]);

    const isGame = created.type === 'game';
    const is100 = created.gameTracker?.completionist100;
    const isAchievements = Boolean(
      created.gameTracker?.allAchievementsCompleted ||
      (created.gameTracker?.achievements &&
        created.gameTracker.achievements.total > 0 &&
        created.gameTracker.achievements.current >= created.gameTracker.achievements.total)
    );

    let statusLabel = 'deiner Mediensammlung';
    if (isGame && isAchievements) {
      statusLabel = '„Alle Achievements (100%)“';
    } else if (isGame && is100) {
      statusLabel = '„100% Meisterung“';
    } else if (created.status === 'in_progress') {
      statusLabel = '„Gerade dabei“';
    } else if (created.status === 'planned') {
      statusLabel = '„Geplant“';
    } else if (created.status === 'completed') {
      statusLabel = '„Beendet“';
    } else if (created.status === 'dropped') {
      statusLabel = '„Abgebrochen“';
    }

    addToast('success', `Hinzugefügt!`, `"${created.title}" wurde zu ${statusLabel} hinzugefügt.`);
  };

  // Sequel Radar Actions
  const handleAcceptSequel = (sequel: SequelNotification, targetStatus: MediaStatus = 'planned') => {
    const created = acceptSequel(sequel, targetStatus);
    setMedia((prev) => [created, ...prev]);
    setSequels((prev) => prev.filter((s) => s.id !== sequel.id));
    addToast(
      'success',
      `Fortsetzung übernommen!`,
      `"${created.title}" wurde zu "${targetStatus === 'in_progress' ? 'Gerade dabei' : 'Geplant'}" hinzugefügt.`
    );
  };

  const handleDismissSequel = (id: string) => {
    dismissSequel(id);
    setSequels((prev) => prev.filter((s) => s.id !== id));
    addToast('info', 'Fortsetzungsmeldung ignoriert');
  };

  // Manual Check Sequels Sync via Route Handler
  const handleCheckSequels = async () => {
    setIsCheckingSequels(true);
    addToast('info', 'Sequel Radar aktiv', 'Prüfe Kataloge auf neue Staffeln & Fortsetzungen...');

    try {
      const res = await fetch('/api/check-sequels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: media }),
      });

      if (res.ok) {
        const data = await res.json();
        const detectedSequels: SequelNotification[] = data.sequels || [];

        // Merge with existing sequels without duplicate external_id
        const existingExternalIds = new Set(sequels.map((s) => s.external_id));
        const newDetections = detectedSequels.filter((s) => !existingExternalIds.has(s.external_id));

        if (newDetections.length > 0) {
          const merged = [...newDetections, ...sequels];
          setSequels(merged);
          saveStoredSequels(merged);
          addToast(
            'success',
            `${newDetections.length} neue Fortsetzung(en) gefunden!`,
            'Der Radar hat neue Releases für deine Bibliothek erkannt.'
          );
        } else {
          addToast('info', 'Bibliothek aktuell', 'Keine neuen Fortsetzungen gefunden.');
        }
      }
    } catch (e) {
      console.error('Error during sequel check:', e);
      addToast('warning', 'Fehler beim Abgleich', 'Fortsetzungsprüfung konnte nicht abgeschlossen werden.');
    } finally {
      setIsCheckingSequels(false);
    }
  };

  // Reset library
  const handleResetLibrary = () => {
    if (window.confirm('Möchtest du wirklich alle Einträge aus deiner Mediensammlung löschen?')) {
      const reset = resetLibraryToDefault();
      setMedia(reset.media);
      setSequels(reset.sequels);
      addToast('info', 'Sammlung geleert', 'Deine Mediensammlung wurde vollständig zurückgesetzt.');
    }
  };

  // Instant local full-text search (< 10 ms) and filtering
  const filteredAndSortedMedia = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    const filtered = media.filter((item) => {
      // Type filter
      if (selectedType !== 'all' && item.type !== selectedType) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'owned') {
          if (!item.isOwned && item.status !== 'owned') {
            return false;
          }
        } else if (item.status !== selectedStatus) {
          return false;
        }
      }

      // Combinable ownership filter (e.g. Planned + Owned)
      if (onlyOwned && !item.isOwned && item.status !== 'owned') {
        return false;
      }

      // Platform filter (Steam, PSN, GOG)
      if (selectedPlatform !== 'all') {
        const platform = getItemPlatform(item);
        if (platform !== selectedPlatform) {
          return false;
        }
      }

      // Instant search filter
      if (q) {
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchOriginal = item.originalTitle?.toLowerCase().includes(q);
        const matchCreator = item.creator?.toLowerCase().includes(q);
        const matchGenres = item.genres?.some((g) => g.toLowerCase().includes(q));
        const matchCollection = item.collection_name?.toLowerCase().includes(q);

        if (!matchTitle && !matchOriginal && !matchCreator && !matchGenres && !matchCollection) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    return filtered.sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortBy === 'progress') {
        const pctA = a.progress.total ? a.progress.current / a.progress.total : 0;
        const pctB = b.progress.total ? b.progress.current / b.progress.total : 0;
        return pctB - pctA;
      }
      // default: updated
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [media, selectedType, selectedStatus, selectedPlatform, onlyOwned, searchQuery, sortBy]);

  // Platform counts for games
  const platformCounts = useMemo(() => {
    const games = media.filter((m) => m.type === 'game');
    return {
      all: games.length,
      steam: games.filter((m) => getItemPlatform(m) === 'steam').length,
      psn: games.filter((m) => getItemPlatform(m) === 'psn').length,
      gog: games.filter((m) => getItemPlatform(m) === 'gog').length,
    };
  }, [media]);

  // Sequel Radar subcategories counts and filtered list
  const sequelCounts = useMemo(() => {
    return {
      all: sequels.length,
      game: sequels.filter((s) => s.sequelType === 'game' || s.parentMediaType === 'game').length,
      movie: sequels.filter((s) => s.sequelType === 'movie' || s.parentMediaType === 'movie').length,
      show: sequels.filter((s) => s.sequelType === 'show' || s.parentMediaType === 'show').length,
      anime: sequels.filter((s) => s.sequelType === 'anime' || s.parentMediaType === 'anime').length,
      book: sequels.filter((s) => s.sequelType === 'book' || s.parentMediaType === 'book').length,
    };
  }, [sequels]);

  const filteredSequels = useMemo(() => {
    if (sequelFilterType === 'all') return sequels;
    return sequels.filter((s) => s.sequelType === sequelFilterType || s.parentMediaType === sequelFilterType);
  }, [sequels, sequelFilterType]);

  // Apply Synced Data from Cloud or File
  const handleApplySync = (syncedMedia: MediaItem[], syncedSequels?: SequelNotification[]) => {
    saveStoredMedia(syncedMedia);
    setMedia(syncedMedia);
    if (syncedSequels && syncedSequels.length > 0) {
      saveStoredSequels(syncedSequels);
      setSequels(syncedSequels);
    }
  };

  // Apply Steam / PSN / GOG Imported Games with Deduplication & Replacement
  const handleApplyGameImport = (updatedMedia: MediaItem[]) => {
    saveStoredMedia(updatedMedia);
    setMedia(updatedMedia);
  };

  const existingExternalIds = useMemo(() => new Set(media.map((m) => m.external_id)), [media]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Radar className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm font-medium">OmniList wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background text-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        selectedType={selectedType}
        onSelectType={(type) => {
          setSelectedType(type);
          if (type !== 'all' && type !== 'game') {
            setSelectedPlatform('all');
          }
        }}
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
        selectedPlatform={selectedPlatform}
        onSelectPlatform={(platform) => {
          setSelectedPlatform(platform);
          if (platform !== 'all' && selectedType !== 'game') {
            setSelectedType('game');
          }
        }}
        platformCounts={platformCounts}
        onlyOwned={onlyOwned}
        onToggleOnlyOwned={() => setOnlyOwned((prev) => !prev)}
        sequelCount={sequels.length}
        totalMediaCount={media.length}
        isCheckingSequels={isCheckingSequels}
        onCheckSequels={handleCheckSequels}
        onResetLibrary={handleResetLibrary}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenGameImportModal={() => setIsGameImportModalOpen(true)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Top Header */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onOpenAddModal={() => handleOpenAddModal()}
          onOpenAddModalWithQuery={(q) => handleOpenAddModal(undefined, q)}
          onOpenSyncModal={() => setIsSyncModalOpen(true)}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          totalFilteredCount={filteredAndSortedMedia.length}
        />

        {/* View Content */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 max-w-[1920px] w-full mx-auto pb-24 lg:pb-8">
          {currentView === 'dashboard' ? (
            /* ================= DASHBOARD VIEW ================= */
            <>
              {/* Stats Bar */}
              <StatsBar
                media={media}
                sequels={sequels}
                selectedType={selectedType}
                selectedStatus={selectedStatus}
                onSelectStatus={setSelectedStatus}
                onOpenSequelRadar={() => setCurrentView('sequel_radar')}
              />

              {/* Grid Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center">
                    {selectedType === 'all' && <Library className="w-4 h-4 text-zinc-300" />}
                    {selectedType === 'movie' && <Film className="w-4 h-4 text-rose-400" />}
                    {selectedType === 'show' && <Film className="w-4 h-4 text-amber-400" />}
                    {selectedType === 'anime' && <Sparkles className="w-4 h-4 text-sky-400" />}
                    {selectedType === 'book' && <BookOpen className="w-4 h-4 text-orange-400" />}
                    {selectedType === 'game' && <Gamepad2 className="w-4 h-4 text-purple-400" />}
                  </div>
                  <h2 className="text-lg font-bold text-[#F1F3F7] tracking-tight">
                    {selectedType === 'all'
                      ? 'Alle Medien'
                      : selectedType === 'movie'
                      ? 'Filme'
                      : selectedType === 'show'
                      ? 'Serien'
                      : selectedType === 'anime'
                      ? 'Anime'
                      : selectedType === 'book'
                      ? 'Bücher'
                      : 'Videospiele'}
                  </h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-bold border border-zinc-700">
                    {filteredAndSortedMedia.length}
                  </span>
                </div>

                {/* Aktive Filter-Pills & Shortcuts */}
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedType === 'game' && (
                    <button
                      type="button"
                      onClick={() => setIsGameImportModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 transition-all active:scale-95 shadow-sm"
                      title="Spiele aus Steam, PlayStation Network oder GOG importieren"
                    >
                      <Gamepad2 className="w-3.5 h-3.5 text-purple-400" />
                      <span>Steam / PSN / GOG Import</span>
                    </button>
                  )}

                  {selectedStatus !== 'all' && (
                    <button
                      onClick={() => setSelectedStatus('all')}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
                      title="Status-Filter zurücksetzen"
                    >
                      <span>Status: {getMediaStatusBadge(selectedStatus).label}</span>
                      <X className="w-3.5 h-3.5 text-zinc-400" />
                    </button>
                  )}
                  {selectedPlatform !== 'all' && (
                    <button
                      onClick={() => setSelectedPlatform('all')}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors shadow-sm',
                        selectedPlatform === 'steam'
                          ? 'bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border-sky-500/40'
                          : selectedPlatform === 'psn'
                          ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/40'
                          : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border-purple-500/40'
                      )}
                      title="Plattform-Filter zurücksetzen"
                    >
                      <Gamepad2 className="w-3.5 h-3.5" />
                      <span>
                        Plattform: {selectedPlatform === 'steam' ? 'Steam' : selectedPlatform === 'psn' ? 'PlayStation' : 'GOG Galaxy'}
                      </span>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onlyOwned && (
                    <button
                      onClick={() => setOnlyOwned(false)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-colors shadow-sm"
                      title="Besitz-Filter deaktivieren"
                    >
                      <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Nur im Besitz</span>
                      <X className="w-3.5 h-3.5 text-emerald-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* Game Platform Filter Pills (when in Videospiele view) */}
              {selectedType === 'game' && (
                <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-thin">
                  {[
                    { id: 'all' as const, label: 'Alle Plattformen', count: platformCounts.all, activeStyle: 'bg-zinc-800 border-zinc-500 text-white shadow-sm' },
                    { id: 'steam' as const, label: 'Steam', count: platformCounts.steam, iconColor: 'text-sky-400', activeStyle: 'bg-sky-500/20 border-sky-500/50 text-sky-200 shadow-sm shadow-sky-950/20' },
                    { id: 'psn' as const, label: 'PlayStation', count: platformCounts.psn, iconColor: 'text-blue-400', activeStyle: 'bg-blue-500/20 border-blue-500/50 text-blue-200 shadow-sm shadow-blue-950/20' },
                    { id: 'gog' as const, label: 'GOG Galaxy', count: platformCounts.gog, iconColor: 'text-purple-400', activeStyle: 'bg-purple-500/20 border-purple-500/50 text-purple-200 shadow-sm shadow-purple-950/20' },
                  ].map((tab) => {
                    const isActive = selectedPlatform === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setSelectedPlatform(tab.id)}
                        className={cn(
                          'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border',
                          isActive
                            ? tab.activeStyle
                            : 'bg-[#181B22]/70 hover:bg-[#181B22] border-[#282D37] text-zinc-400 hover:text-zinc-200'
                        )}
                      >
                        <Gamepad2 className={cn('w-3.5 h-3.5', isActive ? 'text-white' : tab.iconColor || 'text-zinc-400')} />
                        <span>{tab.label}</span>
                        <span
                          className={cn(
                            'px-1.5 py-0.5 rounded-full text-[10px] font-mono leading-none',
                            isActive
                              ? 'bg-white/20 text-white'
                              : tab.count > 0
                              ? 'bg-zinc-800 text-zinc-300'
                              : 'bg-zinc-800/50 text-zinc-500'
                          )}
                        >
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Media Card Grid (2:3 aspect ratio) */}
              {filteredAndSortedMedia.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 min-[2200px]:grid-cols-8 gap-2.5 sm:gap-3.5 md:gap-4 lg:gap-5">
                  {filteredAndSortedMedia.map((item) => (
                    <MediaCard
                      key={item.id}
                      item={item}
                      onQuickIncrement={handleQuickIncrement}
                      onUpdateStatus={handleUpdateStatus}
                      onToggleOwned={handleToggleOwned}
                      onToggleGameStory={handleToggleGameStory}
                      onToggleGame100={handleToggleGame100}
                      onToggleGameAchievements={handleToggleGameAchievements}
                      onEdit={setEditingItem}
                      onDelete={handleDeleteMedia}
                    />
                  ))}
                </div>
              ) : (
                /* Empty state */
                <div className="py-20 flex flex-col items-center justify-center text-center p-6 rounded-3xl bg-[#181B22]/40 border border-dashed border-[#282D37]">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-[#282D37] flex items-center justify-center text-zinc-400 mb-4">
                    {searchQuery ? (
                      <Search className="w-8 h-8 text-purple-400" />
                    ) : selectedPlatform !== 'all' ? (
                      <Gamepad2 className="w-8 h-8 text-purple-400" />
                    ) : (
                      <Layers className="w-8 h-8" />
                    )}
                  </div>
                  <h3 className="text-base font-bold text-[#F1F3F7]">
                    {selectedPlatform !== 'all'
                      ? `Keine Spiele für ${selectedPlatform === 'steam' ? 'Steam' : selectedPlatform === 'psn' ? 'PlayStation' : 'GOG Galaxy'} gefunden`
                      : searchQuery
                      ? `"${searchQuery}" nicht in deiner lokalen Sammlung`
                      : 'Keine Medien gefunden'}
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-5 leading-relaxed">
                    {selectedPlatform !== 'all'
                      ? `In deiner Sammlung ist aktuell kein Spiel mit ${selectedPlatform === 'steam' ? 'Steam' : selectedPlatform === 'psn' ? 'PlayStation' : 'GOG Galaxy'} verknüpft.`
                      : searchQuery
                      ? 'In deiner persönlichen Bibliothek existiert noch kein Eintrag dazu. Möchtest du im globalen Katalog danach suchen und ihn zu deiner Sammlung hinzufügen?'
                      : selectedType === 'all'
                      ? 'Deine Sammlung ist aktuell noch leer. Füge dein erstes Medium hinzu.'
                      : 'In dieser Kategorie befinden sich noch keine Medien.'}
                  </p>
                  <div className="flex items-center gap-3 flex-wrap justify-center">
                    {selectedPlatform !== 'all' ? (
                      <>
                        <button
                          onClick={() => setSelectedPlatform('all')}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold shadow-lg shadow-black/20 active:scale-95 transition-all"
                        >
                          <span>Alle Spiele anzeigen ({platformCounts.all})</span>
                        </button>
                        <button
                          onClick={() => setIsGameImportModalOpen(true)}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-950/40 active:scale-95 transition-all"
                        >
                          <Gamepad2 className="w-4 h-4" />
                          <span>Spiele importieren</span>
                        </button>
                      </>
                    ) : searchQuery ? (
                      <button
                        onClick={() => handleOpenAddModal(undefined, searchQuery)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-950/40 active:scale-95 transition-all"
                      >
                        <Search className="w-4 h-4 stroke-[2.5]" />
                        <span>Im externen Katalog nach &quot;{searchQuery}&quot; suchen</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenAddModal()}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold shadow-lg shadow-black/20 active:scale-95 transition-all"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>Jetzt erstes Medium hinzufügen</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ================= SEQUEL RADAR VIEW ================= */
            <div className="space-y-6">
              {/* Radar Banner */}
              <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-r from-rose-950/40 via-[#181B22] to-[#0F1117] border border-rose-500/30 shadow-2xl">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      <Radar className="w-4 h-4 animate-spin text-rose-400" style={{ animationDuration: '6s' }} />
                      <span>Automatischer Sequel-Radar</span>
                    </div>
                    <h2 className="text-2xl font-black text-[#F1F3F7] tracking-tight">
                      Fortsetzungen &amp; Neue Staffeln
                    </h2>
                    <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
                      Erkennt automatisch neue Veröffentlichungen, Folgestaffeln und Fortsetzungen zu Medien aus
                      deiner Sammlung (Status: &quot;Beendet&quot; oder &quot;Gerade dabei&quot;).
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleCheckSequels}
                      disabled={isCheckingSequels}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950/40 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${isCheckingSequels ? 'animate-spin' : ''}`} />
                      <span>{isCheckingSequels ? 'Überprüfe...' : 'Jetzt neu scannen'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Subcategory Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: 'all' as const, label: 'Alle', icon: Layers, count: sequelCounts.all },
                  { id: 'game' as const, label: 'Videospiele', icon: Gamepad2, count: sequelCounts.game, color: 'text-purple-400' },
                  { id: 'movie' as const, label: 'Filme', icon: Film, count: sequelCounts.movie, color: 'text-rose-400' },
                  { id: 'show' as const, label: 'Serien', icon: Film, count: sequelCounts.show, color: 'text-amber-400' },
                  { id: 'anime' as const, label: 'Anime', icon: Sparkles, count: sequelCounts.anime, color: 'text-sky-400' },
                  { id: 'book' as const, label: 'Bücher', icon: BookOpen, count: sequelCounts.book, color: 'text-orange-400' },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = sequelFilterType === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setSequelFilterType(tab.id)}
                      className={cn(
                        'inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border',
                        isActive
                          ? 'bg-[#181B22] border-rose-500/60 text-white shadow-md shadow-rose-950/20'
                          : 'bg-[#181B22]/60 hover:bg-[#181B22] border-[#282D37] text-zinc-400 hover:text-zinc-200'
                      )}
                    >
                      <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-rose-400' : tab.color || 'text-zinc-400')} />
                      <span>{tab.label}</span>
                      <span
                        className={cn(
                          'px-1.5 py-0.5 rounded-full text-[10px] font-mono leading-none',
                          isActive
                            ? 'bg-rose-500 text-white'
                            : tab.count > 0
                            ? 'bg-zinc-800 text-zinc-300'
                            : 'bg-zinc-800/50 text-zinc-500'
                        )}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Detected Sequels Cards */}
              {filteredSequels.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredSequels.map((sequel) => (
                    <SequelCard
                      key={sequel.id}
                      sequel={sequel}
                      onAccept={handleAcceptSequel}
                      onDismiss={handleDismissSequel}
                    />
                  ))}
                </div>
              ) : sequels.length > 0 ? (
                /* Empty state for selected subcategory */
                <div className="py-16 flex flex-col items-center justify-center text-center p-6 rounded-3xl bg-[#181B22]/40 border border-dashed border-[#282D37]">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-[#282D37] flex items-center justify-center text-zinc-500 mb-3">
                    {sequelFilterType === 'game' && <Gamepad2 className="w-7 h-7 text-purple-400" />}
                    {sequelFilterType === 'movie' && <Film className="w-7 h-7 text-rose-400" />}
                    {sequelFilterType === 'show' && <Film className="w-7 h-7 text-amber-400" />}
                    {sequelFilterType === 'anime' && <Sparkles className="w-7 h-7 text-sky-400" />}
                    {sequelFilterType === 'book' && <BookOpen className="w-7 h-7 text-orange-400" />}
                  </div>
                  <h3 className="text-base font-bold text-[#F1F3F7]">
                    Keine Fortsetzungen in dieser Kategorie
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-4 leading-relaxed">
                    Für {sequelFilterType === 'game' ? 'Videospiele' : sequelFilterType === 'movie' ? 'Filme' : sequelFilterType === 'show' ? 'Serien' : sequelFilterType === 'anime' ? 'Anime' : 'Bücher'} liegen aktuell keine offenen Fortsetzungs-Meldungen vor.
                  </p>
                  <button
                    onClick={() => setSequelFilterType('all')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold border border-zinc-700 transition-colors"
                  >
                    <span>Alle {sequels.length} Fortsetzungen anzeigen</span>
                  </button>
                </div>
              ) : (
                /* General empty state */
                <div className="py-20 flex flex-col items-center justify-center text-center p-6 rounded-3xl bg-[#181B22]/40 border border-dashed border-[#282D37]">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-[#282D37] flex items-center justify-center text-zinc-500 mb-4">
                    <Sparkles className="w-8 h-8 text-rose-400" />
                  </div>
                  <h3 className="text-base font-bold text-[#F1F3F7]">Alles auf dem neuesten Stand!</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mt-1 leading-relaxed">
                    Aktuell liegen keine unbestätigten Fortsetzungen vor. Der Radar prüft deine Sammlung automatisch.
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Add Media Modal */}
      <AddMediaDialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddMedia={handleAddMedia}
        existingExternalIds={existingExternalIds}
        initialTab={addModalInitialTab}
        initialQuery={addModalInitialQuery}
        onOpenGameImport={() => setIsGameImportModalOpen(true)}
      />

      {/* Edit Media Modal */}
      <EditMediaModal
        item={editingItem}
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleSaveEdit}
        onDelete={handleDeleteMedia}
      />

      {/* Cloud-Sync & Backup Modal */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        media={media}
        sequels={sequels}
        onApplySync={handleApplySync}
        addToast={addToast}
      />

      {/* Steam, PSN, GOG Game Library Import Modal */}
      <GameImportModal
        isOpen={isGameImportModalOpen}
        onClose={() => setIsGameImportModalOpen(false)}
        media={media}
        onApplyImport={handleApplyGameImport}
        addToast={addToast}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav
        currentView={currentView}
        onSelectView={(view) => {
          setCurrentView(view);
          setIsMobileMenuOpen(false);
        }}
        onOpenMobileDrawer={() => setIsMobileMenuOpen((prev) => !prev)}
        onOpenAddModal={() => handleOpenAddModal()}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        sequelCount={sequels.length}
        isFilterActive={isFilterActive}
      />
    </div>
  );
}
