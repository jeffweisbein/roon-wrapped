# Roon Wrapped

A beautiful visualization of your Roon music listening history, inspired by Spotify Wrapped. This application connects to your Roon Core and generates personalized insights about your music listening habits.

## Features

- Connect to your Roon Core
- Analyze your listening history
- Generate beautiful visualizations
- View top artists, albums, and tracks
- See listening trends over time
- Share your music stats

## Prerequisites

- Node.js 18.0.0 or later
- A running Roon Core on your network
- Roon extension enabled

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Configuration

1. The app will automatically discover your Roon Core on the network
2. Authorize the extension in your Roon Core settings
3. Start exploring your music history!

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Shadcn UI
- Node Roon API

## License

MIT 