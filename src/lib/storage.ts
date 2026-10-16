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
    return JSON.parse(raw);
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
    return JSON.parse(raw);
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
