"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Moon, Sun, Zap } from "lucide-react";
import Link from "next/link";

interface ListeningPattern {
  peakHour: number;
  peakDay: string;
  nightOwl: boolean;
  earlyBird: boolean;
  consistency: number;
}

export function ListeningInsightsWidget() {
  const [pattern, setPattern] = useState<ListeningPattern | null>(null);

  useEffect(() => {
    fetch("/api/history/wrapped?period=30")
      .then((res) => res.json())
      .then((data) => {
        if (data.listeningPatterns && data.peakListeningHour !== undefined) {
          // Determine peak day from dayOfWeekPlays
          let peakDay = "Friday";
          let maxPlays = 0;

          if (data.listeningPatterns.dayOfWeekPlays) {
            Object.entries(data.listeningPatterns.dayOfWeekPlays).forEach(
              ([day, plays]) => {
                if ((plays as number) > maxPlays) {
                  maxPlays = plays as number;
                  peakDay = day.charAt(0).toUpperCase() + day.slice(1);
                }
              },
            );
          }

          // Calculate consistency (simplified - ratio of days with activity)
          const totalDays = 30;
          const activeDays =
            data.averageTracksPerDay > 0
              ? Math.min(
                  totalDays,
                  data.totalTracksPlayed /
                    Math.max(1, data.averageTracksPerDay),
                )
              : 0;
          const consistency = Math.round((activeDays / totalDays) * 100);

          setPattern({
            peakHour: data.peakListeningHour,
            peakDay: peakDay,
            nightOwl:
              data.peakListeningHour >= 22 || data.peakListeningHour <= 4,
            earlyBird:
              data.peakListeningHour >= 5 && data.peakListeningHour <= 9,
            consistency: consistency,
          });
        }
      })
      .catch((error) => {
        console.error("Error fetching listening patterns:", error);
        // Set default values
        setPattern({
          peakHour: 20,
          peakDay: "Friday",
          nightOwl: true,
          earlyBird: false,
          consistency: 85,
        });
      });
  }, []);

  const insights = [
    {
      icon: pattern?.nightOwl ? Moon : Sun,
      title: pattern?.nightOwl ? "Night Owl" : "Early Bird",
      description: `Most active ${pattern?.nightOwl ? "after 10 PM" : "before 10 AM"}`,
      color: pattern?.nightOwl
        ? "from-indigo-500 to-purple-500"
        : "from-yellow-400 to-orange-400",
    },
    {
      icon: Zap,
      title: `Peak: ${pattern?.peakDay || "Loading..."}`,
      description: `You listen most on ${pattern?.peakDay}s`,
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Sparkles,
      title: `${pattern?.consistency || 0}% Consistent`,
      description: "Your daily listening routine",
      color: "from-green-500 to-emerald-500",
    },
  ];

  return (
    <Link href="/wrapped" className="block group h-full">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative h-full bg-gradient-to-br from-zinc-900/50 to-zinc-900/30 border border-zinc-800/30 rounded-2xl backdrop-blur-md overflow-hidden p-6"
      >
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative h-full flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-4">
            Your Listening DNA
          </h3>

          <div className="flex-1 space-y-4">
            {insights.map((insight, index) => (
              <motion.div
                key={insight.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3"
              >
                <div
                  className={`w-10 h-10 rounded-lg bg-gradient-to-r ${insight.color} p-2 flex-shrink-0`}
                >
                  <insight.icon className="w-full h-full text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    {insight.title}
                  </p>
                  <p className="text-xs text-zinc-500">{insight.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-800/30">
            <p className="text-xs text-zinc-500 text-center group-hover:text-zinc-400 transition-colors">
              Discover more insights →
            </p>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
