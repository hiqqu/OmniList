'use client';

import React from 'react';
import {
  Film,
  Tv,
  Sparkles,
  BookOpen,
  Gamepad2,
  Radar,
  Library,
  Clock,
  BookmarkCheck,
  CheckCircle2,
  PauseCircle,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import { MediaType, MediaStatus } from '@/types/media';
import { cn } from '@/lib/utils';

interface SidebarProps {
  currentView: 'dashboard' | 'sequel_radar';
  onSelectView: (view: 'dashboard' | 'sequel_radar') => void;
  selectedType: MediaType | 'all';
  onSelectType: (type: MediaType | 'all') => void;
  selectedStatus: MediaStatus | 'all';
  onSelectStatus: (status: MediaStatus | 'all') => void;
  sequelCount: number;
  totalMediaCount: number;
  isCheckingSequels: boolean;
  onCheckSequels: () => void;
  onResetLibrary: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  selectedType,
  onSelectType,
  selectedStatus,
  onSelectStatus,
  sequelCount,
  totalMediaCount,
  isCheckingSequels,
  onCheckSequels,
  onResetLibrary,
  className,
}) => {
  const typeFilters: { id: MediaType | 'all'; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'all', label: 'Alle Medien', icon: <Library className="w-4 h-4" />, color: 'text-slate-300' },
    { id: 'movie', label: 'Filme', icon: <Film className="w-4 h-4" />, color: 'text-rose-400' },
    { id: 'show', label: 'Serien', icon: <Tv className="w-4 h-4" />, color: 'text-amber-400' },
    { id: 'anime', label: 'Anime', icon: <Sparkles className="w-4 h-4" />, color: 'text-blue-400' },
    { id: 'book', label: 'Bücher', icon: <BookOpen className="w-4 h-4" />, color: 'text-orange-400' },
    { id: 'game', label: 'Videospiele', icon: <Gamepad2 className="w-4 h-4" />, color: 'text-purple-400' },
  ];

  const statusFilters: { id: MediaStatus | 'all'; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'Alle Status', icon: <Library className="w-3.5 h-3.5" /> },
    { id: 'in_progress', label: 'Gerade dabei', icon: <Clock className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: 'planned', label: 'Geplant', icon: <BookmarkCheck className="w-3.5 h-3.5 text-sky-400" /> },
    { id: 'completed', label: 'Beendet', icon: <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> },
    { id: 'paused', label: 'Pausiert', icon: <PauseCircle className="w-3.5 h-3.5 text-amber-400" /> },
  ];

  return (
    <aside
      className={cn(
        'w-64 flex-shrink-0 bg-surface/95 backdrop-blur border-r border-border flex flex-col h-screen sticky top-0 select-none z-30',
        className
      )}
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/30">
            <Radar className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              OmniTrack
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-primary/20 text-indigo-300 border border-primary/30">
                PRO
              </span>
            </h1>
            <p className="text-xs text-slate-400">All-in-One Medien Hub</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Hauptansichten */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Hauptmenü
          </div>
          <div className="space-y-1">
            <button
              onClick={() => onSelectView('dashboard')}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                currentView === 'dashboard'
                  ? 'bg-primary text-white shadow-md shadow-primary/30'
                  : 'text-slate-300 hover:bg-surfaceHover hover:text-white'
              )}
            >
              <div className="flex items-center gap-3">
                <Library className="w-4 h-4" />
                <span>Meine Sammlung</span>
              </div>
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-semibold',
                  currentView === 'dashboard' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                )}
              >
                {totalMediaCount}
              </span>
            </button>

            <button
              onClick={() => onSelectView('sequel_radar')}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative',
                currentView === 'sequel_radar'
                  ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white shadow-lg shadow-rose-900/30'
                  : 'text-slate-300 hover:bg-surfaceHover hover:text-white'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Radar className={cn('w-4 h-4', sequelCount > 0 && 'text-rose-400 animate-spin')} style={{ animationDuration: '8s' }} />
                  {sequelCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  )}
                </div>
                <span>Sequel Radar</span>
              </div>
              {sequelCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-rose-500 text-white shadow-glow-radar">
                  {sequelCount} neu
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Medientypen Filter */}
        {currentView === 'dashboard' && (
          <div>
            <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Medientypen
            </div>
            <div className="space-y-1">
              {typeFilters.map((tf) => {
                const isActive = selectedType === tf.id;
                return (
                  <button
                    key={tf.id}
                    onClick={() => onSelectType(tf.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                      isActive
                        ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                        : 'text-slate-400 hover:bg-surfaceHover hover:text-slate-200'
                    )}
                  >
                    <span className={tf.color}>{tf.icon}</span>
                    <span>{tf.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Status Filter */}
        {currentView === 'dashboard' && (
          <div>
            <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Status
            </div>
            <div className="space-y-1">
              {statusFilters.map((sf) => {
                const isActive = selectedStatus === sf.id;
                return (
                  <button
                    key={sf.id}
                    onClick={() => onSelectStatus(sf.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                      isActive
                        ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                        : 'text-slate-400 hover:bg-surfaceHover hover:text-slate-200'
                    )}
                  >
                    {sf.icon}
                    <span>{sf.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-border space-y-2 bg-surface/50">
        <button
          onClick={onCheckSequels}
          disabled={isCheckingSequels}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all disabled:opacity-50"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', isCheckingSequels && 'animate-spin text-primary')} />
          <span>{isCheckingSequels ? 'Prüfe Fortsetzungen...' : 'Sequel Radar prüfen'}</span>
        </button>

        <button
          onClick={onResetLibrary}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-medium text-slate-500 hover:text-slate-300 transition-colors"
          title="Setzt die Mediensammlung auf die interaktive Demo-Standard-Sammlung zurück"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Demo-Daten zurücksetzen</span>
        </button>
      </div>
    </aside>
  );
};
