export interface Track {
  title: string;
  artist: string;
  count: number;
}

export interface NowPlayingTrack {
  title: string;
  artist: string;
  album: string;
  zone: string;
  imageKey: string;
}

export interface WrappedData {
  totalTracks: number;
  uniqueTracks: number;
  uniqueArtists: number;
  uniqueAlbums: number;
  totalHours: number;
  patterns: {
    hourly: number[];
    weekday: number[];
    peakHour: number;
    peakDay: number;
  };
  streaks: {
    current: number;
    longest: number;
  };
  stats: {
    daily: Array<{ date: string; count: number }>;
    monthly: Array<{ month: string; count: number }>;
    topArtists: Array<{
      name: string;
      count: number;
      image_key: string | null;
    }>;
    topTracks: Array<{
      title: string;
      artist: string;
      count: number;
      image_key: string | null;
    }>;
    topAlbums: Array<{
      name: string;
      artist: string;
      count: number;
      image_key: string | null;
    }>;
    topGenres: Array<{ name: string; count: number }>;
  };
}
