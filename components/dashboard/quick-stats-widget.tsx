'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, Users, Disc3, Headphones } from 'lucide-react';
import Link from 'next/link';

interface QuickStats {
  totalPlays: number;
  uniqueArtists: number;
  uniqueTracks: number;
  totalPlaytime: number;
  todayPlays: number;
  weeklyGrowth: number;
}

export function QuickStatsWidget() {
  const [stats, setStats] = useState<QuickStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [allRes, todayRes, weekRes] = await Promise.all([
          fetch('/api/stats?period=all'),
          fetch('/api/stats?period=1'),
          fetch('/api/stats?period=7')
        ]);

        console.log('Response status:', { 
          all: allRes.status, 
          today: todayRes.status, 
          week: weekRes.status 
        });

        if (!allRes.ok || !todayRes.ok || !weekRes.ok) {
          throw new Error('Failed to fetch stats');
        }

        const allData = await allRes.json();
        const todayData = await todayRes.json();
        const weekData = await weekRes.json();

        console.log('Quick Stats Data:', { allData, todayData, weekData });

        // Calculate weekly growth
        const lastWeekAverage = weekData.totalPlays ? weekData.totalPlays / 7 : 0;
        const growth = todayData.totalPlays > 0 && lastWeekAverage > 0
          ? Math.round(((todayData.totalPlays - lastWeekAverage) / lastWeekAverage) * 100)
          : 0;

        setStats({
          totalPlays: allData.totalPlays || 0,
          uniqueArtists: allData.uniqueArtists || 0,
          uniqueTracks: allData.uniqueTracks || 0,
          totalPlaytime: allData.totalPlaytime || 0,
          todayPlays: todayData.totalPlays || 0,
          weeklyGrowth: growth
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Set default values on error
        setStats({
          totalPlays: 0,
          uniqueArtists: 0,
          uniqueTracks: 0,
          totalPlaytime: 0,
          todayPlays: 0,
          weeklyGrowth: 0
        });
      }
    };

    fetchStats();
  }, []);

  const formatTime = (seconds: number) => {
    if (!seconds || seconds === 0) return '0h';
    const hours = Math.floor(seconds / 3600);
    return `${hours}h`;
  };

  const statCards = [
    {
      label: 'Today',
      value: stats?.todayPlays ?? 0,
      icon: Headphones,
      color: 'from-blue-500 to-cyan-500',
      suffix: 'plays'
    },
    {
      label: 'Total Time',
      value: formatTime(stats?.totalPlaytime ?? 0),
      icon: Clock,
      color: 'from-purple-500 to-pink-500',
    },
    {
      label: 'Artists',
      value: stats?.uniqueArtists ?? 0,
      icon: Users,
      color: 'from-orange-500 to-red-500',
    },
    {
      label: 'Tracks',
      value: stats?.uniqueTracks ?? 0,
      icon: Disc3,
      color: 'from-green-500 to-emerald-500',
    }
  ];

  return (
    <Link href="/wrapped" className="block group h-full">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative h-full bg-gradient-to-br from-zinc-900/50 to-zinc-900/30 border border-zinc-800/30 rounded-2xl backdrop-blur-md overflow-hidden p-6"
      >
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Quick Stats</h3>
            {stats && stats.weeklyGrowth !== 0 && (
              <div className={`flex items-center gap-1 text-sm ${
                stats.weeklyGrowth > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                <TrendingUp className="w-4 h-4" />
                <span>{stats.weeklyGrowth > 0 ? '+' : ''}{stats.weeklyGrowth}%</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="p-4 bg-zinc-800/20 rounded-xl border border-zinc-800/20">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${stat.color} p-2 mb-3`}>
                    <stat.icon className="w-full h-full text-white" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-white">
                      {stat.value}
                      {stat.suffix && <span className="text-sm font-normal text-zinc-400 ml-1">{stat.suffix}</span>}
                    </p>
                    <p className="text-xs text-zinc-500">{stat.label}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}