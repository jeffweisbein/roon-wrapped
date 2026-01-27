"use client";

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
        {/* Subtle shadow under disc */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-56 h-8 bg-black/40 rounded-full blur-xl" />
        
        {/* Spinning CD */}
        <div
          className={`relative w-64 h-64 sm:w-72 sm:h-72 lg:w-80 lg:h-80 rounded-full overflow-hidden shadow-2xl ${
            isPlaying ? "animate-spin-slow" : ""
          }`}
          style={{
            boxShadow: "0 0 0 3px rgba(80, 80, 80, 0.5), 0 25px 50px -12px rgba(0, 0, 0, 0.8)",
            animation: isPlaying ? "spin 3s linear infinite" : "none",
          }}
        >
          {/* Album art fills the entire CD */}
          {imageUrl ? (
            <div className="relative w-full h-full">
              {/* Blurred background to fill gaps */}
              <img
                src={imageUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover scale-110 blur-md"
                aria-hidden="true"
              />
              {/* Main album art - contained without stretching */}
              <img
                src={imageUrl}
                alt={album}
                className="relative w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <Music className="w-20 h-20 text-white/50" />
            </div>
          )}
          
          {/* CD overlay effects */}
          {/* Rainbow/holographic ring effect */}
          <div 
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, 
                  rgba(255,255,255,0.15) 0%, 
                  transparent 30%
                ),
                radial-gradient(circle at 70% 70%, 
                  rgba(255,255,255,0.1) 0%, 
                  transparent 25%
                )
              `,
            }}
          />
          
          {/* Subtle circular grooves overlay */}
          <div 
            className="absolute inset-0 rounded-full pointer-events-none opacity-20"
            style={{
              background: `
                repeating-radial-gradient(
                  circle at center,
                  transparent 0px,
                  transparent 2px,
                  rgba(0,0,0,0.3) 2px,
                  rgba(0,0,0,0.3) 3px
                )
              `,
            }}
          />
          
          {/* Center hole with metallic ring */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Outer metallic ring */}
            <div 
              className="w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(145deg, #d4d4d4 0%, #737373 50%, #a3a3a3 100%)",
                boxShadow: "inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.3)",
              }}
            >
              {/* Inner dark ring */}
              <div 
                className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(145deg, #525252 0%, #262626 50%, #404040 100%)",
                }}
              >
                {/* Center hole */}
                <div 
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full"
                  style={{
                    background: "linear-gradient(145deg, #171717 0%, #0a0a0a 100%)",
                    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.8)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
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

        {/* Now Playing indicator */}
        <div className="mb-4 p-3 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Now Playing</p>
          <p className="text-white font-medium">{title}</p>
        </div>

        {/* Track List */}
        {tracks.length > 0 && (
          <div className="flex-1 overflow-y-auto max-h-48 lg:max-h-56 space-y-1 pr-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent mb-4">
            {tracks.map((track, index) => (
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
            ))}
          </div>
        )}

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-6 pt-4 border-t border-zinc-800">
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
