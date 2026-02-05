"use client";

import React, { useCallback, useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Music,
  Clock,
  Users,
  Disc3,
  Headphones,
  TrendingUp,
  Flame,
  Sparkles,
  Share2,
  Download,
} from "lucide-react";
import Link from "next/link";
import { formatDuration } from "@/src/lib/utils";
import { formatNumber } from "@/lib/utils";

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

function formatHour(hour: number): string {
  const ampm = hour >= 12 ? "PM" : "AM";
  const formattedHour = hour % 12 || 12;
  return `${formattedHour} ${ampm}`;
}

function getTimeOfDayLabel(hour: number): string {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function getPeakDay(dayOfWeekPlays: WrappedData["listeningPatterns"]["dayOfWeekPlays"]): string {
  const days = [
    { name: "Sunday", count: dayOfWeekPlays.sunday },
    { name: "Monday", count: dayOfWeekPlays.monday },
    { name: "Tuesday", count: dayOfWeekPlays.tuesday },
    { name: "Wednesday", count: dayOfWeekPlays.wednesday },
    { name: "Thursday", count: dayOfWeekPlays.thursday },
    { name: "Friday", count: dayOfWeekPlays.friday },
    { name: "Saturday", count: dayOfWeekPlays.saturday },
  ];
  return days.sort((a, b) => b.count - a.count)[0]?.name || "Unknown";
}

// Counter animation component
function AnimatedCounter({
  value,
  suffix = "",
  className = "",
}: {
  value: number;
  suffix?: string;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className={className}>
      {formatNumber(displayValue)}
      {suffix}
    </span>
  );
}

// Progress bar at top
function StoryProgress({
  total,
  current,
}: {
  total: number;
  current: number;
}) {
  return (
    <div className="absolute top-0 left-0 right-0 z-50 flex gap-1 px-4 pt-4">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-1 flex-1 rounded-full overflow-hidden bg-white/20"
        >
          <motion.div
            className="h-full bg-white rounded-full"
            initial={{ width: i < current ? "100%" : "0%" }}
            animate={{
              width: i < current ? "100%" : i === current ? "100%" : "0%",
            }}
            transition={
              i === current
                ? { duration: 8, ease: "linear" }
                : { duration: 0.3 }
            }
          />
        </div>
      ))}
    </div>
  );
}

