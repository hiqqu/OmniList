'use client';

import React from 'react';
import { Star, Plus, MoreVertical, Edit2, Trash2, CheckCircle2, BookmarkCheck, PlayCircle } from 'lucide-react';
import { MediaItem, MediaStatus } from '@/types/media';
import { getMediaTypeBadge, getMediaStatusBadge, getUnitIncrement, cn } from '@/lib/utils';

interface MediaCardProps {
  item: MediaItem;
  onQuickIncrement: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: MediaStatus) => void;
  onEdit: (item: MediaItem) => void;
  onDelete: (id: string) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  item,
  onQuickIncrement,
  onUpdateStatus,
  onEdit,
  onDelete,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const typeBadge = getMediaTypeBadge(item.type);
  const statusBadge = getMediaStatusBadge(item.status);
  const incrementInfo = getUnitIncrement(item.type, item.progress.unit);

  const currentProgress = item.progress.current;
  const totalProgress = item.progress.total || 0;
  const percentage = totalProgress > 0 ? Math.min(100, Math.round((currentProgress / totalProgress) * 100)) : 0;
  const isCompleted = item.status === 'completed' || (totalProgress > 0 && currentProgress >= totalProgress);

  return (
    <div className="group relative flex flex-col bg-card rounded-2xl overflow-hidden border border-border/80 hover:border-slate-700 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300">
      {/* 2:3 Aspect Ratio Poster Container */}
      <div className="relative aspect-poster w-full overflow-hidden bg-slate-950">
        <img
          src={item.coverUrl}
          alt={item.title}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            // Fallback placeholder image if external link is broken
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80';
          }}
        />

        {/* Gradient Shadow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-slate-950/40 to-black/30 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
          {/* Media Type Badge */}
          <span
            className={cn(
              'px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase shadow-md backdrop-blur border',
              typeBadge.bgClass,
              typeBadge.colorClass,
              typeBadge.borderClass
            )}
          >
            {typeBadge.label}
          </span>

          {/* Menu Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-slate-300 hover:text-white flex items-center justify-center backdrop-blur transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 mt-2 w-44 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-1 z-30 text-xs">
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Status ändern
                  </div>
                  <button
                    onClick={() => {
                      onUpdateStatus(item.id, 'in_progress');
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-800 text-left text-slate-300 hover:text-white"
                  >
                    <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Gerade dabei</span>
                  </button>
                  <button
                    onClick={() => {
                      onUpdateStatus(item.id, 'planned');
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-800 text-left text-slate-300 hover:text-white"
                  >
                    <BookmarkCheck className="w-3.5 h-3.5 text-sky-400" />
                    <span>Geplant</span>
                  </button>
                  <button
                    onClick={() => {
                      onUpdateStatus(item.id, 'completed');
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-800 text-left text-slate-300 hover:text-white"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Beendet</span>
                  </button>

                  <div className="my-1 border-t border-slate-800" />

                  <button
                    onClick={() => {
                      onEdit(item);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-800 text-left text-slate-300 hover:text-white"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Details bearbeiten</span>
                  </button>
                  <button
                    onClick={() => {
                      onDelete(item.id);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-rose-500/20 text-left text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Löschen</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Rating Badge at Bottom Left of Poster */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur border border-amber-500/30 text-amber-400 text-xs font-semibold shadow-md">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{item.rating ? item.rating.toFixed(1) : '—'}</span>
        </div>

        {/* Quick Increment Button Overlay */}
        <div className="absolute bottom-3 right-3 z-10">
          <button
            onClick={() => onQuickIncrement(item.id)}
            title={`Schnell-Fortschritt (${incrementInfo.label})`}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/90 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-950/60 backdrop-blur transition-all active:scale-95 hover:scale-105 border border-indigo-400/40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{incrementInfo.label}</span>
          </button>
        </div>
      </div>

      {/* Card Body & Progress Section */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-3 bg-card">
        <div>
          {/* Status & Franchise line */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full', statusBadge.bgClass, statusBadge.colorClass)}>
              {statusBadge.label}
            </span>
            {item.collection_name && (
              <span className="text-[10px] text-slate-400 truncate max-w-[120px]" title={item.collection_name}>
                {item.collection_name}
              </span>
            )}
          </div>

          {/* Title */}
          <h3
            className="font-bold text-sm text-slate-100 group-hover:text-primary transition-colors line-clamp-1 cursor-pointer"
            onClick={() => onEdit(item)}
            title={item.title}
          >
            {item.title}
          </h3>

          {/* Creator / Release info */}
          <p className="text-xs text-slate-400 truncate mt-0.5">
            {item.creator || (item.releaseDate ? item.releaseDate.split('-')[0] : '—')}
          </p>
        </div>

        {/* Progress Bar & Counter */}
        <div className="space-y-1.5 pt-2 border-t border-border/60">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
            <span>Fortschritt</span>
            <span className="text-slate-200 font-semibold">
              {currentProgress}
              {totalProgress > 0 ? ` / ${totalProgress}` : ''}{' '}
              {item.progress.unit === 'episodes'
                ? 'Ep.'
                : item.progress.unit === 'pages'
                ? 'S.'
                : item.progress.unit === 'hours'
                ? 'Std.'
                : ''}
            </span>
          </div>

          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-300 rounded-full',
                isCompleted
                  ? 'bg-gradient-to-r from-emerald-500 to-indigo-500'
                  : 'bg-gradient-to-r from-primary to-purple-500'
              )}
              style={{ width: `${totalProgress > 0 ? percentage : Math.min(100, currentProgress * 5)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
