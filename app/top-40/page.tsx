'use client';

import { Suspense } from 'react';

import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';

import { Top40List } from '@/components/top-40-list';
import { Top40Nav } from '@/components/top-40-nav';

function Top40PageContent() {
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view') || 'artists';

  return (
    <main className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-4"
      >
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">
            Your Top 40
          </h1>
          <p className="text-zinc-400">
            Your most played music, ranked by play count
          </p>
        </div>

        <Top40Nav />

        <motion.div
          key={currentView}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="mt-8"
        >
          <Top40List type={currentView as 'artists' | 'albums' | 'tracks'} />
        </motion.div>
      </motion.div>
    </main>
  );
}

export default function Top40Page() {
  return (
    <Suspense fallback={
      <main className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </main>
    }>
      <Top40PageContent />
    </Suspense>
  );
} 