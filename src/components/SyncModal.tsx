'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Cloud,
  Download,
  Upload,
  RefreshCw,
  Copy,
  Check,
  HardDrive,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  Key,
} from 'lucide-react';
import { MediaItem, SequelNotification } from '@/types/media';
import { cn } from '@/lib/utils';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: MediaItem[];
  sequels: SequelNotification[];
  onApplySync: (media: MediaItem[], sequels?: SequelNotification[]) => void;
  addToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

const STORAGE_SYNC_CODE_KEY = 'omnilist_last_sync_code_v1';
const LEGACY_STORAGE_SYNC_CODE_KEY = 'omnitrack_last_sync_code_v1';

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  media,
  sequels,
  onApplySync,
  addToast,
}) => {
  const [activeTab, setActiveTab] = useState<'cloud' | 'file'>('cloud');
  const [syncCode, setSyncCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ isCloudConfigured: boolean; provider: string } | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved sync code and check sync status
  useEffect(() => {
    if (isOpen) {
      const savedCode =
        localStorage.getItem(STORAGE_SYNC_CODE_KEY) ||
        localStorage.getItem(LEGACY_STORAGE_SYNC_CODE_KEY);
      if (savedCode) {
        setSyncCode(savedCode);
      } else if (!syncCode) {
        generateRandomCode();
      }

      setFeedback(null);

      // Check server sync configuration
      fetch('/api/sync')
        .then((res) => res.json())
        .then((data) => {
          setSyncStatus({
            isCloudConfigured: Boolean(data.isCloudConfigured),
            provider: data.provider || (data.isCloudConfigured ? 'Cloud' : 'Lokaler Server'),
          });
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const generateRandomCode = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = 'OMNI-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSyncCode(code);
    localStorage.setItem(STORAGE_SYNC_CODE_KEY, code);
  };

  const handleCopyCode = () => {
    if (!syncCode) return;
    navigator.clipboard.writeText(syncCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Push local data to Cloud
  const handlePushToCloud = async () => {
    const cleanCode = syncCode.trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 4) {
      setFeedback({ type: 'error', message: 'Bitte gib einen mindestens 4-stelligen Sync-Code ein.' });
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    try {
      localStorage.setItem(STORAGE_SYNC_CODE_KEY, cleanCode);
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'push',
          code: cleanCode,
          data: { media, sequels },
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          message:
            data.message ||
            `Erfolgreich gesichert! Gib auf deinem Zweitgerät einfach den Code "${cleanCode}" ein, um deine ${media.length} Medien zu laden.`,
        });
        addToast(
          'success',
          data.mode === 'cloud' ? 'In Cloud gesichert' : 'Auf Server gesichert',
          `${media.length} Medien unter "${cleanCode}" gespeichert`
        );
      } else {
        setFeedback({
          type: 'error',
          message: data.error || data.hint || 'Sicherung fehlgeschlagen.',
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Netzwerkfehler beim Hochladen.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Pull data from Cloud/Server to local
  const handlePullFromCloud = async () => {
    const cleanCode = syncCode.trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 4) {
      setFeedback({ type: 'error', message: 'Bitte gib einen mindestens 4-stelligen Sync-Code ein.' });
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    try {
      localStorage.setItem(STORAGE_SYNC_CODE_KEY, cleanCode);
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pull',
          code: cleanCode,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.data) {
        const pulledMedia = data.data.media || [];
        const pulledSequels = data.data.sequels || [];
        onApplySync(pulledMedia, pulledSequels);
        setFeedback({
          type: 'success',
          message: data.message || `Perfekt! ${pulledMedia.length} Medien wurden erfolgreich synchronisiert.`,
        });
        addToast('success', 'Synchronisiert', `${pulledMedia.length} Medien synchronisiert`);
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'Kein Backup unter diesem Code gefunden.',
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Netzwerkfehler beim Abrufen der Daten.' });
    } finally {
      setIsLoading(false);
    }
  };

  // File Download Backup (.json)
  const handleDownloadFile = () => {
    const exportData = {
      version: 'omnilist_v1',
      exportedAt: new Date().toISOString(),
      itemCount: media.length,
      media,
      sequels,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnilist-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addToast('success', 'Backup exportiert', `${media.length} Medien als JSON-Datei gespeichert`);
  };

  // File Upload Restore (.json)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        const restoredMedia = Array.isArray(parsed) ? parsed : parsed.media;
        const restoredSequels = parsed.sequels || [];

        if (Array.isArray(restoredMedia) && restoredMedia.length >= 0) {
          onApplySync(restoredMedia, restoredSequels);
          setFeedback({
            type: 'success',
            message: `Datei erfolgreich importiert! ${restoredMedia.length} Medien wurden geladen.`,
          });
          addToast('success', 'Backup importiert', `${restoredMedia.length} Medien wiederhergestellt`);
        } else {
          setFeedback({
            type: 'error',
            message: 'Ungültiges Dateiformat. Die JSON-Datei enthält keine gültige Mediensammlung.',
          });
        }
      } catch (err) {
        setFeedback({ type: 'error', message: 'Fehler beim Lesen der JSON-Datei.' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#181B22] border border-[#282D37] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-[#282D37] flex items-center justify-between bg-[#0F1117]/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-[#F1F3F7] text-sm sm:text-base">Geräte-Sync &amp; Backup</h3>
              <p className="text-[10px] sm:text-[11px] text-zinc-400">Sammlung zwischen PC, Smartphone &amp; Tablet abgleichen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-[#F1F3F7] flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#282D37] bg-[#0F1117]/40 px-3 sm:px-4 pt-2 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('cloud')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2',
              activeTab === 'cloud'
                ? 'border-emerald-500 text-emerald-300 bg-[#181B22]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Cloud-Sync (Code)</span>
          </button>

          <button
            onClick={() => setActiveTab('file')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2',
              activeTab === 'file'
                ? 'border-emerald-500 text-emerald-300 bg-[#181B22]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            )}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>JSON-Datei (Offline)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {feedback && (
            <div
              className={cn(
                'p-3.5 rounded-2xl text-xs flex items-start gap-2.5 leading-relaxed animate-fadeIn border',
                feedback.type === 'success' && 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
                feedback.type === 'error' && 'bg-rose-500/15 text-rose-300 border-rose-500/30',
                feedback.type === 'info' && 'bg-sky-500/15 text-sky-300 border-sky-500/30'
              )}
            >
              {feedback.type === 'success' && <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />}
              {feedback.type === 'error' && <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />}
              {feedback.type === 'info' && <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-sky-400" />}
              <div>{feedback.message}</div>
            </div>
          )}

          {activeTab === 'cloud' ? (
            /* ================= TAB 1: CLOUD SYNC CODE ================= */
            <div className="space-y-4">
              {/* Connection Mode Indicator */}
              <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#0F1117] border border-[#282D37] text-xs">
                <span className="text-zinc-400">Verbindungs-Status:</span>
                <span
                  className={cn(
                    'font-medium flex items-center gap-2',
                    syncStatus?.isCloudConfigured ? 'text-emerald-400' : 'text-sky-400'
                  )}
                >
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full',
                      syncStatus?.isCloudConfigured ? 'bg-emerald-400' : 'bg-sky-400'
                    )}
                  />
                  {syncStatus?.isCloudConfigured
                    ? `${syncStatus.provider} (Cloud aktiv)`
                    : 'Lokaler Server-Modus aktiv'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#0F1117] border border-[#282D37] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Dein persönlicher Sync-Code</span>
                  </label>
                  <button
                    onClick={generateRandomCode}
                    className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 underline"
                  >
                    Neu generieren
                  </button>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  Nutze diesen Code auf all deinen Geräten (z. B. Smartphone), um deine Mediensammlung per Knopfdruck abzugleichen.
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={syncCode}
                    onChange={(e) => setSyncCode(e.target.value.toUpperCase())}
                    placeholder="z. B. OMNI-7821"
                    className="flex-1 bg-[#181B22] border border-[#282D37] focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-[#F1F3F7] tracking-wider uppercase focus:outline-none"
                  />
                  <button
                    onClick={handleCopyCode}
                    title="Code kopieren"
                    className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-colors"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons: Push & Pull */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={handlePushToCloud}
                  disabled={isLoading}
                  className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/30 transition-all active:scale-95 disabled:opacity-50 gap-1.5 text-center"
                >
                  <Upload className="w-4 h-4" />
                  <span>
                    {syncStatus?.isCloudConfigured ? 'In Cloud sichern (Push)' : 'Auf Server sichern (Push)'}
                  </span>
                  <span className="text-[10px] font-normal text-emerald-200">
                    {syncStatus?.isCloudConfigured ? 'Weltweit in Cloud ablegen' : 'Lokal auf PC/Server ablegen'}
                  </span>
                </button>

                <button
                  onClick={handlePullFromCloud}
                  disabled={isLoading}
                  className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-[#181B22] hover:bg-zinc-800 text-zinc-200 hover:text-white font-bold text-xs border border-[#282D37] transition-all active:scale-95 disabled:opacity-50 gap-1.5 text-center"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>
                    {syncStatus?.isCloudConfigured ? 'Aus Cloud laden (Pull)' : 'Vom Server laden (Pull)'}
                  </span>
                  <span className="text-[10px] font-normal text-zinc-400">Auf diesem Gerät empfangen</span>
                </button>
              </div>
            </div>
          ) : (
            /* ================= TAB 2: LOCAL FILE BACKUP ================= */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#0F1117] border border-[#282D37] space-y-2">
                <h4 className="text-xs font-bold text-zinc-300">Offline JSON-Backup</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Lade deine komplette Mediensammlung ({media.length} Einträge) als lesbare JSON-Datei herunter oder stelle ein früheres Backup wieder her.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleDownloadFile}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-xs border border-zinc-700 transition-all active:scale-95 gap-2 text-center"
                >
                  <Download className="w-5 h-5 text-emerald-400" />
                  <span>Backup herunterladen</span>
                  <span className="text-[10px] font-normal text-zinc-400">.json Datei speichern</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-xs border border-zinc-700 transition-all active:scale-95 gap-2 text-center"
                >
                  <Upload className="w-5 h-5 text-sky-400" />
                  <span>Backup wiederherstellen</span>
                  <span className="text-[10px] font-normal text-zinc-400">Datei auswählen</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
