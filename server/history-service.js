const fs = require("fs");
const path = require("path");

class HistoryService {
  constructor() {
    this.tracks = [];
    this.historyFile = path.join(__dirname, "../data/listening-history.json");
    this.initialized = false;
    this.initializationPromise = null;
  }

  async initialize() {
    if (this.initialized) {
      console.log("[History] Already initialized");
      return;
    }

    // If initialization is already in progress, return the existing promise
    if (this.initializationPromise) {
      console.log("[History] Initialization already in progress, waiting...");
      return this.initializationPromise;
    }

    // Create a new initialization promise
    this.initializationPromise = this._performInitialization();

    try {
      await this.initializationPromise;
    } finally {
      // Clear the promise after completion
      this.initializationPromise = null;
    }
  }

  async _performInitialization() {
    try {
      console.log("[History] Starting initialization");
      console.log("[History] History file path:", this.historyFile);

      // Load existing history
      try {
        if (!fs.existsSync(this.historyFile)) {
          console.warn(
            "[History] History file does not exist at:",
            this.historyFile,
          );
          this.tracks = [];
          return;
        }

        const data = fs.readFileSync(this.historyFile, "utf8");
        console.log("[History] Successfully read file");

        try {
          this.tracks = JSON.parse(data);
          console.log("[History] Successfully parsed JSON data");
          console.log("[History] Loaded tracks:", {
            count: this.tracks.length,
            firstTrack: this.tracks[0],
            lastTrack: this.tracks[this.tracks.length - 1],
          });
        } catch (parseErr) {
          console.error("[History] Error parsing JSON:", parseErr);
          this.tracks = [];
        }
      } catch (err) {
        console.error("[History] Error reading history file:", err);
        if (err.code === "ENOENT") {
          console.warn(
            "[History] No history file found, starting with empty tracks",
          );
        }
        this.tracks = [];
      }

      this.initialized = true;
      console.log(
        "[History] Initialization complete. Total tracks:",
        this.tracks.length,
      );
    } catch (err) {
      console.error("[History] Failed to initialize:", err);
      throw err;
    }
  }

  async addTrack(track) {
    if (!track.title || !track.artist || !track.timestamp) {
      console.error("[History] Invalid track:", track);
      return;
    }

    console.log("[History] Adding track:", {
      title: track.title,
      artist: track.artist,
      timestamp: new Date(track.timestamp).toISOString(),
    });

    // Add to start of array
    this.tracks.unshift(track);

    // Save immediately
    try {
      await fs.promises.writeFile(
        this.historyFile,
        JSON.stringify(this.tracks, null, 2),
      );
    } catch (err) {
      console.error("[History] Error saving:", err);
    }
  }

  getTracks() {
    return this.tracks;
  }

  saveTracks(tracks) {
    this.tracks = tracks;
    return fs.promises.writeFile(
      this.historyFile,
      JSON.stringify(tracks, null, 2),
    );
  }

