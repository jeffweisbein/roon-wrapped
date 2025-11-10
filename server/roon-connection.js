const RoonApi = require("node-roon-api");
const RoonApiTransport = require("node-roon-api-transport");
const RoonApiImage = require("node-roon-api-image");
const { env } = require("./env-validation");
const { historyService } = require("./history-service");
const { milestoneTracker } = require("./services/artist-milestone-tracker");

class RoonConnection {
  constructor() {
    // Track currently playing song
    this.currentTrack = null;
    this.trackTimer = null;
    this.zoneSubscription = null;

    // Initialize Roon API with required info
    this.roon = new RoonApi({
      extension_id: env.ROON_EXTENSION_ID,
      display_name: env.ROON_DISPLAY_NAME,
      display_version: env.ROON_DISPLAY_VERSION,
      publisher: env.ROON_PUBLISHER,
      email: env.ROON_EMAIL,
      log_level: "none",
      core_paired: (core) => {
        console.log("[Roon] Core paired:", core.display_name);
        this.core = core;
        this.transport = core.services.RoonApiTransport;

        // Subscribe to zone updates
        this.zoneSubscription = this.transport.subscribe_zones(
          (response, msg) => {
            try {
              if (response === "Subscribed") {
                console.log("[Roon] Subscribed to zone updates");
              } else if (response === "Changed") {
                this.handleZoneUpdate(msg);
              } else if (response === "Unsubscribed") {
                console.log("[Roon] Unsubscribed from zone updates");
                this.zoneSubscription = null;
              }
            } catch (error) {
              console.error(
                "[Roon] Error in zone subscription handler:",
                error,
              );
            }
          },
        );
      },
      core_unpaired: (core) => {
        console.log("[Roon] Core unpaired");
        this.cleanup();
        this.core = null;
        this.transport = null;
      },
    });

    this.core = null;
    this.transport = null;

    // Initialize required services
    this.roon.init_services({
      required_services: [RoonApiTransport, RoonApiImage],
      provided_services: [],
    });

    // Start discovery immediately
    this.start();
  }

  start() {
    if (!this.isConnected()) {
      console.log("[Roon] Starting discovery...");
      this.roon.start_discovery();
    }
  }

  cleanup() {
    console.log("[Roon] Cleaning up connection...");

    // Clear any track timer
    if (this.trackTimer) {
      clearTimeout(this.trackTimer);
      this.trackTimer = null;
    }

    // Unsubscribe from zones if needed
    if (this.zoneSubscription && this.transport) {
      try {
        this.transport.unsubscribe_zones(this.zoneSubscription);
        this.zoneSubscription = null;
      } catch (error) {
        console.error("[Roon] Error unsubscribing from zones:", error);
      }
    }

    // Clear current track
    this.currentTrack = null;

    // Stop discovery
    if (this.roon) {
      this.roon.stop_discovery();
    }
  }

  // Helper function to safely extract track information from now_playing data
  extractTrackInfo(now_playing) {
    if (!now_playing) return null;

    // Try to get track info from different possible structures
    let title = "Unknown Title";
    let artist = "Unknown Artist";
    let album = "Unknown Album";

    // Method 1: Check three_line structure (most common)
    if (now_playing.three_line) {
      title = now_playing.three_line.line1 || title;
      artist = now_playing.three_line.line2 || artist;
      album = now_playing.three_line.line3 || album;
    }

    // Method 2: Check direct properties as fallback
    if (title === "Unknown Title" && now_playing.title) {
      title = now_playing.title;
    }
    if (artist === "Unknown Artist" && now_playing.artist) {
      artist = now_playing.artist;
    }
    if (album === "Unknown Album" && now_playing.album) {
      album = now_playing.album;
    }

    // Method 3: Check one_line structure as another fallback
    if (now_playing.one_line && title === "Unknown Title") {
      title = now_playing.one_line.line1 || title;
    }

    // Method 4: Check two_line structure
    if (now_playing.two_line) {
      if (title === "Unknown Title")
        title = now_playing.two_line.line1 || title;
      if (artist === "Unknown Artist")
        artist = now_playing.two_line.line2 || artist;
    }

    // Clean up any empty strings
    title = title && title.trim() !== "" ? title.trim() : "Unknown Title";
    artist = artist && artist.trim() !== "" ? artist.trim() : "Unknown Artist";
    album = album && album.trim() !== "" ? album.trim() : "Unknown Album";

    return { title, artist, album };
  }

