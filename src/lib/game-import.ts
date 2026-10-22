import { MediaItem, ConnectedGameService, GameConnectionInfo } from '@/types/media';
import { getMediaCoverFallback } from './book-cover';

export interface RawImportedGame {
  title: string;
  service: ConnectedGameService;
  serviceId?: string;
  coverUrl?: string;
  playtimeHours?: number;
  playtimeMinutes?: number;
  lastPlayed?: string;
  storyCompleted?: boolean;
  completionist100?: boolean;
  allAchievementsCompleted?: boolean;
  achievements?: {
    current: number;
    total: number;
  };
  genres?: string[];
  creator?: string;
  publisher?: string;
  releaseDate?: string;
  summary?: string;
}

export interface ReplacedDuplicateInfo {
  newTitle: string;
  replacedTitle: string;
  oldId: string;
  newId: string;
  service: ConnectedGameService;
  serviceName: string;
  playtimeHours: number;
}

export interface ImportResult {
  updatedMedia: MediaItem[];
  addedCount: number;
  replacedDuplicatesCount: number;
  updatedExistingCount: number;
  replacedGames: ReplacedDuplicateInfo[];
  newlyAddedTitles: string[];
}

/**
 * Normalizes game titles for fuzzy and robust duplicate matching
 * Handles subtitles, editions, punctuation, casing and extra whitespace
 */
