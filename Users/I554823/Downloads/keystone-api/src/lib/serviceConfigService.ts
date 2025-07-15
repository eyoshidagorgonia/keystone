
'use server';

import { db } from './firestoreClient';
import type { ServiceConfig } from '@/types';
import { promises as fs } from 'fs';
import path from 'path';

const SERVICES_COLLECTION = 'services';
const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'services.json');

let useFirestore = true;

async function getServicesCollection() {
  if (!useFirestore) throw new Error('Firestore is disabled.');
  try {
    // Perform a quick check to see if we can access the DB.
    await db.collection(SERVICES_COLLECTION).limit(1).get();
    return db.collection(SERVICES_COLLECTION);
  } catch (error: any) {
    console.warn('[Service Config] Firestore is unavailable, falling back to local JSON file.', error?.message || 'Unknown error');
    useFirestore = false;
    throw new Error('Firestore is disabled.');
  }
}

function createDefaultServices(): ServiceConfig[] {
    const defaults: ServiceConfig[] = [];
    
    if (process.env.OLLAMA_TARGET_URL) {
        defaults.push({
            id: 'svc_ollama_default',
            name: 'Default Ollama Service',
            type: 'ollama',
            targetUrl: process.env.OLLAMA_TARGET_URL,
            status: 'active',
            createdAt: new Date().toISOString(),
            apiKey: '',
            supportedModels: 'llama3, gemma'
        });
        console.log(`[Service Config] Created default Ollama service with URL: ${process.env.OLLAMA_TARGET_URL}`);
    }

    if (process.env.SD_TARGET_URL) {
        defaults.push({
            id: 'svc_sd_default',
            name: 'Default Stable Diffusion',
            type: 'stable-diffusion-a1111',
            targetUrl: process.env.SD_TARGET_URL,
            status: 'active',
            createdAt: new Date().toISOString(),
            apiKey: '',
            supportedModels: 'sd_xl_base_1.0.safetensors'
        });
         console.log(`[Service Config] Created default Stable Diffusion service with URL: ${process.env.SD_TARGET_URL}`);
    }

    return defaults;
}


async function getLocalServices(): Promise<ServiceConfig[]> {
  try {
    const fileContent = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    const services = JSON.parse(fileContent);
    // If the file is empty or contains an empty array, create defaults
    if (Array.isArray(services) && services.length === 0) {
        console.log('[Service Config] Local services file is empty. Populating with defaults from .env');
        const defaultServices = createDefaultServices();
        await saveLocalServices(defaultServices);
        return defaultServices;
    }
    return services;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log('[Service Config] Data file not found. Creating a new one with defaults from .env');
      const defaultServices = createDefaultServices();
      await saveLocalServices(defaultServices);
      return defaultServices;
    }
    console.error('[Service Config] Failed to read local services file:', error);
    throw new Error('Could not read local services. Please check file permissions and existence of data/services.json.');
  }
}

async function saveLocalServices(services: ServiceConfig[]): Promise<void> {
  try {
    await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(services, null, 2), 'utf-8');
  } catch (error) {
     console.error('[Service Config] Failed to save local services:', error);
     throw new Error('Could not save local services. Please check file permissions for the data directory.');
  }
}

export async function getServiceConfigs(): Promise<ServiceConfig[]> {
  if (useFirestore) {
    try {
      const collection = await getServicesCollection();
      const snapshot = await collection.get();
      if (snapshot.empty) {
        console.log('[Service Config] Firestore is empty. Populating with defaults from .env');
        const defaultServices = createDefaultServices();
        const batch = db.batch();
        defaultServices.forEach(service => {
            const docRef = collection.doc(service.id);
            batch.set(docRef, service);
        });
        await batch.commit();
        return defaultServices;
      }
      return snapshot.docs.map(doc => doc.data() as ServiceConfig);
    } catch (e) {
      // Fallback on error
    }
  }
  return getLocalServices();
}

export async function addServiceConfig(serviceData: Omit<ServiceConfig, 'id' | 'createdAt'>): Promise<ServiceConfig> {
  const newService: ServiceConfig = {
    id: `svc_${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...serviceData,
  };

  if (useFirestore) {
    try {
      const collection = await getServicesCollection();
      await collection.doc(newService.id).set(newService);
      return newService;
    } catch (e) {
      // Fallback on error
    }
  }
  
  const services = await getLocalServices();
  services.push(newService);
  await saveLocalServices(services);
  return newService;
}

export async function updateServiceConfig(updatedService: ServiceConfig): Promise<void> {
  if (useFirestore) {
    try {
      const collection = await getServicesCollection();
      const serviceRef = collection.doc(updatedService.id);
      await serviceRef.update(updatedService as { [key: string]: any });
      return;
    } catch (e) {
        // Fallback on error
    }
  }

  const services = await getLocalServices();
  const index = services.findIndex(s => s.id === updatedService.id);
  if (index !== -1) {
    services[index] = updatedService;
    await saveLocalServices(services);
  } else {
    throw new Error(`Service with id ${updatedService.id} not found.`);
  }
}

export async function getActiveServiceUrl(type: 'ollama' | 'stable-diffusion-a1111'): Promise<string> {
    const configs = await getServiceConfigs();
    const service = configs.find(s => s.type === type && s.status === 'active');
    
    if (!service) {
        throw new Error(`No active service configuration found for type "${type}". Please configure one in the Services tab.`);
    }

    return service.targetUrl;
}

export async function saveServiceConfigs(services: ServiceConfig[]): Promise<void> {
    if (useFirestore) {
        try {
            const collection = await getServicesCollection();
            const batch = db.batch();
            // Delete existing services first to handle removals
            const snapshot = await collection.get();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            // Add new services
            services.forEach(service => {
                const docRef = collection.doc(service.id);
                batch.set(docRef, service);
            });
            await batch.commit();
            console.log(`[Service Config] Successfully saved ${services.length} services to Firestore.`);
            return;
        } catch (e) {
            // fallback
        }
    }
    await saveLocalServices(services);
    console.log(`[Service Config] Successfully saved ${services.length} services to local file.`);
}
