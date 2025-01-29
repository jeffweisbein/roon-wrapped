"use client";

import {
  useEffect,
  useState,
} from 'react';

import { useSearchParams } from 'next/navigation';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TimePeriodSelector } from '@/components/ui/time-period-selector';

interface Stats {
  totalPlays: number;
  uniqueArtists: number;
  uniqueTracks: number;
  totalPlaytime: number;
}

export default function Home() {
  const searchParams = useSearchParams();
  const period = searchParams.get("period") || "all";
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch(`/api/stats?period=${period}`);
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    }

    fetchStats();
  }, [period]);

  if (!stats) {
    return (
      <main className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Roon Wrapped</h1>
          <TimePeriodSelector />
        </div>
        <div className="text-center">Loading stats...</div>
      </main>
    );
  }

  // Convert seconds to hours and minutes
  const hours = Math.floor(stats.totalPlaytime / 3600);
  const minutes = Math.floor((stats.totalPlaytime % 3600) / 60);

  return (
    <main className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Roon Wrapped</h1>
        <TimePeriodSelector />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Plays</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalPlays}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unique Artists</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.uniqueArtists}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unique Tracks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.uniqueTracks}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Listening Time</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {hours}h {minutes}m
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
} 