// Slide wrapper with consistent styling
function Slide({
  children,
  gradient,
}: {
  children: React.ReactNode;
  gradient: string;
}) {
  return (
    <motion.div
      className={`absolute inset-0 flex flex-col items-center justify-center p-8 sm:p-12 ${gradient}`}
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

// Individual slide components
function WelcomeSlide() {
  return (
    <Slide gradient="bg-gradient-to-br from-violet-950 via-purple-900 to-fuchsia-950">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="text-center space-y-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-24 h-24 mx-auto bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/20"
        >
          <Headphones className="w-12 h-12 text-white" />
        </motion.div>
        <div className="space-y-3">
          <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tight">
            Your
          </h1>
          <h1 className="text-5xl sm:text-7xl font-black bg-gradient-to-r from-purple-300 via-pink-300 to-amber-300 bg-clip-text text-transparent tracking-tight">
            Roon Wrapped
          </h1>
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-lg text-white/60 max-w-sm mx-auto"
        >
          Let&apos;s take a look at your listening journey
        </motion.p>
      </motion.div>
    </Slide>
  );
}

function TotalListeningSlide({ data }: { data: WrappedData }) {
  const hours = Math.floor(data.totalListeningTimeSeconds / 3600);
  const minutes = Math.floor((data.totalListeningTimeSeconds % 3600) / 60);

  return (
    <Slide gradient="bg-gradient-to-br from-amber-950 via-orange-900 to-red-950">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="text-center space-y-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
        >
          <Clock className="w-16 h-16 mx-auto text-amber-400" />
        </motion.div>
        <p className="text-lg text-white/70 uppercase tracking-widest font-medium">
          You listened for
        </p>
        <div className="space-y-2">
          {hours > 0 && (
            <div>
              <span className="text-7xl sm:text-9xl font-black text-white">
                <AnimatedCounter value={hours} />
              </span>
              <span className="text-3xl sm:text-4xl text-white/60 ml-3 font-light">
                hours
              </span>
            </div>
          )}
          <div>
            <span className="text-5xl sm:text-6xl font-black text-white">
              <AnimatedCounter value={minutes} />
            </span>
            <span className="text-2xl sm:text-3xl text-white/60 ml-3 font-light">
              minutes
            </span>
          </div>
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-white/50 text-sm"
        >
          That&apos;s {formatDuration(data.totalListeningTimeSeconds)} of pure music
        </motion.p>
      </motion.div>
    </Slide>
  );
}

function TopArtistSlide({ data }: { data: WrappedData }) {
  const topArtist = data.topArtistsByPlays?.[0];
  if (!topArtist) return null;

  return (
    <Slide gradient="bg-gradient-to-br from-emerald-950 via-green-900 to-teal-950">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="text-center space-y-8 w-full max-w-lg"
      >
        <p className="text-lg text-white/70 uppercase tracking-widest font-medium">
          Your #1 Artist
        </p>
        {topArtist.image_key ? (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 150 }}
            className="relative w-40 h-40 sm:w-52 sm:h-52 mx-auto"
          >
            <img
              src={`/api/roon/image/${topArtist.image_key}`}
              alt={topArtist.name}
              className="w-full h-full object-cover rounded-full border-4 border-white/20 shadow-2xl"
            />
            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/30 to-transparent" />
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
            className="w-40 h-40 sm:w-52 sm:h-52 mx-auto bg-white/10 backdrop-blur rounded-full flex items-center justify-center border-4 border-white/20"
          >
            <Users className="w-20 h-20 text-white/50" />
          </motion.div>
        )}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-4xl sm:text-5xl font-black text-white"
        >
          {topArtist.name}
        </motion.h2>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex items-center justify-center gap-2 text-emerald-300/80"
        >
          <Music className="w-5 h-5" />
          <span className="text-xl font-semibold">
            <AnimatedCounter value={topArtist.count} /> plays
          </span>
        </motion.div>
      </motion.div>
    </Slide>
  );
}

function TopAlbumSlide({ data }: { data: WrappedData }) {
  const topAlbum = data.topAlbumsByPlays?.[0];
  if (!topAlbum) return null;

  return (
    <Slide gradient="bg-gradient-to-br from-blue-950 via-indigo-900 to-violet-950">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="text-center space-y-6 w-full max-w-lg"
      >
        <p className="text-lg text-white/70 uppercase tracking-widest font-medium">
          Your #1 Album
        </p>
        {topAlbum.image_key ? (
          <motion.div
            initial={{ scale: 0.5, opacity: 0, rotateY: 90 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 120 }}
            className="relative w-48 h-48 sm:w-60 sm:h-60 mx-auto"
          >
            <img
              src={`/api/roon/image/${topAlbum.image_key}`}
              alt={topAlbum.name}
              className="w-full h-full object-cover rounded-2xl shadow-2xl border-2 border-white/10"
            />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/40 to-transparent" />
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
            className="w-48 h-48 sm:w-60 sm:h-60 mx-auto bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center border-2 border-white/10"
          >
            <Disc3 className="w-20 h-20 text-white/50" />
          </motion.div>
        )}
        <div className="space-y-2">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-3xl sm:text-4xl font-black text-white"
          >
            {topAlbum.name}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-xl text-white/60"
          >
            {topAlbum.artist}
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="flex items-center justify-center gap-2 text-blue-300/80"
        >
          <Music className="w-5 h-5" />
          <span className="text-xl font-semibold">
            <AnimatedCounter value={topAlbum.count} /> plays
          </span>
        </motion.div>
      </motion.div>
    </Slide>
  );
}

