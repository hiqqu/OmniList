'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Sidebar,
} from '@/components/Sidebar';
import { Header, SortOption } from '@/components/Header';
import { MediaCard } from '@/components/MediaCard';
import { SequelCard } from '@/components/SequelCard';
import { AddMediaDialog } from '@/components/AddMediaDialog';
import { EditMediaModal } from '@/components/EditMediaModal';
import { SyncModal } from '@/components/SyncModal';
import { StatsBar } from '@/components/StatsBar';
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
import { getUnitIncrement, getMediaStatusBadge } from '@/lib/utils';
import { Radar, Plus, Sparkles, RefreshCw, Layers, Library, Film, BookOpen, Gamepad2, X, PackageCheck } from 'lucide-react';

export default function Home() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [sequels, setSequels] = useState<SequelNotification[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Navigation & View Filters
  const [currentView, setCurrentView] = useState<'dashboard' | 'sequel_radar'>('dashboard');
  const [selectedType, setSelectedType] = useState<MediaType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<MediaStatus | 'all'>('all');
  const [onlyOwned, setOnlyOwned] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('updated');

  // Modals & States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [isCheckingSequels, setIsCheckingSequels] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

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
        newStory ? 'Hauptstory als beendet markiert ✓' : 'Story-Status auf offen gesetzt'
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
        isCompleted && total ? `Alle ${total} Einheiten als abgeschlossen markiert.` : undefined
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
    addToast('success', `Hinzugefügt!`, `${created.title} ist jetzt in deiner Sammlung.`);
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

  // Reset to default seed
  const handleResetLibrary = () => {
    if (window.confirm('Möchtest du die Mediensammlung auf die Standard-Demodaten zurücksetzen?')) {
      const reset = resetLibraryToDefault();
      setMedia(reset.media);
      setSequels(reset.sequels);
      addToast('info', 'Demo-Daten wiederhergestellt', 'Vorbefüllte Medien & Sequel-Meldungen geladen.');
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
  }, [media, selectedType, selectedStatus, searchQuery, sortBy]);

  // Apply Synced Data from Cloud or File
  const handleApplySync = (syncedMedia: MediaItem[], syncedSequels?: SequelNotification[]) => {
    saveStoredMedia(syncedMedia);
    setMedia(syncedMedia);
    if (syncedSequels && syncedSequels.length > 0) {
      saveStoredSequels(syncedSequels);
      setSequels(syncedSequels);
    }
  };

  const existingExternalIds = useMemo(() => new Set(media.map((m) => m.external_id)), [media]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Radar className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm font-medium">OmniTrack wird geladen...</p>
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
        onSelectType={setSelectedType}
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
        onlyOwned={onlyOwned}
        onToggleOnlyOwned={() => setOnlyOwned((prev) => !prev)}
        sequelCount={sequels.length}
        totalMediaCount={media.length}
        isCheckingSequels={isCheckingSequels}
        onCheckSequels={handleCheckSequels}
        onResetLibrary={handleResetLibrary}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Top Header */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenSyncModal={() => setIsSyncModalOpen(true)}
          totalFilteredCount={filteredAndSortedMedia.length}
        />

        {/* View Content */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {currentView === 'dashboard' ? (
            /* ================= DASHBOARD VIEW ================= */
            <>
              {/* Stats Bar */}
              <StatsBar
                media={media}
                sequels={sequels}
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

                {/* Aktive Filter-Pills */}
                {(selectedStatus !== 'all' || onlyOwned) && (
                  <div className="flex items-center gap-2 flex-wrap">
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
                )}
              </div>

              {/* Media Card Grid (2:3 aspect ratio) */}
              {filteredAndSortedMedia.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {filteredAndSortedMedia.map((item) => (
                    <MediaCard
                      key={item.id}
                      item={item}
                      onQuickIncrement={handleQuickIncrement}
                      onUpdateStatus={handleUpdateStatus}
                      onToggleOwned={handleToggleOwned}
                      onToggleGameStory={handleToggleGameStory}
                      onToggleGame100={handleToggleGame100}
                      onEdit={setEditingItem}
                      onDelete={handleDeleteMedia}
                    />
                  ))}
                </div>
              ) : (
                /* Empty state */
                <div className="py-20 flex flex-col items-center justify-center text-center p-6 rounded-3xl bg-[#181B22]/40 border border-dashed border-[#282D37]">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-[#282D37] flex items-center justify-center text-zinc-400 mb-4">
                    <Layers className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-[#F1F3F7]">Keine Medien gefunden</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-5">
                    {searchQuery
                      ? `Keine Einträge für "${searchQuery}" mit den aktuellen Filtern.`
                      : 'In dieser Kategorie befinden sich noch keine Medien.'}
                  </p>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold shadow-lg shadow-black/20 active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Jetzt erstes Medium hinzufügen</span>
                  </button>
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

              {/* Detected Sequels Cards */}
              {sequels.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sequels.map((sequel) => (
                    <SequelCard
                      key={sequel.id}
                      sequel={sequel}
                      onAccept={handleAcceptSequel}
                      onDismiss={handleDismissSequel}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center p-6 rounded-3xl bg-surface/40 border border-dashed border-border">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-4">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-base font-bold text-white">Alles auf dem neuesten Stand!</h3>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
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

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
