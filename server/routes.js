const express = require('express');
const router = express.Router();
const { roonConnection } = require('./roon-connection');
const { historyService } = require('./history-service');
const recommendationsRouter = require('./routes/recommendations');

// Mount recommendations routes
router.use('/api/recommendations', recommendationsRouter);

// Health check
router.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Roon status
router.get('/api/roon/status', (req, res) => {
    try {
        const state = roonConnection.getDetailedState();
        console.log('[Backend] Roon connection state:', state);
        res.json({
            connected: state.connected,
            core_name: state.core_name
        });
    } catch (err) {
        console.error('[Backend] Error getting Roon status:', err);
        res.status(500).json({ error: err.message });
    }
});

// Connect to Roon
router.post('/api/roon/connect', (req, res) => {
    try {
        if (!roonConnection.isConnected()) {
            roonConnection.start();
        }
        res.json({ success: true });
    } catch (err) {
        console.error('[Routes] Error connecting to Roon:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Now playing
router.get('/api/roon/now-playing', (req, res) => {
    try {
        const nowPlaying = roonConnection.getNowPlaying();
        res.json({ success: true, data: nowPlaying });
    } catch (err) {
        console.error('[Routes] Error getting now playing:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get wrapped data
router.get('/api/history/wrapped', async (req, res) => {
    try {
        console.log('[Backend] Wrapped endpoint called');
        
        // Initialize history service
        console.log('[Backend] Initializing history service');
        await historyService.initialize();
        console.log('[Backend] History service initialized');
        
        const period = req.query.period || 'all';
        console.log('[Backend] Getting wrapped data for period:', period);
        
        // Log the raw tracks data first
        console.log('[Backend] Total tracks in history:', historyService.tracks.length);
        if (historyService.tracks.length > 0) {
            console.log('[Backend] Sample track:', historyService.tracks[0]);
        }
        
        const data = historyService.getWrappedData(period);
        
        // Log the filtered tracks and calculations
        console.log('[Backend] Filtered tracks:', {
            totalTracks: data.totalTracksPlayed,
            uniqueArtists: data.uniqueArtistsCount,
            uniqueAlbums: data.uniqueAlbumsCount,
            uniqueTracks: data.uniqueTracksCount
        });
        
        // Log the top items
        console.log('[Backend] Top items:', {
            artists: data.topArtistsByPlays?.length || 0,
            albums: data.topAlbumsByPlays?.length || 0,
            tracks: data.topTracksByPlays?.length || 0
        });
        
        // Log the listening patterns
        console.log('[Backend] Listening patterns:', {
            timeOfDay: data.listeningPatterns?.timeOfDay,
            dayOfWeekPlays: data.listeningPatterns?.dayOfWeekPlays
        });
        
        // Log sample entries if they exist
        if (data.topArtistsByPlays?.length > 0) {
            console.log('[Backend] Sample top artist:', data.topArtistsByPlays[0]);
        }
        if (data.topAlbumsByPlays?.length > 0) {
            console.log('[Backend] Sample top album:', data.topAlbumsByPlays[0]);
        }
        if (data.topTracksByPlays?.length > 0) {
            console.log('[Backend] Sample top track:', data.topTracksByPlays[0]);
        }
        
        res.json(data);
    } catch (err) {
        console.error('[Backend] Error getting wrapped data:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get Roon image
router.get('/api/roon/image/:key', async (req, res) => {
    try {
        if (!roonConnection.isConnected()) {
            return res.status(503).json({ error: 'Roon not connected' });
        }

        const imageKey = req.params.key;
        const image = await roonConnection.getImage(imageKey);
        
        if (!image) {
            return res.status(404).json({ error: 'Image not found' });
        }

        res.set('Content-Type', image.content_type);
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        res.send(image.image);
    } catch (err) {
        console.error('[Routes] Error getting image:', err);
        res.status(500).json({ error: err.message });
    }
});

// Error handler
router.use((err, req, res, next) => {
    console.error('[Routes] Unhandled error:', err);
    res.status(500).json({ success: false, error: err.message });
});

module.exports = router; 