'use client';

import {
  useEffect,
  useState,
} from 'react';

import { motion } from 'framer-motion';
import {
  AlertCircle,
  Disc3,
  Mic2,
  Music2,
} from 'lucide-react';

interface TopItem {
  name: string;
  artist?: string;
  count: number;
  image_key?: string;
}

interface Top40ListProps {
  type: 'artists' | 'albums' | 'tracks';
}

export function Top40List({ type }: Top40ListProps) {
  const [items, setItems] = useState<TopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/history/top-40');
        if (!response.ok) {
          throw new Error('Failed to fetch top 40 data');
        }
        const data = await response.json();
        setItems(data[type]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [type]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Disc3 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-48 text-red-400 space-x-2">
        <AlertCircle className="w-6 h-6" />
        <span>{error}</span>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="flex items-center justify-center h-48 text-neutral-400">
        No data available
      </div>
    );
  }

  const Icon = type === 'artists' ? Mic2 : type === 'albums' ? Disc3 : Music2;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item, index) => (
        <motion.div
          key={`${item.name}-${item.artist || ''}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className="group bg-white/5 hover:bg-white/10 backdrop-blur-lg border border-white/10 hover:border-white/20 p-4 rounded-xl transition-all"
        >
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 w-16 h-16">
              {item.image_key ? (
                <img
                  src={`/api/roon/image/${item.image_key}`}
                  alt={item.name}
                  className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform"
                  loading="lazy"
                  onError={(e) => {
                    // If image fails to load, show fallback icon
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`w-full h-full bg-white/10 rounded-lg flex items-center justify-center fallback-icon ${item.image_key ? 'hidden' : ''}`}>
                <Icon className="w-8 h-8 text-neutral-400" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-white group-hover:text-yellow-400 transition-colors truncate">
                {item.name}
              </h3>
              {item.artist && (
                <p className="text-sm text-neutral-400 truncate mt-0.5">
                  {item.artist}
                </p>
              )}
              <p className="text-sm text-neutral-500 mt-1">
                {item.count} {type === 'artists' ? 'plays' : 'times'}
              </p>
            </div>
            <div className="flex-shrink-0 w-8 text-2xl font-bold text-neutral-600">
              {index + 1}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
} 