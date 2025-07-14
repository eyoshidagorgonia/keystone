
import { NextResponse } from 'next/server';
import { getMetrics } from '@/lib/metricsService';

export async function GET() {
  try {
    const metrics = await getMetrics();
    return NextResponse.json(metrics);
  } catch (error: any) {
    console.error(`[Metrics API] Failed to retrieve usage metrics:`, error);
    return NextResponse.json({ error: 'Failed to retrieve usage metrics from the data store.', details: error.message }, { status: 500 });
  }
}
