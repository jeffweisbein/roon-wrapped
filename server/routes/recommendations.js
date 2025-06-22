const express = require('express');
const router = express.Router();
const recommendationEngine = require('../services/recommendation-engine');
const musicMetadata = require('../services/music-metadata');
const { roonConnection } = require('../roon-connection');

// Simple logger wrapper
const logger = {
  info: (...args) => console.log('[RecommendationsAPI]', ...args),
  warn: (...args) => console.warn('[RecommendationsAPI]', ...args),
  error: (...args) => console.error('[RecommendationsAPI]', ...args)
};

// Get recommendations for current playing track
router.get('/now-playing', async (req, res) => {
  try {
    const roon = roonConnection;
    const nowPlaying = roon?.getNowPlaying();
    
    if (!nowPlaying) {
      return res.json({ recommendations: [], message: 'Nothing playing' });
    }

    const track = {
      title: nowPlaying.title,
      artist: nowPlaying.artist,
      album: nowPlaying.album
    };

    const recommendations = await recommendationEngine.getTrackRecommendations(track, 8);
    
    res.json({
      currentTrack: track,
      recommendations
    });
  } catch (error) {
    logger.error('Error getting now-playing recommendations:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// Get personalized recommendations
router.get('/personalized', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const recommendations = await recommendationEngine.getPersonalizedRecommendations(limit);
    
    res.json({
      recommendations,
      profile: await recommendationEngine.analyzeUserProfile()
    });
  } catch (error) {
    logger.error('Error getting personalized recommendations:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// Get mood-based recommendations
router.get('/mood/:mood', async (req, res) => {
  try {
    const { mood } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    const validMoods = ['energetic', 'chill', 'focus', 'happy', 'melancholic'];
    if (!validMoods.includes(mood)) {
      return res.status(400).json({ error: 'Invalid mood', validMoods });
    }

    const recommendations = await recommendationEngine.getMoodRecommendations(mood, limit);
    
    res.json({
      mood,
      recommendations
    });
  } catch (error) {
    logger.error('Error getting mood recommendations:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// Get similar artists
router.get('/similar-artists/:artist', async (req, res) => {
  try {
    const { artist } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    const similar = await musicMetadata.getSimilarArtists(decodeURIComponent(artist), limit);
    
    res.json({
      artist,
      similar
    });
  } catch (error) {
    logger.error('Error getting similar artists:', error);
    res.status(500).json({ error: 'Failed to get similar artists' });
  }
});

// Get discovery stats
router.get('/discovery-stats', async (req, res) => {
  try {
    const stats = recommendationEngine.getDiscoveryStats();
    res.json(stats || { message: 'Profile not yet analyzed' });
  } catch (error) {
    logger.error('Error getting discovery stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Track recommendation feedback
router.post('/feedback', async (req, res) => {
  try {
    const { recommendation, action } = req.body;
    
    if (!recommendation || !action) {
      return res.status(400).json({ error: 'Missing recommendation or action' });
    }

    await recommendationEngine.trackFeedback(recommendation, action);
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Error tracking feedback:', error);
    res.status(500).json({ error: 'Failed to track feedback' });
  }
});

// Refresh user profile
router.post('/refresh-profile', async (req, res) => {
  try {
    const profile = await recommendationEngine.analyzeUserProfile();
    res.json({ profile, message: 'Profile refreshed successfully' });
  } catch (error) {
    logger.error('Error refreshing profile:', error);
    res.status(500).json({ error: 'Failed to refresh profile' });
  }
});

module.exports = router;