import { MediaItem, SequelNotification } from './media';

export interface UserPublicInfo {
  id: string;
  username: string;
  createdAt: string;
  lastLoginAt?: string;
  lastSyncAt?: string;
}

export interface LauncherIntegrations {
  steam?: {
    steamInput?: string;
    apiKey?: string;
    accountUsername?: string;
    connectedAt?: string;
  };
  psn?: {
    npsso?: string;
    savedAt?: string;
    connectedAt?: string;
  };
  gog?: {
    username?: string;
    token?: string;
    connectedAt?: string;
  };
}

export interface AccountCloudData {
  media: MediaItem[];
  sequels: SequelNotification[];
  trash?: any[];
  integrations: LauncherIntegrations;
  updatedAt: string;
  itemCount: number;
}

export interface AuthSession {
  user: UserPublicInfo;
  token: string;
  lastSyncAt?: string;
}
