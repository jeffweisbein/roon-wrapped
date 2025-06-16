"use client";

import {
  Suspense,
  useEffect,
  useState,
} from 'react';

import { useSearchParams } from 'next/navigation';

import { PageHeader } from '@/components/ui/page-header';
import { NowPlayingWidget } from '@/components/dashboard/now-playing-widget';
import { QuickStatsWidget } from '@/components/dashboard/quick-stats-widget';
import { TopArtistsWidget } from '@/components/dashboard/top-artists-widget';
import { ListeningInsightsWidget } from '@/components/dashboard/listening-insights-widget';
import { RecentActivityWidget } from '@/components/dashboard/recent-activity-widget';

interface Stats {
  totalPlays: number;
  uniqueArtists: number;
  uniqueTracks: number;
  totalPlaytime: number;
}

function HomeContent() {
  return (
    <main className="container mx-auto p-4 max-w-7xl">
      <PageHeader 
        title="Dashboard"
        subtitle="Your music command center"
      />

      {/* Main grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Now Playing - spans 5 columns on large screens */}
        <div className="lg:col-span-5 lg:row-span-2">
          <NowPlayingWidget />
        </div>

        {/* Quick Stats - spans 4 columns */}
        <div className="lg:col-span-4">
          <QuickStatsWidget />
        </div>

        {/* Top Artists - spans 3 columns */}
        <div className="lg:col-span-3 lg:row-span-2">
          <TopArtistsWidget />
        </div>

        {/* Listening Insights - spans 4 columns */}
        <div className="lg:col-span-4">
          <ListeningInsightsWidget />
        </div>

        {/* Recent Activity - spans full width with more height */}
        <div className="lg:col-span-12 h-96">
          <RecentActivityWidget />
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <main className="container mx-auto p-4 max-w-7xl">
        <PageHeader 
          title="Dashboard"
          subtitle="Your music command center"
        />
        <div className="text-center">Loading...</div>
      </main>
    }>
      <HomeContent />
    </Suspense>
  );
} 