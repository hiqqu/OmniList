'use client';

import React from 'react';
import { Sparkles, Calendar, Plus, Play, X, Flame } from 'lucide-react';
import { SequelNotification, MediaStatus } from '@/types/media';
import { getMediaTypeBadge, cn } from '@/lib/utils';

interface SequelCardProps {
  sequel: SequelNotification;
  onAccept: (sequel: SequelNotification, status: MediaStatus) => void;
  onDismiss: (id: string) => void;
}

export const SequelCard: React.FC<SequelCardProps> = ({ sequel, onAccept, onDismiss }) => {
  const typeBadge = getMediaTypeBadge(sequel.sequelType);

  const isAvailableNow =
    sequel.status === 'released' ||
    sequel.badgeText.toLowerCase().includes('verfügbar') ||
    sequel.badgeText.toLowerCase().includes('erschienen');

  const isAnnounced =
    sequel.status === 'announced' ||
    sequel.badgeText.toLowerCase().includes('angekündigt');

  return (
    <div className="relative group bg-[#181B22] rounded-2xl overflow-hidden border border-[#282D37] hover:border-rose-500/40 shadow-xl hover:shadow-2xl hover:shadow-rose-950/20 transition-all duration-300 flex flex-col sm:flex-row">
      {/* Visual glowing accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-indigo-500" />

      {/* Poster Image / Cover */}
      <div className="relative w-full sm:w-40 md:w-48 h-44 sm:h-auto aspect-[16/9] sm:aspect-poster sm:min-h-[200px] flex-shrink-0 overflow-hidden bg-[#0F1117]">
        <img
          src={sequel.sequelCoverUrl}
          alt={sequel.sequelTitle}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = sequel.parentCoverUrl;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#181B22] via-transparent to-transparent sm:hidden" />

        {/* Media type badge */}
        <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3">
          <span
            className={cn(
              'px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold tracking-wider uppercase shadow-md backdrop-blur border',
              typeBadge.bgClass,
              typeBadge.colorClass,
              typeBadge.borderClass
            )}
          >
            {typeBadge.label}
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-3.5 sm:p-4 md:p-5 flex-1 flex flex-col justify-between gap-2.5 sm:gap-3">
        <div>
          {/* Top Info Header */}
          <div className="flex items-start justify-between gap-2.5">
            <div className="space-y-0.5 sm:space-y-1 min-w-0">
              {/* Parent info indicator */}
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-rose-300 font-semibold tracking-wide truncate">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-rose-400 shrink-0" style={{ animationDuration: '6s' }} />
                <span className="truncate">Fortsetzung zu: {sequel.parentMediaTitle}</span>
              </div>

              {/* Sequel Title */}
              <h3 className="text-sm sm:text-base md:text-lg font-bold text-[#F1F3F7] group-hover:text-rose-300 transition-colors line-clamp-1">
                {sequel.sequelTitle}
              </h3>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => onDismiss(sequel.id)}
              className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-[#F1F3F7] flex items-center justify-center transition-colors flex-shrink-0"
              title="Ignorieren"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Radar Info Badges */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold tracking-wide border',
                isAvailableNow
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                  : isAnnounced
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
              )}
            >
              <Flame className="w-3 h-3 text-current" />
              {sequel.badgeText}
            </span>

            {sequel.releaseDate && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-zinc-900 text-zinc-400 border border-zinc-800">
                <Calendar className="w-3 h-3 text-zinc-400" />
                {sequel.releaseDate}
              </span>
            )}
          </div>

          {/* Description */}
          {sequel.description && (
            <p className="text-[11px] sm:text-xs text-zinc-400 mt-2 line-clamp-2 md:line-clamp-3 leading-relaxed">
              {sequel.description}
            </p>
          )}
        </div>

        {/* 1-Click Action Buttons */}
        <div className="pt-2.5 sm:pt-3 border-t border-[#282D37] flex flex-wrap items-center gap-2">
          <button
            onClick={() => onAccept(sequel, 'planned')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-950/40 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Zu &quot;Geplant&quot;</span>
          </button>

          <button
            onClick={() => onAccept(sequel, 'in_progress')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-[#F1F3F7] font-semibold text-xs border border-zinc-700 transition-all active:scale-95"
          >
            <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
            <span>Direkt starten</span>
          </button>
        </div>
      </div>
    </div>
  );
};
