
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import type { UsageStat } from '@/types';
import { getApiKeys, saveApiKeys } from './apiKeyService';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'usageMetrics.json');

async function getMetricsFromFile(): Promise<UsageStat[]> {
  try {
    const fileContent = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await saveMetricsToFile([]);
      return [];
    }
    console.error('[Metrics Service] Failed to read metrics file:', error);
    throw new Error('Could not read metrics data.');
  }
}

async function saveMetricsToFile(stats: UsageStat[]): Promise<void> {
  try {
    await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(stats, null, 2), 'utf-8');
  } catch (error) {
    console.error('[Metrics Service] Failed to save metrics file:', error);
    throw new Error('Could not save metrics data.');
  }
}

export async function getMetrics(): Promise<UsageStat[]> {
  // In a real production app, this would query a time-series database.
  // For this example, we'll read from a JSON file in the persistent volume.
  return getMetricsFromFile();
}

export async function recordUsage(keyId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Update daily metrics count
  const metrics = await getMetricsFromFile();
  const todayMetric = metrics.find(m => m.date === today);

  if (todayMetric) {
    todayMetric.requests += 1;
  } else {
    metrics.push({ date: today, requests: 1 });
  }

  // Update total usage on the API key itself
  const keys = await getApiKeys();
  const keyToUpdate = keys.find(k => k.id === keyId);
  
  if (keyToUpdate) {
    keyToUpdate.usage += 1;
    keyToUpdate.lastUsed = new Date().toISOString();
  }

  // Atomically save both updates
  // We don't use a Firestore transaction here to keep the fallback logic simple.
  // A more advanced implementation would use a transaction.
  await Promise.all([
      saveMetricsToFile(metrics),
      saveApiKeys(keys)
  ]);

  console.log(`[Metrics Service] Recorded usage for key ${keyId} on ${today}`);
}
