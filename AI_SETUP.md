# AI Music Recommendations Setup Guide

This guide will help you set up the AI-powered music recommendation features in Roon Wrapped.

## Features

The AI recommendation system provides:

1. **Personalized Recommendations** - Based on your listening history
2. **Similar Track/Artist Discovery** - Find music similar to what's currently playing
3. **Musical Taste Analysis** - Understand your listening diversity and patterns
4. **Mood-Based Suggestions** - Get recommendations based on energy levels
5. **Discovery Tracking** - Monitor how adventurous your listening habits are

## Setup Instructions

### 1. Optional: Get a Last.fm API Key (Recommended for Better Recommendations)

While the system works without external APIs, adding a Last.fm API key significantly improves recommendation quality.

1. Go to https://www.last.fm/api/account/create
2. Create a free account if you don't have one
3. Fill out the API application form:
   - Application name: "Roon Wrapped"
   - Application description: "Personal music analytics"
4. Copy your API key

### 2. Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# Music Metadata APIs (Optional but recommended)
LASTFM_API_KEY=your_api_key_here
```

If you don't want to use Last.fm, the system will still work using only your local listening history.

### 3. Start the Application

```bash
npm run dev
```

## How It Works

### Local-First Approach
- All recommendations are generated locally using your Roon listening history
- No data is sent to external services without anonymization
- The system learns from your listening patterns over time

### Recommendation Engine
- **Collaborative Filtering**: Finds patterns in your listening history
- **Content-Based Filtering**: Analyzes musical attributes when available
- **Hybrid Approach**: Combines both methods for best results

### Discovery Balance
- The system automatically adjusts the ratio of familiar vs. new recommendations
- Starts at 70% familiar, 30% discovery
- Adapts based on your listening behavior

## Where to Find AI Features

### Home Dashboard
- **AI Recommendations Widget**: Shows personalized suggestions and now-playing based recommendations
- **Discovery Insights Widget**: Displays your musical diversity score and genre distribution

### Now Playing Page
- **Similar Tracks Section**: Shows similar songs and artists to what's currently playing
- Real-time recommendations update as you change tracks

## Privacy & Costs

### Privacy
- Your listening data stays local
- External API calls (if configured) only send artist/track names
- No personal information is shared

### Costs
- **Free Tier Usage**: The application is designed to work within free API limits
- **Last.fm**: Free API with reasonable rate limits
- **MusicBrainz**: Completely free, no API key required
- **No monthly fees**: Unlike the initial proposal, this implementation has no recurring costs

## Troubleshooting

### No Recommendations Showing
1. Ensure you have listening history data (check if other pages show data)
2. Wait a few seconds for the recommendation engine to analyze your history
3. Try refreshing the page

### Poor Recommendation Quality
1. Add a Last.fm API key for better metadata
2. The system improves over time as it learns your preferences
3. Ensure you have diverse listening history for better recommendations

### API Errors
1. Check your Last.fm API key is correct
2. Ensure you're not exceeding rate limits (unlikely with normal usage)
3. The system will fall back to local-only mode if APIs fail

## Future Enhancements

While playlist export to Roon isn't currently possible due to API limitations, future updates may include:
- M3U playlist file generation for manual import
- More sophisticated mood detection
- Time-of-day based recommendations
- Seasonal listening pattern analysis

## Feedback

The recommendation system learns from your listening patterns automatically. The more you use Roon, the better the recommendations become!