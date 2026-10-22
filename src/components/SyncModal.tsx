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
  AlertTriangle,
  Key,
  Gamepad2,
  ExternalLink,
  Trophy,
  Clock,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { MediaItem, SequelNotification } from '@/types/media';
import { cn } from '@/lib/utils';
import { isGameDeleted, getDeletedGameKeys, clearDeletedGameKeys } from '@/lib/storage';
import { isAutoSyncEnabled, setAutoSyncEnabled } from '@/lib/auto-sync';
import { getMediaMetacriticScore } from '@/lib/metacritic';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: MediaItem[];
  sequels: SequelNotification[];
  onApplySync: (media: MediaItem[], sequels?: SequelNotification[]) => void;
  addToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  initialTab?: 'cloud' | 'gaming' | 'file';
  initialGamingSubTab?: 'steam' | 'psn' | 'gog';
}

const STORAGE_SYNC_CODE_KEY = 'omnilist_last_sync_code_v1';
const LEGACY_STORAGE_SYNC_CODE_KEY = 'omnitrack_last_sync_code_v1';

// Integration LocalStorage Keys
const STORAGE_STEAM_INPUT_KEY = 'omnilist_steam_input_v1';
const STORAGE_PSN_NPSSO_KEY = 'omnilist_psn_npsso_v1';
const STORAGE_GOG_USER_KEY = 'omnilist_gog_username_v1';
const STORAGE_GOG_TOKEN_KEY = 'omnilist_gog_token_v1';

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

