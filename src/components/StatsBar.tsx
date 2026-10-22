'use client';

import React from 'react';
import { Film, CheckCircle2, Clock, Radar, Flame, BookmarkCheck } from 'lucide-react';
import { MediaItem, SequelNotification, MediaType, MediaStatus } from '@/types/media';
import { cn } from '@/lib/utils';
import { isSequelInLibrary, isSequelDismissed } from '@/lib/sequels';

interface StatsBarProps {
  media: MediaItem[];
  sequels: SequelNotification[];
  selectedType?: MediaType | 'all';
  selectedStatus?: MediaStatus | 'all';
  onSelectStatus?: (status: MediaStatus | 'all') => void;
  onOpenSequelRadar: () => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  media,
  sequels,
  selectedType = 'all',
  selectedStatus,
  onSelectStatus,
  onOpenSequelRadar,
}) => {
  const isAllType = selectedType === 'all';
  const relevantMedia = isAllType ? media : media.filter((m) => m.type === selectedType);

  const plannedCount = relevantMedia.filter((m) => m.status === 'planned').length;
  const inProgressCount = relevantMedia.filter((m) => m.status === 'in_progress').length;
  const completedCount = relevantMedia.filter((m) => m.status === 'completed').length;

  const isSequelActive = (s: SequelNotification) =>
    !s.isDismissed && !s.isAdded && !isSequelDismissed(s) && !isSequelInLibrary(s, media);

  const sequelCount = isAllType
    ? sequels.filter(isSequelActive).length
    : sequels.filter(
        (s) =>
          isSequelActive(s) &&
          (s.parentMediaType === selectedType || s.sequelType === selectedType)
      ).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
      {/* Slot 1: Gesamtsammlung (All) OR Geplant (Specific Category) */}
      {isAllType ? (
        <div
          onClick={() => onSelectStatus?.('all')}
          className={cn(
            'p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#181B22] border border-[#282D37] flex items-center gap-2.5 sm:gap-3.5 shadow-sm transition-all',
            onSelectStatus && 'cursor-pointer hover:border-zinc-600',
            selectedStatus === 'all' && onSelectStatus && 'ring-1 ring-zinc-500/40 bg-zinc-800/40'
          )}
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0">
            <Film className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-wider block truncate">
              Gesamt
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-[#F1F3F7] tracking-tight">
              {relevantMedia.length}
            </span>
          </div>
        </div>
      ) : (
        <div
          onClick={() => onSelectStatus?.(selectedStatus === 'planned' ? 'all' : 'planned')}
          className={cn(
            'p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#181B22] border border-[#282D37] flex items-center gap-2.5 sm:gap-3.5 shadow-sm transition-all',
            onSelectStatus && 'cursor-pointer hover:border-sky-500/50',
            selectedStatus === 'planned' && onSelectStatus && 'ring-1 ring-sky-500/50 bg-sky-500/10 border-sky-500/40'
          )}
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
            <BookmarkCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-wider block truncate">
              Geplant
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-sky-400 tracking-tight">
              {plannedCount}
            </span>
          </div>
        </div>
      )}

      {/* Slot 2: Currently In Progress */}
      <div
        onClick={() => onSelectStatus?.(selectedStatus === 'in_progress' ? 'all' : 'in_progress')}
        className={cn(
          'p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#181B22] border border-[#282D37] flex items-center gap-2.5 sm:gap-3.5 shadow-sm transition-all',
          onSelectStatus && 'cursor-pointer hover:border-emerald-500/50',
          selectedStatus === 'in_progress' && onSelectStatus && 'ring-1 ring-emerald-500/50 bg-emerald-500/10 border-emerald-500/40'
        )}
      >
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-wider block truncate">
            Gerade dabei
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-emerald-400 tracking-tight">
            {inProgressCount}
          </span>
        </div>
      </div>

      {/* Slot 3: Completed */}
      <div
        onClick={() => onSelectStatus?.(selectedStatus === 'completed' ? 'all' : 'completed')}
        className={cn(
          'p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#181B22] border border-[#282D37] flex items-center gap-2.5 sm:gap-3.5 shadow-sm transition-all',
          onSelectStatus && 'cursor-pointer hover:border-indigo-500/50',
          selectedStatus === 'completed' && onSelectStatus && 'ring-1 ring-indigo-500/50 bg-indigo-500/10 border-indigo-500/40'
        )}
      >
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-wider block truncate">
            Beendet
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-[#F1F3F7] tracking-tight">
            {completedCount}
          </span>
        </div>
      </div>

      {/* Slot 4: Sequel Radar Alert Card */}
      <div
        onClick={onOpenSequelRadar}
        className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-rose-950/30 via-[#181B22] to-[#181B22] border border-rose-500/40 hover:border-rose-400 flex items-center justify-between cursor-pointer transition-all group shadow-sm hover:shadow-rose-950/20"
      >
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform shrink-0">
            <Radar className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1 truncate">
              <Flame className="w-3 h-3 text-rose-400 shrink-0" />
              Radar
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-[#F1F3F7] tracking-tight">
              {sequelCount} {sequelCount === 1 ? 'Treffer' : 'Treffer'}
            </span>
          </div>
        </div>
        <span className="text-xs font-bold text-rose-400 group-hover:translate-x-0.5 transition-transform shrink-0 ml-1">
          &rarr;
        </span>
      </div>
    </div>
  );
};
