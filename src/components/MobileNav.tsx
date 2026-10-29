'use client';

import React from 'react';
import {
  Library,
  SlidersHorizontal,
  Plus,
  Radar,
  Cloud,
  User,
} from 'lucide-react';
import { AuthSession } from '@/types/account';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  currentView: 'dashboard' | 'sequel_radar';
  onSelectView: (view: 'dashboard' | 'sequel_radar') => void;
  onOpenMobileDrawer: () => void;
  onOpenAddModal: () => void;
  onOpenSyncModal: () => void;
  sequelCount: number;
  isFilterActive?: boolean;
  authSession?: AuthSession | null;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentView,
  onSelectView,
  onOpenMobileDrawer,
  onOpenAddModal,
  onOpenSyncModal,
  sequelCount,
  isFilterActive = false,
  authSession,
}) => {
  return (
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#12141A]/95 backdrop-blur-xl border-t border-[#282D37] px-3 py-1.5 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.6)]"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {/* Tab 1: Sammlung */}
        <button
          type="button"
          onClick={() => onSelectView('dashboard')}
          className={cn(
            'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative min-w-[56px]',
            currentView === 'dashboard'
              ? 'text-white font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          )}
        >
          <div className="relative">
            <Library
              className={cn(
                'w-5 h-5 transition-transform',
                currentView === 'dashboard' && 'scale-110 text-zinc-100'
              )}
            />
            {currentView === 'dashboard' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-zinc-100" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Sammlung</span>
        </button>

        {/* Tab 2: Filter (Drawer) */}
        <button
          type="button"
          onClick={onOpenMobileDrawer}
          className={cn(
            'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative min-w-[56px]',
            isFilterActive
              ? 'text-amber-300 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          )}
        >
          <div className="relative">
            <SlidersHorizontal
              className={cn(
                'w-5 h-5 transition-transform',
                isFilterActive && 'scale-110 text-amber-400'
              )}
            />
            {isFilterActive && (
              <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#12141A]" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">
            {isFilterActive ? 'Filter *' : 'Filter'}
          </span>
        </button>

        {/* Tab 3: Center Add Button */}
        <button
          type="button"
          onClick={onOpenAddModal}
          className="flex flex-col items-center justify-center -mt-3.5 group"
          title="Medium hinzufügen"
        >
          <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-950 flex items-center justify-center shadow-lg shadow-black/40 group-active:scale-95 transition-all border-2 border-[#12141A]">
            <Plus className="w-6 h-6 stroke-[2.8]" />
          </div>
          <span className="text-[10px] font-bold text-zinc-300 mt-0.5 tracking-tight">
            Hinzufügen
          </span>
        </button>

        {/* Tab 4: Sequel Radar */}
        <button
          type="button"
          onClick={() => onSelectView('sequel_radar')}
          className={cn(
            'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative min-w-[56px]',
            currentView === 'sequel_radar'
              ? 'text-rose-400 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          )}
        >
          <div className="relative">
            <Radar
              className={cn(
                'w-5 h-5 transition-transform',
                currentView === 'sequel_radar'
                  ? 'scale-110 text-rose-400 animate-spin'
                  : sequelCount > 0
                  ? 'text-rose-400 animate-pulse'
                  : ''
              )}
              style={currentView === 'sequel_radar' ? { animationDuration: '6s' } : undefined}
            />
            {sequelCount > 0 && (
              <span className="absolute -top-1 -right-2.5 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-rose-500 text-white shadow-sm ring-1 ring-[#12141A]">
                {sequelCount}
              </span>
            )}
            {currentView === 'sequel_radar' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-rose-400" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Radar</span>
        </button>

        {/* Tab 5: Account & Sync */}
        <button
          type="button"
          onClick={onOpenSyncModal}
          className={cn(
            'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative min-w-[56px]',
            authSession ? 'text-purple-300' : 'text-zinc-400 hover:text-zinc-200'
          )}
          title={authSession ? `Account: ${authSession.user.username}` : 'Account & Sync'}
        >
          <div className="relative">
            <User className={cn('w-5 h-5', authSession ? 'text-purple-400' : 'text-zinc-400')} />
            {authSession && (
              <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#12141A] animate-pulse" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight truncate max-w-[56px]">
            {authSession ? authSession.user.username : 'Account'}
          </span>
        </button>
      </div>
    </nav>
  );
};
