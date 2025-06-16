"use client";

import {
  Suspense,
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
import { formatDuration } from '@/src/lib/utils';
import { PageHeader } from '@/components/ui/page-header';

interface Stats {
  totalPlays: number;
  uniqueArtists: number;
  uniqueTracks: number;
  totalPlaytime: number;
}

function HomeContent() {
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
        <PageHeader 
          title="Roon Wrapped"
          subtitle="Your music listening statistics"
          rightContent={<TimePeriodSelector />}
        />
        <div className="text-center">Loading stats...</div>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-4">
      <PageHeader 
        title="Roon Wrapped"
        subtitle="Your music listening statistics"
        rightContent={<TimePeriodSelector />}
      />

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
              {formatDuration(stats.totalPlaytime)}
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <main className="container mx-auto p-4">
        <PageHeader 
          title="Roon Wrapped"
          subtitle="Your music listening statistics"
        />
        <div className="text-center">Loading...</div>
      </main>
    }>
      <HomeContent />
    </Suspense>
  );
} 