"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Bar } from "react-chartjs-2";

import { ListeningInsights } from "@/components/stats/listening-insights";
import { TimePeriodSelector } from "@/components/ui/time-period-selector";
import { PageHeader } from "@/components/ui/page-header";
import { formatDuration } from "@/src/lib/utils";
import { formatNumber } from "@/lib/utils";

interface WrappedData {
  // Listening Stats
  totalTracksPlayed: number;
  uniqueArtistsCount: number;
  uniqueAlbumsCount: number;
  uniqueTracksCount: number;
  totalListeningTimeSeconds: number;
  averageTracksPerDay: number;
  currentListeningStreakDays: number;
  peakListeningHour: number;

  // Top Charts
  topArtistsByPlays: Array<{
    name: string;
    artist: string;
    count: number;
    image_key?: string;
  }>;
  topAlbumsByPlays: Array<{
    name: string;
    artist: string;
    album: string;
    count: number;
    image_key?: string;
  }>;
  topTracksByPlays: Array<{
    name: string;
    artist: string;
    title: string;
    count: number;
    image_key?: string;
  }>;
  topGenresByPlays: Array<{ name: string; count: number }>;

  // Listening Patterns
  listeningPatterns: {
    timeOfDay: {
      morningPlays: number;
      afternoonPlays: number;
      eveningPlays: number;
      nightPlays: number;
    };
    dayOfWeekPlays: {
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

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

// Format hour to 12-hour format with AM/PM
function formatHour(hour: number): string {
  const ampm = hour >= 12 ? "PM" : "AM";
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
        color: "rgba(255, 255, 255, 0.1)",
      },
      ticks: {
        color: "rgba(255, 255, 255, 0.7)",
      },
    },
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: "rgba(255, 255, 255, 0.7)",
      },
    },
  },
};

