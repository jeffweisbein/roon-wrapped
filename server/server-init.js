const net = require('net');
const config = require('./config');

class ServerInitializer {
    constructor() {
        this.currentPort = config.server.port;
        this.isInitialized = false;
    }

    async findAvailablePort() {
        const isPortAvailable = (port) => {
            return new Promise((resolve) => {
                const server = net.createServer()
                    .once('error', () => {
                        resolve(false);
                    })
                    .once('listening', () => {
                        server.close();
                        resolve(true);
                    })
                    .listen(port, '127.0.0.1');
            });
        };

        // Try the primary port first
        if (await isPortAvailable(this.currentPort)) {
            return this.currentPort;
        }

        // Try fallback ports
        for (const port of config.server.fallbackPorts) {
            if (await isPortAvailable(port)) {
                this.currentPort = port;
                return port;
            }
        }

        throw new Error('No available ports found');
    }

    async initialize() {
        if (this.isInitialized) {
            console.log('Server already initialized');
            return this.currentPort;
        }

        try {
            const port = await this.findAvailablePort();
            console.log(`Server will use port: ${port}`);
            
            // Set environment variable for Next.js
            process.env.ROON_SERVER_PORT = port.toString();
            
            this.isInitialized = true;
            return port;
        } catch (error) {
            console.error('Failed to initialize server:', error);
            throw error;
        }
    }

    getPort() {
        return this.currentPort;
    }

    isReady() {
        return this.isInitialized;
    }
}

// Export a singleton instance
const serverInitializer = new ServerInitializer();
module.exports = serverInitializer; 