  getWrappedData(period = "all") {
    console.log("[History] Getting wrapped data for period:", period);

    let filteredTracks = this.tracks;
    console.log("[History] Initial tracks count:", this.tracks.length);

    // Only filter if not 'all'
    if (period !== "all") {
      const periodDays = parseInt(period);
      if (!isNaN(periodDays)) {
        // Get tracks from the last X days
        const cutoffTime = Date.now() - periodDays * 24 * 60 * 60 * 1000;
        filteredTracks = this.tracks.filter(
          (track) => track.timestamp >= cutoffTime,
        );
      }
    }

    console.log(
      `[History] Filtered ${this.tracks.length} tracks down to ${filteredTracks.length} tracks for period ${period}`,
    );

    // Calculate patterns first
    const patterns = this.calculatePatternsForTracks(filteredTracks);
    console.log("[History] Calculated patterns:", patterns);

    // Normalize artist names
    const normalizeArtist = (artist) => {
      if (!artist) return "";
      const normalized = artist.trim().toLowerCase();
      if (normalized.includes("blink") && normalized.includes("182")) {
        return "blink-182";
      }
      // Handle Knox/KNOX case normalization
      if (normalized === "knox") {
        return "Knox";
      }
      return artist.trim();
    };

    // Get top artists with latest artwork
    const artistCounts = {};
    const artistLatestImage = {};
    const artistLatestTimestamp = {};

    filteredTracks.forEach((track) => {
      const normalizedArtist = normalizeArtist(track.artist);
      artistCounts[normalizedArtist] =
        (artistCounts[normalizedArtist] || 0) + 1;

      // Update image only if this track is more recent
      if (
        !artistLatestTimestamp[normalizedArtist] ||
        track.timestamp > artistLatestTimestamp[normalizedArtist]
      ) {
        artistLatestImage[normalizedArtist] = track.image_key;
        artistLatestTimestamp[normalizedArtist] = track.timestamp;
      }
    });

    console.log("[History] Artist counts:", artistCounts);

    // Format top items
    const topArtists = Object.entries(artistCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({
        name: normalizeArtist(name),
        artist: normalizeArtist(name),
        count,
        image_key: artistLatestImage[name],
      }));

    console.log("[History] Top artists:", topArtists);

    // Get top albums
    const albumCounts = {};
    const albumImages = {};
    const albumArtists = {};
    filteredTracks.forEach((track) => {
      const normalizedArtist = normalizeArtist(track.artist);
      if (track.album) {
        const key = `${track.album}|${normalizedArtist}`;
        albumCounts[key] = (albumCounts[key] || 0) + 1;
        if (track.image_key) {
          albumImages[key] = track.image_key;
        }
        albumArtists[key] = normalizedArtist;
      }
    });

    console.log("[History] Album counts:", albumCounts);

    const topAlbums = Object.entries(albumCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([key, count]) => {
        const [album] = key.split("|");
        return {
          name: album,
          album: album,
          artist: albumArtists[key],
          count,
          image_key: albumImages[key],
        };
      });

    console.log("[History] Top albums:", topAlbums);

    // Get top tracks
    const trackCounts = {};
    const trackImages = {};
    const trackAlbums = {};
    const trackArtists = {};
    filteredTracks.forEach((track) => {
      const normalizedArtist = normalizeArtist(track.artist);
      const key = `${track.title}|${normalizedArtist}`;
      trackCounts[key] = (trackCounts[key] || 0) + 1;
      trackArtists[key] = normalizedArtist;

      // Only update image if we don't have one for this track yet
      if (!trackImages[key] && track.image_key) {
        trackImages[key] = track.image_key;
      }

      // Store album info
      if (track.album) {
        trackAlbums[key] = track.album;
      }
    });

    console.log("[History] Track counts:", trackCounts);

    const topTracks = Object.entries(trackCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([key, count]) => {
        const [title] = key.split("|");
        return {
          name: `${title} - ${trackArtists[key]}`,
          title,
          artist: trackArtists[key],
          album: trackAlbums[key],
          count,
          image_key: trackImages[key],
          // Add metadata if available in the track
          genre: filteredTracks.find(
            (t) =>
              t.title === title &&
              normalizeArtist(t.artist) === trackArtists[key],
          )?.genres?.[0],
          year: filteredTracks.find(
            (t) =>
              t.title === title &&
              normalizeArtist(t.artist) === trackArtists[key],
          )?.year,
          bpm: filteredTracks.find(
            (t) =>
              t.title === title &&
              normalizeArtist(t.artist) === trackArtists[key],
          )?.bpm,
        };
      });

    console.log("[History] Top tracks:", topTracks);

    // Calculate current streak
    const currentStreak = this.calculateStreakForTracks(filteredTracks);

    const returnData = {
      // Listening Stats
      totalTracksPlayed: filteredTracks.length,
      uniqueArtistsCount: Object.keys(artistCounts).length,
      uniqueAlbumsCount: Object.keys(albumCounts).length,
      uniqueTracksCount: Object.keys(trackCounts).length,
      totalListeningTimeSeconds: filteredTracks.reduce((total, track) => {
        const trackDuration = track.length || track.duration || 0;
        return total + trackDuration;
      }, 0),
      averageTracksPerDay:
        Math.round(
          (filteredTracks.length /
            (filteredTracks.length > 0
              ? Math.max(
                  1,
                  Math.ceil(
                    (Date.now() -
                      Math.min(...filteredTracks.map((t) => t.timestamp))) /
                      (24 * 60 * 60 * 1000),
                  ),
                )
              : 1)) *
            10,
        ) / 10,
      currentListeningStreakDays: currentStreak,
      peakListeningHour: patterns.hourCounts
        ? patterns.hourCounts.indexOf(Math.max(...patterns.hourCounts))
        : 0,

      // Top Charts
      topArtistsByPlays: topArtists,
      topAlbumsByPlays: topAlbums,
      topTracksByPlays: topTracks,
      topGenresByPlays: [], // Placeholder since we don't have genre data yet

      // Listening Patterns
      listeningPatterns: {
        timeOfDay: patterns.timeOfDay,
        dayOfWeekPlays: patterns.dayOfWeekPlays,
      },
    };

    console.log("[History] Final return data:", {
      totalTracks: returnData.totalTracksPlayed,
      uniqueArtists: returnData.uniqueArtistsCount,
      uniqueAlbums: returnData.uniqueAlbumsCount,
      uniqueTracks: returnData.uniqueTracksCount,
      topArtistsCount: returnData.topArtistsByPlays.length,
      topAlbumsCount: returnData.topAlbumsByPlays.length,
      topTracksCount: returnData.topTracksByPlays.length,
      patterns: returnData.listeningPatterns,
    });

    return returnData;
  }

