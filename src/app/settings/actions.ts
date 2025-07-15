
'use server'

import { revalidatePath } from 'next/cache'
import { getApiKeys, saveApiKeys } from '@/lib/apiKeyService'
import { getServiceConfigs, saveServiceConfigs } from '@/lib/serviceConfigService'
import { z } from 'zod'

const ApiKeySchema = z.object({
  id: z.string(),
  name: z.string(),
  key: z.string(),
  status: z.enum(['active', 'revoked']),
  createdAt: z.string().datetime(),
  lastUsed: z.string().datetime().nullable(),
  usage: z.number(),
  rateLimit: z.number(),
});

const ServiceConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['ollama', 'stable-diffusion-a1111']),
  targetUrl: z.string().url(),
  status: z.enum(['active', 'inactive']),
  createdAt: z.string().datetime(),
  apiKey: z.string().optional().or(z.literal('')),
  supportedModels: z.string().optional(),
});

const ImportDataSchema = z.object({
  apiKeys: z.array(ApiKeySchema),
  services: z.array(ServiceConfigSchema),
});


export async function exportAllData() {
  console.log('[Settings Action] Exporting all data...');
  const apiKeys = await getApiKeys()
  const services = await getServiceConfigs()
  console.log(`[Settings Action] Found ${apiKeys.length} keys and ${services.length} services.`);
  return { apiKeys, services }
}


export async function importAllData(data: unknown) {
    console.log('[Settings Action] Starting data import from file...');
    
    const validationResult = ImportDataSchema.safeParse(data);

    if (!validationResult.success) {
        console.error('[Settings Action] Import validation failed:', validationResult.error.flatten());
        throw new Error(`Invalid data structure. ${validationResult.error.flatten().formErrors.join(', ')}`);
    }

    const { apiKeys, services } = validationResult.data;
    
    console.log(`[Settings Action] Importing ${apiKeys.length} keys and ${services.length} services.`);

    // Use Promise.all to write both files concurrently
    await Promise.all([
        saveApiKeys(apiKeys),
        saveServiceConfigs(services)
    ]);
    
    console.log('[Settings Action] Data import successful. Revalidating paths.');

    // Revalidate all relevant paths
    revalidatePath('/settings');
    revalidatePath('/keys');
    revalidatePath('/services');
    revalidatePath('/documentation');
    revalidatePath('/');
}

export async function importAllDataFromString(jsonString: string) {
    console.log('[Settings Action] Starting data import from text...');
    try {
        const data = JSON.parse(jsonString);
        await importAllData(data);
    } catch (error: any) {
        if (error instanceof SyntaxError) {
            console.error('[Settings Action] Import from text failed: Invalid JSON format.', error);
            throw new Error('Invalid JSON format. Please check the pasted text.');
        }
        console.error('[Settings Action] Import from text failed:', error);
        // Re-throw Zod validation errors or other errors from importAllData
        throw error;
    }
}
