
import { NextResponse } from 'next/server';
import { getRecentConnections } from '@/lib/connectionLogService';

export async function GET() {
  try {
    const connections = await getRecentConnections(10); // Fetch more for the dashboard
    return NextResponse.json(connections);
  } catch (error: any) {
    console.error(`[Connections API] Failed to retrieve connections:`, error);
    return NextResponse.json({ error: 'Failed to retrieve connection logs from the data store.', details: error.message }, { status: 500 });
  }
}
