'use client';

import React, {
  useEffect,
  useState,
} from 'react';

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js';
import { Loader2 } from 'lucide-react';
import { Bar } from 'react-chartjs-2';

interface WrappedData {
  totalPlays: number;
  uniqueArtists: number;
  uniqueAlbums: number;
  uniqueTracks: number;
  totalPlaytime: number;
  dailyAverage: number;
  currentStreak: number;
  peakHour: number;
  topArtists: Array<{ name: string; artist: string; count: number; image_key?: string }>;
  topAlbums: Array<{ name: string; artist: string; album: string; count: number; image_key?: string }>;
  topTracks: Array<{ name: string; artist: string; title: string; count: number; image_key?: string }>;
  topGenres: Array<{ name: string; count: number }>;
  patterns: {
    timeOfDay: {
      morning: number;
      afternoon: number;
      evening: number;
      night: number;
    };
    dayOfWeek: {
      sunday: number;
      monday: number;
      tuesday: number;
      wednesday: number;
      thursday: number;
      friday: number;
      saturday: number;
    };
  };
}

interface RoonStatus {
  connected: boolean;
  transport: boolean;
}

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Format hour to 12-hour format with AM/PM
function formatHour(hour: number): string {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}${ampm}`;
}

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(255, 255, 255, 0.1)',
      },
      ticks: {
        color: 'rgba(255, 255, 255, 0.7)',
      },
    },
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: 'rgba(255, 255, 255, 0.7)',
      },
    },
  },
};

export default function WrappedPage() {
  const [wrappedData, setWrappedData] = useState<WrappedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState({ connected: false, transport: false });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Check connection status
        const statusResponse = await fetch('/api/roon/status', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!statusResponse.ok) {
          throw new Error(`HTTP error! status: ${statusResponse.status}`);
        }
        
        const outerData = await statusResponse.json();
        
        if (!outerData.success) {
          throw new Error(outerData.error || 'Server returned error');
        }
        
        // Parse the nested JSON string in data
        const innerData = JSON.parse(outerData.data);
        
        if (!innerData.success) {
          throw new Error(innerData.error || 'Roon server returned error');
        }
        
        setConnectionStatus({
          connected: innerData.isConnected,
          transport: true
        });

        // Fetch wrapped data
        const wrappedResponse = await fetch('/api/roon/wrapped', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        const wrappedData = await wrappedResponse.json();
        if (!wrappedResponse.ok) {
          throw new Error(wrappedData.error || 'Failed to fetch wrapped data');
        }
        
        // Validate required data and ensure arrays exist
        if (!wrappedData || typeof wrappedData.totalPlays !== 'number') {
          throw new Error('Invalid wrapped data format');
        }

        // Ensure arrays exist
        wrappedData.topArtists = wrappedData.topArtists || [];
        wrappedData.topAlbums = wrappedData.topAlbums || [];
        wrappedData.topTracks = wrappedData.topTracks || [];
        wrappedData.topGenres = wrappedData.topGenres || [];

        setWrappedData(wrappedData);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load wrapped data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Format time periods
  const formatTimePeriod = (period: string) => {
    return period.charAt(0).toUpperCase() + period.slice(1);
  };

  const timeOfDayChartData = wrappedData ? {
    labels: ['Morning', 'Afternoon', 'Evening', 'Night'],
    datasets: [{
      data: [
        wrappedData.patterns.timeOfDay.morning,
        wrappedData.patterns.timeOfDay.afternoon,
        wrappedData.patterns.timeOfDay.evening,
        wrappedData.patterns.timeOfDay.night
      ],
      backgroundColor: 'rgba(147, 51, 234, 0.5)',
      borderColor: 'rgb(147, 51, 234)',
      borderWidth: 1,
    }],
  } : null;

  const weekdayChartData = wrappedData ? {
    labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    datasets: [{
      data: [
        wrappedData.patterns.dayOfWeek.sunday,
        wrappedData.patterns.dayOfWeek.monday,
        wrappedData.patterns.dayOfWeek.tuesday,
        wrappedData.patterns.dayOfWeek.wednesday,
        wrappedData.patterns.dayOfWeek.thursday,
        wrappedData.patterns.dayOfWeek.friday,
        wrappedData.patterns.dayOfWeek.saturday
      ],
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 1,
    }],
  } : null;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin" />
          <p className="mt-2 text-sm text-muted-foreground">Loading your Wrapped data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-800 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-800 text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
            Roon Wrapped
          </h1>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded ${
            connectionStatus.connected 
              ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
              : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700/50'
          }`}>
            <div className={`h-2 w-2 rounded-full ${connectionStatus.connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>
              {connectionStatus.connected ? 'Connected to Roon' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        {/* Wrapped Data Section */}
        {wrappedData && (
          <>
            {/* Basic Stats */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">Stats</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-6 backdrop-blur-sm">
                  <div className="text-zinc-400 mb-2">Total Plays</div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                    {wrappedData.totalPlays}
                  </div>
                </div>
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-6 backdrop-blur-sm">
                  <div className="text-zinc-400 mb-2">Unique Artists</div>
                  <div className="text-2xl font-bold">
                    {wrappedData.uniqueArtists}
                  </div>
                </div>
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-6 backdrop-blur-sm">
                  <div className="text-zinc-400 mb-2">Unique Albums</div>
                  <div className="text-2xl font-bold">
                    {wrappedData.uniqueAlbums}
                  </div>
                </div>
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-6 backdrop-blur-sm">
                  <div className="text-zinc-400 mb-2">Unique Tracks</div>
                  <div className="text-2xl font-bold">
                    {wrappedData.uniqueTracks}
                  </div>
                </div>
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-6 backdrop-blur-sm">
                  <div className="text-zinc-400 mb-2">Total Playtime</div>
                  <div className="text-2xl font-bold">
                    {Math.round(wrappedData.totalPlaytime)} minutes
                  </div>
                </div>
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-6 backdrop-blur-sm">
                  <div className="text-zinc-400 mb-2">Daily Average</div>
                  <div className="text-2xl font-bold">
                    {Math.round(wrappedData.dailyAverage)} tracks
                  </div>
                </div>
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-6 backdrop-blur-sm">
                  <div className="text-zinc-400 mb-2">Current Streak</div>
                  <div className="text-2xl font-bold">
                    {wrappedData.currentStreak} days
                  </div>
                </div>
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-6 backdrop-blur-sm">
                  <div className="text-zinc-400 mb-2">Peak Hour</div>
                  <div className="text-2xl font-bold">
                    {formatHour(wrappedData.peakHour)}
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Time of Day Distribution */}
              <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-4">Time of Day Distribution</h3>
                {timeOfDayChartData && <Bar data={timeOfDayChartData} options={chartOptions} />}
              </div>

              {/* Weekly Distribution */}
              <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-4">Weekly Distribution</h3>
                {weekdayChartData && <Bar data={weekdayChartData} options={chartOptions} />}
              </div>
            </div>

            {/* Top Artists */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-pink-400 via-fuchsia-400 to-purple-500 bg-clip-text text-transparent">Top Artists</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {wrappedData.topArtists.slice(0, 10).map((artist, index) => (
                  <div key={index} className="group bg-zinc-800/50 border border-zinc-700/50 rounded-xl overflow-hidden hover:bg-zinc-800/70 transition-colors">
                    {artist.image_key && (
                      <div className="relative aspect-square">
                        <img 
                          src={`/api/roon/image/${artist.image_key}`}
                          alt={artist.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
                      </div>
                    )}
                    <div className="p-4 space-y-2">
                      <div>
                        <h3 className="font-medium text-base text-white/90 line-clamp-2">{artist.name}</h3>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/10">
                        <p className="text-sm text-white/40">{artist.count} plays</p>
                        <div className="text-xs text-white/30">#{index + 1}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Albums */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-500 bg-clip-text text-transparent">Top Albums</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {wrappedData.topAlbums.slice(0, 10).map((album, index) => (
                  <div key={index} className="group bg-zinc-800/50 border border-zinc-700/50 rounded-xl overflow-hidden hover:bg-zinc-800/70 transition-colors">
                    {album.image_key && (
                      <div className="relative aspect-square">
                        <img 
                          src={`/api/roon/image/${album.image_key}`}
                          alt={album.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
                      </div>
                    )}
                    <div className="p-4 space-y-2">
                      <div>
                        <h3 className="font-medium text-base text-white/90 line-clamp-2">{album.name}</h3>
                        <p className="text-sm text-white/60 mt-1 line-clamp-1">{album.artist}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/10">
                        <p className="text-sm text-white/40">{album.count} plays</p>
                        <div className="text-xs text-white/30">#{index + 1}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Tracks */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-500 bg-clip-text text-transparent">Top Tracks</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {wrappedData.topTracks.slice(0, 10).map((track, index) => (
                  <div key={index} className="group bg-zinc-800/50 border border-zinc-700/50 rounded-xl overflow-hidden hover:bg-zinc-800/70 transition-colors">
                    {track.image_key && (
                      <div className="relative aspect-square">
                        <img 
                          src={`/api/roon/image/${track.image_key}`}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
                      </div>
                    )}
                    <div className="p-4 space-y-2">
                      <div>
                        <h3 className="font-medium text-base text-white/90 line-clamp-2">{track.title}</h3>
                        <p className="text-sm text-white/60 mt-1 line-clamp-1">{track.artist}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/10">
                        <p className="text-sm text-white/40">{track.count} plays</p>
                        <div className="text-xs text-white/30">#{index + 1}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 