const express = require('express');
const router = express.Router();
const { historyService } = require('./history-service');

module.exports = function(roonConnection) {
    // Image endpoint
    router.get('/api/roon/image/:key', async (req, res) => {
        try {
            const { content_type, image } = await roonConnection.getImage(req.params.key);
            res.writeHead(200, {
                'Content-Length': image.length,
                'Content-Type': content_type
            });
            res.write(image);
            res.end();
        } catch (error) {
            res.status(500).end();
        }
    });

    // Roon status endpoint
    router.get('/api/roon/status', (req, res, next) => {
        try {
            if (!roonConnection) {
                return res.status(503).json({
                    success: false,
                    error: 'Roon connection not initialized'
                });
            }

            const isConnected = roonConnection.isConnected();
            const state = roonConnection.getDetailedState();
            
            res.json({
                success: true,
                isConnected,
                state,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    });

    // Wrapped data endpoint
    router.get('/api/roon/wrapped', async (req, res, next) => {
        try {
            const wrappedData = await historyService.getWrappedData();
            res.json(wrappedData);
        } catch (error) {
            next(error);
        }
    });

    // Health check endpoint
    router.get('/health', (req, res, next) => {
        try {
            const state = roonConnection.getDetailedState();
            res.json({
                success: true,
                status: 'ok',
                roon: {
                    isConnected: roonConnection.isConnected(),
                    state: state
                },
                uptime: process.uptime(),
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    });

    // Error handling middleware
    const errorHandler = (err, req, res, next) => {
        console.error('Error in route handler:', err);
        res.status(500).json({
            success: false,
            error: err.message || 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    };

    // Catch-all for unhandled routes - should be second to last
    router.use((req, res) => {
        res.status(404).json({
            success: false,
            error: 'Not Found',
            message: `Route ${req.method} ${req.url} not found`
        });
    });

    // Apply error handler last
    router.use(errorHandler);

    return router;
}; 