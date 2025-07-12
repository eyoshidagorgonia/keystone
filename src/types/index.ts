export interface ApiKey {
  id: string;
  name: string;
  key: string;
  status: 'active' | 'revoked';
  createdAt: string;
  lastUsed: string | null;
  usage: number;
  rateLimit: number;
}

export interface UsageStat {
    date: string;
    requests: number;
}

export interface ConnectionLog {
  id: string;
  timestamp: string;
  keyId: string;
  keyName: string;
  path: string;
}
