import { MediaItem, SequelNotification } from '@/types/media';
import { normalizeMetacriticKey, getNumberVariants } from '@/lib/metacritic';

export const DISMISSED_SEQUELS_STORAGE_KEY = 'omnilist_dismissed_sequels_v1';
export const LEGACY_DISMISSED_SEQUELS_STORAGE_KEY = 'omnitrack_dismissed_sequels_v1';

/**
 * Compilation and trilogy bundles that include multiple titles in a franchise.
 */
export const COMPILATION_BUNDLES: { pattern: RegExp; coveredSequelMatches: string[] }[] = [
  {
    pattern: /\b(?:nathan drake collection|uncharted collection)\b/i,
    coveredSequelMatches: ['uncharted 1', 'uncharted 2', 'uncharted 3', 'among thieves', 'drakes deception', 'drakes schicksal'],
  },
  {
    pattern: /\b(?:legacy of thieves)\b/i,
    coveredSequelMatches: ['uncharted 4', 'thiefs end', 'lost legacy'],
  },
  {
    pattern: /\b(?:arkham collection)\b/i,
    coveredSequelMatches: ['arkham asylum', 'arkham city', 'arkham knight'],
  },
  {
    pattern: /\b(?:return to arkham\s*-\s*arkham asylum)\b/i,
    coveredSequelMatches: ['arkham asylum'],
  },
  {
    pattern: /\b(?:return to arkham\s*-\s*arkham city)\b/i,
    coveredSequelMatches: ['arkham city'],
  },
  {
    pattern: /\b(?:return to arkham)\b/i,
    coveredSequelMatches: ['arkham asylum', 'arkham city'],
  },
  {
    pattern: /\b(?:master chief collection)\b/i,
    coveredSequelMatches: ['halo 1', 'halo 2', 'halo 3', 'halo 4', 'reach', 'odst'],
  },
  {
    pattern: /\b(?:mass effect legendary)\b/i,
    coveredSequelMatches: ['mass effect 1', 'mass effect 2', 'mass effect 3'],
  },
  {
    pattern: /\b(?:bioshock (?:the )?collection)\b/i,
    coveredSequelMatches: ['bioshock 1', 'bioshock 2', 'bioshock infinite'],
  },
  {
    pattern: /\b(?:dark souls trilogy)\b/i,
    coveredSequelMatches: ['dark souls 1', 'dark souls 2', 'dark souls 3'],
  },
  {
    pattern: /\b(?:witcher trilogy)\b/i,
    coveredSequelMatches: ['witcher 1', 'witcher 2', 'witcher 3'],
  },
  {
    pattern: /\b(?:crash bandicoot n(?:\.|\s*)sane trilogy)\b/i,
    coveredSequelMatches: ['crash bandicoot 1', 'crash bandicoot 2', 'crash bandicoot 3'],
  },
  {
    pattern: /\b(?:spyro reignited trilogy)\b/i,
    coveredSequelMatches: ['spyro 1', 'spyro 2', 'spyro 3'],
  },
  {
    pattern: /\b(?:1 5 2 5 remix|kingdom hearts hd)\b/i,
    coveredSequelMatches: ['kingdom hearts 1', 'kingdom hearts 2'],
  },
];

/**
 * Normalizes a title for robust sequel matching across editions, Roman numerals, and languages.
 */
