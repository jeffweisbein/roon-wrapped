const fs = require("fs");
const path = require("path");
const { historyService } = require("./history-service");

async function cleanupHistory() {
  try {
    console.log("[Cleanup] Starting history cleanup");

    // Initialize history service
    await historyService.initialize();

    // Get current tracks
    const tracks = historyService.tracks;
    console.log(`[Cleanup] Processing ${tracks.length} tracks`);

    // Remove duplicates based on key and timestamp
    const uniqueTracks = [];
    const seen = new Set();

    tracks.forEach((track) => {
      const key = `${track.key}-${track.timestamp}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueTracks.push(track);
      }
    });

    console.log(
      `[Cleanup] Removed ${tracks.length - uniqueTracks.length} duplicate tracks`,
    );

    // Sort by timestamp descending
    uniqueTracks.sort((a, b) => b.timestamp - a.timestamp);

    // Save cleaned up tracks
    await historyService.saveTracks(uniqueTracks);
    console.log("[Cleanup] Saved cleaned up tracks");

    // Create backup
    const backupDir = path.join(__dirname, "../data/backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date()
      .toISOString()
      .replace(/:/g, "-")
      .replace(/\./g, "-");
    const backupPath = path.join(
      backupDir,
      `listening-history-${timestamp}.json`,
    );

    await fs.promises.copyFile(historyService.historyFile, backupPath);

    console.log("[Cleanup] Created backup at:", backupPath);
  } catch (err) {
    console.error("[Cleanup] Error during cleanup:", err);
  }
}

// Run cleanup every day at midnight
const CronJob = require("cron").CronJob;
const job = new CronJob("0 0 * * *", cleanupHistory);

// Start the job
job.start();

// Also run immediately on startup
cleanupHistory();

process.on("SIGTERM", () => {
  console.log("[Cleanup] Shutting down backup service...");
  process.exit(0);
});
