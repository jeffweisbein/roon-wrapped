const express = require('express');
const router = express.Router();
const { roonConnection } = require('./roon-connection');
const { historyService } = require('./history-service');

// Health check
router.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Roon status
router.get('/api/roon/status', (req, res) => {
    try {
        const state = roonConnection.getDetailedState();
        console.log('[Routes] Roon status:', state);
        res.json({
            connected: state.connected,
            core_name: state.core_name
        });
    } catch (err) {
        console.error('[Routes] Error getting Roon status:', err);
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
        await historyService.initialize();
        const period = req.query.period || 'all';
        const data = historyService.getWrappedData(period);
        res.json(data);
    } catch (err) {
        console.error('[Routes] Error getting wrapped data:', err);
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