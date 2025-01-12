const fs = require('fs');
const path = require('path');

class HistoryService {
    constructor() {
        this.tracks = [];
        this.historyFile = path.join(__dirname, '../data/listening-history.json');
        this.isSaving = false;
        this.initialized = false;
        this.saveDebounceTimeout = null;
        this.saveQueue = [];
    }

    async initialize() {
        if (this.initialized) return;

        try {
            // Ensure data directory exists
            const dataDir = path.dirname(this.historyFile);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            // Load existing history
            try {
                const data = fs.readFileSync(this.historyFile, 'utf8');
                this.tracks = JSON.parse(data);
                console.log(`Loaded ${this.tracks.length} tracks from history`);

                // Validate tracks
                this.tracks = this.tracks.filter(track => this.isValidTrack(track));
                console.log(`Found ${this.tracks.length} valid tracks`);

                await this.cleanupHistory();
            } catch (err) {
                if (err.code !== 'ENOENT') {
                    console.error('Error loading history:', err);
                }
                this.tracks = [];
            }

            this.initialized = true;
        } catch (err) {
            console.error('Failed to initialize history service:', err);
            throw err;
        }
    }

    isValidTrack(track) {
        return (
            typeof track === 'object' &&
            typeof track.artist === 'string' &&
            typeof track.title === 'string' &&
            typeof track.album === 'string' &&
            typeof track.timestamp === 'number' &&
            typeof track.duration === 'number' &&
            typeof track.zone === 'string'
        );
    }

