import { SearchResultItem, MediaItem, SequelNotification } from '@/types/media';

export interface MediaAdapter {
  search(query: string): Promise<SearchResultItem[]>;
  checkSequels(item: MediaItem): Promise<SequelNotification | null>;
}
