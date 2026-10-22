'use client';

import React, { useState } from 'react';
import {
  X,
  Download,
  Gamepad2,
  Check,
  RefreshCw,
  Info,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  ArrowRight,
  ShieldCheck,
  Trophy,
  Clock,
  Trash2,
} from 'lucide-react';
import { MediaItem, ConnectedGameService } from '@/types/media';
import {
  RawImportedGame,
  ImportResult,
  importGamesWithDeduplication,
  areGamesMatching,
  isGameConnected,
  PRESET_STEAM_LIBRARY,
  PRESET_PSN_LIBRARY,
  PRESET_GOG_LIBRARY,
  parseExportedGameFile,
} from '@/lib/game-import';
import { cn } from '@/lib/utils';

interface GameImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: MediaItem[];
  onApplyImport: (updatedMedia: MediaItem[], importResult: ImportResult) => void;
  addToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => void;
}

export const GameImportModal: React.FC<GameImportModalProps> = ({
  isOpen,
  onClose,
  media,
  onApplyImport,
  addToast,
}) => {
  const [activePlatform, setActivePlatform] = useState<ConnectedGameService>('steam');
  const [accountInput, setAccountInput] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [previewResult, setPreviewResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  if (!isOpen) return null;

  const handleSelectPreset = () => {
    setIsProcessing(true);
    let games: RawImportedGame[] = [];
    let username = '';

    if (activePlatform === 'steam') {
      games = PRESET_STEAM_LIBRARY;
      username = accountInput.trim() || 'SteamGamer';
    } else if (activePlatform === 'psn') {
      games = PRESET_PSN_LIBRARY;
      username = accountInput.trim() || 'PlayStationUser';
    } else {
      games = PRESET_GOG_LIBRARY;
      username = accountInput.trim() || 'GOGCollector';
    }

    const preview = importGamesWithDeduplication(media, games, username);
    setPreviewResult(preview);
    setIsProcessing(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFileContent(text);

      const parsedGames = parseExportedGameFile(text, activePlatform);
      if (parsedGames.length > 0) {
        const preview = importGamesWithDeduplication(
          media,
          parsedGames,
          accountInput.trim() || file.name.replace(/\.[^/.]+$/, '')
        );
        setPreviewResult(preview);
      } else {
        addToast(
          'error',
          'Ungültiges Format',
          'In der Datei konnten keine Spieleeinträge gefunden werden.'
        );
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!previewResult) return;

    onApplyImport(previewResult.updatedMedia, previewResult);

    const platformLabel =
      activePlatform === 'steam'
        ? 'Steam'
        : activePlatform === 'psn'
        ? 'PlayStation'
        : 'GOG Galaxy';

    let msg = `${previewResult.addedCount} neue Spiele importiert.`;
    if (previewResult.replacedDuplicatesCount > 0) {
      msg += ` ${previewResult.replacedDuplicatesCount} unverbundene Duplikate wurden an gleicher Stelle ersetzt.`;
    }

    addToast('success', `${platformLabel}-Bibliothek erfolgreich importiert`, msg);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#181B22] border border-[#282D37] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="p-3.5 sm:p-5 border-b border-[#282D37] flex items-center justify-between bg-[#0F1117]/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#F1F3F7] text-base sm:text-lg">
                Spiele-Bibliothek importieren
              </h3>
              <p className="text-xs text-zinc-400">
                Steam, PlayStation Network &amp; GOG Galaxy mit automatischer Duplikat-Ersetzung
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Platform Switcher Tabs */}
        <div className="flex border-b border-[#282D37] bg-[#0F1117]/40 px-3 sm:px-5 pt-3 gap-2 shrink-0 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => {
              setActivePlatform('steam');
              setPreviewResult(null);
            }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 shrink-0',
              activePlatform === 'steam'
                ? 'border-sky-400 text-sky-300 bg-[#181B22]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            )}
          >
            <span>Steam</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActivePlatform('psn');
              setPreviewResult(null);
            }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 shrink-0',
              activePlatform === 'psn'
                ? 'border-blue-500 text-blue-300 bg-[#181B22]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            )}
          >
            <span>PlayStation Network (PSN)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActivePlatform('gog');
              setPreviewResult(null);
            }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 shrink-0',
              activePlatform === 'gog'
                ? 'border-purple-500 text-purple-300 bg-[#181B22]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            )}
          >
            <span>GOG Galaxy</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-3.5 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Deduplication Guarantee Banner */}
          <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-start gap-3 text-xs leading-relaxed text-purple-200">
            <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-purple-100 block mb-0.5">
                Automatische Duplikat-Ersetzung aktiv
              </span>
              <span>
                Falls ein importiertes Spiel bereits manuell in deiner Sammlung existiert (unverbunden),
                wird der unverbundene Eintrag an gleicher Stelle automatisch durch den verknüpften Eintrag
                inklusive Spielzeit und Erfolgen ersetzt. Deine persönlichen Notizen und Sterne-Bewertungen
                bleiben erhalten.
              </span>
            </div>
          </div>

          {/* Import Methods Grid */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-zinc-300 block">
              Wähle eine Import-Methode:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: One-Click Demo Preset */}
              <div className="p-4 rounded-2xl bg-[#0F1117] border border-[#282D37] hover:border-zinc-600 transition-all flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Schnell-Import (Demo-Bibliothek)</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                    Lädt ein Set beliebter Spiele für {activePlatform.toUpperCase()} mit realen Spielzeiten
                    und Erfolgen, um die Duplikat-Ersetzung sofort zu testen.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSelectPreset}
                  disabled={isProcessing}
                  className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-xs border border-zinc-700 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <RefreshCw className={cn('w-3.5 h-3.5', isProcessing && 'animate-spin')} />
                  <span>Vorschau laden</span>
                </button>
              </div>

              {/* Option 2: JSON or CSV File Upload */}
              <div className="p-4 rounded-2xl bg-[#0F1117] border border-[#282D37] hover:border-zinc-600 transition-all flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
                    <Upload className="w-4 h-4 text-sky-400" />
                    <span>Datei-Import (.json / .csv)</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                    Lade eine exportierte Spieleliste oder eine Steam/GOG-JSON-Datei hoch.
                  </p>
                </div>
                <label className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-xs border border-zinc-700 transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer text-center">
                  <FileText className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Datei auswählen</span>
                  <input
                    key={fileInputKey}
                    type="file"
                    accept=".json,.csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Account Username Input */}
          <div className="p-3.5 rounded-2xl bg-[#0F1117] border border-[#282D37] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="text-xs">
              <span className="font-bold text-zinc-300 block">Account-Name / Profil (Optional)</span>
              <span className="text-[11px] text-zinc-500">Wird als Verknüpfungs-Info am Spieleintrag hinterlegt</span>
            </div>
            <input
              type="text"
              value={accountInput}
              onChange={(e) => setAccountInput(e.target.value)}
              placeholder={activePlatform === 'steam' ? 'Steam ID / Name' : activePlatform === 'psn' ? 'PSN Online ID' : 'GOG Username'}
              className="bg-[#181B22] border border-[#282D37] focus:border-zinc-500 rounded-xl px-3 py-1.5 text-xs text-[#F1F3F7] focus:outline-none w-full sm:w-48"
            />
          </div>

          {/* Preview Results Section */}
          {previewResult && (
            <div className="space-y-3 pt-2 border-t border-[#282D37] animate-fadeIn">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Import-Vorschau</span>
                </h4>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    +{previewResult.addedCount} Neu
                  </span>
                  {previewResult.replacedDuplicatesCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40">
                      {previewResult.replacedDuplicatesCount} Duplikate ersetzt
                    </span>
                  )}
                </div>
              </div>

              {/* Explicit Duplicate Replacement Cards */}
              {previewResult.replacedGames.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block">
                    Ersetzte unverbundene Einträge:
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {previewResult.replacedGames.map((rg, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-[#0F1117] border border-purple-500/30 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-zinc-400 line-through truncate max-w-[140px] sm:max-w-[180px]">
                            {rg.replacedTitle}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span className="font-bold text-emerald-300 truncate max-w-[150px] sm:max-w-[200px]">
                            {rg.newTitle}
                          </span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold shrink-0 ml-2">
                          {rg.serviceName} ({rg.playtimeHours} Std.)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Newly Added Titles Preview */}
              {previewResult.newlyAddedTitles.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Neu hinzukommende Spiele ({previewResult.newlyAddedTitles.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {previewResult.newlyAddedTitles.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2.5 py-1 rounded-full bg-[#0F1117] border border-[#282D37] text-zinc-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-5 border-t border-[#282D37] bg-[#0F1117]/60 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            Abbrechen
          </button>

          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={!previewResult}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-950/40 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>
              {previewResult
                ? `Bibliothek übernehmen (${previewResult.addedCount + previewResult.replacedDuplicatesCount} Einträge)`
                : 'Zuerst Vorschau wählen'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
