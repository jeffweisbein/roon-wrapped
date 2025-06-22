require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { env } = require('./env-validation');
const routes = require('./routes');
const { roonConnection } = require('./roon-connection');
const { historyService } = require('./history-service');
const { processHandlerManager } = require('./process-handlers');

const app = express();
const port = env.ROON_SERVER_PORT || env.SERVER_PORT;

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

// Register cleanup handler
processHandlerManager.register(async () => {
    console.log('[Server] Cleaning up...');
    if (roonConnection) {
        roonConnection.cleanup();
    }
}); 