    async cleanupHistory() {
        // Remove duplicates based on artist, title, and timestamp
        const seen = new Set();
        this.tracks = this.tracks.filter(track => {
            const key = `${track.artist}-${track.title}-${track.timestamp}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        // Sort by timestamp descending
        this.tracks.sort((a, b) => b.timestamp - a.timestamp);
    }

    async addTrack(track) {
        if (!this.isValidTrack(track)) {
            throw new Error('Invalid track data');
        }

        this.saveQueue.push(track);
        this.tracks.unshift(track);

        // Debounce save operations
        if (this.saveDebounceTimeout) {
            clearTimeout(this.saveDebounceTimeout);
        }

        this.saveDebounceTimeout = setTimeout(() => {
            this.processSaveQueue().catch(err => {
                console.error('Error processing save queue:', err);
            });
        }, 5000);
    }

    async processSaveQueue() {
        if (this.isSaving || this.saveQueue.length === 0) return;

        this.isSaving = true;
        try {
            await fs.promises.writeFile(this.historyFile, JSON.stringify(this.tracks, null, 2));
            this.saveQueue = [];
        } catch (err) {
            console.error('Error saving history:', err);
            throw err;
        } finally {
            this.isSaving = false;
        }
    }

    getWrappedData() {
        // Calculate time of day patterns
        const timeOfDay = {
            morning: 0,   // 6am - 12pm
            afternoon: 0, // 12pm - 5pm
            evening: 0,   // 5pm - 10pm
            night: 0      // 10pm - 6am
        };

        // Calculate day of week patterns
        const dayOfWeek = {
            sunday: 0,
            monday: 0,
            tuesday: 0,
            wednesday: 0,
            thursday: 0,
            friday: 0,
            saturday: 0
        };

        // Calculate hourly patterns for peak hour
        const hourlyPlays = new Array(24).fill(0);
        let totalPlaytime = 0;
        let peakHour = 0;

        this.tracks.forEach(track => {
            const date = new Date(track.timestamp);
            
            // Time of day
            const hour = date.getHours();
            if (hour >= 6 && hour < 12) timeOfDay.morning++;
            else if (hour >= 12 && hour < 17) timeOfDay.afternoon++;
            else if (hour >= 17 && hour < 22) timeOfDay.evening++;
            else timeOfDay.night++;

            // Day of week
            const day = date.getDay();
            switch(day) {
                case 0: dayOfWeek.sunday++; break;
                case 1: dayOfWeek.monday++; break;
                case 2: dayOfWeek.tuesday++; break;
                case 3: dayOfWeek.wednesday++; break;
                case 4: dayOfWeek.thursday++; break;
                case 5: dayOfWeek.friday++; break;
                case 6: dayOfWeek.saturday++; break;
            }

            // Hourly plays and playtime
            hourlyPlays[hour]++;
            if (track.duration) {
                totalPlaytime += Math.round(track.duration / 60); // Convert seconds to minutes
            }
        });

        // Find peak hour
        let maxPlays = 0;
        hourlyPlays.forEach((plays, hour) => {
            if (plays > maxPlays) {
                maxPlays = plays;
                peakHour = hour;
            }
        });

        // Calculate daily average
        const firstPlay = this.tracks[this.tracks.length - 1]?.timestamp;
        const lastPlay = this.tracks[0]?.timestamp;
        const totalDays = firstPlay && lastPlay ? 
            Math.ceil((lastPlay - firstPlay) / (1000 * 60 * 60 * 24)) : 1;
        const dailyAverage = Math.round(this.tracks.length / totalDays);

        // Get top items
        const topArtists = this.getTopItems(track => track.artist);
        const topAlbums = this.getTopItems(track => track.album);
        const topTracks = this.getTopItems(track => track.title);

        return {
            totalPlays: this.tracks.length,
            uniqueArtists: new Set(this.tracks.map(track => track.artist)).size,
            uniqueAlbums: new Set(this.tracks.map(track => track.album)).size,
            uniqueTracks: new Set(this.tracks.map(track => track.title)).size,
            totalPlaytime,
            dailyAverage,
            peakHour,
            currentStreak: this.calculateCurrentStreak(),
            patterns: {
                timeOfDay,
                dayOfWeek,
                hourlyPlays
            },
            topArtists: topArtists.slice(0, 10),
            topAlbums: topAlbums.slice(0, 10),
            topTracks: topTracks.slice(0, 10)
        };
    }

    calculateCurrentStreak() {
        if (this.tracks.length === 0) return 0;

        let streak = 1;
        const today = new Date().setHours(0, 0, 0, 0);
        let currentDate = new Date(this.tracks[0].timestamp).setHours(0, 0, 0, 0);
        let lastDate = currentDate;

        // Get unique dates from tracks
        const dates = new Set();
        for (const track of this.tracks) {
            const date = new Date(track.timestamp).setHours(0, 0, 0, 0);
            dates.add(date);
        }

        // Convert to array and sort descending
        const sortedDates = Array.from(dates).sort((a, b) => b - a);

        // Count consecutive days
        for (let i = 1; i < sortedDates.length; i++) {
            const diff = sortedDates[i - 1] - sortedDates[i];
            if (diff > 24 * 60 * 60 * 1000) break;
            streak++;
        }

        return streak;
    }

    getTopItems(getKey) {
        const counts = {};
        
        // Helper function to normalize artist names
        const normalizeArtistName = (name) => {
            if (typeof name === 'string') {
                const lowerName = name.toLowerCase();
                if (lowerName.includes('blink')) {
                    return 'blink-182';
                }
                // Handle Binmonkey's blink-182 covers
                if (lowerName === 'binmonkey') {
                    return 'blink-182';
                }
            }
            return name;
        };
        
        // Determine what we're aggregating by
        const sampleKey = getKey(this.tracks[0]);
        const isArtistAggregation = sampleKey === this.tracks[0].artist;
        const isAlbumAggregation = sampleKey === this.tracks[0].album;
        const isTitleAggregation = sampleKey === this.tracks[0].title;
        
        this.tracks.forEach(track => {
            // Check if this is a Binmonkey track playing blink-182 songs
            const isBindmonkeyBlink = track.artist === 'Binmonkey' && track.album.toLowerCase().includes('blink-182');
            
            // Normalize artist name in the track object for aggregation
            const normalizedArtist = normalizeArtistName(track.artist);
            
            let rawKey = getKey(track);
            
            // If we're getting the artist or it's a Binmonkey blink-182 cover, normalize it
            if (isArtistAggregation || isBindmonkeyBlink) {
                rawKey = normalizeArtistName(rawKey);
            }
            
            // For albums by blink-182, ensure consistent hyphen
            if (typeof rawKey === 'string' && rawKey.toLowerCase().includes('blink')) {
                rawKey = rawKey.replace(/[\u2010-\u2015]/g, '-');
            }
            
            // Create composite key for albums that includes artist
            let key;
            let displayName = rawKey;
            let displayArtist = isBindmonkeyBlink ? 'blink-182' : track.artist;
            
            if (isAlbumAggregation) {
                // Special handling for Taylor Swift albums
                if (track.artist === 'Taylor Swift') {
                    console.log('Processing Taylor Swift track:', {
                        title: track.title,
                        originalAlbum: track.album,
                        rawKey: rawKey
                    });
                    
                    // Map known Taylor Swift songs to their correct albums
                    const songToAlbum = {
                        'Cruel Summer': 'Lover',
                        "Don't Blame Me": 'reputation',
                        'Look What You Made Me Do': 'reputation',
                        'Ready for It?': 'reputation',
                        'Delicate': 'reputation',
                        'Gorgeous': 'reputation',
                        'End Game': 'reputation',
                        'Getaway Car': 'reputation',
                        'Dancing with Our Hands Tied': 'reputation',
                        'Dress': 'reputation',
                        'This Is Why We Can\'t Have Nice Things': 'reputation',
                        'Call It What You Want': 'reputation',
                        'New Year\'s Day': 'reputation',
                        'ME!': 'Lover',
                        'You Need to Calm Down': 'Lover',
                        'The Man': 'Lover',
                        'I Think He Knows': 'Lover',
                        'Paper Rings': 'Lover',
                        'London Boy': 'Lover',
                        'Soon You\'ll Get Better': 'Lover',
                        'Afterglow': 'Lover',
                        'Daylight': 'Lover',
                        'I Forgot That You Existed': 'Lover',
                        'Miss Americana & The Heartbreak Prince': 'Lover',
                        'Cornelia Street': 'Lover',
                        'Death By A Thousand Cuts': 'Lover',
                        'False God': 'Lover',
                        'You Need To Calm Down': 'Lover',
                        'Afterglow': 'Lover',
                        'ME! (feat. Brendon Urie of Panic! At The Disco)': 'Lover',
                        'It\'s Nice To Have A Friend': 'Lover'
                    };
                    
                    // If the title contains "Live at The Eras Tour", use the original album name
                    if (track.title.includes('Live at The Eras Tour')) {
                        const originalAlbum = track.title.split('/')[0].trim();
                        rawKey = originalAlbum;
                        displayName = originalAlbum;
                        console.log('Eras Tour track, using original album:', originalAlbum);
                    }
                    // Handle cases where songs are incorrectly attributed to the album "Taylor Swift"
                    else if (rawKey === 'Taylor Swift') {
                        // Check if we know the correct album for this song
                        const correctAlbum = songToAlbum[track.title];
                        if (correctAlbum) {
                            rawKey = correctAlbum;
                            displayName = correctAlbum;
                            console.log('Fixed incorrect album attribution:', { title: track.title, correctAlbum });
                        }
                        // If the title contains "Fearless", it's from that album
                        else if (track.title.toLowerCase().includes('fearless')) {
                            rawKey = 'Fearless';
                            displayName = 'Fearless';
                            console.log('Fixed Fearless attribution');
                        }
                    }
                    // Handle deluxe versions and special editions
                    const oldKey = rawKey;
                    rawKey = rawKey.replace(/ \(Deluxe[^)]*\)/i, '')
                                 .replace(/ \(Taylor's Version[^)]*\)/i, '')
                                 .replace(/ \(Special Edition\)/i, '')
                                 .trim();
                    displayName = rawKey;
                    if (oldKey !== rawKey) {
                        console.log('Normalized album name:', { from: oldKey, to: rawKey });
                    }
                }
                key = `${rawKey.toLowerCase()}|${normalizedArtist.toLowerCase()}`;
            } else if (isTitleAggregation) {
                // For titles, create a composite key that includes the normalized artist
                key = `${rawKey.toLowerCase()}|${normalizedArtist.toLowerCase()}`;
            } else {
                key = typeof rawKey === 'string' ? rawKey.toLowerCase() : rawKey;
            }
            
            if (!counts[key]) {
                counts[key] = {
                    count: 0,
                    name: displayName,
                    artist: displayArtist,
                    album: track.album,
                    title: track.title,
                    image_key: null
                };
            }
            counts[key].count++;
            // Update image_key if we don't have one yet and this track has one
            if (!counts[key].image_key && track.image_key) {
                counts[key].image_key = track.image_key;
            }
            // Only update title from the most recent play, keep the normalized album name
            counts[key].title = track.title;
            // Ensure we keep the correct artist display name
            counts[key].artist = displayArtist;
        });
        
        // Add some debug logging
        if (isArtistAggregation) {
            console.log('Artist aggregation results:', Object.entries(counts)
                .filter(([key, value]) => value.name.toLowerCase().includes('blink'))
                .map(([key, value]) => ({ key, name: value.name, count: value.count })));
        }
        
        return Object.values(counts)
            .sort((a, b) => b.count - a.count);
    }
}

// Export a singleton instance
const historyService = new HistoryService();
module.exports = { historyService, HistoryService }; 