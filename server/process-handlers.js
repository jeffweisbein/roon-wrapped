// Singleton process event handler manager to prevent duplicate listeners
class ProcessHandlerManager {
    constructor() {
        this.handlers = new Map();
        this.isRegistered = false;
    }

    register(cleanupFn) {
        // Only register process handlers once
        if (this.isRegistered) {
            console.log('[ProcessHandler] Already registered, skipping duplicate registration');
            return;
        }

        const handler = async (signal) => {
            console.log(`[ProcessHandler] Received ${signal} signal. Starting graceful shutdown...`);
            
            try {
                // Call the cleanup function
                if (cleanupFn && typeof cleanupFn === 'function') {
                    await cleanupFn();
                }
                
                console.log('[ProcessHandler] Cleanup completed');
                process.exit(0);
            } catch (error) {
                console.error('[ProcessHandler] Error during cleanup:', error);
                process.exit(1);
            }
        };

        // Register handlers
        process.on('SIGTERM', handler);
        process.on('SIGINT', handler);
        
        // Track that we've registered
        this.isRegistered = true;
        console.log('[ProcessHandler] Process handlers registered');
    }
}

// Export singleton instance
const processHandlerManager = new ProcessHandlerManager();
module.exports = { processHandlerManager };