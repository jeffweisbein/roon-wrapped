'use client';

import { motion } from 'framer-motion';
import {
  useRouter,
  useSearchParams,
} from 'next/navigation';

import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

export function Top40Nav() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('view') || 'artists';

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('view', value);
    router.push(`/top-40?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Tabs
          value={currentTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 bg-zinc-800/40 rounded-xl p-1">
            <TabsTrigger
              value="artists"
              className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white rounded-lg transition-all duration-200"
            >
              Artists
            </TabsTrigger>
            <TabsTrigger
              value="albums"
              className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white rounded-lg transition-all duration-200"
            >
              Albums
            </TabsTrigger>
            <TabsTrigger
              value="tracks"
              className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white rounded-lg transition-all duration-200"
            >
              Tracks
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>
    </div>
  );
} 