'use client';

import React from 'react';
import Link from 'next/link';
import { Star, Plus, MoreVertical, Edit2, Trash2, CheckCircle2, BookmarkCheck, PlayCircle, PauseCircle, PackageCheck, Info, Check, Clock, Trophy, Building2, Layers, XCircle, Award, Gamepad2, Infinity } from 'lucide-react';
import { MediaItem, MediaStatus, MediaType } from '@/types/media';
import { getMediaTypeBadge, getMediaStatusBadge, getUnitIncrement, cn } from '@/lib/utils';
import { getMediaCoverFallback } from '@/lib/book-cover';
import { getMediaMetacriticScore, getMetacriticBadgeStyle } from '@/lib/metacritic';
import { isLiveServiceGame } from '@/lib/live-service';

interface MediaCardProps {
  item: MediaItem;
  onQuickIncrement: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: MediaStatus) => void;
  onToggleOwned?: (id: string) => void;
  onToggleGameStory?: (id: string) => void;
  onToggleGame100?: (id: string) => void;
  onToggleGameAchievements?: (id: string) => void;
  onEdit: (item: MediaItem) => void;
  onDelete: (id: string) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  item,
  onQuickIncrement,
  onUpdateStatus,
  onToggleOwned,
  onToggleGameStory,
  onToggleGame100,
  onToggleGameAchievements,
  onEdit,
  onDelete,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const typeBadge = getMediaTypeBadge(item.type);
  const statusBadge = getMediaStatusBadge(item.status);
  const incrementInfo = getUnitIncrement(item.type, item.progress.unit);

  const isGame = item.type === 'game';
  const isMovie = item.type === 'movie';
  const gamePlaytime = item.gameTracker?.playtimeHours ?? item.progress.current;
  const isGameStoryDone = Boolean(item.gameTracker?.storyCompleted);
  const isGame100Done = Boolean(item.gameTracker?.completionist100);
  const isGameAchievementsDone = Boolean(
    item.gameTracker?.allAchievementsCompleted ||
    (item.gameTracker?.achievements &&
      item.gameTracker.achievements.total > 0 &&
      item.gameTracker.achievements.current >= item.gameTracker.achievements.total)
  );
  const achievements = item.gameTracker?.achievements;
  const achievementPercentage =
    achievements && achievements.total > 0
      ? Math.round((achievements.current / achievements.total) * 100)
      : isGameAchievementsDone
      ? 100
      : 0;
  const isPsn = item.connectedService === 'psn' || item.external_id?.startsWith('psn:');

  const metacriticScore = getMediaMetacriticScore(item);
  const metacriticStyle = metacriticScore !== null ? getMetacriticBadgeStyle(metacriticScore) : null;
  const isLiveService = isGame && isLiveServiceGame(item);

  const currentProgress = item.progress.current;
  const totalProgress = item.progress.total || 0;
  const percentage = totalProgress > 0 ? Math.min(100, Math.round((currentProgress / totalProgress) * 100)) : 0;
  const isCompleted =
    item.status === 'completed' ||
    (isGame ? isGame100Done || isGameStoryDone : totalProgress > 0 && currentProgress >= totalProgress);

  const displayPublisher =
    item.publisher ||
    (item.type === 'book' && item.collection_name
      ? item.collection_name.replace(/\s*Ausgabe$/i, '').trim()
      : item.collection_name);

  const isStockOrEmptyCover = !item.coverUrl || item.coverUrl.includes('images.unsplash.com');
  const displayCover = isStockOrEmptyCover ? getMediaCoverFallback(item) : item.coverUrl;

  // Category specific accent styles
  const typeButtonStyles: Record<MediaType, string> = {
    movie: 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-950/40',
    show: 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-950/40',
    anime: 'bg-sky-500 hover:bg-sky-400 text-zinc-950 shadow-sky-950/40',
    book: 'bg-orange-500 hover:bg-orange-400 text-white shadow-orange-950/40',
    game: 'bg-purple-500 hover:bg-purple-400 text-white shadow-purple-950/40',
  };

  const typeProgressColors: Record<MediaType, string> = {
    movie: 'bg-rose-500',
    show: 'bg-amber-500',
    anime: 'bg-sky-500',
    book: 'bg-orange-500',
    game: 'bg-purple-500',
  };

  const typeTextHover: Record<MediaType, string> = {
    movie: 'group-hover:text-rose-400',
    show: 'group-hover:text-amber-400',
    anime: 'group-hover:text-sky-400',
    book: 'group-hover:text-orange-400',
    game: 'group-hover:text-purple-400',
  };

  return (
    <div
      className={cn(
        'group relative flex flex-col bg-[#181B22] rounded-2xl border border-[#282D37] hover:border-zinc-500/50 hover:shadow-2xl transition-all duration-300',
        showMenu ? 'z-50' : 'overflow-hidden'
      )}
    >
      {/* 2:3 Aspect Ratio Poster Container - always overflow-hidden so cover image never bleeds out */}
      <div className="relative aspect-poster w-full bg-[#0F1117] overflow-hidden rounded-t-2xl">
        <Link href={`/media/${encodeURIComponent(item.id)}`} className="block w-full h-full cursor-pointer">
          <img
            src={displayCover}
            alt={item.title}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src = getMediaCoverFallback(item);
            }}
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalWidth <= 1 || img.naturalHeight <= 1) {
                img.src = getMediaCoverFallback(item);
              }
            }}
          />
        </Link>

        {/* Gradient Shadow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#181B22] via-[#0F1117]/40 to-black/30 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 sm:top-3 sm:left-3 sm:right-3 flex items-center justify-between gap-1 sm:gap-2 z-20 pointer-events-auto">
          {/* Media Type Badge */}
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

          {/* Menu Trigger */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#0F1117]/70 hover:bg-[#0F1117] text-zinc-400 hover:text-[#F1F3F7] flex items-center justify-center backdrop-blur transition-colors"
          >
            <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Quick Increment Button Overlay - only for movies, shows, anime, books (hidden for games) */}
        {!isGame && (
          <div
            className={cn(
              'absolute bottom-2 right-2 sm:bottom-3 sm:right-3 z-10 transition-opacity duration-200',
              showMenu && 'opacity-0 pointer-events-none'
            )}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickIncrement(item.id);
              }}
              disabled={isCompleted}
              title={
                isCompleted
                  ? 'Bereits alle Einheiten beendet'
                  : `Schnell-Fortschritt (${incrementInfo.label})`
              }
              className={cn(
                'flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full font-bold text-[11px] sm:text-xs shadow-lg backdrop-blur transition-all',
                isCompleted
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                  : `active:scale-95 hover:scale-105 ${typeButtonStyles[item.type]}`
              )}
            >
              {isCompleted ? (
                <>
                  <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 stroke-[2.5]" />
                  <span>{isMovie ? 'Gesehen' : 'Fertig'}</span>
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
                  <span>{incrementInfo.label.replace(/^\+/, '')}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Dropdown Menu - positioned neatly within card boundaries */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-2 top-10 sm:top-11 w-44 max-w-[calc(100%-16px)] rounded-xl bg-[#181B22] border border-[#282D37] shadow-2xl py-1 z-50 text-xs">
            <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Status ändern
            </div>
            <button
              onClick={() => {
                onUpdateStatus(item.id, 'in_progress');
                setShowMenu(false);
              }}
              className={cn(
                "w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#212631] text-left transition-colors",
                item.status === 'in_progress' ? "text-emerald-300 font-semibold bg-[#212631]/50" : "text-[#F1F3F7]"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <PlayCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Gerade dabei</span>
              </div>
              {item.status === 'in_progress' && <span className="text-[10px] text-emerald-400 ml-1">✓</span>}
            </button>
            <button
              onClick={() => {
                onUpdateStatus(item.id, 'planned');
                setShowMenu(false);
              }}
              className={cn(
                "w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#212631] text-left transition-colors",
                item.status === 'planned' ? "text-sky-300 font-semibold bg-[#212631]/50" : "text-[#F1F3F7]"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <BookmarkCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="truncate">Geplant</span>
              </div>
              {item.status === 'planned' && <span className="text-[10px] text-sky-400 ml-1">✓</span>}
            </button>
            <button
              onClick={() => {
                onUpdateStatus(item.id, 'completed');
                setShowMenu(false);
              }}
              className={cn(
                "w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#212631] text-left transition-colors",
                item.status === 'completed' ? "text-indigo-300 font-semibold bg-[#212631]/50" : "text-[#F1F3F7]"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">Beendet</span>
              </div>
              {item.status === 'completed' && <span className="text-[10px] text-indigo-400 ml-1">✓</span>}
            </button>
            <button
              onClick={() => {
                onUpdateStatus(item.id, 'paused');
                setShowMenu(false);
              }}
              className={cn(
                "w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#212631] text-left transition-colors",
                item.status === 'paused' ? "text-amber-300 font-semibold bg-[#212631]/50" : "text-[#F1F3F7]"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <PauseCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Pausiert</span>
              </div>
              {item.status === 'paused' && <span className="text-[10px] text-amber-400 ml-1">✓</span>}
            </button>
            <button
              onClick={() => {
                onUpdateStatus(item.id, 'dropped');
                setShowMenu(false);
              }}
              className={cn(
                "w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#212631] text-left transition-colors",
                item.status === 'dropped' ? "text-rose-300 font-semibold bg-[#212631]/50" : "text-[#F1F3F7]"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="truncate">Abgebrochen</span>
              </div>
              {item.status === 'dropped' && <span className="text-[10px] text-rose-400 ml-1">✓</span>}
            </button>

            <div className="border-t border-[#282D37] my-1" />

            {onToggleOwned && (
              <button
                onClick={() => {
                  onToggleOwned(item.id);
                  setShowMenu(false);
                }}
                className={cn(
                  "w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#212631] text-left transition-colors",
                  item.isOwned ? "text-emerald-300 font-semibold" : "text-zinc-300"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <PackageCheck className={cn("w-3.5 h-3.5 shrink-0", item.isOwned ? "text-emerald-400" : "text-zinc-500")} />
                  <span className="truncate">Im Besitz</span>
                </div>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ml-1",
                  item.isOwned ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-zinc-800 text-zinc-500"
                )}>
                  {item.isOwned ? 'Ja ✓' : 'Nein'}
                </span>
              </button>
            )}

            {isGame && onToggleGameStory && (
              <button
                onClick={() => {
                  onToggleGameStory(item.id);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#212631] text-left text-purple-300"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="truncate">Story</span>
                </div>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ml-1",
                  isGameStoryDone ? "bg-purple-500/20 text-purple-300" : "bg-zinc-800 text-zinc-500"
                )}>
                  {isGameStoryDone ? 'Fertig ✓' : 'Offen'}
                </span>
              </button>
            )}

            {isGame && onToggleGame100 && (
              <button
                onClick={() => {
                  onToggleGame100(item.id);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#212631] text-left text-amber-300"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">100%</span>
                </div>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ml-1",
                  isGame100Done ? "bg-amber-500/20 text-amber-300" : "bg-zinc-800 text-zinc-500"
                )}>
                  {isGame100Done ? 'Meister ✓' : 'Offen'}
                </span>
              </button>
            )}

            {isGame && onToggleGameAchievements && (
              <button
                onClick={() => {
                  onToggleGameAchievements(item.id);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#212631] text-left text-amber-300"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">Alle Achievements</span>
                </div>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ml-1",
                  isGameAchievementsDone ? "bg-amber-500/20 text-amber-300" : "bg-zinc-800 text-zinc-500"
                )}>
                  {isGameAchievementsDone ? 'Alle ✓' : 'Offen'}
                </span>
              </button>
            )}

            <div className="my-1 border-t border-[#282D37]" />

            <Link
              href={`/media/${encodeURIComponent(item.id)}`}
              onClick={() => setShowMenu(false)}
              className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#212631] text-left text-[#F1F3F7]"
            >
              <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="truncate">
                {item.type === 'book'
                  ? 'Details & Autoren'
                  : item.type === 'anime'
                  ? 'Details & Charaktere'
                  : item.type === 'game'
                  ? 'Details & Team'
                  : 'Details & Besetzung'}
              </span>
            </Link>

            <button
              onClick={() => {
                onEdit(item);
                setShowMenu(false);
              }}
              className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#212631] text-left text-zinc-300"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Bearbeiten</span>
            </button>
            <button
              onClick={() => {
                onDelete(item.id);
                setShowMenu(false);
              }}
              className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-rose-500/20 text-left text-rose-400"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span>Löschen</span>
            </button>
          </div>
        </>
      )}

      {/* Card Body & Progress Section */}
      <div className="p-2.5 sm:p-3.5 flex flex-col flex-1 justify-between gap-2 sm:gap-3 bg-[#181B22]">
        <div>
          {/* Title */}
          <Link
            href={`/media/${encodeURIComponent(item.id)}`}
            className={cn(
              'font-bold text-xs sm:text-sm text-[#F1F3F7] transition-colors line-clamp-1 cursor-pointer block',
              typeTextHover[item.type]
            )}
            title={item.title}
          >
            {item.title}
          </Link>

          {/* Creator / Release info */}
          <p className="text-[10px] sm:text-xs text-zinc-400 truncate mt-0.5 mb-2">
            {item.creator || (item.releaseDate ? item.releaseDate.split('-')[0] : '—')}
          </p>

          {/* Status & Ownership Badges line - side by side */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={cn('text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shrink-0', statusBadge.bgClass, statusBadge.colorClass)}>
              {statusBadge.label}
            </span>
            {item.isOwned && item.status !== 'owned' && (
              <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shadow-sm whitespace-nowrap shrink-0">
                <PackageCheck className="w-3 h-3 text-emerald-400" />
                <span>Im Besitz</span>
              </span>
            )}
            {(item.connectedService || item.external_id?.startsWith('steam:') || item.external_id?.startsWith('psn:') || item.external_id?.startsWith('gog:')) && (
              (() => {
                const s = item.connectedService || (item.external_id?.startsWith('steam:') ? 'steam' : item.external_id?.startsWith('psn:') ? 'psn' : 'gog');
                return (
                  <span
                    className={cn(
                      'text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full border flex items-center gap-1 shadow-sm whitespace-nowrap shrink-0',
                      s === 'steam'
                        ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                        : s === 'psn'
                        ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                        : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                    )}
                    title={`Verknüpft mit ${item.gameConnection?.serviceName || s.toUpperCase()}`}
                  >
                    <Gamepad2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span>{s === 'steam' ? 'Steam' : s === 'psn' ? 'PSN' : 'GOG'}</span>
                  </span>
                );
              })()
            )}
            {metacriticScore !== null && metacriticStyle && (
              <span
                className={cn(
                  'text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full border flex items-center gap-1 shadow-sm whitespace-nowrap shrink-0',
                  metacriticStyle.bgClass,
                  metacriticStyle.colorClass,
                  metacriticStyle.borderClass
                )}
                title={`Metacritic Score: ${metacriticScore}/100`}
              >
                <span
                  className={cn(
                    'w-3.5 h-3.5 rounded flex items-center justify-center text-[8px] font-black text-black font-mono leading-none',
                    metacriticStyle.badgeBg
                  )}
                >
                  M
                </span>
                <span>Metacritic {metacriticScore}</span>
              </span>
            )}

            {isLiveService && (
              <span
                className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 shadow-sm whitespace-nowrap shrink-0"
                title="Live-Service / Endlos-Spiel ohne klassisches Kampagnen-Ende"
              >
                <Infinity className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-cyan-400" />
                <span>Live-Service</span>
              </span>
            )}
          </div>

          {/* Publisher / Collection line underneath badges */}
          {displayPublisher && (
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-zinc-400 truncate mt-1.5" title={displayPublisher}>
              {item.type === 'book' ? (
                <Building2 className="w-3 h-3 text-orange-400/80 shrink-0" />
              ) : (
                <Layers className="w-3 h-3 text-zinc-500 shrink-0" />
              )}
              <span className="truncate font-medium text-zinc-300">
                {displayPublisher}
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar & Tracker Section */}
        {isGame ? (
          /* ============= GAME TRACKER UI ============= */
          <div className="space-y-1.5 sm:space-y-2 pt-1.5 sm:pt-2 border-t border-[#282D37]">
            {/* Playtime & Trophies Header */}
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-medium text-zinc-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-purple-400 shrink-0" />
                <span>Spielzeit</span>
              </span>
              <div className="flex items-center gap-2">
                {achievements && achievements.total > 0 && (
                  <span
                    className="flex items-center gap-1 text-[10px] text-amber-300 font-bold bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded shadow-sm"
                    title={`${isPsn ? 'Trophäen' : 'Erfolge'}: ${achievements.current} von ${achievements.total} (${achievementPercentage}%)`}
                  >
                    <Trophy className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 shrink-0" />
                    <span>{achievements.current}/{achievements.total}</span>
                  </span>
                )}
                <span className="text-[#F1F3F7] font-bold">
                  {gamePlaytime} Std.
                </span>
              </div>
            </div>

            {/* Badges: Story (or Endlos) & 100% & Achievements */}
            <div className="flex items-center gap-1 flex-wrap">
              {isLiveService ? (
                <span
                  className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 shadow-sm"
                  title="Live-Service / Endlostitel (keine Kampagne)"
                >
                  <Infinity className="w-2.5 h-2.5 text-cyan-400" />
                  <span>Endlos</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleGameStory?.(item.id);
                  }}
                  className={cn(
                    'text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded transition-all flex items-center gap-1',
                    isGameStoryDone
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-600'
                  )}
                  title="Klicken zum Umschalten: Story beendet"
                >
                  <span>Story</span>
                  <span className={isGameStoryDone ? "text-purple-300 font-extrabold" : "text-zinc-500"}>
                    {isGameStoryDone ? '✓' : '—'}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleGame100?.(item.id);
                }}
                className={cn(
                  'text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded transition-all flex items-center gap-1',
                  isGame100Done
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-600'
                )}
                title="Klicken zum Umschalten: 100% Meisterung"
              >
                <span>100%</span>
                <span className={isGame100Done ? "text-amber-400 font-extrabold" : "text-zinc-500"}>
                  {isGame100Done ? '✓' : '—'}
                </span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleGameAchievements?.(item.id);
                }}
                className={cn(
                  'text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded transition-all flex items-center gap-1',
                  isGameAchievementsDone
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-600'
                )}
                title={
                  achievements && achievements.total > 0
                    ? `${isPsn ? 'Trophäen' : 'Erfolge'}: ${achievements.current} von ${achievements.total} (${achievementPercentage}%)`
                    : "Klicken zum Umschalten: Alle Erfolge (100% Achievements)"
                }
              >
                <Trophy className={cn("w-3 h-3 shrink-0", isGameAchievementsDone ? "text-amber-400" : "text-zinc-400")} />
                <span>{isPsn ? 'Trophäen' : 'Erfolge'}</span>
                {achievements && achievements.total > 0 ? (
                  <span className={cn("font-bold font-mono", isGameAchievementsDone ? "text-amber-400" : "text-zinc-300")}>
                    {achievements.current}/{achievements.total}
                  </span>
                ) : (
                  <span className={isGameAchievementsDone ? "text-amber-400 font-extrabold" : "text-zinc-500"}>
                    {isGameAchievementsDone ? '✓' : '—'}
                  </span>
                )}
              </button>
            </div>

            {/* Mini Progress Bar for Achievements or Game Completion */}
            <div className="w-full h-1 sm:h-1.5 bg-[#0F1117] rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-300 rounded-full',
                  isGame100Done || isGameAchievementsDone
                    ? 'bg-amber-400'
                    : isGameStoryDone
                    ? 'bg-purple-400'
                    : 'bg-purple-500/40'
                )}
                style={{
                  width:
                    achievements && achievements.total > 0
                      ? `${achievementPercentage}%`
                      : isGame100Done || isGameAchievementsDone
                      ? '100%'
                      : isGameStoryDone
                      ? '100%'
                      : `${Math.min(100, Math.max(10, gamePlaytime * 2))}%`,
                }}
              />
            </div>
          </div>
        ) : isMovie ? (
          /* ============= MOVIE TRACKER UI ============= */
          <div className="space-y-1 sm:space-y-1.5 pt-1.5 sm:pt-2 border-t border-[#282D37]">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-medium text-zinc-400">
              <span>{isCompleted ? 'Laufzeit' : 'Fortschritt'}</span>
              <span className="text-[#F1F3F7] font-bold">
                {isCompleted
                  ? `${totalProgress || currentProgress} Min.`
                  : `${currentProgress} / ${totalProgress || currentProgress} Min.`}
              </span>
            </div>

            <div className="w-full h-1.5 bg-[#0F1117] rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-300 rounded-full',
                  isCompleted ? 'bg-emerald-400' : 'bg-rose-500'
                )}
                style={{ width: `${isCompleted ? 100 : percentage}%` }}
              />
            </div>
          </div>
        ) : (
          /* ============= SHOW / ANIME / BOOK UI ============= */
          <div className="space-y-1 sm:space-y-1.5 pt-1.5 sm:pt-2 border-t border-[#282D37]">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-medium text-zinc-400">
              <span>Fortschritt</span>
              <span className="text-[#F1F3F7] font-bold">
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

            <div className="w-full h-1.5 bg-[#0F1117] rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-300 rounded-full',
                  isCompleted
                    ? 'bg-emerald-400'
                    : typeProgressColors[item.type]
                )}
                style={{ width: `${totalProgress > 0 ? percentage : Math.min(100, currentProgress * 5)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
