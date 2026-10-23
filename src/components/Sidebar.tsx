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
  PackageCheck,
  RefreshCw,
  RotateCcw,
  Cloud,
  Check,
  XCircle,
  X,
  Download,
  Infinity,
  Trash2,
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
  selectedPlatform?: 'all' | 'steam' | 'psn' | 'gog' | 'epic' | 'other';
  onSelectPlatform?: (platform: 'all' | 'steam' | 'psn' | 'gog' | 'epic' | 'other') => void;
  platformCounts?: { all: number; steam: number; psn: number; gog: number; epic?: number; other?: number };
  onlyOwned?: boolean;
  onToggleOnlyOwned?: () => void;
  sequelCount: number;
  totalMediaCount: number;
  trashCount?: number;
  onOpenTrashModal?: () => void;
  isCheckingSequels: boolean;
  onCheckSequels: () => void;
  onResetLibrary: () => void;
  onOpenSyncModal?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  selectedType,
  onSelectType,
  selectedStatus,
  onSelectStatus,
  selectedPlatform = 'all',
  onSelectPlatform,
  platformCounts,
  onlyOwned,
  onToggleOnlyOwned,
  sequelCount,
  totalMediaCount,
  trashCount = 0,
  onOpenTrashModal,
  isCheckingSequels,
  onCheckSequels,
  onResetLibrary,
  onOpenSyncModal,
  isMobileOpen = false,
  onCloseMobile,
  className,
}) => {
  const handleItemClick = (action: () => void) => {
    action();
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const typeFilters: {
    id: MediaType | 'all';
    label: string;
    icon: React.ReactNode;
    color: string;
    activeStyle: string;
    hoverStyle: string;
  }[] = [
    {
      id: 'all',
      label: 'Alle Medien',
      icon: <Library className="w-4 h-4" />,
      color: 'text-slate-400',
      activeStyle: 'bg-zinc-800 text-zinc-100 border-zinc-700 shadow-sm',
      hoverStyle: 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200',
    },
    {
      id: 'movie',
      label: 'Filme',
      icon: <Film className="w-4 h-4" />,
      color: 'text-rose-400',
      activeStyle: 'bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-sm shadow-rose-950/20 font-semibold',
      hoverStyle: 'text-zinc-400 hover:bg-rose-500/10 hover:text-rose-300',
    },
    {
      id: 'show',
      label: 'Serien',
      icon: <Tv className="w-4 h-4" />,
      color: 'text-amber-400',
      activeStyle: 'bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-sm shadow-amber-950/20 font-semibold',
      hoverStyle: 'text-zinc-400 hover:bg-amber-500/10 hover:text-amber-300',
    },
    {
      id: 'anime',
      label: 'Anime',
      icon: <Sparkles className="w-4 h-4" />,
      color: 'text-sky-400',
      activeStyle: 'bg-sky-500/15 text-sky-300 border-sky-500/30 shadow-sm shadow-sky-950/20 font-semibold',
      hoverStyle: 'text-zinc-400 hover:bg-sky-500/10 hover:text-sky-300',
    },
    {
      id: 'book',
      label: 'Bücher',
      icon: <BookOpen className="w-4 h-4" />,
      color: 'text-orange-400',
      activeStyle: 'bg-orange-500/15 text-orange-300 border-orange-500/30 shadow-sm shadow-orange-950/20 font-semibold',
      hoverStyle: 'text-zinc-400 hover:bg-orange-500/10 hover:text-orange-300',
    },
    {
      id: 'game',
      label: 'Videospiele',
      icon: <Gamepad2 className="w-4 h-4" />,
      color: 'text-purple-400',
      activeStyle: 'bg-purple-500/15 text-purple-300 border-purple-500/30 shadow-sm shadow-purple-950/20 font-semibold',
      hoverStyle: 'text-zinc-400 hover:bg-purple-500/10 hover:text-purple-300',
    },
  ];

  const statusFilters: {
    id: MediaStatus | 'all';
    label: string;
    icon: React.ReactNode;
    activeStyle: string;
    hoverStyle: string;
  }[] = [
    {
      id: 'all',
      label: 'Alle Status',
      icon: <Library className="w-3.5 h-3.5" />,
      activeStyle: 'bg-zinc-800 text-zinc-100 border-zinc-700 shadow-sm',
      hoverStyle: 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200',
    },
    {
      id: 'in_progress',
      label: 'Gerade dabei',
      icon: <Clock className="w-3.5 h-3.5 text-emerald-400" />,
      activeStyle: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-sm font-semibold',
      hoverStyle: 'text-zinc-400 hover:bg-emerald-500/10 hover:text-emerald-300',
    },
    {
      id: 'planned',
      label: 'Geplant',
      icon: <BookmarkCheck className="w-3.5 h-3.5 text-sky-400" />,
      activeStyle: 'bg-sky-500/15 text-sky-300 border-sky-500/30 shadow-sm font-semibold',
      hoverStyle: 'text-zinc-400 hover:bg-sky-500/10 hover:text-sky-300',
    },
    {
      id: 'completed',
      label: 'Beendet',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />,
      activeStyle: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 shadow-sm font-semibold',
      hoverStyle: 'text-zinc-400 hover:bg-indigo-500/10 hover:text-indigo-300',
    },
    {
      id: 'paused',
      label: 'Pausiert',
      icon: <PauseCircle className="w-3.5 h-3.5 text-amber-400" />,
      activeStyle: 'bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-sm font-semibold',
      hoverStyle: 'text-zinc-400 hover:bg-amber-500/10 hover:text-amber-300',
    },
    {
      id: 'dropped',
      label: 'Abgebrochen',
      icon: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
      activeStyle: 'bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-sm font-semibold',
      hoverStyle: 'text-zinc-400 hover:bg-rose-500/10 hover:text-rose-300',
    },
    {
      id: 'live_service',
      label: 'Live-Service',
      icon: <Infinity className="w-3.5 h-3.5 text-cyan-400" />,
      activeStyle: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 shadow-sm font-semibold',
      hoverStyle: 'text-zinc-400 hover:bg-cyan-500/10 hover:text-cyan-300',
    },
  ];

  const renderContent = (isMobile: boolean) => (
    <>
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-[#282D37] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-zinc-700 to-zinc-500 flex items-center justify-center shadow-lg shadow-black/30 border border-zinc-600/50">
            <Radar className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-[#F1F3F7]">
              OmniList
            </h1>
            <p className="text-xs text-zinc-400">All-in-One Medien Hub</p>
          </div>
        </div>

        {isMobile && onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
            title="Menü schließen"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Hauptansichten */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Hauptmenü
          </div>
          <div className="space-y-1.5">
            <button
              onClick={() => handleItemClick(() => onSelectView('dashboard'))}
              className={cn(
                'w-full flex items-center justify-between px-3.5 py-2.5 rounded-full text-sm font-bold transition-all',
                currentView === 'dashboard'
                  ? 'bg-zinc-100 text-zinc-950 shadow-md shadow-black/20'
                  : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
              )}
            >
              <div className="flex items-center gap-3">
                <Library className="w-4 h-4" />
                <span>Meine Sammlung</span>
              </div>
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-bold',
                  currentView === 'dashboard' ? 'bg-zinc-950/15 text-zinc-950' : 'bg-zinc-900 text-zinc-400'
                )}
              >
                {totalMediaCount}
              </span>
            </button>

            <button
              onClick={() => handleItemClick(() => onSelectView('sequel_radar'))}
              className={cn(
                'w-full flex items-center justify-between px-3.5 py-2.5 rounded-full text-sm font-bold transition-all',
                currentView === 'sequel_radar'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-950/30'
                  : 'text-zinc-400 hover:bg-rose-500/10 hover:text-rose-300'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Radar className={cn('w-4 h-4', sequelCount > 0 && (currentView === 'sequel_radar' ? 'text-white animate-spin' : 'text-rose-400 animate-spin'))} style={{ animationDuration: '8s' }} />
                  {sequelCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  )}
                </div>
                <span>Sequel Radar</span>
              </div>
              {sequelCount > 0 && (
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-bold',
                  currentView === 'sequel_radar' ? 'bg-white/20 text-white' : 'bg-rose-500 text-white'
                )}>
                  {sequelCount} neu
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Medientypen Filter */}
        {currentView === 'dashboard' && (
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Medientypen
            </div>
            <div className="space-y-1">
              {typeFilters.map((tf) => {
                const isActive = selectedType === tf.id;
                return (
                  <div key={tf.id} className="space-y-1">
                    <button
                      onClick={() => handleItemClick(() => onSelectType(tf.id))}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium border transition-all',
                        isActive
                          ? tf.activeStyle
                          : `border-transparent ${tf.hoverStyle}`
                      )}
                    >
                      <span className={tf.color}>{tf.icon}</span>
                      <span>{tf.label}</span>
                    </button>
                    {tf.id === 'game' && selectedType === 'game' && onSelectPlatform && (
                      <div className="pl-6 pt-1 space-y-1">
                        <button
                          type="button"
                          onClick={() => handleItemClick(() => onSelectPlatform('all'))}
                          className={cn(
                            'w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all border',
                            selectedPlatform === 'all'
                              ? 'bg-purple-500/20 text-purple-200 border-purple-500/40 shadow-sm'
                              : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                          )}
                        >
                          <span>Alle Quellen</span>
                          {platformCounts && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-400 font-mono">
                              {platformCounts.all}
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleItemClick(() => onSelectPlatform('steam'))}
                          className={cn(
                            'w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all border',
                            selectedPlatform === 'steam'
                              ? 'bg-sky-500/20 text-sky-200 border-sky-500/40 shadow-sm'
                              : 'border-transparent text-zinc-400 hover:text-sky-300 hover:bg-sky-500/10'
                          )}
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                            <span>Steam</span>
                          </span>
                          {platformCounts && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-950/60 text-sky-300 border border-sky-800/40 font-mono">
                              {platformCounts.steam}
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleItemClick(() => onSelectPlatform('psn'))}
                          className={cn(
                            'w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all border',
                            selectedPlatform === 'psn'
                              ? 'bg-blue-500/20 text-blue-200 border-blue-500/40 shadow-sm'
                              : 'border-transparent text-zinc-400 hover:text-blue-300 hover:bg-blue-500/10'
                          )}
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            <span>PlayStation</span>
                          </span>
                          {platformCounts && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-950/60 text-blue-300 border border-blue-800/40 font-mono">
                              {platformCounts.psn}
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleItemClick(() => onSelectPlatform('gog'))}
                          className={cn(
                            'w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all border',
                            selectedPlatform === 'gog'
                              ? 'bg-purple-500/20 text-purple-200 border-purple-500/40 shadow-sm'
                              : 'border-transparent text-zinc-400 hover:text-purple-300 hover:bg-purple-500/10'
                          )}
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                            <span>GOG Galaxy</span>
                          </span>
                          {platformCounts && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-950/60 text-purple-300 border border-purple-800/40 font-mono">
                              {platformCounts.gog}
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleItemClick(() => onSelectPlatform('epic'))}
                          className={cn(
                            'w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all border',
                            selectedPlatform === 'epic'
                              ? 'bg-zinc-700/50 text-zinc-100 border-zinc-500 shadow-sm'
                              : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                          )}
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                            <span>Epic</span>
                          </span>
                          {platformCounts && platformCounts.epic !== undefined && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                              {platformCounts.epic}
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleItemClick(() => onSelectPlatform('other'))}
                          className={cn(
                            'w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all border',
                            selectedPlatform === 'other'
                              ? 'bg-zinc-700/50 text-zinc-100 border-zinc-500 shadow-sm'
                              : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                          )}
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                            <span>Andere</span>
                          </span>
                          {platformCounts && platformCounts.other !== undefined && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-400 font-mono">
                              {platformCounts.other}
                            </span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Status Filter */}
        {currentView === 'dashboard' && (
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Status
            </div>
            <div className="space-y-1">
              {statusFilters.map((sf) => {
                const isActive = selectedStatus === sf.id;
                return (
                  <button
                    key={sf.id}
                    onClick={() => handleItemClick(() => onSelectStatus(sf.id))}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
                      isActive
                        ? sf.activeStyle
                        : `border-transparent ${sf.hoverStyle}`
                    )}
                  >
                    {sf.icon}
                    <span>{sf.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Kombinierbarer Besitz-Filter */}
            {onToggleOnlyOwned && (
              <div className="mt-4 pt-3 border-t border-[#282D37]">
                <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                  <span>Besitz-Filter</span>
                  {onlyOwned && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      Aktiv
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleItemClick(() => onToggleOnlyOwned())}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-all',
                    onlyOwned
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm font-semibold'
                      : 'border-[#282D37] text-zinc-400 hover:bg-[#212631] hover:text-zinc-200'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <PackageCheck className={cn('w-4 h-4', onlyOwned ? 'text-emerald-400' : 'text-zinc-500')} />
                    <span>Nur im Besitz</span>
                  </div>
                  <div
                    className={cn(
                      'w-4 h-4 rounded border flex items-center justify-center transition-colors',
                      onlyOwned
                        ? 'bg-emerald-500 border-emerald-500 text-black'
                        : 'border-zinc-600 bg-zinc-900'
                    )}
                  >
                    {onlyOwned && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
                <p className="px-3 mt-1.5 text-[10px] text-zinc-500 leading-tight">
                  Kombinierbar mit jedem Status (z. B. Geplant + Im Besitz)
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-[#282D37] space-y-2 bg-[#181B22]/50">
        {onOpenSyncModal && (
          <button
            onClick={() => handleItemClick(() => onOpenSyncModal())}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-full text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-all active:scale-95 shadow-sm"
          >
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            <span>Geräte-Sync &amp; Backup</span>
          </button>
        )}

        {onOpenTrashModal && (
          <button
            onClick={() => handleItemClick(() => onOpenTrashModal())}
            className="w-full flex items-center justify-between px-3 py-2 rounded-full text-xs font-semibold bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-all active:scale-95 shadow-sm"
            title="Gelöschte Medien anzeigen und wiederherstellen"
          >
            <div className="flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Papierkorb</span>
            </div>
            {trashCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-700 text-zinc-200">
                {trashCount}
              </span>
            )}
          </button>
        )}

        <button
          onClick={onCheckSequels}
          disabled={isCheckingSequels}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-full text-xs font-semibold bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all disabled:opacity-50"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', isCheckingSequels && 'animate-spin text-zinc-300')} />
          <span>{isCheckingSequels ? 'Prüfe Fortsetzungen...' : 'Sequel Radar prüfen'}</span>
        </button>

        <button
          onClick={() => handleItemClick(() => onResetLibrary())}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium text-zinc-500 hover:text-rose-400 transition-colors"
          title="Setzt die gesamte Mediensammlung zurück"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Sammlung zurücksetzen</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Drawer Backdrop & Slide-out Sheet */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer Panel */}
          <aside className="relative z-50 w-72 max-w-[85vw] h-full bg-[#181B22] border-r border-[#282D37] flex flex-col shadow-2xl animate-slideRight select-none">
            {renderContent(true)}
          </aside>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex w-64 xl:w-72 flex-shrink-0 bg-[#181B22]/95 backdrop-blur border-r border-[#282D37] flex-col h-screen sticky top-0 select-none z-30',
          className
        )}
      >
        {renderContent(false)}
      </aside>
    </>
  );
};