function TopSongSlide({ data }: { data: WrappedData }) {
  const topTrack = data.topTracksByPlays?.[0];
  if (!topTrack) return null;

  return (
    <Slide gradient="bg-gradient-to-br from-pink-950 via-rose-900 to-red-950">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="text-center space-y-6 w-full max-w-lg"
      >
        <p className="text-lg text-white/70 uppercase tracking-widest font-medium">
          Your #1 Song
        </p>
        {topTrack.image_key ? (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 150 }}
            className="relative w-44 h-44 sm:w-56 sm:h-56 mx-auto"
          >
            <img
              src={`/api/roon/image/${topTrack.image_key}`}
              alt={topTrack.title}
              className="w-full h-full object-cover rounded-2xl shadow-2xl border-2 border-white/10"
            />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/40 to-transparent" />
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
            className="w-44 h-44 sm:w-56 sm:h-56 mx-auto bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center border-2 border-white/10"
          >
            <Music className="w-20 h-20 text-white/50" />
          </motion.div>
        )}
        <div className="space-y-2">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-3xl sm:text-4xl font-black text-white"
          >
            {topTrack.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-xl text-white/60"
          >
            {topTrack.artist}
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="flex items-center justify-center gap-2 text-pink-300/80"
        >
          <Music className="w-5 h-5" />
          <span className="text-xl font-semibold">
            <AnimatedCounter value={topTrack.count} /> plays
          </span>
        </motion.div>
      </motion.div>
    </Slide>
  );
}

