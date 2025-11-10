const fs = require("fs").promises;
const path = require("path");

// Simple logger wrapper
const logger = {
  info: (...args) => console.log("[PreferenceManager]", ...args),
  warn: (...args) => console.warn("[PreferenceManager]", ...args),
  error: (...args) => console.error("[PreferenceManager]", ...args),
};

class PreferenceManager {
  constructor() {
    this.preferencesPath = path.join(
      __dirname,
      "../../data/user-preferences.json",
    );
    this.preferences = {
      artistPreferences: {},
      genrePreferences: {},
      feedbackHistory: [],
      cooldowns: {}, // Track when artists can be recommended again
      stats: {
        totalLikes: 0,
        totalDislikes: 0,
        totalDismissed: 0,
        lastUpdated: new Date().toISOString(),
      },
    };
    this.loadPreferences();
  }

  async loadPreferences() {
    try {
      const data = await fs.readFile(this.preferencesPath, "utf8");
      this.preferences = JSON.parse(data);
      
      // Ensure cooldowns object exists
      if (!this.preferences.cooldowns) {
        this.preferences.cooldowns = {};
      }
      
      logger.info("User preferences loaded successfully");
    } catch (error) {
      if (error.code === "ENOENT") {
        logger.info("No preferences file found, starting fresh");
        await this.savePreferences();
      } else {
        logger.error("Error loading preferences:", error);
      }
    }
  }

  async savePreferences() {
    try {
      await fs.writeFile(
        this.preferencesPath,
        JSON.stringify(this.preferences, null, 2),
      );
      logger.info("User preferences saved successfully");
    } catch (error) {
      logger.error("Error saving preferences:", error);
    }
  }

  async trackFeedback(artist, action, genres = [], context = "unknown") {
    const timestamp = new Date().toISOString();
    
    // Normalize artist name to lowercase for consistency
    const normalizedArtist = artist.toLowerCase();

    // Update artist preferences using normalized name
    if (!this.preferences.artistPreferences[normalizedArtist]) {
      this.preferences.artistPreferences[normalizedArtist] = {
        likes: 0,
        dislikes: 0,
        dismissed: 0,
        lastFeedback: timestamp,
      };
    }

    const artistPref = this.preferences.artistPreferences[normalizedArtist];
    artistPref.lastFeedback = timestamp;

    // Ensure cooldowns object exists
    if (!this.preferences.cooldowns) {
      this.preferences.cooldowns = {};
    }

    switch (action) {
      case "liked":
        artistPref.likes++;
        this.preferences.stats.totalLikes++;
        // Set cooldown for 7 days for liked artists (use normalized name)
        this.preferences.cooldowns[normalizedArtist] = {
          until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          reason: "liked",
        };
        break;
      case "disliked":
        artistPref.dislikes++;
        this.preferences.stats.totalDislikes++;
        // Set cooldown for 30 days for disliked artists (use normalized name)
        this.preferences.cooldowns[normalizedArtist] = {
          until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          reason: "disliked",
        };
        break;
      case "dismissed":
        artistPref.dismissed++;
        this.preferences.stats.totalDismissed++;
        // Set cooldown for 3 days for dismissed artists (use normalized name)
        this.preferences.cooldowns[normalizedArtist] = {
          until: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          reason: "dismissed",
        };
        break;
    }

    // Update genre preferences
    if (genres && genres.length > 0) {
      for (const genre of genres) {
        if (!this.preferences.genrePreferences[genre]) {
          this.preferences.genrePreferences[genre] = {
            likes: 0,
            dislikes: 0,
            dismissed: 0,
          };
        }

        const genrePref = this.preferences.genrePreferences[genre];
        switch (action) {
          case "liked":
            genrePref.likes++;
            break;
          case "disliked":
            genrePref.dislikes++;
            break;
          case "dismissed":
            genrePref.dismissed++;
            break;
        }
      }
    }

    // Add to feedback history (keep last 1000 entries)
    this.preferences.feedbackHistory.unshift({
      artist,
      action,
      genres,
      context,
      timestamp,
    });

    if (this.preferences.feedbackHistory.length > 1000) {
      this.preferences.feedbackHistory = this.preferences.feedbackHistory.slice(
        0,
        1000,
      );
    }

    this.preferences.stats.lastUpdated = timestamp;
    await this.savePreferences();

    return {
      artistScore: this.getArtistScore(normalizedArtist),
      genreScores: genres.map((g) => ({
        genre: g,
        score: this.getGenreScore(g),
      })),
    };
  }

