
'use server';

import { db } from './firestoreClient';
import type { ApiKey } from '@/types';
import { promises as fs } from 'fs';
import path from 'path';

const KEYS_COLLECTION = 'apiKeys';
const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'apiKeys.json');

let useFirestore = true;

async function getKeysCollection() {
  if (!useFirestore) throw new Error('Firestore is disabled.');
  try {
    // Perform a quick check to see if we can access the DB.
    await db.collection(KEYS_COLLECTION).limit(1).get();
    return db.collection(KEYS_COLLECTION);
  } catch (error: any) {
    console.warn('[API Key Service] Firestore is unavailable, falling back to local JSON file.', error?.message || 'Unknown error');
    useFirestore = false;
    throw new Error('Firestore is disabled.');
  }
}

async function getLocalApiKeys(): Promise<ApiKey[]> {
  try {
    const fileContent = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log('[API Key Service] Data file not found. Creating a new one.');
      await saveLocalApiKeys([]);
      return [];
    }
    console.error('[API Key Service] Failed to read local API keys file:', error);
    throw new Error('Could not read local API keys. Please check file permissions and existence of data/apiKeys.json.');
  }
}

async function saveLocalApiKeys(keys: ApiKey[]): Promise<void> {
  try {
    await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(keys, null, 2), 'utf-8');
  } catch (error) {
     console.error('[API Key Service] Failed to save local API keys:', error);
     throw new Error('Could not save local API keys. Please check file permissions for the data directory.');
  }
}


export async function getApiKeys(): Promise<ApiKey[]> {
  if (useFirestore) {
    try {
      const collection = await getKeysCollection();
      const snapshot = await collection.orderBy('createdAt', 'desc').get();
      if (snapshot.empty) return [];
      return snapshot.docs.map(doc => doc.data() as ApiKey);
    } catch (e) {
      // Fallback on error
    }
  }
  return getLocalApiKeys();
}

export async function addApiKey(keyData: { name: string; rateLimit: number }): Promise<ApiKey> {
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

  if (useFirestore) {
    try {
      const collection = await getKeysCollection();
      await collection.doc(newKey.id).set(newKey);
      return newKey;
    } catch (e) {
      // Fallback on error
    }
  }
  
  const keys = await getLocalApiKeys();
  keys.unshift(newKey);
  await saveLocalApiKeys(keys);
  return newKey;
}

export async function updateApiKey(updatedKey: ApiKey): Promise<void> {
  if (useFirestore) {
    try {
      const collection = await getKeysCollection();
      const keyRef = collection.doc(updatedKey.id);
      await keyRef.update(updatedKey as { [key: string]: any });
      return;
    } catch (e) {
        // Fallback on error
    }
  }

  const keys = await getLocalApiKeys();
  const index = keys.findIndex(k => k.id === updatedKey.id);
  if (index !== -1) {
    keys[index] = updatedKey;
    await saveLocalApiKeys(keys);
  }
}

export async function deleteApiKey(keyId: string): Promise<void> {
    if (useFirestore) {
        try {
            const collection = await getKeysCollection();
            await collection.doc(keyId).delete();
            return;
        } catch(e) {
            // fallback
        }
    }
    const keys = await getLocalApiKeys();
    const filteredKeys = keys.filter(k => k.id !== keyId);
    await saveLocalApiKeys(filteredKeys);
}

export async function saveApiKeys(keys: ApiKey[]): Promise<void> {
    if (useFirestore) {
        try {
            const collection = await getKeysCollection();
            const batch = db.batch();
            // Delete existing keys first to handle removals
            const snapshot = await collection.get();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            // Add new keys
            keys.forEach(key => {
                const docRef = collection.doc(key.id);
                batch.set(docRef, key);
            });
            await batch.commit();
            console.log(`[API Key Service] Successfully saved ${keys.length} keys to Firestore.`);
            return;
        } catch (e) {
            // fallback
        }
    }
    await saveLocalApiKeys(keys);
    console.log(`[API Key Service] Successfully saved ${keys.length} keys to local file.`);
}
