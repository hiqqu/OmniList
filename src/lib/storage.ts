import { MediaItem, SequelNotification, MediaStatus, ProgressUnit } from '@/types/media';
import { INITIAL_MEDIA_ITEMS, INITIAL_SEQUEL_NOTIFICATIONS, LEGACY_DEMO_MEDIA_IDS, LEGACY_DEMO_SEQUEL_IDS } from './seed-data';
import { createBookSvgCover, getMediaCoverFallback } from './book-cover';
import {
  isSequelInLibrary,
  isSequelDismissed,
  addDismissedSequelKey,
  getDismissedSequelKeys,
  clearDismissedSequels,
  normalizeSequelMatchKey,
  getSequelTitleVariants,
} from './sequels';
import { getNumberVariants } from './metacritic';

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

      // Fix cross-platform collision: e.g. PlayStation game (like Batman Arkham Knight) hijacked by Steam sync
      if (
        item.type === 'game' &&
        item.connectedService === 'steam' &&
        (item.publisher?.toLowerCase().includes('playstation') ||
          item.title.toLowerCase().includes('arkham knight'))
      ) {
        hasMigrated = true;
        const currentPlaytime = (item.gameTracker?.playtimeHours && item.gameTracker.playtimeHours > 0)
          ? item.gameTracker.playtimeHours
          : (item.progress.current > 0 ? item.progress.current : 80);
        return {
          ...item,
          connectedService: 'psn' as const,
          publisher: item.publisher?.toLowerCase().includes('playstation') ? item.publisher : 'PlayStation (PS4)',
          status: 'completed' as MediaStatus,
          gameTracker: {
            ...(item.gameTracker || {}),
            storyCompleted: true,
            completionist100: true,
            allAchievementsCompleted: true,
            playtimeHours: currentPlaytime,
          },
          progress: {
            ...item.progress,
            current: currentPlaytime,
            unit: 'hours' as const,
          },
          gameConnection: {
            service: 'psn' as const,
            serviceName: 'PlayStation Network',
            platform: item.gameConnection?.platform || 'PS4',
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
        } else if (tracker.achievements && tracker.achievements.total > 0 && tracker.achievements.current >= tracker.achievements.total && !tracker.allAchievementsCompleted) {
          changed = true;
          tracker = {
            ...tracker,
            allAchievementsCompleted: true,
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
          item.summary.startsWith('Plattformen:') ||
          item.summary.startsWith('Videospiel auf Steam (App-ID:') ||
          item.summary.startsWith('Videospiel in der offenen Spieledatenbank') ||
          item.summary.includes('in OmniList erfassen') ||
          item.summary.includes('in OmniTrack erfassen') ||
          item.summary.includes('Verfolge Staffeln und Episoden') ||
          item.summary.includes('Jetzt zur Sammlung hinzufügen'))
      ) {
        hasMigrated = true;
        item = {
          ...item,
          summary: undefined,
        };
      }

      // Self-heal known video games missing summaries
      if (item.type === 'game' && (!item.summary || item.summary.trim() === '')) {
        const titleLower = item.title.toLowerCase();
        if (titleLower.includes('arkham knight')) {
          hasMigrated = true;
          item = {
            ...item,
            summary: 'Batman™: Arkham Knight stellt das epische Finale der preisgekrönten Arkham-Trilogie von Rocksteady Studios dar. Der Dunkle Ritter stellt sich der ultimativen Bedrohung gegen die Stadt, die er geschworen hat zu beschützen.',
            genres: item.genres && item.genres.length > 1 ? item.genres : ['Action', 'Open World', 'Superheld'],
            creator: item.creator || 'Rocksteady Studios',
          };
        } else if (titleLower.includes('arkham city')) {
          hasMigrated = true;
          item = {
            ...item,
            summary: 'Arkham City baut auf der intensiven Atmosphäre von Arkham Asylum auf und schickt Batman in ein riesiges, von Schwerverbrechern beherrschtes Gefängnisviertel von Gotham City.',
            genres: item.genres && item.genres.length > 1 ? item.genres : ['Action', 'Open World', 'Superheld'],
            creator: item.creator || 'Rocksteady Studios',
          };
        } else if (titleLower.includes('witcher 3') || titleLower.includes('wilde jagd') || titleLower.includes('wild hunt')) {
          hasMigrated = true;
          item = {
            ...item,
            summary: 'Als Hexer Geralt von Riva durchreist du vom Krieg verwüstete Länder auf der Suche nach Ciri, dem Kind der Prophezeiung.',
            genres: item.genres && item.genres.length > 1 ? item.genres : ['Open World', 'RPG', 'Story'],
            creator: item.creator || 'CD PROJEKT RED',
          };
        } else if (titleLower.includes('cyberpunk 2077')) {
          hasMigrated = true;
          item = {
            ...item,
            summary: 'Ein Open-World-Action-Adventure in Night City, einer von Macht, Glamour und Körpermodifikationen besessenen Megacity.',
            genres: item.genres && item.genres.length > 1 ? item.genres : ['Cyberpunk', 'Open World', 'Action RPG'],
            creator: item.creator || 'CD PROJEKT RED',
          };
        } else if (titleLower.includes('elden ring')) {
          hasMigrated = true;
          item = {
            ...item,
            summary: 'Erhebe dich, Befleckter, und werde zum Eldenfürsten im Zwischenland. Entdecke ein riesiges Fantasy-Abenteuer von FromSoftware und George R. R. Martin.',
            genres: item.genres && item.genres.length > 1 ? item.genres : ['Souls-like', 'Dark Fantasy', 'Open World'],
            creator: item.creator || 'FromSoftware Inc.',
          };
        } else if (titleLower.includes('bloodborne')) {
          hasMigrated = true;
          item = {
            ...item,
            summary: 'Ein düsteres Action-Rollenspiel voller unerbittlicher Gefahren in der verfallenen Stadt Yharnam, die von einer unheimlichen Seuche heimgesucht wird.',
            genres: item.genres && item.genres.length > 1 ? item.genres : ['Action RPG', 'Gothic Horror', 'Souls-like'],
            creator: item.creator || 'FromSoftware / Japan Studio',
          };
        }
      }

      // Self-heal anime items missing community ratings or having cut off summaries
      if (item.type === 'anime') {
        const titleLower = item.title.toLowerCase();
        let changedAnime = false;
        const updates: Partial<MediaItem> = {};

        if (!item.communityRating || item.communityRating <= 0) {
          if (titleLower.includes('frieren')) {
            updates.communityRating = 92;
            updates.communityRatingsCount = 380000;
            updates.metacritic = 94;
            changedAnime = true;
          } else if (titleLower.includes('jujutsu kaisen')) {
            updates.communityRating = 87;
            updates.communityRatingsCount = 420000;
            updates.metacritic = 87;
            changedAnime = true;
          } else if (titleLower.includes('solo leveling')) {
            updates.communityRating = 84;
            updates.communityRatingsCount = 290000;
            updates.metacritic = 83;
            changedAnime = true;
          } else if (titleLower.includes('demon slayer') || titleLower.includes('kimetsu')) {
            updates.communityRating = 86;
            updates.communityRatingsCount = 510000;
            updates.metacritic = 85;
            changedAnime = true;
          } else if (titleLower.includes('attack on titan') || titleLower.includes('shingeki')) {
            updates.communityRating = 89;
            updates.communityRatingsCount = 650000;
            updates.metacritic = 89;
            changedAnime = true;
          }
        }

        // Fix cut-off summaries for known anime
        if (item.summary && item.summary.length <= 310 && (item.summary.endsWith('...') || item.summary.endsWith('…') || item.summary.length === 300)) {
          if (titleLower.includes('frieren')) {
            updates.summary = 'Die Elfenmagierin Frieren überlebt ihre menschlichen Gefährten und begibt sich auf eine emotionale Reise, um den wahren Wert von Zeit und menschlichen Bindungen zu verstehen.';
            changedAnime = true;
          } else if (titleLower.includes('jujutsu kaisen')) {
            updates.summary = 'Yuji Itadori schluckt einen verfluchten Talisman und wird Teil der Welt der Flüche und Jujutsu-Zauberer an der Tokyo Jujutsu High School.';
            changedAnime = true;
          } else if (titleLower.includes('solo leveling')) {
            updates.summary = 'Der schwächste Jäger aller Zeiten, Sung Jin-Woo, erhält nach einem tödlichen Dungeon eine geheime Quest, die nur er sehen und aufleveln kann.';
            changedAnime = true;
          }
        }

        if (changedAnime) {
          hasMigrated = true;
          item = {
            ...item,
            ...updates,
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

    // Auto-remove any stored sequels that the user now possesses in their collection or dismissed
    const rawSequels = localStorage.getItem(SEQUELS_STORAGE_KEY);
    if (rawSequels) {
      const existingSequels: SequelNotification[] = JSON.parse(rawSequels);
      const dismissedSet = new Set(getDismissedSequelKeys());
      const cleaned = existingSequels.filter((s) => !isSequelInLibrary(s, items) && !isSequelDismissed(s, dismissedSet));
      if (cleaned.length !== existingSequels.length) {
        localStorage.setItem(SEQUELS_STORAGE_KEY, JSON.stringify(cleaned));
      }
    }
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

    // Safely remove legacy storage key so it never resurrects pruned sequels
    if (legacyRaw) {
      localStorage.removeItem(LEGACY_SEQUELS_STORAGE_KEY);
    }

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

    // Auto-remove orphan sequels whose parent media was deleted or is not in library,
    // AND auto-remove any sequel that is already owned/present in the user's collection,
    // AND auto-remove any sequel that has been dismissed by the user!
    const currentMedia = getStoredMedia();
    const mediaIds = new Set(currentMedia.map((m) => m.id));
    const mediaTitles = new Set(currentMedia.map((m) => m.title.toLowerCase()));
    const dismissedSet = new Set(getDismissedSequelKeys());

    const activeSequels = upgraded.filter((s) => {
      const idMatch = s.parentMediaId ? mediaIds.has(s.parentMediaId) : false;
      const titleMatch = s.parentMediaTitle ? mediaTitles.has(s.parentMediaTitle.toLowerCase()) : false;
      const parentExists = idMatch || titleMatch;
      const alreadyOwned = isSequelInLibrary(s, currentMedia);
      const isDismissed = isSequelDismissed(s, dismissedSet);
      return parentExists && !alreadyOwned && !isDismissed;
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
    const dismissedSet = new Set(getDismissedSequelKeys());
    const currentMedia = getStoredMedia();
    const valid = sequels.filter(
      (s) => !isSequelDismissed(s, dismissedSet) && !isSequelInLibrary(s, currentMedia)
    );
    localStorage.setItem(SEQUELS_STORAGE_KEY, JSON.stringify(valid));
    localStorage.removeItem(LEGACY_SEQUELS_STORAGE_KEY);
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

export interface TrashItem {
  id: string;
  item: MediaItem;
  deletedAt: string;
}

export const TRASH_STORAGE_KEY = 'omnilist_trash_media_v1';
const MAX_TRASH_ITEMS = 100;

export function getStoredTrash(): TrashItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TRASH_STORAGE_KEY);
    if (!raw) return [];
    const parsed: TrashItem[] = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to get trash items', e);
    return [];
  }
}

export function saveStoredTrash(items: TrashItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    const capped = items.slice(0, MAX_TRASH_ITEMS);
    localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(capped));
  } catch (e) {
    console.error('Failed to save trash items', e);
  }
}

export function deleteMediaItem(id: string): MediaItem | null {
  const current = getStoredMedia();
  const target = current.find((m) => m.id === id);
  const filtered = current.filter((m) => m.id !== id);
  saveStoredMedia(filtered);

  if (target) {
    const trash = getStoredTrash();
    const existingIndex = trash.findIndex((t) => t.id === id);
    const newTrashItem: TrashItem = {
      id: target.id,
      item: target,
      deletedAt: new Date().toISOString(),
    };
    if (existingIndex >= 0) {
      trash[existingIndex] = newTrashItem;
    } else {
      trash.unshift(newTrashItem);
    }
    saveStoredTrash(trash);

    // If a game is deleted by user, track its ID/title so subsequent syncs do not re-add it
    if (target.type === 'game') {
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

  return target || null;
}

export function restoreTrashItem(id: string): MediaItem | null {
  const trash = getStoredTrash();
  const targetEntry = trash.find((t) => t.id === id);
  if (!targetEntry) return null;

  // Remove from trash
  const remainingTrash = trash.filter((t) => t.id !== id);
  saveStoredTrash(remainingTrash);

  // Restore to library
  const currentMedia = getStoredMedia();
  const filtered = currentMedia.filter((m) => m.id !== id);
  const restoredItem: MediaItem = {
    ...targetEntry.item,
    updatedAt: new Date().toISOString(),
  };
  saveStoredMedia([restoredItem, ...filtered]);

  // If game, unblock it
  if (restoredItem.type === 'game') {
    if (restoredItem.external_id) {
      removeDeletedGameKey(restoredItem.external_id);
    }
    if (restoredItem.title) {
      const norm = restoredItem.title.toLowerCase().replace(/[:\-_—–,.'!?/]/g, ' ').replace(/\s+/g, ' ').trim();
      removeDeletedGameKey(`title:${norm}`);
    }
    if (restoredItem.gameConnection?.service && restoredItem.gameConnection?.serviceId) {
      removeDeletedGameKey(`${restoredItem.gameConnection.service}:${restoredItem.gameConnection.serviceId}`);
    }
  }

  return restoredItem;
}

export function permanentlyDeleteTrashItem(id: string): void {
  const trash = getStoredTrash();
  const remaining = trash.filter((t) => t.id !== id);
  saveStoredTrash(remaining);
}

export function clearTrash(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TRASH_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear trash', e);
  }
}

export function restoreAllTrash(): MediaItem[] {
  const trash = getStoredTrash();
  if (trash.length === 0) return [];

  const restoredItems: MediaItem[] = [];
  const currentMedia = getStoredMedia();
  const currentMap = new Map(currentMedia.map((m) => [m.id, m]));

  for (const entry of trash) {
    const item = { ...entry.item, updatedAt: new Date().toISOString() };
    currentMap.set(item.id, item);
    restoredItems.push(item);

    if (item.type === 'game') {
      if (item.external_id) {
        removeDeletedGameKey(item.external_id);
      }
      if (item.title) {
        const norm = item.title.toLowerCase().replace(/[:\-_—–,.'!?/]/g, ' ').replace(/\s+/g, ' ').trim();
        removeDeletedGameKey(`title:${norm}`);
      }
      if (item.gameConnection?.service && item.gameConnection?.serviceId) {
        removeDeletedGameKey(`${item.gameConnection.service}:${item.gameConnection.serviceId}`);
      }
    }
  }

  saveStoredMedia(Array.from(currentMap.values()));
  clearTrash();
  return restoredItems;
}

export function dismissSequel(
  sequelOrId: SequelNotification | string,
  extraExternalId?: string,
  extraTitle?: string
): void {
  if (typeof window === 'undefined') return;

  const current = getStoredSequels();
  const targetId = typeof sequelOrId === 'string' ? sequelOrId : sequelOrId?.id;
  const targetExtId = (typeof sequelOrId === 'object' ? sequelOrId.external_id : extraExternalId)?.trim().toLowerCase();
  const targetFranchiseId = (typeof sequelOrId === 'object' ? sequelOrId.franchise_id : undefined)?.trim().toLowerCase();
  const targetParentMediaId = (typeof sequelOrId === 'object' ? sequelOrId.parentMediaId : undefined)?.trim();
  const targetParentTitle = (typeof sequelOrId === 'object' ? sequelOrId.parentMediaTitle : undefined)?.trim();
  const targetTitle = typeof sequelOrId === 'object' ? sequelOrId.sequelTitle : extraTitle;

  // Gather all unique keys for blacklist to prevent any resurrection
  const keysToDismiss: string[] = [];
  if (targetId) keysToDismiss.push(targetId.trim().toLowerCase());
  if (targetExtId) keysToDismiss.push(targetExtId);
  if (targetFranchiseId) keysToDismiss.push(targetFranchiseId);

  if (targetTitle) {
    const variants = getSequelTitleVariants(targetTitle);
    for (const v of variants) {
      keysToDismiss.push(v);
      if (targetParentMediaId) {
        keysToDismiss.push(`parent:${targetParentMediaId}:${v}`);
      }
      if (targetParentTitle) {
        const pNorm = normalizeSequelMatchKey(targetParentTitle);
        if (pNorm) keysToDismiss.push(`parenttitle:${pNorm}:${v}`);
      }
    }
  }

  // Also collect matching keys from any existing stored sequel entry
  for (const s of current) {
    const idMatch = targetId ? s.id === targetId : false;
    const extMatch = targetExtId && s.external_id ? s.external_id.trim().toLowerCase() === targetExtId : false;
    const titleMatch = targetTitle && s.sequelTitle ? normalizeSequelMatchKey(s.sequelTitle) === normalizeSequelMatchKey(targetTitle) : false;
    if (idMatch || extMatch || titleMatch) {
      if (s.id) keysToDismiss.push(s.id.trim().toLowerCase());
      if (s.external_id) keysToDismiss.push(s.external_id.trim().toLowerCase());
      if (s.franchise_id) keysToDismiss.push(s.franchise_id.trim().toLowerCase());
      if (s.parentMediaId && s.sequelTitle) {
        keysToDismiss.push(`parent:${s.parentMediaId}:${normalizeSequelMatchKey(s.sequelTitle)}`);
      }
      if (s.sequelTitle) {
        for (const v of getSequelTitleVariants(s.sequelTitle)) {
          keysToDismiss.push(v);
        }
      }
    }
  }

  addDismissedSequelKey(keysToDismiss);

  const dismissedSet = new Set(getDismissedSequelKeys());
  const filtered = current.filter((s) => !isSequelDismissed(s, dismissedSet));

  saveStoredSequels(filtered);
  localStorage.removeItem(LEGACY_SEQUELS_STORAGE_KEY);
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

  // Remove sequel from radar and mark as dismissed so it never returns
  dismissSequel(sequel);

  return newItem;
}

export function resetLibraryToDefault(): { media: MediaItem[]; sequels: SequelNotification[] } {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DEMO_CLEARED_FLAG_KEY, 'true');
    clearDismissedSequels();
    localStorage.removeItem(LEGACY_SEQUELS_STORAGE_KEY);
  }
  saveStoredMedia([]);
  saveStoredSequels([]);
  return {
    media: [],
    sequels: [],
  };
}
