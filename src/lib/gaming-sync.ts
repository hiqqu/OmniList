import { MediaItem, SequelNotification } from '@/types/media';
import { isGameDeleted, saveStoredMedia, saveStoredSequels } from './storage';
import { getMediaMetacriticScore } from './metacritic';
import { getKnownGamePresets } from './game-presets';
import { isSequelInLibrary, isSequelDismissed } from './sequels';

export const STORAGE_STEAM_INPUT_KEY = 'omnilist_steam_input_v1';
export const STORAGE_PSN_NPSSO_KEY = 'omnilist_psn_npsso_v1';
export const STORAGE_GOG_USER_KEY = 'omnilist_gog_username_v1';
export const STORAGE_GOG_TOKEN_KEY = 'omnilist_gog_token_v1';

export function hasConnectedGamingAccounts(): boolean {
  if (typeof window === 'undefined') return false;
  const steam = localStorage.getItem(STORAGE_STEAM_INPUT_KEY)?.trim();
  const psn = localStorage.getItem(STORAGE_PSN_NPSSO_KEY)?.trim();
  const gogUser = localStorage.getItem(STORAGE_GOG_USER_KEY)?.trim();
  const gogToken = localStorage.getItem(STORAGE_GOG_TOKEN_KEY)?.trim();
  return Boolean(steam || psn || (gogUser && gogToken));
}

export interface QuickGamingSyncResult {
  success: boolean;
  noAccountsConfigured?: boolean;
  updatedMedia: MediaItem[];
  validSequels: SequelNotification[];
  updatedCount: number;
  newGamesCount: number;
  syncedServices: string[];
  message: string;
  errors?: string[];
}

const normalizeTitle = (str: string) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

