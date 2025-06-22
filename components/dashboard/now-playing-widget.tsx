'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Music, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface NowPlayingData {
  title: string;
  artist: string;
  album: string;
  length: number;
  image_key?: string;
  seek_position: number;
  zone_name: string;
  state: string;
}

export function NowPlayingWidget() {
  const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchNowPlaying = async () => {
      try {
        const response = await fetch('/api/roon/now-playing');
        if (response.ok) {
          const data = await response.json();
          setNowPlaying(data);
          setImageError(false);
          setError(null);
          setRetryCount(0);
        } else if (response.status === 404) {
          // No active playback
          setNowPlaying(null);
          setError(null);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (error) {
        console.error('Error fetching now playing:', error);
        setError('Failed to connect to Roon');
        setRetryCount(prev => prev + 1);
      } finally {
        setLoading(false);
      }
    };

    fetchNowPlaying();
    // Exponential backoff for retries
    const baseInterval = error && retryCount > 3 ? 10000 : 2000;
    const interval = setInterval(fetchNowPlaying, baseInterval);
    return () => clearInterval(interval);
  }, [error, retryCount]);

  const progressPercentage = nowPlaying 
    ? Math.min((nowPlaying.seek_position / nowPlaying.length) * 100, 100)
    : 0;

  return (
    <Link href="/now-playing" className="block group">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative h-full bg-gradient-to-br from-zinc-900/50 to-zinc-900/30 border border-zinc-800/30 rounded-2xl backdrop-blur-md overflow-hidden"
      >
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative p-6 h-full flex flex-col">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center h-full"
              >
                <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
              </motion.div>
            ) : error ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center h-full"
              >
                <div className="text-center">
                  <AlertCircle className="w-10 h-10 text-red-500/70 mx-auto mb-3" />
                  <p className="text-zinc-400 text-sm">{error}</p>
                  <p className="text-zinc-500 text-xs mt-1">Retrying...</p>
                </div>
              </motion.div>
            ) : nowPlaying ? (
              <motion.div
                key={nowPlaying.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex gap-4 flex-1"
              >
                {/* Album Art */}
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">
                  {nowPlaying.image_key && !imageError ? (
                    <Image
                      src={`/api/roon/image/${nowPlaying.image_key}`}
                      alt={nowPlaying.album}
                      fill
                      className="object-cover rounded-lg shadow-2xl"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                      <Music className="w-8 h-8 text-zinc-400" />
                    </div>
                  )}
                  
                  {/* Play/Pause indicator */}
                  <div className="absolute bottom-2 right-2 w-6 h-6 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center">
                    {nowPlaying.state === 'playing' ? (
                      <Play className="w-3 h-3 text-white fill-white" />
                    ) : (
                      <Pause className="w-3 h-3 text-white" />
                    )}
                  </div>
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-white truncate text-lg">
                      {nowPlaying.title}
                    </h3>
                    <p className="text-zinc-400 text-sm truncate">
                      {nowPlaying.artist}
                    </p>
                    <p className="text-zinc-500 text-xs truncate">
                      {nowPlaying.album}
                    </p>
                  </div>
                  
                  {/* Zone name */}
                  <div className="mt-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs text-zinc-400">{nowPlaying.zone_name}</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center h-full"
              >
                <div className="text-center">
                  <Music className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                  <p className="text-zinc-400 text-sm">Nothing playing</p>
                  <p className="text-zinc-500 text-xs mt-1">Start playing music in Roon</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Progress bar */}
          {nowPlaying && (
            <div className="mt-4">
              <div className="h-1 bg-zinc-800/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.5, ease: "linear" }}
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}