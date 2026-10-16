import { MediaType, SearchResultItem, MediaItem, SequelNotification } from '@/types/media';
import { MediaAdapter } from './types';
import { TMDBAdapter, POPULAR_TMDB_CATALOG } from './tmdb';
import { AniListAdapter } from './anilist';
import { GoogleBooksAdapter, POPULAR_BOOKS_CATALOG } from './googlebooks';
import { RAWGAdapter, POPULAR_GAMES_CATALOG } from './rawg';
import { searchCache } from '../cache';

const tmdbAdapter = new TMDBAdapter();
const anilistAdapter = new AniListAdapter();
const booksAdapter = new GoogleBooksAdapter();
const rawgAdapter = new RAWGAdapter();

export function getAdapter(type: MediaType): MediaAdapter {
  switch (type) {
    case 'movie':
    case 'show':
      return tmdbAdapter;
    case 'anime':
      return anilistAdapter;
    case 'book':
      return booksAdapter;
    case 'game':
      return rawgAdapter;
    default:
      return tmdbAdapter;
  }
}

export async function searchMedia(query: string, type: MediaType): Promise<SearchResultItem[]> {
  const qClean = (query || '').toLowerCase().trim();

  // If query is empty, return popular / trending recommendations
  if (!qClean) {
    if (type === 'movie' || type === 'show') {
      return POPULAR_TMDB_CATALOG;
    }
    if (type === 'book') {
      return POPULAR_BOOKS_CATALOG;
    }
    if (type === 'game') {
      return POPULAR_GAMES_CATALOG;
    }
    if (type === 'anime') {
      const adapter = getAdapter('anime');
      return await adapter.search('');
    }
  }

  const cacheKey = `search:${type}:${qClean}`;
  const cached = searchCache.get<SearchResultItem[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const adapter = getAdapter(type);
  const results = await adapter.search(qClean);

  searchCache.set(cacheKey, results);
  return results;
}

export async function checkSequelsForLibrary(items: MediaItem[]): Promise<SequelNotification[]> {
  const notifications: SequelNotification[] = [];

  for (const item of items) {
    // Only check sequels for media that are in_progress or completed (as specified in prompt requirement 2)
    if (item.status !== 'completed' && item.status !== 'in_progress') {
      continue;
    }

    try {
      const adapter = getAdapter(item.type);
      const sequel = await adapter.checkSequels(item);
      if (sequel) {
        notifications.push(sequel);
      }
    } catch (e) {
      console.warn(`Sequel check failed for item ${item.title}:`, e);
    }
  }

  return notifications;
}