function TopGenreSlide({ data }: { data: WrappedData }) {
  const topGenres = data.topGenresByPlays?.slice(0, 5) || [];
  if (topGenres.length === 0) return null;

  const maxCount = topGenres[0]?.count || 1;

  return (
    <Slide gradient="bg-gradient-to-br from-cyan-950 via-sky-900 to-blue-950">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="text-center space-y-8 w-full max-w-md"
      >
        <p className="text-lg text-white/70 uppercase tracking-widest font-medium">
          Your Top Genres
        </p>
        <div className="space-y-4">
          {topGenres.map((genre, i) => (
            <motion.div
              key={genre.name}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.15 }}
              className="flex items-center gap-4"
            >
              <span className="text-2xl font-bold text-white/40 w-8 text-right">
                {i + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg font-semibold text-white">
                    {genre.name}
                  </span>
                  <span className="text-sm text-white/50">
                    {formatNumber(genre.count)}
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(genre.count / maxCount) * 100}%`,
                    }}
                    transition={{ delay: 0.8 + i * 0.15, duration: 0.8 }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </Slide>
  );
}

function ListeningPatternsSlide({ data }: { data: WrappedData }) {
  const patterns = data.listeningPatterns;
  if (!patterns?.timeOfDay) return null;

  const timeOfDay = [
    { label: "Morning", value: patterns.timeOfDay.morningPlays, icon: "🌅" },
    {
      label: "Afternoon",
      value: patterns.timeOfDay.afternoonPlays,
      icon: "☀️",
    },
    { label: "Evening", value: patterns.timeOfDay.eveningPlays, icon: "🌆" },
    { label: "Night", value: patterns.timeOfDay.nightPlays, icon: "🌙" },
  ];
  const maxTime = Math.max(...timeOfDay.map((t) => t.value));

  return (
    <Slide gradient="bg-gradient-to-br from-purple-950 via-indigo-900 to-blue-950">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="text-center space-y-8 w-full max-w-md"
      >
        <p className="text-lg text-white/70 uppercase tracking-widest font-medium">
          When You Listen
        </p>
        <div className="flex items-end justify-center gap-6 h-48">
          {timeOfDay.map((period, i) => (
            <motion.div
              key={period.label}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.15 }}
              className="flex flex-col items-center gap-2 flex-1"
            >
              <span className="text-sm text-white/60 font-medium">
                {formatNumber(period.value)}
              </span>
              <div className="w-full max-w-[60px] bg-white/10 rounded-t-lg overflow-hidden relative"
                style={{ height: `${Math.max((period.value / (maxTime || 1)) * 120, 12)}px` }}
              >
                <motion.div
                  className="absolute bottom-0 w-full bg-gradient-to-t from-purple-500 to-indigo-400 rounded-t-lg"
                  initial={{ height: 0 }}
                  animate={{ height: "100%" }}
                  transition={{ delay: 0.8 + i * 0.15, duration: 0.8 }}
                />
              </div>
              <span className="text-2xl">{period.icon}</span>
              <span className="text-xs text-white/50">{period.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </Slide>
  );
}

function PeakHourSlide({ data }: { data: WrappedData }) {
  return (
    <Slide gradient="bg-gradient-to-br from-yellow-950 via-amber-900 to-orange-950">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="text-center space-y-8"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
          className="w-28 h-28 mx-auto bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20"
        >
          <TrendingUp className="w-14 h-14 text-amber-400" />
        </motion.div>
        <p className="text-lg text-white/70 uppercase tracking-widest font-medium">
          Your Peak Hour
        </p>
        <motion.h2
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6, type: "spring" }}
          className="text-7xl sm:text-8xl font-black text-white"
        >
          {formatHour(data.peakListeningHour)}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-white/50 text-lg"
        >
          You&apos;re a {getTimeOfDayLabel(data.peakListeningHour)} listener
        </motion.p>
        {data.listeningPatterns?.dayOfWeekPlays && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
            className="text-white/40 text-sm"
          >
            {getPeakDay(data.listeningPatterns.dayOfWeekPlays)} is your biggest listening day
          </motion.p>
        )}
      </motion.div>
    </Slide>
  );
}

function StreakSlide({ data }: { data: WrappedData }) {
  return (
    <Slide gradient="bg-gradient-to-br from-red-950 via-rose-900 to-pink-950">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="text-center space-y-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <Flame className="w-20 h-20 mx-auto text-orange-400" />
        </motion.div>
        <p className="text-lg text-white/70 uppercase tracking-widest font-medium">
          Listening Streak
        </p>
        <div>
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="text-8xl sm:text-9xl font-black text-white inline-block"
          >
            <AnimatedCounter value={data.currentListeningStreakDays} />
          </motion.span>
          <p className="text-3xl text-white/60 font-light mt-2">
            days in a row
          </p>
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-white/50"
        >
          Averaging {Math.round(data.averageTracksPerDay)} songs per day
        </motion.p>
      </motion.div>
    </Slide>
  );
}

function SummarySlide({ data }: { data: WrappedData }) {
  const stats = [
    {
      label: "Songs Played",
      value: formatNumber(data.totalTracksPlayed),
      gradient: "from-purple-400 to-pink-400",
    },
    {
      label: "Artists",
      value: formatNumber(data.uniqueArtistsCount),
      gradient: "from-emerald-400 to-teal-400",
    },
    {
      label: "Albums",
      value: formatNumber(data.uniqueAlbumsCount),
      gradient: "from-blue-400 to-indigo-400",
    },
    {
      label: "Listening Time",
      value: formatDuration(data.totalListeningTimeSeconds),
      gradient: "from-amber-400 to-orange-400",
    },
  ];

  return (
    <Slide gradient="bg-gradient-to-br from-slate-950 via-zinc-900 to-neutral-950">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="text-center space-y-8 w-full max-w-lg"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
        >
          <Sparkles className="w-16 h-16 mx-auto text-purple-400" />
        </motion.div>
        <h2 className="text-4xl sm:text-5xl font-black text-white">
          Your Year in Sound
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.15 }}
              className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 space-y-1"
            >
              <p
                className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}
              >
                {stat.value}
              </p>
              <p className="text-xs text-white/50 uppercase tracking-wider">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="pt-4"
        >
          <Link
            href="/wrapped"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white font-medium transition-colors"
          >
            View Full Stats
          </Link>
        </motion.div>
      </motion.div>
    </Slide>
  );
}

export default function WrappedStoryPage() {
  const [data, setData] = useState<WrappedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<number>(0);

  // Load data
  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch("/api/history/wrapped?period=all");
        if (!response.ok) throw new Error("Failed to load data");
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Build slide list dynamically based on available data
  const slides = React.useMemo(() => {
    if (!data) return [];
    const s: Array<{ id: string; component: React.ReactNode }> = [];

    s.push({ id: "welcome", component: <WelcomeSlide /> });

    if (data.totalListeningTimeSeconds > 0) {
      s.push({
        id: "listening-time",
        component: <TotalListeningSlide data={data} />,
      });
    }

    if (data.topArtistsByPlays?.length > 0) {
      s.push({
        id: "top-artist",
        component: <TopArtistSlide data={data} />,
      });
    }

    if (data.topAlbumsByPlays?.length > 0) {
      s.push({
        id: "top-album",
        component: <TopAlbumSlide data={data} />,
      });
    }

    if (data.topTracksByPlays?.length > 0) {
      s.push({
        id: "top-song",
        component: <TopSongSlide data={data} />,
      });
    }

    if (data.topGenresByPlays?.length > 0) {
      s.push({
        id: "top-genre",
        component: <TopGenreSlide data={data} />,
      });
    }

    if (data.listeningPatterns?.timeOfDay) {
      s.push({
        id: "patterns",
        component: <ListeningPatternsSlide data={data} />,
      });
    }

    s.push({
      id: "peak-hour",
      component: <PeakHourSlide data={data} />,
    });

    if (data.currentListeningStreakDays > 0) {
      s.push({
        id: "streak",
        component: <StreakSlide data={data} />,
      });
    }

    s.push({ id: "summary", component: <SummarySlide data={data} /> });

    return s;
  }, [data]);

  const totalSlides = slides.length;

  // Auto-advance timer
  useEffect(() => {
    if (isPaused || totalSlides === 0) return;

    timerRef.current = setTimeout(() => {
      if (currentSlide < totalSlides - 1) {
        setCurrentSlide((prev) => prev + 1);
      }
    }, 8000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentSlide, isPaused, totalSlides]);

  const goNext = useCallback(() => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide((prev) => prev + 1);
    }
  }, [currentSlide, totalSlides]);

  const goPrev = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  }, [currentSlide]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "Escape") {
        window.location.href = "/wrapped";
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev]);

  // Touch/swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStartRef.current - touchEnd;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
  };

  // Tap left/right halves to navigate
  const handleTap = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 3) {
      goPrev();
    } else if (x > (rect.width * 2) / 3) {
      goNext();
    } else {
      setIsPaused((p) => !p);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-4"
        >
          <div className="w-12 h-12 border-2 border-white/20 border-t-purple-400 rounded-full animate-spin mx-auto" />
          <p className="text-white/60">Loading your Wrapped...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <p className="text-red-400">{error || "No data available"}</p>
          <Link
            href="/wrapped"
            className="text-white/60 hover:text-white underline"
          >
            Back to Wrapped
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleTap}
    >
      {/* Progress bar */}
      <StoryProgress total={totalSlides} current={currentSlide} />

      {/* Close button */}
      <Link
        href="/wrapped"
        className="absolute top-6 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <X className="w-5 h-5 text-white" />
      </Link>

      {/* Pause indicator */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 bg-white/10 backdrop-blur rounded-full text-white/80 text-sm"
          >
            Paused
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slides */}
      <AnimatePresence mode="wait">
        <React.Fragment key={slides[currentSlide]?.id}>
          {slides[currentSlide]?.component}
        </React.Fragment>
      </AnimatePresence>

      {/* Navigation arrows (desktop) */}
      <div
        className="hidden sm:flex absolute inset-y-0 left-0 w-20 items-center justify-center"
        onClick={(e) => {
          e.stopPropagation();
          goPrev();
        }}
      >
        {currentSlide > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 0.5, x: 0 }}
            whileHover={{ opacity: 1, x: -2 }}
            className="cursor-pointer"
          >
            <ChevronLeft className="w-8 h-8 text-white" />
          </motion.div>
        )}
      </div>
      <div
        className="hidden sm:flex absolute inset-y-0 right-0 w-20 items-center justify-center"
        onClick={(e) => {
          e.stopPropagation();
          goNext();
        }}
      >
        {currentSlide < totalSlides - 1 && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 0.5, x: 0 }}
            whileHover={{ opacity: 1, x: 2 }}
            className="cursor-pointer"
          >
            <ChevronRight className="w-8 h-8 text-white" />
          </motion.div>
        )}
      </div>

      {/* Slide counter */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 text-white/30 text-xs">
        {currentSlide + 1} / {totalSlides}
      </div>
    </div>
  );
}
