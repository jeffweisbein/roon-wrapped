import { NextResponse } from 'next/server';

const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
const LASTFM_API_URL = 'http://ws.audioscrobbler.com/2.0/';

interface LastFmTrackInfo {
  listeners: string;
  playcount: string;
  duration: string;
}

interface LastFmArtistInfo {
  stats: {
    listeners: string;
    playcount: string;
  };
}

async function getTrackInfo(artist: string, track: string): Promise<LastFmTrackInfo | null> {
  try {
    const response = await fetch(
      `${LASTFM_API_URL}?method=track.getInfo&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&api_key=${LASTFM_API_KEY}&format=json`
    );
    const data = await response.json();
    return data.track;
  } catch (error) {
    console.error('[LastFM] Error fetching track info:', error);
    return null;
  }
}

async function getArtistInfo(artist: string): Promise<LastFmArtistInfo | null> {
  try {
    const response = await fetch(
      `${LASTFM_API_URL}?method=artist.getInfo&artist=${encodeURIComponent(artist)}&api_key=${LASTFM_API_KEY}&format=json`
    );
    const data = await response.json();
    return data.artist;
  } catch (error) {
    console.error('[LastFM] Error fetching artist info:', error);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const artist = searchParams.get('artist');
    const track = searchParams.get('track');

    if (!LASTFM_API_KEY) {
      return NextResponse.json(
        { error: 'LastFM API key not configured' },
        { status: 500 }
      );
    }

    if (!artist) {
      return NextResponse.json(
        { error: 'Artist parameter is required' },
        { status: 400 }
      );
    }

    const [artistInfo, trackInfo] = await Promise.all([
      getArtistInfo(artist),
      track ? getTrackInfo(artist, track) : null,
    ]);

    return NextResponse.json({
      artist: artistInfo,
      track: trackInfo,
    });
  } catch (error) {
    console.error('[LastFM] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch LastFM data' },
      { status: 500 }
    );
  }
} 