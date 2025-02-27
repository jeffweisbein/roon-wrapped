const RoonApi = require('node-roon-api');
const RoonApiTransport = require('node-roon-api-transport');
const RoonApiImage = require('node-roon-api-image');
const { historyService } = require('./history-service');

class RoonConnection {
    constructor() {
        // Track currently playing song
        this.currentTrack = null;
        this.trackTimer = null;

        // Initialize Roon API with required info
        this.roon = new RoonApi({
            extension_id: process.env.ROON_EXTENSION_ID || 'com.roonwrapped',
            display_name: process.env.ROON_DISPLAY_NAME || 'Roon Wrapped',
            display_version: "1.0.0",
            publisher: "Jeff",
            email: "jeff@example.com",
            log_level: "none",
            core_paired: core => {
                console.log("[Roon] Core paired:", core.display_name);
                this.core = core;
                this.transport = core.services.RoonApiTransport;
                
                // Subscribe to zone updates
                this.transport.subscribe_zones((response, msg) => {
                    if (response === "Subscribed") {
                        console.log("[Roon] Subscribed to zone updates");
                    } else if (response === "Changed") {
                        this.handleZoneUpdate(msg);
                    }
                });
            },
            core_unpaired: core => {
                console.log("[Roon] Core unpaired");
                this.core = null;
                this.transport = null;
            }
        });

        this.core = null;
        this.transport = null;

        // Initialize required services
        this.roon.init_services({
            required_services: [RoonApiTransport, RoonApiImage],
            provided_services: []
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
        if (this.roon) {
            console.log("[Roon] Cleaning up connection...");
            this.roon.stop_discovery();
        }
    }

    handleZoneUpdate(msg) {
        if (!msg.zones_changed) return;
        
        msg.zones_changed.forEach(async zone => {
            if (zone.state === "playing" && zone.now_playing) {
                // Ensure history service is initialized
                await historyService.initialize();

                const track = {
                    title: zone.now_playing.three_line.line1,
                    artist: zone.now_playing.three_line.line2,
                    album: zone.now_playing.three_line.line3,
                    length: zone.now_playing.length,
                    image_key: zone.now_playing.image_key,
                    genres: zone.now_playing.genres || [],
                    year: zone.now_playing.release_date ? new Date(zone.now_playing.release_date).getFullYear() : undefined,
                    bpm: zone.now_playing.tempo,
                    zone: zone.display_name
                };

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
                        startTime: Date.now()
                    };

                    // Set timer for 20 seconds
                    this.trackTimer = setTimeout(async () => {
                        console.log("[Roon] Track played for 20s, logging:", this.currentTrack);
                        await historyService.addTrack({
                            ...this.currentTrack,
                            timestamp: Date.now()
                        });
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
        console.log('[Roon] Connection check:', { core: !!this.core, transport: !!this.transport, connected });
        return connected;
    }

    getDetailedState() {
        return {
            connected: this.isConnected(),
            core_name: this.core?.display_name || null
        };
    }

    getNowPlaying() {
        if (!this.transport || !this.transport._zones) return null;

        const playingZone = Object.values(this.transport._zones).find(zone => 
            zone.state === "playing" && zone.now_playing
        );

        if (!playingZone) return null;

        const { now_playing } = playingZone;
        return {
            title: now_playing.three_line.line1,
            artist: now_playing.three_line.line2,
            album: now_playing.three_line.line3,
            length: now_playing.length,
            image_key: now_playing.image_key,
            seek_position: now_playing.seek_position,
            zone_name: playingZone.display_name
        };
    }

    async getImage(image_key) {
        if (!this.core) return null;

        return new Promise((resolve, reject) => {
            this.core.services.RoonApiImage.get_image(
                image_key,
                { scale: 'fit', width: 300, height: 300, format: 'image/jpeg' },
                (error, contentType, image) => {
                    if (error) {
                        console.error('[Roon] Error getting image:', error);
                        reject(error);
                    } else {
                        resolve({
                            content_type: contentType,
                            image: image
                        });
                    }
                }
            );
        });
    }
}

const roonConnection = new RoonConnection();
module.exports = { roonConnection }; 