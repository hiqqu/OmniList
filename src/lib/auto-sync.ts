import { MediaItem } from '@/types/media';
import { isGameDeleted, saveStoredMedia } from './storage';

export const AUTO_SYNC_ENABLED_KEY = 'omnilist_auto_sync_enabled_v1';
export const LAST_AUTO_SYNC_KEY = 'omnilist_last_auto_sync_timestamp_v1';
export const STORAGE_STEAM_INPUT_KEY = 'omnilist_steam_input_v1';
export const STORAGE_GOG_USER_KEY = 'omnilist_gog_username_v1';

export function isAutoSyncEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem(AUTO_SYNC_ENABLED_KEY);
  return val !== 'false';
}

export function setAutoSyncEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTO_SYNC_ENABLED_KEY, enabled ? 'true' : 'false');
}

/**
 * Runs a silent background sync on app launch if enabled and accounts exist.
 * Minimum interval: 15 minutes between auto-sync runs.
 */
export async function runBackgroundAutoSync(
  currentMedia: MediaItem[],
  onUpdated: (newMedia: MediaItem[], summary: string) => void
): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!isAutoSyncEnabled()) return;

  const steamInput = localStorage.getItem(STORAGE_STEAM_INPUT_KEY)?.trim();
  if (!steamInput) return;

  const lastSyncStr = localStorage.getItem(LAST_AUTO_SYNC_KEY);
  const now = Date.now();
  if (lastSyncStr) {
    const lastSync = parseInt(lastSyncStr, 10);
    // Don't auto-sync if last sync was less than 15 minutes ago
    if (now - lastSync < 15 * 60 * 1000) return;
  }

  try {
    const res = await fetch('/api/sync/steam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get-games', steamInput }),
    });

    if (!res.ok) return;
    const data = await res.json();
    const fetchedGames: any[] = data.games || [];
    if (fetchedGames.length === 0) return;

    localStorage.setItem(LAST_AUTO_SYNC_KEY, String(now));

    let hasChanges = false;
    let updatedCount = 0;

    const updatedMedia = currentMedia.map((item) => {
      if (item.type !== 'game') return item;
      const match = fetchedGames.find(
        (sg) =>
          item.external_id === `steam:${sg.appid}` ||
          item.gameConnection?.serviceId === String(sg.appid) ||
          item.title.toLowerCase().trim() === sg.name.toLowerCase().trim()
      );
      if (!match) return item;

      // Check if playtime increased
      if (match.playtimeHours !== item.progress.current) {
        hasChanges = true;
        updatedCount++;
        return {
          ...item,
          external_id: item.external_id?.startsWith('steam:') ? item.external_id : `steam:${match.appid}`,
          connectedService: 'steam' as const,
          progress: { ...item.progress, current: match.playtimeHours, unit: 'hours' as const },
          gameTracker: {
            ...(item.gameTracker || {}),
            playtimeHours: match.playtimeHours,
          },
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    });

    // Check for new played games (> 0 hours) not in collection and not deleted
    const newItems: MediaItem[] = [];
    for (const sg of fetchedGames) {
      if (sg.playtimeHours <= 0) continue;
      const alreadyInList = currentMedia.some(
        (m) =>
          m.external_id === `steam:${sg.appid}` ||
          m.title.toLowerCase().trim() === sg.name.toLowerCase().trim()
      );
      if (alreadyInList) continue;

      if (isGameDeleted(`steam:${sg.appid}`, sg.name)) continue;

      hasChanges = true;
      newItems.push({
        id: `media-steam-${sg.appid}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: sg.name,
        type: 'game',
        status: 'in_progress',
        isOwned: true,
        coverUrl: sg.coverUrl,
        bannerUrl: sg.headerUrl,
        external_id: `steam:${sg.appid}`,
        connectedService: 'steam',
        publisher: 'Steam',
        progress: { current: sg.playtimeHours, unit: 'hours' },
        gameTracker: { playtimeHours: sg.playtimeHours, storyCompleted: false, completionist100: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    if (hasChanges) {
      const finalMedia = [...newItems, ...updatedMedia];
      saveStoredMedia(finalMedia);
      const parts = [];
      if (updatedCount > 0) parts.push(`${updatedCount} Spielzeiten aktualisiert`);
      if (newItems.length > 0) parts.push(`${newItems.length} neue Spiele hinzugefügt`);
      onUpdated(finalMedia, parts.join(', '));
    }
  } catch (err) {
    console.warn('Background auto-sync skipped:', err);
  }
}
