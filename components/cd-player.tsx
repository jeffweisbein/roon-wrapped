"use client";

import { motion } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, Music } from "lucide-react";

interface Track {
  title: string;
  duration?: number;
  isPlaying?: boolean;
}

interface CDPlayerProps {
  imageUrl?: string;
  title: string;
  artist: string;
  album: string;
  tracks?: Track[];
  currentTrackIndex?: number;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
}

export function CDPlayer({
  imageUrl,
  title,
  artist,
  album,
  tracks = [],
  currentTrackIndex = 0,
  isPlaying = true,
  onPlayPause,
  onPrevious,
  onNext,
}: CDPlayerProps) {
  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 lg:gap-12 p-6 lg:p-8 max-w-5xl mx-auto">
      {/* CD Disc */}
      <div className="relative flex-shrink-0">
        {/* CD Case shadow */}
        <div className="absolute -right-2 top-2 w-64 h-64 sm:w-72 sm:h-72 lg:w-80 lg:h-80 bg-zinc-900/50 rounded-lg blur-sm" />
        
        {/* Spinning CD */}
        <motion.div
          className="relative w-64 h-64 sm:w-72 sm:h-72 lg:w-80 lg:h-80 rounded-full shadow-2xl"
          style={{
            background: `
              radial-gradient(circle at 50% 50%, 
                transparent 15%, 
                rgba(40, 40, 40, 0.8) 15%, 
                rgba(40, 40, 40, 0.8) 16%, 
                rgba(20, 20, 20, 0.9) 16%, 
                rgba(20, 20, 20, 0.9) 100%
              )
            `,
          }}
          animate={{ rotate: isPlaying ? 360 : 0 }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {/* CD grooves/rings */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-zinc-700/20"
              style={{
                inset: `${18 + i * 6}%`,
              }}
            />
          ))}
          
          {/* Reflective shimmer */}
          <div 
            className="absolute inset-0 rounded-full opacity-30"
            style={{
              background: `
                linear-gradient(
                  135deg,
                  transparent 0%,
                  rgba(255,255,255,0.1) 25%,
                  transparent 50%,
                  rgba(255,255,255,0.05) 75%,
                  transparent 100%
                )
              `,
            }}
          />
          
          {/* Center label with album art */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[35%] h-[35%] rounded-full overflow-hidden border-4 border-zinc-700 shadow-inner bg-zinc-800">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={album}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  <Music className="w-8 h-8 text-white/80" />
                </div>
              )}
            </div>
          </div>
          
          {/* Center spindle hole */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-3 h-3 rounded-full bg-zinc-900 border-2 border-zinc-600" />
          </div>
        </motion.div>
      </div>

      {/* Track List & Info */}
      <div className="flex flex-col flex-1 min-w-0 max-w-md w-full">
        {/* Album Info Header */}
        <div className="mb-4">
          <div className="flex items-start gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-white leading-tight truncate">
              {album}
            </h2>
            {isPlaying && (
              <span className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-green-500 animate-pulse" />
            )}
          </div>
          <p className="text-zinc-400 text-sm mt-1">{artist}</p>
        </div>

        {/* Track List */}
        <div className="flex-1 overflow-y-auto max-h-64 lg:max-h-80 space-y-1 pr-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          {tracks.length > 0 ? (
            tracks.map((track, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  index === currentTrackIndex
                    ? "bg-purple-500/20 border border-purple-500/30"
                    : "hover:bg-zinc-800/50"
                }`}
              >
                <span className={`text-sm w-6 text-right ${
                  index === currentTrackIndex ? "text-purple-400" : "text-zinc-500"
                }`}>
                  {index + 1}.
                </span>
                <span className={`flex-1 text-sm truncate ${
                  index === currentTrackIndex ? "text-white font-medium" : "text-zinc-300"
                }`}>
                  {track.title}
                </span>
                {index === currentTrackIndex && isPlaying && (
                  <div className="flex items-center gap-0.5">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="w-0.5 bg-purple-400 rounded-full animate-pulse"
                        style={{
                          height: `${8 + i * 4}px`,
                          animationDelay: `${i * 0.15}s`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-zinc-500">
              <p className="text-sm">Now Playing</p>
              <p className="text-lg text-white mt-2">{title}</p>
            </div>
          )}
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-zinc-800">
          <button
            onClick={onPrevious}
            className="p-2 text-zinc-400 hover:text-white transition-colors"
            aria-label="Previous track"
          >
            <SkipBack className="w-6 h-6" />
          </button>
          
          <button
            onClick={onPlayPause}
            className="p-4 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-white" />
            ) : (
              <Play className="w-6 h-6 text-white ml-0.5" />
            )}
          </button>
          
          <button
            onClick={onNext}
            className="p-2 text-zinc-400 hover:text-white transition-colors"
            aria-label="Next track"
          >
            <SkipForward className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
