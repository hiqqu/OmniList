import { MediaItem, SequelNotification, MediaStatus, ProgressUnit } from '@/types/media';
import { INITIAL_MEDIA_ITEMS, INITIAL_SEQUEL_NOTIFICATIONS } from './seed-data';

const MEDIA_STORAGE_KEY = 'omnitrack_media_library_v1';
const SEQUELS_STORAGE_KEY = 'omnitrack_sequels_v1';

export function getStoredMedia(): MediaItem[] {
  if (typeof window === 'undefined') return INITIAL_MEDIA_ITEMS;

  try {
    const raw = localStorage.getItem(MEDIA_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(INITIAL_MEDIA_ITEMS));
      return INITIAL_MEDIA_ITEMS;
    }
    const parsed: MediaItem[] = JSON.parse(raw);
    
    // Auto-migrate legacy Unsplash covers or mismatched placeholders to official posters
    let hasMigrated = false;
    const upgraded = parsed.map((item) => {
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
        const matchingSeed = INITIAL_MEDIA_ITEMS.find(
          (s) => s.external_id === item.external_id || s.title.toLowerCase() === item.title.toLowerCase()
        );
        if (matchingSeed) {
          hasMigrated = true;
          return { ...item, coverUrl: matchingSeed.coverUrl };
        }
      }

      if (item.isOwned === undefined) {
        const matchingSeed = INITIAL_MEDIA_ITEMS.find((s) => s.id === item.id);
        if (matchingSeed?.isOwned) {
          hasMigrated = true;
          return { ...item, isOwned: true };
        }
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
            storyCompleted: isComp || item.id === 'media-cyberpunk-1' || item.id === 'media-eldenring-1',
            completionist100: item.id === 'media-eldenring-1',
            achievements:
              item.id === 'media-eldenring-1'
                ? { current: 42, total: 42 }
                : item.id === 'media-cyberpunk-1'
                ? { current: 34, total: 45 }
                : undefined,
            playtimeHours: item.progress.current,
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
    if (!raw) {
      localStorage.setItem(SEQUELS_STORAGE_KEY, JSON.stringify(INITIAL_SEQUEL_NOTIFICATIONS));
      return INITIAL_SEQUEL_NOTIFICATIONS;
    }
    const parsed: SequelNotification[] = JSON.parse(raw);

    // Auto-migrate legacy Unsplash covers to official posters
    let hasMigrated = false;
    const upgraded = parsed.map((seq) => {
      if (
        (seq.sequelCoverUrl && seq.sequelCoverUrl.includes('images.unsplash.com')) ||
        (seq.parentCoverUrl && seq.parentCoverUrl.includes('images.unsplash.com'))
      ) {
        const matchingSeed = INITIAL_SEQUEL_NOTIFICATIONS.find((s) => s.id === seq.id);
        if (matchingSeed) {
          hasMigrated = true;
          return {
            ...seq,
            sequelCoverUrl: matchingSeed.sequelCoverUrl,
            parentCoverUrl: matchingSeed.parentCoverUrl,
          };
        }
      }
      return seq;
    });

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

export function deleteMediaItem(id: string): void {
  const current = getStoredMedia();
  const target = current.find((m) => m.id === id);
  const filtered = current.filter((m) => m.id !== id);
  saveStoredMedia(filtered);

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
  saveStoredMedia(INITIAL_MEDIA_ITEMS);
  saveStoredSequels(INITIAL_SEQUEL_NOTIFICATIONS);
  return {
    media: INITIAL_MEDIA_ITEMS,
    sequels: INITIAL_SEQUEL_NOTIFICATIONS,
  };
}
