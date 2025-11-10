const axios = require("axios");
const crypto = require("crypto");
const { env } = require("../env-validation");

// Simple logger wrapper
const logger = {
  info: (...args) => console.log("[MusicMetadata]", ...args),
  warn: (...args) => console.warn("[MusicMetadata]", ...args),
  error: (...args) => console.error("[MusicMetadata]", ...args),
};

class MusicMetadataService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

    // Last.fm API (free tier)
    this.lastFmApiKey = env.LASTFM_API_KEY || "";
    this.lastFmBaseUrl = "https://ws.audioscrobbler.com/2.0/";

    // MusicBrainz API (free, no key required)
    this.musicBrainzBaseUrl = "https://musicbrainz.org/ws/2/";
    this.musicBrainzUserAgent =
      "RoonWrapped/1.0.0 (https://github.com/jeffweisbein/roon-wrapped)";
  }

  getCacheKey(service, method, params) {
    const paramStr = JSON.stringify(params);
    return crypto
      .createHash("md5")
      .update(`${service}:${method}:${paramStr}`)
      .digest("hex");
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async fetchLastFm(method, params) {
    if (!this.lastFmApiKey) {
      logger.warn("Last.fm API key not configured");
      return null;
    }

    const cacheKey = this.getCacheKey("lastfm", method, params);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(this.lastFmBaseUrl, {
        params: {
          method,
          api_key: this.lastFmApiKey,
          format: "json",
          ...params,
        },
        timeout: 5000,
      });

      const data = response.data;
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      logger.error(`Last.fm API error for ${method}:`, error.message);
      return null;
    }
  }

  async fetchMusicBrainz(endpoint, params) {
    const cacheKey = this.getCacheKey("musicbrainz", endpoint, params);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // MusicBrainz requires 1 second between requests
      await this.rateLimitMusicBrainz();

      const response = await axios.get(
        `${this.musicBrainzBaseUrl}${endpoint}`,
        {
          params: {
            fmt: "json",
            ...params,
          },
          headers: {
            "User-Agent": this.musicBrainzUserAgent,
          },
          timeout: 5000,
        },
      );

      const data = response.data;
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      // Don't log 503 errors as they're expected when rate limited
      if (error.response?.status !== 503) {
        logger.error(`MusicBrainz API error for ${endpoint}:`, error.message);
      }
      return null;
    }
  }

  async rateLimitMusicBrainz() {
    const now = Date.now();
    if (this.lastMusicBrainzRequest) {
      const elapsed = now - this.lastMusicBrainzRequest;
      if (elapsed < 1000) {
        await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed));
      }
    }
    this.lastMusicBrainzRequest = Date.now();
  }

  // Get similar artists
  async getSimilarArtists(artistName, limit = 10) {
    const data = await this.fetchLastFm("artist.getSimilar", {
      artist: artistName,
      limit,
    });

    if (!data?.similarartists?.artist) return [];

    return data.similarartists.artist.map((artist) => ({
      name: artist.name,
      match: parseFloat(artist.match),
      mbid: artist.mbid || null,
    }));
  }

  // Get artist info with tags
  async getArtistInfo(artistName) {
    // Skip empty artist names
    if (!artistName || artistName.trim() === "") {
      return null;
    }

    try {
      // Try Last.fm first, fall back to cached data if MusicBrainz fails
      const lastFmData = await this.fetchLastFm("artist.getInfo", {
        artist: artistName,
      });

      // Only fetch MusicBrainz if we have a valid artist name
      let mbData = null;
      if (artistName.length > 2) {
        mbData = await this.searchMusicBrainzArtist(artistName);
      }

      const tags = lastFmData?.artist?.tags?.tag?.map((t) => t.name) || [];
      const genres = mbData?.genres || [];

      return {
        name: artistName,
        tags: [...new Set([...tags, ...genres])],
        bio: lastFmData?.artist?.bio?.summary || "",
        mbid: lastFmData?.artist?.mbid || mbData?.mbid || null,
        listeners: parseInt(lastFmData?.artist?.stats?.listeners) || 0,
        playcount: parseInt(lastFmData?.artist?.stats?.playcount) || 0,
      };
    } catch (error) {
      logger.error(
        `Error getting artist info for ${artistName}:`,
        error.message,
      );
      // Return basic info even if APIs fail
      return {
        name: artistName,
        tags: [],
        bio: "",
        mbid: null,
        listeners: 0,
        playcount: 0,
      };
    }
  }

  // Search MusicBrainz for artist
  async searchMusicBrainzArtist(artistName) {
    const data = await this.fetchMusicBrainz("artist/", {
      query: artistName,
      limit: 1,
    });

    if (!data?.artists?.length) return null;

    const artist = data.artists[0];
    return {
      mbid: artist.id,
      name: artist.name,
      genres: artist.tags?.map((t) => t.name) || [],
    };
  }

  // Get track info
  async getTrackInfo(artistName, trackName) {
    const data = await this.fetchLastFm("track.getInfo", {
      artist: artistName,
      track: trackName,
    });

    if (!data?.track) return null;

    return {
      name: data.track.name,
      artist: data.track.artist?.name || artistName,
      duration: parseInt(data.track.duration) || 0,
      listeners: parseInt(data.track.listeners) || 0,
      playcount: parseInt(data.track.playcount) || 0,
      tags: data.track.toptags?.tag?.map((t) => t.name) || [],
    };
  }

  // Get similar tracks
  async getSimilarTracks(artistName, trackName, limit = 10) {
    const data = await this.fetchLastFm("track.getSimilar", {
      artist: artistName,
      track: trackName,
      limit,
    });

    if (!data?.similartracks?.track) return [];

    return data.similartracks.track.map((track) => ({
      name: track.name,
      artist: track.artist?.name || "",
      match: parseFloat(track.match),
      duration: parseInt(track.duration) || 0,
    }));
  }

  // Extract basic audio features from track metadata
  extractBasicAudioFeatures(track) {
    // This is a simplified version - for real audio analysis you'd need actual audio files
    const features = {
      duration_ms: track.duration || 0,
      tempo: null, // Would need audio analysis
      energy: null, // Based on genre/tags heuristics
      danceability: null,
      valence: null, // Mood estimation
    };

    // Simple heuristics based on genre/tags
    const tags = track.tags || [];
    const lowerTags = tags.map((t) => t.toLowerCase());

    // Energy estimation
    if (
      lowerTags.some((tag) =>
        ["metal", "rock", "punk", "electronic"].includes(tag),
      )
    ) {
      features.energy = 0.8;
    } else if (
      lowerTags.some((tag) => ["ambient", "classical", "jazz"].includes(tag))
    ) {
      features.energy = 0.3;
    } else {
      features.energy = 0.5;
    }

    // Danceability estimation
    if (
      lowerTags.some((tag) =>
        ["dance", "electronic", "house", "techno", "disco"].includes(tag),
      )
    ) {
      features.danceability = 0.8;
    } else if (
      lowerTags.some((tag) =>
        ["classical", "ambient", "experimental"].includes(tag),
      )
    ) {
      features.danceability = 0.2;
    } else {
      features.danceability = 0.5;
    }

    // Valence (mood) estimation
    if (
      lowerTags.some((tag) =>
        ["happy", "upbeat", "cheerful", "party"].includes(tag),
      )
    ) {
      features.valence = 0.8;
    } else if (
      lowerTags.some((tag) =>
        ["sad", "melancholy", "dark", "depressing"].includes(tag),
      )
    ) {
      features.valence = 0.2;
    } else {
      features.valence = 0.5;
    }

    return features;
  }

  // Clear old cache entries
  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheExpiry) {
        this.cache.delete(key);
      }
    }
  }
}

module.exports = new MusicMetadataService();