export function normalizeSequelMatchKey(title: string): string {
  if (!title) return '';
  let s = normalizeMetacriticKey(title);
  // Remove publisher / studio / platform prefixes (handles marvels with or without trailing s)
  s = s.replace(/^(?:marvels?|disneys?|the)\s+/, '');
  // Normalize Grand Theft Auto <-> GTA
  s = s.replace(/\bgrand theft auto\b/g, 'gta');
  // Normalize German/English series designations
  s = s.replace(/\bstaffel\b/g, 'season');
  s = s.replace(/\bteil\b/g, 'part');
  s = s.replace(/\bband\b/g, 'part');
  // Normalize word-based season designations (e.g. "Second Season" -> "season 2")
  s = s.replace(/\b(?:second|2nd)\s+season\b/g, 'season 2');
  s = s.replace(/\b(?:third|3rd)\s+season\b/g, 'season 3');
  s = s.replace(/\b(?:fourth|4th)\s+season\b/g, 'season 4');
  s = s.replace(/\b(?:fifth|5th)\s+season\b/g, 'season 5');

  // Anime Romaji <-> English canonical mappings
  s = s.replace(/\bansatsu kyoushitsu\b/g, 'assassination classroom');
  s = s.replace(/\bshingeki no kyojin\b/g, 'attack on titan');
  s = s.replace(/\bkimetsu no yaiba\b/g, 'demon slayer');
  s = s.replace(/\bboku no hero academia\b/g, 'my hero academia');
  s = s.replace(/\bsousou no frieren\b/g, 'frieren');
  s = s.replace(/\bore dake level up na ken\b/g, 'solo leveling');
  s = s.replace(/\bmushoku tensei\b/g, 'jobless reincarnation');
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Generates comprehensive title variants for a sequel, including base title (before subtitle),
 * subtitle alone, Roman/Arabic number variants, and parenthetical-stripped forms.
 */
export function getSequelTitleVariants(title: string): string[] {
  if (!title) return [];
  const variants = new Set<string>();
  const norm = normalizeSequelMatchKey(title);
  if (norm) {
    variants.add(norm);
    for (const v of getNumberVariants(norm)) {
      variants.add(v);
    }
  }

  // Common franchise-only words that should NOT match standalone without a number or subtitle
  const genericFranchiseNames = new Set([
    'batman',
    'spider man',
    'spiderman',
    'uncharted',
    'witcher',
    'god of war',
    'last of us',
    'the last of us',
    'dune',
    'frieren',
    'solo leveling',
    'jujutsu kaisen',
    'stranger things',
    'arcane',
    'severance',
    'gta',
    'elden ring',
    'hollow knight',
  ]);

  // Split only on colon, em-dash, en-dash, or hyphen surrounded by whitespace (NOT inside words like Spider-Man)
  const parts = title.split(/[:—–]|\s+-\s+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length > 1) {
    const main = normalizeSequelMatchKey(parts[0]);
    if (main && main.length > 2 && (!genericFranchiseNames.has(main) || /\b(?:\d+|ii|iii|iv|v|vi|part|season)\b/.test(main))) {
      variants.add(main);
      for (const v of getNumberVariants(main)) {
        variants.add(v);
      }
    }
    const sub = normalizeSequelMatchKey(parts.slice(1).join(' '));
    if (sub && sub.length > 2 && !genericFranchiseNames.has(sub)) {
      variants.add(sub);
      for (const v of getNumberVariants(sub)) {
        variants.add(v);
      }
    }
  }

  // Strip parenthetical notes like (Staffel 2), (PS5), (Erweiterung)
  const parenStripped = title.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '');
  const parenClean = normalizeSequelMatchKey(parenStripped);
  if (parenClean && parenClean.length > 2 && (!genericFranchiseNames.has(parenClean) || /\b(?:\d+|ii|iii|iv|v|vi|part|season)\b/.test(parenClean))) {
    variants.add(parenClean);
    for (const v of getNumberVariants(parenClean)) {
      variants.add(v);
    }
  }

  return Array.from(variants);
}

/**
 * Returns all dismissed sequel keys from persistent storage.
 */
export function getDismissedSequelKeys(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DISMISSED_SEQUELS_STORAGE_KEY);
    const legacyRaw = !raw ? localStorage.getItem(LEGACY_DISMISSED_SEQUELS_STORAGE_KEY) : null;
    const sourceRaw = raw || legacyRaw;
    if (legacyRaw) {
      localStorage.removeItem(LEGACY_DISMISSED_SEQUELS_STORAGE_KEY);
    }
    if (!sourceRaw) return [];
    const parsed = JSON.parse(sourceRaw);
    if (!Array.isArray(parsed)) return [];
    if (legacyRaw && !raw) {
      localStorage.setItem(DISMISSED_SEQUELS_STORAGE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return [];
  }
}

/**
 * Adds keys to the persistent dismissed sequel blacklist.
 */
export function addDismissedSequelKey(keys: string | string[]): void {
  if (typeof window === 'undefined' || !keys) return;
  try {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    const existing = new Set(getDismissedSequelKeys());
    for (const k of keyArray) {
      if (k && typeof k === 'string') {
        const clean = k.trim().toLowerCase();
        if (clean) existing.add(clean);
      }
    }
    localStorage.setItem(DISMISSED_SEQUELS_STORAGE_KEY, JSON.stringify(Array.from(existing)));
    localStorage.removeItem(LEGACY_DISMISSED_SEQUELS_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to add dismissed sequel key', e);
  }
}

/**
 * Clears the dismissed sequel blacklist.
 */
export function clearDismissedSequels(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DISMISSED_SEQUELS_STORAGE_KEY);
    localStorage.removeItem(LEGACY_DISMISSED_SEQUELS_STORAGE_KEY);
  } catch {}
}

/**
 * Checks whether a sequel notification has been dismissed by the user.
 */
