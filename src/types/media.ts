export type MediaType = 'movie' | 'show' | 'anime' | 'book' | 'game';

export type MediaStatus = 'in_progress' | 'planned' | 'completed' | 'paused' | 'dropped';

export type ProgressUnit = 'episodes' | 'pages' | 'hours' | 'seasons' | 'chapters';

export interface MediaProgress {
  current: number;
  total?: number;
  unit: ProgressUnit;
  currentSeason?: number;
  totalSeasons?: number;
}

export interface MediaItem {
  id: string;
  title: string;
  originalTitle?: string;
  type: MediaType;
  status: MediaStatus;
  coverUrl: string;
  bannerUrl?: string;
  rating?: number; // 0 - 5 scale, e.g. 4.5
  releaseDate?: string;
  summary?: string;
  genres?: string[];
  creator?: string; // Regisseur, Autor, Studio, Entwickler
  progress: MediaProgress;
  external_id: string; // e.g. "tmdb:1234", "anilist:5678", "rawg:456", "googlebooks:abc"
  franchise_id?: string; // Grouping related works (e.g. "tmdb:collection:87118" or "dune-saga")
  collection_name?: string;
  last_sequel_check?: string; // ISO Date String
  createdAt: string;
  updatedAt: string;
}

export type SequelReleaseStatus = 'releasing' | 'announced' | 'released';

export interface SequelNotification {
  id: string;
  parentMediaId: string;
  parentMediaTitle: string;
  parentMediaType: MediaType;
  parentCoverUrl: string;
  sequelTitle: string;
  sequelType: MediaType;
  sequelCoverUrl: string;
  releaseDate?: string;
  status: SequelReleaseStatus;
  badgeText: string; // "Staffel 2 verfügbar", "Startet am: [Datum]", "Neu angekündigt"
  external_id: string;
  franchise_id?: string;
  description?: string;
  detectedAt: string;
  isDismissed?: boolean;
  isAdded?: boolean;
  progressSuggestion?: MediaProgress;
}

export interface SearchResultItem {
  id: string;
  title: string;
  originalTitle?: string;
  type: MediaType;
  coverUrl: string;
  bannerUrl?: string;
  releaseDate?: string;
  summary?: string;
  genres?: string[];
  creator?: string;
  external_id: string;
  franchise_id?: string;
  collection_name?: string;
  totalUnits?: number;
  totalSeasons?: number;
  unit: ProgressUnit;
  rating?: number;
}
