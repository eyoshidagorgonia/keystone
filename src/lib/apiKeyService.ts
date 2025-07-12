
'use server';

import { db } from './firestoreClient';
import type { ApiKey } from '@/types';

const KEYS_COLLECTION = 'apiKeys';

async function getKeysCollection() {
  return db.collection(KEYS_COLLECTION);
}

export async function getApiKeys(): Promise<ApiKey[]> {
  const collection = await getKeysCollection();
  const snapshot = await collection.orderBy('createdAt', 'desc').get();
  if (snapshot.empty) {
    console.log('[API Key Service] No API keys found in Firestore.');
    return [];
  }
  return snapshot.docs.map(doc => doc.data() as ApiKey);
}

export async function addApiKey(keyData: { name: string; rateLimit: number }): Promise<ApiKey> {
  const collection = await getKeysCollection();
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
  
  await collection.doc(newKey.id).set(newKey);
  console.log(`[API Key Service] Added new key to Firestore: "${newKey.name}"`);
  return newKey;
}

export async function updateApiKey(updatedKey: ApiKey): Promise<void> {
    const collection = await getKeysCollection();
    const keyRef = collection.doc(updatedKey.id);
    
    // Check if the document exists before updating
    const doc = await keyRef.get();
    if (!doc.exists) {
        throw new Error('API Key not found in Firestore');
    }

    await keyRef.update(updatedKey);
    console.log(`[API Key Service] Updated key in Firestore: "${updatedKey.name}"`);
}

export async function deleteApiKey(keyId: string): Promise<void> {
    const collection = await getKeysCollection();
    await collection.doc(keyId).delete();
    console.log(`[API Key Service] Deleted key from Firestore with ID: "${keyId}"`);
}

// The following functions now read-then-write, which is standard for this type of operation.
export async function saveApiKeys(keys: ApiKey[]): Promise<void> {
  const collection = await getKeysCollection();
  const batch = db.batch();
  keys.forEach(key => {
    const docRef = collection.doc(key.id);
    batch.set(docRef, key);
  });
  await batch.commit();
  console.log(`[API Key Service] Saved ${keys.length} keys to Firestore.`);
}
