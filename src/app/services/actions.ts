
'use server'

import { revalidatePath } from 'next/cache'
import type { ServiceConfig } from '@/types'
import {
  addServiceConfig as addServiceToStore,
  updateServiceConfig as updateServiceInStore,
} from '@/lib/serviceConfigService'

export async function addService(serviceData: Omit<ServiceConfig, 'id' | 'createdAt'>): Promise<ServiceConfig> {
  const newService = await addServiceToStore(serviceData);
  revalidatePath('/services')
  return newService;
}

export async function updateService(service: ServiceConfig): Promise<void> {
    await updateServiceInStore(service);
    revalidatePath('/services');
}
