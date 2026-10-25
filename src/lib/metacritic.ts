import { MediaItem } from '@/types/media';

/**
 * Normalizes title for fuzzy Metacritic matching
 */
export function normalizeMetacriticKey(title: string): string {
  if (!title) return '';
  return title
    .replace(/[™®©℗℠]/g, '')
    .replace(/[’‘`´]/g, "'")
    // Keep 's attached before turning punctuation into space: marvel's -> marvels, drake's -> drakes
    .replace(/'s\b/gi, 's')
    .replace(/'/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    // Strip platform / console / media tags in parens or brackets including PS3, PS2, Vita, Xbox 360, etc.
    .replace(/\((?:ps5|ps4|ps3|ps2|ps1|psx|psp|ps\s*vita|psvita|pc|xbox|xbox\s*360|xbox\s*one|series\s*[xs]|switch|nintendo|playstation|steam|gog|epic|erweiterung|expansion|dlc)[^)]*\)/gi, '')
    .replace(/\[(?:ps5|ps4|ps3|ps2|ps1|psx|psp|ps\s*vita|psvita|pc|xbox|xbox\s*360|xbox\s*one|series\s*[xs]|switch|nintendo|playstation|steam|gog|epic|erweiterung|expansion|dlc)[^\]]*\]/gi, '')
    .replace(/\b(ps4\s*&\s*ps5|ps5\s*&\s*ps4|playstation\s*5|playstation\s*4|playstation\s*3|ps5|ps4|ps3|ps2|psp|ps\s*vita|psvita|xbox\s*360|xbox\s*one|nintendo switch)\b/gi, '')
    // Strip common edition / collection words so they don't break title matching
    .replace(/\b(game of the year edition|goty|digital deluxe edition|deluxe edition|definitive edition|remastered|enhanced edition|complete edition|directors cut|director'?s cut|special edition|standard edition|gold edition|premium edition|anniversary edition|legendary edition|standard version|intergrade|legacy of thieves collection|scholar of the first sin|royal edition|launch edition|day one edition|erweiterung|expansion|dlc)\b/gi, '')
    .replace(/\s*\(\d{4}\)/g, '')
    .replace(/[:\-_—–―,.'!?/\\()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Returns alternate title variants with Roman numerals vs Arabic numerals
 */
export function getNumberVariants(key: string): string[] {
  const variants = new Set<string>();

  // Part variants: part 1 <-> part i, part 2 <-> part ii, etc.
  if (key.includes('part 1')) variants.add(key.replace(/\bpart 1\b/g, 'part i'));
  if (key.includes('part i') && !key.includes('part ii')) variants.add(key.replace(/\bpart i\b/g, 'part 1'));
  if (key.includes('part 2')) variants.add(key.replace(/\bpart 2\b/g, 'part ii'));
  if (key.includes('part ii')) variants.add(key.replace(/\bpart ii\b/g, 'part 2'));
  if (key.includes('part 3')) variants.add(key.replace(/\bpart 3\b/g, 'part iii'));
  if (key.includes('part iii')) variants.add(key.replace(/\bpart iii\b/g, 'part 3'));

  // Number variants: 2 <-> ii, 3 <-> iii, 4 <-> iv, 5 <-> v, 6 <-> vi, 7 <-> vii, 8 <-> viii
  if (/\b2\b/.test(key)) variants.add(key.replace(/\b2\b/g, 'ii'));
  if (/\bii\b/.test(key)) variants.add(key.replace(/\bii\b/g, '2'));
  if (/\b3\b/.test(key)) variants.add(key.replace(/\b3\b/g, 'iii'));
  if (/\biii\b/.test(key)) variants.add(key.replace(/\biii\b/g, '3'));
  if (/\b4\b/.test(key)) variants.add(key.replace(/\b4\b/g, 'iv'));
  if (/\biv\b/.test(key)) variants.add(key.replace(/\biv\b/g, '4'));
  if (/\b5\b/.test(key)) variants.add(key.replace(/\b5\b/g, 'v'));
  if (/\bv\b/.test(key)) variants.add(key.replace(/\bv\b/g, '5'));
  if (/\b6\b/.test(key)) variants.add(key.replace(/\b6\b/g, 'vi'));
  if (/\bvi\b/.test(key)) variants.add(key.replace(/\bvi\b/g, '6'));
  if (/\b7\b/.test(key)) variants.add(key.replace(/\b7\b/g, 'vii'));
  if (/\bvii\b/.test(key)) variants.add(key.replace(/\bvii\b/g, '7'));
  if (/\b8\b/.test(key)) variants.add(key.replace(/\b8\b/g, 'viii'));
  if (/\bviii\b/.test(key)) variants.add(key.replace(/\bviii\b/g, '8'));

  // & vs and
  if (key.includes('&')) {
    variants.add(key.replace(/&/g, 'and').replace(/\s+/g, ' ').trim());
  }

  return Array.from(variants);
}

/**
 * Curated Metacritic scores for popular games, movies, and series
 */
export const KNOWN_METACRITIC: Record<string, number> = {
  // ================= PLAYSTATION EXCLUSIVES & HITS =================
  'the last of us': 95,
  'the last of us part i': 95,
  'the last of us part 1': 95,
  'the last of us part ii': 93,
  'the last of us part 2': 93,
  'the last of us remastered': 95,
  'god of war': 94,
  'god of war ragnarok': 94,
  'god of war iii': 92,
  'god of war 3': 92,
  'bloodborne': 92,
  'demon s souls': 92,
  'demons souls': 92,
  'ghost of tsushima': 83,
  'ghost of tsushima director s cut': 87,
  'ghost of tsushima directors cut': 87,
  'uncharted 4 a thief s end': 93,
  'uncharted 4 a thiefs end': 93,
  'uncharted 4': 93,
  'uncharted the lost legacy': 84,
  'uncharted the nathan drake collection': 86,
  'uncharted 2 among thieves': 96,
  'uncharted 3 drake s deception': 92,
  'uncharted 3 drakes deception': 92,
  'uncharted drake s fortune': 88,
  'uncharted drakes fortune': 88,
  'uncharted drakes schicksal': 88,
  'marvel s spider man': 87,
  'marvels spider man': 87,
  'spider man': 87,
  'marvel s spider man miles morales': 85,
  'marvels spider man miles morales': 85,
  'spider man miles morales': 85,
  'marvel s spider man 2': 90,
  'marvels spider man 2': 90,
  'spider man 2': 90,
  'horizon zero dawn': 89,
  'horizon forbidden west': 88,
  'horizon call of the mountain': 79,
  'ratchet & clank rift apart': 88,
  'ratchet and clank rift apart': 88,
  'ratchet clank rift apart': 88,
  'ratchet & clank': 85,
  'ratchet and clank': 85,
  'returnal': 86,
  'gran turismo 7': 87,
  'gran turismo sport': 75,
  'astro bot': 94,
  'astro s playroom': 83,
  'astros playroom': 83,
  'astro bot rescue mission': 90,
  'days gone': 71,
  'death stranding': 82,
  'death stranding director s cut': 85,
  'until dawn': 79,
  'the quarry': 74,
  'detroit become human': 78,
  'heavy rain': 87,
  'beyond two souls': 70,
  'infamous second son': 80,
  'infamous first light': 73,
  'shadow of the colossus': 91,
  'the last guardian': 82,
  'stellar blade': 81,
  'rise of the ronin': 76,
  'helldivers': 81,
  'helldivers 2': 82,
  'killzone shadow fall': 73,
  'littlebigplanet 3': 79,
  'sackboy a big adventure': 79,
  'concrete genie': 75,
  'medievil': 67,
  'the order 1886': 63,

  // ================= TOP RPG & ACTION ADVENTURE =================
  'the witcher 3 wild hunt': 92,
  'the witcher 3': 92,
  'witcher 3': 92,
  'the witcher 2': 88,
  'the witcher': 81,
  'cyberpunk 2077': 86,
  'cyberpunk 2077 phantom liberty': 89,
  'phantom liberty': 89,
  'elden ring': 96,
  'elden ring shadow of the erdtree': 95,
  'shadow of the erdtree': 95,
  'baldur s gate 3': 96,
  'baldurs gate 3': 96,
  'red dead redemption 2': 97,
  'rdr2': 97,
  'red dead redemption': 95,
  'grand theft auto v': 97,
  'gta 5': 97,
  'gta v': 97,
  'grand theft auto iv': 98,
  'gta 4': 98,
  'grand theft auto san andreas': 95,
  'gta san andreas': 95,
  'grand theft auto vice city': 95,
  'gta vice city': 95,
  'hogwarts legacy': 84,
  'black myth wukong': 81,
  'wukong': 81,
  'dragon s dogma 2': 86,
  'dragons dogma 2': 86,
  'dragon s dogma': 78,
  'kingdom come deliverance': 76,
  'kingdom come deliverance 2': 88,
  'kingdom come deliverance ii': 88,
  's t a l k e r 2 heart of chornobyl': 74,
  'stalker 2': 74,
  'metro exodus': 82,
  'metro last light': 80,
  'metro 2033': 81,
  'dying light': 74,
  'dying light 2 stay human': 76,
  'dying light 2': 76,
  'dead island 2': 73,
  'dead island': 71,

  // ================= SOULSLIKE & ACTION =================
  'sekiro shadows die twice': 90,
  'sekiro': 90,
  'dark souls': 89,
  'dark souls remastered': 84,
  'dark souls ii': 91,
  'dark souls 2': 91,
  'dark souls iii': 89,
  'dark souls 3': 89,
  'armored core vi fires of rubicon': 86,
  'armored core 6': 86,
  'lies of p': 80,
  'lords of the fallen': 75,
  'wo long fallen dynasty': 81,
  'nioh': 88,
  'nioh 2': 85,
  'remnant from the ashes': 77,
  'remnant ii': 80,
  'remnant 2': 80,

  // ================= CAPCOM & RESIDENT EVIL =================
  'resident evil 4': 93,
  'resident evil 2': 91,
  'resident evil 3': 79,
  'resident evil 7 biohazard': 86,
  'resident evil 7': 86,
  'resident evil village': 84,
  'resident evil 8': 84,
  'resident evil': 91,
  'resident evil 5': 84,
  'resident evil 6': 67,
  'monster hunter world': 90,
  'monster hunter world iceborne': 89,
  'monster hunter rise': 88,
  'monster hunter wilds': 88,
  'devil may cry 5': 87,
  'devil may cry hd': 77,
  'dmc devil may cry': 85,
  'street fighter 6': 92,
  'street fighter v': 77,
  'street fighter 5': 77,
  'dragon s dogma dark arisen': 80,

  // ================= JRPG & JAPANESE GEMS =================
  'final fantasy vii remake': 87,
  'final fantasy 7 remake': 87,
  'final fantasy vii rebirth': 92,
  'final fantasy 7 rebirth': 92,
  'final fantasy xvi': 87,
  'final fantasy 16': 87,
  'final fantasy xv': 81,
  'final fantasy 15': 81,
  'final fantasy xiv': 92,
  'final fantasy 14': 92,
  'final fantasy x': 92,
  'final fantasy xii': 92,
  'persona 5 royal': 95,
  'persona 5': 93,
  'persona 5 strikers': 83,
  'persona 3 reload': 87,
  'persona 4 golden': 93,
  'metaphor refantazio': 94,
  'shin megami tensei v vengeance': 87,
  'tales of arise': 87,
  'granblue fantasy relink': 80,
  'nier automata': 88,
  'nier replicant': 83,
  'like a dragon infinite wealth': 89,
  'yakuza like a dragon': 84,
  'like a dragon gaiden': 78,
  'yakuza 0': 85,
  'yakuza kiwami': 80,
  'yakuza kiwami 2': 85,
  'yakuza 3': 79,
  'yakuza 4': 78,
  'yakuza 5': 83,
  'yakuza 6 the song of life': 83,
  'judgment': 80,
  'lost judgment': 82,
  'dragon ball sparking zero': 81,
  'dragon ball z kakarot': 73,
  'dragon ball fighterz': 87,
  'naruto shippuden ultimate ninja storm 4': 79,
  'one piece odyssey': 75,
  'tekken 8': 90,
  'tekken 7': 82,
  'mortal kombat 1': 83,
  'mortal kombat 11': 82,
  'mortal kombat x': 83,
  'guilty gear strive': 87,

  // ================= BETHESDA & SCI-FI =================
  'the elder scrolls v skyrim': 94,
  'skyrim': 94,
  'the elder scrolls iv oblivion': 94,
  'oblivion': 94,
  'the elder scrolls online': 71,
  'fallout 4': 84,
  'fallout new vegas': 84,
  'fallout 3': 93,
  'fallout 76': 52,
  'starfield': 83,
  'doom eternal': 88,
  'doom': 85,
  'wolfenstein the new order': 79,
  'wolfenstein ii the new colossus': 87,
  'wolfenstein 2': 87,
  'dishonored': 91,
  'dishonored 2': 86,
  'prey': 79,
  'deathloop': 88,

  // ================= BIOWARE & EA =================
  'mass effect legendary edition': 90,
  'mass effect 2': 96,
  'mass effect 3': 93,
  'mass effect': 89,
  'dragon age inquisition': 89,
  'dragon age the veilguard': 82,
  'dragon age origins': 91,
  'dragon age 2': 82,
  'dead space': 89,
  'dead space 2': 90,
  'star wars jedi fallen order': 79,
  'star wars jedi survivor': 85,
  'star wars outlaws': 76,
  'star wars battlefront ii': 65,
  'star wars squadrons': 79,
  'it takes two': 89,
  'a way out': 78,
  'apex legends': 88,
  'titanfall 2': 89,
  'battlefield 1': 88,
  'battlefield 4': 81,
  'battlefield 2042': 68,
  'need for speed unbound': 77,
  'need for speed heat': 72,
  'burnout paradise': 88,
  'ea sports fc 24': 75,
  'ea sports fc 25': 76,
  'fifa 23': 77,
  'fifa 22': 78,
  'fifa 21': 72,
  'the sims 4': 70,

  // ================= UBISOFT & OPEN WORLD =================
  'assassin s creed valhalla': 80,
  'assassins creed valhalla': 80,
  'assassin s creed odyssey': 83,
  'assassins creed odyssey': 83,
  'assassin s creed origins': 81,
  'assassins creed origins': 81,
  'assassin s creed mirage': 76,
  'assassins creed mirage': 76,
  'assassin s creed iv black flag': 88,
  'assassins creed iv black flag': 88,
  'assassin s creed 4': 88,
  'assassin s creed ii': 90,
  'assassins creed ii': 90,
  'assassin s creed 2': 90,
  'far cry 6': 73,
  'far cry 5': 81,
  'far cry 4': 85,
  'far cry 3': 88,
  'watch dogs 2': 82,
  'watch dogs': 80,
  'watch dogs legion': 70,
  'tom clancy s the division 2': 82,
  'the division 2': 82,
  'the division': 80,
  'tom clancy s rainbow six siege': 79,
  'rainbow six siege': 79,
  'ghost recon wildlands': 70,
  'ghost recon breakpoint': 57,

  // ================= WARNER & ROCKSTEADY =================
  'batman arkham city': 96,
  'batman arkham knight': 87,
  'batman arkham asylum': 91,
  'middle earth shadow of mordor': 84,
  'shadow of mordor': 84,
  'middle earth shadow of war': 80,
  'shadow of war': 80,
  'gotham knights': 67,
  'suicide squad kill the justice league': 60,
  'mad max': 69,

  // ================= REMEDY & 2K =================
  'alan wake 2': 89,
  'alan wake': 83,
  'control': 82,
  'bioshock infinite': 94,
  'bioshock': 96,
  'bioshock 2': 88,
  'borderlands 3': 81,
  'borderlands 2': 89,
  'tiny tina s wonderlands': 78,
  'tiny tinas wonderlands': 78,
  'mafia definitive edition': 78,
  'mafia ii': 77,
  'mafia iii': 68,
  'nba 2k24': 68,
  'nba 2k25': 74,
  'wwe 2k24': 81,
  'wwe 2k23': 82,

  // ================= INDIE & ACCLAIMED HITS =================
  'hades': 93,
  'hades ii': 90,
  'hades 2': 90,
  'hollow knight': 87,
  'celeste': 91,
  'dead cells': 89,
  'slay the spire': 89,
  'balatro': 90,
  'dave the diver': 90,
  'sea of stars': 87,
  'cocoon': 88,
  'tunic': 85,
  'animal well': 91,
  'dredge': 80,
  'cult of the lamb': 82,
  'vampire survivors': 86,
  'cuphead': 86,
  'disco elysium': 97,
  'disco elysium the final cut': 97,
  'outer wilds': 85,
  'subnautica': 87,
  'subnautica below zero': 82,
  'what remains of edith finch': 88,
  'firewatch': 81,
  'the stanley parable ultra deluxe': 89,
  'the stanley parable': 88,
  'inside': 91,
  'limbo': 90,
  'little nightmares': 78,
  'little nightmares ii': 82,
  'little nightmares 2': 82,
  'blasphemous': 77,
  'blasphemous 2': 84,
  'prince of persia the lost crown': 86,
  'rayman legends': 90,
  'ori and the will of the wisps': 90,
  'ori and the blind forest': 88,
  'pacific drive': 77,
  'the talos principle': 85,
  'the talos principle 2': 88,
  'the witness': 87,
  'stray': 83,
  'ghostrunner': 81,
  'ghostrunner 2': 80,
  'signalis': 81,
  'chants of sennaar': 85,
  'jusant': 85,
  'viewfinder': 84,
  'katana zero': 83,
  'hotline miami': 85,
  'hotline miami 2 wrong number': 74,
  'sifu': 81,
  'overcooked 2': 81,
  'overcooked': 78,
  'enter the gungeon': 82,
  'risk of rain 2': 85,
  'the binding of isaac rebirth': 86,
  'binding of isaac rebirth': 86,
  'rogue legacy 2': 88,
  'darkest dungeon': 84,
  'darkest dungeon ii': 81,

  // ================= VALVE & SURVIVAL & SIMULATION =================
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
  'minecraft': 93,
  'stardew valley': 89,
  'valheim': 85,
  'rust': 69,
  'palworld': 76,
  'factorio': 90,
  'satisfactory': 90,
  'dyson sphere program': 86,
  'rimworld': 87,
  'prison architect': 83,
  'cities skylines': 85,
  'cities skylines ii': 74,
  'cities skylines 2': 74,
  'planet coaster': 84,
  'planet zoo': 81,
  'crusader kings iii': 91,
  'crusader kings 3': 91,
  'europa universalis iv': 87,
  'europa universalis 4': 87,
  'hearts of iron iv': 83,
  'hearts of iron 4': 83,
  'stellaris': 78,
  'sid meier s civilization vi': 88,
  'civilization vi': 88,
  'civilization 6': 88,
  'civilization v': 90,
  'civilization 5': 90,
  'age of empires ii definitive edition': 84,
  'age of empires 2': 84,
  'age of empires iv': 81,
  'age of empires 4': 81,
  'age of mythology retold': 83,
  'frostpunk': 84,
  'frostpunk 2': 86,
  'manor lords': 85,
  'mount & blade ii bannerlord': 77,
  'mount and blade ii bannerlord': 77,
  'total war warhammer iii': 85,
  'total war warhammer 3': 85,
  'total war three kingdoms': 85,
  'anno 1800': 81,
  'xcom 2': 88,
  'xcom enemy unknown': 89,
  'warhammer 40 000 space marine 2': 82,
  'warhammer 40000 space marine 2': 82,
  'space marine 2': 82,
  'warhammer vermintide 2': 82,
  'deep rock galactic': 85,
  'payday 2': 79,
  'payday 3': 66,
  'hunt showdown 1896': 81,
  'hunt showdown': 81,
  'squad': 80,
  'hell let loose': 79,
  'ready or not': 79,
  'enshrouded': 80,
  'v rising': 83,
  'sons of the forest': 78,
  'the forest': 83,
  '7 days to die': 75,
  'project zomboid': 80,
  'raft': 79,
  'green hell': 78,
  'euro truck simulator 2': 79,
  'american truck simulator': 76,
  'snowrunner': 81,
  'microsoft flight simulator': 91,
  'forza horizon 5': 92,
  'forza horizon 4': 92,
  'forza motorsport': 84,
  'rocket league': 86,
  'fall guys': 80,
  'dead by daylight': 71,
  'sea of thieves': 69,
  'phasmophobia': 78,
  'lethal company': 82,
  'among us': 85,
  'destiny 2': 83,
  'warframe': 69,
  'overwatch 2': 79,

  // ================= NINTENDO SWITCH CLASSICS =================
  'the legend of zelda breath of the wild': 97,
  'zelda breath of the wild': 97,
  'the legend of zelda tears of the kingdom': 96,
  'zelda tears of the kingdom': 96,
  'the legend of zelda echoes of wisdom': 86,
  'zelda echoes of wisdom': 86,
  'the legend of zelda link s awakening': 87,
  'super mario odyssey': 97,
  'super mario bros wonder': 92,
  'super smash bros ultimate': 93,
  'mario kart 8 deluxe': 92,
  'luigi s mansion 3': 86,
  'metroid prime remastered': 94,
  'metroid dread': 88,
  'animal crossing new horizons': 90,
  'xenoblade chronicles 3': 89,
  'xenoblade chronicles definitive edition': 89,
  'fire emblem three houses': 89,
  'fire emblem engage': 80,
  'pokemon legenden arceus': 83,
  'pokemon karmesin': 72,
  'pokemon purpur': 72,
  'kirby und das vergessene land': 85,
  'donkey kong country tropical freeze': 86,
  'pikmin 4': 87,
  'paper mario die legende vom aonentor': 88,
  'bayonetta 3': 86,

  // ================= MOVIES & SERIES =================
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
  'steam:208650': 87, // Batman: Arkham Knight
  'steam:200260': 96, // Batman: Arkham City
  'steam:35140': 91, // Batman: Arkham Asylum
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
  'steam:990080': 83, // Hogwarts Legacy
  'steam:1240440': 91, // Animal Well
  'steam:1244460': 87, // Sea of Stars
  'steam:1462570': 88, // COCOON
  'steam:1092790': 85, // Inscryption

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

  // Check without leading 'the '
  if (normTitle.startsWith('the ')) {
    const withoutThe = normTitle.slice(4);
    if (KNOWN_METACRITIC[withoutThe] !== undefined) {
      return KNOWN_METACRITIC[withoutThe];
    }
  }

  // Check with Roman / Arabic numeral swaps (e.g. part 1 <-> part i)
  const variants = getNumberVariants(normTitle);
  for (const v of variants) {
    if (KNOWN_METACRITIC[v] !== undefined) {
      return KNOWN_METACRITIC[v];
    }
  }

  // Also check originalTitle if present
  if (item.originalTitle) {
    const normOrig = normalizeMetacriticKey(item.originalTitle);
    if (normOrig && KNOWN_METACRITIC[normOrig] !== undefined) {
      return KNOWN_METACRITIC[normOrig];
    }
    const origVariants = getNumberVariants(normOrig);
    for (const ov of origVariants) {
      if (KNOWN_METACRITIC[ov] !== undefined) {
        return KNOWN_METACRITIC[ov];
      }
    }
  }

  // 4. Fuzzy match: check if a known title starts with normTitle or normTitle starts with known title
  if (normTitle.length >= 4) {
    for (const [knownTitle, score] of Object.entries(KNOWN_METACRITIC)) {
      if (knownTitle.length >= 4) {
        if (normTitle === knownTitle || normTitle.startsWith(knownTitle + ' ') || knownTitle.startsWith(normTitle + ' ')) {
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
