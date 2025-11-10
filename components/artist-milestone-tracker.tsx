"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Line, Bar } from "react-chartjs-2";
import { MilestoneAwards } from "./milestone-awards";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ArtistProgress {
  artist: string;
  firstListen: number;
  totalPlays: number;
  daysToTenPlays: number | null;
  daysToFiftyPlays: number | null;
  daysToHundredPlays: number | null;
  currentPlayRate: number | null;
  acceleration: number | null;
  albums: number;
  milestones: Array<{
    milestone: number;
    reachedAt: number;
    daysSinceFirstListen: number;
    playRate: number;
  }>;
}

interface TrajectoryData {
  artist: string;
  trajectory: Array<{
    days: number;
    plays: number;
    milestone: string;
    playRate?: number;
  }>;
  totalDays: number;
  totalPlays: number;
  averagePlayRate: number | null;
}

interface ComparisonData {
  byTotalPlays?: ArtistProgress[];
  byPlayRate?: ArtistProgress[];
  byFastestToFifty?: ArtistProgress[];
  byAcceleration?: ArtistProgress[];
}

interface LeaderboardEntry {
  artist: string;
  totalPlays: number;
  daysActive: number;
  playRate: number;
  acceleration: number;
  albumCount: number;
  milestoneCount: number;
  daysToFifty: number | null;
  daysToHundred: number | null;
}

interface Award {
  id: string;
  title: string;
  description: string;
  artist: string;
  metric: string;
  color: string;
}

