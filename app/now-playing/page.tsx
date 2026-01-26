"use client";

import { useEffect, useState } from "react";

import { motion } from "framer-motion";
import {
  Pause,
  Play,
  Volume2,
  Sparkles,
  Music,
  TrendingUp,
  Disc3,
  LayoutGrid,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { CDPlayer } from "@/components/cd-player";

interface NowPlayingData {
  title: string;
  artist: string;
  album: string;
  length: number;
  image_key?: string;
  seek_position: number;
  zone_name: string;
  genres?: string[];
  year?: number | null;
  bpm?: number | null;
  state: string;
}

interface Recommendation {
  artist?: string;
  name?: string;
  similarity?: number;
  reason?: string;
  type?: string;
}

interface AlbumTrack {
  title: string;
  duration?: number;
}

type ViewMode = "card" | "cd";

export default function NowPlayingPage() {
  const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [albumTracks, setAlbumTracks] = useState<AlbumTrack[]>([]);

  // Function to fetch now playing data
  const fetchNowPlaying = async () => {
    try {
      const response = await fetch("/api/roon/now-playing");
      if (!response.ok) {
        throw new Error("Failed to fetch now playing data");
      }
      const data = await response.json();
      setNowPlaying(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching now playing:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setNowPlaying(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch recommendations
  const fetchRecommendations = async () => {
    if (!nowPlaying) return;

    try {
      const response = await fetch("/api/recommendations/now-playing");
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (err) {
      console.error("Error fetching recommendations:", err);
    }
  };

  // Function to fetch album tracks
  const fetchAlbumTracks = async () => {
    if (!nowPlaying?.album) return;

    try {
      const response = await fetch(
        `/api/roon/album-tracks?album=${encodeURIComponent(nowPlaying.album)}&artist=${encodeURIComponent(nowPlaying.artist)}`
      );
      if (response.ok) {
        const data = await response.json();
        setAlbumTracks(data.tracks || []);
      }
    } catch (err) {
      console.error("Error fetching album tracks:", err);
      // Fallback: just show current track
      setAlbumTracks([{ title: nowPlaying.title }]);
    }
  };

  // Set up polling for real-time updates
  useEffect(() => {
    fetchNowPlaying();

    // Poll every 1 second for real-time updates (more responsive)
    const interval = setInterval(fetchNowPlaying, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch recommendations when track changes
  useEffect(() => {
    if (nowPlaying) {
      fetchRecommendations();
      fetchAlbumTracks();
    }
  }, [nowPlaying?.title, nowPlaying?.artist, nowPlaying?.album]);

  // Format time helper function
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Calculate progress percentage
  const progressPercentage = nowPlaying
    ? Math.min((nowPlaying.seek_position / nowPlaying.length) * 100, 100)
    : 0;

  // Find current track index
  const currentTrackIndex = albumTracks.findIndex(
    (track) => track.title === nowPlaying?.title
  );

  const isPlaying = nowPlaying?.state === "playing";

  // View toggle component
  const ViewToggle = () => (
    <div className="flex items-center gap-2 bg-zinc-800/50 rounded-lg p-1">
      <button
        onClick={() => setViewMode("card")}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
          viewMode === "card"
            ? "bg-purple-500/20 text-purple-400"
            : "text-zinc-400 hover:text-white"
        }`}
      >
        <LayoutGrid className="w-4 h-4" />
        <span className="hidden sm:inline">Card</span>
      </button>
      <button
        onClick={() => setViewMode("cd")}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
          viewMode === "cd"
            ? "bg-purple-500/20 text-purple-400"
            : "text-zinc-400 hover:text-white"
        }`}
      >
        <Disc3 className="w-4 h-4" />
        <span className="hidden sm:inline">CD Player</span>
      </button>
    </div>
  );

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          <PageHeader
            title="Now Playing"
            subtitle="Real-time music from your Roon system"
          />

          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
          </div>
        </motion.div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          <PageHeader
            title="Now Playing"
            subtitle="Real-time music from your Roon system"
          />

          <Card className="bg-red-500/10 border-red-500/20">
            <CardContent className="p-6 text-center">
              <p className="text-red-400">Error: {error}</p>
              <p className="text-zinc-400 text-sm mt-2">
                Make sure your Roon system is connected and playing music
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    );
  }

  if (!nowPlaying) {
    return (
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          <PageHeader
            title="Now Playing"
            subtitle="Real-time music from your Roon system"
          />

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-12 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-zinc-800 rounded-full flex items-center justify-center">
                  <Pause className="w-8 h-8 text-zinc-400" />
                </div>
                <div>
                  <p className="text-xl text-zinc-300">
                    Nothing playing right now
                  </p>
                  <p className="text-zinc-500 text-sm mt-1">
                    Start playing music on your Roon system to see it here
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <PageHeader
            title="Now Playing"
            subtitle="Real-time music from your Roon system"
          />
          <ViewToggle />
        </div>

        {/* CD Player View */}
        {viewMode === "cd" && (
          <motion.div
            key="cd-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/80 border-zinc-700/50 backdrop-blur-lg overflow-hidden">
              <CardContent className="p-4 sm:p-6">
                <CDPlayer
                  imageUrl={
                    nowPlaying.image_key
                      ? `/api/roon/image/${nowPlaying.image_key}`
                      : undefined
                  }
                  title={nowPlaying.title}
                  artist={nowPlaying.artist}
                  album={nowPlaying.album}
                  tracks={albumTracks}
                  currentTrackIndex={currentTrackIndex >= 0 ? currentTrackIndex : 0}
                  isPlaying={isPlaying}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Card View (Original) */}
        {viewMode === "card" && (
          <motion.div
            key={`${nowPlaying.title}-${nowPlaying.artist}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="max-w-2xl mx-auto px-4 sm:px-0"
          >
            <Card className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/80 border-zinc-700/50 backdrop-blur-lg overflow-hidden">
              <CardContent className="p-0">
                {/* Album Art Section */}
                <div className="relative aspect-square max-w-md mx-auto sm:max-w-lg">
                  {nowPlaying.image_key ? (
                    <motion.img
                      src={`/api/roon/image/${nowPlaying.image_key}`}
                      alt={nowPlaying.album}
                      className="w-full h-full object-cover"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                      <Volume2 className="w-24 h-24 text-zinc-400" />
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Play indicator with pulse animation */}
                  <div className="absolute top-4 right-4">
                    <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/30 rounded-full p-2 animate-pulse">
                      <Play className="w-4 h-4 text-green-400 fill-current" />
                    </div>
                  </div>

                  {/* Audio visualization bars */}
                  <div className="absolute bottom-4 left-4 flex items-end space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`bg-white/30 rounded-full w-1 animate-pulse`}
                        style={{
                          height: `${15 + i * 3}px`,
                          animationDuration: `${0.8 + i * 0.2}s`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Track Info Section */}
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-white leading-tight">
                      {nowPlaying.title}
                    </h2>
                    <p className="text-lg text-zinc-300">{nowPlaying.artist}</p>
                    <p className="text-zinc-400">{nowPlaying.album}</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-zinc-400">
                      <span>{formatTime(nowPlaying.seek_position)}</span>
                      <span>{formatTime(nowPlaying.length)}</span>
                    </div>

                    <div className="relative h-2 bg-zinc-700 rounded-full overflow-hidden">
                      <motion.div
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  {/* Additional Metadata */}
                  {(nowPlaying.genres?.length ||
                    nowPlaying.year ||
                    nowPlaying.bpm) && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {nowPlaying.genres && nowPlaying.genres.length > 0 && (
                        <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3 text-center">
                          <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">
                            Genre
                          </p>
                          <p className="text-sm text-zinc-200 truncate">
                            {nowPlaying.genres.slice(0, 2).join(", ")}
                          </p>
                        </div>
                      )}

                      {nowPlaying.year && (
                        <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3 text-center">
                          <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">
                            Year
                          </p>
                          <p className="text-sm text-zinc-200">
                            {nowPlaying.year}
                          </p>
                        </div>
                      )}

                      {nowPlaying.bpm && (
                        <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3 text-center">
                          <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">
                            BPM
                          </p>
                          <p className="text-sm text-zinc-200">
                            {nowPlaying.bpm}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Zone Info */}
                  <div className="flex justify-center">
                    <div className="bg-zinc-800/50 border border-zinc-700 rounded-full px-4 py-2 flex items-center space-x-2">
                      <Volume2 className="w-4 h-4 text-zinc-400" />
                      <span className="text-sm text-zinc-300">
                        {nowPlaying.zone_name}
                      </span>
                    </div>
                  </div>

                  {/* Live indicator */}
                  <div className="flex justify-center">
                    <div className="flex items-center space-x-2 text-sm text-zinc-400">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span>Live</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* AI Recommendations Section */}
        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-2xl mx-auto px-4 sm:px-0"
          >
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  Similar Tracks & Artists
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recommendations.map((rec, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg hover:bg-zinc-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
                          {rec.type === "similar_artist" ? (
                            <TrendingUp className="w-5 h-5 text-purple-400" />
                          ) : (
                            <Music className="w-5 h-5 text-purple-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-zinc-100">
                            {rec.name || rec.artist}
                          </p>
                          {rec.type === "similar_track" && rec.artist && (
                            <p className="text-sm text-zinc-400">
                              {rec.artist}
                            </p>
                          )}
                          <p className="text-sm text-zinc-400">{rec.reason}</p>
                        </div>
                        {rec.similarity && (
                          <Badge variant="secondary" className="text-xs">
                            {Math.round(rec.similarity * 100)}% match
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <p className="text-xs text-zinc-500">
                    Recommendations powered by AI analysis of your listening
                    patterns
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </main>
  );
}
