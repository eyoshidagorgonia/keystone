import type { ApiKey, UsageStat } from '@/types';

export const apiKeys: ApiKey[] = [
  {
    id: 'key_1',
    name: 'WebApp Production',
    key: 'ks_ollama_prod_xxxxxxxxxxxxxxxxxxxxxx_a1b2',
    status: 'active',
    createdAt: '2023-05-15T10:00:00Z',
    lastUsed: '2024-07-20T14:30:00Z',
    usage: 5420,
    rateLimit: 100,
  },
  {
    id: 'key_2',
    name: 'Mobile App iOS',
    key: 'ks_ollama_ios_xxxxxxxxxxxxxxxxxxxxxxx_c3d4',
    status: 'active',
    createdAt: '2023-06-01T11:00:00Z',
    lastUsed: '2024-07-21T09:15:00Z',
    usage: 3105,
    rateLimit: 100,
  },
  {
    id: 'key_3',
    name: 'Data Science Team',
    key: 'ks_ollama_ds_xxxxxxxxxxxxxxxxxxxxxxxx_e5f6',
    status: 'active',
    createdAt: '2023-08-20T09:00:00Z',
    lastUsed: '2024-07-19T18:00:00Z',
    usage: 850,
    rateLimit: 500,
  },
  {
    id: 'key_4',
    name: 'Legacy Integration',
    key: 'ks_ollama_legacy_xxxxxxxxxxxxxxxxxxx_g7h8',
    status: 'revoked',
    createdAt: '2022-01-10T12:00:00Z',
    lastUsed: '2023-01-10T12:00:00Z',
    usage: 10200,
    rateLimit: 50,
  },
  {
    id: 'key_5',
    name: 'Staging Environment',
    key: 'ks_ollama_stage_xxxxxxxxxxxxxxxxxxxx_i9j0',
    status: 'active',
    createdAt: '2024-01-15T16:00:00Z',
    lastUsed: '2024-07-21T11:45:00Z',
    usage: 1230,
    rateLimit: 200,
  },
];

export const usageStats: UsageStat[] = [
    { date: '2024-07-15', requests: 1200 },
    { date: '2024-07-16', requests: 1500 },
    { date: '2024-07-17', requests: 1300 },
    { date: '2024-07-18', requests: 1800 },
    { date: '2024-07-19', requests: 1600 },
    { date: '2024-07-20', requests: 2100 },
    { date: '2024-07-21', requests: 2500 },
];
