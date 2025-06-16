'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedGradientTextProps {
  children: React.ReactNode;
  className?: string;
}

const gradients = [
  'from-purple-400 via-pink-500 to-orange-500',
  'from-blue-400 via-cyan-400 to-teal-500',
  'from-green-400 via-emerald-400 to-teal-500',
  'from-violet-400 via-purple-400 to-fuchsia-500',
  'from-pink-400 via-fuchsia-400 to-purple-500',
  'from-yellow-300 via-amber-400 to-yellow-500',
  'from-rose-400 via-red-400 to-pink-400',
  'from-indigo-400 via-blue-400 to-cyan-400',
];

export function AnimatedGradientText({ children, className }: AnimatedGradientTextProps) {
  const [gradientIndex, setGradientIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setGradientIndex((prev) => (prev + 1) % gradients.length);
    }, 3000); // Change gradient every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className={cn(
        'bg-gradient-to-r bg-clip-text text-transparent transition-all duration-1000',
        gradients[gradientIndex],
        className
      )}
    >
      {children}
    </span>
  );
}