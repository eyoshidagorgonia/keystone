
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import type { ConnectionLog } from '@/types';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'connections.json');
const MAX_LOG_ENTRIES = 50; // Keep the log file from growing indefinitely

async function getConnectionLogsFromFile(): Promise<ConnectionLog[]> {
  try {
    const fileContent = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await saveConnectionLogsToFile([]);
      return [];
    }
    console.error('[Connection Log Service] Failed to read logs file:', error);
    throw new Error('Could not read connection logs data.');
  }
}

async function saveConnectionLogsToFile(logs: ConnectionLog[]): Promise<void> {
  try {
    await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (error) {
    console.error('[Connection Log Service] Failed to save logs file:', error);
    throw new Error('Could not save connection logs data.');
  }
}

export async function recordConnection(connectionData: Omit<ConnectionLog, 'id' | 'timestamp'>): Promise<void> {
  const newLog: ConnectionLog = {
    id: `conn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...connectionData,
  };

  const logs = await getConnectionLogsFromFile();
  logs.unshift(newLog); // Add to the beginning

  // Trim the log to the max number of entries
  const trimmedLogs = logs.slice(0, MAX_LOG_ENTRIES);

  await saveConnectionLogsToFile(trimmedLogs);

  console.log(`[Connection Log Service] Recorded connection for key "${connectionData.keyName}"`);
}

export async function getRecentConnections(limit: number = 5): Promise<ConnectionLog[]> {
  const logs = await getConnectionLogsFromFile();
  return logs.slice(0, limit);
}
