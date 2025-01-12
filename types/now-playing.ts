export interface NowPlayingTrack {
    title: string;
    artist: string;
    album: string;
    key: string;
    state: 'playing' | 'paused' | 'loading' | 'stopped';
    zone: string;
    seek_position: number;
    length: number;
    artist_image_keys: string[];
} 