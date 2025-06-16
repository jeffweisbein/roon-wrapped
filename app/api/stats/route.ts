import {
  NextRequest,
  NextResponse,
} from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get("period") || "all";

  try {
    console.log(`[API] Fetching stats for period: ${period}`);
    const response = await fetch(`http://localhost:3003/api/history/wrapped?period=${period}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Cache-Control": "no-store",
      },
      cache: "no-store",
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[API] Received wrapped data for period ${period}:`, data);
    
    // Map wrapped endpoint fields to stats fields
    const stats = {
      totalPlays: data.totalTracksPlayed || 0,
      uniqueArtists: data.uniqueArtistsCount || 0,
      uniqueTracks: data.uniqueTracksCount || 0,
      totalPlaytime: data.totalListeningTimeSeconds || 0,
    };
    
    console.log(`[API] Mapped stats:`, stats);
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
} 
