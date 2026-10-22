'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Star,
  Plus,
  Minus,
  Check,
  Calendar,
  Clock,
  Film,
  Tv,
  Sparkles,
  BookOpen,
  Gamepad2,
  PackageCheck,
  Edit2,
  CheckCircle2,
  BookmarkCheck,
  PlayCircle,
  PauseCircle,
  ExternalLink,
  MessageSquare,
  Users,
  Info,
  Award,
  Trophy,
  Layers,
} from 'lucide-react';
import { MediaItem, MediaStatus, MediaType } from '@/types/media';
import { getStoredMedia, updateMediaItem, deleteMediaItem } from '@/lib/storage';
import { getMediaTypeBadge, getMediaStatusBadge, getUnitIncrement, getProgressUnitLabel, cn } from '@/lib/utils';
import { getEnrichedMediaDetails, EnrichedMediaDetails } from '@/lib/media-details';
import { EditMediaModal } from '@/components/EditMediaModal';
import { getMediaCoverFallback } from '@/lib/book-cover';

export default function MediaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = (params?.id as string) || '';
  const id = rawId ? decodeURIComponent(rawId) : '';

  const [item, setItem] = useState<MediaItem | null>(null);
  const [details, setDetails] = useState<EnrichedMediaDetails | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'cast' | 'reviews' | 'notes'>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [personalNotes, setPersonalNotes] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!id && !rawId) return;
    const all = getStoredMedia();
    const found = all.find(
      (m) =>
        m.id === id ||
        m.id === rawId ||
        encodeURIComponent(m.id) === rawId ||
        decodeURIComponent(m.id) === id ||
        m.external_id === id ||
        m.external_id === rawId
    );
    if (found) {
      let active = found;
      if (found.progress.total && found.progress.total > 0 && found.progress.current > found.progress.total) {
        const clamped = updateMediaItem(found.id, {
          progress: { ...found.progress, current: found.progress.total },
          status: found.status !== 'owned' ? 'completed' : found.status,
        });
        if (clamped) active = clamped;
      }
      setItem(active);
      setDetails(getEnrichedMediaDetails(active));
      setPersonalNotes(active.notes || '');

      // Dynamically fetch real Open Library reader rating if missing
      if (active.type === 'book' && !active.communityRating) {
        const queryTerm = active.isbn ? `isbn:${active.isbn}` : active.title;
        fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(queryTerm)}&fields=key,ratings_average,ratings_count&limit=1`,
          { headers: { 'User-Agent': 'OmniList/1.0' } }
        )
          .then((res) => res.json())
          .then((data) => {
            const doc = data.docs?.[0];
            if (doc && doc.ratings_average && doc.ratings_count > 0) {
              const commRating = Math.round(doc.ratings_average * 10) / 10;
              const commCount = doc.ratings_count;
              const updatedItem = updateMediaItem(active.id, {
                communityRating: commRating,
                communityRatingsCount: commCount,
              });
              if (updatedItem) {
                setItem(updatedItem);
                setDetails(getEnrichedMediaDetails(updatedItem));
              }
            }
          })
          .catch((err) => console.warn('Could not fetch book ratings:', err));
      }
    }
    setIsLoaded(true);
  }, [id]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0F1117] flex items-center justify-center text-zinc-400">
        <div className="animate-spin text-zinc-300 w-8 h-8 border-2 border-zinc-600 border-t-zinc-200 rounded-full" />
      </div>
    );
  }

  if (!item || !details) {
    return (
      <div className="min-h-screen bg-[#0F1117] flex flex-col items-center justify-center text-center p-6 text-zinc-300">
        <h2 className="text-xl font-bold mb-2 text-[#F1F3F7]">Medium nicht gefunden</h2>
        <p className="text-xs text-zinc-400 mb-6">Dieser Eintrag existiert nicht oder wurde aus der Sammlung gelöscht.</p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-full bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs shadow-md transition-all"
        >
          Zurück zur Mediensammlung
        </Link>
      </div>
    );
  }

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

  const currentProgress = item.progress.current;
  const totalProgress = item.progress.total || 0;
  const percentage = totalProgress > 0 ? Math.min(100, Math.round((currentProgress / totalProgress) * 100)) : 0;
  const isCompleted =
    item.status === 'completed' ||
    (isGame ? isGame100Done || isGameStoryDone : totalProgress > 0 && currentProgress >= totalProgress);

  // Quick Progress Increment
  const handleIncrement = (customAmount?: number) => {
    if (isGame) {
      const step = customAmount || 1;
      const nextHours = gamePlaytime + step;
      const updated = updateMediaItem(item.id, {
        progress: { ...item.progress, current: nextHours, total: undefined },
        gameTracker: { ...(item.gameTracker || {}), playtimeHours: nextHours },
        status: item.status === 'planned' ? 'in_progress' : item.status,
      });
      if (updated) setItem(updated);
      return;
    }

    if (totalProgress > 0 && currentProgress >= totalProgress) return;
    const step = customAmount || 1;
    const nextCurrent = currentProgress + step;
    const newCurrent = totalProgress > 0 ? Math.min(totalProgress, nextCurrent) : nextCurrent;
    const isNowCompleted = totalProgress > 0 && newCurrent >= totalProgress;
    const updated = updateMediaItem(item.id, {
      progress: { ...item.progress, current: newCurrent },
      status: isNowCompleted
        ? 'completed'
        : item.status === 'planned'
        ? 'in_progress'
        : item.status,
    });
    if (updated) setItem(updated);
  };

  // Quick Progress Decrement
  const handleDecrement = (customAmount?: number) => {
    if (isGame) {
      if (gamePlaytime <= 0) return;
      const step = customAmount || 1;
      const nextHours = Math.max(0, gamePlaytime - step);
      const updated = updateMediaItem(item.id, {
        progress: { ...item.progress, current: nextHours, total: undefined },
        gameTracker: { ...(item.gameTracker || {}), playtimeHours: nextHours },
      });
      if (updated) setItem(updated);
      return;
    }

    if (currentProgress <= 0) return;
    const step = customAmount || 1;
    const newCurrent = Math.max(0, currentProgress - step);
    const updated = updateMediaItem(item.id, {
      progress: { ...item.progress, current: newCurrent },
      status:
        item.status === 'completed' &&
        ((totalProgress > 0 && newCurrent < totalProgress) || totalProgress === 0)
          ? 'in_progress'
          : item.status,
    });
    if (updated) setItem(updated);
  };

  // Toggle Game Story
  const handleToggleGameStory = () => {
    if (!item) return;
    const newStory = !item.gameTracker?.storyCompleted;
    const updated = updateMediaItem(item.id, {
      gameTracker: {
        ...(item.gameTracker || {}),
        storyCompleted: newStory,
      },
      status: newStory && item.status !== 'owned' ? 'completed' : item.status,
    });
    if (updated) setItem(updated);
  };

  // Toggle Game 100%
  const handleToggleGame100 = () => {
    if (!item) return;
    const new100 = !item.gameTracker?.completionist100;
    const updated = updateMediaItem(item.id, {
      gameTracker: {
        ...(item.gameTracker || {}),
        completionist100: new100,
        storyCompleted: new100 ? true : item.gameTracker?.storyCompleted,
      },
      status: new100 && item.status !== 'owned' ? 'completed' : item.status,
    });
    if (updated) setItem(updated);
  };

  // Toggle Game Achievements Checkbox
  const handleToggleAchievements = () => {
    if (!item) return;
    const isCurrentlyDone = Boolean(
      item.gameTracker?.allAchievementsCompleted ||
      (item.gameTracker?.achievements &&
        item.gameTracker.achievements.total > 0 &&
        item.gameTracker.achievements.current >= item.gameTracker.achievements.total)
    );
    const newDone = !isCurrentlyDone;
    const updated = updateMediaItem(item.id, {
      gameTracker: {
        ...(item.gameTracker || {}),
        allAchievementsCompleted: newDone,
        achievements: undefined,
        completionist100: newDone ? true : item.gameTracker?.completionist100,
        storyCompleted: newDone ? true : item.gameTracker?.storyCompleted,
      },
      status: newDone && item.status !== 'owned' ? 'completed' : item.status,
    });
    if (updated) setItem(updated);
  };

  // Toggle Owned Status
  const handleToggleOwned = () => {
    const updated = updateMediaItem(item.id, { isOwned: !item.isOwned });
    if (updated) setItem(updated);
  };

  // Update Status
  const handleStatusChange = (newStatus: MediaStatus) => {
    if (!item) return;
    const isCompleted = newStatus === 'completed';
    const total = item.progress?.total;

    const updated = updateMediaItem(item.id, {
      status: newStatus,
      progress:
        isCompleted && total && total > 0
          ? { ...item.progress, current: total }
          : item.progress,
    });
    if (updated) setItem(updated);
  };

  // Save Notes
  const handleSaveNotes = () => {
    const updated = updateMediaItem(item.id, { notes: personalNotes.trim() || undefined });
    if (updated) {
      setItem(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  // Category specific accent styles
  const typeAccentBorder: Record<MediaType, string> = {
    movie: 'border-rose-500/40',
    show: 'border-amber-500/40',
    anime: 'border-sky-500/40',
    book: 'border-orange-500/40',
    game: 'border-purple-500/40',
  };

  const typeAccentBg: Record<MediaType, string> = {
    movie: 'bg-rose-500 hover:bg-rose-400 text-white',
    show: 'bg-amber-500 hover:bg-amber-400 text-zinc-950',
    anime: 'bg-sky-500 hover:bg-sky-400 text-zinc-950',
    book: 'bg-orange-500 hover:bg-orange-400 text-white',
    game: 'bg-purple-500 hover:bg-purple-400 text-white',
  };

  const typeProgressBar: Record<MediaType, string> = {
    movie: 'bg-rose-500',
    show: 'bg-amber-500',
    anime: 'bg-sky-500',
    book: 'bg-orange-500',
    game: 'bg-purple-500',
  };

  return (
    <div className="min-h-screen bg-[#0F1117] text-[#F1F3F7] antialiased">
      {/* Top Sticky Bar */}
      <header className="sticky top-0 z-30 bg-[#0F1117]/90 backdrop-blur-md border-b border-[#282D37] px-3.5 sm:px-6 py-2.5 sm:py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-all border border-zinc-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden xs:inline sm:inline">Zurück zur Übersicht</span>
            <span className="inline xs:hidden sm:hidden">Zurück</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-[#181B22] hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold border border-[#282D37] transition-all"
            >
              <Edit2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Bearbeiten</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Header with Backdrop Banner */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#181B22] to-[#0F1117] border-b border-[#282D37] pt-6 sm:pt-8 pb-8 sm:pb-12">
        {/* Subtle glowing ambient lighting */}
        <div className="absolute top-0 right-0 w-[500px] h-[350px] bg-gradient-to-b from-zinc-700/10 via-zinc-800/5 to-transparent blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
            {/* Poster Card */}
            <div className={cn(
              'w-48 sm:w-56 md:w-64 aspect-poster rounded-2xl overflow-hidden bg-[#181B22] border-2 shadow-2xl flex-shrink-0 relative group transition-transform duration-300 hover:scale-[1.02]',
              typeAccentBorder[item.type]
            )}>
              <img
                src={item.coverUrl && !item.coverUrl.includes('images.unsplash.com') ? item.coverUrl : getMediaCoverFallback(item)}
                alt={item.title}
                className="w-full h-full object-cover"
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              
              {/* Type Badge Top Left */}
              <div className="absolute top-3 left-3">
                <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase shadow-md backdrop-blur border', typeBadge.bgClass, typeBadge.colorClass, typeBadge.borderClass)}>
                  {typeBadge.label}
                </span>
              </div>
            </div>

            {/* Main Info Header */}
            <div className="flex-1 space-y-4 text-center md:text-left">
              {/* Category & Status Badges */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className={cn('text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap shrink-0', statusBadge.bgClass, statusBadge.colorClass)}>
                  {statusBadge.label}
                </span>

                {item.isOwned && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0">
                    <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Im Besitz (Gekauft)</span>
                  </span>
                )}

                {item.collection_name && (
                  <span className="text-xs font-medium px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {item.collection_name}
                  </span>
                )}

                {item.connectedService && (
                  <span
                    className={cn(
                      'text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0',
                      item.connectedService === 'steam'
                        ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                        : item.connectedService === 'psn'
                        ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                        : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                    )}
                  >
                    <Gamepad2 className="w-3.5 h-3.5" />
                    <span>
                      {item.gameConnection?.serviceName || item.connectedService.toUpperCase()}
                      {item.gameConnection?.accountUsername ? ` (${item.gameConnection.accountUsername})` : ' verknüpft'}
                    </span>
                  </span>
                )}
              </div>

              {/* Title & Tagline */}
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#F1F3F7]">
                  {item.title}
                </h1>
                {item.originalTitle && item.originalTitle !== item.title && (
                  <p className="text-sm font-medium text-zinc-400 mt-1 italic">
                    Originaltitel: {item.originalTitle}
                  </p>
                )}
                {details.tagline && (
                  <p className="text-sm text-zinc-300 mt-2 font-medium">
                    &bdquo;{details.tagline}&ldquo;
                  </p>
                )}
              </div>

              {/* Metadata Badges Bar */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-zinc-400 pt-1">
                {item.releaseDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Erschienen: {item.releaseDate.split('-')[0]}</span>
                  </div>
                )}

                {details.duration && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{details.duration}</span>
                  </div>
                )}

                {details.ageRating && (
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold border border-zinc-700">
                    {details.ageRating}
                  </span>
                )}

                {details.language && (
                  <span className="text-zinc-400">
                    Sprache: {details.language}
                  </span>
                )}
              </div>

              {/* Ratings Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 max-w-lg mx-auto md:mx-0">
                <div className="p-3 rounded-xl bg-[#181B22] border border-[#282D37] text-center md:text-left">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Eigene Wertung</span>
                  <div className="flex items-center justify-center md:justify-start gap-1.5 mt-0.5">
                    <Star
                      className={cn(
                        'w-4 h-4',
                        item.rating !== undefined && item.rating !== null
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-zinc-600'
                      )}
                    />
                    <span
                      className={cn(
                        'text-base font-bold',
                        item.rating !== undefined && item.rating !== null
                          ? 'text-[#F1F3F7]'
                          : 'text-zinc-500 text-sm font-medium'
                      )}
                    >
                      {item.rating !== undefined && item.rating !== null
                        ? `${item.rating.toFixed(1)} / 5.0`
                        : 'Nicht bewertet'}
                    </span>
                  </div>
                </div>

                {details.scores.critics && (
                  <div className="p-3 rounded-xl bg-[#181B22] border border-[#282D37] text-center md:text-left">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block truncate" title={details.scores.criticsLabel}>
                      {details.scores.criticsLabel || 'Kritiker-Score'}
                    </span>
                    <span className="text-base font-bold text-amber-400 block mt-0.5">
                      {details.scores.critics}
                    </span>
                  </div>
                )}

                {details.scores.audience && (
                  <div className="p-3 rounded-xl bg-[#181B22] border border-[#282D37] text-center md:text-left">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block truncate" title={details.scores.audienceLabel}>
                      {details.scores.audienceLabel || 'Publikum'}
                    </span>
                    <span className="text-base font-bold text-sky-400 block mt-0.5">
                      {details.scores.audience}
                    </span>
                  </div>
                )}
              </div>

              {/* Interactive Quick-Controls Bar */}
              <div className="pt-4 flex flex-wrap items-center justify-center md:justify-start gap-3">
                {isGame ? (
                  <>
                    {/* Game Playtime: -10, -1, +1, +10 */}
                    <div className="inline-flex items-center bg-[#181B22] border border-[#282D37] rounded-full p-1 shadow-lg">
                      <div className="px-3 py-1 text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-white font-extrabold">{gamePlaytime}</span>
                        <span className="text-zinc-400 font-medium">Std.</span>
                      </div>

                      <div className="w-px h-4 bg-[#282D37]" />

                      <button
                        onClick={() => handleDecrement(10)}
                        disabled={gamePlaytime <= 0}
                        className="px-2.5 py-1 rounded-full text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95"
                        title="-10 Stunden Spielzeit"
                      >
                        -10
                      </button>
                      <button
                        onClick={() => handleDecrement(1)}
                        disabled={gamePlaytime <= 0}
                        className="px-2.5 py-1 rounded-full text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95"
                        title="-1 Stunde Spielzeit"
                      >
                        -1
                      </button>

                      <div className="w-px h-4 bg-[#282D37]" />

                      <button
                        onClick={() => handleIncrement(1)}
                        className="px-2.5 py-1 rounded-full text-xs font-bold text-zinc-200 hover:text-white hover:bg-zinc-800 transition-all active:scale-95"
                        title="+1 Stunde Spielzeit"
                      >
                        +1
                      </button>
                      <button
                        onClick={() => handleIncrement(10)}
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-bold transition-all active:scale-95 shadow-sm',
                          typeAccentBg.game
                        )}
                        title="+10 Stunden Spielzeit"
                      >
                        +10
                      </button>
                    </div>

                    {/* Game: Story Toggle */}
                    <button
                      onClick={handleToggleGameStory}
                      className={cn(
                        'flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs border transition-all active:scale-95',
                        isGameStoryDone
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : 'bg-[#181B22] text-zinc-400 hover:text-white border-[#282D37]'
                      )}
                    >
                      <Check className="w-3.5 h-3.5 text-purple-400 stroke-[2.5]" />
                      <span>{isGameStoryDone ? 'Story beendet' : 'Story offen'}</span>
                    </button>

                    {/* Game: 100% Toggle */}
                    <button
                      onClick={handleToggleGame100}
                      className={cn(
                        'flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs border transition-all active:scale-95',
                        isGame100Done
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-[#181B22] text-zinc-400 hover:text-white border-[#282D37]'
                      )}
                    >
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isGame100Done ? '100% Gemeistert' : '100% offen'}</span>
                    </button>
                  </>
                ) : isMovie ? (
                  <>
                    {/* Movie: Runtime Progress */}
                    <div className="inline-flex items-center bg-[#181B22] border border-[#282D37] rounded-full p-1 shadow-lg">
                      <div className="px-3 py-1 text-xs font-bold text-zinc-300">
                        <span className="text-white font-extrabold">{currentProgress}</span>
                        {totalProgress > 0 && <span className="text-zinc-500"> / {totalProgress}</span>}{' '}
                        <span className="text-zinc-400 font-medium">Min.</span>
                      </div>

                      <div className="w-px h-4 bg-[#282D37]" />

                      <button
                        onClick={() => handleDecrement(15)}
                        disabled={currentProgress <= 0}
                        className="px-2.5 py-1 rounded-full text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95"
                        title="-15 Minuten zurückspulen"
                      >
                        -15
                      </button>

                      <div className="w-px h-4 bg-[#282D37]" />

                      <button
                        onClick={() => handleIncrement(15)}
                        disabled={isCompleted}
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-bold transition-all active:scale-95 shadow-sm',
                          isCompleted
                            ? 'opacity-30 cursor-default bg-zinc-800 text-zinc-500'
                            : typeAccentBg.movie
                        )}
                        title="+15 Minuten weiterschauen"
                      >
                        +15
                      </button>
                    </div>

                    {isCompleted && (
                      <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                        <span>Film angesehen</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Shows / Anime / Books: Progress -10, -1, +1, +10 */}
                    <div className="inline-flex items-center bg-[#181B22] border border-[#282D37] rounded-full p-1 shadow-lg">
                      <div className="px-3 py-1 text-xs font-bold text-zinc-300">
                        <span className="text-white font-extrabold">{currentProgress}</span>
                        {totalProgress > 0 && <span className="text-zinc-500"> / {totalProgress}</span>}{' '}
                        <span className="text-zinc-400 font-medium">
                          {getProgressUnitLabel(item.type, item.progress.unit)}
                        </span>
                      </div>

                      <div className="w-px h-4 bg-[#282D37]" />

                      <button
                        onClick={() => handleDecrement(10)}
                        disabled={currentProgress <= 0}
                        className="px-2.5 py-1 rounded-full text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95"
                        title={`-10 ${getProgressUnitLabel(item.type, item.progress.unit)}`}
                      >
                        -10
                      </button>
                      <button
                        onClick={() => handleDecrement(1)}
                        disabled={currentProgress <= 0}
                        className="px-2.5 py-1 rounded-full text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95"
                        title={`-1 ${getProgressUnitLabel(item.type, item.progress.unit)}`}
                      >
                        -1
                      </button>

                      <div className="w-px h-4 bg-[#282D37]" />

                      <button
                        onClick={() => handleIncrement(1)}
                        disabled={isCompleted}
                        className="px-2.5 py-1 rounded-full text-xs font-bold text-zinc-200 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95"
                        title={`+1 ${getProgressUnitLabel(item.type, item.progress.unit)}`}
                      >
                        +1
                      </button>
                      <button
                        onClick={() => handleIncrement(10)}
                        disabled={isCompleted}
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-bold transition-all active:scale-95 shadow-sm',
                          isCompleted
                            ? 'opacity-30 cursor-default bg-zinc-800 text-zinc-500'
                            : typeAccentBg[item.type]
                        )}
                        title={`+10 ${getProgressUnitLabel(item.type, item.progress.unit)}`}
                      >
                        +10
                      </button>
                    </div>

                    {isCompleted && (
                      <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                        <span>Alle {getProgressUnitLabel(item.type, item.progress.unit)} beendet</span>
                      </div>
                    )}
                  </>
                )}

                {/* Status Switcher Dropdown */}
                <select
                  value={item.status === 'owned' ? 'planned' : item.status}
                  onChange={(e) => handleStatusChange(e.target.value as MediaStatus)}
                  className="bg-[#181B22] text-[#F1F3F7] border border-[#282D37] rounded-full px-4 py-2 text-xs font-bold focus:outline-none focus:border-zinc-500 cursor-pointer"
                >
                  <option value="in_progress">Gerade dabei</option>
                  <option value="planned">Geplant</option>
                  <option value="completed">Beendet</option>
                  <option value="paused">Pausiert</option>
                  <option value="dropped">Abgebrochen</option>
                </select>

                {/* Toggle Owned Button */}
                <button
                  onClick={handleToggleOwned}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border transition-all active:scale-95',
                    item.isOwned
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                      : 'bg-[#181B22] text-zinc-400 hover:text-white border-[#282D37]'
                  )}
                  title="Im Besitz (mit jedem Status kombinierbar)"
                >
                  <PackageCheck className={cn("w-4 h-4", item.isOwned ? "text-emerald-400" : "text-zinc-500")} />
                  <span>{item.isOwned ? 'Im Besitz' : '+ Als "Im Besitz" markieren'}</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-[#181B22] border-b border-[#282D37] sticky top-[49px] sm:top-[57px] z-20">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 flex items-center gap-2 overflow-x-auto py-2 scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              'px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap',
              activeTab === 'overview'
                ? 'bg-zinc-100 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            )}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Übersicht &amp; Fakten</span>
          </button>

          <button
            onClick={() => setActiveTab('cast')}
            className={cn(
              'px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap',
              activeTab === 'cast'
                ? 'bg-zinc-100 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            )}
          >
            {item.type === 'book' ? (
              <BookOpen className="w-3.5 h-3.5" />
            ) : (
              <Users className="w-3.5 h-3.5" />
            )}
            <span>
              {item.type === 'book'
                ? `Autor & Mitwirkende (${details.cast.length})`
                : item.type === 'anime'
                ? `Charaktere & Sprecher (${details.cast.length})`
                : item.type === 'game'
                ? `Besetzung & Team (${details.cast.length})`
                : `Besetzung & Stab (${details.cast.length})`}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={cn(
              'px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap',
              activeTab === 'reviews'
                ? 'bg-zinc-100 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            )}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Kritiken &amp; Community ({details.reviews.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={cn(
              'px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap',
              activeTab === 'notes'
                ? 'bg-zinc-100 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            )}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Notizen &amp; Fortschritt</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-3.5 sm:px-6 py-6 sm:py-10 pb-20">
        {/* ================= TAB 1: OVERVIEW ================= */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left 2 Cols: Description & Details */}
            <div className="md:col-span-2 space-y-6">
              <div className="p-6 rounded-2xl bg-[#181B22] border border-[#282D37] space-y-4">
                <h3 className="text-base font-bold text-[#F1F3F7]">Handlung &amp; Zusammenfassung</h3>
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                  {item.summary || 'Keine Zusammenfassung hinterlegt.'}
                </p>

                {/* Genre Tags */}
                {item.genres && item.genres.length > 0 && (
                  <div className="pt-3 border-t border-[#282D37]">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">Genres &amp; Themen</span>
                    <div className="flex flex-wrap gap-2">
                      {item.genres.map((g) => (
                        <span key={g} className="text-xs px-3 py-1 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700 font-medium">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Type-Specific Game Playtime Stats */}
              {item.type === 'game' && details.playtime && (
                <div className="p-6 rounded-2xl bg-[#181B22] border border-[#282D37] space-y-3">
                  <h3 className="text-base font-bold text-[#F1F3F7]">Durchschnittliche Spielzeit (HowLongToBeat)</h3>
                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-[#0F1117] border border-[#282D37] text-center">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Hauptstory</span>
                      <span className="text-sm font-bold text-[#F1F3F7]">{details.playtime.mainStory}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#0F1117] border border-[#282D37] text-center">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Story + Extras</span>
                      <span className="text-sm font-bold text-amber-400">{details.playtime.extras}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#0F1117] border border-[#282D37] text-center">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Completionist (100%)</span>
                      <span className="text-sm font-bold text-purple-400">{details.playtime.completionist}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Col: Key Metadata Sidebar */}
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-[#181B22] border border-[#282D37] space-y-3 text-xs">
                <h4 className="font-bold text-[#F1F3F7] text-sm pb-2 border-b border-[#282D37]">
                  Wichtigste Daten
                </h4>

                {/* Dynamic specs depending on type */}
                {details.director && (
                  <div>
                    <span className="text-zinc-500 block">Regie / Leitung:</span>
                    <span className="font-bold text-zinc-200">{details.director}</span>
                  </div>
                )}

                {details.studio && (
                  <div>
                    <span className="text-zinc-500 block">Studio:</span>
                    <span className="font-bold text-zinc-200">{details.studio}</span>
                  </div>
                )}

                {details.developer && (
                  <div>
                    <span className="text-zinc-500 block">Entwickler:</span>
                    <span className="font-bold text-zinc-200">{details.developer}</span>
                  </div>
                )}

                {(details.publisher || item.publisher) ? (
                  <div className="flex items-center justify-between group">
                    <div>
                      <span className="text-zinc-500 block">
                        {item.type === 'book' ? 'Verlag / Herausgeber:' : 'Publisher / Verlag:'}
                      </span>
                      <span className="font-bold text-zinc-200">{item.publisher || details.publisher}</span>
                    </div>
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="opacity-0 group-hover:opacity-100 px-2 py-0.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-medium transition-all flex items-center gap-1"
                      title="Verlag anpassen"
                    >
                      <Edit2 className="w-3 h-3 text-orange-400" />
                      <span>Ändern</span>
                    </button>
                  </div>
                ) : item.type === 'book' ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-zinc-500 block">Verlag / Herausgeber:</span>
                      <span className="text-zinc-500 text-xs italic">Kein Verlag hinterlegt</span>
                    </div>
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="px-2 py-0.5 rounded-md bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-xs font-semibold border border-orange-500/30 transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Verlag eintragen</span>
                    </button>
                  </div>
                ) : null}

                {details.writers && details.writers.length > 0 && (
                  <div>
                    <span className="text-zinc-500 block">
                      {item.type === 'book' ? 'Autor / Verfasser:' : 'Autoren / Schöpfer:'}
                    </span>
                    <span className="font-bold text-zinc-200">{details.writers.join(', ')}</span>
                  </div>
                )}

                {details.pageCount && (
                  <div>
                    <span className="text-zinc-500 block">Umfang:</span>
                    <span className="font-bold text-zinc-200">{details.pageCount} Seiten</span>
                  </div>
                )}

                {details.isbn && (
                  <div>
                    <span className="text-zinc-500 block">ISBN (Ausgabe):</span>
                    <span className="font-mono font-bold text-orange-400">{details.isbn}</span>
                  </div>
                )}

                {details.platforms && details.platforms.length > 0 && (
                  <div>
                    <span className="text-zinc-500 block mb-1">Verfügbare Plattformen:</span>
                    <div className="flex flex-wrap gap-1">
                      {details.platforms.map((p) => (
                        <span key={p} className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-[#282D37]">
                  <span className="text-zinc-500 block">Daten-ID:</span>
                  <span className="font-mono text-[11px] text-zinc-400">{item.external_id}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: CAST & VOICES ================= */}
        {activeTab === 'cast' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#F1F3F7]">
                  {item.type === 'anime'
                    ? 'Charaktere & Synchronsprecher (Seiyuu)'
                    : item.type === 'book'
                    ? 'Autoren & Mitwirkende'
                    : item.type === 'game'
                    ? 'Besetzung, Sprecher & Game Director'
                    : 'Schauspieler & Rollenbesetzung'}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {item.type === 'book'
                    ? 'Schriftsteller, Verfasser und ggf. deutsche Übersetzung'
                    : item.type === 'anime'
                    ? 'Charaktere, japanische Originalstimmen und Synchronisation'
                    : item.type === 'game'
                    ? 'Synchronsprecher, Motion Capture und leitende Entwickler'
                    : 'Hauptdarsteller, Regie und Lokalisierungsstimmen'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {details.cast.map((c, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-[#181B22] border border-[#282D37] flex items-start gap-3.5 hover:border-zinc-600 transition-all"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0 border border-zinc-700">
                    {c.avatarUrl ? (
                      <img src={c.avatarUrl} alt={c.name} className="w-full h-full object-cover" />
                    ) : item.type === 'book' ? (
                      <BookOpen className="w-5 h-5 text-orange-400" />
                    ) : (
                      <Users className="w-5 h-5 text-zinc-400" />
                    )}
                  </div>

                  {/* Character & Actor Info */}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-[#F1F3F7] truncate">{c.name}</h4>
                    <p className="text-xs text-zinc-400 font-medium truncate">{c.role}</p>

                    {/* Anime Specific: Japanese Voice Actor & German Voice Actor */}
                    {c.voiceActorJp && (
                      <div className="mt-2 text-[11px] text-sky-300 bg-sky-950/30 border border-sky-900/40 rounded px-2 py-0.5 truncate">
                        JP: {c.voiceActorJp}
                      </div>
                    )}
                    {c.voiceActorDe && (
                      <div className="mt-1 text-[11px] text-amber-300 bg-amber-950/30 border border-amber-900/40 rounded px-2 py-0.5 truncate">
                        DE: {c.voiceActorDe}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 3: REVIEWS & SCORES ================= */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-[#F1F3F7]">Kritiken &amp; Rezensionen</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Offizielle Pressestimmen und Community-Wertungen</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {details.reviews.map((rev, i) => (
                <div key={i} className="p-5 rounded-2xl bg-[#181B22] border border-[#282D37] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-[#F1F3F7]">{rev.author}</h4>
                      <span className="text-[11px] text-zinc-500">{rev.source} • {rev.date}</span>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {rev.score}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed italic">
                    &bdquo;{rev.text}&ldquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 4: NOTES & PROGRESS ================= */}
        {activeTab === 'notes' && (
          <div className="max-w-2xl space-y-6">
            {isGame ? (
              /* ================= SPECIALIZED GAME TRACKER ================= */
              <div className="space-y-4">
                {/* 1. Open Playtime Card */}
                <div className="p-6 rounded-2xl bg-[#181B22] border border-[#282D37] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-[#F1F3F7] flex items-center gap-2">
                        <Clock className="w-4 h-4 text-purple-400" />
                        <span>Offene Spielzeit</span>
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Kein künstliches Limit – erfasse deine tatsächliche Spielzeit flexibel.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-purple-400">
                        {gamePlaytime}
                      </span>
                      <span className="text-xs font-bold text-zinc-400 ml-1">Std.</span>
                    </div>
                  </div>

                  {/* Playtime Quick Adjust Buttons */}
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <div className="inline-flex items-center bg-[#0F1117] border border-[#282D37] rounded-full p-1 shadow-md">
                      <button
                        onClick={() => handleDecrement(10)}
                        disabled={gamePlaytime <= 0}
                        className="px-3 py-1.5 rounded-full text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95"
                        title="-10 Stunden Spielzeit"
                      >
                        -10 Std.
                      </button>
                      <button
                        onClick={() => handleDecrement(1)}
                        disabled={gamePlaytime <= 0}
                        className="px-3 py-1.5 rounded-full text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95"
                        title="-1 Stunde Spielzeit"
                      >
                        -1 Std.
                      </button>
                      <div className="w-px h-4 bg-[#282D37] mx-1" />
                      <button
                        onClick={() => handleIncrement(1)}
                        className="px-3 py-1.5 rounded-full text-xs font-bold text-zinc-200 hover:text-white hover:bg-zinc-800 transition-all active:scale-95"
                        title="+1 Stunde Spielzeit"
                      >
                        +1 Std.
                      </button>
                      <button
                        onClick={() => handleIncrement(10)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-purple-500 hover:bg-purple-400 text-white shadow-sm transition-all active:scale-95"
                        title="+10 Stunden Spielzeit"
                      >
                        +10 Std.
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Story Campaign & 100% Completion Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Story Card */}
                  <div className={cn(
                    "p-5 rounded-2xl border transition-all space-y-3",
                    isGameStoryDone
                      ? "bg-purple-950/20 border-purple-500/40"
                      : "bg-[#181B22] border-[#282D37]"
                  )}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        Hauptstory / Kampagne
                      </span>
                      <span className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded-full",
                        isGameStoryDone
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                          : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                      )}>
                        {isGameStoryDone ? "Beendet" : "Noch offen"}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Hast du die Hauptgeschichte oder die Kernkampagne des Spiels durchgespielt?
                    </p>
                    <button
                      onClick={handleToggleGameStory}
                      className={cn(
                        "w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2",
                        isGameStoryDone
                          ? "bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40"
                          : "bg-purple-600 hover:bg-purple-500 text-white shadow-lg"
                      )}
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>{isGameStoryDone ? "Als offen markieren" : "Story als beendet markieren"}</span>
                    </button>
                  </div>

                  {/* 100% Completionist Card */}
                  <div className={cn(
                    "p-5 rounded-2xl border transition-all space-y-3",
                    isGame100Done
                      ? "bg-amber-950/20 border-amber-500/40"
                      : "bg-[#181B22] border-[#282D37]"
                  )}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        100% Completionist
                      </span>
                      <span className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1",
                        isGame100Done
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                      )}>
                        <span>{isGame100Done ? "100% Meister" : "Offen"}</span>
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Alle Nebenquests, Sammelgegenstände und Enden zu 100% komplettiert.
                    </p>
                    <button
                      onClick={handleToggleGame100}
                      className={cn(
                        "w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2",
                        isGame100Done
                          ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40"
                          : "bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-lg font-extrabold"
                      )}
                    >
                      <Trophy className="w-4 h-4" />
                      <span>{isGame100Done ? "100% Status aufheben" : "Als 100% gemeistert markieren"}</span>
                    </button>
                  </div>
                </div>

                {/* 3. Achievements / Trophies Tracker (Checkbox) */}
                <div className="p-6 rounded-2xl bg-[#181B22] border border-[#282D37] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-[#F1F3F7] flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-400" />
                        <span>Alle Erfolge &amp; Trophäen (100% Achievements)</span>
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
                        {isGameAchievementsDone
                          ? 'Alle Trophäen bzw. Steam-/Konsolen-Erfolge wurden für dieses Spiel vollständig freigeschaltet (Platin / 100%).'
                          : 'Markiere, ob du alle Erfolge dieses Spiels vollständig erreicht hast (entweder alle oder offen).'}
                      </p>
                    </div>

                    <label
                      className={cn(
                        'inline-flex items-center gap-3 px-4 py-2.5 rounded-xl border cursor-pointer select-none transition-all active:scale-95 shrink-0',
                        isGameAchievementsDone
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-950/30 font-bold'
                          : 'bg-[#0F1117] text-zinc-400 border-[#282D37] hover:border-zinc-600 hover:text-zinc-200'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isGameAchievementsDone}
                        onChange={handleToggleAchievements}
                        className="w-5 h-5 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500 cursor-pointer accent-amber-500"
                      />
                      <span className="text-xs font-bold">
                        {isGameAchievementsDone ? 'Alle Erfolge freigeschaltet ✓' : 'Erfolge offen'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            ) : isMovie ? (
              /* ================= MOVIE RUNTIME TRACKER ================= */
              <div className="p-6 rounded-2xl bg-[#181B22] border border-[#282D37] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#F1F3F7]">Laufzeit &amp; Filmfortschritt</h3>
                    <p className="text-xs text-zinc-400">
                      {isCompleted ? 'Vollständig gesehen' : 'Fortschritt in Minuten erfassen'}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-[#F1F3F7]">
                    {isCompleted
                      ? `${totalProgress || currentProgress} Min.`
                      : `${currentProgress} / ${totalProgress || currentProgress} Min.`}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 bg-[#0F1117] rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-300',
                      isCompleted ? 'bg-emerald-400' : 'bg-rose-500'
                    )}
                    style={{ width: `${isCompleted ? 100 : percentage}%` }}
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => handleIncrement(15)}
                    disabled={isCompleted}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs shadow-md transition-all',
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                        : 'bg-rose-500 hover:bg-rose-400 text-white active:scale-95'
                    )}
                  >
                    {isCompleted ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                        <span>Film vollständig gesehen ({totalProgress || currentProgress} Min.)</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>+15 Minuten weiterschauen</span>
                      </>
                    )}
                  </button>
                  {currentProgress > 0 && !isCompleted && (
                    <button
                      onClick={() => handleDecrement(15)}
                      className="px-4 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700 transition-all active:scale-95"
                    >
                      -15 Min.
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* ================= SHOW / ANIME / BOOK TRACKER ================= */
              <div className="p-6 rounded-2xl bg-[#181B22] border border-[#282D37] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#F1F3F7]">Persönlicher Fortschritt</h3>
                    <p className="text-xs text-zinc-400">Passe deinen aktuellen Stand an</p>
                  </div>
                  <span className="text-sm font-bold text-[#F1F3F7]">
                    {currentProgress} {totalProgress > 0 ? `/ ${totalProgress}` : ''} {getProgressUnitLabel(item.type, item.progress.unit)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 bg-[#0F1117] rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-300',
                      isCompleted ? 'bg-emerald-400' : typeProgressBar[item.type]
                    )}
                    style={{ width: `${totalProgress > 0 ? percentage : Math.min(100, currentProgress * 5)}%` }}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <div className="inline-flex items-center bg-[#0F1117] border border-[#282D37] rounded-full p-1 shadow-md">
                    <button
                      onClick={() => handleDecrement(10)}
                      disabled={currentProgress <= 0}
                      className="px-3 py-1.5 rounded-full text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95"
                      title={`-10 ${getProgressUnitLabel(item.type, item.progress.unit)}`}
                    >
                      -10
                    </button>
                    <button
                      onClick={() => handleDecrement(1)}
                      disabled={currentProgress <= 0}
                      className="px-3 py-1.5 rounded-full text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95"
                      title={`-1 ${getProgressUnitLabel(item.type, item.progress.unit)}`}
                    >
                      -1
                    </button>
                    <div className="w-px h-4 bg-[#282D37] mx-1" />
                    <button
                      onClick={() => handleIncrement(1)}
                      disabled={isCompleted}
                      className="px-3 py-1.5 rounded-full text-xs font-bold text-zinc-200 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95"
                      title={`+1 ${getProgressUnitLabel(item.type, item.progress.unit)}`}
                    >
                      +1
                    </button>
                    <button
                      onClick={() => handleIncrement(10)}
                      disabled={isCompleted}
                      className={cn(
                        'px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 shadow-sm',
                        isCompleted
                          ? 'opacity-30 cursor-default bg-zinc-800 text-zinc-500'
                          : typeAccentBg[item.type]
                      )}
                      title={`+10 ${getProgressUnitLabel(item.type, item.progress.unit)}`}
                    >
                      +10
                    </button>
                  </div>

                  {isCompleted && (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                      <span>Alle {getProgressUnitLabel(item.type, item.progress.unit)} beendet</span>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Notes Section */}
            <div className="p-6 rounded-2xl bg-[#181B22] border border-[#282D37] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#F1F3F7]">Persönliche Notizen &amp; Gedanken</h3>
                {saveSuccess && (
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-fadeIn">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Gespeichert!
                  </span>
                )}
              </div>
              <textarea
                rows={5}
                value={personalNotes}
                onChange={(e) => setPersonalNotes(e.target.value)}
                placeholder="Eigene Gedanken, Lieblingszitate oder Review-Notizen zu diesem Titel festhalten..."
                className="w-full bg-[#0F1117] border border-[#282D37] focus:border-zinc-500 rounded-xl p-3.5 text-xs text-[#F1F3F7] focus:outline-none resize-none leading-relaxed"
              />
              <button
                onClick={handleSaveNotes}
                className="px-5 py-2 rounded-full bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs shadow-md transition-all active:scale-95"
              >
                Notizen speichern
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Edit Modal if triggered */}
      {isEditModalOpen && (
        <EditMediaModal
          item={item}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={(id, updates) => {
            const updated = updateMediaItem(id, updates);
            if (updated) {
              setItem(updated);
              setDetails(getEnrichedMediaDetails(updated));
            }
          }}
          onDelete={(deleteId) => {
            deleteMediaItem(deleteId);
            router.push('/');
          }}
        />
      )}
    </div>
  );
}
