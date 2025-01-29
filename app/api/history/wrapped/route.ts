import {
  NextRequest,
  NextResponse,
} from 'next/server';

const ROON_SERVER_PORT = process.env.ROON_SERVER_PORT || '3003';
const ROON_SERVER_HOST = process.env.ROON_SERVER_HOST || 'localhost';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'all';
    
    console.log('[Frontend API] Received request for period:', period);
    
    const url = `http://${ROON_SERVER_HOST}:${ROON_SERVER_PORT}/api/history/wrapped?period=${period}`;
    console.log(`[Frontend API] Fetching from backend:`, url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      console.error(`[Frontend API] Backend error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Failed to fetch wrapped data: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[Frontend API] Received data from backend:', {
      period,
      totalPlays: data.totalPlays,
      uniqueArtists: data.uniqueArtists,
      uniqueTracks: data.uniqueTracks
    });
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Frontend API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 