const express = require('express');
const cors = require('cors');
const { roonConnection } = require('./roon-connection.js');
const { historyService } = require('./history-service');
const app = express();

// Enable CORS for Next.js frontend
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-roon-status', 'x-roon-error'],
    exposedHeaders: ['x-roon-status', 'x-roon-error']
}));

// Parse JSON bodies
app.use(express.json());

// API Routes
app.head('/api/roon/connect', async (req, res) => {
    try {
        const status = roonConnection.getConnectionStatus();
        res.setHeader('x-roon-status', status.connected ? 'connected' : 'disconnected');
        res.status(200).end();
    } catch (err) {
        console.error('Error checking connection:', err);
        res.setHeader('x-roon-status', 'disconnected');
        res.setHeader('x-roon-error', err.message || 'Failed to check connection');
        res.status(500).end();
    }
});

app.get('/api/roon/connect', async (req, res) => {
    try {
        const status = roonConnection.getConnectionStatus();
        res.json(status);
    } catch (err) {
        console.error('Error connecting to Roon:', err);
        res.status(500).json({ error: 'Failed to connect to Roon' });
    }
});

app.get('/api/history/status', async (req, res) => {
    try {
        const wrappedData = await historyService.getWrappedData();
        res.json(wrappedData);
    } catch (err) {
        console.error('Error getting history status:', err);
        res.status(500).json({ error: 'Failed to get history status' });
    }
});

app.get('/api/roon/status', async (req, res) => {
    try {
        const status = roonConnection.getConnectionStatus();
        const detailedState = roonConnection.getDetailedState();
        res.json({
            success: true,
            isConnected: status.connected,
            state: detailedState,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('Error getting status:', err);
        res.status(500).json({ error: 'Failed to get Roon status' });
    }
});

app.get('/api/roon/now-playing', async (req, res) => {
    try {
        const nowPlaying = roonConnection.nowPlaying;
        res.json(nowPlaying);
    } catch (err) {
        console.error('Error getting now playing:', err);
        res.status(500).json({ error: 'Failed to get now playing data' });
    }
});

app.get('/api/roon/wrapped', async (req, res) => {
    try {
        const wrappedData = await historyService.getWrappedData();
        res.json(wrappedData);
    } catch (err) {
        console.error('Error getting wrapped data:', err);
        res.status(500).json({ error: 'Failed to get wrapped data' });
    }
});

app.get('/api/roon/image/:key', async (req, res) => {
    try {
        const { key } = req.params;
        console.log(`[API Server] Image request received for key: ${key}`);

        // Check Roon connection status
        if (!roonConnection.isConnected()) {
            console.error('[API Server] Roon not connected when attempting to fetch image');
            return res.status(503).json({ 
                error: 'Roon service unavailable',
                details: 'The Roon service is not currently connected'
            });
        }

        const result = await roonConnection.getImage(key);
        
        if (!result || !result.image) {
            console.error('[API Server] No image data received from Roon');
            return res.status(404).json({ 
                error: 'Image not found',
                details: 'No image data was returned from Roon'
            });
        }

        console.log(`[API Server] Successfully retrieved image (${result.image.length} bytes)`);
        // Always use image/jpeg for album art
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
        res.send(result.image);
    } catch (err) {
        console.error('[API Server] Error getting image:', err);
        
        if (err.message === 'Image service not available') {
            return res.status(503).json({ 
                error: 'Image service unavailable',
                details: 'The Roon image service is not currently available'
            });
        }
        
        if (err.message === 'Image not found') {
            return res.status(404).json({ 
                error: 'Image not found',
                details: 'The requested image could not be found'
            });
        }
        
        res.status(500).json({ 
            error: 'Failed to load image',
            details: err.message
        });
    }
});

async function startServer() {
    try {
        // Initialize history service
        console.log('Initializing history service...');
        await historyService.initialize();
        console.log('History service initialized successfully');

        // Start server
        const port = process.env.ROON_SERVER_PORT || 3003;
        app.listen(port, () => {
            console.log(`API Server ready on http://localhost:${port}`);
        });
    } catch (err) {
        console.error('Error starting server:', err);
        process.exit(1);
    }
}

// Start the server
startServer(); 