
import { NextResponse } from 'next/server';
import { getApiKeys } from '@/lib/apiKeyService';

export async function GET() {
  try {
    const keys = await getApiKeys();
    return NextResponse.json(keys);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to retrieve API keys', details: error.message }, { status: 500 });
  }
}
