
import { NextRequest, NextResponse } from 'next/server';
import { getApiKeys, updateApiKey } from '@/lib/apiKeyService';
import { recordUsage } from '@/lib/metricsService';
import { recordConnection } from '@/lib/connectionLogService';


const OLLAMA_TARGET_URL = process.env.OLLAMA_TARGET_URL || 'http://host.docker.internal:11434';

async function handleProxyRequest(req: NextRequest, { params }: { params: { slug:string[] } }) {
  const path = params.slug.join('/');
  console.log(`[Proxy] Received ${req.method} request for /${path}`);

  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
      console.error('[Proxy] Unauthorized: Missing or invalid Authorization header.');
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid API key' }, { status: 401 });
    }
    
    const apiKey = authorization.split(' ')[1];
    console.log(`[Proxy] Attempting to validate API key: ...${apiKey.slice(-4)}`);

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

    console.log(`[Proxy] Forwarding request with model "${body.model}" to target: ${targetUrl.toString()}`);

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log(`[Proxy] Received response with status ${response.status} from target.`);
    
    // Check if the response was successful. If not, forward the error response as text.
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Proxy] Target returned an error: ${errorText}`);
        return new NextResponse(errorText, { status: response.status, headers: { 'Content-Type': 'text/plain' } });
    }
    
    // Asynchronously record usage without blocking the response
    recordUsage(keyDetails.id).catch(err => {
        console.error(`[Proxy] Failed to record usage for key ${keyDetails.id}:`, err);
    });

    // To ensure the recording happens even if the client disconnects, 
    // but without delaying the response to the user, we don't await the promise here.
    // In a serverless environment, you might need a more robust solution like a queue.

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });

  } catch (error: any) {
    // This will catch errors from our proxy logic, like failing to parse the incoming request body
    console.error(`[Proxy] Internal Server Error:`, error.message);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON in request body', details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}


export const POST = handleProxyRequest;
export const GET = handleProxyRequest;
export const PUT = handleProxyRequest;
export const DELETE = handleProxyRequest;
export const PATCH = handleProxyRequest;
