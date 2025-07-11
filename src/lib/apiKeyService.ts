
import { promises as fs } from 'fs';
import path from 'path';
import type { ApiKey } from '@/types';
import { initialApiKeys } from '@/lib/initialData';

const dataFilePath = path.join(process.cwd(), 'data', 'apiKeys.json');

async function ensureDataFileExists() {
  try {
    await fs.access(dataFilePath);
  } catch (error) {
    await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
    await fs.writeFile(dataFilePath, JSON.stringify(initialApiKeys, null, 2), 'utf8');
  }
}

export async function getApiKeys(): Promise<ApiKey[]> {
  await ensureDataFileExists();
  const fileContent = await fs.readFile(dataFilePath, 'utf8');
  return JSON.parse(fileContent);
}

export async function saveApiKeys(keys: ApiKey[]): Promise<void> {
  await ensureDataFileExists();
  await fs.writeFile(dataFilePath, JSON.stringify(keys, null, 2), 'utf8');
}

export async function addApiKey(keyData: { name: string; rateLimit: number }): Promise<ApiKey> {
  const keys = await getApiKeys();
  const newKey: ApiKey = {
    id: `key_${Date.now()}`,
    name: keyData.name,
    key: `ks_ollama_${[...Array(32)].map(() => Math.random().toString(36)[2]).join('')}`,
    status: 'active',
    createdAt: new Date().toISOString(),
    lastUsed: null,
    usage: 0,
    rateLimit: keyData.rateLimit,
  };
  const updatedKeys = [newKey, ...keys];
  await saveApiKeys(updatedKeys);
  return newKey;
}

export async function updateApiKey(updatedKey: ApiKey): Promise<void> {
    const keys = await getApiKeys();
    const keyIndex = keys.findIndex(k => k.id === updatedKey.id);
    if (keyIndex === -1) {
        throw new Error('API Key not found');
    }
    keys[keyIndex] = updatedKey;
    await saveApiKeys(keys);
}

export async function deleteApiKey(keyId: string): Promise<void> {
    const keys = await getApiKeys();
    const updatedKeys = keys.filter(k => k.id !== keyId);
    await saveApiKeys(updatedKeys);
}
