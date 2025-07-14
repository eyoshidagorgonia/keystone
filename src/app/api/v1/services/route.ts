
import { NextRequest, NextResponse } from 'next/server';
import { getServiceConfigs, addServiceConfig, updateServiceConfig } from '@/lib/serviceConfigService';
import { z } from 'zod';
import { getApiKeys } from '@/lib/apiKeyService';


const serviceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  type: z.enum(['ollama', 'stable-diffusion-a1111']),
  targetUrl: z.string().url(),
  status: z.enum(['active', 'inactive']),
});


async function checkAdminAuth(req: NextRequest) {
    // In a real app, you would have a proper user session check.
    // For now, we'll just allow requests from the admin UI's origin.
    // This is a simplified check for the purpose of this example.
    const origin = req.headers.get('origin');
    const host = req.headers.get('host');
    const referer = req.headers.get('referer');
    
    // This isn't perfectly secure, but it's a reasonable check for an internal admin dashboard
    // to prevent simple CSRF attacks from other sites.
    if (referer && new URL(referer).host === host) {
        return true;
    }

    return false;
}

export async function GET(req: NextRequest) {
  if (!await checkAdminAuth(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const services = await getServiceConfigs();
    return NextResponse.json(services);
  } catch (error: any) {
    console.error(`[Services API] Failed to retrieve services:`, error);
    return NextResponse.json({ error: 'Failed to retrieve services from the data store.', details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
   if (!await checkAdminAuth(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }

  try {
    const body = await req.json();
    const validationResult = serviceSchema.omit({ id: true }).safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validationResult.error.flatten() }, { status: 400 });
    }

    const newService = await addServiceConfig(validationResult.data);
    return NextResponse.json(newService, { status: 201 });

  } catch (error: any) {
    console.error(`[Services API] Failed to create service:`, error);
    return NextResponse.json({ error: 'Failed to create service.', details: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
   if (!await checkAdminAuth(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }

  try {
    const body = await req.json();
    const validationResult = serviceSchema.extend({ createdAt: z.string() }).safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validationResult.error.flatten() }, { status: 400 });
    }

    await updateServiceConfig(validationResult.data);
    return NextResponse.json(validationResult.data, { status: 200 });

  } catch (error: any) {
    console.error(`[Services API] Failed to update service:`, error);
    return NextResponse.json({ error: 'Failed to update service.', details: error.message }, { status: 500 });
  }
}
