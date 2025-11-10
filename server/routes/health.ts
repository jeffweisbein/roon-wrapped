import { Router } from "express";
import os from "os";

import { roonConnection } from "../roon-connection";
import { log } from "../utils/logger";

const router = Router();

router.get("/health", (_req, res) => {
  try {
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
      },
      cpu: os.loadavg(),
      roon: {
        isConnected: roonConnection?.isConnected() || false,
        core_name: roonConnection?.core?.display_name || null,
      },
    };

    log("debug", "Health check performed", health);
    res.json(health);
  } catch (error) {
    log("error", "Health check failed", {
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });

    res.status(500).json({
      status: "error",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
