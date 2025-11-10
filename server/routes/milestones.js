const express = require("express");
const router = express.Router();
const { milestoneTracker } = require("../services/artist-milestone-tracker");
const { historyService } = require("../history-service");

// Initialize tracker on startup
(async () => {
  await milestoneTracker.initialize();
})();

// Get artist comparison data
router.get("/compare", async (req, res) => {
  try {
    const { artists } = req.query;
    
    if (!artists) {
      return res.status(400).json({ error: "Artists parameter required" });
    }

    const artistList = Array.isArray(artists) ? artists : artists.split(",");
    const comparison = milestoneTracker.getArtistComparison(artistList);

    res.json(comparison);
  } catch (error) {
    console.error("[Milestones API] Error getting comparison:", error);
    res.status(500).json({ error: "Failed to get artist comparison" });
  }
});

// Get album comparison for an artist
router.get("/albums/:artist", async (req, res) => {
  try {
    const { artist } = req.params;
    const comparison = milestoneTracker.getAlbumComparison(decodeURIComponent(artist));

    if (!comparison) {
      return res.status(404).json({ error: "Artist not found" });
    }

    res.json(comparison);
  } catch (error) {
    console.error("[Milestones API] Error getting album comparison:", error);
    res.status(500).json({ error: "Failed to get album comparison" });
  }
});

// Get growth trajectory for an artist
router.get("/trajectory/:artist", async (req, res) => {
  try {
    const { artist } = req.params;
    const trajectory = milestoneTracker.getGrowthTrajectory(decodeURIComponent(artist));

    if (!trajectory) {
      return res.status(404).json({ error: "Artist not found" });
    }

    res.json(trajectory);
  } catch (error) {
    console.error("[Milestones API] Error getting trajectory:", error);
    res.status(500).json({ error: "Failed to get growth trajectory" });
  }
});

// Get leaderboard
router.get("/leaderboard", async (req, res) => {
  try {
    const { metric = "totalPlays", limit = 20, offset = 0 } = req.query;
    console.log(`[Milestones API] Leaderboard request: metric=${metric}, limit=${limit}, offset=${offset}`);
    const result = milestoneTracker.getLeaderboard(metric, parseInt(limit), parseInt(offset));
    console.log(`[Milestones API] Returning ${result.artists.length} artists starting from offset ${offset}`);

    res.json({
      metric,
      artists: result.artists,
      total: result.total,
      offset: result.offset,
      limit: result.limit
    });
  } catch (error) {
    console.error("[Milestones API] Error getting leaderboard:", error);
    res.status(500).json({ error: "Failed to get leaderboard" });
  }
});

// Get all milestones
router.get("/all", async (req, res) => {
  try {
    res.json({
      milestones: milestoneTracker.milestones,
      artistCount: Object.keys(milestoneTracker.artistProgress).length,
    });
  } catch (error) {
    console.error("[Milestones API] Error getting all milestones:", error);
    res.status(500).json({ error: "Failed to get milestones" });
  }
});

// Get awards
router.get("/awards", async (req, res) => {
  try {
    const awards = milestoneTracker.generateAwards();
    res.json(awards);
  } catch (error) {
    console.error("[Milestones API] Error generating awards:", error);
    res.status(500).json({ error: "Failed to generate awards" });
  }
});

// Process historical data
router.post("/process-historical", async (req, res) => {
  try {
    console.log("[Milestones API] Starting historical data processing...");
    
    // Initialize history service if needed
    await historyService.initialize();
    
    // Get all tracks from history
    const tracks = historyService.getTracks();
    
    if (!tracks || tracks.length === 0) {
      return res.status(400).json({ 
        error: "No historical data found to process" 
      });
    }
    
    console.log(`[Milestones API] Processing ${tracks.length} historical tracks`);
    
    // Process the historical data
    const result = await milestoneTracker.processHistoricalData(tracks);
    
    console.log("[Milestones API] Historical processing complete:", result);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error("[Milestones API] Error processing historical data:", error);
    res.status(500).json({ 
      error: "Failed to process historical data",
      details: error.message 
    });
  }
});

// Get processing status
router.get("/status", async (req, res) => {
  try {
    const hasData = Object.keys(milestoneTracker.artistProgress).length > 0;
    
    res.json({
      initialized: milestoneTracker.initialized,
      hasData,
      artistCount: Object.keys(milestoneTracker.artistProgress).length,
      milestoneCount: milestoneTracker.milestones.length,
    });
  } catch (error) {
    console.error("[Milestones API] Error getting status:", error);
    res.status(500).json({ error: "Failed to get status" });
  }
});

module.exports = router;