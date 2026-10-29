import { AuthSession, UserPublicInfo, AccountCloudData, LauncherIntegrations } from '@/types/account';
import { MediaItem, SequelNotification } from '@/types/media';

export const OMNILIST_AUTH_TOKEN_KEY = 'omnilist_auth_token_v1';
export const OMNILIST_AUTH_USER_KEY = 'omnilist_auth_user_v1';
export const OMNILIST_LAST_CLOUD_SYNC_KEY = 'omnilist_last_cloud_sync_v1';

// Launcher LocalStorage Keys (for local sync compatibility)
const STORAGE_STEAM_INPUT_KEY = 'omnilist_steam_input_v1';
const STORAGE_PSN_NPSSO_KEY = 'omnilist_psn_npsso_v1';
const STORAGE_GOG_USER_KEY = 'omnilist_gog_username_v1';
const STORAGE_GOG_TOKEN_KEY = 'omnilist_gog_token_v1';

export function getStoredAuthSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const token = localStorage.getItem(OMNILIST_AUTH_TOKEN_KEY);
    const userRaw = localStorage.getItem(OMNILIST_AUTH_USER_KEY);
    if (!token || !userRaw) return null;
    const user: UserPublicInfo = JSON.parse(userRaw);
    const lastSyncAt = localStorage.getItem(OMNILIST_LAST_CLOUD_SYNC_KEY) || undefined;
    return { token, user, lastSyncAt };
  } catch (e) {
    console.error('Error reading auth session:', e);
    return null;
  }
}

export function saveAuthSession(session: AuthSession): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(OMNILIST_AUTH_TOKEN_KEY, session.token);
    localStorage.setItem(OMNILIST_AUTH_USER_KEY, JSON.stringify(session.user));
    if (session.lastSyncAt) {
      localStorage.setItem(OMNILIST_LAST_CLOUD_SYNC_KEY, session.lastSyncAt);
    }
  } catch (e) {
    console.error('Error saving auth session:', e);
  }
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(OMNILIST_AUTH_TOKEN_KEY);
  localStorage.removeItem(OMNILIST_AUTH_USER_KEY);
  localStorage.removeItem(OMNILIST_LAST_CLOUD_SYNC_KEY);
}

export function readCurrentLauncherIntegrations(): LauncherIntegrations {
  if (typeof window === 'undefined') return {};
  const steamInput = localStorage.getItem(STORAGE_STEAM_INPUT_KEY) || undefined;
  const psnNpsso = localStorage.getItem(STORAGE_PSN_NPSSO_KEY) || undefined;
  const gogUser = localStorage.getItem(STORAGE_GOG_USER_KEY) || undefined;
  const gogToken = localStorage.getItem(STORAGE_GOG_TOKEN_KEY) || undefined;

  const integrations: LauncherIntegrations = {};
  if (steamInput) integrations.steam = { steamInput };
  if (psnNpsso) integrations.psn = { npsso: psnNpsso };
  if (gogUser || gogToken) integrations.gog = { username: gogUser, token: gogToken };

  return integrations;
}

export function applyLauncherIntegrations(integrations: LauncherIntegrations): void {
  if (typeof window === 'undefined' || !integrations) return;
  if (integrations.steam?.steamInput) {
    localStorage.setItem(STORAGE_STEAM_INPUT_KEY, integrations.steam.steamInput);
  }
  if (integrations.psn?.npsso) {
    localStorage.setItem(STORAGE_PSN_NPSSO_KEY, integrations.psn.npsso);
  }
  if (integrations.gog?.username) {
    localStorage.setItem(STORAGE_GOG_USER_KEY, integrations.gog.username);
  }
  if (integrations.gog?.token) {
    localStorage.setItem(STORAGE_GOG_TOKEN_KEY, integrations.gog.token);
  }
}

export async function registerAccount(
  username: string,
  password: string,
  initialData?: {
    media: MediaItem[];
    sequels: SequelNotification[];
    trash?: any[];
  }
): Promise<{ user: UserPublicInfo; token: string; data: AccountCloudData }> {
  const integrations = readCurrentLauncherIntegrations();
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      password,
      initialData: {
        media: initialData?.media || [],
        sequels: initialData?.sequels || [],
        trash: initialData?.trash || [],
        integrations,
      },
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Registrierung fehlgeschlagen.');
  }

  saveAuthSession({
    user: json.user,
    token: json.token,
    lastSyncAt: json.data?.updatedAt,
  });

  if (json.data?.integrations) {
    applyLauncherIntegrations(json.data.integrations);
  }

  return json;
}

export async function loginAccount(
  username: string,
  password: string
): Promise<{ user: UserPublicInfo; token: string; data: AccountCloudData }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Anmeldung fehlgeschlagen.');
  }

  saveAuthSession({
    user: json.user,
    token: json.token,
    lastSyncAt: json.data?.updatedAt,
  });

  if (json.data?.integrations) {
    applyLauncherIntegrations(json.data.integrations);
  }

  return json;
}

export async function fetchCurrentAccount(): Promise<{ user: UserPublicInfo; data: AccountCloudData } | null> {
  const session = getStoredAuthSession();
  if (!session) return null;

  try {
    const res = await fetch('/api/auth/me', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        clearAuthSession();
      }
      return null;
    }

    const json = await res.json();
    if (json.user) {
      saveAuthSession({
        user: json.user,
        token: session.token,
        lastSyncAt: json.data?.updatedAt,
      });
      if (json.data?.integrations) {
        applyLauncherIntegrations(json.data.integrations);
      }
      return json;
    }
  } catch (e) {
    console.error('Error fetching current account:', e);
  }

  return null;
}

export async function syncPushToAccount(payload: {
  media: MediaItem[];
  sequels: SequelNotification[];
  trash?: any[];
}): Promise<{ success: boolean; updatedAt: string; itemCount: number } | null> {
  const session = getStoredAuthSession();
  if (!session) return null;

  const integrations = readCurrentLauncherIntegrations();
  const res = await fetch('/api/account/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.token}`,
    },
    body: JSON.stringify({
      action: 'push',
      data: {
        media: payload.media,
        sequels: payload.sequels,
        trash: payload.trash,
        integrations,
      },
    }),
  });

  if (!res.ok) {
    if (res.status === 401) clearAuthSession();
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || 'Fehler beim Synchronisieren.');
  }

  const json = await res.json();
  if (json.updatedAt) {
    localStorage.setItem(OMNILIST_LAST_CLOUD_SYNC_KEY, json.updatedAt);
  }

  return json;
}

export async function syncPullFromAccount(): Promise<AccountCloudData | null> {
  const session = getStoredAuthSession();
  if (!session) return null;

  const res = await fetch('/api/account/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.token}`,
    },
    body: JSON.stringify({ action: 'pull' }),
  });

  if (!res.ok) {
    if (res.status === 401) clearAuthSession();
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || 'Fehler beim Laden der Account-Daten.');
  }

  const json = await res.json();
  if (json.data?.updatedAt) {
    localStorage.setItem(OMNILIST_LAST_CLOUD_SYNC_KEY, json.data.updatedAt);
  }
  if (json.data?.integrations) {
    applyLauncherIntegrations(json.data.integrations);
  }

  return json.data;
}