  getArtistScore(artist) {
    // Normalize artist name for consistency
    const normalizedArtist = artist.toLowerCase();
    const pref = this.preferences.artistPreferences[normalizedArtist];
    if (!pref) return 0;

    // Calculate a score from -1 to 1
    const total = pref.likes + pref.dislikes + pref.dismissed;
    if (total === 0) return 0;

    // Likes = +1, Dislikes = -1, Dismissed = -0.5
    const score = (pref.likes - pref.dislikes - pref.dismissed * 0.5) / total;
    return Math.max(-1, Math.min(1, score));
  }

  getGenreScore(genre) {
    const pref = this.preferences.genrePreferences[genre];
    if (!pref) return 0;

    const total = pref.likes + pref.dislikes + pref.dismissed;
    if (total === 0) return 0;

    const score = (pref.likes - pref.dislikes - pref.dismissed * 0.5) / total;
    return Math.max(-1, Math.min(1, score));
  }

  getPreferenceProfile() {
    // Get top liked and disliked genres
    const genreScores = Object.entries(this.preferences.genrePreferences)
      .map(([genre, pref]) => ({
        genre,
        score: this.getGenreScore(genre),
        total: pref.likes + pref.dislikes + pref.dismissed,
      }))
      .filter((g) => g.total >= 3) // Only include genres with enough feedback
      .sort((a, b) => b.score - a.score);

    const topLikedGenres = genreScores.filter((g) => g.score > 0.3).slice(0, 5);
    const topDislikedGenres = genreScores
      .filter((g) => g.score < -0.3)
      .slice(-5);

    // Get recent feedback patterns
    const recentFeedback = this.preferences.feedbackHistory.slice(0, 50);
    const recentLikeRate =
      recentFeedback.filter((f) => f.action === "liked").length /
      recentFeedback.length;

    return {
      topLikedGenres,
      topDislikedGenres,
      recentLikeRate,
      totalFeedback: this.preferences.feedbackHistory.length,
      stats: this.preferences.stats,
    };
  }

  // Get preference-weighted score for a recommendation
  getRecommendationScore(artist, genres = []) {
    let score = 0;
    let weights = 0;

    // Artist preference weight (if we have data)
    const artistScore = this.getArtistScore(artist);
    if (this.preferences.artistPreferences[artist]) {
      score += artistScore * 2; // Artist preference is weighted heavily
      weights += 2;
    }

    // Genre preference weights
    for (const genre of genres) {
      const genreScore = this.getGenreScore(genre);
      if (this.preferences.genrePreferences[genre]) {
        score += genreScore;
        weights += 1;
      }
    }

    // Return weighted average, or 0 if no preference data
    return weights > 0 ? score / weights : 0;
  }

  // Get artists that user consistently likes
  getFavoriteArtists(limit = 10) {
    return Object.entries(this.preferences.artistPreferences)
      .filter(([_, pref]) => pref.likes > 0 && pref.dislikes === 0)
      .sort((a, b) => b[1].likes - a[1].likes)
      .slice(0, limit)
      .map(([artist, pref]) => ({
        artist,
        likes: pref.likes,
        score: this.getArtistScore(artist),
      }));
  }

  // Get artists to avoid
  getDislikedArtists() {
    return Object.entries(this.preferences.artistPreferences)
      .filter(([artist, pref]) => this.getArtistScore(artist) < -0.5)
      .map(([artist, pref]) => artist);
  }

  // Get artists currently on cooldown
  getArtistsOnCooldown() {
    const now = new Date();
    const cooldownArtists = [];
    
    // Clean up expired cooldowns
    for (const [artist, cooldown] of Object.entries(this.preferences.cooldowns || {})) {
      const untilDate = new Date(cooldown.until);
      if (untilDate > now) {
        cooldownArtists.push(artist);
      } else {
        // Remove expired cooldown
        delete this.preferences.cooldowns[artist];
      }
    }
    
    return cooldownArtists;
  }

  // Check if an artist is on cooldown
  isArtistOnCooldown(artist) {
    // Normalize artist name for consistency
    const normalizedArtist = artist.toLowerCase();
    const cooldown = this.preferences.cooldowns?.[normalizedArtist];
    if (!cooldown) return false;
    
    const now = new Date();
    const untilDate = new Date(cooldown.until);
    
    if (untilDate > now) {
      return true;
    } else {
      // Clean up expired cooldown
      delete this.preferences.cooldowns[normalizedArtist];
      return false;
    }
  }
}

module.exports = new PreferenceManager();
