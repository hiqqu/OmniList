import { MediaItem, SequelNotification } from '@/types/media';

// The application starts clean with an empty library without demo data.
export const INITIAL_MEDIA_ITEMS: MediaItem[] = [];

export const INITIAL_SEQUEL_NOTIFICATIONS: SequelNotification[] = [];

// Historical demo item IDs used for migrating and clearing legacy seed entries from localStorage
export const LEGACY_DEMO_MEDIA_IDS = new Set([
  'media-frieren-1',
  'media-dune-1',
  'media-severance-1',
  'media-arcane-1',
  'media-habits-1',
  'media-spiderman-1',
  'media-oppenheimer-1',
  'media-shogun-1',
  'media-apothecary-1',
  'media-sololeveling-1',
  'media-dune-book-1',
  'media-1984-1',
  'media-eldenring-1',
  'media-cyberpunk-1',
]);

export const LEGACY_DEMO_SEQUEL_IDS = new Set([
  'seq-seed-frieren-s2',
  'seq-seed-dune-2',
  'seq-seed-severance-2',
  'seq-seed-elden-erdtree',
]);
