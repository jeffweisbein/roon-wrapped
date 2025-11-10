const musicMetadata = require("./music-metadata");
const preferenceManager = require("./preference-manager");
const fs = require("fs").promises;
const path = require("path");

// Simple logger wrapper
const logger = {
  info: (...args) => console.log("[RecommendationEngine]", ...args),
  warn: (...args) => console.warn("[RecommendationEngine]", ...args),
  error: (...args) => console.error("[RecommendationEngine]", ...args),
};

class RecommendationEngine {
  constructor() {
    this.userProfile = null;
    this.listeningHistory = [];
    this.recommendations = new Map();
    this.discoveryRatio = 0.3; // Start with 30% discovery
    this.minSimilarity = 0.5; // Minimum similarity score
  }

  // Load listening history from files
  async loadListeningHistory() {
    try {
      const dataDir = path.join(__dirname, "../../data");
      const files = await fs.readdir(dataDir);

      // Look for both yearly files and the main history file
      const historyFiles = files.filter(
        (f) =>
          f.startsWith("listening-history-") || f === "listening-history.json",
      );

      this.listeningHistory = [];

      for (const file of historyFiles) {
        try {
          const content = await fs.readFile(path.join(dataDir, file), "utf8");
          const data = JSON.parse(content);
          if (Array.isArray(data)) {
            this.listeningHistory.push(...data);
          }
        } catch (err) {
          logger.warn(`Error reading ${file}:`, err.message);
        }
      }

      logger.info(`Loaded ${this.listeningHistory.length} tracks from history`);
      return this.listeningHistory;
    } catch (error) {
      logger.error("Error loading listening history:", error);
      return [];
    }
  }

  // Analyze user's musical profile
  async analyzeUserProfile() {
    if (this.listeningHistory.length === 0) {
      await this.loadListeningHistory();
    }

    const artistCounts = {};
    const genreCounts = {};
    const trackFeatures = [];
    const timeOfDayListening = Array(24).fill(0);

    // Count artists and analyze patterns
    for (const track of this.listeningHistory) {
      // Artist frequency
      const artist = track.artist || "Unknown";
      artistCounts[artist] = (artistCounts[artist] || 0) + 1;

      // Time of day analysis
      const hour = new Date(track.timestamp).getHours();
      timeOfDayListening[hour]++;
    }

    // Get top artists
    const topArtists = Object.entries(artistCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([artist, count]) => ({ artist, count }));

    // Get genre distribution from top artists (limit to reduce API calls)
    const artistsToCheck = topArtists.slice(0, 10); // Reduced from 20
    for (const { artist } of artistsToCheck) {
      try {
        const artistInfo = await musicMetadata.getArtistInfo(artist);
        if (artistInfo?.tags) {
          for (const tag of artistInfo.tags) {
            genreCounts[tag] = (genreCounts[tag] || 0) + 1;
          }
        }
      } catch (error) {
        logger.warn(`Failed to get artist info for ${artist}:`, error.message);
      }
    }

    // Calculate diversity score
    const totalPlays = this.listeningHistory.length;
    const uniqueArtists = Object.keys(artistCounts).length;
    const diversityScore = uniqueArtists / totalPlays;

    // Find peak listening times
    const peakHour = timeOfDayListening.indexOf(
      Math.max(...timeOfDayListening),
    );

    this.userProfile = {
      topArtists,
      topGenres: Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([genre, count]) => ({ genre, count })),
      diversityScore,
      totalTracks: totalPlays,
      uniqueArtists,
      peakListeningHour: peakHour,
      timeDistribution: timeOfDayListening,
    };

    // Adjust discovery ratio based on diversity score
    if (diversityScore > 0.7) {
      this.discoveryRatio = 0.4; // More diverse listeners get more discoveries
    } else if (diversityScore < 0.3) {
      this.discoveryRatio = 0.2; // Less diverse listeners get fewer discoveries
    }

    logger.info("User profile analyzed:", {
      uniqueArtists,
      diversityScore,
      discoveryRatio: this.discoveryRatio,
    });

