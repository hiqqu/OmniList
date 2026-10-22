import { MediaItem } from '@/types/media';

/**
 * Normalizes title for Live-Service game detection
 */
export function normalizeLiveServiceTitle(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/\b(game of the year edition|goty|deluxe edition|definitive edition|remastered|enhanced edition|complete edition|director's cut|special edition|standard edition|gold edition)\b/gi, '')
    .replace(/\s*\(\d{4}\)/g, '')
    .replace(/[:\-_—–,.'!?/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * List of known Live-Service / Ongoing Multiplayer / Endless titles
 */
export const KNOWN_LIVE_SERVICE_TITLES: string[] = [
  'counter strike 2',
  'counter strike global offensive',
  'counter strike',
  'cs go',
  'cs2',
  'dead by daylight',
  'dota 2',
  'team fortress 2',
  'apex legends',
  'valorant',
  'league of legends',
  'overwatch 2',
  'overwatch',
  'tom clancy s rainbow six siege',
  'rainbow six siege',
  'rocket league',
  'rust',
  'warframe',
  'destiny 2',
  'pubg battlegrounds',
  'pubg',
  'sea of thieves',
  'helldivers 2',
  'palworld',
  'phasmophobia',
  'lethal company',
  'among us',
  'hunt showdown 1896',
  'hunt showdown',
  'deadlock',
  'marvel rivals',
  'the finals',
  'path of exile',
  'path of exile 2',
  'diablo iv',
  'diablo 4',
  'world of warcraft',
  'final fantasy xiv online',
  'final fantasy xiv',
  'the sims 4',
  'the sims',
  'garry s mod',
  'dayz',
  'escape from tarkov',
  'war thunder',
  'world of tanks',
  'smite',
  'smite 2',
  'brawlhalla',
  'fall guys',
  'fortnite',
  'genshin impact',
  'honkai star rail',
  'zenless zone zero',
  'squad',
  'hell let loose',
  'euro truck simulator 2',
  'forza horizon 5',
  'forza horizon 4',
  'enshrouded',
  'deep rock galactic',
  'payday 2',
  'payday 3',
  'don t starve together',
  'project zomboid',
  '7 days to die',
  'ark survival evolved',
  'ark survival ascended',
  'roblox',
  'minecraft',
  'world of warships',
  'crosshair x',
  'aimlabs',
  'aim lab',
  'vrchat',
  'the elder scrolls online',
  'guild wars 2',
  'black desert',
  'lost ark',
  'fallout 76',
  'conan exiles',
  'scum',
  'tarkov',
];

export const KNOWN_LIVE_SERVICE_TITLES_SET: Set<string> = new Set(KNOWN_LIVE_SERVICE_TITLES);

/**
 * Known Steam AppIDs of Live-Service games
 */
export const KNOWN_LIVE_SERVICE_APPIDS: Set<number> = new Set([
  730, // Counter-Strike 2
  381210, // Dead by Daylight
  570, // Dota 2
  440, // Team Fortress 2
  1172470, // Apex Legends
  2357570, // Overwatch 2
  359550, // Rainbow Six Siege
  252950, // Rocket League
  252490, // Rust
  230410, // Warframe
  1085660, // Destiny 2
  578080, // PUBG
  1172620, // Sea of Thieves
  553850, // Helldivers 2
  1623730, // Palworld
  739630, // Phasmophobia
  1966720, // Lethal Company
  945360, // Among Us
  594650, // Hunt: Showdown
  2073850, // The Finals
  238960, // Path of Exile
  2344520, // Diablo IV
  39210, // Final Fantasy XIV
  1222670, // The Sims 4
  4000, // Garry's Mod
  221100, // DayZ
  236390, // War Thunder
  1407200, // World of Tanks
  386360, // SMITE
  291550, // Brawlhalla
  1097150, // Fall Guys
  393380, // Squad
  686810, // Hell Let Loose
  227300, // Euro Truck Simulator 2
  1551360, // Forza Horizon 5
  1203630, // Enshrouded
  548430, // Deep Rock Galactic
  218620, // Payday 2
  1272080, // Payday 3
  322330, // Don't Starve Together
  108600, // Project Zomboid
  251570, // 7 Days to Die
  346110, // ARK: Survival Evolved
  2399830, // ARK: Survival Ascended
  438100, // VRChat
  306130, // The Elder Scrolls Online
  582660, // Black Desert
  1599340, // Lost Ark
  1151340, // Fallout 76
  440900, // Conan Exiles
]);

/**
 * Checks whether a given MediaItem is a Live-Service / Endless game
 */
export function isLiveServiceGame(item: MediaItem): boolean {
  if (item.type !== 'game') return false;

  // 1. Explicitly tagged on item
  if (item.isLiveService !== undefined) {
    return Boolean(item.isLiveService);
  }
  if (item.gameTracker?.isLiveService !== undefined) {
    return Boolean(item.gameTracker.isLiveService);
  }

  // 2. Steam AppID check
  if (item.external_id?.startsWith('steam:')) {
    const appid = parseInt(item.external_id.replace('steam:', ''), 10);
    if (!isNaN(appid) && KNOWN_LIVE_SERVICE_APPIDS.has(appid)) {
      return true;
    }
  }
  if (item.gameConnection?.service === 'steam' && item.gameConnection.serviceId) {
    const appid = parseInt(item.gameConnection.serviceId, 10);
    if (!isNaN(appid) && KNOWN_LIVE_SERVICE_APPIDS.has(appid)) {
      return true;
    }
  }

  // 3. Normalized title match
  const normTitle = normalizeLiveServiceTitle(item.title);
  if (normTitle && KNOWN_LIVE_SERVICE_TITLES_SET.has(normTitle)) {
    return true;
  }
  if (item.originalTitle) {
    const normOrig = normalizeLiveServiceTitle(item.originalTitle);
    if (normOrig && KNOWN_LIVE_SERVICE_TITLES_SET.has(normOrig)) {
      return true;
    }
  }

  // 4. Fuzzy title match (e.g. "Counter-Strike 2 (Test)" or "Dead by Daylight Gold")
  for (let i = 0; i < KNOWN_LIVE_SERVICE_TITLES.length; i++) {
    const known = KNOWN_LIVE_SERVICE_TITLES[i];
    if (normTitle.includes(known) || known.includes(normTitle)) {
      if (normTitle.length >= 6 && known.length >= 6) {
        return true;
      }
    }
  }

  // 5. Check genres / keywords
  if (item.genres && Array.isArray(item.genres)) {
    const lowerGenres = item.genres.map((g) => g.toLowerCase());
    if (
      lowerGenres.some(
        (g) =>
          g.includes('live service') ||
          g.includes('mmo') ||
          g.includes('battle royale') ||
          g.includes('multiplayer only')
      )
    ) {
      return true;
    }
  }

  return false;
}
