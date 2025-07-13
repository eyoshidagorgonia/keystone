
import { NextRequest, NextResponse } from 'next/server';
import { getApiKeys } from '@/lib/apiKeyService';
import { recordUsage } from '@/lib/metricsService';
import { recordConnection } from '@/lib/connectionLogService';


const OLLAMA_TARGET_URL = process.env.OLLAMA_TARGET_URL || 'http://host.docker.internal:11434';

async function handleProxyRequest(req: NextRequest, { params }: { params: { slug:string[] } }) {
  const path = params.slug.join('/');
  console.log(`[Proxy] Received ${req.method} request for /api/${path}`);

  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
      console.error('[Proxy] Unauthorized: Missing or invalid Authorization header.');
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid API key' }, { status: 401 });
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

    // Ollama endpoints are prefixed with /api
    const targetUrl = new URL(`${OLLAMA_TARGET_URL}/api/${path}`);
    
    const body = await req.json();

    console.log(`[Proxy] Forwarding request with model "${body.model}" to target: ${targetUrl.toString()} for key "${keyDetails.name}"`);

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log(`[Proxy] Received response with status ${response.status} from target for key "${keyDetails.name}".`);
    
    // Check if the response was successful. If not, forward the error response as text.
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Proxy] Target returned an error for key "${keyDetails.name}": ${response.status} ${errorText}`);
        return new NextResponse(errorText, { status: response.status, headers: { 'Content-Type': 'application/json' }, statusText: "Error from Ollama" });
    }
    
    // Asynchronously record usage without blocking the response
    recordUsage(keyDetails.id).catch(err => {
        console.error(`[Proxy] Failed to record usage for key ${keyDetails.id}:`, err);
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });

  } catch (error: any) {
    if (error instanceof SyntaxError) {
        console.error(`[Proxy] Invalid JSON in request body:`, error.message);
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    console.error(`[Proxy] Internal Server Error:`, error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}


export const POST = handleProxyRequest;
export const GET = handleProxyRequest;
export const PUT = handleProxyRequest;
export const DELETE = handleProxyRequest;
export const PATCH = handleProxyRequest;
