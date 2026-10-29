import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { AccountCloudData, UserPublicInfo } from '@/types/account';

const LOCAL_STORE_FILE = path.join(process.cwd(), '.account-store.json');

interface StoredUserRecord {
  id: string;
  username: string; // always lowercase
  displayName: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  lastLoginAt: string;
}

interface StoredSessionRecord {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

// Memory fallback / local file store structure
interface LocalAccountStore {
  users: Record<string, StoredUserRecord>; // username -> user
  sessions: Record<string, StoredSessionRecord>; // token -> session
  data: Record<string, AccountCloudData>; // userId -> cloud data
}

async function getLocalStore(): Promise<LocalAccountStore> {
  try {
    if (fs.existsSync(LOCAL_STORE_FILE)) {
      const content = await fs.promises.readFile(LOCAL_STORE_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      return {
        users: parsed.users || {},
        sessions: parsed.sessions || {},
        data: parsed.data || {},
      };
    }
  } catch (error) {
    console.error('Error reading local account store:', error);
  }
  return { users: {}, sessions: {}, data: {} };
}

async function saveLocalStore(store: LocalAccountStore): Promise<void> {
  try {
    await fs.promises.writeFile(LOCAL_STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving local account store:', error);
  }
}

function getCloudConfig() {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  const isCloud = Boolean(kvUrl && kvToken);
  return { kvUrl, kvToken, isCloud };
}

async function kvGet<T>(key: string): Promise<T | null> {
  const { kvUrl, kvToken, isCloud } = getCloudConfig();
  if (isCloud && kvUrl && kvToken) {
    try {
      const res = await fetch(`${kvUrl}/get/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${kvToken}` },
        cache: 'no-store',
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || data.result === null || data.result === undefined) return null;
      let val = data.result;
      while (typeof val === 'string') {
        try {
          val = JSON.parse(val);
        } catch {
          break;
        }
      }
      return val as T;
    } catch (e) {
      console.error('KV get error:', e);
    }
  }
  return null;
}

async function kvSet(key: string, value: any): Promise<boolean> {
  const { kvUrl, kvToken, isCloud } = getCloudConfig();
  if (isCloud && kvUrl && kvToken) {
    try {
      const res = await fetch(`${kvUrl}/set/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kvToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(value),
      });
      return res.ok;
    } catch (e) {
      console.error('KV set error:', e);
      return false;
    }
  }
  return false;
}

export function hashPassword(password: string, salt: string): string {
  return crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex');
}

export function generateRandomString(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export async function findUserByUsername(username: string): Promise<StoredUserRecord | null> {
  const clean = username.trim().toLowerCase();
  if (!clean) return null;

  const { isCloud } = getCloudConfig();
  if (isCloud) {
    return await kvGet<StoredUserRecord>(`omnilist:user:${clean}`);
  }

  const store = await getLocalStore();
  return store.users[clean] || null;
}

export async function createUser(
  username: string,
  password: string,
  initialData?: Partial<AccountCloudData>
): Promise<{ user: UserPublicInfo; token: string; data: AccountCloudData }> {
  const clean = username.trim().toLowerCase();
  const displayName = username.trim();

  const existing = await findUserByUsername(clean);
  if (existing) {
    throw new Error('Dieser Benutzername ist bereits vergeben.');
  }

  const salt = generateRandomString(16);
  const passwordHash = hashPassword(password, salt);
  const id = `user_${Date.now()}_${generateRandomString(4)}`;
  const now = new Date().toISOString();

  const userRecord: StoredUserRecord = {
    id,
    username: clean,
    displayName,
    passwordHash,
    salt,
    createdAt: now,
    lastLoginAt: now,
  };

  const cloudData: AccountCloudData = {
    media: initialData?.media || [],
    sequels: initialData?.sequels || [],
    trash: initialData?.trash || [],
    integrations: initialData?.integrations || {},
    updatedAt: now,
    itemCount: (initialData?.media || []).length,
  };

  const token = `sess_${generateRandomString(32)}`;
  const sessionRecord: StoredSessionRecord = {
    token,
    userId: id,
    createdAt: now,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
  };

  const { isCloud } = getCloudConfig();
  if (isCloud) {
    await kvSet(`omnilist:user:${clean}`, userRecord);
    await kvSet(`omnilist:userid:${id}`, userRecord);
    await kvSet(`omnilist:session:${token}`, sessionRecord);
    await kvSet(`omnilist:userdata:${id}`, cloudData);
  } else {
    const store = await getLocalStore();
    store.users[clean] = userRecord;
    store.sessions[token] = sessionRecord;
    store.data[id] = cloudData;
    await saveLocalStore(store);
  }

  const publicInfo: UserPublicInfo = {
    id,
    username: displayName,
    createdAt: now,
    lastLoginAt: now,
    lastSyncAt: now,
  };

  return { user: publicInfo, token, data: cloudData };
}

export async function authenticateUser(
  username: string,
  password: string
): Promise<{ user: UserPublicInfo; token: string; data: AccountCloudData } | null> {
  const clean = username.trim().toLowerCase();
  const user = await findUserByUsername(clean);
  if (!user) return null;

  const checkHash = hashPassword(password, user.salt);
  if (checkHash !== user.passwordHash) return null;

  const now = new Date().toISOString();
  user.lastLoginAt = now;

  const token = `sess_${generateRandomString(32)}`;
  const sessionRecord: StoredSessionRecord = {
    token,
    userId: user.id,
    createdAt: now,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const cloudData = await getUserCloudData(user.id);

  const { isCloud } = getCloudConfig();
  if (isCloud) {
    await kvSet(`omnilist:user:${clean}`, user);
    await kvSet(`omnilist:userid:${user.id}`, user);
    await kvSet(`omnilist:session:${token}`, sessionRecord);
  } else {
    const store = await getLocalStore();
    store.users[clean] = user;
    store.sessions[token] = sessionRecord;
    await saveLocalStore(store);
  }

  const publicInfo: UserPublicInfo = {
    id: user.id,
    username: user.displayName || user.username,
    createdAt: user.createdAt,
    lastLoginAt: now,
    lastSyncAt: cloudData.updatedAt,
  };

  return { user: publicInfo, token, data: cloudData };
}

export async function getUserBySessionToken(token: string): Promise<UserPublicInfo | null> {
  if (!token) return null;

  const { isCloud } = getCloudConfig();
  let session: StoredSessionRecord | null = null;
  let user: StoredUserRecord | null = null;

  if (isCloud) {
    session = await kvGet<StoredSessionRecord>(`omnilist:session:${token}`);
    if (session) {
      user = await kvGet<StoredUserRecord>(`omnilist:userid:${session.userId}`);
    }
  } else {
    const store = await getLocalStore();
    session = store.sessions[token] || null;
    if (session) {
      user = Object.values(store.users).find((u) => u.id === session?.userId) || null;
    }
  }

  if (!session || !user) return null;

  return {
    id: user.id,
    username: user.displayName || user.username,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}

export async function getUserCloudData(userId: string): Promise<AccountCloudData> {
  const { isCloud } = getCloudConfig();
  if (isCloud) {
    const data = await kvGet<AccountCloudData>(`omnilist:userdata:${userId}`);
    if (data) return data;
  } else {
    const store = await getLocalStore();
    if (store.data[userId]) return store.data[userId];
  }

  return {
    media: [],
    sequels: [],
    trash: [],
    integrations: {},
    updatedAt: new Date().toISOString(),
    itemCount: 0,
  };
}

export async function saveUserCloudData(
  userId: string,
  data: Partial<AccountCloudData>
): Promise<AccountCloudData> {
  const existing = await getUserCloudData(userId);
  const now = new Date().toISOString();

  const updated: AccountCloudData = {
    media: data.media !== undefined ? data.media : existing.media,
    sequels: data.sequels !== undefined ? data.sequels : existing.sequels,
    trash: data.trash !== undefined ? data.trash : existing.trash,
    integrations: {
      ...(existing.integrations || {}),
      ...(data.integrations || {}),
    },
    updatedAt: now,
    itemCount: (data.media !== undefined ? data.media : existing.media).length,
  };

  const { isCloud } = getCloudConfig();
  if (isCloud) {
    await kvSet(`omnilist:userdata:${userId}`, updated);
  } else {
    const store = await getLocalStore();
    store.data[userId] = updated;
    await saveLocalStore(store);
  }

  return updated;
}