function WrappedPageContent() {
  const searchParams = useSearchParams();
  const period = searchParams.get("period") || "all";
  const [wrappedData, setWrappedData] = useState<WrappedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    transport: false,
  });

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // First check connection status
      const statusResponse = await fetch("/api/roon/status");
      if (statusResponse.ok) {
        const data = await statusResponse.json();
        console.log("[Frontend] Roon status:", data);
        setConnectionStatus({
          connected: data.connected,
          transport: true,
        });
      }

      console.log("[Frontend] Fetching data for period:", period);

      const response = await fetch(`/api/history/wrapped?period=${period}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("[Frontend] Received data structure:", {
        hasData: !!data,
        keys: Object.keys(data),
        totalTracksPlayed: data.totalTracksPlayed,
        uniqueArtistsCount: data.uniqueArtistsCount,
        uniqueAlbumsCount: data.uniqueAlbumsCount,
        uniqueTracksCount: data.uniqueTracksCount,
        totalListeningTimeSeconds: data.totalListeningTimeSeconds,
        averageTracksPerDay: data.averageTracksPerDay,
        currentListeningStreakDays: data.currentListeningStreakDays,
        peakListeningHour: data.peakListeningHour,
        listeningPatterns: data.listeningPatterns
          ? {
              timeOfDay: data.listeningPatterns.timeOfDay
                ? {
                    morningPlays: data.listeningPatterns.timeOfDay.morningPlays,
                    afternoonPlays:
                      data.listeningPatterns.timeOfDay.afternoonPlays,
                    eveningPlays: data.listeningPatterns.timeOfDay.eveningPlays,
                    nightPlays: data.listeningPatterns.timeOfDay.nightPlays,
                  }
                : null,
              dayOfWeekPlays: data.listeningPatterns.dayOfWeekPlays
                ? {
                    sunday: data.listeningPatterns.dayOfWeekPlays.sunday,
                    monday: data.listeningPatterns.dayOfWeekPlays.monday,
                    tuesday: data.listeningPatterns.dayOfWeekPlays.tuesday,
                    wednesday: data.listeningPatterns.dayOfWeekPlays.wednesday,
                    thursday: data.listeningPatterns.dayOfWeekPlays.thursday,
                    friday: data.listeningPatterns.dayOfWeekPlays.friday,
                    saturday: data.listeningPatterns.dayOfWeekPlays.saturday,
                  }
                : null,
            }
          : null,
        hasTopArtists: Array.isArray(data.topArtistsByPlays),
        hasTopAlbums: Array.isArray(data.topAlbumsByPlays),
        hasTopTracks: Array.isArray(data.topTracksByPlays),
      });

      if (!data.totalTracksPlayed && data.totalTracksPlayed !== 0) {
        console.warn("[Frontend] Missing totalTracksPlayed in data");
      }
      if (!data.listeningPatterns) {
        console.warn("[Frontend] Missing listeningPatterns in data");
      } else {
        if (!data.listeningPatterns.timeOfDay) {
          console.warn("[Frontend] Missing timeOfDay in listeningPatterns");
        }
        if (!data.listeningPatterns.dayOfWeekPlays) {
          console.warn(
            "[Frontend] Missing dayOfWeekPlays in listeningPatterns",
          );
        }
      }
      if (!Array.isArray(data.topArtistsByPlays)) {
        console.warn("[Frontend] Missing or invalid topArtistsByPlays in data");
      }

      setWrappedData(data);
    } catch (error) {
      console.error("[Frontend] Error loading data:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load wrapped data",
      );
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  // Load data when time period changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Poll connection status every 30 seconds
  useEffect(() => {
    const pollStatus = async () => {
      try {
        const response = await fetch("/api/roon/status");
        if (response.ok) {
          const data = await response.json();
          setConnectionStatus({
            connected: data.connected,
            transport: true,
          });
        }
      } catch (error) {
        console.error("[Frontend] Error polling status:", error);
        setConnectionStatus((prev) => ({ ...prev, transport: false }));
      }
    };

    // Initial check
    pollStatus();

    // Set up polling interval
    const interval = setInterval(pollStatus, 30000);

    // Cleanup
    return () => clearInterval(interval);
  }, []);

  const timeOfDayChartData =
    wrappedData && wrappedData.listeningPatterns?.timeOfDay
      ? {
          labels: ["Morning", "Afternoon", "Evening", "Night"],
          datasets: [
            {
              data: [
                wrappedData.listeningPatterns.timeOfDay.morningPlays || 0,
                wrappedData.listeningPatterns.timeOfDay.afternoonPlays || 0,
                wrappedData.listeningPatterns.timeOfDay.eveningPlays || 0,
                wrappedData.listeningPatterns.timeOfDay.nightPlays || 0,
              ],
              backgroundColor: "rgba(168, 85, 247, 0.6)",
              borderColor: "rgb(168, 85, 247)",
              borderWidth: 1,
            },
          ],
        }
      : null;

  const weekdayChartData =
    wrappedData && wrappedData.listeningPatterns?.dayOfWeekPlays
      ? {
          labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
          datasets: [
            {
              data: [
                wrappedData.listeningPatterns.dayOfWeekPlays.sunday || 0,
                wrappedData.listeningPatterns.dayOfWeekPlays.monday || 0,
                wrappedData.listeningPatterns.dayOfWeekPlays.tuesday || 0,
                wrappedData.listeningPatterns.dayOfWeekPlays.wednesday || 0,
                wrappedData.listeningPatterns.dayOfWeekPlays.thursday || 0,
                wrappedData.listeningPatterns.dayOfWeekPlays.friday || 0,
                wrappedData.listeningPatterns.dayOfWeekPlays.saturday || 0,
              ],
              backgroundColor: "rgba(56, 189, 248, 0.6)",
              borderColor: "rgb(56, 189, 248)",
              borderWidth: 1,
            },
          ],
        }
      : null;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin" />
          <p className="mt-2 text-sm text-muted-foreground">
            Loading your Wrapped data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header with Connection Status and Time Period Selector */}
        <PageHeader
          title="Roon Wrapped"
          titleSuffix={
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-sm ${
                connectionStatus.connected
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : "bg-zinc-900/30 text-zinc-400 border border-zinc-800/30"
              }`}
            >
              <div
                className={`h-2 w-2 rounded-full ${connectionStatus.connected ? "bg-green-500" : "bg-red-500"}`}
              />
              {connectionStatus.connected ? "Connected" : "Disconnected"}
            </div>
          }
          rightContent={
            <TimePeriodSelector
              value={period}
              onValueChange={(value) => {
                const url = new URL(window.location.href);
                url.searchParams.set("period", value);
                window.history.pushState({}, "", url.toString());
                loadData();
              }}
            />
          }
        />

        {/* Wrapped Data Section */}
        {wrappedData && (
          <>
            {/* Basic Stats */}
            {wrappedData.totalTracksPlayed !== undefined && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-500 bg-clip-text text-transparent">
                  Stats
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-zinc-900/30 border border-zinc-800/30 rounded-xl p-6 backdrop-blur-md">
                    <div className="text-zinc-300 mb-2">Total Songs</div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
                      {formatNumber(wrappedData.totalTracksPlayed)}
                    </div>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-800/30 rounded-xl p-6 backdrop-blur-md">
                    <div className="text-zinc-300 mb-2">Artists Played</div>
                    <div className="text-2xl font-bold bg-gradient-to-r from-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                      {formatNumber(wrappedData.uniqueArtistsCount)}
                    </div>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-800/30 rounded-xl p-6 backdrop-blur-md">
                    <div className="text-zinc-300 mb-2">Albums Played</div>
                    <div className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                      {formatNumber(wrappedData.uniqueAlbumsCount)}
                    </div>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-800/30 rounded-xl p-6 backdrop-blur-md">
                    <div className="text-zinc-300 mb-2">Songs Played</div>
                    <div className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                      {formatNumber(wrappedData.uniqueTracksCount)}
                    </div>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-800/30 rounded-xl p-6 backdrop-blur-md">
                    <div className="text-zinc-300 mb-2">Listening Time</div>
                    <div className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
                      {formatDuration(wrappedData.totalListeningTimeSeconds)}
                    </div>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-800/30 rounded-xl p-6 backdrop-blur-md">
                    <div className="text-zinc-300 mb-2">
                      Daily Average Songs
                    </div>
                    <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                      {formatNumber(Math.round(wrappedData.averageTracksPerDay))} songs
                    </div>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-800/30 rounded-xl p-6 backdrop-blur-md">
                    <div className="text-zinc-300 mb-2">Daily Play Streak</div>
                    <div className="text-2xl font-bold bg-gradient-to-r from-rose-400 to-red-400 bg-clip-text text-transparent">
                      {formatNumber(wrappedData.currentListeningStreakDays)} days
                    </div>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-800/30 rounded-xl p-6 backdrop-blur-md">
                    <div className="text-zinc-300 mb-2">Most Active Time</div>
                    <div className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                      {formatHour(wrappedData.peakListeningHour)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Insights Section */}
            <ListeningInsights {...wrappedData} />

            {/* Charts */}
            {(timeOfDayChartData || weekdayChartData) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Time of Day Distribution */}
                {timeOfDayChartData && (
                  <div className="bg-zinc-900/30 border border-zinc-800/30 rounded-xl p-6 backdrop-blur-md">
                    <h3 className="text-xl font-semibold mb-4">
                      Time of Day Distribution
                    </h3>
                    <Bar data={timeOfDayChartData} options={chartOptions} />
                  </div>
                )}

                {/* Weekly Distribution */}
                {weekdayChartData && (
                  <div className="bg-zinc-900/30 border border-zinc-800/30 rounded-xl p-6 backdrop-blur-md">
                    <h3 className="text-xl font-semibold mb-4">
                      Weekly Distribution
                    </h3>
                    <Bar data={weekdayChartData} options={chartOptions} />
                  </div>
                )}
              </div>
            )}

            {/* Top Artists */}
            {wrappedData.topArtistsByPlays?.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-pink-400 via-fuchsia-400 to-purple-500 bg-clip-text text-transparent">
                  Top Artists
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {wrappedData.topArtistsByPlays
                    .slice(0, 10)
                    .map((artist, index) => (
                      <div
                        key={index}
                        className="group bg-zinc-900/30 border border-zinc-800/30 rounded-xl overflow-hidden hover:bg-zinc-800/70 transition-colors"
                      >
                        {artist.image_key ? (
                          <div className="relative aspect-square">
                            <img
                              src={`/api/roon/image/${artist.image_key}`}
                              alt={artist.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center"><svg class="w-12 h-12 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg></div>';
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent pointer-events-none" />
                          </div>
                        ) : (
                          <div className="relative aspect-square">
                            <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                              <svg className="w-12 h-12 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
                              </svg>
                            </div>
                          </div>
                        )}
                        <div className="p-4 space-y-2">
                          <div>
                            <h3 className="font-medium text-base text-white/90 line-clamp-2">
                              {artist.name}
                            </h3>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-white/10">
                            <p className="text-sm text-white/40">
                              {formatNumber(artist.count)} plays
                            </p>
                            <div className="text-xs text-white/30">
                              #{index + 1}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Top Albums */}
            {wrappedData.topAlbumsByPlays?.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-500 bg-clip-text text-transparent">
                  Top Albums
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {wrappedData.topAlbumsByPlays
                    .slice(0, 10)
                    .map((album, index) => (
                      <div
                        key={index}
                        className="group bg-zinc-900/30 border border-zinc-800/30 rounded-xl overflow-hidden hover:bg-zinc-800/70 transition-colors"
                      >
                        {album.image_key ? (
                          <div className="relative aspect-square">
                            <img
                              src={`/api/roon/image/${album.image_key}`}
                              alt={album.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center"><svg class="w-12 h-12 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg></div>';
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent pointer-events-none" />
                          </div>
                        ) : (
                          <div className="relative aspect-square">
                            <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                              <svg className="w-12 h-12 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
                              </svg>
                            </div>
                          </div>
                        )}
                        <div className="p-4 space-y-2">
                          <div>
                            <h3 className="font-medium text-base text-white/90 line-clamp-2">
                              {album.name}
                            </h3>
                            <p className="text-sm text-white/60 mt-1 line-clamp-1">
                              {album.artist}
                            </p>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-white/10">
                            <p className="text-sm text-white/40">
                              {formatNumber(album.count)} plays
                            </p>
                            <div className="text-xs text-white/30">
                              #{index + 1}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Top Songs */}
            {wrappedData.topTracksByPlays?.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-500 bg-clip-text text-transparent">
                  Top Songs
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {wrappedData.topTracksByPlays
                    .slice(0, 10)
                    .map((track, index) => (
                      <div
                        key={index}
                        className="group bg-zinc-900/30 border border-zinc-800/30 rounded-xl overflow-hidden hover:bg-zinc-800/70 transition-colors"
                      >
                        {track.image_key ? (
                          <div className="relative aspect-square">
                            <img
                              src={`/api/roon/image/${track.image_key}`}
                              alt={track.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center"><svg class="w-12 h-12 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg></div>';
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent pointer-events-none" />
                          </div>
                        ) : (
                          <div className="relative aspect-square">
                            <div className="w-full h-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                              <svg className="w-12 h-12 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
                              </svg>
                            </div>
                          </div>
                        )}
                        <div className="p-4 space-y-2">
                          <div>
                            <h3 className="font-medium text-base text-white/90 line-clamp-2">
                              {track.title}
                            </h3>
                            <p className="text-sm text-white/60 mt-1 line-clamp-1">
                              {track.artist}
                            </p>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-white/10">
                            <p className="text-sm text-white/40">
                              {formatNumber(track.count)} plays
                            </p>
                            <div className="text-xs text-white/30">
                              #{index + 1}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function WrappedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">Loading...</div>
          </div>
        </div>
      }
    >
      <WrappedPageContent />
    </Suspense>
  );
}
