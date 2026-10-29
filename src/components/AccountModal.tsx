'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  LogIn,
  UserPlus,
  LogOut,
  Cloud,
  Download,
  Upload,
  RefreshCw,
  Check,
  Gamepad2,
  ExternalLink,
  Trophy,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Key,
} from 'lucide-react';
import { MediaItem, SequelNotification } from '@/types/media';
import { AuthSession, UserPublicInfo } from '@/types/account';
import { cn } from '@/lib/utils';
import {
  getStoredAuthSession,
  loginAccount,
  registerAccount,
  clearAuthSession,
  syncPushToAccount,
  syncPullFromAccount,
  readCurrentLauncherIntegrations,
  applyLauncherIntegrations,
} from '@/lib/auth';
import { isGameDeleted } from '@/lib/storage';
import { getMediaMetacriticScore } from '@/lib/metacritic';
import { isSequelInLibrary, isSequelDismissed } from '@/lib/sequels';
import { getKnownGamePresets } from '@/lib/game-presets';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: MediaItem[];
  sequels: SequelNotification[];
  onApplySync: (media: MediaItem[], sequels?: SequelNotification[]) => void;
  addToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  initialTab?: 'account' | 'gaming' | 'backup';
  initialGamingSubTab?: 'steam' | 'psn' | 'gog';
  authSession: AuthSession | null;
  onAuthChange: (session: AuthSession | null) => void;
  isCloudSyncing?: boolean;
}

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
  lastPlayed?: string;
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

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  media,
  sequels,
  onApplySync,
  addToast,
  initialTab = 'account',
  initialGamingSubTab = 'steam',
  authSession,
  onAuthChange,
  isCloudSyncing = false,
}) => {
  const [activeTab, setActiveTab] = useState<'account' | 'gaming' | 'backup'>(initialTab);
  const [gamingSubTab, setGamingSubTab] = useState<'steam' | 'psn' | 'gog'>(initialGamingSubTab);

  // Auth form states
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Steam states
  const [steamInput, setSteamInput] = useState('');
  const [isSteamLoading, setIsSteamLoading] = useState(false);
  const [steamProfile, setSteamProfile] = useState<any>(null);
  const [steamGames, setSteamGames] = useState<SteamGameItem[]>([]);
  const [importUnplayedSteam, setImportUnplayedSteam] = useState(false);

  // PSN states
  const [psnNpsso, setPsnNpsso] = useState('');
  const [isPsnLoading, setIsPsnLoading] = useState(false);
  const [psnConnected, setPsnConnected] = useState(false);
  const [psnGames, setPsnGames] = useState<PsnGameItem[]>([]);
  const [importUnplayedPsn, setImportUnplayedPsn] = useState(false);

  // GOG states
  const [gogUsername, setGogUsername] = useState('');
  const [gogCode, setGogCode] = useState('');
  const [isGogLoading, setIsGogLoading] = useState(false);
  const [gogConnected, setGogConnected] = useState(false);
  const [gogGames, setGogGames] = useState<GogGameItem[]>([]);
  const [importUnplayedGog, setImportUnplayedGog] = useState(false);

  // Legacy sync code migration
  const [legacyCodeInput, setLegacyCodeInput] = useState('');
  const [isMigratingCode, setIsMigratingCode] = useState(false);

  // Feedback banner
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setGamingSubTab(initialGamingSubTab);
      setFeedback(null);
      setAuthError(null);

      // Load launcher credentials from storage
      setSteamInput(localStorage.getItem(STORAGE_STEAM_INPUT_KEY) || '');
      const savedPsn = localStorage.getItem(STORAGE_PSN_NPSSO_KEY) || '';
      setPsnNpsso(savedPsn);
      if (savedPsn) setPsnConnected(true);

      const savedGogUser = localStorage.getItem(STORAGE_GOG_USER_KEY) || '';
      const savedGogToken = localStorage.getItem(STORAGE_GOG_TOKEN_KEY) || '';
      setGogUsername(savedGogUser);
      setGogCode(savedGogToken);
      if (savedGogUser || savedGogToken) setGogConnected(true);
    }
  }, [isOpen, initialTab, initialGamingSubTab]);

  if (!isOpen) return null;

  // ================= AUTH HANDLERS =================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim() || !passwordInput.trim()) {
      setAuthError('Bitte gib deinen Benutzernamen und dein Passwort ein.');
      return;
    }

    setIsAuthLoading(true);
    setAuthError(null);

    try {
      const res = await loginAccount(usernameInput, passwordInput);
      onAuthChange({
        user: res.user,
        token: res.token,
        lastSyncAt: res.data?.updatedAt,
      });

      // Apply cloud library if available
      if (res.data?.media && res.data.media.length > 0) {
        onApplySync(res.data.media, res.data.sequels);
      }

      // Restore launcher credentials from account
      if (res.data?.integrations) {
        if (res.data.integrations.steam?.steamInput) {
          setSteamInput(res.data.integrations.steam.steamInput);
        }
        if (res.data.integrations.psn?.npsso) {
          setPsnNpsso(res.data.integrations.psn.npsso);
          setPsnConnected(true);
        }
        if (res.data.integrations.gog?.username) {
          setGogUsername(res.data.integrations.gog.username);
          setGogConnected(true);
        }
      }

      addToast('success', 'Angemeldet', `Willkommen zurück, ${res.user.username}!`);
      setPasswordInput('');
    } catch (err: any) {
      setAuthError(err.message || 'Anmeldung fehlgeschlagen.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim() || !passwordInput.trim()) {
      setAuthError('Bitte gib deinen Wunschnamen und ein Passwort ein.');
      return;
    }

    setIsAuthLoading(true);
    setAuthError(null);

    try {
      const res = await registerAccount(usernameInput, passwordInput, {
        media,
        sequels,
      });

      onAuthChange({
        user: res.user,
        token: res.token,
        lastSyncAt: res.data?.updatedAt,
      });

      addToast('success', 'Account erstellt', `Account "${res.user.username}" ist aktiv und synchronisiert.`);
      setPasswordInput('');
    } catch (err: any) {
      setAuthError(err.message || 'Registrierung fehlgeschlagen.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    onAuthChange(null);
    addToast('info', 'Abgemeldet', 'Du bist nun abgemeldet. Lokale Änderungen werden nicht mehr synchronisiert.');
  };

  const handleManualAccountSync = async () => {
    if (!authSession) return;
    setIsAuthLoading(true);
    try {
      const res = await syncPushToAccount({
        media,
        sequels,
      });
      if (res?.updatedAt) {
        onAuthChange({
          ...authSession,
          lastSyncAt: res.updatedAt,
        });
      }
      addToast('success', 'Synchronisiert', 'Deine Mediensammlung wurde erfolgreich in deinem Account gesichert.');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Synchronisationsfehler.' });
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handlePullFromAccount = async () => {
    if (!authSession) return;
    setIsAuthLoading(true);
    try {
      const cloudData = await syncPullFromAccount();
      if (cloudData && cloudData.media) {
        onApplySync(cloudData.media, cloudData.sequels);
        onAuthChange({
          ...authSession,
          lastSyncAt: cloudData.updatedAt,
        });
        addToast('success', 'Aktualisiert', `${cloudData.media.length} Medien aus deinem Account geladen.`);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Ladefehler.' });
    } finally {
      setIsAuthLoading(false);
    }
  };

  // ================= STEAM SYNC =================
  const handleSyncSteam = async () => {
    const input = steamInput.trim();
    if (!input) {
      setFeedback({ type: 'error', message: 'Bitte gib deinen Steam-Profil-Link oder deine Steam-ID ein.' });
      return;
    }

    setIsSteamLoading(true);
    setFeedback(null);
    localStorage.setItem(STORAGE_STEAM_INPUT_KEY, input);

    try {
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
        throw new Error(gamesData.error || 'Fehler beim Abrufen der Steam-Spiele');
      }

      const fetchedGames: SteamGameItem[] = gamesData.games || [];
      setSteamGames(fetchedGames);

      if (fetchedGames.length === 0) {
        setFeedback({
          type: 'info',
          message: 'Keine Spiele im Steam-Profil gefunden. Bitte prüfe die Privatsphäre-Einstellungen auf Steam.',
        });
        return;
      }

      // Merge and update games
      let updatedCount = 0;
      const matchedAppIds = new Set<number>();
      const existingGames = media.filter((m) => m.type === 'game');

      const updatedMedia = media.map((item) => {
        if (item.type !== 'game') return item;
        const isSteamGame = item.connectedService === 'steam' || item.external_id?.startsWith('steam:');
        const isUnconnected = !item.connectedService && !item.gameConnection?.service && !item.external_id?.startsWith('psn:') && !item.external_id?.startsWith('gog:');

        let match: SteamGameItem | undefined = undefined;
        if (isSteamGame || isUnconnected) {
          match = fetchedGames.find(
            (sg) =>
              item.external_id === `steam:${sg.appid}` ||
              item.gameConnection?.serviceId === String(sg.appid) ||
              sg.name.toLowerCase() === item.title.toLowerCase()
          );
        }

        if (!match) return item;

        matchedAppIds.add(match.appid);
        updatedCount++;
        return {
          ...item,
          external_id: item.external_id?.startsWith('steam:') ? item.external_id : `steam:${match.appid}`,
          connectedService: 'steam' as const,
          gameConnection: {
            service: 'steam' as const,
            serviceId: String(match.appid),
            serviceName: 'Steam',
            lastPlayed: match.lastPlayed || item.gameConnection?.lastPlayed,
          },
          progress: {
            ...item.progress,
            current: match.playtimeHours,
            unit: 'hours' as const,
          },
          gameTracker: {
            ...(item.gameTracker || {}),
            playtimeHours: match.playtimeHours,
          },
          updatedAt: new Date().toISOString(),
        };
      });

      // Filter games to import
      const gamesToImport = importUnplayedSteam
        ? fetchedGames
        : fetchedGames.filter((g) => g.playtimeHours > 0);

      const newGames = gamesToImport.filter(
        (g) => !matchedAppIds.has(g.appid) && !isGameDeleted(`steam:${g.appid}`)
      );

      const newItems: MediaItem[] = newGames.map((sg) => {
        const itemMeta = {
          title: sg.name,
          type: 'game' as const,
          gameConnection: { service: 'steam' as const, serviceId: String(sg.appid) },
        };
        const score = getMediaMetacriticScore(itemMeta) || undefined;
        const preset = getKnownGamePresets(sg.name);

        return {
          id: `media-steam-${sg.appid}`,
          title: sg.name,
          type: 'game',
          status: sg.playtimeHours > 0 ? 'in_progress' : 'planned',
          isOwned: true,
          coverUrl: sg.coverUrl,
          external_id: `steam:${sg.appid}`,
          connectedService: 'steam',
          gameConnection: {
            service: 'steam',
            serviceId: String(sg.appid),
            serviceName: 'Steam',
            lastPlayed: sg.lastPlayed,
          },
          summary: preset.summary || undefined,
          genres: preset.genres || ['Videospiel', 'PC'],
          creator: preset.creator || 'Steam Store',
          publisher: 'Steam Store',
          progress: { current: sg.playtimeHours, unit: 'hours' },
          gameTracker: { playtimeHours: sg.playtimeHours },
          metacritic: score,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });

      const finalMedia = [...newItems, ...updatedMedia];
      const validSequels = sequels.filter((s) => !isSequelInLibrary(s, finalMedia) && !isSequelDismissed(s));

      onApplySync(finalMedia, validSequels);

      // Also persist to account in background
      if (authSession) {
        syncPushToAccount({ media: finalMedia, sequels: validSequels }).catch(() => {});
      }

      setFeedback({
        type: 'success',
        message: `Steam-Abgleich abgeschlossen: ${newItems.length} neue Spiele importiert, ${updatedCount} bestehende aktualisiert.`,
      });
      addToast('success', 'Steam synchronisiert', `${newItems.length} neu, ${updatedCount} aktualisiert`);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Fehler beim Steam-Abgleich.' });
    } finally {
      setIsSteamLoading(false);
    }
  };

  // ================= PSN SYNC =================
  const handleSyncPsn = async () => {
    const cleanNpsso = psnNpsso.trim();
    if (!cleanNpsso) {
      setFeedback({ type: 'error', message: 'Bitte gib deinen 64-stelligen PlayStation NPSSO-Token ein.' });
      return;
    }

    setIsPsnLoading(true);
    setFeedback(null);
    localStorage.setItem(STORAGE_PSN_NPSSO_KEY, cleanNpsso);

    try {
      const res = await fetch('/api/sync/psn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-games', npsso: cleanNpsso }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Fehler beim Abrufen der PlayStation-Daten');
      }

      const fetchedGames: PsnGameItem[] = data.games || [];
      setPsnGames(fetchedGames);
      setPsnConnected(true);

      let updatedCount = 0;
      const matchedIds = new Set<string>();

      const updatedMedia = media.map((item) => {
        if (item.type !== 'game') return item;
        const isPsnGame = item.connectedService === 'psn' || item.external_id?.startsWith('psn:');
        const isUnconnected = !item.connectedService && !item.gameConnection?.service && !item.external_id?.startsWith('steam:') && !item.external_id?.startsWith('gog:');

        let match: PsnGameItem | undefined = undefined;
        if (isPsnGame || isUnconnected) {
          match = fetchedGames.find(
            (pg) =>
              item.external_id === pg.id ||
              item.gameConnection?.serviceId === pg.id ||
              pg.name.toLowerCase() === item.title.toLowerCase()
          );
        }

        if (!match) return item;

        matchedIds.add(match.id);
        updatedCount++;
        const t = match.trophies || { current: 0, total: 0, completionist100: false };

        return {
          ...item,
          external_id: item.external_id?.startsWith('psn:') ? item.external_id : match.id,
          connectedService: 'psn' as const,
          gameConnection: {
            service: 'psn' as const,
            serviceId: match.id,
            serviceName: 'PlayStation Network',
            platform: match.platform || item.gameConnection?.platform || 'PS5',
            lastPlayed: match.lastPlayed || item.gameConnection?.lastPlayed,
          },
          progress: {
            ...item.progress,
            current: match.playtimeHours > 0 ? match.playtimeHours : item.progress.current,
            unit: 'hours' as const,
          },
          gameTracker: {
            ...(item.gameTracker || {}),
            playtimeHours: match.playtimeHours > 0 ? match.playtimeHours : item.gameTracker?.playtimeHours,
            achievements: t.total > 0 ? { current: t.current, total: t.total } : item.gameTracker?.achievements,
            completionist100: t.completionist100,
            allAchievementsCompleted: t.completionist100 || (t.total > 0 && t.current >= t.total),
          },
          updatedAt: new Date().toISOString(),
        };
      });

      const gamesToImport = importUnplayedPsn
        ? fetchedGames
        : fetchedGames.filter((g) => g.playtimeHours > 0 || (g.trophies && g.trophies.current > 0));

      const newGames = gamesToImport.filter(
        (g) => !matchedIds.has(g.id) && !isGameDeleted(g.id)
      );

      const newItems: MediaItem[] = newGames.map((pg) => {
        const itemMeta = {
          title: pg.name,
          type: 'game' as const,
          gameConnection: { service: 'psn' as const, serviceId: pg.id },
        };
        const score = getMediaMetacriticScore(itemMeta) || undefined;
        const preset = getKnownGamePresets(pg.name);

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
            lastPlayed: pg.lastPlayed,
          },
          summary: preset.summary || undefined,
          genres: preset.genres || ['Videospiel', pg.platform || 'PlayStation'],
          creator: preset.creator || 'PlayStation Studios',
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
      const validSequels = sequels.filter((s) => !isSequelInLibrary(s, finalMedia) && !isSequelDismissed(s));

      onApplySync(finalMedia, validSequels);

      if (authSession) {
        syncPushToAccount({ media: finalMedia, sequels: validSequels }).catch(() => {});
      }

      setFeedback({
        type: 'success',
        message: `PlayStation-Abgleich erfolgreich: ${newItems.length} neue Spiele importiert, ${updatedCount} bestehende aktualisiert.`,
      });
      addToast('success', 'PlayStation synchronisiert', `${newItems.length} neu, ${updatedCount} aktualisiert`);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Fehler beim PlayStation-Abgleich.' });
    } finally {
      setIsPsnLoading(false);
    }
  };

  // ================= GOG SYNC =================
  const handleSyncGog = async () => {
    const user = gogUsername.trim();
    if (!user) {
      setFeedback({ type: 'error', message: 'Bitte gib deinen GOG.com Benutzernamen ein.' });
      return;
    }

    setIsGogLoading(true);
    setFeedback(null);
    localStorage.setItem(STORAGE_GOG_USER_KEY, user);
    if (gogCode.trim()) localStorage.setItem(STORAGE_GOG_TOKEN_KEY, gogCode.trim());

    try {
      const res = await fetch('/api/sync/gog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-games', username: user, token: gogCode.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler beim Abrufen der GOG-Spiele');

      const fetchedGames: GogGameItem[] = data.games || [];
      setGogGames(fetchedGames);
      setGogConnected(true);

      let updatedCount = 0;
      const matchedIds = new Set<string>();

      const updatedMedia = media.map((item) => {
        if (item.type !== 'game') return item;
        const isGogGame = item.connectedService === 'gog' || item.external_id?.startsWith('gog:');
        const isUnconnected = !item.connectedService && !item.gameConnection?.service && !item.external_id?.startsWith('steam:') && !item.external_id?.startsWith('psn:');

        let match: GogGameItem | undefined = undefined;
        if (isGogGame || isUnconnected) {
          match = fetchedGames.find(
            (gg) =>
              item.external_id === `gog:${gg.gameId}` ||
              item.gameConnection?.serviceId === String(gg.gameId) ||
              gg.title.toLowerCase() === item.title.toLowerCase()
          );
        }

        if (!match) return item;

        matchedIds.add(String(match.gameId));
        updatedCount++;
        const ach = match.achievements;

        return {
          ...item,
          external_id: item.external_id?.startsWith('gog:') ? item.external_id : `gog:${match.gameId}`,
          connectedService: 'gog' as const,
          gameConnection: {
            service: 'gog' as const,
            serviceId: String(match.gameId),
            serviceName: 'GOG Galaxy',
            accountUsername: user,
            playtimeMinutes: match.playtimeMinutes,
            lastPlayed: match.lastPlayed || item.gameConnection?.lastPlayed,
          },
          progress: {
            ...item.progress,
            current: match.playtimeHours > 0 ? match.playtimeHours : item.progress.current,
            unit: 'hours' as const,
          },
          gameTracker: {
            ...(item.gameTracker || {}),
            playtimeHours: match.playtimeHours > 0 ? match.playtimeHours : item.gameTracker?.playtimeHours,
            achievements: ach ? { current: ach.current, total: ach.total } : item.gameTracker?.achievements,
            completionist100: ach ? ach.completionist100 : item.gameTracker?.completionist100,
            allAchievementsCompleted: ach ? ach.completionist100 : item.gameTracker?.allAchievementsCompleted,
          },
          updatedAt: new Date().toISOString(),
        };
      });

      const gamesToImport = importUnplayedGog
        ? fetchedGames
        : fetchedGames.filter((g) => g.playtimeHours > 0);

      const newGames = gamesToImport.filter(
        (g) => !matchedIds.has(String(g.gameId)) && !isGameDeleted(`gog:${g.gameId}`)
      );

      const newItems: MediaItem[] = newGames.map((gg) => {
        const itemMeta = {
          title: gg.title,
          type: 'game' as const,
          gameConnection: { service: 'gog' as const, serviceId: String(gg.gameId) },
        };
        const score = getMediaMetacriticScore(itemMeta) || undefined;
        const preset = getKnownGamePresets(gg.title);

        return {
          id: `media-gog-${gg.gameId}`,
          title: gg.title,
          type: 'game',
          status: gg.achievements?.completionist100 ? 'completed' : gg.playtimeHours > 0 ? 'in_progress' : 'planned',
          isOwned: true,
          coverUrl: gg.coverUrl || '',
          bannerUrl: gg.bannerUrl,
          external_id: `gog:${gg.gameId}`,
          connectedService: 'gog',
          gameConnection: {
            service: 'gog',
            serviceId: String(gg.gameId),
            serviceName: 'GOG Galaxy',
            accountUsername: user,
            playtimeMinutes: gg.playtimeMinutes,
            lastPlayed: gg.lastPlayed,
          },
          summary: preset.summary || undefined,
          genres: preset.genres || ['Videospiel', 'GOG'],
          creator: preset.creator || 'GOG.com',
          publisher: 'GOG Galaxy',
          progress: { current: gg.playtimeHours, unit: 'hours' },
          gameTracker: {
            playtimeHours: gg.playtimeHours,
            completionist100: gg.achievements?.completionist100,
            allAchievementsCompleted: gg.achievements?.completionist100,
            achievements: gg.achievements ? { current: gg.achievements.current, total: gg.achievements.total } : undefined,
          },
          metacritic: score,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });

      const finalMedia = [...newItems, ...updatedMedia];
      const validSequels = sequels.filter((s) => !isSequelInLibrary(s, finalMedia) && !isSequelDismissed(s));

      onApplySync(finalMedia, validSequels);

      if (authSession) {
        syncPushToAccount({ media: finalMedia, sequels: validSequels }).catch(() => {});
      }

      setFeedback({
        type: 'success',
        message: `GOG-Abgleich abgeschlossen: ${newItems.length} neue Spiele importiert, ${updatedCount} bestehende aktualisiert.`,
      });
      addToast('success', 'GOG synchronisiert', `${newItems.length} neu, ${updatedCount} aktualisiert`);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Fehler beim GOG-Abgleich.' });
    } finally {
      setIsGogLoading(false);
    }
  };

  // ================= BACKUP & LEGACY CODE MIGRATION =================
  const handleExportJson = () => {
    try {
      const exportData = {
        app: 'OmniList',
        version: '2.0',
        exportedAt: new Date().toISOString(),
        mediaCount: media.length,
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

      addToast('success', 'Backup exportiert', `${media.length} Medien als JSON-Datei gesichert.`);
    } catch {
      setFeedback({ type: 'error', message: 'Fehler beim Erstellen der Backup-Datei.' });
    }
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        const restoredMedia = parsed.media || (Array.isArray(parsed) ? parsed : null);

        if (!Array.isArray(restoredMedia)) {
          throw new Error('Ungültiges Dateiformat.');
        }

        const restoredSequels = Array.isArray(parsed.sequels) ? parsed.sequels : [];
        onApplySync(restoredMedia, restoredSequels);

        if (authSession) {
          syncPushToAccount({ media: restoredMedia, sequels: restoredSequels }).catch(() => {});
        }

        setFeedback({
          type: 'success',
          message: `Backup erfolgreich wiederhergestellt (${restoredMedia.length} Medien).`,
        });
        addToast('success', 'Backup importiert', `${restoredMedia.length} Medien wiederhergestellt.`);
      } catch {
        setFeedback({ type: 'error', message: 'Fehler beim Lesen der JSON-Backup-Datei.' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleMigrateLegacyCode = async () => {
    const code = legacyCodeInput.trim().toUpperCase();
    if (!code) {
      setFeedback({ type: 'error', message: 'Bitte gib deinen alten Sync-Code ein.' });
      return;
    }

    setIsMigratingCode(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pull', code }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Sync-Code konnte nicht geladen werden.');

      const pulledMedia = json.data?.media || [];
      const pulledSequels = json.data?.sequels || [];
      const pulledIntegrations = json.data?.integrations || {};

      onApplySync(pulledMedia, pulledSequels);
      applyLauncherIntegrations(pulledIntegrations);

      if (authSession) {
        await syncPushToAccount({
          media: pulledMedia,
          sequels: pulledSequels,
        });
      }

      setFeedback({
        type: 'success',
        message: `Daten aus Sync-Code "${code}" erfolgreich in deinen Account übernommen (${pulledMedia.length} Medien).`,
      });
      addToast('success', 'Sync-Code importiert', `${pulledMedia.length} Medien in Account übertragen.`);
      setLegacyCodeInput('');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Fehler beim Übernehmen des alten Codes.' });
    } finally {
      setIsMigratingCode(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#12141A] border border-[#282D37] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#282D37]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {authSession ? `Account: ${authSession.user.username}` : 'Benutzerkonto & Cloud-Sync'}
              </h2>
              <p className="text-xs text-zinc-400">
                {authSession
                  ? 'Deine Sammlung & Launcher synchronisieren automatisch'
                  : 'Anmelden oder registrieren für nahtlosen Geräte-Abgleich'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-2 bg-[#0F1117] border-b border-[#282D37] px-4">
          <button
            onClick={() => { setActiveTab('account'); setFeedback(null); }}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
              activeTab === 'account'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            )}
          >
            <User className="w-3.5 h-3.5" />
            <span>{authSession ? 'Mein Account' : 'Anmelden'}</span>
          </button>

          <button
            onClick={() => { setActiveTab('gaming'); setFeedback(null); }}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
              activeTab === 'gaming'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            )}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Game Launcher</span>
          </button>

          <button
            onClick={() => { setActiveTab('backup'); setFeedback(null); }}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
              activeTab === 'backup'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            )}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Backup &amp; Migration</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Feedback Banner */}
          {feedback && (
            <div
              className={cn(
                'p-3 rounded-xl border text-xs flex items-center gap-2.5',
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : feedback.type === 'error'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
              )}
            >
              {feedback.type === 'success' ? (
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span className="flex-1">{feedback.message}</span>
            </div>
          )}

          {/* ================= TAB 1: ACCOUNT ================= */}
          {activeTab === 'account' && (
            <div className="space-y-5">
              {authSession ? (
                /* LOGGED IN VIEW */
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/40 to-zinc-900 border border-purple-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {authSession.user.username.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white">{authSession.user.username}</h3>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Aktiv
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400">
                          {authSession.lastSyncAt
                            ? `Zuletzt synchronisiert: ${new Date(authSession.lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Uhr`
                            : 'Automatischer Cloud-Sync aktiv'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-300 hover:text-rose-200 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Abmelden</span>
                    </button>
                  </div>

                  {/* Account Capabilities Card */}
                  <div className="p-4 rounded-xl bg-[#181B22] border border-[#282D37] space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Automatischer Cloud-Abgleich</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Jede Änderung an deiner Bibliothek sowie deine gekoppelten Launcher werden automatisch im Hintergrund mit deinem Account synchronisiert. Du musst keine Codes mehr eingeben.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                      <button
                        onClick={handleManualAccountSync}
                        disabled={isAuthLoading || isCloudSyncing}
                        className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isCloudSyncing ? 'Synchronisiere...' : 'Jetzt in Cloud sichern'}</span>
                      </button>

                      <button
                        onClick={handlePullFromAccount}
                        disabled={isAuthLoading || isCloudSyncing}
                        className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#0F1117] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-[#282D37] transition-all active:scale-95 disabled:opacity-50"
                      >
                        <RefreshCw className={cn('w-3.5 h-3.5', isAuthLoading && 'animate-spin')} />
                        <span>Aus Cloud aktualisieren</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* LOGGED OUT VIEW */
                <div className="space-y-4">
                  {/* Mode Selector */}
                  <div className="flex rounded-xl bg-[#0F1117] p-1 border border-[#282D37]">
                    <button
                      type="button"
                      onClick={() => { setAuthMode('login'); setAuthError(null); }}
                      className={cn(
                        'flex-1 py-2 text-xs font-bold rounded-lg transition-all',
                        authMode === 'login' ? 'bg-purple-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                      )}
                    >
                      Anmelden
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAuthMode('register'); setAuthError(null); }}
                      className={cn(
                        'flex-1 py-2 text-xs font-bold rounded-lg transition-all',
                        authMode === 'register' ? 'bg-purple-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                      )}
                    >
                      Neues Konto erstellen
                    </button>
                  </div>

                  {authError && (
                    <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">Benutzername</label>
                      <input
                        type="text"
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        placeholder="z. B. GamerAlex"
                        className="w-full px-3.5 py-2 rounded-xl bg-[#0F1117] border border-[#282D37] text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-purple-500"
                        autoComplete="username"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">Passwort</label>
                      <input
                        type="password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2 rounded-xl bg-[#0F1117] border border-[#282D37] text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-purple-500"
                        autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isAuthLoading}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-purple-950/40"
                    >
                      {isAuthLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Bitte warten...</span>
                        </>
                      ) : authMode === 'login' ? (
                        <>
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Jetzt anmelden</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Account erstellen &amp; synchronisieren</span>
                        </>
                      )}
                    </button>
                  </form>

                  <p className="text-[11px] text-zinc-500 text-center leading-relaxed">
                    Dein Account speichert deine Bibliothek und Launcher-Verknüpfungen sicher in der Cloud. Auf jedem Gerät einfach anmelden und sofort weitermachen.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 2: GAMING LAUNCHER ================= */}
          {activeTab === 'gaming' && (
            <div className="space-y-4">
              {/* Launcher Subtab Selector */}
              <div className="flex gap-2 p-1 bg-[#0F1117] rounded-xl border border-[#282D37]">
                <button
                  type="button"
                  onClick={() => setGamingSubTab('steam')}
                  className={cn(
                    'flex-1 py-1.5 text-xs font-bold rounded-lg transition-all',
                    gamingSubTab === 'steam' ? 'bg-[#181B22] text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-white'
                  )}
                >
                  Steam
                </button>
                <button
                  type="button"
                  onClick={() => setGamingSubTab('psn')}
                  className={cn(
                    'flex-1 py-1.5 text-xs font-bold rounded-lg transition-all',
                    gamingSubTab === 'psn' ? 'bg-[#181B22] text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-white'
                  )}
                >
                  PlayStation
                </button>
                <button
                  type="button"
                  onClick={() => setGamingSubTab('gog')}
                  className={cn(
                    'flex-1 py-1.5 text-xs font-bold rounded-lg transition-all',
                    gamingSubTab === 'gog' ? 'bg-[#181B22] text-white shadow-sm border border-zinc-700' : 'text-zinc-400 hover:text-white'
                  )}
                >
                  GOG Galaxy
                </button>
              </div>

              {/* STEAM SUBTAB */}
              {gamingSubTab === 'steam' && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-[#181B22] border border-[#282D37] space-y-3">
                    <label className="block text-xs font-bold text-white">Steam Profil-Link oder SteamID64</label>
                    <input
                      type="text"
                      value={steamInput}
                      onChange={(e) => setSteamInput(e.target.value)}
                      placeholder="https://steamcommunity.com/id/deinname/ oder 76561198..."
                      className="w-full px-3 py-2 rounded-xl bg-[#0F1117] border border-[#282D37] text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-purple-500"
                    />

                    <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={importUnplayedSteam}
                        onChange={(e) => setImportUnplayedSteam(e.target.checked)}
                        className="rounded border-zinc-700 bg-zinc-900 text-purple-600 focus:ring-0"
                      />
                      <span>Auch ungespielte Backlog-Spiele mit 0 Stunden importieren</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleSyncSteam}
                      disabled={isSteamLoading}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all active:scale-95 disabled:opacity-50"
                    >
                      <RefreshCw className={cn('w-3.5 h-3.5', isSteamLoading && 'animate-spin')} />
                      <span>{isSteamLoading ? 'Gleicht Steam ab...' : 'Steam-Spiele synchronisieren'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* PSN SUBTAB */}
              {gamingSubTab === 'psn' && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-[#181B22] border border-[#282D37] space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-white">PlayStation NPSSO Token</label>
                      <a
                        href="https://ca.account.sony.com/api/v1/ssocookie"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-purple-400 hover:underline inline-flex items-center gap-1"
                      >
                        <span>Token abrufen</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <input
                      type="password"
                      value={psnNpsso}
                      onChange={(e) => setPsnNpsso(e.target.value)}
                      placeholder="64-stelliger NPSSO Token aus ca.account.sony.com"
                      className="w-full px-3 py-2 rounded-xl bg-[#0F1117] border border-[#282D37] text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 font-mono"
                    />

                    <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={importUnplayedPsn}
                        onChange={(e) => setImportUnplayedPsn(e.target.checked)}
                        className="rounded border-zinc-700 bg-zinc-900 text-purple-600 focus:ring-0"
                      />
                      <span>Auch ungespielte PlayStation-Spiele mit 0 Trophäen importieren</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleSyncPsn}
                      disabled={isPsnLoading}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all active:scale-95 disabled:opacity-50"
                    >
                      <RefreshCw className={cn('w-3.5 h-3.5', isPsnLoading && 'animate-spin')} />
                      <span>{isPsnLoading ? 'Gleicht PlayStation ab...' : 'PlayStation synchronisieren'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* GOG SUBTAB */}
              {gamingSubTab === 'gog' && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-[#181B22] border border-[#282D37] space-y-3">
                    <label className="block text-xs font-bold text-white">GOG.com Benutzername</label>
                    <input
                      type="text"
                      value={gogUsername}
                      onChange={(e) => setGogUsername(e.target.value)}
                      placeholder="Dein GOG Benutzername"
                      className="w-full px-3 py-2 rounded-xl bg-[#0F1117] border border-[#282D37] text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-purple-500"
                    />

                    <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={importUnplayedGog}
                        onChange={(e) => setImportUnplayedGog(e.target.checked)}
                        className="rounded border-zinc-700 bg-zinc-900 text-purple-600 focus:ring-0"
                      />
                      <span>Auch ungespielte GOG-Spiele mit 0 Stunden importieren</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleSyncGog}
                      disabled={isGogLoading}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all active:scale-95 disabled:opacity-50"
                    >
                      <RefreshCw className={cn('w-3.5 h-3.5', isGogLoading && 'animate-spin')} />
                      <span>{isGogLoading ? 'Gleicht GOG ab...' : 'GOG-Spiele synchronisieren'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 3: BACKUP & MIGRATION ================= */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              {/* Local JSON Backup Export / Import */}
              <div className="p-4 rounded-xl bg-[#181B22] border border-[#282D37] space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-purple-400" />
                  <span>Lokale Sicherheitskopie (JSON-Datei)</span>
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Lade deine Mediensammlung als Datei herunter oder stelle eine frühere Sicherung wieder her.
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={handleExportJson}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-[#0F1117] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-[#282D37] text-xs font-semibold transition-all active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Backup exportieren</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-[#0F1117] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-[#282D37] text-xs font-semibold transition-all active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Backup wiederherstellen</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportJson}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Migration from Old Sync Code */}
              <div className="p-4 rounded-xl bg-[#181B22] border border-[#282D37] space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>Alten Sync-Code in Account übernehmen</span>
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Falls du früher einen Sync-Code genutzt hast, kannst du ihn hier eingeben. Alle Medien werden automatisch in deinen Account übertragen.
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={legacyCodeInput}
                    onChange={(e) => setLegacyCodeInput(e.target.value)}
                    placeholder="z. B. OMNI-7821"
                    className="flex-1 px-3 py-2 rounded-xl bg-[#0F1117] border border-[#282D37] text-white text-xs placeholder:text-zinc-500 font-mono focus:outline-none focus:border-amber-500 uppercase"
                  />
                  <button
                    onClick={handleMigrateLegacyCode}
                    disabled={isMigratingCode}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isMigratingCode ? 'Lade...' : 'Code importieren'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
