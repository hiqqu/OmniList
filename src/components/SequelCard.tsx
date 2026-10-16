'use client';

import React from 'react';
import { Sparkles, Calendar, Plus, Play, X, ArrowUpRight, Flame } from 'lucide-react';
import { SequelNotification, MediaStatus } from '@/types/media';
import { getMediaTypeBadge, cn } from '@/lib/utils';

interface SequelCardProps {
  sequel: SequelNotification;
  onAccept: (sequel: SequelNotification, status: MediaStatus) => void;
  onDismiss: (id: string) => void;
}

export const SequelCard: React.FC<SequelCardProps> = ({ sequel, onAccept, onDismiss }) => {
  const typeBadge = getMediaTypeBadge(sequel.sequelType);

  // Determine badge styling based on release status / badge text
  const isAvailableNow =
    sequel.status === 'released' ||
    sequel.badgeText.toLowerCase().includes('verfügbar') ||
    sequel.badgeText.toLowerCase().includes('erschienen');

  const isAnnounced =
    sequel.status === 'announced' ||
    sequel.badgeText.toLowerCase().includes('angekündigt');

  return (
    <div className="relative group bg-slate-900/90 rounded-2xl overflow-hidden border border-rose-500/30 hover:border-rose-400 shadow-xl hover:shadow-2xl hover:shadow-rose-950/30 transition-all duration-300 flex flex-col md:flex-row">
      {/* Visual glowing accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-indigo-500" />

      {/* Poster Image / Cover */}
      <div className="relative md:w-48 aspect-poster md:aspect-auto md:min-h-[220px] flex-shrink-0 overflow-hidden bg-slate-950">
        <img
          src={sequel.sequelCoverUrl}
          alt={sequel.sequelTitle}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = sequel.parentCoverUrl;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent md:hidden" />

        {/* Media type badge */}
        <div className="absolute top-3 left-3">
          <span
            className={cn(
              'px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase shadow-md backdrop-blur border',
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
                <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                <span>Fortsetzung zu: {sequel.parentMediaTitle}</span>
              </div>

              {/* Sequel Title */}
              <h3 className="text-base md:text-lg font-bold text-white group-hover:text-rose-200 transition-colors">
                {sequel.sequelTitle}
              </h3>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => onDismiss(sequel.id)}
              className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors flex-shrink-0"
              title="Ignorieren"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Radar Info Badges */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide border',
                isAvailableNow
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-950'
                  : isAnnounced
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-950'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-950'
              )}
            >
              <Flame className="w-3.5 h-3.5" />
              {sequel.badgeText}
            </span>

            {sequel.releaseDate && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                <Calendar className="w-3 h-3 text-slate-400" />
                {sequel.releaseDate}
              </span>
            )}
          </div>

          {/* Description */}
          {sequel.description && (
            <p className="text-xs text-slate-400 mt-2.5 line-clamp-2 md:line-clamp-3 leading-relaxed">
              {sequel.description}
            </p>
          )}
        </div>

        {/* 1-Click Action Buttons */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2">
          <button
            onClick={() => onAccept(sequel, 'planned')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-primary/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Zu &quot;Geplant&quot; hinzufügen</span>
          </button>

          <button
            onClick={() => onAccept(sequel, 'in_progress')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            <span>Direkt starten</span>
          </button>
        </div>
      </div>
    </div>
  );
};
