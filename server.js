const express = require('express');
const cors = require('cors');
const roonConnection = require('./server/roon-connection');

const app = express();
const port = process.env.PORT || 4000;

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:4000'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'cache-control', 'pragma', 'Authorization'],
  credentials: true
}));

app.options('*', cors()); // Enable preflight for all routes

app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

// Status endpoint
app.get('/api/roon/status', (req, res) => {
  try {
    const status = roonConnection.getConnectionStatus();
    res.json(status);
  } catch (err) {
    console.error('Error getting status:', err);
    res.status(500).json({ error: err.message });
  }
});

// Now playing endpoint
app.get('/api/roon/now-playing', (req, res) => {
  try {
    const nowPlaying = roonConnection.getNowPlaying();
    res.json(nowPlaying);
  } catch (err) {
    console.error('Error getting now playing:', err);
    res.status(500).json({ error: err.message });
  }
});

// Image endpoint
app.get('/api/roon/image/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const image = await roonConnection.getImage(key);
    
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.setHeader('Content-Type', image.content_type);
    res.send(image.image);
  } catch (err) {
    console.error('Error getting image:', err);
    res.status(500).json({ error: err.message });
  }
});

// Wrapped data endpoint
app.get('/api/wrapped', async (req, res) => {
  try {
    const wrappedData = await roonConnection.getWrappedData();
    if (!wrappedData || typeof wrappedData !== 'object') {
      console.error('Invalid wrapped data:', wrappedData);
      return res.status(500).json({ 
        error: 'Invalid wrapped data format',
        data: {
          totalPlays: 0,
          uniqueArtists: 0,
          uniqueAlbums: 0,
          uniqueTracks: 0,
          patterns: { hourly: [], weekday: [], peakHour: 0 },
          stats: {
            uniqueArtists: 0,
            uniqueAlbums: 0,
            uniqueTracks: 0,
            topArtists: [],
            topAlbums: [],
            topTracks: [],
            topGenres: []
          }
        }
      });
    }
    res.json(wrappedData);
  } catch (err) {
    console.error('Error getting wrapped data:', err);
    res.status(500).json({ 
      error: err.message,
      data: {
        totalPlays: 0,
        uniqueArtists: 0,
        uniqueAlbums: 0,
        uniqueTracks: 0,
        patterns: { hourly: [], weekday: [], peakHour: 0 },
        stats: {
          uniqueArtists: 0,
          uniqueAlbums: 0,
          uniqueTracks: 0,
          topArtists: [],
          topAlbums: [],
          topTracks: [],
          topGenres: []
        }
      }
    });
  }
});

// Start Roon connection
console.log('Starting Roon connection...');
roonConnection.start();

// Handle process termination gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  roonConnection.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  roonConnection.stop();
  process.exit(0);
});

// Start the server
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 