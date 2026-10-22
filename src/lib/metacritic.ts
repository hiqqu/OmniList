import { MediaItem } from '@/types/media';

/**
 * Normalizes title for fuzzy Metacritic matching
 */
export function normalizeMetacriticKey(title: string): string {
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
 * Curated Metacritic scores for popular games, movies, and series
 */
export const KNOWN_METACRITIC: Record<string, number> = {
  // Games
  'dead by daylight': 71,
  'the witcher 3 wild hunt': 92,
  'witcher 3': 92,
  'cyberpunk 2077': 86,
  'elden ring': 96,
  'baldur s gate 3': 96,
  'baldurs gate 3': 96,
  'grand theft auto v': 97,
  'gta 5': 97,
  'gta v': 97,
  'red dead redemption 2': 97,
  'rdr2': 97,
  'hollow knight': 87,
  'god of war': 94,
  'god of war ragnarok': 94,
  'the last of us': 95,
  'the last of us part i': 95,
  'the last of us part 1': 95,
  'the last of us part ii': 93,
  'the last of us part 2': 93,
  'half life 2': 96,
  'half life alyx': 93,
  'half life': 96,
  'portal 2': 95,
  'portal': 90,
  'counter strike 2': 83,
  'counter strike global offensive': 83,
  'cs go': 83,
  'dota 2': 90,
  'left 4 dead 2': 89,
  'left 4 dead': 89,
  'team fortress 2': 92,
  'terraria': 83,
  'stardew valley': 89,
  'hades': 93,
  'hades ii': 90,
  'hades 2': 90,
  'monster hunter world': 90,
  'monster hunter wilds': 88,
  'resident evil 4': 93,
  'resident evil village': 84,
  'resident evil 2': 91,
  'resident evil 7 biohazard': 86,
  'sekiro shadows die twice': 90,
  'sekiro': 90,
  'dark souls': 89,
  'dark souls remastered': 84,
  'dark souls ii': 91,
  'dark souls 2': 91,
  'dark souls iii': 89,
  'dark souls 3': 89,
  'bloodborne': 92,
  'demon s souls': 92,
  'fallout 4': 84,
  'fallout new vegas': 84,
  'the elder scrolls v skyrim': 94,
  'skyrim': 94,
  'the elder scrolls iv oblivion': 94,
  'black myth wukong': 81,
  'helldivers 2': 82,
  'palworld': 76,
  'apex legends': 88,
  'rust': 69,
  'destiny 2': 83,
  'warframe': 69,
  'tom clancy s rainbow six siege': 79,
  'rainbow six siege': 79,
  'pubg battlegrounds': 77,
  'pubg': 77,
  'rocket league': 86,
  'sea of thieves': 69,
  'phasmophobia': 78,
  'lethal company': 82,
  'among us': 85,
  'valheim': 85,
  'deep rock galactic': 85,
  'slay the spire': 89,
  'balatro': 90,
  'satisfactory': 90,
  'factorio': 90,
  'rimworld': 87,
  'manor lords': 85,
  'sons of the forest': 78,
  'the forest': 83,
  '7 days to die': 75,
  'euro truck simulator 2': 79,
  'forza horizon 5': 92,
  'forza horizon 4': 92,
  'starfield': 83,
  'diablo iv': 86,
  'diablo 4': 86,
  'diablo ii resurrected': 80,
  'persona 5 royal': 95,
  'persona 3 reload': 87,
  'persona 4 golden': 93,
  'final fantasy vii remake': 87,
  'final fantasy vii rebirth': 92,
  'final fantasy xvi': 87,
  'final fantasy 16': 87,
  'final fantasy xiv online': 92,
  'the legend of zelda breath of the wild': 97,
  'zelda breath of the wild': 97,
  'the legend of zelda tears of the kingdom': 96,
  'zelda tears of the kingdom': 96,
  'super mario odyssey': 97,
  'metroid prime remastered': 94,
  'armored core vi fires of rubicon': 86,
  'lies of p': 80,
  'alan wake 2': 89,
  'alan wake': 83,
  'control': 82,
  'death stranding': 82,
  'horizon zero dawn': 89,
  'horizon forbidden west': 88,
  'ghost of tsushima': 83,
  'marvel s spider man': 87,
  'spider man remastered': 87,
  'marvel s spider man 2': 90,
  'spider man 2': 90,
  'subnautica': 87,
  'celeste': 92,
  'disco elysium': 97,
  'no man s sky': 77,
  'ark survival evolved': 70,
  'dayz': 70,
  'path of exile': 86,
  'the binding of isaac rebirth': 86,
  'cuphead': 88,
  'dave the diver': 90,
  'vampire survivors': 86,
  'kingdom come deliverance': 76,
  'kingdom come deliverance ii': 88,
  'mass effect legendary edition': 90,
  'bioshock infinite': 94,
  'bioshock': 96,
  'batman arkham city': 96,
  'batman arkham knight': 87,
  'batman arkham asylum': 91,
  'doom eternal': 88,
  'doom': 85,
  'dishonored': 91,
  'dishonored 2': 86,
  'prey': 79,
  'nier automata': 88,
  'hitman 3': 87,
  'hitman world of assassination': 87,
  'it takes two': 89,
  'outer wilds': 85,
  'ori and the will of the wisps': 90,
  'ori and the blind forest': 88,
  'dead cells': 89,
  'tunic': 85,
  'returnal': 86,
  'stray': 83,
  'ghostrunner': 81,
  'remnant ii': 80,
  'remnant 2': 80,
  'payday 2': 79,
  'garry s mod': 80,
  'don t starve together': 79,
  'don t starve': 79,
  'project zomboid': 80,
  'hunt showdown 1896': 81,
  'hunt showdown': 81,
  'warhammer 40000 space marine 2': 82,
  'space marine 2': 82,
  'warhammer vermintide 2': 82,
  'total war warhammer iii': 85,
  'mount blade ii bannerlord': 77,
  'squad': 80,
  'hell let loose': 79,
  'enshrouded': 80,
  'the sims 4': 70,
  'overwatch 2': 79,
  'sid meier s civilization vi': 88,
  'civilization vi': 88,
  'assassin s creed valhalla': 80,
  'assassin s creed odyssey': 83,
  'assassin s creed origins': 81,
  'dragon s dogma 2': 86,
  'like a dragon infinite wealth': 89,
  'yakuza like a dragon': 84,

  // Popular Movies
  'oppenheimer': 89,
  'dune part two': 79,
  'dune part 2': 79,
  'dune': 74,
  'interstellar': 74,
  'inception': 74,
  'the dark knight': 84,
  'fight club': 66,
  'pulp fiction': 95,
  'the matrix': 73,
  'spirited away': 96,
  'parasite': 96,
  'spider man into the spider verse': 87,
  'spider man across the spider verse': 86,
  'avengers endgame': 78,

  // Popular Series
  'breaking bad': 99,
  'better call saul': 86,
  'arcane': 87,
  'game of thrones': 86,
  'the sopranos': 94,
  'the wire': 91,
  'stranger things': 76,
  'succession': 90,
  'chernobyl': 82,
  'the last of us serie': 84,
  'fallout serie': 73,

  // Popular Anime
  'frieren': 94,
  'frieren beyond journey s end': 94,
  'attack on titan': 90,
  'shingeki no kyojin': 90,
  'fullmetal alchemist brotherhood': 94,
  'death note': 88,
  'demon slayer kimetsu no yaiba': 85,
  'jujutsu kaisen': 86,
};

/**
 * Direct mapping from Steam AppIDs / RAWG external IDs to Metacritic scores
 */
export const KNOWN_ID_METACRITIC: Record<string, number> = {
  // Steam AppIDs
  'steam:381210': 71, // Dead by Daylight
  'steam:292030': 92, // The Witcher 3
  'steam:1091500': 86, // Cyberpunk 2077
  'steam:1245620': 96, // Elden Ring
  'steam:1086940': 96, // Baldur's Gate 3
  'steam:271590': 97, // GTA V
  'steam:1172470': 97, // Red Dead Redemption 2
  'steam:367520': 87, // Hollow Knight
  'steam:730': 83, // Counter-Strike 2
  'steam:570': 90, // Dota 2
  'steam:440': 92, // Team Fortress 2
  'steam:550': 89, // Left 4 Dead 2
  'steam:620': 95, // Portal 2
  'steam:400': 90, // Portal
  'steam:220': 96, // Half-Life 2
  'steam:546560': 93, // Half-Life: Alyx
  'steam:105600': 83, // Terraria
  'steam:413150': 89, // Stardew Valley
  'steam:1145360': 93, // Hades
  'steam:582010': 90, // Monster Hunter: World
  'steam:2050650': 93, // Resident Evil 4
  'steam:814380': 90, // Sekiro
  'steam:374320': 89, // Dark Souls III
  'steam:377160': 84, // Fallout 4
  'steam:489830': 94, // Skyrim Special Edition
  'steam:72850': 94, // Skyrim
  'steam:2358720': 81, // Black Myth: Wukong
  'steam:553850': 82, // Helldivers 2
  'steam:1623730': 76, // Palworld
  'steam:1172620': 88, // Sea of Thieves
  'steam:739630': 78, // Phasmophobia
  'steam:1966720': 82, // Lethal Company
  'steam:892970': 85, // Valheim
  'steam:548430': 85, // Deep Rock Galactic
  'steam:646570': 89, // Slay the Spire
  'steam:2379780': 90, // Balatro
  'steam:526870': 90, // Satisfactory
  'steam:1326470': 78, // Sons of the Forest
  'steam:242760': 83, // The Forest
  'steam:251570': 75, // 7 Days to Die
  'steam:227300': 79, // Euro Truck Simulator 2
  'steam:1551360': 92, // Forza Horizon 5
  'steam:1716740': 83, // Starfield
  'steam:218620': 79, // Payday 2
  'steam:4000': 80, // Garry's Mod
  'steam:322330': 79, // Don't Starve Together
  'steam:108600': 80, // Project Zomboid
  'steam:594650': 81, // Hunt: Showdown
  'steam:2183900': 82, // Space Marine 2
  'steam:552500': 82, // Warhammer: Vermintide 2
  'steam:1142710': 85, // Total War: WARHAMMER III
  'steam:261550': 77, // Mount & Blade II: Bannerlord
  'steam:393380': 80, // Squad
  'steam:686810': 79, // Hell Let Loose
  'steam:1203630': 80, // Enshrouded
  'steam:1222670': 70, // The Sims 4
  'steam:2357570': 79, // Overwatch 2
  'steam:945360': 85, // Among Us
  'steam:1888930': 86, // Armored Core VI
  'steam:1627720': 80, // Lies of P
  'steam:870780': 82, // Control
  'steam:1850570': 82, // Death Stranding Director's Cut
  'steam:1190460': 82, // Death Stranding
  'steam:1151640': 89, // Horizon Zero Dawn
  'steam:2420110': 88, // Horizon Forbidden West
  'steam:2215430': 83, // Ghost of Tsushima
  'steam:1817070': 87, // Marvel's Spider-Man Remastered
  'steam:264710': 87, // Subnautica
  'steam:504230': 92, // Celeste
  'steam:632360': 97, // Disco Elysium
  'steam:275850': 77, // No Man's Sky
  'steam:346110': 70, // ARK: Survival Evolved
  'steam:221100': 70, // DayZ
  'steam:238960': 86, // Path of Exile
  'steam:250900': 86, // The Binding of Isaac: Rebirth
  'steam:268910': 88, // Cuphead
  'steam:1868140': 90, // Dave the Diver
  'steam:1794680': 86, // Vampire Survivors
  'steam:379430': 76, // Kingdom Come: Deliverance
  'steam:1328670': 90, // Mass Effect Legendary Edition
  'steam:8870': 94, // BioShock Infinite
  'steam:7670': 96, // BioShock
  'steam:208650': 96, // Batman: Arkham Knight / City
  'steam:782330': 88, // DOOM Eternal
  'steam:379720': 85, // DOOM (2016)
  'steam:205100': 91, // Dishonored
  'steam:403640': 86, // Dishonored 2
  'steam:480490': 79, // Prey
  'steam:524220': 88, // NieR:Automata
  'steam:1659040': 87, // HITMAN World of Assassination
  'steam:1426210': 89, // It Takes Two
  'steam:753640': 85, // Outer Wilds
  'steam:1057090': 90, // Ori and the Will of the Wisps
  'steam:261570': 88, // Ori and the Blind Forest
  'steam:588650': 89, // Dead Cells
  'steam:553420': 85, // TUNIC
  'steam:1895880': 86, // Returnal
  'steam:1332010': 83, // Stray
  'steam:1229490': 81, // Ghostrunner
  'steam:1282100': 80, // Remnant II

  // RAWG IDs
  'rawg:eldenring': 96,
  'rawg:witcher3': 92,
  'rawg:cyberpunk2077': 86,
  'rawg:bg3': 96,
  'rawg:rdr2': 97,
  'rawg:gta5': 97,
  'rawg:hollowknight': 87,
  'rawg:zelda-botw': 97,
  'rawg:zelda-totk': 96,
  'rawg:wukong': 81,
};

/**
 * Resolves the Metacritic score for a given MediaItem
 */
export function getMediaMetacriticScore(item: MediaItem): number | null {
  // 1. Explicitly stored on item
  if (typeof item.metacritic === 'number' && item.metacritic > 0 && item.metacritic <= 100) {
    return Math.round(item.metacritic);
  }

  // 2. Direct external ID lookup
  if (item.external_id && KNOWN_ID_METACRITIC[item.external_id]) {
    return KNOWN_ID_METACRITIC[item.external_id];
  }

  // Check gameConnection serviceId (e.g. Steam appid)
  if (item.gameConnection?.service === 'steam' && item.gameConnection.serviceId) {
    const key = `steam:${item.gameConnection.serviceId}`;
    if (KNOWN_ID_METACRITIC[key]) {
      return KNOWN_ID_METACRITIC[key];
    }
  }

  // 3. Exact normalized title match
  const normTitle = normalizeMetacriticKey(item.title);
  if (normTitle && KNOWN_METACRITIC[normTitle] !== undefined) {
    return KNOWN_METACRITIC[normTitle];
  }

  // Also check originalTitle if present
  if (item.originalTitle) {
    const normOrig = normalizeMetacriticKey(item.originalTitle);
    if (normOrig && KNOWN_METACRITIC[normOrig] !== undefined) {
      return KNOWN_METACRITIC[normOrig];
    }
  }

  // 4. Fuzzy substring match in known list
  if (normTitle.length >= 4) {
    for (const [knownTitle, score] of Object.entries(KNOWN_METACRITIC)) {
      if (knownTitle.length >= 4) {
        if (normTitle === knownTitle || normTitle.startsWith(knownTitle) || knownTitle.startsWith(normTitle)) {
          return score;
        }
      }
    }
  }

  return null;
}

/**
 * Provides Tailwind style classes matching Metacritic's green / yellow / red color tiers
 */
export function getMetacriticBadgeStyle(score: number): {
  bgClass: string;
  colorClass: string;
  borderClass: string;
  badgeBg: string;
} {
  // Metacritic standard:
  // 75-100: Universal Acclaim / Generally Favorable (Green)
  // 50-74: Mixed or Average (Yellow / Amber)
  // 0-49: Generally Unfavorable (Red)
  if (score >= 75) {
    return {
      bgClass: 'bg-emerald-500/15',
      colorClass: 'text-emerald-300',
      borderClass: 'border-emerald-500/30',
      badgeBg: 'bg-emerald-500',
    };
  }
  if (score >= 50) {
    return {
      bgClass: 'bg-amber-500/15',
      colorClass: 'text-amber-300',
      borderClass: 'border-amber-500/30',
      badgeBg: 'bg-amber-500',
    };
  }
  return {
    bgClass: 'bg-rose-500/15',
    colorClass: 'text-rose-300',
    borderClass: 'border-rose-500/30',
    badgeBg: 'bg-rose-500',
  };
}