interface PsnGameItem {
  id: string;
  name: string;
  platform?: string;
  coverUrl?: string;
  playtimeHours: number;
  trophies: {
    current: number;
    total: number;
    hasPlatinum: boolean;
    completionist100: boolean;
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
}

interface GogGameItem {
  id: string;
  gameId: string | number;
  title: string;
  playtimeMinutes: number;
  playtimeHours: number;
  coverUrl?: string;
  bannerUrl?: string;
  lastPlayed?: string;
  achievements?: {
    current: number;
    total: number;
    completionist100: boolean;
  };
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  media,
  sequels,
  onApplySync,
  addToast,
  initialTab,
  initialGamingSubTab,
}) => {
  const [activeTab, setActiveTab] = useState<'cloud' | 'gaming' | 'file'>('cloud');
  const [gamingSubTab, setGamingSubTab] = useState<'steam' | 'psn' | 'gog'>('steam');

  const [syncCode, setSyncCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ignore / Deleted Games Count
  const [deletedGamesCount, setDeletedGamesCount] = useState<number>(0);
  const [autoSyncEnabledState, setAutoSyncEnabledState] = useState<boolean>(true);

  // Steam State
  const [steamInput, setSteamInput] = useState('');
  const [steamProfile, setSteamProfile] = useState<{ steamId: string; personaname: string; avatar?: string } | null>(null);
  const [steamGames, setSteamGames] = useState<SteamGameItem[]>([]);
  const [isSteamLoading, setIsSteamLoading] = useState(false);
  const [isSteamSyncing, setIsSteamSyncing] = useState(false);
  const [steamOnlyPlayed, setSteamOnlyPlayed] = useState<boolean>(true);

  // PSN State
  const [psnNpsso, setPsnNpsso] = useState('');
  const [isPsnExpired, setIsPsnExpired] = useState(false);
  const [psnGames, setPsnGames] = useState<PsnGameItem[]>([]);
  const [isPsnLoading, setIsPsnLoading] = useState(false);
  const [isPsnSyncing, setIsPsnSyncing] = useState(false);

  // GOG State
  const [gogUsername, setGogUsername] = useState('');
  const [gogCode, setGogCode] = useState('');
  const [isGogExpired, setIsGogExpired] = useState(false);
  const [gogGames, setGogGames] = useState<GogGameItem[]>([]);
  const [isGogLoading, setIsGogLoading] = useState(false);
  const [isGogSyncing, setIsGogSyncing] = useState(false);
  useEffect(() => {
    if (isOpen) {
      if (initialTab) setActiveTab(initialTab);
      if (initialGamingSubTab) setGamingSubTab(initialGamingSubTab);
      setDeletedGamesCount(getDeletedGameKeys().length);
      setAutoSyncEnabledState(isAutoSyncEnabled());

      const savedCode =
        localStorage.getItem(STORAGE_SYNC_CODE_KEY) ||
        localStorage.getItem(LEGACY_STORAGE_SYNC_CODE_KEY);
      if (savedCode) {
        setSyncCode(savedCode);
      } else if (!syncCode) {
        generateRandomCode();
      }

      setSteamInput(localStorage.getItem(STORAGE_STEAM_INPUT_KEY) || '');
      const savedPsn = localStorage.getItem(STORAGE_PSN_NPSSO_KEY) || '';
      setPsnNpsso(savedPsn);
      const savedPsnTime = localStorage.getItem('omnilist_psn_saved_at_v1');
      if (savedPsn && savedPsnTime) {
        const daysOld = Math.floor((Date.now() - parseInt(savedPsnTime, 10)) / (1000 * 60 * 60 * 24));
        if (daysOld >= 55) {
          setIsPsnExpired(true);
        }
      }
      setGogUsername(localStorage.getItem(STORAGE_GOG_USER_KEY) || '');
      setGogCode(localStorage.getItem(STORAGE_GOG_TOKEN_KEY) || '');

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

  const normalizeTitle = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

  // ================= CLOUD PUSH & PULL =================
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
          data: {
            media,
            sequels,
            integrations: {
              steam: {
                steamInput: steamInput.trim(),
              },
              psn: {
                npsso: psnNpsso.trim(),
              },
              gog: {
                username: gogUsername.trim(),
                token: gogCode.trim(),
              },
            },
          },
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          message:
            data.message ||
            `Erfolgreich gesichert! Gib auf deinem Zweitgerät einfach den Code "${cleanCode}" ein, um deine ${media.length} Medien & Account-Verknüpfungen abzurufen.`,
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
    } catch {
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
        let payloadData = data.data;
        while (typeof payloadData === 'string') {
          try {
            payloadData = JSON.parse(payloadData);
          } catch {
            break;
          }
        }

        const pulledMedia = Array.isArray(payloadData?.media) ? payloadData.media : [];
        const pulledSequels = Array.isArray(payloadData?.sequels) ? payloadData.sequels : [];
        const pulledIntegrations = payloadData?.integrations;

        if (pulledMedia.length === 0 && (!payloadData || !payloadData.media)) {
          setFeedback({
            type: 'error',
            message: 'Unter diesem Code konnten keine Medien aus der Cloud gelesen werden. Deine bestehende Sammlung wurde geschützt.',
          });
          return;
        }

        if (pulledIntegrations?.steam?.steamInput) {
          setSteamInput(pulledIntegrations.steam.steamInput);
          localStorage.setItem(STORAGE_STEAM_INPUT_KEY, pulledIntegrations.steam.steamInput);
        }

        if (pulledIntegrations?.psn?.npsso) {
          setPsnNpsso(pulledIntegrations.psn.npsso);
          localStorage.setItem(STORAGE_PSN_NPSSO_KEY, pulledIntegrations.psn.npsso);
        }

        if (pulledIntegrations?.gog?.username) {
          setGogUsername(pulledIntegrations.gog.username);
          localStorage.setItem(STORAGE_GOG_USER_KEY, pulledIntegrations.gog.username);
        }

        if (pulledIntegrations?.gog?.token) {
          setGogCode(pulledIntegrations.gog.token);
          localStorage.setItem(STORAGE_GOG_TOKEN_KEY, pulledIntegrations.gog.token);
        }

        onApplySync(pulledMedia, pulledSequels);
        setFeedback({
          type: 'success',
          message:
            data.message ||
            `Perfekt! ${pulledMedia.length} Medien und deine Account-Verknüpfungen (Steam, PSN, GOG) wurden erfolgreich synchronisiert.`,
        });
        addToast(
          'success',
          data.mode === 'cloud' ? 'Aus Cloud geladen' : 'Vom Server geladen',
          `${pulledMedia.length} Medien & Accounts synchronisiert`
        );
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'Kein Backup unter diesem Code gefunden.',
        });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Netzwerkfehler beim Abrufen der Daten.' });
    } finally {
      setIsLoading(false);
    }
  };

  // ================= FILE BACKUP =================
  const handleDownloadFile = () => {
    const exportData = {
      version: 'omnilist_v1',
      exportedAt: new Date().toISOString(),
      itemCount: media.length,
      media,
      sequels,
      integrations: {
        steam: { steamInput: steamInput.trim() },
        psn: { npsso: psnNpsso.trim() },
        gog: { username: gogUsername.trim(), token: gogCode.trim() },
      },
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

    addToast('success', 'Backup exportiert', `${media.length} Medien & Accounts gespeichert`);
  };

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
        const restoredIntegrations = parsed.integrations;

        if (restoredIntegrations?.steam?.steamInput) {
          setSteamInput(restoredIntegrations.steam.steamInput);
          localStorage.setItem(STORAGE_STEAM_INPUT_KEY, restoredIntegrations.steam.steamInput);
        }

        if (restoredIntegrations?.psn?.npsso) {
          setPsnNpsso(restoredIntegrations.psn.npsso);
          localStorage.setItem(STORAGE_PSN_NPSSO_KEY, restoredIntegrations.psn.npsso);
        }

        if (restoredIntegrations?.gog?.username) {
          setGogUsername(restoredIntegrations.gog.username);
          localStorage.setItem(STORAGE_GOG_USER_KEY, restoredIntegrations.gog.username);
        }

        if (restoredIntegrations?.gog?.token) {
          setGogCode(restoredIntegrations.gog.token);
          localStorage.setItem(STORAGE_GOG_TOKEN_KEY, restoredIntegrations.gog.token);
        }

        if (Array.isArray(restoredMedia) && restoredMedia.length >= 0) {
          onApplySync(restoredMedia, restoredSequels);
          setFeedback({
            type: 'success',
            message: `Datei erfolgreich importiert! ${restoredMedia.length} Medien & Accounts wurden geladen.`,
          });
          addToast('success', 'Backup importiert', `${restoredMedia.length} Medien wiederhergestellt`);
        }
      } catch {
        setFeedback({ type: 'error', message: 'Fehler beim Lesen der JSON-Datei.' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ================= STEAM UNIFIED SMART SYNC =================
  const handleSyncSteam = async (onlyPlayed = true) => {
    const input = steamInput.trim();
    if (!input) {
      setFeedback({ type: 'error', message: 'Bitte gib deinen Steam-Profil-Link oder deine Steam-ID ein.' });
      return;
    }

    setIsSteamLoading(true);
    setFeedback(null);
    localStorage.setItem(STORAGE_STEAM_INPUT_KEY, input);

    try {
      // 1. Profil & Spiele abrufen
      const [profRes, gamesRes] = await Promise.all([
        fetch('/api/sync/steam', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get-profile', steamInput: input }),
        }),
        fetch('/api/sync/steam', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get-games', steamInput: input }),
        }),
      ]);

      if (profRes.ok) setSteamProfile(await profRes.json());
      const gamesData = await gamesRes.json();
      if (!gamesRes.ok) {
        const fullMsg = gamesData.hint ? `${gamesData.error} ${gamesData.hint}` : (gamesData.error || 'Fehler beim Abrufen der Steam-Spiele');
        throw new Error(fullMsg);
      }

      const fetchedGames: SteamGameItem[] = gamesData.games || [];
      setSteamGames(fetchedGames);

      if (fetchedGames.length === 0) {
        setFeedback({
          type: 'info',
          message: 'Keine Spiele im Steam-Profil gefunden. Bitte prüfe die Privatsphäre-Einstellungen auf Steam (Spieldetails müssen öffentlich sein).',
        });
        return;
      }

      // 2. Bestehende Spiele in der OmniList identifizieren
      const existingGames = media.filter((m) => m.type === 'game');
      const matchedAppIds: number[] = [];
      const matches = existingGames.map((item) => {
        const match = fetchedGames.find(
          (sg) =>
            item.external_id === `steam:${sg.appid}` ||
            item.gameConnection?.serviceId === String(sg.appid) ||
            normalizeTitle(sg.name) === normalizeTitle(item.title)
        );
        if (match) matchedAppIds.push(match.appid);
        return { item, match };
      });

      // 3. Achievements für gematchte Titel laden
      let achMap: Record<number, any> = {};
      if (matchedAppIds.length > 0) {
        try {
          const achRes = await fetch('/api/sync/steam', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'get-achievements',
              steamInput: input,
              appIds: matchedAppIds,
            }),
          });
          if (achRes.ok) {
            const achData = await achRes.json();
            achMap = achData.achievements || {};
          }
        } catch (e) {
          console.warn('Achievements fetch failed', e);
        }
      }

      // 4. Bestehende Einträge aktualisieren (Spielzeit & Achievements anpassen, Notizen & Sterne behalten)
      let updatedCount = 0;
      const updatedMedia = media.map((item) => {
        const pair = matches.find((m) => m.item.id === item.id);
        if (!pair || !pair.match) return item;

        const sg = pair.match;
        const ach = achMap[sg.appid];
        updatedCount++;
        return {
          ...item,
          external_id: item.external_id?.startsWith('steam:') ? item.external_id : `steam:${sg.appid}`,
          connectedService: 'steam' as const,
          gameConnection: {
            service: 'steam' as const,
            serviceId: String(sg.appid),
            serviceName: 'Steam',
            accountUsername: steamProfile?.personaname || input,
            lastPlayed: sg.lastPlayed,
          },
          progress: {
            ...item.progress,
            current: sg.playtimeHours,
            unit: 'hours' as const,
          },
          gameTracker: {
            ...(item.gameTracker || {}),
            playtimeHours: sg.playtimeHours,
            achievements: ach ? { current: ach.current, total: ach.total } : item.gameTracker?.achievements,
            completionist100: ach ? ach.completionist100 : item.gameTracker?.completionist100,
            allAchievementsCompleted: ach ? (ach.completionist100 || (ach.total > 0 && ach.current >= ach.total)) : item.gameTracker?.allAchievementsCompleted,
          },
          metacritic: item.metacritic || getMediaMetacriticScore(item) || undefined,
          updatedAt: new Date().toISOString(),
        };
      });

      // 5. Neue Spiele identifizieren (Duplikate und bereits gelöschte Spiele ausschließen)
      const matchedAppIdSet = new Set(matchedAppIds);
      const existingTitles = new Set(media.map((m) => normalizeTitle(m.title)));
      let skippedDeletedCount = 0;

      const newGamesToAdd = fetchedGames.filter((sg) => {
        if (matchedAppIdSet.has(sg.appid)) return false;
        if (existingTitles.has(normalizeTitle(sg.name))) return false;
        if (onlyPlayed && sg.playtimeMinutes <= 0) return false;

        // Gelöschte Spiele ignorieren
        if (isGameDeleted(`steam:${sg.appid}`, sg.name)) {
          skippedDeletedCount++;
          return false;
        }
        return true;
      });

      const newItems: MediaItem[] = newGamesToAdd.map((sg) => {
        const itemMeta: any = {
          title: sg.name,
          type: 'game',
          external_id: `steam:${sg.appid}`,
          gameConnection: {
            service: 'steam',
            serviceId: String(sg.appid),
          },
        };
        const score = getMediaMetacriticScore(itemMeta) || undefined;
        return {
          id: `media-steam-${sg.appid}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: sg.name,
          type: 'game',
          status: sg.playtimeHours > 0 ? 'in_progress' : 'planned',
          isOwned: true,
          coverUrl: sg.coverUrl,
          bannerUrl: sg.headerUrl,
          external_id: `steam:${sg.appid}`,
          connectedService: 'steam',
          gameConnection: {
            service: 'steam',
            serviceId: String(sg.appid),
            serviceName: 'Steam',
            accountUsername: steamProfile?.personaname || input,
            lastPlayed: sg.lastPlayed,
          },
          publisher: 'Steam',
          progress: { current: sg.playtimeHours, unit: 'hours' },
          gameTracker: { playtimeHours: sg.playtimeHours, storyCompleted: false, completionist100: false },
          metacritic: score,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });

      const finalMedia = [...newItems, ...updatedMedia];
      onApplySync(finalMedia, sequels);

      const parts = [];
      if (updatedCount > 0) parts.push(`${updatedCount} bestehende aktualisiert`);
      if (newItems.length > 0) parts.push(`${newItems.length} neue hinzugefügt`);
      if (skippedDeletedCount > 0) parts.push(`${skippedDeletedCount} gelöschte übersprungen`);
      if (parts.length === 0) parts.push('Bereits auf dem neuesten Stand');

      const msg = `Steam synchronisiert: ${parts.join(', ')}.`;
      setFeedback({ type: 'success', message: msg });
      addToast('success', 'Steam synchronisiert', msg);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Verbindung zu Steam fehlgeschlagen.' });
    } finally {
      setIsSteamLoading(false);
      setIsSteamSyncing(false);
    }
  };

  // ================= PLAYSTATION UNIFIED SMART SYNC =================
  const handleSyncPsn = async () => {
    if (!psnNpsso.trim()) {
      setFeedback({ type: 'error', message: 'Bitte gib deinen PlayStation NPSSO-Token ein.' });
      return;
    }

    setIsPsnLoading(true);
    setFeedback(null);
    localStorage.setItem(STORAGE_PSN_NPSSO_KEY, psnNpsso.trim());

    try {
      const res = await fetch('/api/sync/psn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-games', npsso: psnNpsso.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.expired || res.status === 401) {
          setIsPsnExpired(true);
          addToast('error', 'PSN-Token abgelaufen', 'Bitte erneuere deinen PlayStation NPSSO-Token');
        }
        throw new Error(data.error || 'Fehler beim Abrufen der PlayStation-Daten');
      }

      setIsPsnExpired(false);
      localStorage.setItem('omnilist_psn_saved_at_v1', Date.now().toString());
      const fetchedGames: PsnGameItem[] = data.games || [];
      setPsnGames(fetchedGames);

      if (fetchedGames.length === 0) {
        setFeedback({ type: 'info', message: 'Keine PlayStation-Spiele auf diesem Account gefunden.' });
        return;
      }

      // 1. Matches finden
      const existingGames = media.filter((m) => m.type === 'game');
      const matchedIds: string[] = [];
      const matches = existingGames.map((item) => {
        const match = fetchedGames.find(
          (pg) =>
            item.external_id === pg.id ||
            item.gameConnection?.serviceId === pg.id ||
            normalizeTitle(pg.name) === normalizeTitle(item.title)
        );
        if (match) matchedIds.push(match.id);
        return { item, match };
      });

      // 2. Bestehende aktualisieren
      let updatedCount = 0;
      const updatedMedia = media.map((item) => {
        const pair = matches.find((m) => m.item.id === item.id);
        if (!pair || !pair.match) return item;

        const pg = pair.match;
        const t = pg.trophies;
        updatedCount++;
        return {
          ...item,
          external_id: item.external_id?.startsWith('psn:') ? item.external_id : pg.id,
          connectedService: 'psn' as const,
          gameConnection: {
            service: 'psn' as const,
            serviceId: pg.id,
            serviceName: 'PlayStation Network',
            platform: pg.platform || item.gameConnection?.platform || 'PS5',
            lastPlayed: undefined,
          },
          progress: {
            ...item.progress,
            current: pg.playtimeHours > 0 ? pg.playtimeHours : item.progress.current,
            unit: 'hours' as const,
          },
          gameTracker: {
            ...(item.gameTracker || {}),
            playtimeHours: pg.playtimeHours > 0 ? pg.playtimeHours : item.gameTracker?.playtimeHours,
            achievements: t.total > 0 ? { current: t.current, total: t.total } : item.gameTracker?.achievements,
            completionist100: t.completionist100,
            allAchievementsCompleted: t.completionist100 || (t.total > 0 && t.current >= t.total),
          },
          metacritic: item.metacritic || getMediaMetacriticScore(item) || undefined,
          updatedAt: new Date().toISOString(),
        };
      });

      // 3. Neue Spiele hinzufügen (gelöschte überspringen)
      const matchedIdSet = new Set(matchedIds);
      const existingTitles = new Set(media.map((m) => normalizeTitle(m.title)));
      let skippedDeletedCount = 0;

      const newGamesToAdd = fetchedGames.filter((pg) => {
        if (matchedIdSet.has(pg.id)) return false;
        if (existingTitles.has(normalizeTitle(pg.name))) return false;

        if (isGameDeleted(pg.id, pg.name)) {
          skippedDeletedCount++;
          return false;
        }
        return true;
      });

      const newItems: MediaItem[] = newGamesToAdd.map((pg) => {
        const itemMeta: any = {
          title: pg.name,
          type: 'game',
          external_id: pg.id,
          gameConnection: {
            service: 'psn',
            serviceId: pg.id,
          },
        };
        const score = getMediaMetacriticScore(itemMeta) || undefined;
        return {
          id: `media-psn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: pg.name,
          type: 'game',
          status: pg.trophies.completionist100 ? 'completed' : pg.playtimeHours > 0 ? 'in_progress' : 'planned',
          isOwned: true,
          coverUrl: pg.coverUrl || '',
          external_id: pg.id,
          connectedService: 'psn',
          gameConnection: {
            service: 'psn',
            serviceId: pg.id,
            serviceName: 'PlayStation Network',
            platform: pg.platform || 'PS5',
          },
          publisher: `PlayStation (${pg.platform || 'PS5'})`,
          progress: { current: pg.playtimeHours, unit: 'hours' },
          gameTracker: {
            playtimeHours: pg.playtimeHours,
            storyCompleted: pg.trophies.completionist100,
            completionist100: pg.trophies.completionist100,
            allAchievementsCompleted: pg.trophies.completionist100 || (pg.trophies.total > 0 && pg.trophies.current >= pg.trophies.total),
            achievements: pg.trophies.total > 0 ? { current: pg.trophies.current, total: pg.trophies.total } : undefined,
          },
          metacritic: score,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });

      const finalMedia = [...newItems, ...updatedMedia];
      onApplySync(finalMedia, sequels);

      const parts = [];
      if (updatedCount > 0) parts.push(`${updatedCount} bestehende aktualisiert`);
      if (newItems.length > 0) parts.push(`${newItems.length} neue hinzugefügt`);
      if (skippedDeletedCount > 0) parts.push(`${skippedDeletedCount} gelöschte übersprungen`);
      if (parts.length === 0) parts.push('Bereits auf dem neuesten Stand');

      const msg = `PlayStation synchronisiert: ${parts.join(', ')}.`;
      setFeedback({ type: 'success', message: msg });
      addToast('success', 'PSN synchronisiert', msg);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Verbindung zu PlayStation Network fehlgeschlagen.' });
    } finally {
      setIsPsnLoading(false);
      setIsPsnSyncing(false);
    }
  };

  // ================= GOG UNIFIED SMART SYNC =================
  const handleSyncGog = async () => {
    const code = gogCode.trim();
    const username = gogUsername.trim();
    if (!code && !username) {
      setFeedback({ type: 'error', message: 'Bitte gib deinen GOG Login-Code oder deinen GOG-Benutzernamen ein.' });
      return;
    }

    setIsGogLoading(true);
    setFeedback(null);
    if (username) localStorage.setItem(STORAGE_GOG_USER_KEY, username);
    if (code) localStorage.setItem(STORAGE_GOG_TOKEN_KEY, code);

    try {
      const res = await fetch('/api/sync/gog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, token: code, username }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.expired || res.status === 401) {
          setIsGogExpired(true);
        }
        throw new Error(data.error || 'Fehler beim Abrufen der GOG-Spiele');
      }

      setIsGogExpired(false);
      const effectiveUsername = data.username || username || 'GOG';
      if (data.username) {
        setGogUsername(data.username);
        localStorage.setItem(STORAGE_GOG_USER_KEY, data.username);
      }
      if (data.token) {
        setGogCode(data.token);
        localStorage.setItem(STORAGE_GOG_TOKEN_KEY, data.token);
      }

      const fetchedGames: GogGameItem[] = data.games || [];
      setGogGames(fetchedGames);

      if (fetchedGames.length === 0) {
        setFeedback({ type: 'info', message: 'Keine Spiele für dieses GOG-Konto gefunden.' });
        return;
      }

      // 1. Matches finden
      const existingGames = media.filter((m) => m.type === 'game');
      const matchedIds: string[] = [];
      const matches = existingGames.map((item) => {
        const match = fetchedGames.find(
          (gg) =>
            item.external_id === gg.id ||
            item.gameConnection?.serviceId === String(gg.gameId) ||
            normalizeTitle(gg.title) === normalizeTitle(item.title)
        );
        if (match) matchedIds.push(String(match.id));
        return { item, match };
      });

      // 2. Bestehende aktualisieren
      let updatedCount = 0;
      const updatedMedia = media.map((item) => {
        const pair = matches.find((m) => m.item.id === item.id);
        if (!pair || !pair.match) return item;

        const gg = pair.match;
        const ach = gg.achievements;
        updatedCount++;
        return {
          ...item,
          external_id: item.external_id?.startsWith('gog:') ? item.external_id : gg.id,
          connectedService: 'gog' as const,
          status: item.status === 'planned' && gg.playtimeHours > 0 ? 'in_progress' : item.status,
          gameConnection: {
            service: 'gog' as const,
            serviceId: String(gg.gameId),
            serviceName: 'GOG Galaxy',
            accountUsername: effectiveUsername,
            playtimeMinutes: gg.playtimeMinutes,
            lastPlayed: gg.lastPlayed || item.gameConnection?.lastPlayed,
          },
          progress: {
            ...item.progress,
            current: gg.playtimeHours > 0 ? gg.playtimeHours : item.progress.current,
            unit: 'hours' as const,
          },
          gameTracker: {
            ...(item.gameTracker || {}),
            playtimeHours: gg.playtimeHours > 0 ? gg.playtimeHours : item.gameTracker?.playtimeHours,
            achievements: ach ? { current: ach.current, total: ach.total } : item.gameTracker?.achievements,
            completionist100: ach ? ach.completionist100 : item.gameTracker?.completionist100,
            allAchievementsCompleted: ach ? (ach.completionist100 || (ach.total > 0 && ach.current >= ach.total)) : item.gameTracker?.allAchievementsCompleted,
          },
          metacritic: item.metacritic || getMediaMetacriticScore(item) || undefined,
          updatedAt: new Date().toISOString(),
        };
      });

      // 3. Neue Spiele hinzufügen (gelöschte überspringen)
      const matchedIdSet = new Set(matchedIds);
      const existingTitles = new Set(media.map((m) => normalizeTitle(m.title)));
      let skippedDeletedCount = 0;

      const newGamesToAdd = fetchedGames.filter((gg) => {
        if (matchedIdSet.has(String(gg.id))) return false;
        if (existingTitles.has(normalizeTitle(gg.title))) return false;

        if (isGameDeleted(gg.id, gg.title)) {
          skippedDeletedCount++;
          return false;
        }
        return true;
      });

      const newItems: MediaItem[] = newGamesToAdd.map((gg) => {
        const itemMeta: any = {
          title: gg.title,
          type: 'game',
          external_id: gg.id,
          gameConnection: {
            service: 'gog',
            serviceId: String(gg.gameId),
          },
        };
        const score = getMediaMetacriticScore(itemMeta) || undefined;
        return {
          id: `media-gog-${gg.gameId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: gg.title,
          type: 'game',
          status: gg.achievements?.completionist100 ? 'completed' : gg.playtimeHours > 0 ? 'in_progress' : 'planned',
          isOwned: true,
          coverUrl: gg.coverUrl || '',
          bannerUrl: gg.bannerUrl,
          external_id: gg.id,
          connectedService: 'gog',
          gameConnection: {
            service: 'gog',
            serviceId: String(gg.gameId),
            serviceName: 'GOG Galaxy',
            accountUsername: effectiveUsername,
            playtimeMinutes: gg.playtimeMinutes,
            lastPlayed: gg.lastPlayed,
          },
          publisher: 'GOG.com',
          progress: { current: gg.playtimeHours, unit: 'hours' },
          gameTracker: {
            playtimeHours: gg.playtimeHours,
            storyCompleted: gg.achievements?.completionist100 || false,
            completionist100: gg.achievements?.completionist100 || false,
            allAchievementsCompleted: gg.achievements ? (gg.achievements.completionist100 || (gg.achievements.total > 0 && gg.achievements.current >= gg.achievements.total)) : false,
            achievements: gg.achievements ? { current: gg.achievements.current, total: gg.achievements.total } : undefined,
          },
          metacritic: score,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });

      const finalMedia = [...newItems, ...updatedMedia];
      onApplySync(finalMedia, sequels);

      const parts = [];
      if (updatedCount > 0) parts.push(`${updatedCount} bestehende aktualisiert`);
      if (newItems.length > 0) parts.push(`${newItems.length} neue hinzugefügt`);
      if (skippedDeletedCount > 0) parts.push(`${skippedDeletedCount} gelöschte übersprungen`);
      if (parts.length === 0) parts.push('Bereits auf dem neuesten Stand');

      const msg = `GOG synchronisiert: ${parts.join(', ')}.`;
      setFeedback({ type: 'success', message: msg });
      addToast('success', 'GOG synchronisiert', msg);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Verbindung zu GOG Galaxy fehlgeschlagen.' });
    } finally {
      setIsGogLoading(false);
      setIsGogSyncing(false);
    }
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
              <h3 className="font-bold text-[#F1F3F7] text-sm sm:text-base">Geräte-Sync &amp; Accounts</h3>
              <p className="text-[10px] sm:text-[11px] text-zinc-400">Cloud-Backup &amp; Spiele-Accounts (Steam, PSN, GOG)</p>
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
        <div className="flex border-b border-[#282D37] bg-[#0F1117]/40 px-3 sm:px-4 pt-2 gap-2 overflow-x-auto shrink-0">
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
            onClick={() => setActiveTab('gaming')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap',
              activeTab === 'gaming'
                ? 'border-blue-500 text-blue-300 bg-[#181B22]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Gamepad2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Gaming-Accounts</span>
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
                  Nutze diesen Code auf all deinen Geräten, um deine Mediensammlung &amp; verknüpfte Gaming-Konten per Knopfdruck abzugleichen.
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
                  <span className="text-[10px] font-normal text-emerald-200">
                    Sammlung &amp; Accounts sichern
                  </span>
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

          {activeTab === 'gaming' && (
            /* ================= TAB 2: GAMING ACCOUNTS (STEAM / PSN / GOG) ================= */
            <div className="space-y-4">
              {/* Gaming Sub-Navigation */}
              <div className="flex rounded-xl bg-[#0F1117] p-1 border border-[#282D37]">
                <button
                  onClick={() => { setGamingSubTab('steam'); setFeedback(null); }}
                  className={cn(
                    'flex-1 py-1.5 text-xs font-bold rounded-lg transition-all text-center',
                    gamingSubTab === 'steam' ? 'bg-blue-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
                  )}
                >
                  Steam
                </button>
                <button
                  onClick={() => { setGamingSubTab('psn'); setFeedback(null); }}
                  className={cn(
                    'flex-1 py-1.5 text-xs font-bold rounded-lg transition-all text-center flex items-center justify-center gap-1.5',
                    gamingSubTab === 'psn' ? 'bg-blue-700 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
                  )}
                >
                  <span>PlayStation (PSN)</span>
                  {isPsnExpired && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="Token erneuern erforderlich" />
                  )}
                </button>
                <button
                  onClick={() => { setGamingSubTab('gog'); setFeedback(null); }}
                  className={cn(
                    'flex-1 py-1.5 text-xs font-bold rounded-lg transition-all text-center',
                    gamingSubTab === 'gog' ? 'bg-purple-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
                  )}
                >
                  GOG Galaxy
                </button>
              </div>

              {/* === SUBTAB 1: STEAM === */}
              {gamingSubTab === 'steam' && (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-[#0F1117] border border-[#282D37] space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                        <Gamepad2 className="w-4 h-4 text-blue-400" />
                        <span>Steam-Konto anbinden</span>
                      </h4>
                    </div>

                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-zinc-300 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-blue-300">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>Intelligente Synchronisation</span>
                      </div>
                      <p className="text-zinc-400 leading-relaxed">
                        Bestehende Spiele werden an Ort und Stelle aktualisiert (Spielzeit &amp; Achievements). Neue Titel werden hinzugefügt. Bereits aus OmniTrack gelöschte Spiele werden nicht erneut importiert. Keine Duplikate.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-zinc-300">Steam-ID oder Profil-Link</label>
                      <input
                        type="text"
                        value={steamInput}
                        onChange={(e) => setSteamInput(e.target.value)}
                        placeholder="z. B. 76561198... oder https://steamcommunity.com/id/name"
                        className="w-full bg-[#181B22] border border-[#282D37] focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-[#F1F3F7] focus:outline-none"
                      />
                    </div>

                    {/* Filter Option */}
                    <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer pt-0.5">
                      <input
                        type="checkbox"
                        checked={steamOnlyPlayed}
                        onChange={(e) => setSteamOnlyPlayed(e.target.checked)}
                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-blue-500 cursor-pointer accent-blue-500"
                      />
                      <span>Nur gespielte Titel importieren (Spielzeit &gt; 0 Std.)</span>
                    </label>

                    <button
                      onClick={() => handleSyncSteam(steamOnlyPlayed)}
                      disabled={isSteamLoading || isSteamSyncing}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all active:scale-95 disabled:opacity-50 shadow-md"
                    >
                      <RefreshCw className={cn('w-3.5 h-3.5', (isSteamLoading || isSteamSyncing) && 'animate-spin')} />
                      <span>{isSteamLoading || isSteamSyncing ? 'Synchronisiere mit Steam...' : 'Steam-Spiele synchronisieren'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* === SUBTAB 2: PLAYSTATION NETWORK (PSN) === */}
              {gamingSubTab === 'psn' && (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-[#0F1117] border border-[#282D37] space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                        <Gamepad2 className="w-4 h-4 text-blue-400" />
                        <span>PlayStation Network (PSN)</span>
                      </h4>
                      <a
                        href="https://ca.account.sony.com/api/v1/ssocookie"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <span>NPSSO Token holen</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-zinc-300 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-blue-300">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>Intelligente Synchronisation</span>
                      </div>
                      <p className="text-zinc-400 leading-relaxed">
                        Liest PS5- &amp; PS4-Spiele, Spielzeiten und Trophäen aus. Bestehende Titel werden aktualisiert, gelöschte Spiele bleiben gelöscht.
                      </p>
                    </div>

                    {isPsnExpired && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-2 animate-fadeIn">
                        <div className="flex items-center gap-1.5 font-bold text-amber-300">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>PlayStation NPSSO-Token erneuern</span>
                        </div>
                        <p className="text-[11px] text-zinc-300 leading-relaxed">
                          Dein PlayStation-Token ist abgelaufen oder ungültig. Deine bisherigen PlayStation-Spiele bleiben sicher in deiner Liste gespeichert. Um neue Spiele oder Trophäen abzugleichen, trage bitte ein frisches Cookie von Sony ein.
                        </p>
                        <a
                          href="https://ca.account.sony.com/api/v1/ssocookie"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-semibold border border-amber-500/40 transition-colors"
                        >
                          <span>Neuen Token bei Sony generieren</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-zinc-300">PlayStation NPSSO-Token (64 Zeichen)</label>
                      <input
                        type="password"
                        value={psnNpsso}
                        onChange={(e) => setPsnNpsso(e.target.value)}
                        placeholder="Melde dich auf store.playstation.com an &amp; kopiere ssocookie"
                        className="w-full bg-[#181B22] border border-[#282D37] focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-[#F1F3F7] font-mono focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={handleSyncPsn}
                      disabled={isPsnLoading || isPsnSyncing}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs transition-all active:scale-95 disabled:opacity-50 shadow-md"
                    >
                      <RefreshCw className={cn('w-3.5 h-3.5', (isPsnLoading || isPsnSyncing) && 'animate-spin')} />
                      <span>{isPsnLoading || isPsnSyncing ? 'Synchronisiere mit PlayStation...' : 'PlayStation-Spiele synchronisieren'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* === SUBTAB 3: GOG GALAXY === */}
              {gamingSubTab === 'gog' && (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-[#0F1117] border border-[#282D37] space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                        <Gamepad2 className="w-4 h-4 text-purple-400" />
                        <span>GOG Galaxy anbinden</span>
                      </h4>
                      <a
                        href="https://auth.gog.com/auth?client_id=46899977096215655&redirect_uri=https://embed.gog.com/on_login_success?origin=client&response_type=code&layout=client2"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-purple-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <span>Login-Code holen</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-zinc-300 space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-purple-300">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>Offizieller GOG-Abgleich (Spiele, Spielzeiten & Erfolge)</span>
                      </div>
                      <p className="text-zinc-400 leading-relaxed text-[11px]">
                        Da GOG unauthentifizierte Profil-Abfragen blockiert, nutze bitte den offiziellen Login-Code:
                      </p>
                      <ol className="list-decimal list-inside text-zinc-300 text-[11px] space-y-0.5">
                        <li>Klicke oben rechts auf <strong>"Login-Code holen"</strong> (GOG im Browser eingeloggt lassen).</li>
                        <li>Kopiere die URL aus der Browser-Adresszeile (oder den Teil <code>code=...</code>).</li>
                        <li>Füge die URL oder den Code unten ein und klicke auf Synchronisieren.</li>
                      </ol>
                    </div>

                    {isGogExpired && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-2 animate-fadeIn">
                        <div className="flex items-center gap-1.5 font-bold text-amber-300">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>GOG-Sitzung erneuern</span>
                        </div>
                        <p className="text-[11px] text-zinc-300 leading-relaxed">
                          Dein GOG-Code oder Token ist abgelaufen. Deine bisherigen Spiele bleiben erhalten. Hole dir bitte über den Link oben einen frischen Code.
                        </p>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-zinc-300">GOG Login-Code oder Rückruf-URL</label>
                      <input
                        type="password"
                        value={gogCode}
                        onChange={(e) => setGogCode(e.target.value)}
                        placeholder="Kopiere die URL oder den Code hier hinein..."
                        className="w-full bg-[#181B22] border border-[#282D37] focus:border-purple-500 rounded-xl px-3.5 py-2 text-xs text-[#F1F3F7] font-mono focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-zinc-400 flex items-center justify-between">
                        <span>GOG-Benutzername</span>
                        <span className="text-[10px] text-zinc-500">Wird beim Sync automatisch ermittelt</span>
                      </label>
                      <input
                        type="text"
                        value={gogUsername}
                        onChange={(e) => setGogUsername(e.target.value)}
                        placeholder="z. B. dein GOG-Profilname"
                        className="w-full bg-[#181B22] border border-[#282D37] focus:border-purple-500 rounded-xl px-3.5 py-2 text-xs text-[#F1F3F7] focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={handleSyncGog}
                      disabled={isGogLoading || isGogSyncing}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all active:scale-95 disabled:opacity-50 shadow-md"
                    >
                      <RefreshCw className={cn('w-3.5 h-3.5', (isGogLoading || isGogSyncing) && 'animate-spin')} />
                      <span>{isGogLoading || isGogSyncing ? 'Synchronisiere mit GOG...' : 'GOG-Spiele synchronisieren'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Settings: Background Auto-Sync & Deleted Games Ignore List */}
              <div className="p-3.5 rounded-2xl bg-[#0F1117] border border-[#282D37] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-zinc-200 block">Automatischer Sync beim App-Start</span>
                    <span className="text-[11px] text-zinc-400 block">
                      Prüft beim Öffnen von OmniTrack im Hintergrund, ob neue Spielzeiten oder Spiele auf Steam dazugekommen sind.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoSyncEnabledState}
                    onChange={(e) => {
                      setAutoSyncEnabledState(e.target.checked);
                      setAutoSyncEnabled(e.target.checked);
                    }}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer accent-emerald-500 ml-3"
                  />
                </div>

                {deletedGamesCount > 0 && (
                  <div className="flex items-center justify-between pt-2.5 border-t border-[#282D37] text-xs">
                    <span className="text-zinc-400 text-[11px]">
                      {deletedGamesCount} gelöschte Spiele werden beim Synchronisieren übersprungen.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        clearDeletedGameKeys();
                        setDeletedGamesCount(0);
                        addToast('info', 'Ignorierliste geleert', 'Gelöschte Spiele können jetzt wieder synchronisiert werden.');
                      }}
                      className="text-purple-400 hover:text-purple-300 font-semibold underline text-[11px]"
                    >
                      Ignorierliste zurücksetzen
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'file' && (
            /* ================= TAB 3: LOCAL FILE BACKUP ================= */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#0F1117] border border-[#282D37] space-y-2">
                <h4 className="text-xs font-bold text-zinc-300">Offline JSON-Backup</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Lade deine komplette Mediensammlung ({media.length} Einträge) und verknüpfte Konten als lesbare JSON-Datei herunter oder stelle ein früheres Backup wieder her.
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
