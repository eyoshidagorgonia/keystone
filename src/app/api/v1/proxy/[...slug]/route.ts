
import { NextRequest, NextResponse } from 'next/server';
import { getApiKeys } from '@/lib/apiKeyService';

const OLLAMA_TARGET_URL = process.env.OLLAMA_TARGET_URL || 'http://host.docker.internal:11434';

export async function POST(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const path = params.slug.join('/');
  console.log(`[Proxy] Received POST request for /${path}`);

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

    const targetUrl = new URL(`${OLLAMA_TARGET_URL}/${path}`);
    console.log(`[Proxy] Forwarding request to target: ${targetUrl.toString()}`);

    const body = await req.json();

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log(`[Proxy] Received response with status ${response.status} from target.`);
    
    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });

  } catch (error: any) {
    console.error('[Proxy] Internal Server Error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { slug: string[] } }) {
    const path = params.slug.join('/');
    console.log(`[Proxy] Received GET request for /${path}. Method not allowed.`);
    return NextResponse.json({ error: 'GET method not supported on this proxy' }, { status: 405 });
}
