import { NextResponse } from 'next/server';

const ROON_SERVER_PORT = process.env.ROON_SERVER_PORT || '3003';
const ROON_SERVER_HOST = process.env.ROON_SERVER_HOST || 'localhost';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const response = await fetch(`http://${ROON_SERVER_HOST}:${ROON_SERVER_PORT}/api/roon/now-playing`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Disable caching for real-time data
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch now playing: ${response.status} ${response.statusText}`);
    }

    const serverResponse = await response.json();
    console.log('[Frontend API] Server response:', serverResponse);
    
    // Extract the actual data from the server's response format
    const nowPlayingData = serverResponse.success ? serverResponse.data : serverResponse;
    
    return NextResponse.json(nowPlayingData, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('[Frontend API] Error fetching now playing:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 