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
import { StatsBar } from '@/components/StatsBar';
import {
  ImportResult,
  getItemPlatform,
  resolveGamePlatform,
  resolveGameConsole,
  GalaxyPlatformFilter,
} from '@/lib/game-import';
import { getMediaMetacriticScore } from '@/lib/metacritic';
import { isLiveServiceGame } from '@/lib/live-service';
import { ToastContainer, ToastMessage } from '@/components/Toast';
import {
  MediaItem,
  MediaType,
  MediaStatus,
  SequelNotification,
  GalaxySortKey,
  GalaxyGroupKey,
  GalaxyFilterState,
} from '@/types/media';
import { runBackgroundAutoSync } from '@/lib/auto-sync';
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
import { isSequelInLibrary, isSequelDismissed, normalizeSequelMatchKey } from '@/lib/sequels';
import { getUnitIncrement, getMediaStatusBadge, cn } from '@/lib/utils';
import { Radar, Plus, Sparkles, RefreshCw, Layers, Library, Film, BookOpen, Gamepad2, X, PackageCheck, Search } from 'lucide-react';

function getAchievementsPct(item: MediaItem): number {
  if (item.gameTracker?.achievements?.total && item.gameTracker.achievements.total > 0) {
    return (item.gameTracker.achievements.current / item.gameTracker.achievements.total) * 100;
  }
  if (item.gameTracker?.completionist100 || item.gameTracker?.allAchievementsCompleted) return 100;
  if (item.progress?.total && item.progress.total > 0) {
    return (item.progress.current / item.progress.total) * 100;
  }
  return 0;
}

function getPlaytimeHours(item: MediaItem): number {
  if (item.gameTracker?.playtimeHours && item.gameTracker.playtimeHours > 0) {
    return item.gameTracker.playtimeHours;
  }
  if (item.progress?.unit === 'hours' && item.progress.current > 0) {
    return item.progress.current;
  }
  if (item.gameConnection?.playtimeMinutes && item.gameConnection.playtimeMinutes > 0) {
    return Math.round((item.gameConnection.playtimeMinutes / 60) * 10) / 10;
  }
  return 0;
}

function getLastPlayedTime(item: MediaItem): number {
  if (item.gameConnection?.lastPlayed) {
    const t = new Date(item.gameConnection.lastPlayed).getTime();
    if (!isNaN(t)) return t;
  }
  const t = new Date(item.updatedAt).getTime();
  return isNaN(t) ? 0 : t;
}

function getReleaseDateTime(item: MediaItem): number {
  if (item.releaseDate) {
    const t = new Date(item.releaseDate).getTime();
    if (!isNaN(t)) return t;
  }
  return 0;
}

