import { MediaItem, SequelNotification, MediaStatus } from '@/types/media';
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

    return upgraded;
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

  const updatedItem: MediaItem = {
    ...current[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  current[index] = updatedItem;
  saveStoredMedia(current);
  return updatedItem;
}

export function deleteMediaItem(id: string): void {
  const current = getStoredMedia();
  const filtered = current.filter((m) => m.id !== id);
  saveStoredMedia(filtered);
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
