import { MediaItem, SequelNotification, MediaStatus, ProgressUnit } from '@/types/media';
import { INITIAL_MEDIA_ITEMS, INITIAL_SEQUEL_NOTIFICATIONS, LEGACY_DEMO_MEDIA_IDS, LEGACY_DEMO_SEQUEL_IDS } from './seed-data';
import { createBookSvgCover, getMediaCoverFallback } from './book-cover';

const MEDIA_STORAGE_KEY = 'omnilist_media_library_v1';
const LEGACY_MEDIA_STORAGE_KEY = 'omnitrack_media_library_v1';
const SEQUELS_STORAGE_KEY = 'omnilist_sequels_v1';
const LEGACY_SEQUELS_STORAGE_KEY = 'omnitrack_sequels_v1';
const DEMO_CLEARED_FLAG_KEY = 'omnilist_demo_cleared_v1';

export function getStoredMedia(): MediaItem[] {
  if (typeof window === 'undefined') return INITIAL_MEDIA_ITEMS;

  try {
    const raw = localStorage.getItem(MEDIA_STORAGE_KEY);
    const legacyRaw = !raw ? localStorage.getItem(LEGACY_MEDIA_STORAGE_KEY) : null;
    const sourceRaw = raw || legacyRaw;
    if (!sourceRaw) {
      localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem(DEMO_CLEARED_FLAG_KEY, 'true');
      return [];
    }
    const parsed: MediaItem[] = JSON.parse(sourceRaw);
    
    // Auto-purge legacy demo items from existing storage
    let hasMigrated = Boolean(legacyRaw);
    let workingList = parsed;
    if (!localStorage.getItem(DEMO_CLEARED_FLAG_KEY)) {
      workingList = parsed.filter((item) => !LEGACY_DEMO_MEDIA_IDS.has(item.id));
      localStorage.setItem(DEMO_CLEARED_FLAG_KEY, 'true');
      hasMigrated = true;
    }
    
    // Auto-migrate legacy Unsplash covers or mismatched placeholders to official posters
    const upgraded = workingList.map((item) => {
      // Fix Spider-Man saved with old Dune/Severance placeholder from earlier searches
      if (
        item.title.toLowerCase().includes('spider-man') &&
        (item.coverUrl.includes('d5NXSklXo0qyIYkgV94XAgMIckC') ||
          item.coverUrl.includes('1553b93b') ||
          item.coverUrl.includes('995400'))
      ) {
        hasMigrated = true;
        return {
          ...item,
          coverUrl:
            'https://m.media-amazon.com/images/M/MV5BZWM0OWVmNTEtNWVkOS00MzgyLTkyMzgtMmE2ZTZiNjY4MmFiXkEyXkFqcGc@._V1_QL75_UY562_CR0,0,380,562_.jpg',
        };
      }

      if (item.coverUrl && item.coverUrl.includes('images.unsplash.com')) {
        hasMigrated = true;
        return { ...item, coverUrl: getMediaCoverFallback(item) };
      }

      if (item.type === 'book' && item.coverUrl && item.coverUrl.includes('covers.openlibrary.org') && !item.coverUrl.includes('default=false')) {
        hasMigrated = true;
        const sep = item.coverUrl.includes('?') ? '&' : '?';
        return { ...item, coverUrl: `${item.coverUrl}${sep}default=false` };
      }

      if (item.isOwned === undefined) {
        const matchingSeed = INITIAL_MEDIA_ITEMS.find((s) => s.id === item.id);
        if (matchingSeed?.isOwned) {
          hasMigrated = true;
          return { ...item, isOwned: true };
        }
      }

      if (item.id === 'media-habits-1' && item.rating === 4.8 && item.status === 'in_progress') {
        hasMigrated = true;
        return { ...item, rating: undefined, communityRating: 4.8 };
      }

      // Migrate legacy status 'owned' to regular status 'planned' with isOwned: true
      if (item.status === 'owned') {
        hasMigrated = true;
        return {
          ...item,
          status: 'planned' as MediaStatus,
          isOwned: true,
        };
      }

      // Auto-set current to total if status is completed and total exists
      if (item.status === 'completed' && item.progress?.total && item.progress.total > 0 && item.progress.current < item.progress.total) {
        hasMigrated = true;
        return {
          ...item,
          progress: {
            ...item.progress,
            current: item.progress.total,
          },
        };
      }

      // Auto-clamp progress to total if it exceeds total
      if (item.progress?.total && item.progress.total > 0 && item.progress.current > item.progress.total) {
        hasMigrated = true;
        return {
          ...item,
          progress: {
            ...item.progress,
            current: item.progress.total,
          },
          status: 'completed' as MediaStatus,
        };
      }

      // Migrate movies from 'hours' to 'minutes'
      if (item.type === 'movie' && item.progress?.unit === 'hours') {
        hasMigrated = true;
        return {
          ...item,
          progress: {
            ...item.progress,
            unit: 'minutes' as ProgressUnit,
          },
        };
      }

      // Migrate games: remove artificial max playtime and initialize gameTracker
      if (item.type === 'game') {
        let changed = false;
        let tracker = item.gameTracker;
        if (!tracker) {
          changed = true;
          const isComp = item.status === 'completed';
          tracker = {
            storyCompleted: isComp,
            completionist100: isComp,
            allAchievementsCompleted: isComp,
            playtimeHours: item.progress.current,
          };
        } else if (tracker.achievements) {
          changed = true;
          const isAllDone = Boolean(
            tracker.allAchievementsCompleted ||
            (tracker.achievements.total > 0 && tracker.achievements.current >= tracker.achievements.total)
          );
          tracker = {
            ...tracker,
            allAchievementsCompleted: isAllDone,
            achievements: undefined,
          };
        }
        let progressObj = item.progress;
        if (progressObj?.total) {
          changed = true;
          progressObj = {
            ...progressObj,
            total: undefined,
          };
        }
        if (changed) {
          hasMigrated = true;
          return {
            ...item,
            progress: progressObj,
            gameTracker: tracker,
          };
        }
      }

      // Clean up legacy auto-generated placeholder notes and summaries
      if (
        item.summary &&
        (item.summary.startsWith('Exakte Buch-Ausgabe') ||
          item.summary.startsWith('Buch-Ausgabe mit ISBN') ||
          item.summary.startsWith('Buchausgabe für ISBN') ||
          item.summary.startsWith('Eigener Eintrag zu') ||
          item.summary.includes('in OmniList erfassen') ||
          item.summary.includes('in OmniTrack erfassen') ||
          item.summary.includes('Verfolge Staffeln und Episoden') ||
          item.summary.includes('Jetzt zur Sammlung hinzufügen'))
      ) {
        hasMigrated = true;
        return {
          ...item,
          summary: undefined,
        };
      }

      return item;
    });

    if (hasMigrated) {
      localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(upgraded));
    }

    return upgraded;
  } catch (e) {
    console.error('Failed to load media from localStorage', e);
    return INITIAL_MEDIA_ITEMS;
  }
}

