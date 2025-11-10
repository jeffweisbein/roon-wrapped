const express = require("express");
const cors = require("cors");
const next = require("next");
const roonConnection = require("./roon-connection");
const { historyService } = require("./history-service");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

async function startServer() {
  try {
    await app.prepare();

    const server = express();
    server.use(cors());
    server.use(express.json());

    // Initialize Roon connection first
    console.log("Initializing Roon connection...");
    const connected = await roonConnection.connect();

    if (!connected) {
      console.error("Failed to connect to Roon on startup");
    } else {
      console.log("Successfully connected to Roon");
    }

    // Import routes after Roon is initialized
    const historyRoutes = require("./history");
    server.use("/api/history", historyRoutes);

    // Handle all other routes with Next.js
    server.all("*", (req, res) => {
      return handle(req, res);
    });

    // Error handling middleware
    server.use((err, req, res, next) => {
      console.error("Error:", err);
      res.status(500).json({
        error: "Internal server error",
        message: err.message,
      });
    });

    // Start server
    const port = process.env.PORT || 3002;
    server.listen(port, async () => {
      console.log(`Server listening on port ${port}`);

      try {
        // History service is already initialized in constructor
        console.log("History service ready");

        // Log initial Roon state
        const transport = roonConnection.transport();
        console.log("Initial Roon state:", {
          connected: roonConnection.isConnected(),
          hasTransport: !!transport,
          zones: transport
            ? Object.keys(transport.zone_by_zone_id || {}).length
            : 0,
        });
      } catch (error) {
        console.error("Startup error:", error);
      }
    });

    // Handle shutdown gracefully
    process.on("SIGTERM", async () => {
      console.log("Received SIGTERM signal. Starting graceful shutdown...");
      await roonConnection.shutdown();
      process.exit(0);
    });

    process.on("SIGINT", async () => {
      console.log("Received SIGINT signal. Starting graceful shutdown...");
      await roonConnection.shutdown();
      process.exit(0);
    });
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}

startServer();