export function normalizeGameTitle(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/\b(game of the year edition|goty|deluxe edition|definitive edition|remastered|enhanced edition|complete edition|director's cut|special edition|standard edition)\b/gi, '')
    .replace(/\s*\(\d{4}\)/g, '') // remove year e.g. (2018)
    .replace(/[:\-_—–,.'!?/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if two games match by external ID or normalized title
 */
export function areGamesMatching(
  gameA: { title: string; external_id?: string; connectedService?: string },
  gameB: { title: string; external_id?: string; connectedService?: string }
): boolean {
  // If both games have explicit connected services and they are different, they are distinct platform releases
  const getService = (g: { external_id?: string; connectedService?: string }) => {
    if (g.connectedService) return g.connectedService;
    if (g.external_id?.startsWith('steam:')) return 'steam';
    if (g.external_id?.startsWith('psn:')) return 'psn';
    if (g.external_id?.startsWith('gog:')) return 'gog';
    return null;
  };
  const sA = getService(gameA);
  const sB = getService(gameB);
  if (sA && sB && sA !== sB) {
    return false;
  }

  // 1. Direct external ID match
  if (gameA.external_id && gameB.external_id && gameA.external_id === gameB.external_id) {
    return true;
  }

  // Check if both have matching rawg or steam ID
  if (
    gameA.external_id &&
    gameB.external_id &&
    gameA.external_id.startsWith('steam:') &&
    gameB.external_id.startsWith('steam:') &&
    gameA.external_id === gameB.external_id
  ) {
    return true;
  }

  const normA = normalizeGameTitle(gameA.title);
  const normB = normalizeGameTitle(gameB.title);

  if (!normA || !normB) return false;
  if (normA === normB) return true;

  // Subtitle / prefix match (e.g. "The Witcher 3" matches "The Witcher 3 Wild Hunt")
  if (normA.length >= 6 && normB.length >= 6) {
    if (normA.startsWith(normB) || normB.startsWith(normA)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks whether an existing library game is already connected to an external service (Steam, PSN, GOG)
 * If false, this is an unconnected entry that should be replaced when a connected duplicate is imported.
 */
export function isGameConnected(item: MediaItem): boolean {
  if (item.connectedService) return true;
  if (item.gameConnection && item.gameConnection.service) return true;
  if (
    item.external_id?.startsWith('steam:') ||
    item.external_id?.startsWith('psn:') ||
    item.external_id?.startsWith('gog:')
  ) {
    return true;
  }
  return false;
}

/**
 * Resolves the connected platform/service of a media item ('steam' | 'psn' | 'gog' | null)
 */
export function getItemPlatform(item: MediaItem): ConnectedGameService | null {
  if (item.connectedService) return item.connectedService;
  if (item.gameConnection?.service) return item.gameConnection.service;
  if (item.external_id?.startsWith('steam:')) return 'steam';
  if (item.external_id?.startsWith('psn:')) return 'psn';
  if (item.external_id?.startsWith('gog:')) return 'gog';
  if (item.publisher?.toLowerCase() === 'steam') return 'steam';
  return null;
}

export type GalaxyPlatformFilter = 'steam' | 'psn' | 'gog' | 'epic' | 'other';

/**
 * Resolves full platform category matching GOG Galaxy filter options:
 * 'steam' | 'psn' | 'gog' | 'epic' | 'other'
 */
export function resolveGamePlatform(item: MediaItem): GalaxyPlatformFilter {
  const service = getItemPlatform(item);
  if (service) return service;

  const ext = (item.external_id || '').toLowerCase();
  const pub = (item.publisher || '').toLowerCase();

  if (ext.startsWith('epic:') || pub.includes('epic')) return 'epic';
  if (pub === 'steam') return 'steam';
  if (pub.includes('playstation')) return 'psn';
  if (pub.includes('gog')) return 'gog';

  return 'other';
}

/**
 * Resolves OS & console category matching GOG Galaxy filter options:
 * 'PS5' | 'PS4' | 'PS3' | 'PC' | 'other'
 */
export function resolveGameConsole(item: MediaItem): 'PS5' | 'PS4' | 'PS3' | 'PC' | 'other' {
  const badgeInfo = getGamePlatformBadgeInfo(item);
  if (badgeInfo?.label) {
    const lbl = badgeInfo.label.toUpperCase();
    if (lbl.includes('PS5')) return 'PS5';
    if (lbl.includes('PS4')) return 'PS4';
    if (lbl.includes('PS3')) return 'PS3';
  }

  const p = resolveGamePlatform(item);
  if (p === 'steam' || p === 'gog' || p === 'epic') return 'PC';
  if (p === 'psn') return 'PS5';

  const title = (item.title || '').toUpperCase();
  if (title.includes('(PS5)')) return 'PS5';
  if (title.includes('(PS4)')) return 'PS4';
  if (title.includes('(PS3)')) return 'PS3';
  if (title.includes('(PC)')) return 'PC';

  return 'other';
}

export interface GamePlatformBadgeInfo {
  label: string;
  service: ConnectedGameService;
  bgClass: string;
  colorClass: string;
  borderClass: string;
  tooltip: string;
}

/**
 * Returns badge info for a game's platform/console.
 * For PlayStation, extracts and displays the actual console (e.g. 'PS5', 'PS4', 'PS3', 'PS Vita') instead of generic 'PSN'.
 */
export function getGamePlatformBadgeInfo(item: MediaItem): GamePlatformBadgeInfo | null {
  const service = getItemPlatform(item);
  if (!service) return null;

  if (service === 'psn') {
    let consoleName = item.gameConnection?.platform;
    if (!consoleName && item.publisher) {
      const match = item.publisher.match(/PlayStation\s*\(([^)]+)\)/i);
      if (match && match[1]) {
        consoleName = match[1].trim();
      }
    }
    if (!consoleName && item.title) {
      const match = item.title.match(/\((PS5|PS4|PS3|PS Vita|PSP)\)/i);
      if (match && match[1]) {
        consoleName = match[1].toUpperCase();
      }
    }
    if (!consoleName) {
      consoleName = 'PS5';
    }

    return {
      label: consoleName,
      service: 'psn',
      bgClass: 'bg-blue-500/15',
      colorClass: 'text-blue-300',
      borderClass: 'border-blue-500/30',
      tooltip: `Plattform: ${consoleName} (PlayStation)`,
    };
  }

  if (service === 'steam') {
    return {
      label: 'Steam',
      service: 'steam',
      bgClass: 'bg-sky-500/15',
      colorClass: 'text-sky-300',
      borderClass: 'border-sky-500/30',
      tooltip: 'Verknüpft mit Steam',
    };
  }

  if (service === 'gog') {
    return {
      label: 'GOG',
      service: 'gog',
      bgClass: 'bg-purple-500/15',
      colorClass: 'text-purple-300',
      borderClass: 'border-purple-500/30',
      tooltip: 'Verknüpft mit GOG Galaxy',
    };
  }

  return null;
}

/**
 * Core deduplication and replacement engine:
 * If an imported game from Steam, PSN, or GOG matches an existing game in the library
 * that is NOT connected, the unconnected game is removed and replaced in-place by the new connected entry!
 * User personal ratings and notes from the unconnected game are preserved.
 */
export function importGamesWithDeduplication(
  currentMedia: MediaItem[],
  incomingGames: RawImportedGame[],
  accountUsername?: string
): ImportResult {
  const resultList: MediaItem[] = [...currentMedia];
  let addedCount = 0;
  let replacedDuplicatesCount = 0;
  let updatedExistingCount = 0;
  const replacedGames: ReplacedDuplicateInfo[] = [];
  const newlyAddedTitles: string[] = [];

  for (const incoming of incomingGames) {
    const playtimeHrs =
      incoming.playtimeHours ??
      (incoming.playtimeMinutes ? Math.round((incoming.playtimeMinutes / 60) * 10) / 10 : 0);

    const serviceName =
      incoming.service === 'steam'
        ? 'Steam'
        : incoming.service === 'psn'
        ? 'PlayStation Network'
        : 'GOG Galaxy';

    const externalId = incoming.serviceId
      ? `${incoming.service}:${incoming.serviceId}`
      : `${incoming.service}:${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // 1. Search for matching existing game in library
    const existingIndex = resultList.findIndex(
      (m) => m.type === 'game' && areGamesMatching(m, { title: incoming.title, external_id: externalId, connectedService: incoming.service })
    );

    if (existingIndex !== -1) {
      const existing = resultList[existingIndex];
      const existingIsConnected = isGameConnected(existing);

      if (!existingIsConnected) {
        // Unconnected duplicate found: replace in-place!
        // Preserves user notes, personal star rating and custom status if user set it
        const newId = `game-${incoming.service}-${incoming.serviceId || Date.now()}`;
        const mergedItem: MediaItem = {
          ...existing,
          id: newId,
          title: incoming.title || existing.title,
          coverUrl: incoming.coverUrl || existing.coverUrl,
          creator: incoming.creator || existing.creator,
          publisher: incoming.publisher || existing.publisher,
          genres: incoming.genres && incoming.genres.length > 0 ? incoming.genres : existing.genres,
          summary: incoming.summary || existing.summary,
          external_id: externalId,
          isOwned: true,
          connectedService: incoming.service,
          gameConnection: {
            service: incoming.service,
            serviceId: incoming.serviceId,
            serviceName,
            playtimeMinutes: incoming.playtimeMinutes || Math.round(playtimeHrs * 60),
            lastPlayed: incoming.lastPlayed,
            connectedAt: new Date().toISOString(),
            accountUsername,
          },
          progress: {
            ...existing.progress,
            current: playtimeHrs > 0 ? playtimeHrs : existing.progress.current,
            unit: 'hours',
          },
          gameTracker: {
            ...(existing.gameTracker || {}),
            playtimeHours:
              playtimeHrs > 0
                ? playtimeHrs
                : existing.gameTracker?.playtimeHours ?? existing.progress.current,
            storyCompleted: incoming.storyCompleted ?? existing.gameTracker?.storyCompleted,
            completionist100: incoming.completionist100 ?? existing.gameTracker?.completionist100,
            allAchievementsCompleted:
              incoming.allAchievementsCompleted ?? existing.gameTracker?.allAchievementsCompleted,
            achievements: incoming.achievements ?? existing.gameTracker?.achievements,
          },
          updatedAt: new Date().toISOString(),
        };

        // Replace unconnected item at its exact position
        resultList[existingIndex] = mergedItem;
        replacedDuplicatesCount++;
        replacedGames.push({
          newTitle: incoming.title,
          replacedTitle: existing.title,
          oldId: existing.id,
          newId: mergedItem.id,
          service: incoming.service,
          serviceName,
          playtimeHours: playtimeHrs,
        });
      } else {
        // Already connected: update playtime and achievements if newer
        const updatedItem: MediaItem = {
          ...existing,
          isOwned: true,
          progress: {
            ...existing.progress,
            current:
              playtimeHrs > (existing.progress.current || 0)
                ? playtimeHrs
                : existing.progress.current,
          },
          gameTracker: {
            ...(existing.gameTracker || {}),
            playtimeHours:
              playtimeHrs > (existing.gameTracker?.playtimeHours || 0)
                ? playtimeHrs
                : existing.gameTracker?.playtimeHours,
            storyCompleted: existing.gameTracker?.storyCompleted || incoming.storyCompleted,
            completionist100: existing.gameTracker?.completionist100 || incoming.completionist100,
            allAchievementsCompleted:
              existing.gameTracker?.allAchievementsCompleted || incoming.allAchievementsCompleted,
          },
          gameConnection: {
            ...(existing.gameConnection || {}),
            service: existing.gameConnection?.service || incoming.service,
            serviceName: existing.gameConnection?.serviceName || serviceName,
            playtimeMinutes: incoming.playtimeMinutes || Math.round(playtimeHrs * 60),
            lastPlayed: incoming.lastPlayed || existing.gameConnection?.lastPlayed,
            accountUsername: accountUsername || existing.gameConnection?.accountUsername,
          },
          updatedAt: new Date().toISOString(),
        };
        resultList[existingIndex] = updatedItem;
        updatedExistingCount++;
      }
    } else {
      // New game: add to library
      const newItem: MediaItem = {
        id: `game-${incoming.service}-${incoming.serviceId || Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: incoming.title,
        type: 'game',
        status:
          incoming.completionist100 || incoming.allAchievementsCompleted
            ? 'completed'
            : playtimeHrs > 0
            ? 'in_progress'
            : 'planned',
        isOwned: true,
        coverUrl: incoming.coverUrl || getMediaCoverFallback({ title: incoming.title, type: 'game' } as any),
        creator: incoming.creator,
        publisher: incoming.publisher,
        genres: incoming.genres || ['Videospiel'],
        summary: incoming.summary,
        releaseDate: incoming.releaseDate,
        external_id: externalId,
        connectedService: incoming.service,
        gameConnection: {
          service: incoming.service,
          serviceId: incoming.serviceId,
          serviceName,
          playtimeMinutes: incoming.playtimeMinutes || Math.round(playtimeHrs * 60),
          lastPlayed: incoming.lastPlayed,
          connectedAt: new Date().toISOString(),
          accountUsername,
        },
        progress: {
          current: playtimeHrs,
          unit: 'hours',
        },
        gameTracker: {
          playtimeHours: playtimeHrs,
          storyCompleted: incoming.storyCompleted,
          completionist100: incoming.completionist100,
          allAchievementsCompleted: incoming.allAchievementsCompleted,
          achievements: incoming.achievements,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      resultList.unshift(newItem);
      addedCount++;
      newlyAddedTitles.push(incoming.title);
    }
  }

  return {
    updatedMedia: resultList,
    addedCount,
    replacedDuplicatesCount,
    updatedExistingCount,
    replacedGames,
    newlyAddedTitles,
  };
}

/**
 * Preset catalogs with authentic covers, playtime and achievements
 * Enables one-click testing of library import and duplicate replacement
 */
export const PRESET_STEAM_LIBRARY: RawImportedGame[] = [
  {
    title: 'The Witcher 3: Wild Hunt',
    service: 'steam',
    serviceId: '292030',
    coverUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
    playtimeHours: 142.5,
    storyCompleted: true,
    completionist100: true,
    allAchievementsCompleted: true,
    achievements: { current: 78, total: 78 },
    creator: 'CD PROJEKT RED',
    publisher: 'CD PROJEKT RED',
    genres: ['Open World', 'RPG', 'Story'],
    releaseDate: '2015-05-18',
    summary: 'Als Hexer Geralt von Riva durchreist du vom Krieg verwüstete Länder auf der Suche nach dem Kind der Prophezeiung.',
  },
  {
    title: 'Cyberpunk 2077',
    service: 'steam',
    serviceId: '1091500',
    coverUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=600&q=80',
    playtimeHours: 86.4,
    storyCompleted: true,
    completionist100: false,
    allAchievementsCompleted: false,
    achievements: { current: 34, total: 44 },
    creator: 'CD PROJEKT RED',
    publisher: 'CD PROJEKT RED',
    genres: ['Cyberpunk', 'Open World', 'Action RPG'],
    releaseDate: '2020-12-10',
    summary: 'Ein Open-World-Action-Adventure in Night City, einer von Macht und Körpermodifikationen besessenen Megacity.',
  },
  {
    title: 'Elden Ring',
    service: 'steam',
    serviceId: '1245620',
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    playtimeHours: 120.0,
    storyCompleted: true,
    completionist100: true,
    allAchievementsCompleted: true,
    achievements: { current: 42, total: 42 },
    creator: 'FromSoftware Inc.',
    publisher: 'Bandai Namco Entertainment',
    genres: ['Souls-like', 'Dark Fantasy', 'Open World'],
    releaseDate: '2022-02-25',
    summary: 'Erhebe dich, Befleckter, und werde zum Eldenfürsten im Zwischenland.',
  },
  {
    title: 'Baldur\'s Gate 3',
    service: 'steam',
    serviceId: '1086940',
    coverUrl: 'https://images.unsplash.com/photo-1612287233207-6c2e39fc734a?auto=format&fit=crop&w=600&q=80',
    playtimeHours: 154.2,
    storyCompleted: true,
    completionist100: false,
    allAchievementsCompleted: false,
    achievements: { current: 38, total: 53 },
    creator: 'Larian Studios',
    publisher: 'Larian Studios',
    genres: ['CRPG', 'D&D', 'Rundenbasiert'],
    releaseDate: '2023-08-03',
    summary: 'Stelle deine Gefährten zusammen und kehre in die Vergessenen Reiche zurück.',
  },
  {
    title: 'Hades',
    service: 'steam',
    serviceId: '1145360',
    coverUrl: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=600&q=80',
    playtimeHours: 64.8,
    storyCompleted: true,
    completionist100: true,
    allAchievementsCompleted: true,
    achievements: { current: 49, total: 49 },
    creator: 'Supergiant Games',
    publisher: 'Supergiant Games',
    genres: ['Rogue-like', 'Action', 'Griechische Mythologie'],
    releaseDate: '2020-09-17',
    summary: 'Trotze dem Gott der Toten und erkämpfe dir deinen Weg aus der Unterwelt der griechischen Mythologie.',
  },
  {
    title: 'Batman: Arkham City',
    service: 'steam',
    serviceId: '200260',
    coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    playtimeHours: 38.5,
    storyCompleted: true,
    completionist100: false,
    allAchievementsCompleted: false,
    achievements: { current: 45, total: 64 },
    creator: 'Rocksteady Studios',
    publisher: 'Warner Bros. Games',
    genres: ['Action', 'Open World', 'Superheld'],
    releaseDate: '2011-10-18',
    summary: 'Arkham City baut auf der intensiven Atmosphäre von Arkham Asylum auf und schickt Batman in ein riesiges Gefängnisviertel.',
  },
];

export const PRESET_PSN_LIBRARY: RawImportedGame[] = [
  {
    title: 'Bloodborne',
    service: 'psn',
    serviceId: 'CUSA00207',
    coverUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
    playtimeHours: 92.0,
    storyCompleted: true,
    completionist100: true,
    allAchievementsCompleted: true,
    achievements: { current: 40, total: 40 },
    creator: 'FromSoftware / Japan Studio',
    publisher: 'Sony Interactive Entertainment',
    genres: ['Action RPG', 'Gothic Horror', 'Souls-like'],
    releaseDate: '2015-03-24',
    summary: 'Ein düsteres Action-Rollenspiel voller unerbittlicher Gefahren in der verfallenen Stadt Yharnam.',
  },
  {
    title: 'God of War Ragnarök',
    service: 'psn',
    serviceId: 'CUSA34384',
    coverUrl: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=600&q=80',
    playtimeHours: 54.0,
    storyCompleted: true,
    completionist100: true,
    allAchievementsCompleted: true,
    achievements: { current: 36, total: 36 },
    creator: 'Santa Monica Studio',
    publisher: 'Sony Interactive Entertainment',
    genres: ['Action Adventure', 'Nordische Mythologie'],
    releaseDate: '2022-11-09',
    summary: 'Kratos und Atreus begeben sich auf eine mythische Reise durch alle neun Reiche.',
  },
  {
    title: 'The Last of Us Part I',
    service: 'psn',
    serviceId: 'PPSA03396',
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    playtimeHours: 22.5,
    storyCompleted: true,
    completionist100: false,
    allAchievementsCompleted: false,
    achievements: { current: 24, total: 29 },
    creator: 'Naughty Dog',
    publisher: 'Sony Interactive Entertainment',
    genres: ['Story-Driven', 'Survival Action'],
    releaseDate: '2022-09-02',
    summary: 'Erlebe die emotionale Erzählung und die unvergesslichen Charaktere von Joel und Ellie.',
  },
  {
    title: 'Marvel\'s Spider-Man 2',
    service: 'psn',
    serviceId: 'PPSA02685',
    coverUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=600&q=80',
    playtimeHours: 32.0,
    storyCompleted: true,
    completionist100: true,
    allAchievementsCompleted: true,
    achievements: { current: 42, total: 42 },
    creator: 'Insomniac Games',
    publisher: 'Sony Interactive Entertainment',
    genres: ['Action', 'Open World', 'Superheld'],
    releaseDate: '2023-10-20',
    summary: 'Die Spider-Men Peter Parker und Miles Morales stellen sich ihrer bisher größten Prüfung.',
  },
];

export const PRESET_GOG_LIBRARY: RawImportedGame[] = [
  {
    title: 'Cyberpunk 2077',
    service: 'gog',
    serviceId: '1423049311',
    coverUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=600&q=80',
    playtimeHours: 110.0,
    storyCompleted: true,
    completionist100: false,
    allAchievementsCompleted: false,
    creator: 'CD PROJEKT RED',
    publisher: 'CD PROJEKT RED',
    genres: ['RPG', 'Open World', 'DRM-frei'],
    releaseDate: '2020-12-10',
    summary: 'DRM-freie GOG Galaxy Version von Cyberpunk 2077.',
  },
  {
    title: 'The Witcher 3: Wild Hunt',
    service: 'gog',
    serviceId: '1207658924',
    coverUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
    playtimeHours: 180.0,
    storyCompleted: true,
    completionist100: true,
    allAchievementsCompleted: true,
    creator: 'CD PROJEKT RED',
    publisher: 'CD PROJEKT RED',
    genres: ['RPG', 'Open World', 'DRM-frei'],
    releaseDate: '2015-05-18',
    summary: 'DRM-freie GOG Galaxy Version von The Witcher 3.',
  },
  {
    title: 'Heroes of Might and Magic 3: Complete',
    service: 'gog',
    serviceId: '1207658787',
    coverUrl: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=600&q=80',
    playtimeHours: 240.0,
    storyCompleted: true,
    completionist100: true,
    creator: 'New World Computing',
    publisher: 'Ubisoft',
    genres: ['Turn-based Strategy', 'Fantasy', 'Klassiker'],
    releaseDate: '1999-02-28',
    summary: 'Das legendäre Rundenstrategiespiel mit allen Erweiterungen auf GOG.',
  },
  {
    title: 'Disco Elysium - The Final Cut',
    service: 'gog',
    serviceId: '1596791834',
    coverUrl: 'https://images.unsplash.com/photo-1612287233207-6c2e39fc734a?auto=format&fit=crop&w=600&q=80',
    playtimeHours: 42.0,
    storyCompleted: true,
    completionist100: false,
    creator: 'ZA/UM',
    publisher: 'ZA/UM',
    genres: ['CRPG', 'Detektiv', 'Story'],
    releaseDate: '2019-10-15',
    summary: 'Ein bahnbrechendes Rollenspiel über einen Detektiv mit einem einzigartigen Fähigkeitssystem.',
  },
];

/**
 * Parses JSON or CSV content from Steam, PSN or GOG Galaxy export
 */
export function parseExportedGameFile(
  content: string,
  service: ConnectedGameService
): RawImportedGame[] {
  const games: RawImportedGame[] = [];
  const trimmed = content.trim();

  // Try JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      let list: any[] = [];

      if (Array.isArray(parsed)) {
        list = parsed;
      } else if (parsed.response?.games && Array.isArray(parsed.response.games)) {
        // Steam Web API GetOwnedGames response format
        list = parsed.response.games.map((g: any) => ({
          title: g.name || `App ${g.appid}`,
          service: 'steam' as ConnectedGameService,
          serviceId: String(g.appid),
          playtimeMinutes: g.playtime_forever || 0,
          playtimeHours: g.playtime_forever ? Math.round((g.playtime_forever / 60) * 10) / 10 : 0,
          coverUrl: g.img_icon_url
            ? `https://media.steampowered.com/steamcommunity/public/images/apps/${g.appid}/${g.img_icon_url}.jpg`
            : undefined,
        }));
      } else if (parsed.games && Array.isArray(parsed.games)) {
        list = parsed.games;
      }

      for (const item of list) {
        if (item.title || item.name) {
          const title = (item.title || item.name).trim();
          games.push({
            title,
            service,
            serviceId: String(item.serviceId || item.id || item.appid || ''),
            coverUrl: item.coverUrl || item.image || item.cover,
            playtimeHours: Number(item.playtimeHours || (item.playtimeMinutes ? item.playtimeMinutes / 60 : 0)) || undefined,
            playtimeMinutes: Number(item.playtimeMinutes || (item.playtimeHours ? item.playtimeHours * 60 : 0)) || undefined,
            storyCompleted: Boolean(item.storyCompleted),
            completionist100: Boolean(item.completionist100),
            allAchievementsCompleted: Boolean(item.allAchievementsCompleted),
            genres: Array.isArray(item.genres) ? item.genres : undefined,
            creator: item.creator || item.developer,
            publisher: item.publisher,
            releaseDate: item.releaseDate,
            summary: item.summary,
          });
        }
      }
      return games;
    } catch {
      // JSON parse failed, try CSV fallback below
    }
  }

  // Fallback: CSV parser (one game per line, e.g. "Title,Playtime,AppId")
  const lines = trimmed.split(/\r?\n/).filter(Boolean);
  for (const line of lines) {
    const parts = line.split(',').map((p) => p.replace(/^["']|["']$/g, '').trim());
    if (parts.length > 0 && parts[0] && !parts[0].toLowerCase().startsWith('title')) {
      const title = parts[0];
      const playtime = parts[1] ? parseFloat(parts[1]) : undefined;
      const serviceId = parts[2] || undefined;
      games.push({
        title,
        service,
        serviceId,
        playtimeHours: !isNaN(playtime as number) ? playtime : undefined,
      });
    }
  }

  return games;
}
