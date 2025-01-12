declare module 'node-roon-api' {
  interface RoonApiOptions {
    extension_id: string;
    display_name: string;
    display_version: string;
    publisher: string;
    email: string;
    website: string;
    log_level?: string;
    core_paired?: (core: RoonCore) => void;
    core_unpaired?: (core: RoonCore) => void;
  }

  interface RoonCore {
    services: Record<string, any>;
    display_name: string;
    display_version: string;
  }

  class RoonApi {
    constructor(options: RoonApiOptions);
    init_services(options: { required_services: any[] }): void;
    start_discovery(): void;
    stop_discovery(): void;
  }

  export = RoonApi;
}

declare module 'node-roon-api-transport' {
  interface Zone {
    zone_id: string;
    display_name: string;
    state: 'playing' | 'paused' | 'stopped';
    now_playing?: {
      two_line: {
        line1: string;
        line2: string;
      };
      three_line: {
        line1: string;
        line2: string;
        line3: string;
      };
      length: number;
      seek_position: number;
      image_key?: string;
      artist_image_keys?: string[];
    };
  }

  interface TransportApi {
    subscribe_zones(callback: (response: string, data?: { zones: Record<string, Zone> }) => void): void;
  }

  const transport: { prototype: TransportApi };
  export = transport;
}

declare module 'node-roon-api-image' {
  interface ImageData {
    image: Buffer;
    content_type: string;
  }

  interface ImageApi {
    get_image(key: string, cb: (error: Error | null, image: ImageData | null) => void): void;
  }

  const image: { prototype: ImageApi };
  export = image;
}

interface WrappedData {
  totalPlays: number;
  uniqueArtists: number;
  uniqueAlbums: number;
  uniqueTracks: number;
  patterns: {
    hourly: number[];
    weekday: number[];
    peakHour: number;
  };
  stats: {
    topArtists: Array<{ name: string; count: number; key: string }>;
    topAlbums: Array<{ name: string; artist: string; count: number; key: string }>;
    topTracks: Array<{ title: string; artist: string; count: number; key: string }>;
    topGenres: Array<{ name: string; count: number }>;
  };
} 