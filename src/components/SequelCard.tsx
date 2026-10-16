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
    <div className="relative group bg-[#181B22] rounded-2xl overflow-hidden border border-[#282D37] hover:border-rose-500/40 shadow-xl hover:shadow-2xl hover:shadow-rose-950/20 transition-all duration-300 flex flex-col md:flex-row">
      {/* Visual glowing accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-indigo-500" />

      {/* Poster Image / Cover */}
      <div className="relative md:w-48 aspect-poster md:aspect-auto md:min-h-[220px] flex-shrink-0 overflow-hidden bg-[#0F1117]">
        <img
          src={sequel.sequelCoverUrl}
          alt={sequel.sequelTitle}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = sequel.parentCoverUrl;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#181B22] via-transparent to-transparent md:hidden" />

        {/* Media type badge */}
        <div className="absolute top-3 left-3">
          <span
            className={cn(
              'px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase shadow-md backdrop-blur border',
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
      <div className="p-4 md:p-5 flex-1 flex flex-col justify-between gap-3">
        <div>
          {/* Top Info Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              {/* Parent info indicator */}
              <div className="flex items-center gap-1.5 text-xs text-rose-300 font-semibold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-rose-400" style={{ animationDuration: '6s' }} />
                <span>Fortsetzung zu: {sequel.parentMediaTitle}</span>
              </div>

              {/* Sequel Title */}
              <h3 className="text-base md:text-lg font-bold text-[#F1F3F7] group-hover:text-rose-300 transition-colors">
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
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span
              className={cn(
                'inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold tracking-wide border',
                isAvailableNow
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                  : isAnnounced
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
              )}
            >
              <Flame className="w-3.5 h-3.5" />
              {sequel.badgeText}
            </span>

            {sequel.releaseDate && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-900 text-zinc-400 border border-zinc-800">
                <Calendar className="w-3 h-3 text-zinc-400" />
                {sequel.releaseDate}
              </span>
            )}
          </div>

          {/* Description */}
          {sequel.description && (
            <p className="text-xs text-zinc-400 mt-2.5 line-clamp-2 md:line-clamp-3 leading-relaxed">
              {sequel.description}
            </p>
          )}
        </div>

        {/* 1-Click Action Buttons */}
        <div className="pt-3 border-t border-[#282D37] flex flex-wrap items-center gap-2">
          <button
            onClick={() => onAccept(sequel, 'planned')}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-950/40 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Zu &quot;Geplant&quot; hinzufügen</span>
          </button>

          <button
            onClick={() => onAccept(sequel, 'in_progress')}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-[#F1F3F7] font-semibold text-xs border border-zinc-700 transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            <span>Direkt starten</span>
          </button>
        </div>
      </div>
    </div>
  );
};
