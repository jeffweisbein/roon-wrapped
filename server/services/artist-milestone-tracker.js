const fs = require("fs");
const path = require("path");

class ArtistMilestoneTracker {
  constructor() {
    this.milestonesFile = path.join(__dirname, "../../data/artist-milestones.json");
    this.progressFile = path.join(__dirname, "../../data/artist-progress.json");
    this.milestones = [];
    this.artistProgress = {};
    this.initialized = false;
    
    // Define milestone thresholds
    this.milestoneThresholds = [10, 25, 50, 100, 250, 500, 1000];
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Load existing milestones
      if (fs.existsSync(this.milestonesFile)) {
        const data = fs.readFileSync(this.milestonesFile, "utf8");
        this.milestones = JSON.parse(data);
      }

      // Load artist progress
      if (fs.existsSync(this.progressFile)) {
        const data = fs.readFileSync(this.progressFile, "utf8");
        this.artistProgress = JSON.parse(data);
      }

      this.initialized = true;
      console.log("[MilestoneTracker] Initialized with", Object.keys(this.artistProgress).length, "artists");
    } catch (err) {
      console.error("[MilestoneTracker] Error initializing:", err);
      this.milestones = [];
      this.artistProgress = {};
    }
  }

  async processHistoricalData(tracks) {
    console.log(`[MilestoneTracker] Processing ${tracks.length} historical tracks...`);
    
    // Sort tracks by timestamp (oldest first)
    const sortedTracks = [...tracks].sort((a, b) => a.timestamp - b.timestamp);
    
    // Reset progress data for reprocessing
    this.artistProgress = {};
    this.milestones = [];
    
    let processedCount = 0;
    const startTime = Date.now();
    
    for (const track of sortedTracks) {
      // Process each track as if it was played at that time
      await this.trackPlay(track, true); // Pass true to skip saving on each track
      processedCount++;
      
      // Log progress every 1000 tracks
      if (processedCount % 1000 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = processedCount / elapsed;
        console.log(`[MilestoneTracker] Processed ${processedCount}/${tracks.length} tracks (${rate.toFixed(1)} tracks/sec)`);
      }
    }
    
    // Save once at the end
    await this.saveProgress();
    
    const totalTime = (Date.now() - startTime) / 1000;
    console.log(`[MilestoneTracker] Completed processing ${processedCount} tracks in ${totalTime.toFixed(1)}s`);
    console.log(`[MilestoneTracker] Found ${Object.keys(this.artistProgress).length} unique artists`);
    console.log(`[MilestoneTracker] Recorded ${this.milestones.length} milestones`);
    
    return {
      tracksProcessed: processedCount,
      uniqueArtists: Object.keys(this.artistProgress).length,
      milestonesRecorded: this.milestones.length,
      processingTime: totalTime
    };
  }

  async trackPlay(track, skipSave = false) {
    if (!track.artist || !track.timestamp) return;

    const artistKey = this.normalizeArtist(track.artist);
    const albumKey = `${artistKey}::${track.album}`;
    const now = track.timestamp;

    // Initialize artist if not tracked
    if (!this.artistProgress[artistKey]) {
      this.artistProgress[artistKey] = {
        firstListenDate: now,
        totalPlays: 0,
        albums: {},
        milestones: [],
        metrics: {
          daysToTenPlays: null,
          daysToFiftyPlays: null,
          daysToHundredPlays: null,
          playRate: null, // plays per day
          accelerationRate: null, // change in play rate over time
        }
      };
    }

    // Initialize album if not tracked (only if album exists)
    if (track.album && !this.artistProgress[artistKey].albums[albumKey]) {
      this.artistProgress[artistKey].albums[albumKey] = {
        firstListenDate: now,
        totalPlays: 0,
        title: track.album,
        milestones: [],
        metrics: {
          daysToTenPlays: null,
          daysToFiftyPlays: null,
          playRate: null,
        }
      };
    }

    // Update play counts
    const artistData = this.artistProgress[artistKey];
    const albumData = track.album ? artistData.albums[albumKey] : null;
    
    artistData.totalPlays++;
    if (albumData) {
      albumData.totalPlays++;
    }

    // Check for milestones
    this.checkMilestones(artistKey, artistData, now);
    if (albumData) {
      this.checkAlbumMilestones(artistKey, albumKey, albumData, now);
    }

    // Update metrics
    this.updateMetrics(artistData, now);
    if (albumData) {
      this.updateAlbumMetrics(albumData, now);
    }

    // Save progress (unless we're batch processing)
    if (!skipSave) {
      await this.saveProgress();
    }
  }

  checkMilestones(artistKey, artistData, timestamp) {
    for (const threshold of this.milestoneThresholds) {
      if (artistData.totalPlays === threshold) {
        const daysSinceFirst = this.getDaysSince(artistData.firstListenDate, timestamp);
        
        const milestone = {
          artist: artistKey,
          milestone: threshold,
          reachedAt: timestamp,
          daysSinceFirstListen: daysSinceFirst,
          playRate: threshold / daysSinceFirst,
        };

        // Add to milestones
        this.milestones.push(milestone);
        artistData.milestones.push(milestone);

        // Update specific metrics
        if (threshold === 10) artistData.metrics.daysToTenPlays = daysSinceFirst;
        if (threshold === 50) artistData.metrics.daysToFiftyPlays = daysSinceFirst;
        if (threshold === 100) artistData.metrics.daysToHundredPlays = daysSinceFirst;

        console.log(`[MilestoneTracker] ${artistKey} reached ${threshold} plays in ${daysSinceFirst} days`);
      }
    }
  }

  checkAlbumMilestones(artistKey, albumKey, albumData, timestamp) {
    const albumThresholds = [10, 25, 50, 100];
    
    for (const threshold of albumThresholds) {
      if (albumData.totalPlays === threshold) {
        const daysSinceFirst = this.getDaysSince(albumData.firstListenDate, timestamp);
        
        const milestone = {
          artist: artistKey,
          album: albumData.title,
          milestone: threshold,
          reachedAt: timestamp,
          daysSinceFirstListen: daysSinceFirst,
          playRate: threshold / daysSinceFirst,
        };

        albumData.milestones.push(milestone);

        // Update specific metrics
        if (threshold === 10) albumData.metrics.daysToTenPlays = daysSinceFirst;
        if (threshold === 50) albumData.metrics.daysToFiftyPlays = daysSinceFirst;

        console.log(`[MilestoneTracker] Album "${albumData.title}" by ${artistKey} reached ${threshold} plays in ${daysSinceFirst} days`);
      }
    }
  }

  updateMetrics(artistData, currentTimestamp) {
    const daysSinceFirst = this.getDaysSince(artistData.firstListenDate, currentTimestamp);
    
    if (daysSinceFirst > 0) {
      const currentPlayRate = artistData.totalPlays / daysSinceFirst;
      
      // Calculate acceleration as the trend in play rate
      // We'll look at the play rate from the first half vs second half of listening period
      if (daysSinceFirst > 7 && artistData.milestones.length > 0) {
        const midPoint = Math.floor(daysSinceFirst / 2);
        
        // Find plays at midpoint from milestones or estimate
        let playsAtMidpoint = 0;
        for (const milestone of artistData.milestones) {
          if (milestone.daysSinceFirstListen <= midPoint) {
            playsAtMidpoint = milestone.milestone;
          } else {
            break;
          }
        }
        
        // If we have a midpoint value, calculate acceleration
        if (playsAtMidpoint > 0) {
          const firstHalfRate = playsAtMidpoint / midPoint;
          const secondHalfPlays = artistData.totalPlays - playsAtMidpoint;
          const secondHalfDays = daysSinceFirst - midPoint;
          const secondHalfRate = secondHalfDays > 0 ? secondHalfPlays / secondHalfDays : 0;
          
          // Acceleration is the change in rate per day
          artistData.metrics.accelerationRate = (secondHalfRate - firstHalfRate) / daysSinceFirst;
        } else {
          // For artists with few plays, set acceleration to 0
          artistData.metrics.accelerationRate = 0;
        }
      } else {
        artistData.metrics.accelerationRate = 0;
      }
      
      artistData.metrics.playRate = currentPlayRate;
    }
  }

  updateAlbumMetrics(albumData, currentTimestamp) {
    const daysSinceFirst = this.getDaysSince(albumData.firstListenDate, currentTimestamp);
    
    if (daysSinceFirst > 0) {
      albumData.metrics.playRate = albumData.totalPlays / daysSinceFirst;
    }
  }

  getDaysSince(startTimestamp, endTimestamp) {
    const diff = endTimestamp - startTimestamp;
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  normalizeArtist(artist) {
    if (!artist) return "";
    const normalized = artist.trim().toLowerCase();
    if (normalized.includes("blink") && normalized.includes("182")) {
      return "blink-182";
    }
    if (normalized === "knox") {
      return "Knox";
    }
    return artist.trim();
  }

  async saveProgress() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.milestonesFile);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      await fs.promises.writeFile(
        this.progressFile,
        JSON.stringify(this.artistProgress, null, 2)
      );

      await fs.promises.writeFile(
        this.milestonesFile,
        JSON.stringify(this.milestones, null, 2)
      );
    } catch (err) {
      console.error("[MilestoneTracker] Error saving progress:", err);
    }
  }

  // Get comparison data for multiple artists
  getArtistComparison(artistNames = []) {
    const comparison = [];
    
    for (const artistName of artistNames) {
      const artistKey = this.normalizeArtist(artistName);
      const data = this.artistProgress[artistKey];
      
      if (data) {
        comparison.push({
          artist: artistKey,
          firstListen: data.firstListenDate,
          totalPlays: data.totalPlays,
          daysToTenPlays: data.metrics.daysToTenPlays,
          daysToFiftyPlays: data.metrics.daysToFiftyPlays,
          daysToHundredPlays: data.metrics.daysToHundredPlays,
          currentPlayRate: data.metrics.playRate,
          acceleration: data.metrics.accelerationRate,
          albums: Object.keys(data.albums).length,
          milestones: data.milestones,
        });
      }
    }

    // Sort by various metrics for comparison
    return {
      byTotalPlays: [...comparison].sort((a, b) => b.totalPlays - a.totalPlays),
      byPlayRate: [...comparison].sort((a, b) => (b.currentPlayRate || 0) - (a.currentPlayRate || 0)),
      byFastestToFifty: [...comparison]
        .filter(a => a.daysToFiftyPlays !== null)
        .sort((a, b) => a.daysToFiftyPlays - b.daysToFiftyPlays),
      byAcceleration: [...comparison]
        .filter(a => a.acceleration !== null)
        .sort((a, b) => (b.acceleration || 0) - (a.acceleration || 0)),
    };
  }

  // Get album performance comparison for an artist
  getAlbumComparison(artistName) {
    const artistKey = this.normalizeArtist(artistName);
    const artistData = this.artistProgress[artistKey];
    
    if (!artistData) return null;

    const albums = Object.entries(artistData.albums).map(([key, data]) => ({
      album: data.title,
      firstListen: data.firstListenDate,
      totalPlays: data.totalPlays,
      daysToTenPlays: data.metrics.daysToTenPlays,
      daysToFiftyPlays: data.metrics.daysToFiftyPlays,
      playRate: data.metrics.playRate,
      milestones: data.milestones,
    }));

    return {
      artist: artistKey,
      albums: albums.sort((a, b) => b.totalPlays - a.totalPlays),
      fastestToTen: albums
        .filter(a => a.daysToTenPlays !== null)
        .sort((a, b) => a.daysToTenPlays - b.daysToTenPlays)[0],
      highestPlayRate: albums
        .filter(a => a.playRate !== null)
        .sort((a, b) => b.playRate - a.playRate)[0],
    };
  }

  // Get growth trajectory data for charting
  getGrowthTrajectory(artistName) {
    const artistKey = this.normalizeArtist(artistName);
    const artistData = this.artistProgress[artistKey];
    
    if (!artistData) return null;

    const trajectory = [];
    const milestones = artistData.milestones.sort((a, b) => a.milestone - b.milestone);

    // Add starting point
    trajectory.push({
      days: 0,
      plays: 0,
      milestone: "First Listen",
    });

    // Add each milestone
    for (const milestone of milestones) {
      trajectory.push({
        days: milestone.daysSinceFirstListen,
        plays: milestone.milestone,
        milestone: `${milestone.milestone} plays`,
        playRate: milestone.playRate,
      });
    }

    // Add current state if beyond last milestone
    const daysSinceFirst = this.getDaysSince(artistData.firstListenDate, Date.now());
    if (artistData.totalPlays > (milestones[milestones.length - 1]?.milestone || 0)) {
      trajectory.push({
        days: daysSinceFirst,
        plays: artistData.totalPlays,
        milestone: "Current",
        playRate: artistData.metrics.playRate,
      });
    }

    return {
      artist: artistKey,
      trajectory,
      totalDays: daysSinceFirst,
      totalPlays: artistData.totalPlays,
      averagePlayRate: artistData.metrics.playRate,
    };
  }

  // Generate awards based on listening patterns
  generateAwards() {
    const awards = [];
    const artists = Object.entries(this.artistProgress);
    
    if (artists.length === 0) return awards;
    
    // Speed Demon - Fastest to 50 plays
    const fastestToFifty = artists
      .filter(([_, data]) => data.metrics.daysToFiftyPlays !== null)
      .sort((a, b) => a[1].metrics.daysToFiftyPlays - b[1].metrics.daysToFiftyPlays)[0];
    
    if (fastestToFifty) {
      awards.push({
        id: "speed-demon",
        title: "Speed Demon 🏎️",
        description: `Reached 50 plays in just ${fastestToFifty[1].metrics.daysToFiftyPlays} days`,
        artist: fastestToFifty[0],
        metric: `${fastestToFifty[1].metrics.daysToFiftyPlays} days`,
        color: "#FF6B6B"
      });
    }
    
    // Marathon Listener - Most total plays
    const mostPlays = artists.sort((a, b) => b[1].totalPlays - a[1].totalPlays)[0];
    if (mostPlays && mostPlays[1].totalPlays > 100) {
      awards.push({
        id: "marathon-listener",
        title: "Marathon Listener 🎧",
        description: `${mostPlays[1].totalPlays} total plays`,
        artist: mostPlays[0],
        metric: `${mostPlays[1].totalPlays} plays`,
        color: "#4ECDC4"
      });
    }
    
    // Day One Fan - Listened to consistently from day 1
    const dayOneFans = artists
      .filter(([_, data]) => {
        const daysActive = this.getDaysSince(data.firstListenDate, Date.now());
        return data.metrics.playRate > 1 && daysActive > 30 && data.totalPlays > 50;
      })
      .sort((a, b) => b[1].metrics.playRate - a[1].metrics.playRate)[0];
    
    if (dayOneFans) {
      awards.push({
        id: "day-one-fan",
        title: "Day One Fan 💯",
        description: `${dayOneFans[1].metrics.playRate.toFixed(1)} plays/day consistently`,
        artist: dayOneFans[0],
        metric: `${dayOneFans[1].metrics.playRate.toFixed(1)}/day`,
        color: "#95E77E"
      });
    }
    
    // Rising Star - Highest positive acceleration
    const risingStars = artists
      .filter(([_, data]) => data.metrics.accelerationRate > 0 && data.totalPlays > 25)
      .sort((a, b) => b[1].metrics.accelerationRate - a[1].metrics.accelerationRate)[0];
    
    if (risingStars) {
      awards.push({
        id: "rising-star",
        title: "Rising Star ⭐",
        description: `Accelerating at +${risingStars[1].metrics.accelerationRate.toFixed(4)} plays/day²`,
        artist: risingStars[0],
        metric: `+${risingStars[1].metrics.accelerationRate.toFixed(4)}/day²`,
        color: "#FFE66D"
      });
    }
    
    // Album Collector - Most albums from one artist
    const albumCollectors = artists
      .map(([artist, data]) => ({
        artist,
        albumCount: Object.keys(data.albums).length,
        totalPlays: data.totalPlays
      }))
      .filter(a => a.albumCount > 3 && a.totalPlays > 50)
      .sort((a, b) => b.albumCount - a.albumCount)[0];
    
    if (albumCollectors) {
      awards.push({
        id: "album-collector",
        title: "Album Collector 📀",
        description: `${albumCollectors.albumCount} different albums played`,
        artist: albumCollectors.artist,
        metric: `${albumCollectors.albumCount} albums`,
        color: "#A8E6CF"
      });
    }
    
    // Slow Burn - Took longest to reach 100 plays but got there
    const slowBurns = artists
      .filter(([_, data]) => data.metrics.daysToHundredPlays !== null)
      .sort((a, b) => b[1].metrics.daysToHundredPlays - a[1].metrics.daysToHundredPlays)[0];
    
    if (slowBurns && slowBurns[1].metrics.daysToHundredPlays > 50) {
      awards.push({
        id: "slow-burn",
        title: "Slow Burn 🔥",
        description: `Took ${slowBurns[1].metrics.daysToHundredPlays} days to reach 100 plays`,
        artist: slowBurns[0],
        metric: `${slowBurns[1].metrics.daysToHundredPlays} days`,
        color: "#FF8B94"
      });
    }
    
    // Commitment Champion - Reached 1000 plays
    const thousandClub = artists
      .filter(([_, data]) => data.totalPlays >= 1000)
      .sort((a, b) => b[1].totalPlays - a[1].totalPlays);
    
    if (thousandClub.length > 0) {
      awards.push({
        id: "thousand-club",
        title: "1K Club Member 🏆",
        description: `Elite club of ${thousandClub.length} artist${thousandClub.length > 1 ? 's' : ''}`,
        artist: thousandClub[0][0],
        metric: `${thousandClub[0][1].totalPlays} plays`,
        color: "#FFD700"
      });
    }
    
    // Discovery Mode - For having many artists with 10+ plays
    const discoveryCount = artists.filter(([_, data]) => data.totalPlays >= 10).length;
    if (discoveryCount > 50) {
      awards.push({
        id: "discovery-mode",
        title: "Discovery Mode 🔍",
        description: `${discoveryCount} artists with 10+ plays`,
        artist: "Your Library",
        metric: `${discoveryCount} artists`,
        color: "#B4A7D6"
      });
    }
    
    // Night Owl - If someone has a lot of plays but started recently
    const recentStarters = artists
      .filter(([_, data]) => {
        const daysActive = this.getDaysSince(data.firstListenDate, Date.now());
        return daysActive < 30 && data.totalPlays > 100;
      })
      .sort((a, b) => b[1].totalPlays - a[1].totalPlays)[0];
    
    if (recentStarters) {
      const days = this.getDaysSince(recentStarters[1].firstListenDate, Date.now());
      awards.push({
        id: "binge-master",
        title: "Binge Master 🎵",
        description: `${recentStarters[1].totalPlays} plays in just ${days} days`,
        artist: recentStarters[0],
        metric: `${(recentStarters[1].totalPlays / days).toFixed(1)}/day`,
        color: "#C39BD3"
      });
    }
    
    return awards;
  }

  // Get all artists sorted by performance metrics
  getLeaderboard(metric = "totalPlays", limit = 20, offset = 0) {
    const artists = Object.entries(this.artistProgress).map(([artist, data]) => ({
      artist,
      totalPlays: data.totalPlays,
      daysActive: this.getDaysSince(data.firstListenDate, Date.now()),
      playRate: data.metrics.playRate || 0,
      acceleration: data.metrics.accelerationRate || 0,
      albumCount: Object.keys(data.albums).length,
      milestoneCount: data.milestones.length,
      daysToFifty: data.metrics.daysToFiftyPlays,
      daysToHundred: data.metrics.daysToHundredPlays,
    }));

    // Sort by requested metric with secondary sort by artist name for stability
    const sortFunctions = {
      totalPlays: (a, b) => {
        const diff = b.totalPlays - a.totalPlays;
        return diff !== 0 ? diff : a.artist.localeCompare(b.artist);
      },
      playRate: (a, b) => {
        const diff = b.playRate - a.playRate;
        return diff !== 0 ? diff : a.artist.localeCompare(b.artist);
      },
      acceleration: (a, b) => {
        const diff = b.acceleration - a.acceleration;
        return diff !== 0 ? diff : a.artist.localeCompare(b.artist);
      },
      fastestToFifty: (a, b) => {
        if (!a.daysToFifty && !b.daysToFifty) return a.artist.localeCompare(b.artist);
        if (!a.daysToFifty) return 1;
        if (!b.daysToFifty) return -1;
        const diff = a.daysToFifty - b.daysToFifty;
        return diff !== 0 ? diff : a.artist.localeCompare(b.artist);
      },
      albumCount: (a, b) => {
        const diff = b.albumCount - a.albumCount;
        return diff !== 0 ? diff : a.artist.localeCompare(b.artist);
      },
    };

    const sortFn = sortFunctions[metric] || sortFunctions.totalPlays;
    const sortedArtists = artists.sort(sortFn);
    
    return {
      artists: sortedArtists.slice(offset, offset + limit),
      total: sortedArtists.length,
      offset,
      limit
    };
  }
}

const milestoneTracker = new ArtistMilestoneTracker();
module.exports = { milestoneTracker };