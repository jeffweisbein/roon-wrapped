require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { roonConnection } = require('./roon-connection');
const { historyService } = require('./history-service');

const app = express();
const port = process.env.SERVER_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
async function initializeServices() {
    try {
        await historyService.initialize();
        // Roon connection is initialized in constructor
    } catch (err) {
        console.error('[Server] Error initializing services:', err);
    }
}

// Routes
app.use('/', routes);

// Start server
app.listen(port, () => {
    console.log(`[Server] Listening on port ${port}`);
    initializeServices();
});

// Cleanup on exit
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

async function cleanup() {
    try {
        console.log('[Server] Cleaning up...');
        if (roonConnection) {
            roonConnection.cleanup();
        }
        process.exit(0);
    } catch (err) {
        console.error('[Server] Error during cleanup:', err);
        process.exit(1);
    }
} 