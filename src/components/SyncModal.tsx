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

// Integration LocalStorage Keys
const STORAGE_STEAM_INPUT_KEY = 'omnilist_steam_input_v1';
const STORAGE_PSN_NPSSO_KEY = 'omnilist_psn_npsso_v1';
const STORAGE_GOG_USER_KEY = 'omnilist_gog_username_v1';

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
}) => {
  const [activeTab, setActiveTab] = useState<'cloud' | 'gaming' | 'file'>('cloud');
  const [gamingSubTab, setGamingSubTab] = useState<'steam' | 'psn' | 'gog'>('steam');

  const [syncCode, setSyncCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Steam State
  const [steamInput, setSteamInput] = useState('');
  const [steamProfile, setSteamProfile] = useState<{ steamId: string; personaname: string; avatar?: string } | null>(null);
  const [steamGames, setSteamGames] = useState<SteamGameItem[]>([]);
  const [isSteamLoading, setIsSteamLoading] = useState(false);
  const [isSteamSyncing, setIsSteamSyncing] = useState(false);

  // PSN State
  const [psnNpsso, setPsnNpsso] = useState('');
  const [isPsnExpired, setIsPsnExpired] = useState(false);
  const [psnGames, setPsnGames] = useState<PsnGameItem[]>([]);
  const [isPsnLoading, setIsPsnLoading] = useState(false);
  const [isPsnSyncing, setIsPsnSyncing] = useState(false);

  // GOG State
  const [gogUsername, setGogUsername] = useState('');
  const [gogGames, setGogGames] = useState<GogGameItem[]>([]);
  const [isGogLoading, setIsGogLoading] = useState(false);
  const [isGogSyncing, setIsGogSyncing] = useState(false);
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
        gog: { username: gogUsername.trim() },
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

  // ================= STEAM HANDLERS =================
  const handleFetchSteam = async () => {
    if (!steamInput.trim()) {
      setFeedback({ type: 'error', message: 'Bitte gib deinen Steam-Profil-Link oder deine Steam-ID ein.' });
      return;
    }

    setIsSteamLoading(true);
    setFeedback(null);
    localStorage.setItem(STORAGE_STEAM_INPUT_KEY, steamInput.trim());

    try {
      const profRes = await fetch('/api/sync/steam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-profile', steamInput: steamInput.trim() }),
      });
      if (profRes.ok) setSteamProfile(await profRes.json());

      const gamesRes = await fetch('/api/sync/steam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-games', steamInput: steamInput.trim() }),
      });
      const gamesData = await gamesRes.json();
      if (!gamesRes.ok) {
        const fullMsg = gamesData.hint ? `${gamesData.error} ${gamesData.hint}` : (gamesData.error || 'Fehler beim Abrufen der Steam-Spiele');
        throw new Error(fullMsg);
      }

      setSteamGames(gamesData.games || []);
      setFeedback({ type: 'success', message: `${gamesData.games?.length || 0} Steam-Spiele geladen!` });
      addToast('success', 'Steam geladen', `${gamesData.games?.length || 0} Spiele gefunden`);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Verbindung zu Steam fehlgeschlagen.' });
    } finally {
      setIsSteamLoading(false);
    }
  };

  const handleSyncSteamExisting = async () => {
    if (steamGames.length === 0) return;
    setIsSteamSyncing(true);
    try {
      const existingGames = media.filter((m) => m.type === 'game');
      const matches = existingGames
        .map((item) => ({
          item,
          match: steamGames.find((sg) => item.external_id === `steam:${sg.appid}` || normalizeTitle(sg.name) === normalizeTitle(item.title)),
        }))
        .filter((m): m is { item: MediaItem; match: SteamGameItem } => Boolean(m.match));

      if (matches.length === 0) {
        setFeedback({ type: 'info', message: 'Keine übereinstimmenden Steam-Spiele in deiner OmniList gefunden.' });
        return;
      }

      const achRes = await fetch('/api/sync/steam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-achievements',
          steamInput: steamInput.trim(),
          appIds: matches.map((m) => m.match.appid),
        }),
      });
      const achData = achRes.ok ? await achRes.json() : { achievements: {} };
      const achMap = achData.achievements || {};

      const updatedMedia = media.map((item) => {
        const found = matches.find((m) => m.item.id === item.id);
        if (!found) return item;
        const ach = achMap[found.match.appid];
        return {
          ...item,
          external_id: item.external_id?.startsWith('steam:') ? item.external_id : `steam:${found.match.appid}`,
          progress: { ...item.progress, current: found.match.playtimeHours, unit: 'hours' as const },
          gameTracker: {
            ...(item.gameTracker || {}),
            playtimeHours: found.match.playtimeHours,
            achievements: ach ? { current: ach.current, total: ach.total } : item.gameTracker?.achievements,
            completionist100: ach ? ach.completionist100 : item.gameTracker?.completionist100,
          },
          updatedAt: new Date().toISOString(),
        };
      });

      onApplySync(updatedMedia, sequels);
      setFeedback({ type: 'success', message: `${matches.length} Spiele mit Steam-Spielzeiten & Achievements aktualisiert!` });
      addToast('success', 'Steam-Sync fertig', `${matches.length} Spiele aktualisiert`);
    } catch {
      setFeedback({ type: 'error', message: 'Fehler beim Steam-Sync.' });
    } finally {
      setIsSteamSyncing(false);
    }
  };

  const handleImportSteamGames = (onlyPlayed = true) => {
    const existingIds = new Set(media.map((m) => m.external_id));
    const existingTitles = new Set(media.map((m) => normalizeTitle(m.title)));

    const toImport = steamGames.filter(
      (sg) => (onlyPlayed ? sg.playtimeMinutes > 0 : true) &&
              !existingIds.has(`steam:${sg.appid}`) &&
              !existingTitles.has(normalizeTitle(sg.name))
    );

    if (toImport.length === 0) {
      setFeedback({
        type: 'info',
        message: onlyPlayed
          ? 'Alle gespielten Steam-Spiele sind bereits in deiner OmniList vorhanden.'
          : 'Alle Steam-Spiele deiner Bibliothek sind bereits vorhanden.',
      });
      return;
    }

    const newItems: MediaItem[] = toImport.map((sg) => ({
      id: `media-steam-${sg.appid}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: sg.name,
      type: 'game',
      status: sg.playtimeHours > 0 ? 'in_progress' : 'planned',
      isOwned: true,
      coverUrl: sg.coverUrl,
      bannerUrl: sg.headerUrl,
      external_id: `steam:${sg.appid}`,
      publisher: 'Steam',
      progress: { current: sg.playtimeHours, unit: 'hours' },
      gameTracker: { playtimeHours: sg.playtimeHours, storyCompleted: false, completionist100: false },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    onApplySync([...newItems, ...media], sequels);
    setFeedback({ type: 'success', message: `${newItems.length} Steam-Spiele zu deiner OmniList hinzugefügt!` });
    addToast('success', 'Spiele importiert', `${newItems.length} Steam-Titel in OmniList sichtbar`);
  };

  // ================= PLAYSTATION (PSN) HANDLERS =================
  const handleFetchPsn = async () => {
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
      setPsnGames(data.games || []);
      setFeedback({ type: 'success', message: `${data.games?.length || 0} PlayStation-Titel & Trophäen geladen!` });
      addToast('success', 'PSN verbunden', `${data.games?.length || 0} Titel gefunden`);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Verbindung zu PlayStation Network fehlgeschlagen.' });
    } finally {
      setIsPsnLoading(false);
    }
  };

  const handleSyncPsnExisting = () => {
    if (psnGames.length === 0) return;
    setIsPsnSyncing(true);

    const matches = media
      .filter((m) => m.type === 'game')
      .map((item) => ({
        item,
        match: psnGames.find((pg) => item.external_id === pg.id || normalizeTitle(pg.name) === normalizeTitle(item.title)),
      }))
      .filter((m): m is { item: MediaItem; match: PsnGameItem } => Boolean(m.match));

    if (matches.length === 0) {
      setFeedback({ type: 'info', message: 'Keine übereinstimmenden PlayStation-Spiele in deiner Liste gefunden.' });
      setIsPsnSyncing(false);
      return;
    }

    const updatedMedia = media.map((item) => {
      const found = matches.find((m) => m.item.id === item.id);
      if (!found) return item;
      const t = found.match.trophies;
      return {
        ...item,
        external_id: item.external_id?.startsWith('psn:') ? item.external_id : found.match.id,
        progress: {
          ...item.progress,
          current: found.match.playtimeHours > 0 ? found.match.playtimeHours : item.progress.current,
          unit: 'hours' as const,
        },
        gameTracker: {
          ...(item.gameTracker || {}),
          playtimeHours: found.match.playtimeHours > 0 ? found.match.playtimeHours : item.gameTracker?.playtimeHours,
          achievements: t.total > 0 ? { current: t.current, total: t.total } : item.gameTracker?.achievements,
          completionist100: t.completionist100,
        },
        updatedAt: new Date().toISOString(),
      };
    });

    onApplySync(updatedMedia, sequels);
    setIsPsnSyncing(false);
    setFeedback({ type: 'success', message: `${matches.length} Spiele mit PSN-Spielzeiten & Trophäen aktualisiert!` });
    addToast('success', 'PSN-Sync fertig', `${matches.length} Titel aktualisiert`);
  };

  const handleImportPsnGames = () => {
    const existingIds = new Set(media.map((m) => m.external_id));
    const existingTitles = new Set(media.map((m) => normalizeTitle(m.title)));

    const toImport = psnGames.filter(
      (pg) => !existingIds.has(pg.id) && !existingTitles.has(normalizeTitle(pg.name))
    );

    if (toImport.length === 0) {
      setFeedback({ type: 'info', message: 'Alle PlayStation-Spiele sind bereits in deiner Liste vorhanden.' });
      return;
    }

    const newItems: MediaItem[] = toImport.map((pg) => ({
      id: `media-psn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: pg.name,
      type: 'game',
      status: pg.trophies.completionist100 ? 'completed' : pg.playtimeHours > 0 ? 'in_progress' : 'planned',
      isOwned: true,
      coverUrl: pg.coverUrl || '',
      external_id: pg.id,
      publisher: `PlayStation (${pg.platform || 'PS5'})`,
      progress: { current: pg.playtimeHours, unit: 'hours' },
      gameTracker: {
        playtimeHours: pg.playtimeHours,
        storyCompleted: pg.trophies.completionist100,
        completionist100: pg.trophies.completionist100,
        achievements: pg.trophies.total > 0 ? { current: pg.trophies.current, total: pg.trophies.total } : undefined,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    onApplySync([...newItems, ...media], sequels);
    setFeedback({ type: 'success', message: `${newItems.length} PlayStation-Spiele zu deiner OmniList hinzugefügt!` });
    addToast('success', 'Spiele importiert', `${newItems.length} PlayStation-Titel in OmniList sichtbar`);
  };

  // ================= GOG HANDLERS =================
  const handleFetchGog = async () => {
    if (!gogUsername.trim()) {
      setFeedback({ type: 'error', message: 'Bitte gib deinen GOG-Benutzernamen ein.' });
      return;
    }

    setIsGogLoading(true);
    setFeedback(null);
    localStorage.setItem(STORAGE_GOG_USER_KEY, gogUsername.trim());

    try {
      const res = await fetch('/api/sync/gog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: gogUsername.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler beim Abrufen der GOG-Spiele');

      setGogGames(data.games || []);
      setFeedback({ type: 'success', message: `${data.games?.length || 0} GOG-Spiele geladen!` });
      addToast('success', 'GOG geladen', `${data.games?.length || 0} Spiele gefunden`);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Verbindung zu GOG fehlgeschlagen.' });
    } finally {
      setIsGogLoading(false);
    }
  };

  const handleSyncGogExisting = () => {
    if (gogGames.length === 0) return;
    setIsGogSyncing(true);

    const matches = media
      .filter((m) => m.type === 'game')
      .map((item) => ({
        item,
        match: gogGames.find((gg) => item.external_id === gg.id || normalizeTitle(gg.title) === normalizeTitle(item.title)),
      }))
      .filter((m): m is { item: MediaItem; match: GogGameItem } => Boolean(m.match));

    if (matches.length === 0) {
      setFeedback({ type: 'info', message: 'Keine übereinstimmenden GOG-Spiele in deiner Liste gefunden.' });
      setIsGogSyncing(false);
      return;
    }

    const updatedMedia = media.map((item) => {
      const found = matches.find((m) => m.item.id === item.id);
      if (!found) return item;
      const ach = found.match.achievements;
      return {
        ...item,
        external_id: item.external_id?.startsWith('gog:') ? item.external_id : found.match.id,
        progress: {
          ...item.progress,
          current: found.match.playtimeHours > 0 ? found.match.playtimeHours : item.progress.current,
          unit: 'hours' as const,
        },
        gameTracker: {
          ...(item.gameTracker || {}),
          playtimeHours: found.match.playtimeHours > 0 ? found.match.playtimeHours : item.gameTracker?.playtimeHours,
          achievements: ach ? { current: ach.current, total: ach.total } : item.gameTracker?.achievements,
          completionist100: ach ? ach.completionist100 : item.gameTracker?.completionist100,
        },
        updatedAt: new Date().toISOString(),
      };
    });

    onApplySync(updatedMedia, sequels);
    setIsGogSyncing(false);
    setFeedback({ type: 'success', message: `${matches.length} Spiele mit GOG-Spielzeiten & Achievements aktualisiert!` });
    addToast('success', 'GOG-Sync fertig', `${matches.length} Spiele aktualisiert`);
  };

  const handleImportGogGames = () => {
    const existingIds = new Set(media.map((m) => m.external_id));
    const existingTitles = new Set(media.map((m) => normalizeTitle(m.title)));

    const toImport = gogGames.filter(
      (gg) => !existingIds.has(gg.id) && !existingTitles.has(normalizeTitle(gg.title))
    );

    if (toImport.length === 0) {
      setFeedback({ type: 'info', message: 'Alle GOG-Spiele sind bereits in deiner Liste vorhanden.' });
      return;
    }

    const newItems: MediaItem[] = toImport.map((gg) => ({
      id: `media-gog-${gg.gameId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: gg.title,
      type: 'game',
      status: gg.playtimeHours > 0 ? 'in_progress' : 'planned',
      isOwned: true,
      coverUrl: gg.coverUrl || '',
      bannerUrl: gg.bannerUrl,
      external_id: gg.id,
      publisher: 'GOG.com',
      progress: { current: gg.playtimeHours, unit: 'hours' },
      gameTracker: {
        playtimeHours: gg.playtimeHours,
        storyCompleted: false,
        completionist100: gg.achievements?.completionist100 || false,
        achievements: gg.achievements ? { current: gg.achievements.current, total: gg.achievements.total } : undefined,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    onApplySync([...newItems, ...media], sequels);
    setFeedback({ type: 'success', message: `${newItems.length} GOG-Spiele zu deiner OmniList hinzugefügt!` });
    addToast('success', 'Spiele importiert', `${newItems.length} GOG-Titel in OmniList sichtbar`);
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

                    <button
                      onClick={handleFetchSteam}
                      disabled={isSteamLoading}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all active:scale-95 disabled:opacity-50"
                    >
                      <RefreshCw className={cn('w-3.5 h-3.5', isSteamLoading && 'animate-spin')} />
                      <span>{isSteamLoading ? 'Verbinde mit Steam...' : 'Steam-Spiele laden'}</span>
                    </button>
                  </div>

                  {steamGames.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-[#0F1117] border border-blue-500/30 space-y-2.5 animate-fadeIn">
                      <div className="text-[11px] font-bold text-zinc-300">
                        {steamGames.length} Steam-Spiele geladen
                      </div>
                      <div className="space-y-2">
                        <button
                          onClick={() => handleImportSteamGames(false)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                        >
                          <Download className="w-4 h-4" />
                          <span>Alle Steam-Spiele übernehmen ({steamGames.length} Titel inkl. Backlog)</span>
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={handleSyncSteamExisting}
                            disabled={isSteamSyncing}
                            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-40"
                          >
                            <Trophy className={cn('w-3.5 h-3.5', isSteamSyncing && 'animate-spin')} />
                            <span>Bestehende abgleichen</span>
                          </button>
                          <button
                            onClick={() => handleImportSteamGames(true)}
                            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-[#181B22] hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-[#282D37] transition-all"
                          >
                            <span>Nur Gespielte (&gt;0 Std.)</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
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

                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Liest automatisch deine PlayStation-Spiele (PS5/PS4), Spielzeiten und Trophäen (Bronze, Silber, Gold, Platin) aus.
                    </p>

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
                      onClick={handleFetchPsn}
                      disabled={isPsnLoading}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs transition-all active:scale-95 disabled:opacity-50"
                    >
                      <RefreshCw className={cn('w-3.5 h-3.5', isPsnLoading && 'animate-spin')} />
                      <span>{isPsnLoading ? 'Verbinde mit PSN...' : 'PlayStation-Spiele & Trophäen laden'}</span>
                    </button>
                  </div>

                  {psnGames.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-[#0F1117] border border-blue-500/30 space-y-2.5 animate-fadeIn">
                      <div className="text-[11px] font-bold text-zinc-300">
                        {psnGames.length} PlayStation-Titel geladen
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={handleSyncPsnExisting}
                          disabled={isPsnSyncing}
                          className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-40"
                        >
                          <Trophy className={cn('w-3.5 h-3.5', isPsnSyncing && 'animate-spin')} />
                          <span>Bestehende abgleichen</span>
                        </button>
                        <button
                          onClick={handleImportPsnGames}
                          className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>In OmniList anzeigen ({psnGames.length})</span>
                        </button>
                      </div>
                    </div>
                  )}
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
                        href="https://www.gog.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-purple-400 hover:underline flex items-center gap-1"
                      >
                        <span>GOG.com</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Synchronisiere deine GOG-Spiele, Spielzeiten und Galaxy-Achievements über deinen GOG-Benutzername.
                    </p>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-zinc-300">GOG-Benutzername (für öffentliche Profile)</label>
                      <input
                        type="text"
                        value={gogUsername}
                        onChange={(e) => setGogUsername(e.target.value)}
                        placeholder="z. B. dein GOG-Profilname"
                        className="w-full bg-[#181B22] border border-[#282D37] focus:border-purple-500 rounded-xl px-3.5 py-2 text-xs text-[#F1F3F7] focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={handleFetchGog}
                      disabled={isGogLoading}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all active:scale-95 disabled:opacity-50"
                    >
                      <RefreshCw className={cn('w-3.5 h-3.5', isGogLoading && 'animate-spin')} />
                      <span>{isGogLoading ? 'Verbinde mit GOG...' : 'GOG-Spiele laden'}</span>
                    </button>
                  </div>

                  {gogGames.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-[#0F1117] border border-purple-500/30 space-y-2.5 animate-fadeIn">
                      <div className="text-[11px] font-bold text-zinc-300">
                        {gogGames.length} GOG-Spiele geladen
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={handleSyncGogExisting}
                          disabled={isGogSyncing}
                          className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-40"
                        >
                          <Trophy className={cn('w-3.5 h-3.5', isGogSyncing && 'animate-spin')} />
                          <span>Bestehende abgleichen</span>
                        </button>
                        <button
                          onClick={handleImportGogGames}
                          className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>In OmniList anzeigen ({gogGames.length})</span>
                        </button>
                      </div>
                    </div>
                  )}
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
