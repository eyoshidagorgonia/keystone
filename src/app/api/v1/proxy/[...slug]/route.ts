
import { NextRequest, NextResponse } from 'next/server';
import { getApiKeys } from '@/lib/apiKeyService';
import { recordUsage } from '@/lib/metricsService';
import { recordConnection } from '@/lib/connectionLogService';
import { getActiveServiceUrl } from '@/lib/serviceConfigService';

async function handleProxyRequest(req: NextRequest, { params }: { params: { slug:string[] } }) {
  const path = params.slug.join('/');
  console.log(`[Proxy] Received ${req.method} request for /api/${path}`);

  try {
    // 1. Authenticate the request
    const authorization = req.headers.get('Authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
      console.error('[Proxy] Unauthorized: Missing or invalid Authorization header.');
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid API key. Header should be in the format "Authorization: Bearer YOUR_API_KEY".' }, { status: 401 });
    }
    
    const apiKey = authorization.split(' ')[1];
    
    const apiKeys = await getApiKeys();
    const keyDetails = apiKeys.find(k => k.key === apiKey && k.status === 'active');

    if (!keyDetails) {
      console.error(`[Proxy] Unauthorized: Invalid or revoked API key: ...${apiKey.slice(-4)}`);
      return NextResponse.json({ error: 'Unauthorized: Invalid or revoked API key' }, { status: 401 });
    }
    
    console.log(`[Proxy] API key validated successfully for key name: "${keyDetails.name}"`);

    // Asynchronously record the connection without blocking the response
    recordConnection({ 
        keyId: keyDetails.id, 
        keyName: keyDetails.name, 
        path: `/api/${path}`,
        ip: req.ip,
        userAgent: req.headers.get('user-agent') ?? undefined,
        geo: req.geo ? { city: req.geo.city, country: req.geo.country } : undefined
    }).catch(err => {
        console.error(`[Proxy] Failed to record connection for key ${keyDetails.id}:`, err);
    });

    // 2. Get active service URL dynamically
    const ollamaTargetUrl = await getActiveServiceUrl('ollama');
    const targetUrl = new URL(`${ollamaTargetUrl}/api/${path}`);
    
    // 3. Forward the request
    const body = await req.json();
    console.log('[Proxy] Request Body:', JSON.stringify(body, null, 2));


    console.log(`[Proxy] Forwarding request with model "${body.model}" to target: ${targetUrl.toString()} for key "${keyDetails.name}"`);

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log(`[Proxy] Received response with status ${response.status} from target for key "${keyDetails.name}".`);
    const responseBodyText = await response.text();
    console.log('[Proxy] Ollama Response Body:', responseBodyText);
    
    if (!response.ok) {
        console.error(`[Proxy] Target returned an error for key "${keyDetails.name}": ${response.status} ${responseBodyText}`);
        return NextResponse.json({ error: 'Error from upstream service (Ollama)', details: responseBodyText }, { status: response.status });
    }
    
    // Asynchronously record usage without blocking the response
    recordUsage(keyDetails.id).catch(err => {
        console.error(`[Proxy] Failed to record usage for key ${keyDetails.id}:`, err);
    });

    const data = JSON.parse(responseBodyText);
    console.log('[Proxy] Final Response Body to Client:', JSON.stringify(data, null, 2));

    return NextResponse.json(data, { status: response.status });

  } catch (error: any) {
    if (error.message.includes('No active service configuration found')) {
      console.error(`[Proxy] Configuration Error:`, error.message);
      return NextResponse.json({ error: 'Service Not Configured', details: error.message }, { status: 503 });
    }
    if (error instanceof SyntaxError) {
        console.error(`[Proxy] Invalid JSON in request body:`, error.message);
        return NextResponse.json({ error: 'Invalid request body. The provided JSON is malformed.' }, { status: 400 });
    }
    console.error(`[Proxy] Internal Server Error:`, error);
    return NextResponse.json({ error: 'An unexpected internal error occurred.', details: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { slug: string[] } }) {
    const path = params.slug.join('/');
    console.warn(`[Proxy] Blocked unsupported GET request for /api/${path}`);
    return NextResponse.json(
        { 
          error: 'Method Not Allowed',
          details: `The endpoint at /api/${path} does not support GET requests. Please use POST.`
        },
        { status: 405 }
    );
}

export const POST = handleProxyRequest;
export const PUT = handleProxyRequest;
export const DELETE = handleProxyRequest;
export const PATCH = handleProxyRequest;
