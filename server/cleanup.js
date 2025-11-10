const fs = require("fs");
const path = require("path");

const HISTORY_FILE = path.join(
  __dirname,
  "..",
  "data",
  "listening-history.json",
);

function cleanupDuplicates() {
  // Read the history file
  const data = fs.readFileSync(HISTORY_FILE, "utf8");
  const history = JSON.parse(data);

  // Get timestamp for 1 hour ago
  const oneHourAgo = Date.now() - 60 * 60 * 1000;

  // Split into recent and older tracks
  const recentTracks = history.filter(
    (track) => new Date(track.timestamp).getTime() > oneHourAgo,
  );
  const olderTracks = history.filter(
    (track) => new Date(track.timestamp).getTime() <= oneHourAgo,
  );

  // Clean up recent tracks
  const cleanedRecentTracks = [];
  const seen = new Map();

  recentTracks.forEach((track) => {
    const key = `${track.title}:${track.artist}:${track.album}`;
    const existingTrack = seen.get(key);

    if (!existingTrack) {
      seen.set(key, track);
      cleanedRecentTracks.push(track);
    } else {
      const timeDiff =
        new Date(track.timestamp).getTime() -
        new Date(existingTrack.timestamp).getTime();
      const seekDiff = Math.abs(
        track.seek_position - existingTrack.seek_position,
      );

      // Keep the track if it's more than 3 minutes apart or seek position changed significantly
      if (timeDiff > 180000 && seekDiff > 30) {
        cleanedRecentTracks.push(track);
      }
    }
  });

  // Combine and save
  const newHistory = [...olderTracks, ...cleanedRecentTracks].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  // Backup the original file
  fs.copyFileSync(HISTORY_FILE, HISTORY_FILE + ".backup");

  // Save the cleaned history
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(newHistory, null, 2));

  console.log(`Original recent tracks: ${recentTracks.length}`);
  console.log(`Cleaned recent tracks: ${cleanedRecentTracks.length}`);
  console.log(
    `Removed ${recentTracks.length - cleanedRecentTracks.length} duplicates`,
  );
  console.log("Backup saved as listening-history.json.backup");
}

cleanupDuplicates();
