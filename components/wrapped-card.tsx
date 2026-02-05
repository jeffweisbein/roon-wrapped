"use client";

import React, { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Download, Share2, Check, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";

interface WrappedCardProps {
  children: React.ReactNode;
  gradient: string;
  title: string;
  filename: string;
  format?: "story" | "square";
}

export function WrappedCard({
  children,
  gradient,
  title,
  filename,
  format = "story",
}: WrappedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCheck, setShowCheck] = useState(false);

  const generateImage = useCallback(async () => {
    if (!cardRef.current || isGenerating) return null;
    setIsGenerating(true);

    try {
      const width = format === "story" ? 1080 : 1080;
      const scale = width / cardRef.current.offsetWidth;

      const dataUrl = await toPng(cardRef.current, {
        width: cardRef.current.offsetWidth,
        height: cardRef.current.offsetHeight,
        pixelRatio: scale,
        cacheBust: true,
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
        },
      });

      return dataUrl;
    } catch (err) {
      console.error("Error generating image:", err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [format, isGenerating]);

  const handleDownload = useCallback(async () => {
    const dataUrl = await generateImage();
    if (!dataUrl) return;

    const link = document.createElement("a");
    link.download = `${filename}-${format}.png`;
    link.href = dataUrl;
    link.click();

    setShowCheck(true);
    setTimeout(() => setShowCheck(false), 2000);
  }, [generateImage, filename, format]);

  const handleShare = useCallback(async () => {
    const dataUrl = await generateImage();
    if (!dataUrl) return;

    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `${filename}-${format}.png`, {
        type: "image/png",
      });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Roon Wrapped - ${title}`,
          files: [file],
        });
      } else {
        // Fallback: download
        handleDownload();
      }
    } catch (err) {
      // User cancelled share or share not supported
      if ((err as Error).name !== "AbortError") {
        handleDownload();
      }
    }
  }, [generateImage, filename, format, title, handleDownload]);

  const aspectClass =
    format === "story" ? "aspect-[9/16]" : "aspect-square";

  return (
    <div className="space-y-3">
      {/* The card that gets rendered to image */}
      <div
        ref={cardRef}
        className={`relative w-full ${aspectClass} ${gradient} rounded-2xl overflow-hidden flex flex-col items-center justify-center p-8`}
      >
        {children}
        {/* Branding watermark */}
        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2 opacity-60">
          <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
          </div>
          <span className="text-white/70 text-xs font-medium tracking-wider">
            ROON WRAPPED
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleDownload}
          disabled={isGenerating}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-sm text-white/80 transition-colors disabled:opacity-50"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : showCheck ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {showCheck ? "Saved!" : "Download"}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleShare}
          disabled={isGenerating}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-sm text-white/80 transition-colors disabled:opacity-50"
        >
          <Share2 className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
}

// Pre-built card templates
interface WrappedData {
  totalTracksPlayed: number;
  uniqueArtistsCount: number;
  uniqueAlbumsCount: number;
  uniqueTracksCount: number;
  totalListeningTimeSeconds: number;
  averageTracksPerDay: number;
  currentListeningStreakDays: number;
  peakListeningHour: number;
  topArtistsByPlays: Array<{
    name: string;
    count: number;
    image_key?: string;
  }>;
  topAlbumsByPlays: Array<{
    name: string;
    artist: string;
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

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatNumber(num: number): string {
  return num.toLocaleString();
}

export function ListeningTimeCard({
  data,
  format = "story",
}: {
  data: WrappedData;
  format?: "story" | "square";
}) {
  const hours = Math.floor(data.totalListeningTimeSeconds / 3600);
  const minutes = Math.floor((data.totalListeningTimeSeconds % 3600) / 60);

  return (
    <WrappedCard
      gradient="bg-gradient-to-br from-amber-950 via-orange-900 to-red-950"
      title="Listening Time"
      filename="roon-wrapped-listening-time"
      format={format}
    >
      <div className="text-center space-y-6">
        <p className="text-sm text-white/60 uppercase tracking-[0.2em] font-medium">
          Total Listening Time
        </p>
        <div className="space-y-2">
          {hours > 0 && (
            <div>
              <span className="text-6xl sm:text-7xl font-black text-white">
                {formatNumber(hours)}
              </span>
              <span className="text-2xl text-white/50 ml-2">hours</span>
            </div>
          )}
          <div>
            <span className="text-4xl sm:text-5xl font-black text-white">
              {formatNumber(minutes)}
            </span>
            <span className="text-xl text-white/50 ml-2">minutes</span>
          </div>
        </div>
        <div className="text-white/40 text-sm space-y-1">
          <p>{formatNumber(data.totalTracksPlayed)} songs played</p>
          <p>{Math.round(data.averageTracksPerDay)} songs per day</p>
        </div>
      </div>
    </WrappedCard>
  );
}

export function TopArtistCard({
  data,
  format = "story",
}: {
  data: WrappedData;
  format?: "story" | "square";
}) {
  const artist = data.topArtistsByPlays?.[0];
  if (!artist) return null;

  return (
    <WrappedCard
      gradient="bg-gradient-to-br from-emerald-950 via-green-900 to-teal-950"
      title="Top Artist"
      filename="roon-wrapped-top-artist"
      format={format}
    >
      <div className="text-center space-y-6">
        <p className="text-sm text-white/60 uppercase tracking-[0.2em] font-medium">
          #1 Artist
        </p>
        {artist.image_key ? (
          <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto rounded-full overflow-hidden border-4 border-white/20 shadow-2xl">
            <img
              src={`/api/roon/image/${artist.image_key}`}
              alt={artist.name}
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
          </div>
        ) : (
          <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto bg-white/10 rounded-full flex items-center justify-center border-4 border-white/20">
            <span className="text-4xl">🎤</span>
          </div>
        )}
        <h2 className="text-3xl sm:text-4xl font-black text-white">
          {artist.name}
        </h2>
        <p className="text-emerald-300/70 text-lg font-semibold">
          {formatNumber(artist.count)} plays
        </p>
      </div>
    </WrappedCard>
  );
}

export function TopAlbumCard({
  data,
  format = "story",
}: {
  data: WrappedData;
  format?: "story" | "square";
}) {
  const album = data.topAlbumsByPlays?.[0];
  if (!album) return null;

  return (
    <WrappedCard
      gradient="bg-gradient-to-br from-blue-950 via-indigo-900 to-violet-950"
      title="Top Album"
      filename="roon-wrapped-top-album"
      format={format}
    >
      <div className="text-center space-y-6">
        <p className="text-sm text-white/60 uppercase tracking-[0.2em] font-medium">
          #1 Album
        </p>
        {album.image_key ? (
          <div className="w-36 h-36 sm:w-44 sm:h-44 mx-auto rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl">
            <img
              src={`/api/roon/image/${album.image_key}`}
              alt={album.name}
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
          </div>
        ) : (
          <div className="w-36 h-36 sm:w-44 sm:h-44 mx-auto bg-white/10 rounded-2xl flex items-center justify-center border-2 border-white/10">
            <span className="text-4xl">💿</span>
          </div>
        )}
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {album.name}
          </h2>
          <p className="text-white/50 text-lg mt-1">{album.artist}</p>
        </div>
        <p className="text-blue-300/70 text-lg font-semibold">
          {formatNumber(album.count)} plays
        </p>
      </div>
    </WrappedCard>
  );
}

export function TopSongCard({
  data,
  format = "story",
}: {
  data: WrappedData;
  format?: "story" | "square";
}) {
  const track = data.topTracksByPlays?.[0];
  if (!track) return null;

  return (
    <WrappedCard
      gradient="bg-gradient-to-br from-pink-950 via-rose-900 to-red-950"
      title="Top Song"
      filename="roon-wrapped-top-song"
      format={format}
    >
      <div className="text-center space-y-6">
        <p className="text-sm text-white/60 uppercase tracking-[0.2em] font-medium">
          #1 Song
        </p>
        {track.image_key ? (
          <div className="w-36 h-36 sm:w-44 sm:h-44 mx-auto rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl">
            <img
              src={`/api/roon/image/${track.image_key}`}
              alt={track.title}
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
          </div>
        ) : (
          <div className="w-36 h-36 sm:w-44 sm:h-44 mx-auto bg-white/10 rounded-2xl flex items-center justify-center border-2 border-white/10">
            <span className="text-4xl">🎵</span>
          </div>
        )}
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {track.title}
          </h2>
          <p className="text-white/50 text-lg mt-1">{track.artist}</p>
        </div>
        <p className="text-pink-300/70 text-lg font-semibold">
          {formatNumber(track.count)} plays
        </p>
      </div>
    </WrappedCard>
  );
}

export function OverviewCard({
  data,
  format = "story",
}: {
  data: WrappedData;
  format?: "story" | "square";
}) {
  const topArtist = data.topArtistsByPlays?.[0];
  const topTrack = data.topTracksByPlays?.[0];

  return (
    <WrappedCard
      gradient="bg-gradient-to-br from-violet-950 via-purple-900 to-fuchsia-950"
      title="Overview"
      filename="roon-wrapped-overview"
      format={format}
    >
      <div className="text-center space-y-6 w-full px-4">
        <h2 className="text-3xl sm:text-4xl font-black text-white">
          My Roon Wrapped
        </h2>

        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-xs text-white/40 uppercase tracking-wider">
              Songs
            </p>
            <p className="text-2xl font-bold text-white mt-1">
              {formatNumber(data.totalTracksPlayed)}
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-xs text-white/40 uppercase tracking-wider">
              Time
            </p>
            <p className="text-2xl font-bold text-white mt-1">
              {formatDuration(data.totalListeningTimeSeconds)}
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-xs text-white/40 uppercase tracking-wider">
              Artists
            </p>
            <p className="text-2xl font-bold text-white mt-1">
              {formatNumber(data.uniqueArtistsCount)}
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-xs text-white/40 uppercase tracking-wider">
              Albums
            </p>
            <p className="text-2xl font-bold text-white mt-1">
              {formatNumber(data.uniqueAlbumsCount)}
            </p>
          </div>
        </div>

        {topArtist && (
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-left">
            <p className="text-xs text-white/40 uppercase tracking-wider">
              Top Artist
            </p>
            <p className="text-xl font-bold text-white mt-1">
              {topArtist.name}
            </p>
            <p className="text-sm text-white/50">
              {formatNumber(topArtist.count)} plays
            </p>
          </div>
        )}

        {topTrack && (
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-left">
            <p className="text-xs text-white/40 uppercase tracking-wider">
              Top Song
            </p>
            <p className="text-xl font-bold text-white mt-1">
              {topTrack.title}
            </p>
            <p className="text-sm text-white/50">{topTrack.artist}</p>
          </div>
        )}
      </div>
    </WrappedCard>
  );
}
