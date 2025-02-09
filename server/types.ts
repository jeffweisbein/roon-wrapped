export interface Track {
  title: string;
  artist: string;
  album: string;
  duration: number;
  zone: string;
  seek_position: number;
  state: 'playing' | 'paused' | 'loading' | 'stopped';
  key: string;
  genres: string[];
  timestamp: number;
  image_key?: string;
  year?: number;
  bpm?: number;
}

export interface NowPlayingTrack {
  title: string;
  artist: string;
  album: string;
  key: string;
  state: Track['state'];
  zone: string;
  seek_position: number;
  length: number;
  artist_image_keys: string[];
}

export interface RoonState {
  core: any;
  services: {
    transport: any;
    image: any;
  };
  zones: Record<string, any>;
  nowPlaying: NowPlayingTrack[];
  status: {
    connected: boolean;
    lastUpdate: string;
    error?: string;
  };
}

export interface ImageData {
  content_type: string;
  image: Buffer;
  timestamp: number;
}

export type RoonEvent = 
  | { type: 'CORE_PAIRED'; core: any }
  | { type: 'CORE_UNPAIRED' }
  | { type: 'ZONES_UPDATED'; zones: any }
  | { type: 'NOW_PLAYING_UPDATED'; tracks: NowPlayingTrack[] }; 