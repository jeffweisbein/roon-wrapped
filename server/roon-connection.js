const RoonApi = require('node-roon-api');
const RoonApiImage = require('node-roon-api-image');
const RoonApiTransport = require('node-roon-api-transport');
const config = require('./config');
const { historyService } = require('./history-service');

class RoonConnection {
    constructor() {
        this.core = null;
        this.image = null;
        this.transport = null;
        this.lastReconnectAttempt = 0;
        this.reconnectInterval = 5000; // 5 seconds
        this.lastTrackIds = {}; // Track last played song per zone
        this.trackStartTimes = {}; // Track when each song started playing
        
        // Initialize history service
        historyService.initialize().then(() => {
            console.log('[Roon] History service initialized');
        }).catch(err => {
            console.error('[Roon] Error initializing history service:', err);
        });
        
        this.roon = new RoonApi({
            extension_id: config.roon.extensionId,
            display_name: config.roon.displayName,
            display_version: config.roon.displayVersion,
            publisher: config.roon.publisher,
            email: config.roon.email,
            website: config.roon.website,
            core_paired: (core) => {
                console.log('[Roon] Core paired:', core.display_name);
                this.core = core;
                this.image = core.services.RoonApiImage;
                this.transport = core.services.RoonApiTransport;
                
                if (this.transport) {
                    console.log('[Roon] Transport service initialized');
                    this.transport.subscribe_zones((response, data) => {
                        if (response === "Changed") {
                            // Handle different types of changes
                            if (data.zones_changed) {
                                console.log('[Roon] Zones changed:', data.zones_changed.map(z => z.display_name));
                                this.processZoneUpdate({ zones: data.zones_changed });
                            }
                            if (data.zones_added) {
                                console.log('[Roon] Zones added:', data.zones_added.map(z => z.display_name));
                                this.processZoneUpdate({ zones: data.zones_added });
                            }
                            // We'll ignore seek changes as they don't indicate new tracks
                        } else if (response === "Subscribed") {
                            console.log('[Roon] Initial zone subscription');
                            this.processZoneUpdate(data);
                        }
                    });
                    
                    // Get initial zones
                    this.transport.get_zones((error, zones) => {
                        if (!error && zones) {
                            console.log('[Roon] Initial zones loaded');
                            this.processZoneUpdate({ zones });
                        }
                    });
                } else {
                    console.error('[Roon] Transport service not available');
                }
            },
            core_unpaired: (core) => {
                console.log('[Roon] Core unpaired:', core.display_name);
                this.core = null;
                this.image = null;
                this.transport = null;
            }
        });

        this.roon.init_services({
            required_services: [RoonApiImage, RoonApiTransport]
        });

        console.log('[Roon] Starting discovery...');
        this.roon.start_discovery();
    }