  handleZoneUpdate(msg) {
    if (!msg.zones_changed) return;

    msg.zones_changed.forEach(async (zone) => {
      if (zone.state === "playing" && zone.now_playing) {
        // Ensure history service is initialized
        await historyService.initialize();

        // Extract track info safely
        const trackInfo = this.extractTrackInfo(zone.now_playing);
        if (!trackInfo) {
          console.log(
            "[Roon] Could not extract track info from:",
            zone.now_playing,
          );
          return;
        }

        const track = {
          title: trackInfo.title,
          artist: trackInfo.artist,
          album: trackInfo.album,
          length: zone.now_playing.length || 0,
          image_key: zone.now_playing.image_key,
          genres: zone.now_playing.genres || [],
          year: zone.now_playing.release_date
            ? new Date(zone.now_playing.release_date).getFullYear()
            : undefined,
          bpm: zone.now_playing.tempo,
          zone: zone.display_name,
        };

        // Validate track has minimum required info
        if (!track.title || track.title === "Unknown Title") {
          console.log("[Roon] Skipping track with no title:", track);
          return;
        }

        // If this is a new track, start tracking it
        const trackKey = `${track.title}-${track.artist}`;
        if (!this.currentTrack || this.currentTrack.key !== trackKey) {
          console.log("[Roon] New track started:", track);

          // Clear any existing timer
          if (this.trackTimer) {
            clearTimeout(this.trackTimer);
          }

          // Start tracking this track
          this.currentTrack = {
            ...track,
            key: trackKey,
            startTime: Date.now(),
          };

          // Set timer for 20 seconds
          this.trackTimer = setTimeout(async () => {
            console.log(
              "[Roon] Track played for 20s, logging:",
              this.currentTrack,
            );
            const trackData = {
              title: this.currentTrack.title,
              artist: this.currentTrack.artist,
              album: this.currentTrack.album,
              length: this.currentTrack.length,
              image_key: this.currentTrack.image_key,
              genres: this.currentTrack.genres,
              year: this.currentTrack.year,
              bpm: this.currentTrack.bpm,
              zone: this.currentTrack.zone,
              timestamp: Date.now(),
            };
            
            // Add to history
            await historyService.addTrack(trackData);
            
            // Track milestone progress
            await milestoneTracker.initialize();
            await milestoneTracker.trackPlay(trackData);
          }, 20 * 1000);
        }
      } else if (zone.state !== "playing" && this.trackTimer) {
        // If playback stopped, clear the timer
        clearTimeout(this.trackTimer);
        this.trackTimer = null;
        this.currentTrack = null;
      }
    });
  }

  isConnected() {
    const connected = !!(this.core && this.transport);
    console.log("[Roon] Connection check:", {
      core: !!this.core,
      transport: !!this.transport,
      connected,
    });
    return connected;
  }

  getDetailedState() {
    return {
      connected: this.isConnected(),
      core_name: this.core?.display_name || null,
    };
  }

  getNowPlaying() {
    if (!this.isConnected()) return null;

    // Use a safer method to get zones if available
    const zones = this.transport._zones || {};
    if (Object.keys(zones).length === 0) return null;

    const playingZone = Object.values(zones).find(
      (zone) => zone.state === "playing" && zone.now_playing,
    );

    if (!playingZone) return null;

    const { now_playing } = playingZone;

    // Extract track info safely
    const trackInfo = this.extractTrackInfo(now_playing);
    if (!trackInfo) {
      console.log(
        "[Roon] Could not extract track info for now playing:",
        now_playing,
      );
      return null;
    }

    return {
      title: trackInfo.title,
      artist: trackInfo.artist,
      album: trackInfo.album,
      length: now_playing.length || 0,
      image_key: now_playing.image_key,
      seek_position: now_playing.seek_position || 0,
      zone_name: playingZone.display_name,
      // Additional metadata
      genres: now_playing.genres || [],
      year: now_playing.release_date
        ? new Date(now_playing.release_date).getFullYear()
        : null,
      bpm: now_playing.tempo || null,
      state: playingZone.state,
    };
  }

  async getImage(image_key) {
    if (!this.core || !image_key) return null;

    return new Promise((resolve, reject) => {
      this.core.services.RoonApiImage.get_image(
        image_key,
        { scale: "fit", width: 300, height: 300, format: "image/jpeg" },
        (error, contentType, image) => {
          if (error) {
            // NotFound is expected for old or invalid image keys
            if (error === "NotFound") {
              console.log(`[Roon] Image not found for key: ${image_key}`);
              resolve(null);  // Return null instead of rejecting
            } else {
              console.error("[Roon] Error getting image:", error);
              reject(error);
            }
          } else if (!image) {
            // Handle case where no image data is returned
            console.log(`[Roon] No image data for key: ${image_key}`);
            resolve(null);
          } else {
            resolve({
              content_type: contentType,
              image: image,
            });
          }
        },
      );
    });
  }

  // Add method to get connection status for API
  getConnectionStatus() {
    const zones = this.transport?._zones || {};
    return {
      connected: this.isConnected(),
      core_name: this.core?.display_name || null,
      zones_count: Object.keys(zones).length,
      current_track: this.currentTrack
        ? {
            title: this.currentTrack.title,
            artist: this.currentTrack.artist,
            zone: this.currentTrack.zone,
          }
        : null,
    };
  }
}

const roonConnection = new RoonConnection();
module.exports = { roonConnection };
