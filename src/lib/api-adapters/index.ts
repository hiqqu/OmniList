import { MediaType, SearchResultItem, MediaItem, SequelNotification } from '@/types/media';
import { MediaAdapter } from './types';
import { TMDBAdapter } from './tmdb';
import { AniListAdapter } from './anilist';
import { GoogleBooksAdapter } from './googlebooks';
import { RAWGAdapter } from './rawg';
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
  const cacheKey = `search:${type}:${query.toLowerCase().trim()}`;
  const cached = searchCache.get<SearchResultItem[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const adapter = getAdapter(type);
  const results = await adapter.search(query);

  // Filter results to match the requested type if movie vs show
  const filtered = results.filter((item) => {
    if (type === 'movie' || type === 'show') {
      // allow movie adapter to return both if requested, or filter by specific type
      return item.type === type;
    }
    return item.type === type;
  });

  // If filtered is empty because user searched movie under show or vice-versa, return results
  const finalResults = filtered.length > 0 ? filtered : results;

  searchCache.set(cacheKey, finalResults);
  return finalResults;
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
