'use client';

import React, { useState, useEffect } from 'react';
import { X, Star, Trash2, Save, PackageCheck, BookOpen, Sparkles, Loader2, Image as ImageIcon, Gamepad2, Trophy, Clock } from 'lucide-react';
import { MediaItem, MediaStatus, ProgressUnit } from '@/types/media';
import { getMediaTypeBadge, cn } from '@/lib/utils';
import { formatIsbn } from '@/lib/api-adapters/googlebooks';

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
  const [status, setStatus] = useState<MediaStatus>('in_progress');
  const [isOwned, setIsOwned] = useState<boolean>(false);
  const [rating, setRating] = useState<number>(4.5);
  const [currentProgress, setCurrentProgress] = useState<number>(0);
  const [totalProgress, setTotalProgress] = useState<number>(0);
  const [unit, setUnit] = useState<ProgressUnit>('episodes');
  const [summary, setSummary] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isbnInput, setIsbnInput] = useState('');
  const [isFetchingIsbn, setIsFetchingIsbn] = useState(false);
  const [isbnFeedback, setIsbnFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Dedicated Game Tracker State
  const [gameStoryCompleted, setGameStoryCompleted] = useState<boolean>(false);
  const [gameCompletionist100, setGameCompletionist100] = useState<boolean>(false);
  const [gameAchievementsCurrent, setGameAchievementsCurrent] = useState<number>(0);
  const [gameAchievementsTotal, setGameAchievementsTotal] = useState<number>(0);

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setStatus(item.status);
      setIsOwned(Boolean(item.isOwned || item.status === 'owned'));
      setRating(item.rating || 4.5);
      setCurrentProgress(item.progress.current);
      setTotalProgress(item.progress.total || 0);
      setUnit(item.progress.unit);
      setSummary(item.summary || '');
      setCoverUrl(item.coverUrl || '');
      setIsbnFeedback(null);

      if (item.type === 'game') {
        setGameStoryCompleted(Boolean(item.gameTracker?.storyCompleted));
        setGameCompletionist100(Boolean(item.gameTracker?.completionist100));
        setGameAchievementsCurrent(item.gameTracker?.achievements?.current || 0);
        setGameAchievementsTotal(item.gameTracker?.achievements?.total || 0);
      }

      if (item.type === 'book') {
        const existingIsbn = item.external_id?.startsWith('isbn:')
          ? item.external_id.replace('isbn:', '')
          : '';
        setIsbnInput(existingIsbn ? formatIsbn(existingIsbn) : '');
      } else {
        setIsbnInput('');
      }
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const typeBadge = getMediaTypeBadge(item.type);

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
    const isGame = item.type === 'game';
    const isMovie = item.type === 'movie';
    const cleanIsbn = isbnInput.replace(/[-\s]/g, '').trim().toUpperCase();
    const updatedExternalId = item.type === 'book' && cleanIsbn ? `isbn:${cleanIsbn}` : item.external_id;

    const totalNum = isGame ? undefined : (Number(totalProgress) || undefined);
    let currentNum = totalNum && totalNum > 0 ? Math.min(Number(currentProgress), totalNum) : Number(currentProgress);
    const resolvedStatus = totalNum && currentNum >= totalNum && status !== 'owned' ? 'completed' : status;

    if (resolvedStatus === 'completed' && totalNum && totalNum > 0) {
      currentNum = totalNum;
    }

    onSave(item.id, {
      title,
      status: resolvedStatus,
      isOwned,
      rating,
      summary,
      coverUrl: coverUrl || item.coverUrl,
      external_id: updatedExternalId,
      progress: {
        ...item.progress,
        current: currentNum,
        total: totalNum,
        unit: isMovie ? 'minutes' : unit,
      },
      gameTracker: isGame
        ? {
            playtimeHours: currentNum,
            storyCompleted: gameStoryCompleted,
            completionist100: gameCompletionist100,
            achievements:
              gameAchievementsTotal > 0
                ? { current: gameAchievementsCurrent, total: gameAchievementsTotal }
                : item.gameTracker?.achievements,
          }
        : item.gameTracker,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#181B22] border border-[#282D37] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#282D37] flex items-center justify-between bg-[#0F1117]/60">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${typeBadge.bgClass} ${typeBadge.colorClass}`}
            >
              {typeBadge.label}
            </span>
            <h3 className="font-bold text-[#F1F3F7] text-base">Eintrag anpassen</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-[#F1F3F7] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
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

          {/* Status & Rating */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => {
                  const newStatus = e.target.value as MediaStatus;
                  setStatus(newStatus);
                  if (newStatus === 'completed' && totalProgress) {
                    setCurrentProgress(totalProgress);
                  }
                }}
                className="w-full bg-[#0F1117] border border-[#282D37] focus:border-zinc-500 rounded-xl px-3 py-2 text-sm text-[#F1F3F7] focus:outline-none cursor-pointer"
              >
                <option value="in_progress">Gerade dabei</option>
                <option value="planned">Geplant</option>
                <option value="completed">Beendet</option>
                <option value="paused">Pausiert</option>
                <option value="dropped">Abgebrochen</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">
                Bewertung (0.0 - 5.0)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={rating}
                  onChange={(e) => setRating(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0F1117] border border-[#282D37] focus:border-zinc-500 rounded-xl pl-8 pr-3 py-2 text-sm text-[#F1F3F7] focus:outline-none"
                />
                <Star className="w-4 h-4 text-amber-400 fill-amber-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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

              {/* Checkboxes: Story & 100% */}
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#181B22] border border-[#282D37] cursor-pointer hover:border-purple-500/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={gameStoryCompleted}
                    onChange={(e) => setGameStoryCompleted(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-purple-500 focus:ring-purple-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-zinc-300">Story beendet ✓</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#181B22] border border-[#282D37] cursor-pointer hover:border-amber-500/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={gameCompletionist100}
                    onChange={(e) => setGameCompletionist100(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-zinc-300">100% Meisterung</span>
                </label>
              </div>

              {/* Achievements Tracker */}
              <div>
                <span className="text-[10px] text-zinc-400 block mb-1">Erfolge &amp; Trophäen (optional)</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-zinc-500 block mb-0.5">Erreichte Erfolge</span>
                    <input
                      type="number"
                      min="0"
                      value={gameAchievementsCurrent}
                      onChange={(e) => setGameAchievementsCurrent(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="z. B. 34"
                      className="w-full bg-[#181B22] border border-[#282D37] focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-[#F1F3F7] focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block mb-0.5">Gesamte Erfolge</span>
                    <input
                      type="number"
                      min="0"
                      value={gameAchievementsTotal}
                      onChange={(e) => setGameAchievementsTotal(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="z. B. 45"
                      className="w-full bg-[#181B22] border border-[#282D37] focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-[#F1F3F7] focus:outline-none"
                    />
                  </div>
                </div>
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
            <div className="p-3.5 rounded-2xl bg-[#0F1117] border border-orange-500/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Exakte Buch-Edition &amp; Cover per ISBN abgleichen</span>
                </label>
                <span className="text-[10px] text-zinc-500 font-medium">Open Library / Goodreads</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Gib die ISBN deines physischen Buches ein (Barcode auf der Rückseite), um exakt dein Cover und die Seitenzahl zu laden.
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
                    src={coverUrl || item.coverUrl}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] text-zinc-500 block mb-0.5">Cover-Bild URL:</span>
                  <input
                    type="text"
                    value={coverUrl}
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
                  src={coverUrl || item.coverUrl}
                  alt={title}
                  className="w-full h-full object-cover"
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

          {/* Summary / Notes */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-1">
              Notiz / Zusammenfassung
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
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
