const express = require('express');
const cors = require('cors');
const { roonConnection } = require('./roon-connection');
const { historyService } = require('./history-service');
const routes = require('./routes');

async function startServer() {
    console.log('Initializing history service...');
    await historyService.initialize();
    console.log('History service initialized successfully');

    const app = express();
    const port = process.env.SERVER_PORT || 3003;

    // Enable CORS
    app.use(cors({
        origin: '*',
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Accept'],
        credentials: true
    }));

    app.use(express.json());
    
    // Add routes
    app.use('/', routes(roonConnection));

    // Error handling middleware
    app.use((err, req, res, next) => {
        console.error('Server error:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message || 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    });

    // Catch-all for unhandled routes
    app.use((req, res) => {
        res.status(404).json({
            success: false,
            error: 'Not Found',
            message: `Route ${req.method} ${req.url} not found`
        });
    });

    // Start the server
    const server = app.listen(port, () => {
        console.log(`Using port ${port}`);
        console.log('Roon server listening on port', port);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
        console.log('Received SIGTERM signal');
        await cleanup(server);
    });

    process.on('SIGINT', async () => {
        console.log('Received SIGINT signal');
        await cleanup(server);
    });

    return { server, roonConnection };
}

async function cleanup(server) {
    try {
        await new Promise((resolve) => {
            server.close(() => {
                console.log('Server closed');
                resolve();
            });
        });

        console.log('Stopping Roon connection...');
        await roonConnection.cleanup();
        console.log('Roon connection stopped');

        process.exit(0);
    } catch (error) {
        console.error('Error during cleanup:', error);
        process.exit(1);
    }
}

startServer().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
}); 