    return this.userProfile;
  }

  // Get recommendations based on current track
  async getTrackRecommendations(currentTrack, limit = 10) {
    const cacheKey = `${currentTrack.artist}:${currentTrack.title}`;

    // Check cache
    if (this.recommendations.has(cacheKey)) {
      const cached = this.recommendations.get(cacheKey);
      if (Date.now() - cached.timestamp < 3600000) {
        // 1 hour cache
        // Filter out cooldown artists from cached data too
        const cooldownArtists = new Set(
          preferenceManager.getArtistsOnCooldown().map((a) => a.toLowerCase()),
        );
        const dislikedArtists = new Set(
          preferenceManager.getDislikedArtists().map((a) => a.toLowerCase()),
        );
        
        return cached.data.filter((rec) => {
          const artistName = (rec.artist || rec.name || "").toLowerCase();
          return !cooldownArtists.has(artistName) && !dislikedArtists.has(artistName);
        });
      }
    }

    try {
      // Get similar tracks
      const similarTracks = await musicMetadata.getSimilarTracks(
        currentTrack.artist,
        currentTrack.title,
        limit * 2, // Get extra to filter
      );

      // Get similar artists
      const similarArtists = await musicMetadata.getSimilarArtists(
        currentTrack.artist,
        5,
      );

      // Combine recommendations
      let recommendations = [];

      // Add similar tracks
      for (const track of similarTracks) {
        if (track.match >= this.minSimilarity) {
          recommendations.push({
            type: "similar_track",
            name: track.name,
            artist: track.artist,
            similarity: track.match,
            reason: `Similar to "${currentTrack.title}"`,
          });
        }
      }

      // Add tracks from similar artists
      for (const artist of similarArtists) {
        if (artist.match >= this.minSimilarity) {
          recommendations.push({
            type: "similar_artist",
            artist: artist.name,
            similarity: artist.match,
            reason: `Similar artist to ${currentTrack.artist}`,
          });
        }
      }

      // Get artists on cooldown
      const cooldownArtists = new Set(
        preferenceManager.getArtistsOnCooldown().map((a) => a.toLowerCase()),
      );
      
      // Get disliked artists
      const dislikedArtists = new Set(
        preferenceManager.getDislikedArtists().map((a) => a.toLowerCase()),
      );

      // Filter out cooldown and disliked artists, then sort by similarity and limit
      recommendations = recommendations
        .filter((rec) => {
          const artistName = (rec.artist || rec.name || "").toLowerCase();
          return !cooldownArtists.has(artistName) && !dislikedArtists.has(artistName);
        })
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      // Cache results
      this.recommendations.set(cacheKey, {
        data: recommendations,
        timestamp: Date.now(),
      });

      return recommendations;
    } catch (error) {
      logger.error("Error getting track recommendations:", error);
      return [];
    }
  }

  // Get personalized recommendations based on listening history
  async getPersonalizedRecommendations(limit = 20, excludeArtists = []) {
    if (!this.userProfile) {
      await this.analyzeUserProfile();
    }

    const recommendations = new Map();
    const familiarArtists = new Set(
      this.userProfile.topArtists.map((a) => a.artist.toLowerCase()),
    );
    const allListenedArtists = new Set(
      this.listeningHistory.map((t) => t.artist?.toLowerCase()).filter(Boolean),
    );

    // Create a map of artists to track counts and unique songs
    const artistPlayCounts = new Map();
    const artistUniqueSongs = new Map();

    // Analyze listening patterns
    for (const track of this.listeningHistory) {
      const artistLower = track.artist?.toLowerCase();
      if (!artistLower) continue;

      if (!artistPlayCounts.has(artistLower)) {
        artistPlayCounts.set(artistLower, 0);
        artistUniqueSongs.set(artistLower, new Set());
      }

      artistPlayCounts.set(artistLower, artistPlayCounts.get(artistLower) + 1);
      artistUniqueSongs.get(artistLower).add(track.title?.toLowerCase());
    }

    // Find artists with light listening (1-10 plays or 1-3 unique songs)
    const lightlyListenedArtists = [];
    for (const [artist, playCount] of artistPlayCounts) {
      const uniqueSongs = artistUniqueSongs.get(artist).size;
      if (
        (playCount >= 1 && playCount <= 10) ||
        (uniqueSongs >= 1 && uniqueSongs <= 3)
      ) {
        lightlyListenedArtists.push({
          artist: artist,
          playCount: playCount,
          uniqueSongs: uniqueSongs,
        });
      }
    }

    // Genre mapping for cross-genre recommendations
    const genreExpansion = {
      "pop punk": [
        "indie rock",
        "post-hardcore",
        "ska punk",
        "synthpop",
        "indie pop",
      ],
      "punk rock": ["post-punk", "garage rock", "grunge", "hardcore"],
      emo: ["midwest emo", "math rock", "post-rock", "shoegaze"],
      "alternative rock": ["indie rock", "britpop", "new wave", "post-grunge"],
      rock: ["indie rock", "folk rock", "psychedelic rock", "blues rock"],
    };

    // Add recommendations for lightly listened artists
    for (const {
      artist,
      playCount,
      uniqueSongs,
    } of lightlyListenedArtists.slice(0, 3)) {
      // Reduced from 5
      try {
        const artistInfo = await musicMetadata.getArtistInfo(artist);
        if (artistInfo) {
          recommendations.set(`explore_${artist}`, {
            artist: artistInfo.name || artist,
            score: 0.9, // High score for exploration
            reasons: [
              `You've only heard ${uniqueSongs} song${uniqueSongs > 1 ? "s" : ""} - explore more!`,
            ],
            isFamiliar: false,
            type: "deep_dive",
            genres: artistInfo.tags?.slice(0, 3) || [],
          });
        }
      } catch (error) {
        // Still add the recommendation even if metadata fetch fails
        recommendations.set(`explore_${artist}`, {
          artist: artist,
          score: 0.9,
          reasons: [
            `You've only heard ${uniqueSongs} song${uniqueSongs > 1 ? "s" : ""} - explore more!`,
          ],
          isFamiliar: false,
          type: "deep_dive",
          genres: [],
        });
      }
    }

    // Get recommendations from top artists (limit API calls)
    const topArtistsToCheck = this.userProfile.topArtists.slice(0, 8); // Reduced from 15
    for (const { artist } of topArtistsToCheck) {
      try {
        const similar = await musicMetadata.getSimilarArtists(artist, 5); // Reduced from 10

        for (const simArtist of similar) {
          if (simArtist.match >= 0.3) {
            // Lower threshold to get more diverse results
            const isFamiliar = allListenedArtists.has(
              simArtist.name.toLowerCase(),
            );

            // Skip if already listened to this artist
            if (isFamiliar) continue;

            // Get artist info to check genres (skip if too many API calls)
            let artistInfo = null;
            let artistGenres = [];

            // Only fetch artist info for top matches to reduce API calls
            if (simArtist.match >= 0.5 && recommendations.size < limit) {
              try {
                artistInfo = await musicMetadata.getArtistInfo(simArtist.name);
                artistGenres = artistInfo?.tags || [];
              } catch (error) {
                logger.warn(
                  `Failed to get info for similar artist ${simArtist.name}`,
                );
              }
            }

            // Check if this is a cross-genre recommendation
            let isCrossGenre = false;
            let genreReason = "";

            for (const userGenre of this.userProfile.topGenres) {
              const expansions = genreExpansion[userGenre.genre] || [];
              for (const artistGenre of artistGenres) {
                if (expansions.includes(artistGenre.toLowerCase())) {
                  isCrossGenre = true;
                  genreReason = `${artistGenre} (liked by ${userGenre.genre} fans)`;
                  break;
                }
              }
              if (isCrossGenre) break;
            }

            // Boost cross-genre and lower similarity to encourage diversity
            const score =
              simArtist.match *
              (isCrossGenre ? 1.5 : 1) *
              (simArtist.match < 0.6 ? 1.2 : 0.8);

            if (!recommendations.has(simArtist.name)) {
              // Apply preference scoring
              const preferenceScore = preferenceManager.getRecommendationScore(
                simArtist.name,
                artistGenres.slice(0, 3),
              );

              // Adjust score based on preferences (-1 to 1 range)
              const adjustedScore = score * (1 + preferenceScore * 0.5);

              recommendations.set(simArtist.name, {
                artist: simArtist.name,
                score: adjustedScore,
                reasons: [],
                isFamiliar: false,
                genres: artistGenres.slice(0, 3),
                preferenceScore,
              });
            }

            const reason =
              genreReason ||
              `Similar to ${artist} (${Math.round(simArtist.match * 100)}% match)`;
            recommendations.get(simArtist.name).reasons.push(reason);
          }
        }
      } catch (error) {
        logger.warn(
          `Failed to get similar artists for ${artist}:`,
          error.message,
        );
      }
    }

    // Get disliked artists to filter out
    const dislikedArtists = new Set(
      preferenceManager.getDislikedArtists().map((a) => a.toLowerCase()),
    );

    // Get artists on cooldown
    const cooldownArtists = new Set(
      preferenceManager.getArtistsOnCooldown().map((a) => a.toLowerCase()),
    );

    // Add explicitly excluded artists (from thumbs down in current session)
    const allExcludedArtists = new Set([
      ...dislikedArtists,
      ...cooldownArtists,
      ...excludeArtists.map((a) => a.toLowerCase()),
    ]);

    // Convert to array, filter out disliked/excluded/cooldown artists, and sort by score
    let finalRecs = Array.from(recommendations.values())
      .filter((rec) => !allExcludedArtists.has(rec.artist.toLowerCase()))
      .sort((a, b) => b.score - a.score);

    // Prioritize diverse recommendations
    return finalRecs.slice(0, limit);
  }

  // Get mood-based recommendations
  async getMoodRecommendations(mood, limit = 10) {
    const moodTags = {
      energetic: ["rock", "electronic", "punk", "metal", "dance"],
      chill: ["ambient", "chillout", "downtempo", "lounge", "calm"],
      focus: ["classical", "instrumental", "ambient", "minimal", "study"],
      happy: ["pop", "upbeat", "cheerful", "party", "dance"],
      melancholic: ["indie", "alternative", "melancholy", "atmospheric"],
    };

    const tags = moodTags[mood] || [];
    const recommendations = [];

    // Get artists from user's history that match mood
    if (this.userProfile) {
      for (const { artist } of this.userProfile.topArtists.slice(0, 20)) {
        const artistInfo = await musicMetadata.getArtistInfo(artist);
        if (artistInfo?.tags) {
          const matchingTags = artistInfo.tags.filter((tag) =>
            tags.some((moodTag) => tag.toLowerCase().includes(moodTag)),
          );

          if (matchingTags.length > 0) {
            // Check if artist is on cooldown
            if (!preferenceManager.isArtistOnCooldown(artist)) {
              recommendations.push({
                artist: artist,
                matchingTags,
                score: matchingTags.length / tags.length,
                reason: `Matches ${mood} mood`,
              });
            }
          }
        }
      }
    }

    return recommendations.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  // Track user feedback to improve recommendations
  async trackFeedback(recommendation, action) {
    // Track in preference manager
    const artist = recommendation.artist || recommendation.name;
    const genres = recommendation.genres || [];
    const context = recommendation.context || "unknown";

    const result = await preferenceManager.trackFeedback(
      artist,
      action,
      genres,
      context,
    );

    // Adjust discovery ratio based on preference trends
    const profile = preferenceManager.getPreferenceProfile();
    if (profile.recentLikeRate > 0.7 && this.discoveryRatio < 0.5) {
      this.discoveryRatio += 0.02; // User is liking recommendations, increase discovery
    } else if (profile.recentLikeRate < 0.3 && this.discoveryRatio > 0.2) {
      this.discoveryRatio -= 0.02; // User is disliking recommendations, reduce discovery
    }

    logger.info(`Feedback tracked: ${action} for ${artist}`, {
      newDiscoveryRatio: this.discoveryRatio,
      artistScore: result.artistScore,
      genreScores: result.genreScores,
    });

    return result;
  }

  // Get a single replacement recommendation
  async getReplacementRecommendation(excludeArtists = []) {
    // Get more recommendations than needed to find a suitable replacement
    const candidates = await this.getPersonalizedRecommendations(
      excludeArtists.length + 20, // Increased to account for cooldowns
      excludeArtists,
    );

    // Get artists on cooldown to double-check
    const cooldownArtists = new Set(
      preferenceManager.getArtistsOnCooldown().map((a) => a.toLowerCase()),
    );

    // Return the first recommendation not in the exclude list or on cooldown
    for (const rec of candidates) {
      const artistName = rec.artist.toLowerCase();
      if (
        !excludeArtists.some((ex) => ex.toLowerCase() === artistName) &&
        !cooldownArtists.has(artistName)
      ) {
        return rec;
      }
    }

    // If no suitable replacement found, return a discovery recommendation
    return {
      artist: "Discover something new",
      score: 0.5,
      reasons: ["We're finding new artists for you"],
      isFamiliar: false,
      type: "discovery",
      genres: [],
    };
  }

  // Get discovery statistics
  getDiscoveryStats() {
    if (!this.userProfile) return null;

    return {
      diversityScore: this.userProfile.diversityScore,
      discoveryRatio: this.discoveryRatio,
      uniqueArtists: this.userProfile.uniqueArtists,
      totalTracks: this.userProfile.totalTracks,
      topGenres: this.userProfile.topGenres,
    };
  }
}

module.exports = new RecommendationEngine();
