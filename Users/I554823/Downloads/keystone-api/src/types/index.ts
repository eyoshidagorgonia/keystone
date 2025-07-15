
export interface ApiKey {
  id: string;
  name: string;
  key: string;
  status: 'active' | 'revoked';
  createdAt: string;
  lastUsed: string | null;
  usage: number;
  rateLimit: number;
  notes?: string;
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
  ip?: string;
  userAgent?: string;
  geo?: {
    city?: string;
    country?: string;
  }
}

export interface ServiceConfig {
  id: string;
  name: string;
  type: 'ollama' | 'stable-diffusion-a1111';
  targetUrl: string;
  status: 'active' | 'inactive';
  createdAt: string;
  apiKey?: string; // Optional API key for the target service itself
  supportedModels?: string;
}