export function isSequelDismissed(
  sequel: SequelNotification,
  dismissedSet?: Set<string>
): boolean {
  if (!sequel) return false;
  const set = dismissedSet || new Set(getDismissedSequelKeys());
  if (set.size === 0) return false;

  // 1. Direct ID
  if (sequel.id && set.has(sequel.id.trim().toLowerCase())) {
    return true;
  }

  // 2. Direct external_id
  if (sequel.external_id && set.has(sequel.external_id.trim().toLowerCase())) {
    return true;
  }

  // 3. Franchise ID
  if (sequel.franchise_id && set.has(sequel.franchise_id.trim().toLowerCase())) {
    return true;
  }

  // 4. Parent ID combination
  if (sequel.parentMediaId) {
    const norm = normalizeSequelMatchKey(sequel.sequelTitle);
    if (set.has(`parent:${sequel.parentMediaId}:${norm}`)) {
      return true;
    }
  }

  // 5. Parent Title combination
  if (sequel.parentMediaTitle) {
    const pNorm = normalizeSequelMatchKey(sequel.parentMediaTitle);
    const sNorm = normalizeSequelMatchKey(sequel.sequelTitle);
    if (pNorm && sNorm && set.has(`parenttitle:${pNorm}:${sNorm}`)) {
      return true;
    }
  }

  // 6. Title and all generated variants
  const variants = getSequelTitleVariants(sequel.sequelTitle);
  for (const v of variants) {
    if (set.has(v)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks whether a given sequel is already owned / present in the user's media collection.
 */
export function isSequelInLibrary(
  sequel: SequelNotification,
  library: MediaItem[]
): boolean {
  if (!sequel || !library || library.length === 0) return false;

  const seqExtId = sequel.external_id?.toLowerCase().trim();
  const seqClean = normalizeSequelMatchKey(sequel.sequelTitle);
  const seqVariants = new Set<string>(getSequelTitleVariants(sequel.sequelTitle));

  return library.some((item) => {
    // Media types must be compatible
    if (sequel.sequelType && item.type) {
      if (sequel.sequelType !== item.type) {
        const isMovieShowMix =
          (sequel.sequelType === 'movie' && item.type === 'show') ||
          (sequel.sequelType === 'show' && item.type === 'movie');
        if (!isMovieShowMix) {
          return false;
        }
      }
    }

    // 1. Direct ID / external_id match
    if (seqExtId) {
      if (item.external_id && item.external_id.toLowerCase().trim() === seqExtId) {
        return true;
      }
      if (item.id && item.id.toLowerCase().trim() === seqExtId) {
        return true;
      }
    }

    // 2. Compilation and bundle matching
    for (const bundle of COMPILATION_BUNDLES) {
      if (bundle.pattern.test(item.title) || (item.originalTitle && bundle.pattern.test(item.originalTitle))) {
        if (bundle.coveredSequelMatches.some((token) => seqClean.includes(token))) {
          return true;
        }
      }
    }

    // 3. Direct clean title match & Roman/Arabic number variants
    const itemClean = normalizeSequelMatchKey(item.title);
    if (!itemClean) return false;

    if (seqVariants.has(itemClean)) {
      return true;
    }

    if (item.originalTitle) {
      const origClean = normalizeSequelMatchKey(item.originalTitle);
      if (origClean && seqVariants.has(origClean)) {
        return true;
      }
    }

    // Check item's own title variants against sequel variants
    const itemVariants = getSequelTitleVariants(item.title);
    for (const iv of itemVariants) {
      if (seqVariants.has(iv)) {
        return true;
      }
    }

    // 4. Known franchise specific matching rules:
    // Batman Arkham
    if (seqClean.includes('arkham knight') && itemClean.includes('arkham knight')) return true;
    if (seqClean.includes('arkham city') && itemClean.includes('arkham city')) return true;
    if (seqClean.includes('arkham asylum') && itemClean.includes('arkham asylum')) return true;

    // Uncharted
    if (
      (seqClean.includes('uncharted 2') || seqClean.includes('among thieves')) &&
      (itemClean.includes('uncharted 2') || itemClean.includes('among thieves'))
    ) {
      return true;
    }
    if (
      (seqClean.includes('uncharted 3') || seqClean.includes('drakes deception')) &&
      (itemClean.includes('uncharted 3') || itemClean.includes('drakes deception'))
    ) {
      return true;
    }
    if (
      (seqClean.includes('uncharted 4') || seqClean.includes('thiefs end') || seqClean.includes('a thief s end')) &&
      (itemClean.includes('uncharted 4') || itemClean.includes('thiefs end') || itemClean.includes('a thief s end'))
    ) {
      return true;
    }

    // Spider-Man
    if (seqClean.includes('spider man 2') && itemClean.includes('spider man 2')) return true;
    if (seqClean.includes('across the spider verse') && itemClean.includes('across the spider verse')) return true;

    // The Last of Us
    if (
      (seqClean.includes('last of us part 2') || seqClean.includes('last of us part ii')) &&
      (itemClean.includes('last of us part 2') || itemClean.includes('last of us part ii'))
    ) {
      return true;
    }

    // God of War
    if (seqClean.includes('ragnarok') && itemClean.includes('ragnarok')) return true;

    // Elden Ring Shadow of the Erdtree
    if (seqClean.includes('shadow of the erdtree') || seqClean.includes('erdtree')) {
      if (itemClean.includes('shadow of the erdtree') || itemClean.includes('erdtree')) return true;
    }

    // The Witcher
    if (
      (seqClean.includes('witcher 4') || seqClean.includes('polaris')) &&
      (itemClean.includes('witcher 4') || itemClean.includes('polaris'))
    ) {
      return true;
    }

    // GTA
    if (
      (seqClean.includes('gta 6') || seqClean.includes('gta vi')) &&
      (itemClean.includes('gta 6') || itemClean.includes('gta vi'))
    ) {
      return true;
    }

    // Astro Bot
    if (seqClean.includes('astro bot') && !seqClean.includes('playroom')) {
      if (itemClean.includes('astro bot') && !itemClean.includes('playroom')) return true;
    }

    // Dune
    if (
      (seqClean.includes('dune part 2') || seqClean.includes('dune 2') || seqClean.includes('dune messiah')) &&
      (itemClean.includes('dune part 2') ||
        itemClean.includes('dune 2') ||
        itemClean.includes('dune messiah') ||
        itemClean.includes('herr des wustenplaneten'))
    ) {
      return true;
    }

    // Shows and Anime Seasons: if the user's item has currentSeason or totalSeasons >= sequel season, or is completed
    if (item.type === 'show' || item.type === 'anime') {
      const isCompleted = item.status === 'completed';
      const isPastRelease = sequel.status === 'released';

      // If user marked anime/show as completed, already-aired past seasons (like Assassination Classroom Season 2 from 2016) are finished
      if (isCompleted && isPastRelease) {
        const baseSeqTitle = seqClean.replace(/(?:season|staffel|part|teil)\s*\d+.*$/, '').trim();
        const baseItemTitle = itemClean.replace(/(?:season|staffel|part|teil)\s*\d+.*$/, '').trim();
        if (baseSeqTitle && baseItemTitle && (baseSeqTitle.includes(baseItemTitle) || baseItemTitle.includes(baseSeqTitle))) {
          return true;
        }
      }

      const seasonMatch = seqClean.match(/season\s*(\d+)/);
      if (seasonMatch && seasonMatch[1]) {
        const targetSeason = parseInt(seasonMatch[1], 10);
        const itemSeason = Math.max(item.progress?.currentSeason || 1, item.progress?.totalSeasons || 1);
        const baseSeqTitle = seqClean.replace(/season\s*\d+.*$/, '').trim();
        const baseItemTitle = itemClean.replace(/season\s*\d+.*$/, '').trim();
        if (baseSeqTitle && baseItemTitle && (baseSeqTitle.includes(baseItemTitle) || baseItemTitle.includes(baseSeqTitle))) {
          if (itemSeason >= targetSeason || isCompleted) {
            return true;
          }
        }
      }
    }

    // Anime Staffeln / Seasons
    if (seqClean.includes('frieren') && seqClean.includes('season 2')) {
      if (itemClean.includes('frieren') && (itemClean.includes('season 2') || itemClean.includes('2'))) return true;
    }
    if (seqClean.includes('jujutsu kaisen') && (seqClean.includes('season 2') || seqClean.includes('season 3'))) {
      if (itemClean.includes('jujutsu kaisen') && (itemClean.includes('season 3') || itemClean.includes('3'))) return true;
    }
    if (seqClean.includes('demon slayer') && (seqClean.includes('mugen train') || seqClean.includes('season 2'))) {
      if (itemClean.includes('demon slayer') && (itemClean.includes('mugen train') || itemClean.includes('season 2') || itemClean.includes('2'))) return true;
    }
    if (seqClean.includes('attack on titan') && seqClean.includes('season 2')) {
      if (itemClean.includes('attack on titan') && (itemClean.includes('season 2') || itemClean.includes('2'))) return true;
    }

    // Hollow Knight Silksong
    if (seqClean.includes('silksong') && itemClean.includes('silksong')) return true;

    // Books: Herr der Ringe & Trisolaris
    if (
      (seqClean.includes('zwei turme') || seqClean.includes('two towers')) &&
      (itemClean.includes('zwei turme') || itemClean.includes('two towers'))
    ) {
      return true;
    }
    if (
      (seqClean.includes('dunkle wald') || seqClean.includes('dark forest')) &&
      (itemClean.includes('dunkle wald') || itemClean.includes('dark forest'))
    ) {
      return true;
    }

    // General high word overlap with matching numbers
    const seqWords = seqClean.split(' ').filter((w) => w.length > 2);
    const itemWords = itemClean.split(' ').filter((w) => w.length > 2);
    if (seqWords.length >= 2 && itemWords.length >= 2) {
      const matchCount = seqWords.filter((w) => itemWords.includes(w)).length;
      const ratio = matchCount / Math.max(seqWords.length, itemWords.length);
      if (ratio >= 0.75) {
        const seqNums = seqClean.match(/\b(?:\d+|i+|iv|v|vi|vii|viii)\b/g) || [];
        const itemNums = itemClean.match(/\b(?:\d+|i+|iv|v|vi|vii|viii)\b/g) || [];
        if (seqNums.length > 0 && itemNums.length > 0) {
          const hasCommonNum = seqNums.some((n) => {
            const nv = new Set([n, ...getNumberVariants(n)]);
            return itemNums.some((m) => nv.has(m));
          });
          if (hasCommonNum) return true;
        } else if (seqNums.length === 0 && itemNums.length === 0) {
          const diffWords = seqWords
            .filter((w) => !itemWords.includes(w))
            .concat(itemWords.filter((w) => !seqWords.includes(w)));
          const ignorable = new Set([
            'edition',
            'version',
            'remastered',
            'definitive',
            'part',
            'teil',
            'staffel',
            'season',
            'arc',
            'the',
            'erweiterung',
          ]);
          const nonIgnorableDiff = diffWords.filter((w) => !ignorable.has(w));
          if (nonIgnorableDiff.length === 0) return true;
        }
      }
    }

    return false;
  });
}

/**
 * Cleans stale, duplicate, or invalid sequels from a list against the user's media library and dismiss list.
 */
export function cleanStaleSequels(
  sequels: SequelNotification[],
  library: MediaItem[],
  dismissedSet?: Set<string>
): SequelNotification[] {
  if (!sequels || sequels.length === 0) return [];
  const dismissed = dismissedSet || new Set(getDismissedSequelKeys());

  const libraryTitles = new Set(
    library.map((m) => normalizeSequelMatchKey(m.title)).filter(Boolean)
  );
  const libraryOrigTitles = new Set(
    library.map((m) => normalizeSequelMatchKey(m.originalTitle || '')).filter(Boolean)
  );
  const libraryIds = new Set(library.map((m) => m.id));

  const seenSequelTitleKeys = new Set<string>();
  const cleaned: SequelNotification[] = [];

  for (const s of sequels) {
    if (!s) continue;

    const pNorm = normalizeSequelMatchKey(s.parentMediaTitle || '');
    const sNorm = normalizeSequelMatchKey(s.sequelTitle || '');

    // 1. Check if dismissed by user
    if (isSequelDismissed(s, dismissed)) {
      continue;
    }

    // 2. Check if already owned / present in library
    if (isSequelInLibrary(s, library)) {
      continue;
    }

    // 3. Purge known invalid historical pairings (e.g. God of War III -> Ragnarök)
    if (
      pNorm.includes('god of war') &&
      (pNorm.includes('iii') || pNorm.includes(' 3') || pNorm.endsWith(' 3') || pNorm.includes('three')) &&
      sNorm.includes('ragnarok')
    ) {
      continue;
    }

    // 4. If parent no longer exists in library at all
    if (s.parentMediaId && !libraryIds.has(s.parentMediaId)) {
      if (!s.parentMediaTitle || (!libraryTitles.has(pNorm) && !libraryOrigTitles.has(pNorm))) {
        continue;
      }
    }

    // 5. If the sequel title itself is already an exact item title in the library
    if (libraryTitles.has(sNorm) || libraryOrigTitles.has(sNorm)) {
      continue;
    }

    // 6. Deduplicate by normalized sequel title (e.g. only one Batman Arkham City card)
    if (sNorm) {
      if (seenSequelTitleKeys.has(sNorm)) {
        continue;
      }
      seenSequelTitleKeys.add(sNorm);
    }

    cleaned.push(s);
  }

  return cleaned;
}
