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
  Gamepad2,
  ExternalLink,
  Trophy,
  Clock,
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
const STORAGE_STEAM_INPUT_KEY = 'omnilist_steam_input_v1';
const STORAGE_STEAM_KEY_KEY = 'omnilist_steam_api_key_v1';

interface SteamGameItem {
  appid: number;
  name: string;
  playtimeMinutes: number;
  playtimeHours: number;
  iconUrl?: string;
  coverUrl: string;
  headerUrl: string;
  lastPlayed?: string;
}

interface SteamProfile {
  steamId: string;
  personaname: string;
  avatar?: string;
  profileurl?: string;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  media,
  sequels,
  onApplySync,
  addToast,
}) => {
  const [activeTab, setActiveTab] = useState<'cloud' | 'file' | 'steam'>('cloud');
  const [syncCode, setSyncCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Steam-spezifischer State
  const [steamInput, setSteamInput] = useState('');
  const [steamApiKey, setSteamApiKey] = useState('');
  const [steamProfile, setSteamProfile] = useState<SteamProfile | null>(null);
  const [steamGames, setSteamGames] = useState<SteamGameItem[]>([]);
  const [isSteamLoading, setIsSteamLoading] = useState(false);
  const [isSteamSyncing, setIsSteamSyncing] = useState(false);

  // Load saved sync code & Steam settings from localStorage
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

      const savedSteamInput = localStorage.getItem(STORAGE_STEAM_INPUT_KEY) || '';
      const savedSteamKey = localStorage.getItem(STORAGE_STEAM_KEY_KEY) || '';
      if (savedSteamInput) setSteamInput(savedSteamInput);
      if (savedSteamKey) setSteamApiKey(savedSteamKey);

      setFeedback(null);
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
          message: `Erfolgreich in der Cloud gesichert! Gib auf deinem Zweitgerät einfach den Code "${cleanCode}" ein, um deine ${media.length} Medien zu laden.`,
        });
        addToast('success', 'In Cloud gesichert', `${media.length} Medien unter "${cleanCode}" gespeichert`);
      } else {
        setFeedback({
          type: 'error',
          message: data.error || data.hint || 'Cloud-Sicherung fehlgeschlagen.',
        });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Netzwerkfehler beim Hochladen in die Cloud.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Pull data from Cloud to local
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
          message: `Perfekt! ${pulledMedia.length} Medien wurden erfolgreich aus der Cloud synchronisiert.`,
        });
        addToast('success', 'Aus Cloud geladen', `${pulledMedia.length} Medien synchronisiert`);
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'Kein Cloud-Backup unter diesem Code gefunden.',
        });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Netzwerkfehler beim Abrufen aus der Cloud.' });
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
      } catch {
        setFeedback({ type: 'error', message: 'Fehler beim Lesen der JSON-Datei.' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ================= STEAM INTEGRATION LOGIC =================
  const normalizeTitle = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

  const handleFetchSteam = async () => {
    if (!steamInput.trim()) {
      setFeedback({ type: 'error', message: 'Bitte gib deinen Steam-Profil-Link oder deine Steam-ID ein.' });
      return;
    }

    setIsSteamLoading(true);
    setFeedback(null);

    // Save inputs
    localStorage.setItem(STORAGE_STEAM_INPUT_KEY, steamInput.trim());
    if (steamApiKey.trim()) {
      localStorage.setItem(STORAGE_STEAM_KEY_KEY, steamApiKey.trim());
    }

    try {
      // 1. Fetch Profile
      const profRes = await fetch('/api/sync/steam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-profile',
          steamInput: steamInput.trim(),
          apiKey: steamApiKey.trim(),
        }),
      });

      if (profRes.ok) {
        const profData = await profRes.json();
        setSteamProfile(profData);
      }

      // 2. Fetch Games
      const gamesRes = await fetch('/api/sync/steam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-games',
          steamInput: steamInput.trim(),
          apiKey: steamApiKey.trim(),
        }),
      });

      const gamesData = await gamesRes.json();

      if (!gamesRes.ok) {
        setFeedback({
          type: 'error',
          message: gamesData.error || gamesData.hint || 'Konnte keine Steam-Spiele abrufen.',
        });
        return;
      }

      setSteamGames(gamesData.games || []);
      setFeedback({
        type: 'success',
        message: `${gamesData.games?.length || 0} Spiele erfolgreich aus deinem Steam-Konto geladen!`,
      });
      addToast('success', 'Steam verbunden', `${gamesData.games?.length || 0} Spiele gefunden`);
    } catch {
      setFeedback({ type: 'error', message: 'Netzwerkfehler bei der Verbindung mit Steam.' });
    } finally {
      setIsSteamLoading(false);
    }
  };

  // Sync playtime and achievements for games that are ALREADY in OmniList
  const handleSyncExistingGames = async () => {
    if (steamGames.length === 0) return;

    setIsSteamSyncing(true);
    setFeedback(null);

    try {
      const existingGames = media.filter((m) => m.type === 'game');
      const matches: { mediaItem: MediaItem; steamGame: SteamGameItem }[] = [];

      for (const item of existingGames) {
        const matched = steamGames.find((sg) => {
          if (item.external_id === `steam:${sg.appid}`) return true;
          return normalizeTitle(sg.name) === normalizeTitle(item.title);
        });
        if (matched) {
          matches.push({ mediaItem: item, steamGame: matched });
        }
      }

      if (matches.length === 0) {
        setFeedback({
          type: 'info',
          message: 'Keine übereinstimmenden Spiele in deiner OmniList-Sammlung gefunden.',
        });
        setIsSteamSyncing(false);
        return;
      }

      // Fetch achievements for matched games
      const appIds = matches.map((m) => m.steamGame.appid);
      const achRes = await fetch('/api/sync/steam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-achievements',
          steamInput: steamInput.trim(),
          apiKey: steamApiKey.trim(),
          appIds,
        }),
      });

      const achData = achRes.ok ? await achRes.json() : { achievements: {} };
      const achievementsMap = achData.achievements || {};

      // Update existing media
      const updatedMedia = media.map((item) => {
        const match = matches.find((m) => m.mediaItem.id === item.id);
        if (!match) return item;

        const ach = achievementsMap[match.steamGame.appid];
        const existingTracker = item.gameTracker || {};

        return {
          ...item,
          external_id: item.external_id?.startsWith('steam:') ? item.external_id : `steam:${match.steamGame.appid}`,
          progress: {
            ...item.progress,
            current: match.steamGame.playtimeHours,
            unit: 'hours' as const,
          },
          gameTracker: {
            ...existingTracker,
            playtimeHours: match.steamGame.playtimeHours,
            achievements: ach ? { current: ach.current, total: ach.total } : existingTracker.achievements,
            completionist100: ach ? ach.completionist100 : existingTracker.completionist100,
          },
          updatedAt: new Date().toISOString(),
        };
      });

      onApplySync(updatedMedia, sequels);
      setFeedback({
        type: 'success',
        message: `${matches.length} Spiele erfolgreich mit Steam-Spielzeiten & Achievements aktualisiert!`,
      });
      addToast('success', 'Steam-Sync abgeschlossen', `${matches.length} Spiele aktualisiert`);
    } catch {
      setFeedback({ type: 'error', message: 'Fehler beim Aktualisieren der Steam-Spieldaten.' });
    } finally {
      setIsSteamSyncing(false);
    }
  };

  // Import top played games from Steam into OmniList
  const handleImportPlayedGames = (limit = 20) => {
    if (steamGames.length === 0) return;

    const existingExternalIds = new Set(media.map((m) => m.external_id));
    const existingTitles = new Set(media.map((m) => normalizeTitle(m.title)));

    const toImport = steamGames
      .filter((sg) => sg.playtimeMinutes > 0)
      .filter((sg) => !existingExternalIds.has(`steam:${sg.appid}`) && !existingTitles.has(normalizeTitle(sg.name)))
      .slice(0, limit);

    if (toImport.length === 0) {
      setFeedback({
        type: 'info',
        message: 'Alle gespielten Steam-Spiele sind bereits in deiner OmniList vorhanden.',
      });
      return;
    }

    const newMediaItems: MediaItem[] = toImport.map((sg) => ({
      id: `steam:${sg.appid}:${Date.now()}:${Math.random().toString(36).slice(2, 6)}`,
      title: sg.name,
      type: 'game',
      status: sg.playtimeHours > 0 ? 'in_progress' : 'planned',
      isOwned: true,
      coverUrl: sg.coverUrl,
      bannerUrl: sg.headerUrl,
      external_id: `steam:${sg.appid}`,
      progress: {
        current: sg.playtimeHours,
        unit: 'hours',
      },
      gameTracker: {
        playtimeHours: sg.playtimeHours,
        storyCompleted: false,
        completionist100: false,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const combined = [...newMediaItems, ...media];
    onApplySync(combined, sequels);

    setFeedback({
      type: 'success',
      message: `${newMediaItems.length} Steam-Spiele wurden deiner Sammlung hinzugefügt!`,
    });
    addToast('success', 'Spiele importiert', `${newMediaItems.length} Steam-Titel hinzugefügt`);
  };

  const existingGamesCount = media.filter((m) => m.type === 'game').length;
  const matchedGamesCount = steamGames.filter((sg) => {
    return media.some(
      (m) => m.type === 'game' && (m.external_id === `steam:${sg.appid}` || normalizeTitle(m.title) === normalizeTitle(sg.name))
    );
  }).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#181B22] border border-[#282D37] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#282D37] flex items-center justify-between bg-[#0F1117]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-[#F1F3F7] text-base">Geräte-Sync &amp; Accounts</h3>
              <p className="text-[11px] text-zinc-400">Cloud-Backup, Offline-Dateien &amp; Steam-Verknüpfung</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-[#F1F3F7] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#282D37] bg-[#0F1117]/40 px-4 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('cloud')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap',
              activeTab === 'cloud'
                ? 'border-emerald-500 text-emerald-300 bg-[#181B22]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Cloud-Sync (Code)</span>
          </button>

          <button
            onClick={() => setActiveTab('steam')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap',
              activeTab === 'steam'
                ? 'border-blue-500 text-blue-300 bg-[#181B22]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Gamepad2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Steam (Gaming)</span>
          </button>

          <button
            onClick={() => setActiveTab('file')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap',
              activeTab === 'file'
                ? 'border-emerald-500 text-emerald-300 bg-[#181B22]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            )}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>JSON (Offline)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
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

          {activeTab === 'cloud' && (
            /* ================= TAB 1: CLOUD SYNC CODE ================= */
            <div className="space-y-4">
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
                  <span>In Cloud sichern (Push)</span>
                  <span className="text-[10px] font-normal text-emerald-200">PC-Daten hochladen</span>
                </button>

                <button
                  onClick={handlePullFromCloud}
                  disabled={isLoading}
                  className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-[#181B22] hover:bg-zinc-800 text-zinc-200 hover:text-white font-bold text-xs border border-[#282D37] transition-all active:scale-95 disabled:opacity-50 gap-1.5 text-center"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Aus Cloud laden (Pull)</span>
                  <span className="text-[10px] font-normal text-zinc-400">Auf diesem Gerät empfangen</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'steam' && (
            /* ================= TAB 2: STEAM INTEGRATION ================= */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#0F1117] border border-[#282D37] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-blue-400" />
                    <h4 className="text-xs font-bold text-zinc-200">Steam-Konto anbinden</h4>
                  </div>
                  <a
                    href="https://steamcommunity.com/dev/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>API-Key holen</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  Rufe deine Spielzeiten, Errungenschaften (Achievements) und Spiele automatisch aus deinem Steam-Profil ab.
                </p>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-zinc-300">Steam-ID oder Profil-Link / Vanity-Name</label>
                  <input
                    type="text"
                    value={steamInput}
                    onChange={(e) => setSteamInput(e.target.value)}
                    placeholder="z. B. 76561198... oder https://steamcommunity.com/id/name"
                    className="w-full bg-[#181B22] border border-[#282D37] focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-[#F1F3F7] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-semibold text-zinc-300">Steam Web API-Key (Optional)</label>
                    <span className="text-[10px] text-zinc-500">Falls in .env hinterlegt, leer lassen</span>
                  </div>
                  <input
                    type="password"
                    value={steamApiKey}
                    onChange={(e) => setSteamApiKey(e.target.value)}
                    placeholder="32-stelliger Hex-Key"
                    className="w-full bg-[#181B22] border border-[#282D37] focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-[#F1F3F7] font-mono focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleFetchSteam}
                  disabled={isSteamLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={cn('w-3.5 h-3.5', isSteamLoading && 'animate-spin')} />
                  <span>{isSteamLoading ? 'Verbinde mit Steam...' : 'Steam-Spiele abrufen'}</span>
                </button>
              </div>

              {/* Profile Card & Sync Actions if Games loaded */}
              {steamGames.length > 0 && (
                <div className="p-4 rounded-2xl bg-[#0F1117] border border-blue-500/30 space-y-3.5 animate-fadeIn">
                  {steamProfile && (
                    <div className="flex items-center gap-3 pb-3 border-b border-[#282D37]">
                      {steamProfile.avatar && (
                        <img
                          src={steamProfile.avatar}
                          alt={steamProfile.personaname}
                          className="w-10 h-10 rounded-full border border-blue-400"
                        />
                      )}
                      <div>
                        <div className="text-xs font-bold text-[#F1F3F7]">{steamProfile.personaname}</div>
                        <div className="text-[10px] text-zinc-400">
                          {steamGames.length} Spiele gefunden • {matchedGamesCount} in deiner OmniList
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-[#181B22] border border-[#282D37]">
                      <div className="text-zinc-400 text-[10px]">Steam-Katalog</div>
                      <div className="font-bold text-[#F1F3F7] text-sm">{steamGames.length}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#181B22] border border-[#282D37]">
                      <div className="text-zinc-400 text-[10px]">Verknüpfte Spiele</div>
                      <div className="font-bold text-emerald-400 text-sm">{matchedGamesCount}</div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      onClick={handleSyncExistingGames}
                      disabled={isSteamSyncing || matchedGamesCount === 0}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all active:scale-95 disabled:opacity-40"
                    >
                      <Trophy className={cn('w-4 h-4', isSteamSyncing && 'animate-spin')} />
                      <span>
                        {isSteamSyncing
                          ? 'Aktualisiere Spielzeiten & Achievements...'
                          : `Bestehende (${matchedGamesCount}) aktualisieren`}
                      </span>
                    </button>

                    <button
                      onClick={() => handleImportPlayedGames(25)}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-all active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-400" />
                      <span>Top Steam-Spiele in OmniList importieren</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'file' && (
            /* ================= TAB 3: LOCAL FILE BACKUP ================= */
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
