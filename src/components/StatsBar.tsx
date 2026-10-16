'use client';

import React from 'react';
import { Film, CheckCircle2, Clock, Radar, Flame } from 'lucide-react';
import { MediaItem, SequelNotification } from '@/types/media';

interface StatsBarProps {
  media: MediaItem[];
  sequels: SequelNotification[];
  onOpenSequelRadar: () => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({ media, sequels, onOpenSequelRadar }) => {
  const inProgressCount = media.filter((m) => m.status === 'in_progress').length;
  const completedCount = media.filter((m) => m.status === 'completed').length;
  const unhandledSequelCount = sequels.filter((s) => !s.isDismissed && !s.isAdded).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {/* Total Library */}
      <div className="p-4 rounded-2xl bg-[#181B22] border border-[#282D37] flex items-center gap-3.5 shadow-sm">
        <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
          <Film className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Gesamtsammlung</span>
          <span className="text-xl font-extrabold text-[#F1F3F7] tracking-tight">{media.length}</span>
        </div>
      </div>

      {/* Currently In Progress */}
      <div className="p-4 rounded-2xl bg-[#181B22] border border-[#282D37] flex items-center gap-3.5 shadow-sm">
        <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Gerade dabei</span>
          <span className="text-xl font-extrabold text-emerald-400 tracking-tight">{inProgressCount}</span>
        </div>
      </div>

      {/* Completed */}
      <div className="p-4 rounded-2xl bg-[#181B22] border border-[#282D37] flex items-center gap-3.5 shadow-sm">
        <div className="w-10 h-10 rounded-full bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Abgeschlossen</span>
          <span className="text-xl font-extrabold text-[#F1F3F7] tracking-tight">{completedCount}</span>
        </div>
      </div>

      {/* Sequel Radar Alert Card */}
      <div
        onClick={onOpenSequelRadar}
        className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/30 via-[#181B22] to-[#181B22] border border-rose-500/40 hover:border-rose-400 flex items-center justify-between cursor-pointer transition-all group shadow-sm hover:shadow-rose-950/20"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
            <Radar className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3 h-3 text-rose-400" />
              Sequel Radar
            </span>
            <span className="text-xl font-extrabold text-[#F1F3F7] tracking-tight">
              {unhandledSequelCount} {unhandledSequelCount === 1 ? 'Treffer' : 'Treffer'}
            </span>
          </div>
        </div>
        <span className="text-xs font-bold text-rose-400 group-hover:translate-x-0.5 transition-transform">
          Ansehen &rarr;
        </span>
      </div>
    </div>
  );
};
