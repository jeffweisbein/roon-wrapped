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

    const rawData = await response.text();
    console.log('[Frontend API] Raw response:', rawData);

    let data;
    try {
      data = JSON.parse(rawData);
    } catch (error) {
      console.error('[Frontend API] Failed to parse JSON response:', error);
      return NextResponse.json(
        { error: 'Invalid JSON response from backend' },
        { status: 500 }
      );
    }

    console.log('[Frontend API] Parsed data structure:', {
      hasData: !!data,
      keys: Object.keys(data),
      totalTracksPlayed: data.totalTracksPlayed,
      uniqueArtistsCount: data.uniqueArtistsCount,
      uniqueAlbumsCount: data.uniqueAlbumsCount,
      uniqueTracksCount: data.uniqueTracksCount,
      totalListeningTimeSeconds: data.totalListeningTimeSeconds,
      averageTracksPerDay: data.averageTracksPerDay,
      currentListeningStreakDays: data.currentListeningStreakDays,
      peakListeningHour: data.peakListeningHour,
      hasListeningPatterns: !!data.listeningPatterns,
      hasTopArtists: Array.isArray(data.topArtistsByPlays),
      hasTopAlbums: Array.isArray(data.topAlbumsByPlays),
      hasTopTracks: Array.isArray(data.topTracksByPlays),
    });

    if (!data.totalTracksPlayed && data.totalTracksPlayed !== 0) {
      console.warn('[Frontend API] Missing totalTracksPlayed in backend response');
    }

    // Ensure the response has the correct structure
    const wrappedData = {
      totalTracksPlayed: data.totalTracksPlayed || 0,
      uniqueArtistsCount: data.uniqueArtistsCount || 0,
      uniqueAlbumsCount: data.uniqueAlbumsCount || 0,
      uniqueTracksCount: data.uniqueTracksCount || 0,
      totalListeningTimeSeconds: data.totalListeningTimeSeconds || 0,
      averageTracksPerDay: data.averageTracksPerDay || 0,
      currentListeningStreakDays: data.currentListeningStreakDays || 0,
      peakListeningHour: data.peakListeningHour || 0,
      topArtistsByPlays: Array.isArray(data.topArtistsByPlays) ? data.topArtistsByPlays : [],
      topAlbumsByPlays: Array.isArray(data.topAlbumsByPlays) ? data.topAlbumsByPlays : [],
      topTracksByPlays: Array.isArray(data.topTracksByPlays) ? data.topTracksByPlays : [],
      topGenresByPlays: Array.isArray(data.topGenresByPlays) ? data.topGenresByPlays : [],
      listeningPatterns: {
        timeOfDay: data.listeningPatterns?.timeOfDay || {
          morningPlays: 0,
          afternoonPlays: 0,
          eveningPlays: 0,
          nightPlays: 0
        },
        dayOfWeekPlays: data.listeningPatterns?.dayOfWeekPlays || {
          sunday: 0,
          monday: 0,
          tuesday: 0,
          wednesday: 0,
          thursday: 0,
          friday: 0,
          saturday: 0
        }
      }
    };
    
    return NextResponse.json(wrappedData);
  } catch (error) {
    console.error('[Frontend API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 