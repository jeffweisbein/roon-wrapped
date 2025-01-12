const express = require('express');
const router = express.Router();
const roonConnection = require('./roon-connection');
const { HistoryService } = require('./history-service');

// Create a singleton instance
const historyService = new HistoryService();

// Get connection status
router.get('/status', (req, res) => {
    try {
        const status = roonConnection.getConnectionStatus();
        res.json(status);
    } catch (err) {
        console.error('Error getting status:', err);
        res.status(500).json({ error: 'Failed to get status', lastError: err.message });
    }
});

// Get currently playing tracks
router.get('/now-playing', async (req, res) => {
    try {
        if (!roonConnection.isConnected()) {
            return res.status(503).json({ error: 'Roon service unavailable' });
        }

        const tracks = await roonConnection.getNowPlaying();
        res.json(tracks);
    } catch (err) {
        console.error('Error getting now playing:', err);
        res.status(500).json({ error: 'Failed to get now playing info', lastError: err.message });
    }
});

// Get image by key
router.get('/image/:key', async (req, res) => {
    try {
        if (!roonConnection.isConnected()) {
            return res.status(503).json({ error: 'Roon service unavailable' });
        }

        const { key } = req.params;
        const { content_type, image } = await roonConnection.getImage(key);
        
        res.setHeader('Content-Type', content_type);
        res.send(image);
    } catch (err) {
        console.error('Error getting image:', err);
        res.status(500).json({ error: 'Failed to get image', lastError: err.message });
    }
});

// Force restart of Roon connection
router.post('/restart', async (req, res) => {
    try {
        await roonConnection.setupRoonApi();
        res.json({ message: 'Restart initiated' });
    } catch (error) {
        console.error('Failed to restart:', error);
        res.status(500).json({ error: 'Failed to restart', message: error.message });
    }
});

// Get all history
router.get('/', (req, res) => {
    try {
        const history = historyService.history;
        res.json(history);
    } catch (error) {
        console.error('Failed to get history:', error);
        res.status(500).json({ error: 'Failed to get history', message: error.message });
    }
});

// Get wrapped data for a specific year
router.get('/wrapped/:year?', (req, res) => {
    try {
        const year = req.params.year ? parseInt(req.params.year) : new Date().getFullYear();
        const wrappedData = historyService.getWrappedData(year);
        console.log('Returning wrapped data for year:', year);
        res.json(wrappedData);
    } catch (error) {
        console.error('Failed to get wrapped data:', error);
        res.status(500).json({ error: 'Failed to get wrapped data', message: error.message });
    }
});

// Refresh zones
router.post('/refresh-zones', async (req, res) => {
    try {
        console.log('Manual zone refresh requested');
        if (!roonConnection.transport()) {
            res.status(503).json({ error: 'Transport not available' });
            return;
        }

        roonConnection.transport().get_zones((error, zones) => {
            if (error) {
                console.error('Error getting zones:', error);
                res.status(500).json({ error: 'Failed to get zones' });
                return;
            }

            const zoneInfo = Object.keys(zones || {}).map(id => ({
                id,
                name: zones[id].display_name,
                state: zones[id].state
            }));

            console.log('Zones refreshed:', zoneInfo);
            res.json({ zones: zoneInfo });
        });
    } catch (error) {
        console.error('Failed to refresh zones:', error);
        res.status(500).json({ error: 'Failed to refresh zones', message: error.message });
    }
});

module.exports = router; 