import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MediaType, MediaStatus, MediaItem } from '@/types/media';
import { isLiveServiceGame } from './live-service';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getMediaTypeBadge(type: MediaType): { label: string; colorClass: string; bgClass: string; borderClass: string } {
  switch (type) {
    case 'movie':
      return {
        label: 'Film',
        colorClass: 'text-rose-400',
        bgClass: 'bg-rose-500/15',
        borderClass: 'border-rose-500/30',
      };
    case 'show':
      return {
        label: 'Serie',
        colorClass: 'text-amber-400',
        bgClass: 'bg-amber-500/15',
        borderClass: 'border-amber-500/30',
      };
    case 'anime':
      return {
        label: 'Anime',
        colorClass: 'text-blue-400',
        bgClass: 'bg-blue-500/15',
        borderClass: 'border-blue-500/30',
      };
    case 'book':
      return {
        label: 'Buch',
        colorClass: 'text-orange-400',
        bgClass: 'bg-orange-500/15',
        borderClass: 'border-orange-500/30',
      };
    case 'game':
      return {
        label: 'Spiel',
        colorClass: 'text-purple-400',
        bgClass: 'bg-purple-500/15',
        borderClass: 'border-purple-500/30',
      };
  }
}

export function getMediaStatusBadge(status: MediaStatus): { label: string; colorClass: string; bgClass: string } {
  switch (status) {
    case 'in_progress':
      return { label: 'Gerade dabei', colorClass: 'text-emerald-400', bgClass: 'bg-emerald-500/15' };
    case 'planned':
      return { label: 'Geplant', colorClass: 'text-sky-400', bgClass: 'bg-sky-500/15' };
    case 'completed':
      return { label: 'Beendet', colorClass: 'text-indigo-400', bgClass: 'bg-indigo-500/15' };
    case 'paused':
      return { label: 'Pausiert', colorClass: 'text-amber-400', bgClass: 'bg-amber-500/15' };
    case 'dropped':
      return { label: 'Abgebrochen', colorClass: 'text-red-400', bgClass: 'bg-red-500/15' };
    case 'owned':
      return { label: 'Im Besitz', colorClass: 'text-emerald-300', bgClass: 'bg-emerald-500/15' };
    case 'live_service':
      return { label: 'Live-Service', colorClass: 'text-cyan-300', bgClass: 'bg-cyan-500/15' };
  }
}

export function getEffectiveMediaStatusBadge(item: MediaItem): {
  label: string;
  colorClass: string;
  bgClass: string;
  isLiveService?: boolean;
} {
  const isLive = item.type === 'game' && isLiveServiceGame(item);
  if (isLive && item.status !== 'planned') {
    return {
      label: 'Live-Service',
      colorClass: 'text-cyan-300',
      bgClass: 'bg-cyan-500/15',
      isLiveService: true,
    };
  }
  return getMediaStatusBadge(item.status);
}

export function getUnitIncrement(type: MediaType, unit?: string): { amount: number; label: string } {
  if (type === 'movie' || unit === 'minutes') {
    return { amount: 15, label: '+15 Min.' };
  }
  if (type === 'book' || unit === 'pages') {
    return { amount: 10, label: '+10 S.' };
  }
  if (type === 'game' || unit === 'hours') {
    return { amount: 1, label: '+1 Std.' };
  }
  return { amount: 1, label: '+1 Ep.' };
}

export function getProgressUnitLabel(type: MediaType, unit?: string): string {
  if (type === 'movie' || unit === 'minutes') return 'Min.';
  if (type === 'book' || unit === 'pages') return 'Seiten';
  if (type === 'game' || unit === 'hours') return 'Std.';
  if (unit === 'chapters') return 'Kapitel';
  if (unit === 'seasons') return 'Staffeln';
  return 'Episoden';
}