export function ArtistMilestoneTracker() {
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [trajectories, setTrajectories] = useState<TrajectoryData[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardMetric, setLeaderboardMetric] = useState("totalPlays");
  const [availableArtists, setAvailableArtists] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<string | null>(null);
  const [awards, setAwards] = useState<Award[]>([]);
  
  // Artist search states
  const [artistSearchTerm, setArtistSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Filter available artists based on search term
  const filteredArtists = availableArtists.filter(artist => 
    artist.toLowerCase().includes(artistSearchTerm.toLowerCase()) &&
    !selectedArtists.includes(artist)
  ).slice(0, 50); // Limit to 50 results for performance
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalArtists, setTotalArtists] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const itemsPerPage = 20;

  // Fetch available artists and awards on mount
  useEffect(() => {
    // Initial load - reset everything and fetch fresh data
    setLeaderboard([]);
    setCurrentPage(1);
    setTotalArtists(0);
    fetchLeaderboard(true);
    fetchAwards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch comparison data when artists are selected
  useEffect(() => {
    if (selectedArtists.length > 0) {
      fetchComparisonData();
      fetchTrajectories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedArtists]);

  // Fetch leaderboard when metric changes
  useEffect(() => {
    // Reset pagination when metric changes
    console.log(`Metric changed to: ${leaderboardMetric}, resetting leaderboard`);
    setCurrentPage(1);
    setLeaderboard([]);
    setTotalArtists(0);
    // Use setTimeout to ensure state is updated before fetching
    setTimeout(() => {
      fetchLeaderboard(true);
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaderboardMetric]);

  const fetchLeaderboard = async (reset = false) => {
    try {
      // Calculate offset based on whether we're resetting or loading more
      // When reset is false, we want to load the next page based on current items
      const offset = reset ? 0 : leaderboard.length;
      const limit = itemsPerPage;
      
      console.log(`Fetching leaderboard: metric=${leaderboardMetric}, offset=${offset}, limit=${limit}, reset=${reset}, currentItems=${leaderboard.length}`);
      
      const res = await fetch(`/api/milestones/leaderboard?metric=${leaderboardMetric}&limit=${limit}&offset=${offset}`);
      const data = await res.json();
      
      console.log(`Received ${data.artists?.length || 0} artists, total=${data.total}, offset=${data.offset}`);
      
      if (reset) {
        // Complete reset - replace all data
        setLeaderboard(data.artists || []);
        setCurrentPage(1);
      } else {
        // Append new items to existing list
        // The backend should return items starting from the offset
        if (data.artists && data.artists.length > 0) {
          setLeaderboard(prev => {
            // Create a set of existing artist names for duplicate detection
            const existingKeys = new Set(prev.map(a => a.artist));
            // Filter out any duplicates (shouldn't happen with proper offset)
            const newItems = data.artists.filter((a: LeaderboardEntry) => !existingKeys.has(a.artist));
            console.log(`Adding ${newItems.length} new items to existing ${prev.length} items`);
            return [...prev, ...newItems];
          });
        } else {
          console.log("No new items received from server");
        }
      }
      
      // Store total count for pagination display
      setTotalArtists(data.total || 0);
      
      // Extract artist names for selection on first load
      if (!availableArtists.length && data.artists && data.artists.length > 0) {
        // Fetch all artists for the dropdown (up to 100)
        const allRes = await fetch(`/api/milestones/leaderboard?metric=totalPlays&limit=100&offset=0`);
        const allData = await allRes.json();
        setAvailableArtists(allData.artists.map((a: LeaderboardEntry) => a.artist));
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    }
  };

  const loadMoreItems = async () => {
    if (isLoadingMore) {
      console.log(`Already loading more items`);
      return;
    }
    
    if (leaderboard.length >= totalArtists) {
      console.log(`All items loaded: current=${leaderboard.length}, total=${totalArtists}`);
      return;
    }

    console.log(`Starting Load More: current items=${leaderboard.length}, total=${totalArtists}`);
    setIsLoadingMore(true);
    
    try {
      // Calculate the correct offset based on current items
      const currentOffset = leaderboard.length;
      const limit = itemsPerPage;
      
      console.log(`Fetching: metric=${leaderboardMetric}, offset=${currentOffset}, limit=${limit}`);
      
      const res = await fetch(`/api/milestones/leaderboard?metric=${leaderboardMetric}&limit=${limit}&offset=${currentOffset}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      console.log(`Response: received ${data.artists?.length || 0} items, total=${data.total}`);
      
      if (data.artists && data.artists.length > 0) {
        // Simply append the new items since offset ensures no duplicates
        setLeaderboard(prev => {
          console.log(`Previous items: ${prev.slice(0, 3).map(a => a.artist).join(', ')}...`);
          console.log(`New items to add: ${data.artists.slice(0, 3).map((a: LeaderboardEntry) => a.artist).join(', ')}...`);
          const newList = [...prev, ...data.artists];
          console.log(`Updated leaderboard: was ${prev.length} items, now ${newList.length} items`);
          console.log(`First 3 after update: ${newList.slice(0, 3).map(a => a.artist).join(', ')}`);
          console.log(`Last 3 after update: ${newList.slice(-3).map(a => a.artist).join(', ')}`);
          return newList;
        });
        
        // Update total if it changed
        if (data.total) {
          setTotalArtists(data.total);
        }
      } else {
        console.log("No new items received from server");
      }
      
      setCurrentPage(prev => prev + 1);
    } catch (error) {
      console.error("Error loading more leaderboard items:", error);
    } finally {
      setIsLoadingMore(false);
      console.log(`Load More completed. isLoadingMore reset to false`);
    }
  };

  const fetchComparisonData = async () => {
    if (selectedArtists.length === 0) return;
    
    try {
      const res = await fetch(`/api/milestones/compare?artists=${selectedArtists.join(",")}`);
      const data = await res.json();
      setComparisonData(data);
    } catch (error) {
      console.error("Error fetching comparison:", error);
    }
  };

  const fetchTrajectories = async () => {
    const trajectoryPromises = selectedArtists.map(async (artist) => {
      const res = await fetch(`/api/milestones/trajectory/${encodeURIComponent(artist)}`);
      return res.json();
    });
    
    try {
      const data = await Promise.all(trajectoryPromises);
      setTrajectories(data.filter(Boolean));
    } catch (error) {
      console.error("Error fetching trajectories:", error);
    }
  };

  const fetchAwards = async () => {
    try {
      const res = await fetch("/api/milestones/awards");
      const data = await res.json();
      setAwards(data);
    } catch (error) {
      console.error("Error fetching awards:", error);
    }
  };

  const processHistoricalData = async () => {
    setIsProcessing(true);
    setProcessingResult(null);
    
    try {
      const res = await fetch("/api/milestones/process-historical", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      const data = await res.json();
      
      if (data.success) {
        setProcessingResult(`Successfully processed ${data.tracksProcessed} tracks. Found ${data.uniqueArtists} artists and recorded ${data.milestonesRecorded} milestones.`);
        // Refresh the leaderboard, awards, and available artists
        setCurrentPage(1);
        await fetchLeaderboard(true);
        await fetchAwards();
      } else {
        setProcessingResult(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error processing historical data:", error);
      setProcessingResult("Failed to process historical data");
    } finally {
      setIsProcessing(false);
    }
  };

  // Prepare chart data for growth trajectories
  const trajectoryChartData = {
    datasets: trajectories.map((traj, index) => ({
      label: traj.artist,
      data: traj.trajectory.map(point => ({
        x: point.days,
        y: point.plays,
      })),
      borderColor: `hsl(${index * 360 / trajectories.length}, 70%, 50%)`,
      backgroundColor: `hsla(${index * 360 / trajectories.length}, 70%, 50%, 0.1)`,
      tension: 0.4,
    })),
  };

  const trajectoryChartOptions: ChartOptions<"line"> = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Artist Growth Trajectories",
      },
      tooltip: {
        callbacks: {
          afterLabel: (context) => {
            const dataIndex = context.dataIndex;
            const trajectory = trajectories[context.datasetIndex];
            if (trajectory && trajectory.trajectory[dataIndex]) {
              const point = trajectory.trajectory[dataIndex];
              return [
                `Milestone: ${formatNumber(point.milestone)}`,
                point.playRate ? `Play Rate: ${point.playRate.toFixed(2)} plays/day` : "",
              ].filter(Boolean);
            }
            return [];
          },
        },
      },
    },
    scales: {
      x: {
        type: "linear",
        title: {
          display: true,
          text: "Days Since First Listen",
        },
      },
      y: {
        title: {
          display: true,
          text: "Total Plays",
        },
        ticks: {
          callback: function(value) {
            return formatNumber(Number(value));
          }
        }
      },
    },
  };

  // Prepare chart data for milestone comparison
  const milestoneComparisonData = {
    labels: ["10 Plays", "50 Plays", "100 Plays"],
    datasets: selectedArtists.map((artist, index) => {
      const artistData = comparisonData?.byTotalPlays?.find((a: ArtistProgress) => a.artist === artist);
      return {
        label: artist,
        data: [
          artistData?.daysToTenPlays || null,
          artistData?.daysToFiftyPlays || null,
          artistData?.daysToHundredPlays || null,
        ],
        backgroundColor: `hsla(${index * 360 / selectedArtists.length}, 70%, 50%, 0.6)`,
        borderColor: `hsl(${index * 360 / selectedArtists.length}, 70%, 50%)`,
        borderWidth: 2,
      };
    }),
  };

  const milestoneChartOptions: ChartOptions<"bar"> = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Days to Reach Milestones",
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: "Days",
        },
        ticks: {
          callback: function(value) {
            return formatNumber(Number(value));
          }
        }
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Awards Section */}
      {awards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>🏆 Performance Awards</CardTitle>
          </CardHeader>
          <CardContent>
            <MilestoneAwards awards={awards} />
          </CardContent>
        </Card>
      )}

      {/* Artist Selection and Charts */}
      <Card>
        <CardHeader>
          <CardTitle>Artist Performance Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Artists to Compare</label>
              <div className="relative" ref={dropdownRef}>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search and select artists..."
                    value={artistSearchTerm}
                    onChange={(e) => setArtistSearchTerm(e.target.value)}
                    onFocus={() => setIsDropdownOpen(true)}
                    className="w-full pr-10"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                
                {isDropdownOpen && (filteredArtists.length > 0 || artistSearchTerm) && (
                  <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredArtists.length > 0 ? (
                      filteredArtists.map((artist) => (
                        <button
                          key={artist}
                          className="w-full text-left px-3 py-2 hover:bg-muted transition-colors text-sm"
                          onClick={() => {
                            if (!selectedArtists.includes(artist)) {
                              setSelectedArtists([...selectedArtists, artist]);
                              setArtistSearchTerm("");
                              setIsDropdownOpen(false);
                            }
                          }}
                        >
                          {artist}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No artists found matching "{artistSearchTerm}"
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {selectedArtists.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedArtists.map((artist) => (
                    <Badge
                      key={artist}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => setSelectedArtists(selectedArtists.filter(a => a !== artist))}
                    >
                      {artist} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {trajectories.length > 0 && (
              <div className="w-full h-96">
                <Line data={trajectoryChartData} options={trajectoryChartOptions} />
              </div>
            )}

            {comparisonData && selectedArtists.length > 0 && (
              <div className="w-full h-64">
                <Bar data={milestoneComparisonData} options={milestoneChartOptions} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Comparison - Moved above leaderboard */}
      {comparisonData && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {comparisonData.byTotalPlays?.map((artist: ArtistProgress) => (
                <div key={artist.artist} className="p-4 rounded-lg border">
                  <h3 className="font-semibold mb-2">{artist.artist}</h3>
                  <div className="space-y-1 text-sm">
                    <p>Total Plays: <span className="font-medium">{formatNumber(artist.totalPlays)}</span></p>
                    <p>Albums: <span className="font-medium">{formatNumber(artist.albums)}</span></p>
                    <p>Play Rate: <span className="font-medium">
                      {artist.currentPlayRate?.toFixed(2) || "N/A"} plays/day
                    </span></p>
                    {artist.acceleration !== null && (
                      <p>Acceleration: <span className="font-medium">
                        {artist.acceleration > 0 ? "+" : ""}{artist.acceleration.toFixed(3)} Δ/day
                      </span></p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Leaderboard - Now below Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select value={leaderboardMetric} onValueChange={setLeaderboardMetric}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="totalPlays">Total Plays</SelectItem>
                <SelectItem value="playRate">Play Rate</SelectItem>
                <SelectItem value="acceleration">Acceleration</SelectItem>
                <SelectItem value="fastestToFifty">Fastest to 50 Plays</SelectItem>
                <SelectItem value="albumCount">Most Albums</SelectItem>
              </SelectContent>
            </Select>

            <div className="space-y-4">
              {/* Results count */}
              <div className="text-sm text-muted-foreground">
                Showing {leaderboard.length} of {totalArtists || leaderboard.length} artists
              </div>

              {/* Leaderboard list */}
              <div className="space-y-2">
                {leaderboard.map((artist, index) => (
                  <div
                    key={`${leaderboardMetric}-${artist.artist}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-muted-foreground">
                        #{index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-wrap break-words">{artist.artist}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatNumber(artist.totalPlays)} plays · {formatNumber(artist.albumCount)} albums
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {leaderboardMetric === "playRate" && (
                        <p className="font-medium">{artist.playRate.toFixed(2)} plays/day</p>
                      )}
                      {leaderboardMetric === "acceleration" && (
                        <p className="font-medium">
                          {artist.acceleration !== null && artist.acceleration !== 0 ? (
                            <>
                              {artist.acceleration > 0 ? "+" : ""}
                              {artist.acceleration.toFixed(4)} Δ/day
                            </>
                          ) : (
                            "N/A"
                          )}
                        </p>
                      )}
                      {leaderboardMetric === "fastestToFifty" && artist.daysToFifty && (
                        <p className="font-medium">{artist.daysToFifty} days</p>
                      )}
                      {leaderboardMetric === "totalPlays" && (
                        <p className="font-medium">{formatNumber(artist.totalPlays)} plays</p>
                      )}
                      {leaderboardMetric === "albumCount" && (
                        <p className="font-medium">{formatNumber(artist.albumCount)} albums</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More button */}
              {leaderboard.length < totalArtists && leaderboard.length > 0 && (
                <div className="flex justify-center pt-4">
                  <Button 
                    onClick={loadMoreItems} 
                    disabled={isLoadingMore || leaderboard.length >= totalArtists}
                    variant="outline"
                  >
                    {isLoadingMore ? "Loading..." : "Load More"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}