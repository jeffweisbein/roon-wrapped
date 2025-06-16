# Roon Wrapped

A beautiful visualization of your Roon music listening history, inspired by Spotify Wrapped. This application connects to your Roon Core and generates personalized insights about your music listening habits.

![Roon Wrapped (1)](https://github.com/user-attachments/assets/cbc5ec5e-dfea-4473-b9f7-24808630bee8)
![Roon Wrapped (0)](https://github.com/user-attachments/assets/818c925b-53eb-4aff-b46b-8037ea467cae)
![Roon Wrapped (2)](https://github.com/user-attachments/assets/5c9ee491-5607-4039-8b8d-98256741472d)


## Features

### Core Features
- **Real-time Roon Integration**: Connect to your Roon Core and track listening history across all zones
- **Comprehensive Statistics**: View detailed analytics including total plays, unique artists/albums/tracks, and listening time
- **Now Playing**: Real-time display of currently playing tracks with album art and progress
- **Top 40 Charts**: Browse your most played artists, albums, and tracks
- **Wrapped Insights**: Spotify Wrapped-style yearly summaries with listening patterns and trends
- **Time Period Filtering**: View stats for different time periods (24 hours, 7 days, 30 days, 90 days, all time)

### Design & UI
- **Modern Dark Theme**: Beautiful dark mode interface with gradient accents
- **Animated Headers**: Page titles with cycling gradient animations
- **Custom Logo & Favicon**: Music note and analytics visualization branding
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Smooth Animations**: Framer Motion-powered transitions and interactions

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure your environment variables
4. Build the application: `npm run build`

## Environment Files

The application uses several environment files for different purposes:

- `.env.example`: Template file with all required environment variables
- `.env`: Main environment file for production settings
- `.env.local`: Local overrides for development (git-ignored)

Required environment variables:

\`\`\`
ROON_EXTENSION_ID=your_extension_id
ROON_DISPLAY_NAME=your_display_name
LASTFM_API_KEY=your_lastfm_api_key
\`\`\`

## Usage

### Development Mode

```bash
# Start both frontend and backend with PM2
npm run dev

# Start only the Next.js frontend
npm run dev:next

# Run linting
npm run lint

# Run type checking
npm run typecheck

# Format code
npm run format
```

### Production Mode

```bash
# Build the application
npm run build

# Start production servers
npm run start

# Stop all services
npm run stop
```

### Alternative Start Scripts

The application includes a unified start script that can run in different modes:

\`\`\`bash
# Start both frontend and backend
./start-all.sh all

# Start only the backend server
./start-all.sh server

# Start only the frontend
./start-all.sh frontend

# Start in minimal mode (reduced features)
./start-all.sh minimal
\`\`\`

## Architecture

### Frontend (Next.js 15)
- **App Router**: Modern Next.js architecture with server and client components
- **UI Components**: Built with Radix UI primitives and shadcn/ui
- **Styling**: Tailwind CSS with custom gradients and animations
- **Data Visualization**: Chart.js for statistics and analytics

### Backend (Express + Node.js)
- **Roon Integration**: Official node-roon-api for music system connection
- **History Tracking**: JSON-based storage with automatic backups
- **API Routes**: RESTful endpoints for stats, history, and real-time data
- **Process Management**: PM2 for running multiple services

### Key Pages
- **Home** (`/`): Overview dashboard with key statistics
- **Now Playing** (`/now-playing`): Real-time track display with album art
- **Wrapped** (`/wrapped`): Comprehensive listening insights and patterns
- **Top 40** (`/top-40`): Charts for top artists, albums, and tracks

## Recent Updates

### UI/UX Improvements
- **Custom Logo & Favicon**: Created a unique logo combining a music note with analytics bars
- **Animated Gradient Headers**: All page headers now feature cycling gradient animations
- **Consistent Header Alignment**: Standardized header layout across all pages
- **Connection Status Indicator**: Moved inline with header for better visibility
- **Fixed Dropdown Behavior**: Time period selector no longer causes page jumps

### Technical Stack
- **Next.js 15**: Latest version with App Router
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS**: Utility-first styling with custom theme
- **Framer Motion**: Smooth animations and transitions
- **PM2**: Process management for production deployment
- **shadcn/ui**: High-quality UI components built on Radix UI

## Service Installation

To install as a system service:

1. Edit `com.roonwrapped.plist` with your paths
2. Copy to LaunchAgents: `cp com.roonwrapped.plist ~/Library/LaunchAgents/`
3. Load the service: `launchctl load ~/Library/LaunchAgents/com.roonwrapped.plist`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
