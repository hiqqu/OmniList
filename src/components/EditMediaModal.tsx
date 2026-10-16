'use client';

import React, { useState, useEffect } from 'react';
import { X, Star, Trash2, Save } from 'lucide-react';
import { MediaItem, MediaStatus, ProgressUnit } from '@/types/media';
import { getMediaTypeBadge } from '@/lib/utils';

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
  const [rating, setRating] = useState<number>(4.5);
  const [currentProgress, setCurrentProgress] = useState<number>(0);
  const [totalProgress, setTotalProgress] = useState<number>(0);
  const [unit, setUnit] = useState<ProgressUnit>('episodes');
  const [summary, setSummary] = useState('');

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setStatus(item.status);
      setRating(item.rating || 4.5);
      setCurrentProgress(item.progress.current);
      setTotalProgress(item.progress.total || 0);
      setUnit(item.progress.unit);
      setSummary(item.summary || '');
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const typeBadge = getMediaTypeBadge(item.type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(item.id, {
      title,
      status,
      rating,
      summary,
      progress: {
        ...item.progress,
        current: Number(currentProgress),
        total: Number(totalProgress) || undefined,
        unit,
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-surface border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${typeBadge.bgClass} ${typeBadge.colorClass}`}
            >
              {typeBadge.label}
            </span>
            <h3 className="font-bold text-white text-base">Eintrag anpassen</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Titel</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-primary rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
              required
            />
          </div>

          {/* Status & Rating */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MediaStatus)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-primary rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
              >
                <option value="in_progress">Gerade dabei</option>
                <option value="planned">Geplant</option>
                <option value="completed">Beendet</option>
                <option value="paused">Pausiert</option>
                <option value="dropped">Abgebrochen</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
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
                  className="w-full bg-slate-950 border border-slate-700 focus:border-primary rounded-xl pl-8 pr-3 py-2 text-sm text-white focus:outline-none"
                />
                <Star className="w-4 h-4 text-amber-400 fill-amber-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Progress */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Fortschritt</label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">Aktuell</span>
                <input
                  type="number"
                  min="0"
                  value={currentProgress}
                  onChange={(e) => setCurrentProgress(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-primary rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">Gesamt</span>
                <input
                  type="number"
                  min="0"
                  value={totalProgress}
                  onChange={(e) => setTotalProgress(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-primary rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">Einheit</span>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as ProgressUnit)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-primary rounded-xl px-2 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="episodes">Episoden</option>
                  <option value="pages">Seiten</option>
                  <option value="hours">Stunden</option>
                  <option value="chapters">Kapitel</option>
                  <option value="seasons">Staffeln</option>
                </select>
              </div>
            </div>
          </div>

          {/* Summary / Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Notiz / Zusammenfassung
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-primary rounded-xl p-3 text-xs text-white focus:outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onDelete(item.id);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Aus Sammlung entfernen</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary-hover text-white shadow-md shadow-primary/20 active:scale-95 transition-all"
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
