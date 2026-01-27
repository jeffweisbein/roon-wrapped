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
    <div className="flex flex-col items-center gap-6 p-4 max-w-4xl mx-auto">
      {/* 90s Stereo/Boombox Body */}
      <div
        className="relative w-full max-w-2xl rounded-2xl p-1"
        style={{
          background: "linear-gradient(180deg, #d4d4d4 0%, #a3a3a3 50%, #787878 100%)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 2px 0 rgba(255,255,255,0.5), inset 0 -2px 0 rgba(0,0,0,0.3)",
        }}
      >
        {/* Inner body */}
        <div
          className="rounded-xl p-4"
          style={{
            background: "linear-gradient(180deg, #c0c0c0 0%, #9a9a9a 30%, #808080 100%)",
          }}
        >
          {/* Top Section - Brand & LCD Display */}
          <div className="flex items-center justify-between mb-4 px-2">
            {/* Brand Logo */}
            <div className="flex items-center gap-2">
              <div
                className="px-3 py-1 rounded text-xs font-bold tracking-wider"
                style={{
                  background: "linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)",
                  color: "#c0c0c0",
                  textShadow: "0 1px 0 rgba(255,255,255,0.1)",
                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.5)",
                }}
              >
                ROON
              </div>
              <span className="text-[10px] text-zinc-600 font-medium">DIGITAL AUDIO</span>
            </div>

            {/* LCD Display */}
            <div
              className="px-4 py-2 rounded min-w-[200px]"
              style={{
                background: "linear-gradient(180deg, #1a2f1a 0%, #0d1f0d 100%)",
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.2)",
              }}
            >
              <div
                className="text-xs font-mono truncate"
                style={{
                  color: "#39ff14",
                  textShadow: "0 0 8px #39ff14, 0 0 2px #39ff14",
                }}
              >
                {isPlaying ? "▶ " : "❚❚ "}{title}
              </div>
              <div
                className="text-[10px] font-mono text-green-400/70 truncate"
                style={{
                  textShadow: "0 0 4px rgba(57, 255, 20, 0.5)",
                }}
              >
                {artist}
              </div>
            </div>
          </div>

          {/* Main Section - Speakers + CD Window */}
          <div className="flex items-center gap-3">
            {/* Left Speaker */}
            <div
              className="hidden sm:flex w-24 h-48 rounded-lg items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 50%, #0f0f0f 100%)",
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.1)",
              }}
            >
              {/* Speaker Grille */}
              <div
                className="w-20 h-44 rounded-md"
                style={{
                  background: `
                    radial-gradient(circle at center, #333 1px, transparent 1px)
                  `,
                  backgroundSize: "6px 6px",
                  boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)",
                }}
              >
                {/* Speaker Cone */}
                <div className="w-full h-full flex items-center justify-center">
                  <div
                    className="w-16 h-16 rounded-full"
                    style={{
                      background: "radial-gradient(circle at 40% 40%, #404040 0%, #1a1a1a 60%, #0a0a0a 100%)",
                      boxShadow: "inset 0 2px 8px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.1)",
                    }}
                  >
                    <div
                      className="w-full h-full rounded-full flex items-center justify-center"
                      style={{
                        background: "repeating-radial-gradient(circle at center, transparent 0px, transparent 3px, rgba(0,0,0,0.3) 4px, transparent 5px)",
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{
                          background: "radial-gradient(circle at 40% 40%, #606060 0%, #303030 100%)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CD Window/Tray */}
            <div className="flex-1 flex justify-center">
              <div
                className="relative rounded-full p-2"
                style={{
                  background: "linear-gradient(145deg, #404040 0%, #1a1a1a 50%, #0a0a0a 100%)",
                  boxShadow: "inset 0 4px 8px rgba(0,0,0,0.8), 0 2px 0 rgba(255,255,255,0.1)",
                }}
              >
                {/* CD Window Glass Effect */}
                <div
                  className="relative rounded-full p-1"
                  style={{
                    background: "linear-gradient(180deg, rgba(100,100,100,0.3) 0%, rgba(0,0,0,0.8) 100%)",
                  }}
                >
                  {/* Spinning CD */}
                  <div
                    className="relative w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 rounded-full"
                    style={{
                      boxShadow: "0 0 20px rgba(0,0,0,0.5)",
                      animation: isPlaying ? "spin 3s linear infinite" : "none",
                      clipPath: "circle(50%)",
                    }}
                  >
                    {/* Album art */}
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={album}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                        <Music className="w-16 h-16 text-white/50" />
                      </div>
                    )}

                    {/* CD Shine overlay */}
                    <div
                      className="absolute inset-0 rounded-full pointer-events-none"
                      style={{
                        background: `
                          radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 40%),
                          radial-gradient(circle at 70% 70%, rgba(255,255,255,0.1) 0%, transparent 30%)
                        `,
                      }}
                    />

                    {/* CD Grooves */}
                    <div
                      className="absolute inset-0 rounded-full pointer-events-none opacity-30"
                      style={{
                        background: `repeating-radial-gradient(circle at center, transparent 0px, transparent 2px, rgba(0,0,0,0.4) 2px, rgba(0,0,0,0.4) 3px)`,
                      }}
                    />

                    {/* Center hole */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center"
                        style={{
                          background: "linear-gradient(145deg, #c0c0c0 0%, #606060 50%, #808080 100%)",
                          boxShadow: "inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.5)",
                        }}
                      >
                        <div
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center"
                          style={{
                            background: "linear-gradient(145deg, #404040 0%, #1a1a1a 100%)",
                          }}
                        >
                          <div
                            className="w-3 h-3 sm:w-4 sm:h-4 rounded-full"
                            style={{
                              background: "linear-gradient(145deg, #0a0a0a 0%, #000 100%)",
                              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.8)",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CD Motor spindle reflection */}
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none"
                  style={{
                    background: "radial-gradient(circle at 30% 30%, #808080 0%, #404040 100%)",
                  }}
                />
              </div>
            </div>

            {/* Right Speaker */}
            <div
              className="hidden sm:flex w-24 h-48 rounded-lg items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 50%, #0f0f0f 100%)",
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.1)",
              }}
            >
              {/* Speaker Grille */}
              <div
                className="w-20 h-44 rounded-md"
                style={{
                  background: `radial-gradient(circle at center, #333 1px, transparent 1px)`,
                  backgroundSize: "6px 6px",
                  boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)",
                }}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <div
                    className="w-16 h-16 rounded-full"
                    style={{
                      background: "radial-gradient(circle at 40% 40%, #404040 0%, #1a1a1a 60%, #0a0a0a 100%)",
                      boxShadow: "inset 0 2px 8px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.1)",
                    }}
                  >
                    <div
                      className="w-full h-full rounded-full flex items-center justify-center"
                      style={{
                        background: "repeating-radial-gradient(circle at center, transparent 0px, transparent 3px, rgba(0,0,0,0.3) 4px, transparent 5px)",
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{
                          background: "radial-gradient(circle at 40% 40%, #606060 0%, #303030 100%)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Control Panel */}
          <div className="mt-4 flex items-center justify-center gap-2">
            {/* Previous Button */}
            <button
              onClick={onPrevious}
              className="relative px-4 py-2 rounded transition-all active:translate-y-0.5"
              style={{
                background: "linear-gradient(180deg, #505050 0%, #303030 50%, #202020 100%)",
                boxShadow: "0 3px 0 #101010, 0 4px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
              aria-label="Previous track"
            >
              <SkipBack className="w-4 h-4 text-zinc-300" />
            </button>

            {/* Play/Pause Button */}
            <button
              onClick={onPlayPause}
              className="relative px-6 py-3 rounded transition-all active:translate-y-0.5"
              style={{
                background: isPlaying
                  ? "linear-gradient(180deg, #2d5a2d 0%, #1a3d1a 50%, #0f2d0f 100%)"
                  : "linear-gradient(180deg, #505050 0%, #303030 50%, #202020 100%)",
                boxShadow: "0 3px 0 #101010, 0 4px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-green-400" />
              ) : (
                <Play className="w-5 h-5 text-zinc-300 ml-0.5" />
              )}
            </button>

            {/* Next Button */}
            <button
              onClick={onNext}
              className="relative px-4 py-2 rounded transition-all active:translate-y-0.5"
              style={{
                background: "linear-gradient(180deg, #505050 0%, #303030 50%, #202020 100%)",
                boxShadow: "0 3px 0 #101010, 0 4px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
              aria-label="Next track"
            >
              <SkipForward className="w-4 h-4 text-zinc-300" />
            </button>

            {/* Volume Indicator LEDs */}
            <div className="ml-4 flex items-end gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-sm"
                  style={{
                    height: `${8 + i * 3}px`,
                    background: isPlaying && i < 4
                      ? i < 2 ? "#39ff14" : i < 3 ? "#ffff00" : "#ff4444"
                      : "#1a1a1a",
                    boxShadow: isPlaying && i < 4
                      ? `0 0 4px ${i < 2 ? "#39ff14" : i < 3 ? "#ffff00" : "#ff4444"}`
                      : "inset 0 1px 2px rgba(0,0,0,0.5)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Bottom Trim */}
          <div className="mt-4 flex items-center justify-between px-2">
            <div className="flex gap-4">
              <div className="w-2 h-2 rounded-full bg-red-500" style={{ boxShadow: isPlaying ? "0 0 6px #ef4444" : "none" }} />
              <span className="text-[9px] text-zinc-600 uppercase tracking-wider">Compact Disc</span>
            </div>
            <span className="text-[9px] text-zinc-600">STEREO</span>
          </div>
        </div>
      </div>

      {/* Track List Below (like CD sleeve) */}
      {tracks.length > 0 && (
        <div
          className="w-full max-w-2xl rounded-lg p-4"
          style={{
            background: "linear-gradient(180deg, #f5f5f5 0%, #e0e0e0 100%)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.8)",
          }}
        >
          <div className="flex items-center gap-3 mb-3 pb-2 border-b border-zinc-300">
            <h3 className="text-sm font-bold text-zinc-800">{album}</h3>
            <span className="text-xs text-zinc-500">•</span>
            <span className="text-xs text-zinc-600">{artist}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-40 overflow-y-auto">
            {tracks.map((track, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 px-2 py-1 rounded text-sm ${
                  index === currentTrackIndex
                    ? "bg-zinc-300/50 font-medium"
                    : ""
                }`}
              >
                <span className="text-zinc-500 w-5 text-right text-xs">{index + 1}.</span>
                <span className={`truncate ${index === currentTrackIndex ? "text-zinc-900" : "text-zinc-700"}`}>
                  {track.title}
                </span>
                {index === currentTrackIndex && isPlaying && (
                  <span className="text-green-600 text-xs">♪</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