    processZoneUpdate(data) {
        if (!data || !data.zones) return;
        
        const zones = Array.isArray(data.zones) ? data.zones : Object.values(data.zones);
        
        try {
            for (const zone of zones) {
                // Process any zone with now_playing info
                if (zone.now_playing) {
                    const track = zone.now_playing;
                    const trackId = `${track.two_line.line1}-${track.two_line.line2}-${zone.zone_id}`;
                    const lastId = this.lastTrackIds[zone.zone_id];
                    const trackKey = `${zone.zone_id}-${trackId}`;
                    
                    // Track has changed
                    if (trackId !== lastId) {
                        console.log('[Roon] New track detected:', {
                            zone: zone.display_name,
                            title: track.two_line.line1,
                            artist: track.two_line.line2,
                            state: zone.state
                        });
                        
                        // If previous track was playing, check if it should be logged
                        if (lastId && this.trackStartTimes[`${zone.zone_id}-${lastId}`]) {
                            const startTime = this.trackStartTimes[`${zone.zone_id}-${lastId}`];
                            const playDuration = Date.now() - startTime;
                            const lastTrack = this.getLastTrackInfo(zone.zone_id);
                            
                            if (lastTrack && this.shouldLogTrack(playDuration, lastTrack.duration)) {
                                this.logTrackToHistory(lastTrack);
                            }
                            
                            // Clean up the start time for the previous track
                            delete this.trackStartTimes[`${zone.zone_id}-${lastId}`];
                        }
                        
                        // Start timing for new track if it's playing
                        if (zone.state === 'playing') {
                            this.trackStartTimes[trackKey] = Date.now();
                            // Store track info for later logging
                            this.lastTrackIds[zone.zone_id] = trackId;
                            this[trackKey] = {
                                title: track.two_line.line1,
                                artist: track.two_line.line2,
                                album: track.three_line.line3,
                                image_key: track.image_key,
                                duration: track.length,
                                zone: zone.display_name,
                            };
                        }
                    }
                    // Track state changed to stopped/paused
                    else if (zone.state !== 'playing' && this.trackStartTimes[trackKey]) {
                        const startTime = this.trackStartTimes[trackKey];
                        const playDuration = Date.now() - startTime;
                        const trackInfo = this[trackKey];
                        
                        if (trackInfo && this.shouldLogTrack(playDuration, trackInfo.duration)) {
                            this.logTrackToHistory(trackInfo);
                        }
                        
                        // Clean up
                        delete this.trackStartTimes[trackKey];
                        delete this[trackKey];
                    }
                }
            }
        } catch (error) {
            console.error('[Roon] Error processing zone update:', error);
        }
    }

    shouldLogTrack(playDuration, trackDuration) {
        const thirtySeconds = 30 * 1000; // 30 seconds in milliseconds
        const thirtyPercent = trackDuration * 1000 * 0.3; // 30% of track duration in milliseconds
        return playDuration >= Math.min(thirtySeconds, thirtyPercent);
    }

    getLastTrackInfo(zoneId) {
        const lastId = this.lastTrackIds[zoneId];
        if (!lastId) return null;
        return this[`${zoneId}-${lastId}`];
    }

    logTrackToHistory(trackInfo) {
        const historyEntry = {
            ...trackInfo,
            timestamp: Date.now()
        };
        console.log('[Roon] Adding track to history:', historyEntry);
        historyService.addTrack(historyEntry).catch(err => {
            console.error('[Roon] Error adding track to history:', err);
        });
    }

    attemptReconnect() {
        const now = Date.now();
        if (now - this.lastReconnectAttempt < this.reconnectInterval) {
            return;
        }
        
        this.lastReconnectAttempt = now;
        console.log('[Roon] Attempting to reconnect...');
        
        if (this.roon) {
            this.roon.start_discovery();
        }
    }

    isConnected() {
        const connected = Boolean(this.core && this.image);
        if (!connected) {
            this.attemptReconnect();
        }
        return connected;
    }

    getConnectionStatus() {
        const status = {
            connected: this.isConnected(),
            services: {
                image: Boolean(this.image)
            }
        };
        console.log('[Roon] Connection status:', status);
        return status;
    }

    async getImage(key) {
        if (!this.isConnected()) {
            throw new Error('Image service not available');
        }

        if (!this.image) {
            throw new Error('Image service not available');
        }

        return new Promise((resolve, reject) => {
            this.image.get_image(key, { scale: 'fit', width: 300, height: 300, format: 'image/jpeg' }, (error, content_type, image) => {
                if (error) {
                    reject(error);
                    return;
                }
                if (!image) {
                    reject(new Error('Image not found'));
                    return;
                }
                resolve({ content_type, image });
            });
        });
    }

    getDetailedState() {
        const state = {
            core: {
                present: Boolean(this.core),
                name: this.core?.display_name
            },
            services: {
                image: Boolean(this.image)
            }
        };
        console.log('[Roon] Detailed state:', state);
        return state;
    }
}

const roonConnection = new RoonConnection();
module.exports = { roonConnection }; 