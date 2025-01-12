const express = require('express');
const router = express.Router();
const roonConnection = require('./roon-connection').roonConnection;

// Test endpoint
router.get('/test', (req, res) => {
    console.log('Test endpoint hit');
    res.json({ success: true, message: 'API is working' });
});

// Get connection status
router.get('/status', (req, res) => {
    console.log('Status request received');
    try {
        const detailedState = roonConnection.getDetailedState();
        const status = {
            success: true,
            detailedState
        };
        
        console.log('Sending status response:', {
            isConnected: detailedState.validation.state.isConnected,
            hasError: detailedState.validation.state.hasError,
            lastError: detailedState.connection.lastError
        });
        res.json(status);
    } catch (error) {
        console.error('Error getting connection status:', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Add debug endpoint
router.post('/debug/force-connect', async (req, res) => {
    console.log('Force connect request received');
    try {
        console.log('Stopping existing connection...');
        await roonConnection.stop();
        
        console.log('Waiting for cleanup...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('Initializing Roon...');
        await roonConnection.initializeRoon();
        
        console.log('Starting discovery...');
        roonConnection.startDiscovery();
        
        const detailedState = roonConnection.getDetailedState();
        const status = {
            success: true,
            message: 'Force connect initiated',
            detailedState
        };
        
        console.log('Sending force connect response:', {
            isConnected: detailedState.validation.state.isConnected,
            hasError: detailedState.validation.state.hasError,
            lastError: detailedState.connection.lastError
        });
        res.json(status);
    } catch (error) {
        console.error('Error in force connect:', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

module.exports = router; 