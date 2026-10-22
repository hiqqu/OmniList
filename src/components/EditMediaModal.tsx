'use client';

import React, { useState, useEffect } from 'react';
import { X, Star, Trash2, Save, PackageCheck, BookOpen, Sparkles, Loader2, Image as ImageIcon, Gamepad2, Trophy, Clock, Building2, Layers, ChevronDown, ChevronUp, Infinity, Film } from 'lucide-react';
import { MediaItem, MediaStatus, ProgressUnit } from '@/types/media';
import { getMediaTypeBadge, cn } from '@/lib/utils';
import { formatIsbn } from '@/lib/api-adapters/googlebooks';
import { BookEditionItem } from '@/app/api/book-editions/route';
import { createBookSvgCover, getMediaCoverFallback } from '@/lib/book-cover';
import { isLiveServiceGame } from '@/lib/live-service';

interface EditMediaModalProps {
  item: MediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<MediaItem>) => void;
  onDelete: (id: string) => void;
}

export const EditMediaModal: React.FC<EditMediaModalProps> = ({
  item,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [creator, setCreator] = useState('');
  const [status, setStatus] = useState<MediaStatus>('in_progress');
  const [isOwned, setIsOwned] = useState<boolean>(false);
  const [rating, setRating] = useState<number | ''>('');
  const [metacritic, setMetacritic] = useState<number | ''>('');
  const [currentProgress, setCurrentProgress] = useState<number>(0);
  const [totalProgress, setTotalProgress] = useState<number>(0);
  const [unit, setUnit] = useState<ProgressUnit>('episodes');
  const [currentSeason, setCurrentSeason] = useState<number | ''>(1);
  const [totalSeasons, setTotalSeasons] = useState<number | ''>(1);
  const [summary, setSummary] = useState('');
  const [notes, setNotes] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [publisher, setPublisher] = useState('');
  const [isbnInput, setIsbnInput] = useState('');
  const [isFetchingIsbn, setIsFetchingIsbn] = useState(false);
  const [isbnFeedback, setIsbnFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Book Edition Picker State
  const [isEditionPickerOpen, setIsEditionPickerOpen] = useState(false);
  const [editionsList, setEditionsList] = useState<BookEditionItem[]>([]);
  const [isLoadingEditions, setIsLoadingEditions] = useState(false);
  const [editionPickerFilter, setEditionPickerFilter] = useState('');

  // Dedicated Game Tracker State
  const [gameStoryCompleted, setGameStoryCompleted] = useState<boolean>(false);
  const [gameCompletionist100, setGameCompletionist100] = useState<boolean>(false);
  const [gameAllAchievementsCompleted, setGameAllAchievementsCompleted] = useState<boolean>(false);
  const [gameIsLiveService, setGameIsLiveService] = useState<boolean>(false);
  const isGame = item?.type === 'game';

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setCreator(item.creator || '');
      setStatus(item.status);
      setIsOwned(Boolean(item.isOwned || item.status === 'owned'));
      setRating(typeof item.rating === 'number' ? item.rating : '');
      setMetacritic(typeof item.metacritic === 'number' ? item.metacritic : '');
      setCurrentProgress(item.progress.current);
      setTotalProgress(item.progress.total || 0);
      setUnit(item.progress.unit);
      setCurrentSeason(typeof item.progress.currentSeason === 'number' ? item.progress.currentSeason : 1);
      setTotalSeasons(typeof item.progress.totalSeasons === 'number' ? item.progress.totalSeasons : (item.type === 'show' ? 1 : ''));
      setSummary(item.summary || '');
      setNotes(item.notes || '');
      setCoverUrl(item.coverUrl || '');
      setPublisher(
        item.publisher ||
        (item.type === 'book' && item.collection_name
          ? item.collection_name.replace(/\s*Ausgabe$/i, '').trim()
          : '') ||
        ''
      );
      setIsbnFeedback(null);
      setIsEditionPickerOpen(false);
      setEditionsList([]);
      setEditionPickerFilter('');

      if (item.type === 'game') {
        setGameStoryCompleted(Boolean(item.gameTracker?.storyCompleted));
        setGameCompletionist100(Boolean(item.gameTracker?.completionist100));
        setGameAllAchievementsCompleted(Boolean(
          item.gameTracker?.allAchievementsCompleted ||
          (item.gameTracker?.achievements &&
            item.gameTracker.achievements.total > 0 &&
            item.gameTracker.achievements.current >= item.gameTracker.achievements.total)
        ));
        setGameIsLiveService(isLiveServiceGame(item));
      }

      if (item.type === 'book') {
        const existingIsbn = item.isbn || (item.external_id?.startsWith('isbn:')
          ? item.external_id.replace('isbn:', '')
          : '');
        setIsbnInput(existingIsbn ? formatIsbn(existingIsbn) : '');
      } else {
        setIsbnInput('');
      }
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const typeBadge = getMediaTypeBadge(item.type);

  const handleOpenEditionPicker = async () => {
    const nextState = !isEditionPickerOpen;
    setIsEditionPickerOpen(nextState);
    setEditionPickerFilter('');

    if (nextState && editionsList.length === 0) {
      setIsLoadingEditions(true);
      try {
        const queryParams = new URLSearchParams({
          title: title || item.title,
          author: item.creator || '',
        });
        const res = await fetch(`/api/book-editions?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setEditionsList(data.editions || []);
        }
      } catch (err) {
        console.error('Failed to load editions in EditMediaModal:', err);
      } finally {
        setIsLoadingEditions(false);
      }
    }
  };

  const handleApplyEdition = (edition: BookEditionItem) => {
    if (edition.coverUrl) setCoverUrl(edition.coverUrl);
    if (edition.pages) {
      setTotalProgress(edition.pages);
      setUnit('pages');
    }
    if (edition.publisher) setPublisher(edition.publisher);
    if (edition.isbn) setIsbnInput(edition.formattedIsbn || edition.isbn);
    setIsEditionPickerOpen(false);
    setIsbnFeedback({
      type: 'success',
      text: `Ausgabe übernommen: ${edition.publisher} (${edition.pages} Seiten, ISBN: ${edition.formattedIsbn || edition.isbn || '—'}).`,
    });
  };

  const handleFetchIsbn = async () => {
    const raw = isbnInput.trim();
    if (!raw) return;

    setIsFetchingIsbn(true);
    setIsbnFeedback(null);

    try {
      const res = await fetch(`/api/isbn?isbn=${encodeURIComponent(raw)}`);
      const data = await res.json();

      if (res.ok && data.found) {
        if (data.coverUrl) {
          setCoverUrl(data.coverUrl);
        }
        if (data.pages) {
          setTotalProgress(data.pages);
          setUnit('pages');
        }
        if (data.publisher) {
          setPublisher(data.publisher);
        }
        if (data.title && confirm(`Möchtest du den Titel auch auf "${data.title}" aktualisieren?`)) {
          setTitle(data.title);
        }
        setIsbnInput(data.formattedIsbn || raw);
        setIsbnFeedback({
          type: 'success',
          text: `Exakte Ausgabe gefunden! ${data.publisher ? `Verlag: ${data.publisher}.` : ''} Cover und Seitenzahl (${data.pages || '—'}) wurden übernommen.`,
        });
      } else {
        setIsbnFeedback({
          type: 'error',
          text: data.error || 'Keine Buch-Edition mit dieser ISBN bei Open Library gefunden.',
        });
      }
    } catch (e) {
      console.error('ISBN lookup error:', e);
      setIsbnFeedback({
        type: 'error',
        text: 'Netzwerkfehler beim Abrufen der ISBN-Daten.',
      });
    } finally {
      setIsFetchingIsbn(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isGame = item?.type === 'game';
    const isMovie = item.type === 'movie';
    const cleanIsbn = isbnInput.replace(/[-\s]/g, '').trim().toUpperCase();
    const updatedExternalId = item.type === 'book' && cleanIsbn ? `isbn:${cleanIsbn}` : item.external_id;

    const totalNum = isGame ? undefined : (Number(totalProgress) || undefined);
    let currentNum = totalNum && totalNum > 0 ? Math.min(Number(currentProgress), totalNum) : Number(currentProgress);
    let resolvedStatus = totalNum && currentNum >= totalNum && status !== 'owned' ? 'completed' : status;

    if (isGame && gameIsLiveService) {
      // Live-Service replaces completed/in_progress/dropped/paused. Only planned may coexist with live service.
      resolvedStatus = status === 'planned' ? 'planned' : 'in_progress';
    } else if (resolvedStatus === 'completed' && totalNum && totalNum > 0) {
      currentNum = totalNum;
    }

    onSave(item.id, {
      title,
      creator: creator.trim() || undefined,
      status: resolvedStatus,
      isOwned,
      isLiveService: isGame ? gameIsLiveService : undefined,
      rating: typeof rating === 'number' ? rating : undefined,
      metacritic: typeof metacritic === 'number' ? metacritic : undefined,
      summary: summary.trim() || undefined,
      notes: notes.trim() || undefined,
      publisher: publisher.trim() || undefined,
      collection_name: item.type === 'book'
        ? (publisher.trim() ? publisher.trim() : item.collection_name)
        : item.collection_name,
      isbn: cleanIsbn || undefined,
      coverUrl: coverUrl || item.coverUrl,
      external_id: updatedExternalId,
      progress: {
        ...item.progress,
        current: currentNum,
        total: totalNum,
        unit: isMovie ? 'minutes' : unit,
        currentSeason: item.type === 'show' ? (typeof currentSeason === 'number' ? currentSeason : 1) : item.progress.currentSeason,
        totalSeasons: item.type === 'show' ? (typeof totalSeasons === 'number' ? totalSeasons : 1) : item.progress.totalSeasons,
      },
      gameTracker: isGame
        ? {
            playtimeHours: currentNum,
            storyCompleted: gameIsLiveService ? false : gameStoryCompleted,
            completionist100: gameCompletionist100,
            allAchievementsCompleted: gameAllAchievementsCompleted,
            isLiveService: gameIsLiveService,
            achievements: item.gameTracker?.achievements,
          }
        : item.gameTracker,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#181B22] border border-[#282D37] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-[#282D37] flex items-center justify-between bg-[#0F1117]/60 shrink-0">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${typeBadge.bgClass} ${typeBadge.colorClass}`}
            >
              {typeBadge.label}
            </span>
            <h3 className="font-bold text-[#F1F3F7] text-sm sm:text-base">Eintrag anpassen</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-[#F1F3F7] flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-3.5 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Title & Creator */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Titel</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#0F1117] border border-[#282D37] focus:border-zinc-500 rounded-xl px-3 py-2 text-sm text-[#F1F3F7] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">
                {item.type === 'book'
                  ? 'Autor / Schriftsteller'
                  : item.type === 'movie' || item.type === 'show'
                  ? 'Regie / Schöpfer'
                  : item.type === 'game'
                  ? 'Entwicklerstudio'
                  : 'Studio / Schöpfer'}
              </label>
              <input
                type="text"
                value={creator}
                onChange={(e) => setCreator(e.target.value)}
                placeholder={item.type === 'book' ? 'z. B. Albert Camus' : 'z. B. Regisseur oder Studio'}
                className="w-full bg-[#0F1117] border border-[#282D37] focus:border-zinc-500 rounded-xl px-3 py-2 text-sm text-[#F1F3F7] placeholder-zinc-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Publisher / Verlag Field (Prominently editable for Books & Games) */}
          {(item.type === 'book' || item.type === 'game') && (
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-orange-400" />
                  <span>{item.type === 'book' ? 'Verlag / Herausgeber' : 'Publisher'}</span>
                </span>
                {item.type === 'book' && (
                  <span className="text-[10px] text-zinc-500 font-normal">
                    Manuell anpassbar (z. B. Suhrkamp, dtv, Heyne, Carlsen...)
                  </span>
                )}
              </label>
              <input
                type="text"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                placeholder={item.type === 'book' ? 'Verlag manuell eingeben oder korrigieren...' : 'Publisher angeben...'}
                className="w-full bg-[#0F1117] border border-[#282D37] focus:border-orange-500 rounded-xl px-3 py-2 text-sm text-[#F1F3F7] placeholder-zinc-600 focus:outline-none transition-colors"
              />
            </div>
          )}

          {/* Status & Rating */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Status</label>
              <select
                value={isGame && gameIsLiveService ? (status === 'planned' ? 'planned' : 'in_progress') : status}
                onChange={(e) => {
                  const newStatus = e.target.value as MediaStatus;
                  setStatus(newStatus);
                  if (newStatus === 'completed' && totalProgress) {
                    setCurrentProgress(totalProgress);
                  }
                }}
                className="w-full bg-[#0F1117] border border-[#282D37] focus:border-zinc-500 rounded-xl px-3 py-2 text-sm text-[#F1F3F7] focus:outline-none cursor-pointer"
              >
                {isGame && gameIsLiveService ? (
                  <>
                    <option value="in_progress">Live-Service (Aktiv)</option>
                    <option value="planned">Geplant</option>
                  </>
                ) : (
                  <>
                    <option value="in_progress">Gerade dabei</option>
                    <option value="planned">Geplant</option>
                    <option value="completed">Beendet</option>
                    <option value="paused">Pausiert</option>
                    <option value="dropped">Abgebrochen</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-zinc-400">
                  Eigene Bewertung (0.0 - 5.0)
                </label>
                {rating !== '' && (
                  <button
                    type="button"
                    onClick={() => setRating('')}
                    className="text-[11px] text-zinc-500 hover:text-rose-400 transition-colors"
                  >
                    Bewertung entfernen
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  placeholder="Keine Wertung vergeben"
                  value={rating}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setRating('');
                    } else {
                      const num = parseFloat(val);
                      setRating(isNaN(num) ? '' : Math.min(5, Math.max(0, num)));
                    }
                  }}
                  className="w-full bg-[#0F1117] border border-[#282D37] focus:border-zinc-500 rounded-xl pl-8 pr-3 py-2 text-sm text-[#F1F3F7] placeholder-zinc-600 focus:outline-none"
                />
                <Star
                  className={cn(
                    'w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none',
                    rating !== '' ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'
                  )}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-zinc-400">
                  Metacritic Score (0 – 100)
                </label>
                {metacritic !== '' && (
                  <button
                    type="button"
                    onClick={() => setMetacritic('')}
                    className="text-[11px] text-zinc-500 hover:text-rose-400 transition-colors"
                  >
                    Entfernen
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Automatisch oder z. B. 86"
                  value={metacritic}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setMetacritic('');
                    } else {
                      const num = parseInt(val, 10);
                      setMetacritic(isNaN(num) ? '' : Math.min(100, Math.max(0, num)));
                    }
                  }}
                  className="w-full bg-[#0F1117] border border-[#282D37] focus:border-zinc-500 rounded-xl pl-8 pr-3 py-2 text-sm text-[#F1F3F7] placeholder-zinc-600 focus:outline-none"
                />
                <span className="w-4 h-4 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[9px] font-black absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                  M
                </span>
              </div>
            </div>
          </div>

          {/* Im Besitz Toggle (kombinierbar mit jedem Status) */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0F1117] border border-[#282D37] hover:border-zinc-600 transition-colors">
            <label htmlFor="isOwned" className="text-xs font-bold text-zinc-300 cursor-pointer flex items-center gap-2.5 select-none flex-1">
              <PackageCheck className={cn("w-4 h-4", isOwned ? "text-emerald-400" : "text-zinc-500")} />
              <div>
                <span>Bereits gekauft / Im Besitz</span>
                <span className="block text-[11px] font-normal text-zinc-400 mt-0.5">
                  Kombinierbar mit jedem Status (z. B. Geplant + Im Besitz)
                </span>
              </div>
            </label>
            <input
              type="checkbox"
              id="isOwned"
              checked={isOwned}
              onChange={(e) => setIsOwned(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer accent-emerald-500 ml-3"
            />
          </div>

          {/* Progress / Game Tracker / Movie Runtime */}
          {item.type === 'game' ? (
            <div className="p-4 rounded-2xl bg-[#0F1117] border border-purple-500/20 space-y-4">
              <label className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>Videospiel Tracker (Offene Spielzeit &amp; Erfolge)</span>
              </label>

              {/* Spielzeit (Stunden) */}
              <div>
                <span className="text-[10px] text-zinc-400 block mb-1">Geloggte Spielzeit (in Stunden)</span>
                <input
                  type="number"
                  min="0"
                  value={currentProgress}
                  onChange={(e) => setCurrentProgress(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="z. B. 45"
                  className="w-full bg-[#181B22] border border-[#282D37] focus:border-purple-500 rounded-xl px-3 py-2 text-sm text-[#F1F3F7] focus:outline-none"
                />
              </div>

              {/* Live-Service Checkbox */}
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#181B22] border border-[#282D37] cursor-pointer hover:border-cyan-500/40 transition-colors">
                <input
                  type="checkbox"
                  checked={gameIsLiveService}
                  onChange={(e) => setGameIsLiveService(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-cyan-500 cursor-pointer accent-cyan-500"
                />
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300">
                  <Infinity className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Live-Service / Endlos-Spiel (Multiplayer / keine Kampagne)</span>
                </div>
              </label>

              {/* Checkboxes: Story, 100% & Alle Achievements */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {!gameIsLiveService && (
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#181B22] border border-[#282D37] cursor-pointer hover:border-purple-500/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={gameStoryCompleted}
                      onChange={(e) => setGameStoryCompleted(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-purple-500 focus:ring-purple-500 cursor-pointer accent-purple-500"
                    />
                    <span className="text-xs font-bold text-zinc-300">Story beendet</span>
                  </label>
                )}

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#181B22] border border-[#282D37] cursor-pointer hover:border-amber-500/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={gameCompletionist100}
                    onChange={(e) => setGameCompletionist100(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500 cursor-pointer accent-amber-500"
                  />
                  <span className="text-xs font-bold text-zinc-300">100% Meister</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#181B22] border border-[#282D37] cursor-pointer hover:border-amber-500/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={gameAllAchievementsCompleted}
                    onChange={(e) => setGameAllAchievementsCompleted(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500 cursor-pointer accent-amber-500"
                  />
                  <span className="text-xs font-bold text-zinc-300">Alle Erfolge</span>
                </label>
              </div>
            </div>
          ) : item.type === 'movie' ? (
            /* Movie Progress: Runtime in Minutes */
            <div className="p-4 rounded-2xl bg-[#0F1117] border border-rose-500/20 space-y-3">
              <label className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Spielfilm Laufzeit (in Minuten)</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-zinc-400 block mb-0.5">Laufzeit gesamt (Minuten)</span>
                  <input
                    type="number"
                    min="1"
                    value={totalProgress || ''}
                    onChange={(e) => setTotalProgress(parseInt(e.target.value) || 0)}
                    placeholder="z. B. 155"
                    className="w-full bg-[#181B22] border border-[#282D37] focus:border-rose-500 rounded-xl px-3 py-2 text-sm text-[#F1F3F7] focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block mb-0.5">Gesehen (Minuten)</span>
                  <input
                    type="number"
                    min="0"
                    max={totalProgress > 0 ? totalProgress : undefined}
                    value={currentProgress}
                    onChange={(e) => setCurrentProgress(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="z. B. 155"
                    className="w-full bg-[#181B22] border border-[#282D37] focus:border-rose-500 rounded-xl px-3 py-2 text-sm text-[#F1F3F7] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ) : item.type === 'show' ? (
            /* Series Progress: Seasons & Episodes */
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-[#0F1117] border border-amber-500/20 space-y-2">
                <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5" />
                  <span>Serien-Staffeln</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-zinc-400 block mb-0.5">Aktuelle Staffel</span>
                    <input
                      type="number"
                      min="1"
                      max={typeof totalSeasons === 'number' && totalSeasons > 0 ? totalSeasons : undefined}
                      value={currentSeason}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setCurrentSeason(Math.max(1, val));
                      }}
                      placeholder="z. B. 1"
                      className="w-full bg-[#181B22] border border-[#282D37] focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-[#F1F3F7] focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block mb-0.5">Staffeln gesamt</span>
                    <input
                      type="number"
                      min="1"
                      value={totalSeasons}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setTotalSeasons(Math.max(1, val));
                      }}
                      placeholder="z. B. 5"
                      className="w-full bg-[#181B22] border border-[#282D37] focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-[#F1F3F7] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Episoden-Fortschritt</label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-zinc-400 block mb-0.5">Gesehene Episoden</span>
                    <input
                      type="number"
                      min="0"
                      max={totalProgress > 0 ? totalProgress : undefined}
                      value={currentProgress}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        if (totalProgress > 0 && val > totalProgress) {
                          setCurrentProgress(totalProgress);
                        } else {
                          setCurrentProgress(Math.max(0, val));
                        }
                      }}
                      className="w-full bg-[#0F1117] border border-[#282D37] focus:border-zinc-500 rounded-xl px-3 py-2 text-sm text-[#F1F3F7] focus:outline-none"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-400 block mb-0.5">Episoden gesamt</span>
                    <input
                      type="number"
                      min="0"
                      value={totalProgress}
                      onChange={(e) => setTotalProgress(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#0F1117] border border-[#282D37] focus:border-zinc-500 rounded-xl px-3 py-2 text-sm text-[#F1F3F7] focus:outline-none"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-400 block mb-0.5">Einheit</span>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value as ProgressUnit)}
                      className="w-full bg-[#0F1117] border border-[#282D37] focus:border-zinc-500 rounded-xl px-2 py-2 text-xs text-[#F1F3F7] focus:outline-none cursor-pointer"
                    >
                      <option value="episodes">Episoden</option>
                      <option value="seasons">Staffeln</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Standard Show / Anime / Book Progress */
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Fortschritt</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-zinc-400 block mb-0.5">Aktuell</span>
                  <input
                    type="number"
                    min="0"
                    max={totalProgress > 0 ? totalProgress : undefined}
                    value={currentProgress}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      if (totalProgress > 0 && val > totalProgress) {
                        setCurrentProgress(totalProgress);
                      } else {
                        setCurrentProgress(Math.max(0, val));
                      }
                    }}
                    className="w-full bg-[#0F1117] border border-[#282D37] focus:border-zinc-500 rounded-xl px-3 py-2 text-sm text-[#F1F3F7] focus:outline-none"
                  />
                </div>

                <div>
                  <span className="text-[10px] text-zinc-400 block mb-0.5">Gesamt</span>
                  <input
                    type="number"
                    min="0"
                    value={totalProgress}
                    onChange={(e) => setTotalProgress(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#0F1117] border border-[#282D37] focus:border-zinc-500 rounded-xl px-3 py-2 text-sm text-[#F1F3F7] focus:outline-none"
                  />
                </div>

                <div>
                  <span className="text-[10px] text-zinc-400 block mb-0.5">Einheit</span>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as ProgressUnit)}
                    className="w-full bg-[#0F1117] border border-[#282D37] focus:border-zinc-500 rounded-xl px-2 py-2 text-xs text-[#F1F3F7] focus:outline-none cursor-pointer"
                  >
                    <option value="episodes">Episoden</option>
                    <option value="pages">Seiten</option>
                    <option value="minutes">Minuten</option>
                    <option value="hours">Stunden</option>
                    <option value="chapters">Kapitel</option>
                    <option value="seasons">Staffeln</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Cover & ISBN Edition Matcher */}
          {item.type === 'book' ? (
            <div className="p-3.5 rounded-2xl bg-[#0F1117] border border-orange-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Buch-Ausgabe, Verlag &amp; Cover abgleichen</span>
                </label>
                <span className="text-[10px] text-zinc-500 font-medium">DNB / Open Library</span>
              </div>

              {/* Publisher Input */}
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1 font-semibold flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-orange-400" />
                  <span>Verlag / Herausgeber</span>
                </label>
                <input
                  type="text"
                  value={publisher}
                  onChange={(e) => setPublisher(e.target.value)}
                  placeholder="z. B. Carlsen Verlag, Heyne, dtv, Klett-Cotta..."
                  className="w-full bg-[#181B22] border border-[#282D37] focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-[#F1F3F7] placeholder-zinc-500 focus:outline-none"
                />
              </div>

              {/* Button to search editions by publisher */}
              <div>
                <button
                  type="button"
                  onClick={handleOpenEditionPicker}
                  className="w-full py-2 px-3 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Ausgaben nach Verlag durchsuchen (DNB / Open Library)</span>
                  {isEditionPickerOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Edition Picker Drawer */}
              {isEditionPickerOpen && (
                <div className="space-y-2.5 p-3 rounded-xl bg-[#181B22] border border-[#282D37]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-zinc-300">Gefundene Ausgaben</span>
                    <input
                      type="text"
                      placeholder="Verlag filtern (z. B. Carlsen)..."
                      value={editionPickerFilter}
                      onChange={(e) => setEditionPickerFilter(e.target.value)}
                      className="bg-[#0F1117] border border-[#282D37] focus:border-orange-500 rounded-lg px-2 py-1 text-xs text-[#F1F3F7] placeholder-zinc-500 focus:outline-none w-44"
                    />
                  </div>

                  {isLoadingEditions ? (
                    <div className="py-6 flex flex-col items-center justify-center gap-2 text-zinc-400">
                      <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                      <span className="text-xs">Ausgaben werden geladen...</span>
                    </div>
                  ) : (
                    (() => {
                      const filtered = editionsList.filter((ed) => {
                        if (!editionPickerFilter.trim()) return true;
                        const q = editionPickerFilter.toLowerCase();
                        return (
                          ed.publisher.toLowerCase().includes(q) ||
                          ed.title.toLowerCase().includes(q) ||
                          (ed.subtitle && ed.subtitle.toLowerCase().includes(q)) ||
                          (ed.isbn && ed.isbn.includes(q))
                        );
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className="py-3 text-center text-xs text-zinc-400">
                            {editionsList.length === 0
                              ? 'Keine Ausgaben gefunden.'
                              : `Keine Ausgabe für "${editionPickerFilter}" gefunden.`}
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {filtered.map((ed) => (
                            <div
                              key={ed.id}
                              className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#0F1117] border border-[#282D37] hover:border-zinc-700 transition-all text-xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="w-8 h-11 rounded overflow-hidden bg-zinc-900 border border-zinc-800 flex-shrink-0">
                                  <img
                                    src={ed.coverUrl}
                                    alt={ed.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = createBookSvgCover(ed.title, creator, ed.publisher);
                                    }}
                                    onLoad={(e) => {
                                      const img = e.currentTarget;
                                      if (img.naturalWidth <= 1 || img.naturalHeight <= 1) {
                                        img.src = createBookSvgCover(ed.title, creator, ed.publisher);
                                      }
                                    }}
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-orange-300">{ed.publisher}</span>
                                    {ed.isGerman && (
                                      <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                        DE
                                      </span>
                                    )}
                                    <span className="text-[10px] text-zinc-400">{ed.pages} S.</span>
                                    {ed.year && <span className="text-[10px] text-zinc-400">{ed.year}</span>}
                                  </div>
                                  <p className="text-zinc-300 truncate text-[11px]">{ed.title}</p>
                                  {ed.formattedIsbn && (
                                    <p className="text-[10px] font-mono text-zinc-500">ISBN: {ed.formattedIsbn}</p>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleApplyEdition(ed)}
                                className="px-2.5 py-1 rounded bg-orange-500 hover:bg-orange-400 text-zinc-950 text-[11px] font-bold flex-shrink-0 active:scale-95 transition-all"
                              >
                                Übernehmen
                              </button>
                            </div>
                          ))}
                        </div>
                      );
                    })()
                  )}
                </div>
              )}

              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Oder gib die ISBN deines physischen Buches direkt ein (Barcode auf der Rückseite):
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={isbnInput}
                  onChange={(e) => setIsbnInput(e.target.value)}
                  placeholder="z. B. 978-3-442-17858-2"
                  className="flex-1 bg-[#181B22] border border-[#282D37] focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-[#F1F3F7] placeholder-zinc-500 focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={handleFetchIsbn}
                  disabled={isFetchingIsbn || !isbnInput.trim()}
                  className="px-3 py-2 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-40"
                >
                  {isFetchingIsbn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-orange-400" />}
                  <span>Abrufen</span>
                </button>
              </div>

              {isbnFeedback && (
                <div
                  className={`text-[11px] p-2 rounded-lg font-medium leading-relaxed ${
                    isbnFeedback.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                  }`}
                >
                  {isbnFeedback.text}
                </div>
              )}

              {/* Cover Preview & URL */}
              <div className="flex items-center gap-3 pt-1">
                <div className="w-10 h-14 rounded bg-zinc-900 border border-[#282D37] overflow-hidden flex-shrink-0">
                  <img
                    src={(coverUrl || item.coverUrl) && !(coverUrl || item.coverUrl).includes('images.unsplash.com') ? (coverUrl || item.coverUrl) : getMediaCoverFallback({ title, creator, publisher, type: item.type })}
                    alt={title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getMediaCoverFallback({ title, creator, publisher, type: item.type });
                    }}
                    onLoad={(e) => {
                      const img = e.currentTarget;
                      if (img.naturalWidth <= 1 || img.naturalHeight <= 1) {
                        img.src = getMediaCoverFallback({ title, creator, publisher, type: item.type });
                      }
                    }}
                  />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] text-zinc-500 block mb-0.5">Cover-Bild URL:</span>
                  <input
                    type="text"
                    value={coverUrl && !coverUrl.includes('images.unsplash.com') ? coverUrl : ''}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-[#181B22] border border-[#282D37] focus:border-zinc-500 rounded-lg px-2.5 py-1 text-[11px] text-zinc-300 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-[#0F1117] border border-[#282D37] flex items-center gap-3">
              <div className="w-10 h-14 rounded bg-zinc-900 border border-[#282D37] overflow-hidden flex-shrink-0">
                <img
                  src={(coverUrl || item.coverUrl) && !(coverUrl || item.coverUrl).includes('images.unsplash.com') ? (coverUrl || item.coverUrl) : getMediaCoverFallback({ title, creator, publisher, type: item?.type })}
                  alt={title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getMediaCoverFallback({ title, creator, publisher, type: item?.type });
                  }}
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    if (img.naturalWidth <= 1 || img.naturalHeight <= 1) {
                      img.src = getMediaCoverFallback({ title, creator, publisher, type: item?.type });
                    }
                  }}
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-zinc-400 block mb-0.5 flex items-center gap-1">
                  <ImageIcon className="w-3 h-3 text-zinc-500" />
                  <span>Cover-Bild URL</span>
                </label>
                <input
                  type="text"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#181B22] border border-[#282D37] focus:border-zinc-500 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Summary */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-1">
              Handlung / Zusammenfassung
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Offizielle Inhaltsangabe..."
              className="w-full bg-[#0F1117] border border-[#282D37] focus:border-zinc-500 rounded-xl p-3 text-xs text-[#F1F3F7] focus:outline-none resize-none"
            />
          </div>

          {/* Personal Notes */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-1">
              Persönliche Notizen
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Eigene Gedanken, Zitate oder Notizen..."
              className="w-full bg-[#0F1117] border border-[#282D37] focus:border-zinc-500 rounded-xl p-3 text-xs text-[#F1F3F7] focus:outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#282D37] flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onDelete(item.id);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Entfernen</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold bg-zinc-100 hover:bg-white text-zinc-950 shadow-md shadow-black/20 active:scale-95 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Speichern</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
