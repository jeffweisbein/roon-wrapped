'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface TopArtist {
  name: string;
  count: number;
  image_key?: string;
}

export function TopArtistsWidget() {
  const [artists, setArtists] = useState<TopArtist[]>([]);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('/api/history/wrapped?period=30')
      .then(res => res.json())
      .then(data => {
        if (data.topArtistsByPlays) {
          // Take top 10 artists
          const top10 = data.topArtistsByPlays.slice(0, 10).map((artist: any) => ({
            name: artist.name || artist.artist,
            count: artist.count,
            image_key: artist.image_key
          }));
          setArtists(top10);
        }
      })
      .catch(error => {
        console.error('Error fetching top artists:', error);
      });
  }, []);

  const handleImageError = (artistName: string) => {
    setImageErrors(prev => ({ ...prev, [artistName]: true }));
  };

  return (
    <Link href="/top-40" className="block group h-full">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative h-full bg-gradient-to-br from-zinc-900/50 to-zinc-900/30 border border-zinc-800/30 rounded-2xl backdrop-blur-md overflow-hidden"
      >
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Top Artists</h3>
            <span className="text-xs text-zinc-500">Last 30 days</span>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2">
            {artists.map((artist, index) => (
              <motion.div
                key={artist.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 py-1"
              >
                {/* Rank */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-black' :
                  index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-black' :
                  index === 2 ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white' :
                  'bg-zinc-800 text-zinc-400'
                }`}>
                  {index === 0 && <Crown className="w-3 h-3" />}
                  {index > 0 && index + 1}
                </div>

                {/* Artist image */}
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
                  {artist.image_key && !imageErrors[artist.name] ? (
                    <Image
                      src={`/api/roon/image/${artist.image_key}`}
                      alt={artist.name}
                      fill
                      className="object-cover"
                      onError={() => handleImageError(artist.name)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-zinc-400">
                        {artist.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Artist name and plays */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{artist.name}</p>
                  <p className="text-xs text-zinc-500">{artist.count} plays</p>
                </div>

                {/* Trend indicator */}
                {index < 2 && (
                  <TrendingUp className="w-4 h-4 text-green-400 flex-shrink-0" />
                )}
              </motion.div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-800/30">
            <p className="text-xs text-zinc-500 text-center group-hover:text-zinc-400 transition-colors">
              View all top artists →
            </p>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}