export async function runQuickGamingSync(
  currentMedia: MediaItem[],
  unownedSequels: SequelNotification[]
): Promise<QuickGamingSyncResult> {
  if (typeof window === 'undefined') {
    return {
      success: false,
      updatedMedia: currentMedia,
      validSequels: unownedSequels,
      updatedCount: 0,
      newGamesCount: 0,
      syncedServices: [],
      message: 'Server-Umgebung, kein Browser-Storage vorhanden.',
    };
  }

  const steamInput = localStorage.getItem(STORAGE_STEAM_INPUT_KEY)?.trim();
  const psnNpsso = localStorage.getItem(STORAGE_PSN_NPSSO_KEY)?.trim();
  const gogUsername = localStorage.getItem(STORAGE_GOG_USER_KEY)?.trim();
  const gogToken = localStorage.getItem(STORAGE_GOG_TOKEN_KEY)?.trim();

  if (!steamInput && !psnNpsso && !gogToken) {
    return {
      success: false,
      noAccountsConfigured: true,
      updatedMedia: currentMedia,
      validSequels: unownedSequels,
      updatedCount: 0,
      newGamesCount: 0,
      syncedServices: [],
      message: 'Keine Gaming-Accounts (Steam, PSN, GOG) in den Einstellungen hinterlegt.',
    };
  }

  let workingMedia = [...currentMedia];
  let updatedCount = 0;
  let newGamesCount = 0;
  const syncedServices: string[] = [];
  const errors: string[] = [];

  // ================= 1. STEAM QUICK SYNC =================
  if (steamInput) {
    try {
      const res = await fetch('/api/sync/steam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-games', steamInput }),
      });

      if (res.ok) {
        const data = await res.json();
        const fetchedGames: any[] = data.games || [];
        if (fetchedGames.length > 0) {
          syncedServices.push('Steam');

          const existingGames = workingMedia.filter((m) => m.type === 'game');
          const matchedAppIds: number[] = [];
          const matches = existingGames.map((item) => {
            const isSteam = item.connectedService === 'steam' || item.external_id?.startsWith('steam:');
            const isUnconnected =
              !item.connectedService &&
              !item.gameConnection?.service &&
              !item.external_id?.startsWith('psn:') &&
              !item.external_id?.startsWith('gog:');

            let match: any = undefined;
            if (isSteam) {
              match = fetchedGames.find(
                (sg) =>
                  item.external_id === `steam:${sg.appid}` ||
                  item.gameConnection?.serviceId === String(sg.appid) ||
                  normalizeTitle(sg.name) === normalizeTitle(item.title)
              );
            } else if (isUnconnected) {
              match = fetchedGames.find(
                (sg) =>
                  item.external_id === `steam:${sg.appid}` ||
                  normalizeTitle(sg.name) === normalizeTitle(item.title)
              );
            }

            if (match) matchedAppIds.push(match.appid);
            return { item, match };
          });

          // Fetch achievements for matched games
          let achMap: Record<number, any> = {};
          if (matchedAppIds.length > 0) {
            try {
              const achRes = await fetch('/api/sync/steam', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'get-achievements',
                  steamInput,
                  appIds: matchedAppIds,
                }),
              });
              if (achRes.ok) {
                const achData = await achRes.json();
                achMap = achData.achievements || {};
              }
            } catch (achErr) {
              console.warn('Steam achievements fetch warning:', achErr);
            }
          }

          // Update existing Steam games (playtime, achievements, 100%)
          workingMedia = workingMedia.map((item) => {
            const pair = matches.find((m) => m.item.id === item.id);
            if (!pair || !pair.match) return item;

            const sg = pair.match;
            const ach = achMap[sg.appid];

            const currentPlaytime = item.gameTracker?.playtimeHours ?? item.progress.current;
            const currentAchCount = item.gameTracker?.achievements?.current ?? 0;
            const newPlaytime = sg.playtimeHours;
            const newAchCount = ach ? ach.current : currentAchCount;

            const hasPlaytimeIncreased = newPlaytime > currentPlaytime;
            if (newPlaytime !== currentPlaytime || (ach && newAchCount !== currentAchCount)) {
              updatedCount++;
            }

            return {
              ...item,
              external_id: item.external_id?.startsWith('steam:') ? item.external_id : `steam:${sg.appid}`,
              connectedService: 'steam' as const,
              gameConnection: {
                service: 'steam' as const,
                serviceId: String(sg.appid),
                serviceName: 'Steam',
                lastPlayed: sg.lastPlayed || (hasPlaytimeIncreased ? new Date().toISOString() : item.gameConnection?.lastPlayed),
              },
              progress: {
                ...item.progress,
                current: sg.playtimeHours,
                unit: 'hours' as const,
              },
              gameTracker: {
                ...(item.gameTracker || {}),
                playtimeHours: sg.playtimeHours,
                achievements: ach ? { current: ach.current, total: ach.total } : item.gameTracker?.achievements,
                completionist100: ach ? ach.completionist100 : item.gameTracker?.completionist100,
                allAchievementsCompleted: ach
                  ? ach.completionist100 || (ach.total > 0 && ach.current >= ach.total)
                  : item.gameTracker?.allAchievementsCompleted,
              },
              metacritic: item.metacritic || getMediaMetacriticScore(item) || undefined,
              updatedAt: new Date().toISOString(),
            };
          });

          // Identify and add new Steam games
          const matchedAppIdSet = new Set(matchedAppIds);
          const existingSteamTitles = new Set(
            workingMedia
              .filter((m) => m.type === 'game' && (m.connectedService === 'steam' || m.external_id?.startsWith('steam:')))
              .map((m) => normalizeTitle(m.title))
          );

          const newGamesToAdd = fetchedGames.filter((sg) => {
            if (matchedAppIdSet.has(sg.appid)) return false;
            if (existingSteamTitles.has(normalizeTitle(sg.name))) return false;
            if (isGameDeleted(`steam:${sg.appid}`, sg.name)) return false;
            return true;
          });

          for (const sg of newGamesToAdd) {
            newGamesCount++;
            const preset = getKnownGamePresets(sg.name);
            const score =
              getMediaMetacriticScore({
                title: sg.name,
                type: 'game',
                external_id: `steam:${sg.appid}`,
                gameConnection: { service: 'steam', serviceId: String(sg.appid) },
              } as any) || undefined;

            workingMedia.unshift({
              id: `media-steam-${sg.appid}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              title: sg.name,
              type: 'game',
              status: sg.playtimeHours > 0 ? 'in_progress' : 'planned',
              isOwned: true,
              coverUrl: sg.coverUrl,
              bannerUrl: sg.headerUrl,
              external_id: `steam:${sg.appid}`,
              connectedService: 'steam',
              gameConnection: {
                service: 'steam',
                serviceId: String(sg.appid),
                serviceName: 'Steam',
                lastPlayed: sg.lastPlayed,
              },
              summary: preset.summary || undefined,
              genres: preset.genres || ['Videospiel', 'PC'],
              creator: preset.creator || 'PC / Konsole',
              publisher: 'Steam',
              progress: { current: sg.playtimeHours, unit: 'hours' },
              gameTracker: { playtimeHours: sg.playtimeHours, storyCompleted: false, completionist100: false },
              metacritic: score,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        }
      }
    } catch (err: any) {
      errors.push(`Steam: ${err?.message || 'Verbindungsfehler'}`);
    }
  }

  // ================= 2. PLAYSTATION NETWORK QUICK SYNC =================
  if (psnNpsso) {
    try {
      const res = await fetch('/api/sync/psn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-games', npsso: psnNpsso }),
      });

      if (res.ok) {
        const data = await res.json();
        const fetchedGames: any[] = data.games || [];
        if (fetchedGames.length > 0) {
          syncedServices.push('PlayStation');

          const existingGames = workingMedia.filter((m) => m.type === 'game');
          const matchedIds: string[] = [];
          const matches = existingGames.map((item) => {
            const isPsn = item.connectedService === 'psn' || item.external_id?.startsWith('psn:');
            const isUnconnected =
              !item.connectedService &&
              !item.gameConnection?.service &&
              !item.external_id?.startsWith('steam:') &&
              !item.external_id?.startsWith('gog:');

            let match: any = undefined;
            if (isPsn) {
              match = fetchedGames.find(
                (pg) =>
                  item.external_id === pg.id ||
                  item.gameConnection?.serviceId === pg.id ||
                  normalizeTitle(pg.name) === normalizeTitle(item.title)
              );
            } else if (isUnconnected) {
              match = fetchedGames.find(
                (pg) =>
                  item.external_id === pg.id ||
                  normalizeTitle(pg.name) === normalizeTitle(item.title)
              );
            }

            if (match) matchedIds.push(match.id);
            return { item, match };
          });

          // Update existing PSN games
          workingMedia = workingMedia.map((item) => {
            const pair = matches.find((m) => m.item.id === item.id);
            if (!pair || !pair.match) return item;

            const pg = pair.match;
            const t = pg.trophies || {};

            const currentPlaytime = item.gameTracker?.playtimeHours ?? item.progress.current;
            const currentTrophies = item.gameTracker?.achievements?.current ?? 0;
            const newPlaytime = pg.playtimeHours;
            const newTrophies = t.current ?? 0;

            const hasPlaytimeIncreased = newPlaytime > currentPlaytime;
            if (newPlaytime !== currentPlaytime || newTrophies !== currentTrophies) {
              updatedCount++;
            }

            return {
              ...item,
              external_id: item.external_id?.startsWith('psn:') ? item.external_id : pg.id,
              connectedService: 'psn' as const,
              gameConnection: {
                service: 'psn' as const,
                serviceId: pg.id,
                serviceName: 'PlayStation Network',
                platform: pg.platform || item.gameConnection?.platform || 'PS5',
                lastPlayed: pg.lastPlayed || (hasPlaytimeIncreased ? new Date().toISOString() : item.gameConnection?.lastPlayed),
              },
              progress: {
                ...item.progress,
                current: pg.playtimeHours > 0 ? pg.playtimeHours : item.progress.current,
                unit: 'hours' as const,
              },
              gameTracker: {
                ...(item.gameTracker || {}),
                playtimeHours: pg.playtimeHours > 0 ? pg.playtimeHours : item.gameTracker?.playtimeHours,
                achievements: t.total > 0 ? { current: t.current, total: t.total } : item.gameTracker?.achievements,
                completionist100: t.completionist100,
                allAchievementsCompleted: t.completionist100 || (t.total > 0 && t.current >= t.total),
              },
              metacritic: item.metacritic || getMediaMetacriticScore(item) || undefined,
              updatedAt: new Date().toISOString(),
            };
          });

          // Identify and add new PSN games
          const matchedIdSet = new Set(matchedIds);
          const existingPsnTitles = new Set(
            workingMedia
              .filter((m) => m.type === 'game' && (m.connectedService === 'psn' || m.external_id?.startsWith('psn:')))
              .map((m) => normalizeTitle(m.title))
          );

          const newGamesToAdd = fetchedGames.filter((pg) => {
            if (matchedIdSet.has(pg.id)) return false;
            if (existingPsnTitles.has(normalizeTitle(pg.name))) return false;
            if (isGameDeleted(pg.id, pg.name)) return false;
            return true;
          });

          for (const pg of newGamesToAdd) {
            newGamesCount++;
            const preset = getKnownGamePresets(pg.name);
            const score =
              getMediaMetacriticScore({
                title: pg.name,
                type: 'game',
                external_id: pg.id,
                gameConnection: { service: 'psn', serviceId: pg.id },
              } as any) || undefined;

            workingMedia.unshift({
              id: `media-psn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              title: pg.name,
              type: 'game',
              status: pg.trophies?.completionist100 ? 'completed' : pg.playtimeHours > 0 ? 'in_progress' : 'planned',
              isOwned: true,
              coverUrl: pg.coverUrl || '',
              external_id: pg.id,
              connectedService: 'psn',
              gameConnection: {
                service: 'psn',
                serviceId: pg.id,
                serviceName: 'PlayStation Network',
                platform: pg.platform || 'PS5',
                lastPlayed: pg.lastPlayed,
              },
              summary: preset.summary || undefined,
              genres: preset.genres || ['Videospiel', pg.platform || 'PlayStation'],
              creator: preset.creator || 'PlayStation Studios',
              publisher: `PlayStation (${pg.platform || 'PS5'})`,
              progress: { current: pg.playtimeHours, unit: 'hours' },
              gameTracker: {
                playtimeHours: pg.playtimeHours,
                storyCompleted: pg.trophies?.completionist100,
                completionist100: pg.trophies?.completionist100,
                allAchievementsCompleted:
                  pg.trophies?.completionist100 || (pg.trophies?.total > 0 && pg.trophies?.current >= pg.trophies?.total),
                achievements:
                  pg.trophies?.total > 0 ? { current: pg.trophies.current, total: pg.trophies.total } : undefined,
              },
              metacritic: score,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        }
      }
    } catch (err: any) {
      errors.push(`PSN: ${err?.message || 'Verbindungsfehler'}`);
    }
  }

  // ================= 3. GOG GALAXY QUICK SYNC =================
  if (gogToken) {
    try {
      const res = await fetch('/api/sync/gog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-games', token: gogToken, username: gogUsername }),
      });

      if (res.ok) {
        const data = await res.json();
        const fetchedGames: any[] = data.games || [];
        if (fetchedGames.length > 0) {
          syncedServices.push('GOG');

          const existingGames = workingMedia.filter((m) => m.type === 'game');
          const matchedIds: string[] = [];
          const matches = existingGames.map((item) => {
            const isGog = item.connectedService === 'gog' || item.external_id?.startsWith('gog:');
            const isUnconnected =
              !item.connectedService &&
              !item.gameConnection?.service &&
              !item.external_id?.startsWith('steam:') &&
              !item.external_id?.startsWith('psn:');

            let match: any = undefined;
            if (isGog) {
              match = fetchedGames.find(
                (gg) =>
                  item.external_id === gg.id ||
                  item.gameConnection?.serviceId === String(gg.gameId) ||
                  normalizeTitle(gg.title) === normalizeTitle(item.title)
              );
            } else if (isUnconnected) {
              match = fetchedGames.find(
                (gg) =>
                  item.external_id === gg.id ||
                  normalizeTitle(gg.title) === normalizeTitle(item.title)
              );
            }

            if (match) matchedIds.push(String(match.id));
            return { item, match };
          });

          // Update existing GOG games
          workingMedia = workingMedia.map((item) => {
            const pair = matches.find((m) => m.item.id === item.id);
            if (!pair || !pair.match) return item;

            const gg = pair.match;
            const ach = gg.achievements;

            const currentPlaytime = item.gameTracker?.playtimeHours ?? item.progress.current;
            const currentAchCount = item.gameTracker?.achievements?.current ?? 0;
            const newPlaytime = gg.playtimeHours;
            const newAchCount = ach ? ach.current : currentAchCount;

            const hasPlaytimeIncreased = newPlaytime > currentPlaytime;
            if (newPlaytime !== currentPlaytime || (ach && newAchCount !== currentAchCount)) {
              updatedCount++;
            }

            return {
              ...item,
              external_id: item.external_id?.startsWith('gog:') ? item.external_id : gg.id,
              connectedService: 'gog' as const,
              gameConnection: {
                service: 'gog' as const,
                serviceId: String(gg.gameId),
                serviceName: 'GOG Galaxy',
                accountUsername: gogUsername,
                playtimeMinutes: gg.playtimeMinutes,
                lastPlayed: gg.lastPlayed || (hasPlaytimeIncreased ? new Date().toISOString() : item.gameConnection?.lastPlayed),
              },
              progress: {
                ...item.progress,
                current: gg.playtimeHours > 0 ? gg.playtimeHours : item.progress.current,
                unit: 'hours' as const,
              },
              gameTracker: {
                ...(item.gameTracker || {}),
                playtimeHours: gg.playtimeHours > 0 ? gg.playtimeHours : item.gameTracker?.playtimeHours,
                achievements: ach ? { current: ach.current, total: ach.total } : item.gameTracker?.achievements,
                completionist100: ach ? ach.completionist100 : item.gameTracker?.completionist100,
                allAchievementsCompleted: ach
                  ? ach.completionist100 || (ach.total > 0 && ach.current >= ach.total)
                  : item.gameTracker?.allAchievementsCompleted,
              },
              metacritic: item.metacritic || getMediaMetacriticScore(item) || undefined,
              updatedAt: new Date().toISOString(),
            };
          });

          // Identify and add new GOG games
          const matchedIdSet = new Set(matchedIds);
          const existingGogTitles = new Set(
            workingMedia
              .filter((m) => m.type === 'game' && (m.connectedService === 'gog' || m.external_id?.startsWith('gog:')))
              .map((m) => normalizeTitle(m.title))
          );

          const newGamesToAdd = fetchedGames.filter((gg) => {
            if (matchedIdSet.has(String(gg.id))) return false;
            if (existingGogTitles.has(normalizeTitle(gg.title))) return false;
            if (isGameDeleted(gg.id, gg.title)) return false;
            return true;
          });

          for (const gg of newGamesToAdd) {
            newGamesCount++;
            const preset = getKnownGamePresets(gg.title);
            const score =
              getMediaMetacriticScore({
                title: gg.title,
                type: 'game',
                external_id: gg.id,
                gameConnection: { service: 'gog', serviceId: String(gg.gameId) },
              } as any) || undefined;

            workingMedia.unshift({
              id: `media-gog-${gg.gameId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              title: gg.title,
              type: 'game',
              status: gg.achievements?.completionist100 ? 'completed' : gg.playtimeHours > 0 ? 'in_progress' : 'planned',
              isOwned: true,
              coverUrl: gg.coverUrl || '',
              external_id: gg.id,
              connectedService: 'gog',
              gameConnection: {
                service: 'gog',
                serviceId: String(gg.gameId),
                serviceName: 'GOG Galaxy',
                accountUsername: gogUsername,
                playtimeMinutes: gg.playtimeMinutes,
                lastPlayed: gg.lastPlayed,
              },
              summary: preset.summary || undefined,
              genres: preset.genres || ['Videospiel', 'PC'],
              creator: preset.creator || 'PC / DRM-frei',
              publisher: 'GOG.com',
              progress: { current: gg.playtimeHours, unit: 'hours' },
              gameTracker: {
                playtimeHours: gg.playtimeHours,
                storyCompleted: gg.achievements?.completionist100,
                completionist100: gg.achievements?.completionist100,
                allAchievementsCompleted:
                  gg.achievements?.completionist100 ||
                  (gg.achievements?.total > 0 && gg.achievements?.current >= gg.achievements?.total),
                achievements:
                  gg.achievements?.total > 0 ? { current: gg.achievements.current, total: gg.achievements.total } : undefined,
              },
              metacritic: score,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        }
      }
    } catch (err: any) {
      errors.push(`GOG: ${err?.message || 'Verbindungsfehler'}`);
    }
  }

  // Auto-prune any sequels now in library
  const validSequels = unownedSequels.filter((s) => !isSequelInLibrary(s, workingMedia) && !isSequelDismissed(s));

  // Save to persistent storage if changes occurred
  if (updatedCount > 0 || newGamesCount > 0) {
    saveStoredMedia(workingMedia);
    saveStoredSequels(validSequels);
  }

  // Build clean summary
  const parts: string[] = [];
  if (updatedCount > 0) {
    parts.push(`${updatedCount} Spielzeiten & Erfolge aktualisiert`);
  }
  if (newGamesCount > 0) {
    parts.push(`${newGamesCount} neue Spiele hinzugefügt`);
  }

  let message = '';
  if (parts.length > 0) {
    message = `Bibliotheken (${syncedServices.join(', ')}): ${parts.join(', ')}.`;
  } else if (syncedServices.length > 0) {
    message = `Alle Bibliotheken (${syncedServices.join(', ')}) sind bereits auf dem neuesten Stand.`;
  } else {
    message = 'Keine Daten von den Gaming-Plattformen erhalten.';
  }

  return {
    success: syncedServices.length > 0,
    updatedMedia: workingMedia,
    validSequels,
    updatedCount,
    newGamesCount,
    syncedServices,
    message,
    errors: errors.length > 0 ? errors : undefined,
  };
}
