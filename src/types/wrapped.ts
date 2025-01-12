export interface TopArtist {
  name: string;
  playCount: number;
  topTrack: string;
}

export interface TopTrack {
  title: string;
  artist: string;
  album: string;
  playCount: number;
}

export interface ListeningHabits {
  totalMinutes: number;
  averagePerDay: number;
  mostActiveDay: string;
  mostActiveTime: string;
}

export interface WrappedData {
  topTracks: TopTrack[];
  topArtists: TopArtist[];
  listeningHabits: ListeningHabits;
} 