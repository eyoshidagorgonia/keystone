
import { NextRequest, NextResponse } from 'next/server';
import { getApiKeys } from '@/lib/apiKeyService';
import { recordConnection } from '@/lib/connectionLogService';
import { recordUsage } from '@/lib/metricsService';
import { z } from 'zod';
import { getActiveServiceUrl } from '@/lib/serviceConfigService';

const Txt2ImgRequestSchema = z.object({
  prompt: z.string(),
  override_settings: z.record(z.any()).optional(),
}).passthrough();


export async function POST(req: NextRequest) {
  const endpointPath = '/sdapi/v1/txt2img';
  console.log(`[SD Proxy] Received POST request for ${endpointPath}`);

  try {
    // 1. Authenticate the request
    const authorization = req.headers.get('Authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
      console.error('[SD Proxy] Unauthorized: Missing or invalid Authorization header.');
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid API key. Header should be in the format "Authorization: Bearer YOUR_API_KEY".' }, { status: 401 });
    }
    
    const apiKey = authorization.split(' ')[1];
    const apiKeys = await getApiKeys();
    const keyDetails = apiKeys.find(k => k.key === apiKey && k.status === 'active');

    if (!keyDetails) {
      console.error(`[SD Proxy] Unauthorized: Invalid or revoked API key: ...${apiKey.slice(-4)}`);
      return NextResponse.json({ error: 'Unauthorized: Invalid or revoked API key' }, { status: 401 });
    }
    console.log(`[SD Proxy] API key validated for: "${keyDetails.name}"`);

    // Asynchronously record connection & usage
    recordConnection({ 
        keyId: keyDetails.id, 
        keyName: keyDetails.name, 
        path: `/api/v1/sd/txt2img`,
        ip: req.ip,
        userAgent: req.headers.get('user-agent') ?? undefined,
        geo: req.geo ? { city: req.geo.city, country: req.geo.country } : undefined
    }).catch(err => console.error(`[SD Proxy] Failed to record connection for key ${keyDetails.id}:`, err));
    
    recordUsage(keyDetails.id).catch(err => console.error(`[SD Proxy] Failed to record usage for key ${keyDetails.id}:`, err));
    
    // 2. Validate and parse the request body
    const body = await req.json();
    console.log('[SD Proxy] Request Body:', JSON.stringify(body, null, 2));

    const validationResult = Txt2ImgRequestSchema.safeParse(body);

    if (!validationResult.success) {
      console.error('[SD Proxy] Invalid request body:', validationResult.error.errors);
      return NextResponse.json({ error: 'Invalid request body', details: validationResult.error.flatten() }, { status: 400 });
    }
    
    const modelName = body.override_settings?.sd_model_checkpoint || 'default';
    console.log(`[SD Proxy] Forwarding request to Stable Diffusion with model "${modelName}" for key "${keyDetails.name}"`);

    // 3. Get active service URL and call Stable Diffusion API
    const sdTargetUrl = await getActiveServiceUrl('stable-diffusion-a1111');
    const targetUrl = new URL(`${sdTargetUrl}${endpointPath}`);
    const sdResponse = await fetch(targetUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    const responseBodyText = await sdResponse.text();
    console.log('[SD Proxy] Stable Diffusion Response Body:', responseBodyText);

    if (!sdResponse.ok) {
        console.error(`[SD Proxy] Stable Diffusion returned an error: ${sdResponse.status} ${responseBodyText}`);
        return NextResponse.json({ error: 'Error from upstream service (Stable Diffusion)', details: responseBodyText }, { status: sdResponse.status });
    }

    const sdResult = JSON.parse(responseBodyText);
    console.log('[SD Proxy] Received successful response from Stable Diffusion.');

    return NextResponse.json(sdResult);

  } catch (error: any)    {
    if (error.message.includes('No active service configuration found')) {
      console.error(`[SD Proxy] Configuration Error:`, error.message);
      return NextResponse.json({ error: 'Service Not Configured', details: error.message }, { status: 503 });
    }
    if (error instanceof SyntaxError) {
        console.error(`[SD Proxy] Invalid JSON in request body:`, error.message);
        return NextResponse.json({ error: 'Invalid request body. The provided JSON is malformed.' }, { status: 400 });
    }
    console.error(`[SD Proxy] Internal Server Error:`, error);
    return NextResponse.json({ error: 'An unexpected internal error occurred.', details: error.message }, { status: 500 });
  }
}
