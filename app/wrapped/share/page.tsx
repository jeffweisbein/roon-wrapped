"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RectangleHorizontal, Smartphone } from "lucide-react";
import Link from "next/link";
import {
  ListeningTimeCard,
  TopArtistCard,
  TopAlbumCard,
  TopSongCard,
  OverviewCard,
} from "@/components/wrapped-card";

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

export default function SharePage() {
  const [data, setData] = useState<WrappedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [format, setFormat] = useState<"story" | "square">("story");

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch("/api/history/wrapped?period=all");
        if (!response.ok) throw new Error("Failed to load data");
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-purple-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <p className="text-white/60">No data available</p>
          <Link href="/wrapped" className="text-purple-400 hover:underline">
            Back to Wrapped
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/wrapped"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/15 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Share Cards</h1>
              <p className="text-sm text-white/50">
                Download or share your stats as images
              </p>
            </div>
          </div>

          {/* Format toggle */}
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
            <button
              onClick={() => setFormat("story")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                format === "story"
                  ? "bg-purple-500/20 text-purple-300"
                  : "text-white/50 hover:text-white"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Story
            </button>
            <button
              onClick={() => setFormat("square")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                format === "square"
                  ? "bg-purple-500/20 text-purple-300"
                  : "text-white/50 hover:text-white"
              }`}
            >
              <RectangleHorizontal className="w-4 h-4" />
              Square
            </button>
          </div>
        </div>

        {/* Cards Grid */}
        <motion.div
          className={`grid gap-6 ${
            format === "story"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          }`}
          layout
        >
          <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <OverviewCard data={data} format={format} />
          </motion.div>

          <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <ListeningTimeCard data={data} format={format} />
          </motion.div>

          {data.topArtistsByPlays?.length > 0 && (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <TopArtistCard data={data} format={format} />
            </motion.div>
          )}

          {data.topAlbumsByPlays?.length > 0 && (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <TopAlbumCard data={data} format={format} />
            </motion.div>
          )}

          {data.topTracksByPlays?.length > 0 && (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <TopSongCard data={data} format={format} />
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