export function saveStoredMedia(items: MediaItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save media to localStorage', e);
  }
}

export function getStoredSequels(): SequelNotification[] {
  if (typeof window === 'undefined') return INITIAL_SEQUEL_NOTIFICATIONS;

  try {
    const raw = localStorage.getItem(SEQUELS_STORAGE_KEY);
    const legacyRaw = !raw ? localStorage.getItem(LEGACY_SEQUELS_STORAGE_KEY) : null;
    const sourceRaw = raw || legacyRaw;
    if (!sourceRaw) {
      localStorage.setItem(SEQUELS_STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed: SequelNotification[] = JSON.parse(sourceRaw);

    // Auto-purge legacy demo sequels
    let hasMigrated = Boolean(legacyRaw);
    const nonDemoSequels = parsed.filter((s) => !LEGACY_DEMO_SEQUEL_IDS.has(s.id));
    if (nonDemoSequels.length !== parsed.length) {
      hasMigrated = true;
    }
    const upgraded = nonDemoSequels;

    if (hasMigrated) {
      localStorage.setItem(SEQUELS_STORAGE_KEY, JSON.stringify(upgraded));
    }

    // Auto-remove orphan sequels whose parent media was deleted or is not in library
    const currentMedia = getStoredMedia();
    const mediaIds = new Set(currentMedia.map((m) => m.id));
    const mediaTitles = new Set(currentMedia.map((m) => m.title.toLowerCase()));

    const activeSequels = upgraded.filter((s) => {
      const idMatch = s.parentMediaId ? mediaIds.has(s.parentMediaId) : false;
      const titleMatch = s.parentMediaTitle ? mediaTitles.has(s.parentMediaTitle.toLowerCase()) : false;
      return idMatch || titleMatch;
    });

    if (activeSequels.length !== parsed.length) {
      localStorage.setItem(SEQUELS_STORAGE_KEY, JSON.stringify(activeSequels));
    }

    return activeSequels;
  } catch (e) {
    console.error('Failed to load sequels from localStorage', e);
    return INITIAL_SEQUEL_NOTIFICATIONS;
  }
}

export function saveStoredSequels(sequels: SequelNotification[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SEQUELS_STORAGE_KEY, JSON.stringify(sequels));
  } catch (e) {
    console.error('Failed to save sequels to localStorage', e);
  }
}

export function addMediaItem(
  item: Omit<MediaItem, 'id' | 'createdAt' | 'updatedAt'>
): MediaItem {
  const current = getStoredMedia();
  const newItem: MediaItem = {
    ...item,
    id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // If a game is re-added manually, remove it from the ignored/deleted list
  if (item.type === 'game') {
    if (item.external_id) removeDeletedGameKey(item.external_id);
    if (item.title) {
      const norm = item.title.toLowerCase().replace(/[:\-_—–,.'!?/]/g, ' ').replace(/\s+/g, ' ').trim();
      removeDeletedGameKey(`title:${norm}`);
    }
  }

  const updated = [newItem, ...current];
  saveStoredMedia(updated);
  return newItem;
}

export function updateMediaItem(
  id: string,
  updates: Partial<MediaItem>
): MediaItem | null {
  const current = getStoredMedia();
  const index = current.findIndex((m) => m.id === id);
  if (index === -1) return null;

  const existing = current[index];
  const newStatus = updates.status !== undefined ? updates.status : existing.status;

  let sanitizedProgress = updates.progress ? { ...updates.progress } : { ...existing.progress };

  // If status is completed (or changed to completed), ensure all units/pages are marked as finished
  if (newStatus === 'completed' && sanitizedProgress && sanitizedProgress.total && sanitizedProgress.total > 0) {
    if (!updates.progress || sanitizedProgress.current < sanitizedProgress.total) {
      sanitizedProgress = {
        ...sanitizedProgress,
        current: sanitizedProgress.total,
      };
    }
  }

  if (
    sanitizedProgress &&
    sanitizedProgress.total &&
    sanitizedProgress.total > 0 &&
    sanitizedProgress.current > sanitizedProgress.total
  ) {
    sanitizedProgress = {
      ...sanitizedProgress,
      current: sanitizedProgress.total,
    };
  }

  const updatedItem: MediaItem = {
    ...existing,
    ...updates,
    progress: sanitizedProgress,
    updatedAt: new Date().toISOString(),
  };

  current[index] = updatedItem;
  saveStoredMedia(current);
  return updatedItem;
}

export const DELETED_GAMES_STORAGE_KEY = 'omnilist_deleted_game_external_ids_v1';

export function getDeletedGameKeys(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DELETED_GAMES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addDeletedGameKey(key: string): void {
  if (typeof window === 'undefined' || !key) return;
  try {
    const existing = new Set(getDeletedGameKeys());
    existing.add(key.toLowerCase().trim());
    localStorage.setItem(DELETED_GAMES_STORAGE_KEY, JSON.stringify(Array.from(existing)));
  } catch (e) {
    console.error('Failed to add deleted game key', e);
  }
}

export function removeDeletedGameKey(key: string): void {
  if (typeof window === 'undefined' || !key) return;
  try {
    const existing = new Set(getDeletedGameKeys());
    existing.delete(key.toLowerCase().trim());
    localStorage.setItem(DELETED_GAMES_STORAGE_KEY, JSON.stringify(Array.from(existing)));
  } catch (e) {
    console.error('Failed to remove deleted game key', e);
  }
}

export function clearDeletedGameKeys(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DELETED_GAMES_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear deleted game keys', e);
  }
}

export function isGameDeleted(externalId?: string, title?: string): boolean {
  if (typeof window === 'undefined') return false;
  const deletedSet = new Set(getDeletedGameKeys());
  if (deletedSet.size === 0) return false;

  if (externalId && deletedSet.has(externalId.toLowerCase().trim())) {
    return true;
  }
  if (title) {
    const norm = title.toLowerCase().replace(/[:\-_—–,.'!?/]/g, ' ').replace(/\s+/g, ' ').trim();
    if (deletedSet.has(`title:${norm}`)) {
      return true;
    }
  }
  return false;
}

export function deleteMediaItem(id: string): void {
  const current = getStoredMedia();
  const target = current.find((m) => m.id === id);
  const filtered = current.filter((m) => m.id !== id);
  saveStoredMedia(filtered);

  // If a game is deleted by user, track its ID/title so subsequent syncs do not re-add it
  if (target && target.type === 'game') {
    if (target.external_id) {
      addDeletedGameKey(target.external_id);
    }
    if (target.title) {
      const norm = target.title.toLowerCase().replace(/[:\-_—–,.'!?/]/g, ' ').replace(/\s+/g, ' ').trim();
      addDeletedGameKey(`title:${norm}`);
    }
    if (target.gameConnection?.service && target.gameConnection?.serviceId) {
      addDeletedGameKey(`${target.gameConnection.service}:${target.gameConnection.serviceId}`);
    }
  }

  // Auto-remove any sequels tied to this media item
  if (typeof window !== 'undefined') {
    try {
      const rawSequels = localStorage.getItem(SEQUELS_STORAGE_KEY);
      if (rawSequels) {
        const sequels: SequelNotification[] = JSON.parse(rawSequels);
        const updatedSequels = sequels.filter((s) => {
          if (s.parentMediaId === id) return false;
          if (
            target &&
            s.parentMediaTitle &&
            s.parentMediaTitle.trim().toLowerCase() === target.title.trim().toLowerCase()
          ) {
            return false;
          }
          return true;
        });
        saveStoredSequels(updatedSequels);
      }
    } catch (e) {
      console.error('Failed to prune sequels on deleteMediaItem', e);
    }
  }
}

export function dismissSequel(id: string): void {
  const current = getStoredSequels();
  const filtered = current.filter((s) => s.id !== id);
  saveStoredSequels(filtered);
}

export function acceptSequel(
  sequel: SequelNotification,
  targetStatus: MediaStatus = 'planned'
): MediaItem {
  const currentMedia = getStoredMedia();

  // Create new media item from sequel
  const newItem: MediaItem = {
    id: `media-seq-${Date.now()}`,
    title: sequel.sequelTitle,
    type: sequel.sequelType,
    status: targetStatus,
    coverUrl: sequel.sequelCoverUrl,
    releaseDate: sequel.releaseDate,
    summary: sequel.description || `Offizielle Fortsetzung zu ${sequel.parentMediaTitle}`,
    genres: [],
    progress: sequel.progressSuggestion || {
      current: 0,
      total: 10,
      unit: sequel.sequelType === 'book' ? 'pages' : sequel.sequelType === 'game' ? 'hours' : 'episodes',
    },
    external_id: sequel.external_id,
    franchise_id: sequel.franchise_id,
    collection_name: sequel.parentMediaTitle,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveStoredMedia([newItem, ...currentMedia]);

  // Remove sequel from radar
  dismissSequel(sequel.id);

  return newItem;
}

export function resetLibraryToDefault(): { media: MediaItem[]; sequels: SequelNotification[] } {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DEMO_CLEARED_FLAG_KEY, 'true');
  }
  saveStoredMedia([]);
  saveStoredSequels([]);
  return {
    media: [],
    sequels: [],
  };
}
