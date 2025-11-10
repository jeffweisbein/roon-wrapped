"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Music } from "lucide-react";
import Image from "next/image";

interface RecentTrack {
  title: string;
  artist: string;
  album: string;
  timestamp: number;
  image_key?: string;
  zone_name?: string;
}

export function RecentActivityWidget() {
  const [recentTracks, setRecentTracks] = useState<RecentTrack[]>([]);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchRecentTracks = async () => {
      try {
        const response = await fetch("/api/history/recent?limit=20");
        const data = await response.json();

        if (Array.isArray(data)) {
          setRecentTracks(data);
        }
      } catch (error) {
        console.error("Error fetching recent activity:", error);
      }
    };

    fetchRecentTracks();
    // Refresh every 30 seconds
    const interval = setInterval(fetchRecentTracks, 30000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const handleImageError = (trackId: string) => {
    setImageErrors((prev) => ({ ...prev, [trackId]: true }));
  };

  return (
    <motion.div className="relative h-full bg-gradient-to-br from-zinc-900/50 to-zinc-900/30 border border-zinc-800/30 rounded-2xl backdrop-blur-md overflow-hidden">
      <div className="p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
          <Clock className="w-4 h-4 text-zinc-500" />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {recentTracks.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-zinc-500 text-sm">No recent activity</p>
            </div>
          ) : (
            <AnimatePresence>
              {recentTracks.map((track, index) => (
                <motion.div
                  key={`${track.title}-${track.timestamp}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/20 transition-colors"
                >
                  {/* Album art */}
                  <div className="relative w-12 h-12 rounded-md overflow-hidden bg-zinc-800 flex-shrink-0">
                    {track.image_key &&
                    !imageErrors[`${track.title}-${track.timestamp}`] ? (
                      <Image
                        src={`/api/roon/image/${track.image_key}`}
                        alt={track.album}
                        fill
                        className="object-cover"
                        onError={() =>
                          handleImageError(`${track.title}-${track.timestamp}`)
                        }
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
                        <Music className="w-6 h-6 text-zinc-600" />
                      </div>
                    )}
                  </div>

                  {/* Track info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {track.title}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">
                      {track.artist} {track.zone_name && `• ${track.zone_name}`}
                    </p>
                  </div>

                  {/* Time */}
                  <span className="text-xs text-zinc-600 flex-shrink-0">
                    {formatTime(track.timestamp)}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </motion.div>
  );
}
