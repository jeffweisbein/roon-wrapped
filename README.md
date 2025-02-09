# Roon Wrapped

A beautiful visualization of your Roon music listening history, inspired by Spotify Wrapped. This application connects to your Roon Core and generates personalized insights about your music listening habits.

![Roon-Wrapped-01-29-2025_12_23_AM](https://github.com/user-attachments/assets/8ffe77e4-66e3-44f4-8ea7-a88fa6f3b0be)
![Roon-Wrapped-01-11-2025_07_06_PM (1)](https://github.com/user-attachments/assets/8312472d-70c9-429b-84f0-7df7949fe3ab)
![Roon-Wrapped-01-11-2025_07_06_PM (2)](https://github.com/user-attachments/assets/8ef898a8-f576-44a7-84a7-2f117d78920f)
![Roon-Wrapped-01-11-2025_07_06_PM (3)](https://github.com/user-attachments/assets/06502259-afe6-47bc-b6f0-7ddcca2be96b)

## Features
- Connect to your Roon Core
- Track your listening history across all Roon zones
- View detailed statistics about your music preferences
- See insights about your listening patterns
- Compare your listening habits with global averages
- Beautiful, responsive UI with dark mode

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

## Development

1. Start the development server: `npm run dev`
2. Open [http://localhost:3000](http://localhost:3000)

## Production

1. Build the application: `npm run build`
2. Start the production server: `./start-all.sh all`

## Service Installation

To install as a system service:

1. Edit `com.roonwrapped.plist` with your paths
2. Copy to LaunchAgents: `cp com.roonwrapped.plist ~/Library/LaunchAgents/`
3. Load the service: `launchctl load ~/Library/LaunchAgents/com.roonwrapped.plist`

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