export default function Home() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [sequels, setSequels] = useState<SequelNotification[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Navigation & View Filters
  const [currentView, setCurrentView] = useState<'dashboard' | 'sequel_radar'>('dashboard');
  const [selectedType, setSelectedType] = useState<MediaType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<MediaStatus | 'all'>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'steam' | 'psn' | 'gog' | 'epic' | 'other'>('all');
  const [onlyOwned, setOnlyOwned] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<GalaxySortKey>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [groupBy, setGroupBy] = useState<GalaxyGroupKey>('none');
  const [filters, setFilters] = useState<GalaxyFilterState>({
    platforms: [],
    consoles: [],
    ratings: [],
    tags: [],
    statuses: [],
    ownership: [],
    eras: [],
    formats: [],
    bookFormats: [],
    pageLengths: [],
    types: [],
  });
  const [sequelFilterType, setSequelFilterType] = useState<MediaType | 'all'>('all');

  // Modals & States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalInitialTab, setAddModalInitialTab] = useState<MediaType | undefined>(undefined);
  const [addModalInitialQuery, setAddModalInitialQuery] = useState<string>('');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncModalTab, setSyncModalTab] = useState<'cloud' | 'gaming' | 'file'>('cloud');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [isCheckingSequels, setIsCheckingSequels] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const handleOpenGamingSync = () => {
    setSyncModalTab('gaming');
    setIsSyncModalOpen(true);
  };

  const handleOpenSyncModal = (tab: 'cloud' | 'gaming' | 'file' = 'cloud') => {
    setSyncModalTab(tab);
    setIsSyncModalOpen(true);
  };

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const item of media) {
      if (selectedType !== 'all' && item.type !== selectedType) continue;
      if (item.genres) {
        for (const g of item.genres) {
          if (g.trim()) tagSet.add(g.trim());
        }
      }
    }
    return Array.from(tagSet).sort();
  }, [media, selectedType]);

  const handleResetFilters = () => {
    setFilters({
      platforms: [],
      consoles: [],
      ratings: [],
      tags: [],
      statuses: [],
      ownership: [],
      eras: [],
      formats: [],
      bookFormats: [],
      pageLengths: [],
      types: [],
    });
    setSelectedPlatform('all');
    setSelectedStatus('all');
    setOnlyOwned(false);
  };

  const isFilterActive =
    selectedType !== 'all' ||
    selectedStatus !== 'all' ||
    onlyOwned ||
    selectedPlatform !== 'all' ||
    filters.platforms.length > 0 ||
    filters.consoles.length > 0 ||
    filters.ratings.length > 0 ||
    filters.tags.length > 0 ||
    filters.statuses.length > 0;

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

    // Auto-backfill Metacritic scores & normalize Live-Service game status
    let hasBackfill = false;
    const backfilledMedia = loadedMedia.map((item) => {
      let updatedItem = item;
      if (item.type === 'game') {
        const isLive = isLiveServiceGame(item);
        if (isLive && item.status !== 'planned' && item.status !== 'in_progress') {
          hasBackfill = true;
          updatedItem = { ...updatedItem, status: 'in_progress' };
        }
        if (item.publisher && !item.gameConnection?.platform) {
          const match = item.publisher.match(/PlayStation\s*\(([^)]+)\)/i);
          if (match && match[1]) {
            hasBackfill = true;
            updatedItem = {
              ...updatedItem,
              gameConnection: {
                ...(updatedItem.gameConnection || { service: 'psn', serviceName: 'PlayStation Network' }),
                platform: match[1].trim(),
              },
            };
          }
        }
        if (!item.metacritic || item.metacritic <= 0) {
          const score = getMediaMetacriticScore(updatedItem);
          if (score !== null) {
            hasBackfill = true;
            updatedItem = { ...updatedItem, metacritic: score };
          }
        }
      }
      return updatedItem;
    });

    if (hasBackfill) {
      saveStoredMedia(backfilledMedia);
      setMedia(backfilledMedia);
    } else {
      setMedia(loadedMedia);
    }

    const currentMediaItems = hasBackfill ? backfilledMedia : loadedMedia;
    const unownedLoadedSequels = loadedSequels.filter(
      (s) => !isSequelInLibrary(s, currentMediaItems) && !isSequelDismissed(s)
    );
    if (unownedLoadedSequels.length !== loadedSequels.length) {
      saveStoredSequels(unownedLoadedSequels);
    }
    setSequels(unownedLoadedSequels);
    setIsLoaded(true);

    // Silent background auto-sync for connected game accounts (e.g. Steam)
    const baseMedia = hasBackfill ? backfilledMedia : loadedMedia;
    runBackgroundAutoSync(baseMedia, (syncedMedia, summary) => {
      setMedia(syncedMedia);
      addToast('info', 'Hintergrund-Sync', summary);
    });

    // Background enrichment for games missing Metacritic score
    const unratedGames = baseMedia.filter(
      (m) => m.type === 'game' && (!m.metacritic || m.metacritic <= 0)
    );
    if (unratedGames.length > 0) {
      // Process a small batch to asynchronously resolve Metacritic
      Promise.all(
        unratedGames.slice(0, 8).map(async (g) => {
          try {
            const query = new URLSearchParams({
              type: 'game',
              title: g.title,
              ...(g.external_id ? { externalId: g.external_id } : {}),
            });
            const res = await fetch(`/api/enrich?${query.toString()}`);
            if (res.ok) {
              const data = await res.json();
              if (data?.metacritic || data?.communityRating) {
                const updates: Partial<MediaItem> = {};
                if (data.metacritic) updates.metacritic = data.metacritic;
                if (data.communityRating && !g.communityRating) {
                  updates.communityRating = data.communityRating;
                  if (data.communityRatingsCount) updates.communityRatingsCount = data.communityRatingsCount;
                }
                const updated = updateMediaItem(g.id, updates);
                if (updated) {
                  setMedia((prev) => prev.map((item) => (item.id === g.id ? updated : item)));
                }
              }
            }
          } catch {}
        })
      );
    }
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
    if (isLiveServiceGame(item)) return; // Live-Service games have no story
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

  // Toggle Live-Service
  const handleToggleLiveService = (id: string) => {
    const item = media.find((m) => m.id === id);
    if (!item) return;
    const currentIsLive = isLiveServiceGame(item);
    const nextIsLive = !currentIsLive;

    // When enabling Live-Service:
    // It replaces status beendet/gerade dabei/abgebrochen/pausiert.
    // Only 'planned' is preserved.
    const newStatus: MediaStatus = item.status === 'planned' ? 'planned' : 'in_progress';
    const updated = updateMediaItem(id, {
      isLiveService: nextIsLive,
      status: nextIsLive ? newStatus : item.status,
      gameTracker: {
        ...(item.gameTracker || {}),
        isLiveService: nextIsLive,
        storyCompleted: nextIsLive ? false : item.gameTracker?.storyCompleted,
      },
    });

    if (updated) {
      setMedia((prev) => prev.map((m) => (m.id === id ? updated : m)));
      addToast(
        'info',
        item.title,
        nextIsLive ? 'Als Live-Service-Spiel markiert (ersetzt Kampagnen-Status)' : 'Live-Service-Modus deaktiviert'
      );
    }
  };

  // Toggle Game 100% Handler
  const handleToggleGame100 = (id: string) => {
    const item = media.find((m) => m.id === id);
    if (!item) return;
    const isLive = isLiveServiceGame(item);
    const new100 = !item.gameTracker?.completionist100;
    const updated = updateMediaItem(id, {
      gameTracker: {
        ...(item.gameTracker || {}),
        completionist100: new100,
        storyCompleted: isLive ? false : (new100 ? true : item.gameTracker?.storyCompleted),
      },
      status: !isLive && new100 && item.status !== 'owned' ? 'completed' : item.status,
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
    const isLive = isLiveServiceGame(item);
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
        achievements: item.gameTracker?.achievements
          ? {
              ...item.gameTracker.achievements,
              current: newDone ? item.gameTracker.achievements.total : item.gameTracker.achievements.current,
            }
          : undefined,
        completionist100: newDone ? true : item.gameTracker?.completionist100,
        storyCompleted: isLive ? false : (newDone ? true : item.gameTracker?.storyCompleted),
      },
      status: !isLive && newDone && item.status !== 'owned' ? 'completed' : item.status,
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
    const updatedMedia = [created, ...media];
    setMedia(updatedMedia);

    // Auto-prune and dismiss any sequel matching this newly added medium
    if (created.external_id || created.title) {
      dismissSequel(created.id, created.external_id, created.title);
    }
    setSequels((prev) => {
      const filtered = prev.filter((s) => !isSequelInLibrary(s, updatedMedia) && !isSequelDismissed(s));
      if (filtered.length !== prev.length) {
        saveStoredSequels(filtered);
      }
      return filtered;
    });

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
    const updatedMedia = [created, ...media];
    setMedia(updatedMedia);
    setSequels((prev) => {
      const filtered = prev.filter(
        (s) =>
          s.id !== sequel.id &&
          (!sequel.external_id || !s.external_id || s.external_id !== sequel.external_id) &&
          normalizeSequelMatchKey(s.sequelTitle) !== normalizeSequelMatchKey(sequel.sequelTitle) &&
          !isSequelInLibrary(s, updatedMedia) &&
          !isSequelDismissed(s)
      );
      saveStoredSequels(filtered);
      return filtered;
    });
    addToast(
      'success',
      `Fortsetzung übernommen!`,
      `"${created.title}" wurde zu "${targetStatus === 'in_progress' ? 'Gerade dabei' : 'Geplant'}" hinzugefügt.`
    );
  };

  const handleDismissSequel = (sequelOrId: SequelNotification | string) => {
    const sequelObj = typeof sequelOrId === 'object' ? sequelOrId : sequels.find((s) => s.id === sequelOrId);
    dismissSequel(sequelObj || sequelOrId);
    const targetId = typeof sequelOrId === 'string' ? sequelOrId : sequelOrId?.id;
    const targetTitle = sequelObj ? normalizeSequelMatchKey(sequelObj.sequelTitle) : '';
    setSequels((prev) => {
      const filtered = prev.filter((s) => {
        if (targetId && s.id === targetId) return false;
        if (targetTitle && normalizeSequelMatchKey(s.sequelTitle) === targetTitle) return false;
        return !isSequelDismissed(s);
      });
      saveStoredSequels(filtered);
      return filtered;
    });
    addToast('info', 'Fortsetzungsmeldung ignoriert');
  };

  // Manual Check Sequels Sync via Route Handler
  const handleCheckSequels = async () => {
    setIsCheckingSequels(true);
    addToast('info', 'Sequel Radar aktiv', 'Prüfe Kataloge auf neue Staffeln & Fortsetzungen...');

    try {
      const mediaToScan = getStoredMedia().length > 0 ? getStoredMedia() : media;
      const res = await fetch('/api/check-sequels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: mediaToScan }),
      });

      if (res.ok) {
        const data = await res.json();
        const detectedSequels: SequelNotification[] = data.sequels || [];

        // Exclude sequels that are already in the media library or dismissed
        const trulyNewSequels = detectedSequels.filter(
          (s) => !isSequelInLibrary(s, mediaToScan) && !isSequelDismissed(s)
        );

        // Deduplicate newly detected sequels within this scan batch itself
        const seenBatchKeys = new Set<string>();
        const uniqueDetected: SequelNotification[] = [];
        for (const s of trulyNewSequels) {
          const titleKey = normalizeSequelMatchKey(s.sequelTitle);
          const extKey = s.external_id ? s.external_id.trim().toLowerCase() : '';
          const dedupeKey = extKey ? `ext:${extKey}` : `title:${titleKey}`;
          if (!seenBatchKeys.has(dedupeKey)) {
            seenBatchKeys.add(dedupeKey);
            if (titleKey) seenBatchKeys.add(`title:${titleKey}`);
            if (extKey) seenBatchKeys.add(`ext:${extKey}`);
            uniqueDetected.push(s);
          }
        }

        const freshSequels = getStoredSequels();
        const existingExternalIds = new Set(
          freshSequels.map((s) => s.external_id?.trim().toLowerCase()).filter(Boolean)
        );
        const existingTitleKeys = new Set(
          freshSequels.map((s) => normalizeSequelMatchKey(s.sequelTitle)).filter(Boolean)
        );

        const newDetections = uniqueDetected.filter((s) => {
          if (s.external_id && existingExternalIds.has(s.external_id.trim().toLowerCase())) return false;
          if (s.sequelTitle && existingTitleKeys.has(normalizeSequelMatchKey(s.sequelTitle))) return false;
          return true;
        });

        if (newDetections.length > 0) {
          const merged = [...newDetections, ...freshSequels].filter(
            (s) => !isSequelInLibrary(s, mediaToScan) && !isSequelDismissed(s)
          );
          setSequels(merged);
          saveStoredSequels(merged);
          addToast(
            'success',
            `${newDetections.length} neue Fortsetzung(en) gefunden!`,
            'Der Radar hat neue Releases für deine Bibliothek erkannt.'
          );
        } else {
          // Clean existing sequels if any became owned or dismissed in the meantime
          const cleaned = freshSequels.filter(
            (s) => !isSequelInLibrary(s, mediaToScan) && !isSequelDismissed(s)
          );
          setSequels(cleaned);
          saveStoredSequels(cleaned);
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

  // Instant local full-text search (< 10 ms) and filtering with Galaxy multi-criteria filters
  const filteredAndSortedMedia = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    const filtered = media.filter((item) => {
      // Type filter
      if (selectedType !== 'all' && item.type !== selectedType) {
        return false;
      }

      // Status filter (from Sidebar single-select)
      if (selectedStatus !== 'all') {
        const isLive = isLiveServiceGame(item);
        if (selectedStatus === 'owned') {
          if (!item.isOwned && item.status !== 'owned') return false;
        } else if (selectedStatus === 'live_service') {
          if (!isLive) return false;
        } else if (selectedStatus === 'completed') {
          if (isLive || item.status !== 'completed') return false;
        } else if (selectedStatus === 'in_progress') {
          if (isLive) {
            if (item.status === 'planned') return false;
          } else if (item.status !== 'in_progress') {
            return false;
          }
        } else if (item.status !== selectedStatus) {
          return false;
        }
      }

      // Status filter (from Galaxy multi-select filter)
      if (filters.statuses.length > 0) {
        const isLive = isLiveServiceGame(item);
        const itemStatus = isLive ? 'live_service' : item.status;
        if (!filters.statuses.includes(itemStatus)) {
          return false;
        }
      }

      // Combinable ownership filter (e.g. Planned + Owned)
      if (onlyOwned && !item.isOwned && item.status !== 'owned') {
        return false;
      }

      // Platform filter (from Sidebar single-select)
      if (selectedPlatform !== 'all') {
        const platform = resolveGamePlatform(item);
        if (platform !== selectedPlatform) {
          return false;
        }
      }

      // Platform filter (from Galaxy multi-select filter - only applies to games)
      if (filters.platforms.length > 0) {
        if (item.type !== 'game') return false;
        const platform = resolveGamePlatform(item);
        if (!filters.platforms.includes(platform)) {
          return false;
        }
      }

      // OS & consoles filter (from Galaxy multi-select filter - only applies to games)
      if (filters.consoles.length > 0) {
        if (item.type !== 'game') return false;
        const consoleName = resolveGameConsole(item);
        if (!filters.consoles.includes(consoleName)) {
          return false;
        }
      }

      // Media types filter (when browsing all media)
      if (filters.types && filters.types.length > 0) {
        if (!filters.types.includes(item.type)) {
          return false;
        }
      }

      // Ownership filter
      if (filters.ownership && filters.ownership.length > 0) {
        const isOwned = item.isOwned === true || item.status === 'owned';
        const matchesOwnership = filters.ownership.some((o) => {
          if (o === 'owned') return isOwned;
          if (o === 'wishlist') return !isOwned;
          return false;
        });
        if (!matchesOwnership) return false;
      }

      // Release Era filter (for movies, shows, anime, books)
      if (filters.eras && filters.eras.length > 0) {
        const year = item.releaseDate ? parseInt(item.releaseDate.split('-')[0], 10) : 0;
        const matchesEra = filters.eras.some((e) => {
          if (e === '2020s') return year >= 2020;
          if (e === '2010s') return year >= 2010 && year <= 2019;
          if (e === '2000s') return year >= 2000 && year <= 2009;
          if (e === '1990s') return year >= 1990 && year <= 1999;
          if (e === 'classic') return year > 0 && year < 1990;
          return false;
        });
        if (!matchesEra) return false;
      }

      // Format filter (for shows & anime)
      if (filters.formats && filters.formats.length > 0) {
        const seasons = item.progress?.totalSeasons || 1;
        const matchesFormat = filters.formats.some((f) => {
          if (f === 'miniseries') return item.type === 'show' && seasons === 1;
          if (f === 'compact') return item.type === 'show' && seasons >= 2 && seasons <= 4;
          if (f === 'longrunning') return item.type === 'show' && seasons >= 5;
          if (f === 'anime_tv') return item.type === 'anime' && (seasons >= 1 || item.progress?.unit === 'episodes');
          if (f === 'anime_movie') return item.type === 'anime' && (item.progress?.unit === 'minutes' || item.genres?.some((g) => /film|movie/i.test(g)));
          if (f === 'anime_ova') return item.type === 'anime' && item.genres?.some((g) => /ova|special/i.test(g));
          return false;
        });
        if (!matchesFormat) return false;
      }

      // Book Format filter
      if (filters.bookFormats && filters.bookFormats.length > 0) {
        const pubLower = (item.publisher || '').toLowerCase();
        const matchesBookFormat = filters.bookFormats.some((bf) => {
          if (bf === 'audiobook') return item.progress?.unit === 'hours' || /audible|audio|hörbuch/i.test(pubLower);
          if (bf === 'ebook') return /kindle|ebook|e-book/i.test(pubLower) || item.isbn?.startsWith('B0');
          if (bf === 'physical') return !item.isbn?.startsWith('B0') && !/audible|audio|hörbuch|kindle|ebook|e-book/i.test(pubLower);
          return false;
        });
        if (!matchesBookFormat) return false;
      }

      // Page Length filter
      if (filters.pageLengths && filters.pageLengths.length > 0) {
        const pages = item.progress?.total || item.progress?.current || 0;
        const matchesLength = filters.pageLengths.some((pl) => {
          if (pl === 'short') return pages > 0 && pages < 200;
          if (pl === 'medium') return pages >= 200 && pages <= 500;
          if (pl === 'long') return pages > 500;
          return false;
        });
        if (!matchesLength) return false;
      }

      // Rating filter (from Galaxy multi-select filter)
      if (filters.ratings.length > 0) {
        const score = getMediaMetacriticScore(item) ?? 0;
        const userRating = item.rating ?? item.communityRating ?? 0;
        const matchesRating = filters.ratings.some((r) => {
          if (r === '90') return score >= 90;
          if (r === '80') return score >= 80;
          if (r === '70') return score >= 70;
          if (r === 'stars5') return userRating >= 4.8;
          if (r === 'stars4') return userRating >= 3.8;
          if (r === 'stars3') return userRating >= 2.8;
          return false;
        });
        if (!matchesRating) return false;
      }

      // Tags / Genre filter (from Galaxy multi-select filter)
      if (filters.tags.length > 0) {
        const hasTag = item.genres?.some((g) => filters.tags.includes(g.trim()));
        if (!hasTag) return false;
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

    // 12-way GOG Galaxy Sorting
    return [...filtered].sort((a, b) => {
      let diff = 0;
      switch (sortBy) {
        case 'achievements': {
          const achA = getAchievementsPct(a);
          const achB = getAchievementsPct(b);
          diff = achB - achA;
          break;
        }
        case 'critics_rating': {
          const scoreA = getMediaMetacriticScore(a) ?? -1;
          const scoreB = getMediaMetacriticScore(b) ?? -1;
          diff = scoreB - scoreA;
          break;
        }
        case 'date_added': {
          const tA = new Date(a.createdAt || a.updatedAt).getTime();
          const tB = new Date(b.createdAt || b.updatedAt).getTime();
          diff = tB - tA;
          break;
        }
        case 'game_time': {
          const timeA = getPlaytimeHours(a);
          const timeB = getPlaytimeHours(b);
          diff = timeB - timeA;
          break;
        }
        case 'genre': {
          const gA = a.genres?.[0] || 'zzz';
          const gB = b.genres?.[0] || 'zzz';
          diff = gA.localeCompare(gB);
          break;
        }
        case 'last_played': {
          const lpA = getLastPlayedTime(a);
          const lpB = getLastPlayedTime(b);
          diff = lpB - lpA;
          break;
        }
        case 'platform': {
          const pA = resolveGamePlatform(a);
          const pB = resolveGamePlatform(b);
          diff = pA.localeCompare(pB);
          break;
        }
        case 'rating': {
          const rA = a.rating ?? -1;
          const rB = b.rating ?? -1;
          diff = rB - rA;
          break;
        }
        case 'release_date': {
          const rdA = getReleaseDateTime(a);
          const rdB = getReleaseDateTime(b);
          diff = rdB - rdA;
          break;
        }
        case 'size_on_disk':
          diff = a.title.localeCompare(b.title);
          break;
        case 'tags': {
          const tA = a.collection_name || a.genres?.[0] || 'zzz';
          const tB = b.collection_name || b.genres?.[0] || 'zzz';
          diff = tA.localeCompare(tB);
          break;
        }
        case 'title':
        default:
          diff = a.title.localeCompare(b.title);
          break;
      }

      if (diff === 0) {
        diff = a.title.localeCompare(b.title);
      }

      // Handle natural vs inverted sort direction
      const naturallyAscending = ['title', 'genre', 'platform', 'tags'].includes(sortBy);
      if (naturallyAscending) {
        return sortDirection === 'asc' ? diff : -diff;
      } else {
        return sortDirection === 'desc' ? diff : -diff;
      }
    });
  }, [media, selectedType, selectedStatus, selectedPlatform, onlyOwned, searchQuery, sortBy, sortDirection, filters]);

  // Grouped media helper (GOG Galaxy "Group by")
  const groupedMedia = useMemo(() => {
    if (groupBy === 'none') {
      return [{ key: 'all', label: '', items: filteredAndSortedMedia }];
    }

    const groupsMap = new Map<string, { label: string; items: MediaItem[] }>();

    if (groupBy === 'platform') {
      const platformOrder: { id: GalaxyPlatformFilter; label: string }[] = [
        { id: 'steam', label: 'Steam' },
        { id: 'psn', label: 'PlayStation' },
        { id: 'gog', label: 'GOG.com' },
        { id: 'epic', label: 'Epic' },
        { id: 'other', label: 'Andere Plattformen' },
      ];
      for (const p of platformOrder) {
        groupsMap.set(p.id, { label: p.label, items: [] });
      }
      for (const item of filteredAndSortedMedia) {
        const p = resolveGamePlatform(item);
        const group = groupsMap.get(p) || groupsMap.get('other')!;
        group.items.push(item);
      }
    } else if (groupBy === 'status') {
      const statusOrder: { id: MediaStatus; label: string }[] = [
        { id: 'in_progress', label: 'Gerade dabei' },
        { id: 'live_service', label: 'Live-Service' },
        { id: 'completed', label: 'Beendet' },
        { id: 'planned', label: 'Geplant' },
        { id: 'paused', label: 'Pausiert' },
        { id: 'dropped', label: 'Abgebrochen' },
      ];
      for (const s of statusOrder) {
        groupsMap.set(s.id, { label: s.label, items: [] });
      }
      for (const item of filteredAndSortedMedia) {
        const isLive = isLiveServiceGame(item);
        const key = isLive ? 'live_service' : item.status;
        const group = groupsMap.get(key) || groupsMap.get('in_progress')!;
        group.items.push(item);
      }
    } else if (groupBy === 'genre') {
      for (const item of filteredAndSortedMedia) {
        const genre = item.genres?.[0] || 'Ohne Genre';
        if (!groupsMap.has(genre)) {
          groupsMap.set(genre, { label: genre, items: [] });
        }
        groupsMap.get(genre)!.items.push(item);
      }
    } else if (groupBy === 'release_year') {
      for (const item of filteredAndSortedMedia) {
        let year = 'Unbekannt';
        if (item.releaseDate) {
          const match = item.releaseDate.match(/\b(19\d\d|20\d\d)\b/);
          if (match) year = match[1];
        }
        if (!groupsMap.has(year)) {
          groupsMap.set(year, { label: year, items: [] });
        }
        groupsMap.get(year)!.items.push(item);
      }
    }

    return Array.from(groupsMap.entries())
      .filter(([_, g]) => g.items.length > 0)
      .map(([key, g]) => ({ key, label: g.label, items: g.items }));
  }, [filteredAndSortedMedia, groupBy]);

  // Platform counts for games
  const platformCounts = useMemo(() => {
    const games = media.filter((m) => m.type === 'game');
    return {
      all: games.length,
      steam: games.filter((m) => resolveGamePlatform(m) === 'steam').length,
      psn: games.filter((m) => resolveGamePlatform(m) === 'psn').length,
      gog: games.filter((m) => resolveGamePlatform(m) === 'gog').length,
      epic: games.filter((m) => resolveGamePlatform(m) === 'epic').length,
      other: games.filter((m) => resolveGamePlatform(m) === 'other').length,
    };
  }, [media]);

  // Sequel Radar: exclude sequels already present in user's library or dismissed
  const unownedSequels = useMemo(() => {
    return sequels.filter((s) => !isSequelInLibrary(s, media) && !isSequelDismissed(s));
  }, [sequels, media]);

  // Sequel Radar subcategories counts and filtered list
  const sequelCounts = useMemo(() => {
    return {
      all: unownedSequels.length,
      game: unownedSequels.filter((s) => s.sequelType === 'game' || s.parentMediaType === 'game').length,
      movie: unownedSequels.filter((s) => s.sequelType === 'movie' || s.parentMediaType === 'movie').length,
      show: unownedSequels.filter((s) => s.sequelType === 'show' || s.parentMediaType === 'show').length,
      anime: unownedSequels.filter((s) => s.sequelType === 'anime' || s.parentMediaType === 'anime').length,
      book: unownedSequels.filter((s) => s.sequelType === 'book' || s.parentMediaType === 'book').length,
    };
  }, [unownedSequels]);

  const filteredSequels = useMemo(() => {
    if (sequelFilterType === 'all') return unownedSequels;
    return unownedSequels.filter((s) => s.sequelType === sequelFilterType || s.parentMediaType === sequelFilterType);
  }, [unownedSequels, sequelFilterType]);

  // Apply Synced Data from Cloud or File
  const handleApplySync = (syncedMedia: MediaItem[], syncedSequels?: SequelNotification[]) => {
    saveStoredMedia(syncedMedia);
    setMedia(syncedMedia);
    if (syncedSequels && syncedSequels.length > 0) {
      const validSequels = syncedSequels.filter((s) => !isSequelInLibrary(s, syncedMedia) && !isSequelDismissed(s));
      saveStoredSequels(validSequels);
      setSequels(validSequels);
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
        sequelCount={unownedSequels.length}
        totalMediaCount={media.length}
        isCheckingSequels={isCheckingSequels}
        onCheckSequels={handleCheckSequels}
        onResetLibrary={handleResetLibrary}
        onOpenSyncModal={() => handleOpenSyncModal('cloud')}
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
          sortDirection={sortDirection}
          groupBy={groupBy}
          onSortChange={(newSort) => {
            if (newSort === sortBy) {
              setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
            } else {
              setSortBy(newSort);
              const naturallyAscending = ['title', 'genre', 'platform', 'tags'].includes(newSort);
              setSortDirection(naturallyAscending ? 'asc' : 'desc');
            }
          }}
          onDirectionToggle={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
          onGroupChange={setGroupBy}
          filters={filters}
          onFilterChange={setFilters}
          onResetFilters={handleResetFilters}
          availableTags={availableTags}
          activeType={selectedType}
          onOpenAddModal={() => handleOpenAddModal(selectedType !== 'all' ? selectedType : undefined)}
          onOpenAddModalWithQuery={(q) => handleOpenAddModal(selectedType !== 'all' ? selectedType : undefined, q)}
          onOpenSyncModal={() => handleOpenSyncModal('cloud')}
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
                sequels={unownedSequels}
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
                      onClick={handleOpenGamingSync}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 transition-all active:scale-95 shadow-sm"
                      title="Spiele aus Steam, PlayStation Network oder GOG synchronisieren"
                    >
                      <Gamepad2 className="w-3.5 h-3.5 text-purple-400" />
                      <span>Steam / PSN / GOG Sync</span>
                    </button>
                  )}

                  {/* Active Galaxy Platforms Pills */}
                  {filters.platforms.map((p) => {
                    const label =
                      p === 'steam'
                        ? 'Steam'
                        : p === 'psn'
                        ? 'PlayStation'
                        : p === 'gog'
                        ? 'GOG.com'
                        : p === 'epic'
                        ? 'Epic'
                        : 'Andere';
                    return (
                      <button
                        key={p}
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            platforms: prev.platforms.filter((x) => x !== p),
                          }))
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 transition-colors shadow-sm"
                        title={`Filter "${label}" entfernen`}
                      >
                        <Gamepad2 className="w-3.5 h-3.5 text-purple-400" />
                        <span>Plattform: {label}</span>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    );
                  })}

                  {/* Active Galaxy Consoles Pills */}
                  {filters.consoles.map((c) => (
                    <button
                      key={c}
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          consoles: prev.consoles.filter((x) => x !== c),
                        }))
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-500/40 transition-colors shadow-sm"
                      title={`Filter "${c}" entfernen`}
                    >
                      <span>System: {c}</span>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ))}

                  {/* Active Galaxy Status Pills */}
                  {filters.statuses.map((st) => {
                    const label =
                      st === 'in_progress'
                        ? 'Gerade dabei'
                        : st === 'completed'
                        ? 'Beendet'
                        : st === 'planned'
                        ? 'Geplant'
                        : st === 'paused'
                        ? 'Pausiert'
                        : st === 'dropped'
                        ? 'Abgebrochen'
                        : 'Live-Service';
                    return (
                      <button
                        key={st}
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            statuses: prev.statuses.filter((x) => x !== st),
                          }))
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 transition-colors shadow-sm"
                        title={`Status "${label}" entfernen`}
                      >
                        <span>Status: {label}</span>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    );
                  })}

                  {/* Active Galaxy Rating Pills */}
                  {filters.ratings.map((r) => {
                    const label =
                      r === '90'
                        ? '90+ Metacritic'
                        : r === '80'
                        ? '80+ Metacritic'
                        : r === '70'
                        ? '70+ Metacritic'
                        : r === 'stars5'
                        ? '5 Sterne'
                        : r === 'stars4'
                        ? '4+ Sterne'
                        : '3+ Sterne';
                    return (
                      <button
                        key={r}
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            ratings: prev.ratings.filter((x) => x !== r),
                          }))
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 transition-colors shadow-sm"
                        title={`Wertung "${label}" entfernen`}
                      >
                        <span>Wertung: {label}</span>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    );
                  })}

                  {/* Active Galaxy Tag Pills */}
                  {filters.tags.map((t) => (
                    <button
                      key={t}
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          tags: prev.tags.filter((x) => x !== t),
                        }))
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 transition-colors shadow-sm"
                      title={`Tag "${t}" entfernen`}
                    >
                      <span>Tag: {t}</span>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ))}

                  {/* Active Galaxy Ownership Pills */}
                  {(filters.ownership || []).map((o) => (
                    <button
                      key={o}
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          ownership: (prev.ownership || []).filter((x) => x !== o),
                        }))
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 border border-teal-500/40 transition-colors shadow-sm"
                      title="Besitz-Filter entfernen"
                    >
                      <span>{o === 'owned' ? 'Im Besitz' : 'Wunschliste'}</span>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ))}

                  {/* Active Galaxy Era Pills */}
                  {(filters.eras || []).map((e) => {
                    const label =
                      e === '2020s'
                        ? '2020er'
                        : e === '2010s'
                        ? '2010er'
                        : e === '2000s'
                        ? '2000er'
                        : e === '1990s'
                        ? '90er'
                        : 'Klassiker (<1990)';
                    return (
                      <button
                        key={e}
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            eras: (prev.eras || []).filter((x) => x !== e),
                          }))
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 transition-colors shadow-sm"
                        title={`Ära "${label}" entfernen`}
                      >
                        <span>Ära: {label}</span>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    );
                  })}

                  {/* Active Galaxy Format Pills */}
                  {(filters.formats || []).map((f) => {
                    const label =
                      f === 'miniseries'
                        ? 'Miniserie'
                        : f === 'compact'
                        ? '2-4 Staffeln'
                        : f === 'longrunning'
                        ? '5+ Staffeln'
                        : f === 'anime_tv'
                        ? 'TV-Serie'
                        : f === 'anime_movie'
                        ? 'Anime-Film'
                        : 'OVA';
                    return (
                      <button
                        key={f}
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            formats: (prev.formats || []).filter((x) => x !== f),
                          }))
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 transition-colors shadow-sm"
                        title={`Format "${label}" entfernen`}
                      >
                        <span>Format: {label}</span>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    );
                  })}

                  {/* Active Galaxy Book Format Pills */}
                  {(filters.bookFormats || []).map((bf) => {
                    const label =
                      bf === 'physical'
                        ? 'Physisch'
                        : bf === 'ebook'
                        ? 'E-Book'
                        : 'Hörbuch';
                    return (
                      <button
                        key={bf}
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            bookFormats: (prev.bookFormats || []).filter((x) => x !== bf),
                          }))
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/20 hover:bg-orange-500/30 text-orange-200 border border-orange-500/40 transition-colors shadow-sm"
                        title={`Ausgabe "${label}" entfernen`}
                      >
                        <span>Ausgabe: {label}</span>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    );
                  })}

                  {/* Active Galaxy Page Length Pills */}
                  {(filters.pageLengths || []).map((pl) => {
                    const label =
                      pl === 'short'
                        ? '< 200 S.'
                        : pl === 'medium'
                        ? '200-500 S.'
                        : '> 500 S.';
                    return (
                      <button
                        key={pl}
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            pageLengths: (prev.pageLengths || []).filter((x) => x !== pl),
                          }))
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 transition-colors shadow-sm"
                        title={`Umfang "${label}" entfernen`}
                      >
                        <span>Seiten: {label}</span>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    );
                  })}

                  {/* Active Galaxy Media Types Pills */}
                  {(filters.types || []).map((tp) => {
                    const label =
                      tp === 'game'
                        ? 'Spiele'
                        : tp === 'movie'
                        ? 'Filme'
                        : tp === 'show'
                        ? 'Serien'
                        : tp === 'anime'
                        ? 'Anime'
                        : 'Bücher';
                    return (
                      <button
                        key={tp}
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            types: (prev.types || []).filter((x) => x !== tp),
                          }))
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 transition-colors shadow-sm"
                        title={`Medientyp "${label}" entfernen`}
                      >
                        <span>Typ: {label}</span>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    );
                  })}

                  {/* Active Group By Indicator */}
                  {groupBy !== 'none' && (
                    <button
                      onClick={() => setGroupBy('none')}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 transition-colors shadow-sm"
                      title="Gruppierung aufheben"
                    >
                      <Layers className="w-3.5 h-3.5 text-purple-400" />
                      <span>
                        Gruppiert:{' '}
                        {groupBy === 'platform'
                          ? 'Plattform'
                          : groupBy === 'status'
                          ? 'Status'
                          : groupBy === 'genre'
                          ? 'Genre'
                          : 'Jahr'}
                      </span>
                      <X className="w-3.5 h-3.5" />
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
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 transition-colors shadow-sm"
                      title="Plattform-Filter zurücksetzen"
                    >
                      <Gamepad2 className="w-3.5 h-3.5" />
                      <span>
                        Plattform:{' '}
                        {selectedPlatform === 'steam'
                          ? 'Steam'
                          : selectedPlatform === 'psn'
                          ? 'PlayStation'
                          : 'GOG Galaxy'}
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

                  {isFilterActive && (
                    <button
                      onClick={handleResetFilters}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700 transition-colors"
                      title="Alle Filter auf einmal zurücksetzen"
                    >
                      <span>Alle Filter zurücksetzen</span>
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
                    { id: 'epic' as const, label: 'Epic', count: platformCounts.epic, iconColor: 'text-zinc-300', activeStyle: 'bg-zinc-700/40 border-zinc-500 text-zinc-100 shadow-sm' },
                    { id: 'other' as const, label: 'Andere', count: platformCounts.other, iconColor: 'text-zinc-400', activeStyle: 'bg-zinc-700/40 border-zinc-500 text-zinc-200 shadow-sm' },
                  ].map((tab) => {
                    const isAll = tab.id === 'all';
                    const isActive = isAll
                      ? filters.platforms.length === 0 && selectedPlatform === 'all'
                      : filters.platforms.includes(tab.id) || selectedPlatform === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          if (isAll) {
                            setSelectedPlatform('all');
                            setFilters((prev) => ({ ...prev, platforms: [] }));
                          } else {
                            setSelectedPlatform('all');
                            setFilters((prev) => {
                              const set = new Set(prev.platforms);
                              if (set.has(tab.id)) set.delete(tab.id);
                              else set.add(tab.id);
                              return { ...prev, platforms: Array.from(set) };
                            });
                          }
                        }}
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

              {/* Media Card Grid (2:3 aspect ratio) with GOG Galaxy Grouping */}
              {filteredAndSortedMedia.length > 0 ? (
                <div className="space-y-8">
                  {groupedMedia.map((group) => (
                    <div key={group.key} className="space-y-3">
                      {group.label && (
                        <div className="flex items-center gap-2.5 pb-2 border-b border-[#282D37]/80">
                          <h3 className="text-sm sm:text-base font-bold text-[#F1F3F7]">
                            {group.label}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-xs font-mono font-bold">
                            {group.items.length}
                          </span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 min-[2200px]:grid-cols-8 gap-2.5 sm:gap-3.5 md:gap-4 lg:gap-5">
                        {group.items.map((item) => (
                          <MediaCard
                            key={item.id}
                            item={item}
                            onQuickIncrement={handleQuickIncrement}
                            onUpdateStatus={handleUpdateStatus}
                            onToggleOwned={handleToggleOwned}
                            onToggleLiveService={handleToggleLiveService}
                            onToggleGameStory={handleToggleGameStory}
                            onToggleGame100={handleToggleGame100}
                            onToggleGameAchievements={handleToggleGameAchievements}
                            onEdit={setEditingItem}
                            onDelete={handleDeleteMedia}
                          />
                        ))}
                      </div>
                    </div>
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
                          onClick={handleOpenGamingSync}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-950/40 active:scale-95 transition-all"
                        >
                          <Gamepad2 className="w-4 h-4" />
                          <span>Spiele synchronisieren</span>
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
              ) : unownedSequels.length > 0 ? (
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
                    <span>Alle {unownedSequels.length} Fortsetzungen anzeigen</span>
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
        onOpenGameImport={handleOpenGamingSync}
      />

      {/* Edit Media Modal */}
      <EditMediaModal
        item={editingItem}
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleSaveEdit}
        onDelete={handleDeleteMedia}
      />

      {/* Cloud-Sync & Gaming-Accounts Modal */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        media={media}
        sequels={unownedSequels}
        onApplySync={handleApplySync}
        addToast={addToast}
        initialTab={syncModalTab}
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
        onOpenSyncModal={() => handleOpenSyncModal('cloud')}
        sequelCount={unownedSequels.length}
        isFilterActive={isFilterActive}
      />
    </div>
  );
}
