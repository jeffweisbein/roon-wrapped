#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { milestoneTracker } = require("../server/services/artist-milestone-tracker");

async function processHistoricalData() {
  console.log("=".repeat(60));
  console.log("MILESTONE TRACKER - HISTORICAL DATA PROCESSOR");
  console.log("=".repeat(60));
  
  try {
    // Initialize the milestone tracker
    await milestoneTracker.initialize();
    
    // Load all historical data files
    const dataDir = path.join(__dirname, "../data");
    const historyFiles = fs.readdirSync(dataDir)
      .filter(file => file.startsWith("listening-history") && file.endsWith(".json"))
      .sort();
    
    console.log(`Found ${historyFiles.length} history file(s) to process`);
    
    let allTracks = [];
    
    // Load tracks from each file
    for (const file of historyFiles) {
      const filePath = path.join(dataDir, file);
      console.log(`Loading ${file}...`);
      
      try {
        const data = fs.readFileSync(filePath, "utf8");
        const tracks = JSON.parse(data);
        
        if (Array.isArray(tracks)) {
          console.log(`  - Loaded ${tracks.length} tracks from ${file}`);
          allTracks = allTracks.concat(tracks);
        }
      } catch (err) {
        console.error(`  - Error loading ${file}:`, err.message);
      }
    }
    
    // Also check the server/data directory
    const serverDataDir = path.join(__dirname, "../server/data");
    if (fs.existsSync(serverDataDir)) {
      const serverHistoryFile = path.join(serverDataDir, "history.json");
      if (fs.existsSync(serverHistoryFile)) {
        console.log("Loading server/data/history.json...");
        try {
          const data = fs.readFileSync(serverHistoryFile, "utf8");
          const tracks = JSON.parse(data);
          
          if (Array.isArray(tracks)) {
            console.log(`  - Loaded ${tracks.length} tracks from server history`);
            allTracks = allTracks.concat(tracks);
          }
        } catch (err) {
          console.error("  - Error loading server history:", err.message);
        }
      }
    }
    
    console.log(`\nTotal tracks loaded: ${allTracks.length}`);
    
    if (allTracks.length === 0) {
      console.log("No tracks found to process!");
      return;
    }
    
    // Remove duplicates based on timestamp
    const uniqueTracks = [];
    const seenTimestamps = new Set();
    
    for (const track of allTracks) {
      if (!seenTimestamps.has(track.timestamp)) {
        seenTimestamps.add(track.timestamp);
        uniqueTracks.push(track);
      }
    }
    
    console.log(`Unique tracks after deduplication: ${uniqueTracks.length}`);
    console.log("-".repeat(60));
    
    // Process the historical data
    console.log("Starting historical data processing...");
    console.log("This may take a few minutes depending on the size of your history.");
    console.log("-".repeat(60));
    
    const result = await milestoneTracker.processHistoricalData(uniqueTracks);
    
    console.log("-".repeat(60));
    console.log("PROCESSING COMPLETE!");
    console.log("-".repeat(60));
    console.log(`Tracks processed: ${result.tracksProcessed}`);
    console.log(`Unique artists found: ${result.uniqueArtists}`);
    console.log(`Milestones recorded: ${result.milestonesRecorded}`);
    console.log(`Processing time: ${result.processingTime.toFixed(1)} seconds`);
    console.log("-".repeat(60));
    
    // Show some interesting stats
    const leaderboard = milestoneTracker.getLeaderboard("totalPlays", 5);
    if (leaderboard.length > 0) {
      console.log("\nTop 5 Most Played Artists:");
      leaderboard.forEach((artist, index) => {
        console.log(`  ${index + 1}. ${artist.artist}: ${artist.totalPlays} plays (${artist.playRate.toFixed(1)} plays/day)`);
      });
    }
    
    const fastestToFifty = milestoneTracker.getLeaderboard("fastestToFifty", 5);
    const validFastest = fastestToFifty.filter(a => a.daysToFifty !== null);
    if (validFastest.length > 0) {
      console.log("\nFastest Artists to 50 Plays:");
      validFastest.slice(0, 5).forEach((artist, index) => {
        console.log(`  ${index + 1}. ${artist.artist}: ${artist.daysToFifty} days`);
      });
    }
    
    console.log("\n✅ Milestone data has been saved to:");
    console.log(`  - ${path.join(dataDir, "artist-milestones.json")}`);
    console.log(`  - ${path.join(dataDir, "artist-progress.json")}`);
    
  } catch (error) {
    console.error("Error processing historical data:", error);
    process.exit(1);
  }
}

// Run the processor
processHistoricalData().then(() => {
  console.log("\n🎉 Historical data processing complete!");
  process.exit(0);
}).catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});