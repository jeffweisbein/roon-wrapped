'use client';

import { motion } from 'framer-motion';
import {
  Home,
  LineChart,
  Music,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function SiteNav() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/wrapped', label: 'Wrapped', icon: LineChart },
    { href: '/top-40', label: 'Top 40', icon: Music },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:top-0 sm:bottom-auto backdrop-blur-lg bg-black/30 border-t sm:border-b border-zinc-800">
      <div className="container mx-auto">
        <ul className="flex items-center justify-center gap-8">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            
            return (
              <li key={href}>
                <Link href={href} className="relative block group">
                  <div className="flex flex-col items-center gap-1">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-purple-400' : 'text-zinc-400 group-hover:text-white'} transition-colors`} />
                    <span className={`text-xs ${isActive ? 'text-purple-400' : 'text-zinc-400 group-hover:text-white'} transition-colors`}>
                      {label}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-pink-600"
                        initial={false}
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 30
                        }}
                      />
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
} 