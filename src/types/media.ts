export type MediaType = 'movie' | 'show' | 'anime' | 'book' | 'game';

export type MediaStatus = 'in_progress' | 'planned' | 'completed' | 'paused' | 'dropped' | 'owned' | 'live_service';

export type ProgressUnit = 'episodes' | 'pages' | 'hours' | 'minutes' | 'seasons' | 'chapters';

export type ConnectedGameService = 'steam' | 'psn' | 'gog';

export type GalaxySortKey =
  | 'achievements'
  | 'critics_rating'
  | 'date_added'
  | 'game_time'
  | 'genre'
  | 'last_played'
  | 'platform'
  | 'rating'
  | 'release_date'
  | 'size_on_disk'
  | 'tags'
  | 'title';

export type GalaxyGroupKey = 'none' | 'platform' | 'status' | 'genre' | 'release_year';

export interface GalaxyFilterState {
  // Videospiele
  platforms: string[]; // 'steam' | 'psn' | 'gog' | 'epic' | 'other'
  consoles: string[]; // 'PS5' | 'PS4' | 'PS3' | 'PC' | 'other'

  // Gemeinsame Filter
  ratings: string[]; // '90' | '80' | '70' | 'stars5' | 'stars4' | 'stars3'
  tags: string[]; // genre/tag names
  statuses: string[]; // MediaStatus values
  ownership?: string[]; // 'owned' | 'wishlist'

  // Filme, Serien & Anime
  eras?: string[]; // '2020s' | '2010s' | '2000s' | '1990s' | 'classic'
  formats?: string[]; // 'miniseries' | 'compact' | 'longrunning' | 'anime_tv' | 'anime_movie' | 'anime_ova'

  // Bücher
  bookFormats?: string[]; // 'physical' | 'ebook' | 'audiobook'
  pageLengths?: string[]; // 'short' | 'medium' | 'long'

  // Alle Medien ('all')
  types?: string[]; // 'game' | 'movie' | 'show' | 'anime' | 'book'
}

export interface GameConnectionInfo {
  service: ConnectedGameService;
  serviceId?: string; // z. B. Steam AppID oder PSN Title ID
  serviceName: string; // 'Steam', 'PlayStation Network', 'GOG Galaxy'
  platform?: string; // z. B. 'PS5', 'PS4'
  playtimeMinutes?: number;
  lastPlayed?: string;
  connectedAt?: string;
  accountUsername?: string;
}

export interface GameTracker {
  storyCompleted?: boolean;
  completionist100?: boolean;
  allAchievementsCompleted?: boolean; // Checkbox: Alle Erfolge freigeschaltet (100% Achievements)
  isLiveService?: boolean; // Live-Service / Endless Multiplayer ohne Kampagnen-Ende
  achievements?: {
    current: number;
    total: number;
  };
  playtimeHours?: number; // Offene Spielzeit ohne Maximalgrenze
}

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
  isOwned?: boolean; // Gekauft / Im physischen oder digitalen Besitz
  isLiveService?: boolean; // Live-Service / Endlos-Spiel ohne klassisches Kampagnen-Ende
  coverUrl: string;
  bannerUrl?: string;
  rating?: number; // 0 - 5 scale, e.g. 4.5 (Persönliche Bewertung des Nutzers)
  metacritic?: number; // Metacritic / Metascore (0 - 100)
  communityRating?: number; // Reale externe Leser-/Community-Bewertung (z. B. von Open Library oder TMDB)
  communityRatingsCount?: number; // Anzahl der externen Bewertungen
  releaseDate?: string;
  summary?: string;
  notes?: string; // Persönliche Notizen & Gedanken des Nutzers
  genres?: string[];
  creator?: string; // Regisseur, Autor, Studio, Entwickler
  publisher?: string; // Buchverlag, Game Publisher, Studio
  isbn?: string; // Für Bücher: ISBN-10 oder ISBN-13
  progress: MediaProgress;
  gameTracker?: GameTracker; // Spezieller Tracker für Videospiele (Story, 100%, Achievements, offene Spielzeit)
  connectedService?: ConnectedGameService; // 'steam' | 'psn' | 'gog'
  gameConnection?: GameConnectionInfo; // Details zur Plattform-Verbindung
  external_id: string; // e.g. "tmdb:1234", "anilist:5678", "rawg:456", "googlebooks:abc", "steam:1091500"
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
  publisher?: string;
  isbn?: string;
  editionKey?: string;
  editionCount?: number;
  external_id: string;
  franchise_id?: string;
  collection_name?: string;
  totalUnits?: number;
  totalSeasons?: number;
  unit: ProgressUnit;
  rating?: number;
  metacritic?: number;
  isLiveService?: boolean;
  communityRating?: number;
  communityRatingsCount?: number;
}
