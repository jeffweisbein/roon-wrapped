const RoonApi = require('node-roon-api');
const RoonApiTransport = require('node-roon-api-transport');
const fs = require('fs').promises;
const path = require('path');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, '..', 'data');
const historyFile = path.join(dataDir, 'listening-history.json');

let core = null;
let tracks = [];
let isPaired = false;
let connectionTimeout;

// Create Transport service
const transport = new RoonApiTransport(null);

// Create Roon API instance
const roon = new RoonApi({
    extension_id:        'com.cackles.roon-wrapped-exporter',
    display_name:        'Roon Wrapped Exporter',
    display_version:     '1.0.0',
    publisher:           'Cackles',
    email:              'cackles@hypelab.digital',
    website:            'https://github.com/cackles/roon-wrapped',
    core_paired: async function(paired_core) {
        try {
            core = paired_core;
            isPaired = true;
            clearTimeout(connectionTimeout);
            console.log('✅ Successfully paired with Roon Core:', core.display_name);
            
            // Load existing history
            try {
                const existingData = await fs.readFile(historyFile, 'utf8');
                tracks = JSON.parse(existingData);
                console.log(`Loaded ${tracks.length} existing tracks`);
            } catch (err) {
                console.log('No existing history found, starting fresh');
                tracks = [];
            }

            // Subscribe to zone updates to track current and future plays
            transport.subscribe_zones((err, response) => {
                if (err) {
                    console.error('Error subscribing to zones:', err);
                    return;
                }

                if (!response.zones || !response.zones.length) {
                    console.log('No zones found');
                    return;
                }

                response.zones.forEach(zone => {
                    if (zone.now_playing && zone.now_playing.three_line) {
                        const track = {
                            title: zone.now_playing.three_line.line1,
                            artist: zone.now_playing.three_line.line2,
                            album: zone.now_playing.three_line.line3,
                            timestamp: Date.now(),
                            duration: zone.now_playing.length || 180,
                            zone: zone.display_name,
                            seek_position: zone.now_playing.seek_position
                        };

                        console.log(`New track playing: ${track.title} by ${track.artist}`);
                        tracks.push(track);

                        // Save updated history
                        fs.writeFile(historyFile, JSON.stringify(tracks, null, 2))
                            .then(() => console.log(`Saved ${tracks.length} tracks to history`))
                            .catch(err => console.error('Error saving history:', err));
                    }
                });
            });

            // Get initial zones and history
            transport.get_zones(core, (err, zones) => {
                if (err) {
                    console.error('Error getting zones:', err);
                    return;
                }

                if (!zones || !zones.length) {
                    console.log('No zones found');
                    return;
                }

                console.log(`Found ${zones.length} zones`);

                // Process each zone
                zones.forEach(zone => {
                    console.log(`Processing zone: ${zone.display_name}`);

                    // Get currently playing track
                    if (zone.now_playing && zone.now_playing.three_line) {
                        const track = {
                            title: zone.now_playing.three_line.line1,
                            artist: zone.now_playing.three_line.line2,
                            album: zone.now_playing.three_line.line3,
                            timestamp: Date.now(),
                            duration: zone.now_playing.length || 180,
                            zone: zone.display_name,
                            seek_position: zone.now_playing.seek_position
                        };

                        console.log(`Found current track: ${track.title} by ${track.artist}`);
                        tracks.push(track);
                    }

                    // Get zone history
                    if (zone.history) {
                        zone.history.forEach(item => {
                            if (item.three_line) {
                                const track = {
                                    title: item.three_line.line1,
                                    artist: item.three_line.line2,
                                    album: item.three_line.line3,
                                    timestamp: Date.now() - (item.seek_position || 0),
                                    duration: item.length || 180,
                                    zone: zone.display_name
                                };

                                console.log(`Found history track: ${track.title} by ${track.artist}`);
                                tracks.push(track);
                            }
                        });
                    }
                });

                // Save updated history
                fs.writeFile(historyFile, JSON.stringify(tracks, null, 2))
                    .then(() => console.log(`Saved ${tracks.length} tracks to history`))
                    .catch(err => console.error('Error saving history:', err));
            });

        } catch (err) {
            console.error('Error during core pairing:', err);
            isPaired = false;
        }
    },
    core_unpaired: function(unpaired_core) {
        console.log('❌ Lost connection to Roon Core:', unpaired_core.display_name);
        isPaired = false;
        checkConnectionStatus();
    }
});

// Function to check connection status
function checkConnectionStatus() {
    if (!isPaired) {
        console.log('\n⚠️  Not connected to Roon. Please make sure to:');
        console.log('1. Open Roon');
        console.log('2. Go to Settings > Extensions');
        console.log('3. Enable "Roon Wrapped Exporter"\n');
    }
}

// Attach roon to transport service
transport.roon = roon;

// Initialize services
roon.init_services({
    required_services: [{
        name: transport.name,
        version: "2",
        can_control_transport: true,
        services: [transport]
    }],
    provided_services: [{
        services: [{
            name: "com.roonlabs.pairing:1",
            version: "1.0.0",
            can_pair: true,
            subscribe_pairing: function(cb) {
                cb({ paired_core_id: null });
            }
        }]
    }]
});

// Set initial connection check timeout
connectionTimeout = setTimeout(() => {
    if (!isPaired) {
        checkConnectionStatus();
    }
}, 5000); // Check after 5 seconds

// Start Roon discovery
console.log('🔍 Starting Roon discovery...');
roon.start_discovery();

// Export connection status for the server
module.exports = {
    isConnected: () => isPaired,
    getConnectionStatus: () => ({
        isPaired,
        coreName: core ? core.display_name : null
    })
}; 