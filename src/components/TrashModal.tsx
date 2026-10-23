'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Trash2,
  RotateCcw,
  Search,
  AlertTriangle,
  CheckCircle2,
  Film,
  Tv,
  Gamepad2,
  BookOpen,
  Sparkles,
  Clock,
  Layers,
  Inbox,
} from 'lucide-react';
import { MediaItem, MediaType } from '@/types/media';
import {
  TrashItem,
  getStoredTrash,
  restoreTrashItem,
  permanentlyDeleteTrashItem,
  clearTrash,
  restoreAllTrash,
} from '@/lib/storage';
import { getMediaTypeBadge, getMediaStatusBadge, cn } from '@/lib/utils';
import { getMediaCoverFallback } from '@/lib/book-cover';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemRestored: (restoredItem: MediaItem) => void;
  onAllRestored?: (restoredItems: MediaItem[]) => void;
  addToast?: (type: 'success' | 'info' | 'warning' | 'error', title: string, description?: string) => void;
}

export const TrashModal: React.FC<TrashModalProps> = ({
  isOpen,
  onClose,
  onItemRestored,
  onAllRestored,
  addToast,
}) => {
  const [trashList, setTrashList] = useState<TrashItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<MediaType | 'all'>('all');
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTrashList(getStoredTrash());
      setConfirmClear(false);
      setSearchQuery('');
      setTypeFilter('all');
    }
  }, [isOpen]);

  const filteredTrash = useMemo(() => {
    return trashList.filter((entry) => {
      if (typeFilter !== 'all' && entry.item.type !== typeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = entry.item.title.toLowerCase().includes(q);
        const genreMatch = entry.item.genres?.some((g) => g.toLowerCase().includes(q));
        if (!titleMatch && !genreMatch) return false;
      }
      return true;
    });
  }, [trashList, typeFilter, searchQuery]);

  if (!isOpen) return null;

  const handleRestoreSingle = (id: string) => {
    const restored = restoreTrashItem(id);
    if (restored) {
      setTrashList((prev) => prev.filter((t) => t.id !== id));
      onItemRestored(restored);
      if (addToast) {
        addToast('success', 'Wiederhergestellt', `"${restored.title}" wurde wieder zur Sammlung hinzugefügt.`);
      }
    }
  };

  const handlePermanentDeleteSingle = (id: string, title: string) => {
    permanentlyDeleteTrashItem(id);
    setTrashList((prev) => prev.filter((t) => t.id !== id));
    if (addToast) {
      addToast('info', 'Endgültig gelöscht', `"${title}" wurde dauerhaft entfernt.`);
    }
  };

  const handleRestoreAllItems = () => {
    const restored = restoreAllTrash();
    setTrashList([]);
    if (onAllRestored) {
      onAllRestored(restored);
    } else {
      for (const item of restored) {
        onItemRestored(item);
      }
    }
    if (addToast) {
      addToast('success', 'Alle wiederhergestellt', `${restored.length} Medien wurden zur Sammlung zurückgeholt.`);
    }
  };

  const handleEmptyTrash = () => {
    clearTrash();
    setTrashList([]);
    setConfirmClear(false);
    if (addToast) {
      addToast('info', 'Papierkorb geleert', 'Alle gelöschten Einträge wurden dauerhaft gelöscht.');
    }
  };

  const formatDeletionDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Kürzlich';
    }
  };

  const getTypeIcon = (type: MediaType) => {
    switch (type) {
      case 'movie':
        return <Film className="w-3.5 h-3.5" />;
      case 'show':
        return <Tv className="w-3.5 h-3.5" />;
      case 'anime':
        return <Sparkles className="w-3.5 h-3.5" />;
      case 'book':
        return <BookOpen className="w-3.5 h-3.5" />;
      case 'game':
        return <Gamepad2 className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#181B22] border border-[#282D37] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#282D37] shrink-0 bg-[#181B22]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shadow-inner">
              <Trash2 className="w-5 h-5 text-zinc-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#F1F3F7]">Papierkorb</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {trashList.length}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Einzelne gelöschte Einträge wiederherstellen oder dauerhaft entfernen
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Search & Type Filter */}
        {trashList.length > 0 && (
          <div className="p-4 border-b border-[#282D37] bg-[#14161D] space-y-3 shrink-0">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Im Papierkorb nach Titel oder Genre suchen..."
                className="w-full bg-[#181B22] border border-[#282D37] focus:border-zinc-500 rounded-full pl-9 pr-8 py-2 text-xs text-[#F1F3F7] placeholder-zinc-500 focus:outline-none transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Chips & Bulk Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                {(['all', 'game', 'movie', 'show', 'anime', 'book'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all shrink-0',
                      typeFilter === t
                        ? 'bg-zinc-100 text-zinc-950 border-white'
                        : 'bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:text-zinc-200 hover:bg-zinc-700/60'
                    )}
                  >
                    {t === 'all'
                      ? 'Alle'
                      : t === 'game'
                      ? 'Spiele'
                      : t === 'movie'
                      ? 'Filme'
                      : t === 'show'
                      ? 'Serien'
                      : t === 'anime'
                      ? 'Anime'
                      : 'Bücher'}
                  </button>
                ))}
              </div>

              {/* Bulk Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRestoreAllItems}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-all active:scale-95"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Alle wiederherstellen</span>
                </button>

                {!confirmClear ? (
                  <button
                    onClick={() => setConfirmClear(true)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/25 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Leeren</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 animate-fadeIn">
                    <button
                      onClick={handleEmptyTrash}
                      className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-md"
                    >
                      Wirklich leeren
                    </button>
                    <button
                      onClick={() => setConfirmClear(false)}
                      className="px-2 py-1 rounded-full text-xs text-zinc-400 hover:text-white transition-colors"
                    >
                      Abbrechen
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px]">
          {trashList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-400 space-y-3">
              <div className="w-14 h-14 rounded-full bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-500">
                <Inbox className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#F1F3F7]">Der Papierkorb ist leer</h4>
                <p className="text-xs text-zinc-500 max-w-sm">
                  Gelöschte Filme, Serien, Spiele, Anime oder Bücher werden hier sicher aufbewahrt und können jederzeit wiederhergestellt werden.
                </p>
              </div>
            </div>
          ) : filteredTrash.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-zinc-400 space-y-2">
              <Search className="w-6 h-6 text-zinc-500" />
              <p className="text-xs text-zinc-400">Keine gelöschten Einträge für diese Filterung gefunden.</p>
            </div>
          ) : (
            filteredTrash.map((entry) => {
              const item = entry.item;
              const typeBadge = getMediaTypeBadge(item.type);
              const statusBadge = getMediaStatusBadge(item.status);

              return (
                <div
                  key={entry.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#14161D] border border-[#282D37] hover:border-zinc-700 transition-all shadow-sm"
                >
                  {/* Left: Cover & Info */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Thumbnail */}
                    <div className="relative w-12 h-16 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-700/60 shrink-0">
                      {item.coverUrl ? (
                        <img
                          src={item.coverUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getMediaCoverFallback(item);
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                          {getTypeIcon(item.type)}
                        </div>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1',
                            typeBadge.colorClass,
                            typeBadge.bgClass,
                            typeBadge.borderClass
                          )}
                        >
                          {getTypeIcon(item.type)}
                          {typeBadge.label}
                        </span>

                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-bold border border-zinc-700/60',
                            statusBadge.colorClass,
                            statusBadge.bgClass
                          )}
                        >
                          {statusBadge.label}
                        </span>

                        {item.progress && typeof item.progress.total === 'number' && item.progress.total > 0 && (
                          <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-zinc-500" />
                            {item.progress.current} / {item.progress.total}{' '}
                            {item.progress.unit === 'episodes'
                              ? 'Folgen'
                              : item.progress.unit === 'hours'
                              ? 'Std.'
                              : item.progress.unit === 'pages'
                              ? 'Seiten'
                              : item.progress.unit}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-[#F1F3F7] truncate" title={item.title}>
                        {item.title}
                      </h4>

                      <p className="text-[11px] text-zinc-500 flex items-center gap-1">
                        Gelöscht am {formatDeletionDate(entry.deletedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#282D37]">
                    <button
                      onClick={() => handleRestoreSingle(entry.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all active:scale-95 shadow-sm"
                      title="Wieder zur Mediensammlung hinzufügen"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Wiederherstellen</span>
                    </button>

                    <button
                      onClick={() => handlePermanentDeleteSingle(entry.id, item.title)}
                      className="p-1.5 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Endgültig löschen"
                      aria-label="Endgültig löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info note */}
        <div className="px-5 py-3 border-t border-[#282D37] bg-[#14161D] flex items-center justify-between text-xs text-zinc-500 shrink-0">
          <span>Einträge bleiben im Papierkorb erhalten, bis du sie leerst oder endgültig löschst.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-colors"
          >
            Fertig
          </button>
        </div>
      </div>
    </div>
  );
};
