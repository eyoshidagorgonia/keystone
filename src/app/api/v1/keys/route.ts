
import { NextResponse } from 'next/server';
import { getApiKeys } from '@/lib/apiKeyService';

export async function GET() {
  try {
    const keys = await getApiKeys();
    return NextResponse.json(keys);
  } catch (error: any) {
    console.error(`[Keys API] Failed to retrieve API keys:`, error);
    return NextResponse.json({ error: 'Failed to retrieve API keys from the data store.', details: error.message }, { status: 500 });
  }
}
