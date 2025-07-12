'use server'

import { revalidatePath } from 'next/cache'
import {
  getApiKeys,
  saveApiKeys,
  addApiKey,
  updateApiKey as updateApiKeyInStore,
  deleteApiKey as deleteApiKeyFromStore,
} from '@/lib/apiKeyService'
import { getMetrics } from '@/lib/metricsService'
import type { ApiKey, UsageStat } from '@/types'

export async function createApiKey(name: string, rateLimit: number): Promise<ApiKey> {
  const newKey = await addApiKey({ name, rateLimit });
  revalidatePath('/keys')
  return newKey;
}

export async function updateApiKey(key: ApiKey): Promise<void> {
    await updateApiKeyInStore(key);
    revalidatePath('/keys');
}

export async function deleteApiKey(keyId: string): Promise<void> {
    await deleteApiKeyFromStore(keyId);
    revalidatePath('/keys');
}

export async function revokeApiKey(keyId: string): Promise<void> {
    const keys = await getApiKeys();
    const updatedKeys = keys.map(k => k.id === keyId ? {...k, status: 'revoked'} : k)
    await saveApiKeys(updatedKeys);
    revalidatePath('/keys');
}

export async function getUsageMetrics(): Promise<UsageStat[]> {
    return await getMetrics();
}