  calculatePatternsForTracks(tracks) {
    console.log("[History] Calculating patterns for", tracks.length, "tracks");

    const hourCounts = new Array(24).fill(0);
    const dayOfWeek = {
      sunday: 0,
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
    };

    tracks.forEach((track) => {
      const date = new Date(track.timestamp);
      const hour = date.getHours();
      const day = date.getDay();

      hourCounts[hour]++;
      const days = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];
      dayOfWeek[days[day]]++;
    });

    const timeOfDay = {
      morningPlays: hourCounts.slice(6, 12).reduce((a, b) => a + b, 0), // 6 AM - 11:59 AM
      afternoonPlays: hourCounts.slice(12, 18).reduce((a, b) => a + b, 0), // 12 PM - 5:59 PM
      eveningPlays: hourCounts.slice(18, 24).reduce((a, b) => a + b, 0), // 6 PM - 11:59 PM
      nightPlays: hourCounts.slice(0, 6).reduce((a, b) => a + b, 0), // 12 AM - 5:59 AM
    };

    console.log("[History] Calculated time of day distribution:", timeOfDay);
    console.log("[History] Calculated day of week distribution:", dayOfWeek);

    return {
      timeOfDay,
      dayOfWeekPlays: dayOfWeek,
      hourCounts, // Return this for peak hour calculation
    };
  }

  calculateStreakForTracks(tracks) {
    if (!tracks.length) return 0;

    // Sort tracks by timestamp in descending order (most recent first)
    const sortedTracks = [...tracks].sort((a, b) => b.timestamp - a.timestamp);

    // Function to get start of day for a timestamp
    const getStartOfDay = (timestamp) => {
      const date = new Date(timestamp);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    };

    let currentStreak = 1;
    let currentDate = getStartOfDay(sortedTracks[0].timestamp);

    for (let i = 1; i < sortedTracks.length; i++) {
      const trackDate = getStartOfDay(sortedTracks[i].timestamp);

      // Calculate days difference
      const diffDays =
        Math.abs(currentDate - trackDate) / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        // Consecutive day
        currentStreak++;
        currentDate = trackDate;
      } else if (diffDays > 1) {
        // Streak broken
        break;
      }
      // Same day - continue to next track
    }

    console.log("[History] Calculated streak:", currentStreak, "days");
    return currentStreak;
  }
}

const historyService = new HistoryService();
module.exports = { historyService };
