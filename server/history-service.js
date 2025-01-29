const fs = require('fs');
const path = require('path');

class HistoryService {
    constructor() {
        this.tracks = [];
        this.historyFile = path.join(__dirname, '../data/listening-history.json');
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            // Load existing history
            try {
                const data = fs.readFileSync(this.historyFile, 'utf8');
                this.tracks = JSON.parse(data);
                console.log(`[History] Loaded ${this.tracks.length} tracks from ${this.historyFile}`);
            } catch (err) {
                if (err.code !== 'ENOENT') {
                    console.error('[History] Error loading history:', err);
                }
                this.tracks = [];
            }

            this.initialized = true;
        } catch (err) {
            console.error('[History] Failed to initialize:', err);
            throw err;
        }
    }

    async addTrack(track) {
        if (!track.title || !track.artist || !track.timestamp) {
            console.error('[History] Invalid track:', track);
            return;
        }

        console.log('[History] Adding track:', {
            title: track.title,
            artist: track.artist,
            timestamp: new Date(track.timestamp).toISOString()
        });

        // Add to start of array
        this.tracks.unshift(track);

        // Save immediately
        try {
            await fs.promises.writeFile(
                this.historyFile, 
                JSON.stringify(this.tracks, null, 2)
            );
        } catch (err) {
            console.error('[History] Error saving:', err);
        }
    }

    getTracks() {
        return this.tracks;
    }

    saveTracks(tracks) {
        this.tracks = tracks;
        return fs.promises.writeFile(
            this.historyFile, 
            JSON.stringify(tracks, null, 2)
        );
    }

    getWrappedData(period = 'all') {
        console.log('[History] Getting wrapped data for period:', period);
        
        // Filter tracks based on time period
        const now = Date.now();
        const filteredTracks = this.tracks.filter(track => {
            if (period === 'all') return true;
            
            const daysDiff = (now - track.timestamp) / (1000 * 60 * 60 * 24);
            const periodDays = parseInt(period);
            
            return !isNaN(periodDays) && daysDiff <= periodDays;
        });

        console.log(`[History] Filtered ${this.tracks.length} tracks down to ${filteredTracks.length} tracks for period ${period}`);

        // Normalize artist names
        const normalizeArtist = (artist) => {
            if (!artist) return '';
            const normalized = artist.trim().toLowerCase();
            if (normalized.includes('blink') && normalized.includes('182')) {
                return 'blink-182';
            }
            return artist.trim();
        };

        // Get top artists with latest artwork
        const artistCounts = {};
        const artistLatestImage = {};
        const artistLatestTimestamp = {};

        filteredTracks.forEach(track => {
            const normalizedArtist = normalizeArtist(track.artist);
            artistCounts[normalizedArtist] = (artistCounts[normalizedArtist] || 0) + 1;
            
            // Update image only if this track is more recent
            if (!artistLatestTimestamp[normalizedArtist] || track.timestamp > artistLatestTimestamp[normalizedArtist]) {
                artistLatestImage[normalizedArtist] = track.image_key;
                artistLatestTimestamp[normalizedArtist] = track.timestamp;
            }
        });

        // Format top items
        const topArtists = Object.entries(artistCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([name, count]) => ({ 
                name, 
                artist: name, 
                count,
                image_key: artistLatestImage[name]
            }));

        // Get top albums
        const albumCounts = {};
        const albumImages = {};
        const albumArtists = {};
        filteredTracks.forEach(track => {
            if (track.album) {
                albumCounts[track.album] = (albumCounts[track.album] || 0) + 1;
                if (track.image_key) {
                    albumImages[track.album] = track.image_key;
                }
                albumArtists[track.album] = normalizeArtist(track.artist);
            }
        });

        const topAlbums = Object.entries(albumCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([name, count]) => ({ 
                name, 
                album: name, 
                artist: albumArtists[name] || "",
                count,
                image_key: albumImages[name]
            }));

        // Get top tracks
        const trackCounts = {};
        const trackImages = {};
        const trackAlbums = {};
        filteredTracks.forEach(track => {
            const normalizedArtist = normalizeArtist(track.artist);
            const key = `${track.title} - ${normalizedArtist}`;
            trackCounts[key] = (trackCounts[key] || 0) + 1;
            
            // Only update image if we don't have one for this track yet
            if (!trackImages[key] && track.image_key) {
                trackImages[key] = track.image_key;
            }
            
            // Store album info
            if (track.album) {
                trackAlbums[key] = track.album;
            }
        });

        const topTracks = Object.entries(trackCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([name, count]) => {
                const [title, artist] = name.split(" - ");
                return { 
                    name, 
                    title, 
                    artist,
                    album: trackAlbums[name], 
                    count,
                    image_key: trackImages[name]
                };
            });

        // Calculate patterns based on filtered tracks
        const calculatePatternsForTracks = (tracks) => {
            const hourCounts = new Array(24).fill(0);
            const dayOfWeek = {
                sunday: 0,
                monday: 0,
                tuesday: 0,
                wednesday: 0,
                thursday: 0,
                friday: 0,
                saturday: 0
            };

            tracks.forEach(track => {
                const date = new Date(track.timestamp);
                const hour = date.getHours();
                const day = date.getDay();
                
                hourCounts[hour]++;
                const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                dayOfWeek[days[day]]++;
            });

            return {
                timeOfDay: {
                    morning: hourCounts.slice(6, 12).reduce((a, b) => a + b, 0),   // 6 AM - 11:59 AM
                    afternoon: hourCounts.slice(12, 18).reduce((a, b) => a + b, 0), // 12 PM - 5:59 PM
                    evening: hourCounts.slice(18, 24).reduce((a, b) => a + b, 0),   // 6 PM - 11:59 PM
                    night: hourCounts.slice(0, 6).reduce((a, b) => a + b, 0)        // 12 AM - 5:59 AM
                },
                dayOfWeek
            };
        };

        // Calculate streak based on filtered tracks
        const calculateStreakForTracks = (tracks) => {
            if (tracks.length === 0) return 0;
            
            const today = new Date().setHours(0, 0, 0, 0);
            let currentStreak = 0;
            let streakDate = today;

            // Get unique dates and sort them in descending order
            const playDates = new Set(
                tracks.map(track => 
                    new Date(track.timestamp).setHours(0, 0, 0, 0)
                )
            );
            const sortedDates = Array.from(playDates).sort((a, b) => b - a);

            // Calculate streak
            for (let date of sortedDates) {
                if (date === streakDate) {
                    currentStreak++;
                    streakDate -= 86400000; // Subtract one day in milliseconds
                } else {
                    break;
                }
            }

            return currentStreak;
        };

        // Calculate peak hour based on filtered tracks
        const calculatePeakHourForTracks = (tracks) => {
            if (tracks.length === 0) return 0;
            
            const hourCounts = new Array(24).fill(0);
            
            tracks.forEach(track => {
                const hour = new Date(track.timestamp).getHours();
                hourCounts[hour]++;
            });

            return hourCounts.indexOf(Math.max(...hourCounts));
        };

        return {
            totalPlays: filteredTracks.length,
            uniqueArtists: Object.keys(artistCounts).length,
            uniqueAlbums: Object.keys(albumCounts).length,
            uniqueTracks: Object.keys(trackCounts).length,
            totalPlaytime: filteredTracks.reduce((total, track) => {
                // Some tracks use duration instead of length
                const trackDuration = track.length || track.duration || 0;
                return total + trackDuration;
            }, 0),
            dailyAverage: Math.round(filteredTracks.length / (filteredTracks.length > 0 ? Math.ceil((now - filteredTracks[filteredTracks.length - 1].timestamp) / (24 * 60 * 60 * 1000)) : 1) * 10) / 10,
            currentStreak: calculateStreakForTracks(filteredTracks),
            peakHour: calculatePeakHourForTracks(filteredTracks),
            topArtists,
            topAlbums,
            topTracks,
            topGenres: [], // Placeholder since we don't have genre data yet
            patterns: calculatePatternsForTracks(filteredTracks)
        };
    }
}

const historyService = new HistoryService();
module.exports = { historyService }; 