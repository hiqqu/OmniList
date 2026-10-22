import { MediaItem, SequelNotification } from '@/types/media';
import { normalizeMetacriticKey, getNumberVariants } from '@/lib/metacritic';

export const DISMISSED_SEQUELS_STORAGE_KEY = 'omnilist_dismissed_sequels_v1';
export const LEGACY_DISMISSED_SEQUELS_STORAGE_KEY = 'omnitrack_dismissed_sequels_v1';

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

  // 1. Check direct ID
  if (sequel.id && set.has(sequel.id.trim().toLowerCase())) {
    return true;
  }

  // 2. Check external_id
  if (sequel.external_id && set.has(sequel.external_id.trim().toLowerCase())) {
    return true;
  }

  // 3. Check normalized sequel title & variants
  const cleanTitle = normalizeSequelMatchKey(sequel.sequelTitle);
  if (cleanTitle) {
    if (set.has(cleanTitle)) return true;
    for (const v of getNumberVariants(cleanTitle)) {
      if (set.has(v)) return true;
    }
  }

  // 4. Franchise ID if present
  if (sequel.franchise_id && set.has(sequel.franchise_id.trim().toLowerCase())) {
    return true;
  }

  return false;
}

/**
 * Normalizes a title for robust sequel matching across editions, Roman numerals, and languages.
 */
export function normalizeSequelMatchKey(title: string): string {
  if (!title) return '';
  let s = normalizeMetacriticKey(title);
  // Remove publisher / studio / platform prefixes
  s = s.replace(/^marvels\s+/, '');
  s = s.replace(/^the\s+/, '');
  s = s.replace(/^disneys\s+/, '');
  // Normalize Grand Theft Auto <-> GTA
  s = s.replace(/\bgrand theft auto\b/g, 'gta');
  // Normalize German/English series designations
  s = s.replace(/\bstaffel\b/g, 'season');
  s = s.replace(/\bteil\b/g, 'part');
  s = s.replace(/\bband\b/g, 'part');
  return s.replace(/\s+/g, ' ').trim();
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
  const seqVariants = new Set<string>([seqClean, ...getNumberVariants(seqClean)]);

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

    // 2. Direct clean title match & Roman/Arabic number variants
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

    // 3. Known franchise specific matching rules:
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
    if (seqClean.includes('shadow of the erdtree') && itemClean.includes('shadow of the erdtree')) return true;

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

    // Anime Staffeln / Seasons
    if (seqClean.includes('frieren') && seqClean.includes('season 2')) {
      if (itemClean.includes('frieren') && (itemClean.includes('season 2') || itemClean.includes('2'))) return true;
    }
    if (seqClean.includes('jujutsu kaisen') && seqClean.includes('season 2')) {
      if (itemClean.includes('jujutsu kaisen') && (itemClean.includes('season 2') || itemClean.includes('2'))) return true;
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
