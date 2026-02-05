const express = require("express");
const router = express.Router();
const { roonConnection } = require("./roon-connection");
const { historyService } = require("./history-service");
const recommendationsRouter = require("./routes/recommendations");
const milestonesRouter = require("./routes/milestones");

// Mount recommendations routes
router.use("/api/recommendations", recommendationsRouter);

// Mount milestones routes
router.use("/api/milestones", milestonesRouter);

// Health check
router.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Roon status
router.get("/api/roon/status", (req, res) => {
  try {
    const state = roonConnection.getDetailedState();
    console.log("[Backend] Roon connection state:", state);
    res.json({
      connected: state.connected,
      core_name: state.core_name,
    });
  } catch (err) {
    console.error("[Backend] Error getting Roon status:", err);
    res.status(500).json({ error: err.message });
  }
});

// Connect to Roon
router.post("/api/roon/connect", (req, res) => {
  try {
    if (!roonConnection.isConnected()) {
      roonConnection.start();
    }
    res.json({ success: true });
  } catch (err) {
    console.error("[Routes] Error connecting to Roon:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// SSE endpoint for real-time now-playing updates
router.get("/api/roon/now-playing/sse", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
  });

  // Send initial keepalive
  res.write(":ok\n\n");

  // Register this client for updates
  roonConnection.addSSEClient(res);

  // Send a heartbeat every 30 seconds to keep connection alive
  const heartbeat = setInterval(() => {
    try {
      res.write(":heartbeat\n\n");
    } catch {
      clearInterval(heartbeat);
    }
  }, 30000);

  req.on("close", () => {
    clearInterval(heartbeat);
  });
});

// Now playing with enhanced stats
router.get("/api/roon/now-playing", async (req, res) => {
  try {
    const nowPlaying = roonConnection.getNowPlaying();
    
    if (!nowPlaying) {
      return res.json({ success: true, data: null });
    }
    
    // Get additional stats from history
    await historyService.initialize();
    const tracks = historyService.tracks;
    
    // Calculate play count for this track
    const playCount = tracks.filter(t => 
      t.title === nowPlaying.title && 
      t.artist === nowPlaying.artist
    ).length;
    
    // Calculate artist play count
    const artistPlayCount = tracks.filter(t => 
      t.artist === nowPlaying.artist
    ).length;
    
    // Get last played date for this track
    const trackHistory = tracks
      .filter(t => t.title === nowPlaying.title && t.artist === nowPlaying.artist)
      .sort((a, b) => b.timestamp - a.timestamp);
    
    const lastPlayed = trackHistory.length > 1 
      ? trackHistory[1].timestamp 
      : null;
    
    // Calculate if this is a frequently played track
    const allTrackPlays = {};
    tracks.forEach(t => {
      const key = `${t.title}::${t.artist}`;
      allTrackPlays[key] = (allTrackPlays[key] || 0) + 1;
    });
    const sortedTracks = Object.entries(allTrackPlays)
      .sort((a, b) => b[1] - a[1]);
    const trackRank = sortedTracks.findIndex(([key]) => 
      key === `${nowPlaying.title}::${nowPlaying.artist}`
    ) + 1;
    
    // Calculate listening time today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysTracks = tracks.filter(t => t.timestamp >= today.getTime());
    const todaysMinutes = Math.floor(
      todaysTracks.reduce((acc, t) => acc + (t.length || 0), 0) / 60
    );
    
    // Enhanced now playing data
    const enhancedNowPlaying = {
      ...nowPlaying,
      stats: {
        playCount,
        artistPlayCount,
        lastPlayed,
        trackRank: trackRank > 0 ? trackRank : null,
        isTopTrack: trackRank > 0 && trackRank <= 10,
        todaysListeningMinutes: todaysMinutes,
        totalTracksToday: todaysTracks.length
      }
    };
    
    res.json({ success: true, data: enhancedNowPlaying });
  } catch (err) {
    console.error("[Routes] Error getting now playing:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get wrapped data
router.get("/api/history/wrapped", async (req, res) => {
  try {
    console.log("[Backend] Wrapped endpoint called");

    // Initialize history service
    console.log("[Backend] Initializing history service");
    await historyService.initialize();
    console.log("[Backend] History service initialized");

    const period = req.query.period || "all";
    console.log("[Backend] Getting wrapped data for period:", period);

    // Log the raw tracks data first
    console.log(
      "[Backend] Total tracks in history:",
      historyService.tracks.length,
    );
    if (historyService.tracks.length > 0) {
      console.log("[Backend] Sample track:", historyService.tracks[0]);
    }

    const data = historyService.getWrappedData(period);

    // Log the filtered tracks and calculations
    console.log("[Backend] Filtered tracks:", {
      totalTracks: data.totalTracksPlayed,
      uniqueArtists: data.uniqueArtistsCount,
      uniqueAlbums: data.uniqueAlbumsCount,
      uniqueTracks: data.uniqueTracksCount,
    });

    // Log the top items
    console.log("[Backend] Top items:", {
      artists: data.topArtistsByPlays?.length || 0,
      albums: data.topAlbumsByPlays?.length || 0,
      tracks: data.topTracksByPlays?.length || 0,
    });

    // Log the listening patterns
    console.log("[Backend] Listening patterns:", {
      timeOfDay: data.listeningPatterns?.timeOfDay,
      dayOfWeekPlays: data.listeningPatterns?.dayOfWeekPlays,
    });

    // Log sample entries if they exist
    if (data.topArtistsByPlays?.length > 0) {
      console.log("[Backend] Sample top artist:", data.topArtistsByPlays[0]);
    }
    if (data.topAlbumsByPlays?.length > 0) {
      console.log("[Backend] Sample top album:", data.topAlbumsByPlays[0]);
    }
    if (data.topTracksByPlays?.length > 0) {
      console.log("[Backend] Sample top track:", data.topTracksByPlays[0]);
    }

    res.json(data);
  } catch (err) {
    console.error("[Backend] Error getting wrapped data:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get Roon image
router.get("/api/roon/image/:key", async (req, res) => {
  try {
    if (!roonConnection.isConnected()) {
      return res.status(503).json({ error: "Roon not connected" });
    }

    const imageKey = req.params.key;
    const image = await roonConnection.getImage(imageKey);

    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    res.set("Content-Type", image.content_type);
    res.set("Cache-Control", "public, max-age=31536000, immutable");
    res.send(image.image);
  } catch (err) {
    console.error("[Routes] Error getting image:", err);
    res.status(500).json({ error: err.message });
  }
});

// Transport controls
router.post("/api/roon/transport/playpause", async (req, res) => {
  try {
    const result = await roonConnection.playPause();
    res.json(result);
  } catch (err) {
    console.error("[Routes] Error toggling play/pause:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/api/roon/transport/next", async (req, res) => {
  try {
    const result = await roonConnection.next();
    res.json(result);
  } catch (err) {
    console.error("[Routes] Error skipping to next:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/api/roon/transport/previous", async (req, res) => {
  try {
    const result = await roonConnection.previous();
    res.json(result);
  } catch (err) {
    console.error("[Routes] Error going to previous:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get album tracks from history
router.get("/api/roon/album-tracks", async (req, res) => {
  try {
    const { album, artist } = req.query;
    
    if (!album) {
      return res.status(400).json({ error: "Album parameter required" });
    }

    // Initialize history service
    await historyService.initialize();
    const tracks = historyService.tracks;
    
    // Find all unique tracks from this album
    const albumTracks = tracks.filter(t => 
      t.album === album && (!artist || t.artist === artist)
    );
    
    // Get unique tracks with play counts
    const trackMap = new Map();
    albumTracks.forEach(t => {
      if (!trackMap.has(t.title)) {
        trackMap.set(t.title, {
          title: t.title,
          artist: t.artist,
          album: t.album,
          duration: t.length || 0,
          playCount: 1,
          lastPlayed: t.timestamp
        });
      } else {
        const existing = trackMap.get(t.title);
        existing.playCount++;
        if (t.timestamp > existing.lastPlayed) {
          existing.lastPlayed = t.timestamp;
        }
      }
    });
    
    // Convert to array and sort by title (approximates track order)
    const uniqueTracks = Array.from(trackMap.values())
      .sort((a, b) => a.title.localeCompare(b.title));
    
    res.json({ 
      success: true, 
      album,
      artist,
      tracks: uniqueTracks,
      totalPlays: albumTracks.length
    });
  } catch (err) {
    console.error("[Routes] Error getting album tracks:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Error handler
router.use((err, req, res, next) => {
  console.error("[Routes] Unhandled error:", err);
  res.status(500).json({ success: false, error: err.message });
});

module.exports = router;
