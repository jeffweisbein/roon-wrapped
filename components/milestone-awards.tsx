"use client";

import React from "react";
import { motion } from "framer-motion";

interface Award {
  id: string;
  title: string;
  description: string;
  artist: string;
  metric: string;
  color: string;
}

interface MilestoneAwardsProps {
  awards: Award[];
}

// SVG Badge Components
const BadgeDesigns: Record<string, React.FC<{ color: string }>> = {
  "speed-demon": ({ color }) => (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
      <circle cx="30" cy="30" r="28" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2"/>
      <path d="M30 15 L35 25 L45 26 L37 33 L40 43 L30 37 L20 43 L23 33 L15 26 L25 25 Z" 
        fill={color} stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <text x="30" y="32" textAnchor="middle" fontSize="16" fill="white">⚡</text>
    </svg>
  ),
  "marathon-listener": ({ color }) => (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
      <circle cx="30" cy="30" r="28" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2"/>
      <rect x="20" y="20" width="20" height="20" rx="3" fill={color} fillOpacity="0.8"/>
      <path d="M25 28 L27 31 L35 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  "day-one-fan": ({ color }) => (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
      <circle cx="30" cy="30" r="28" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2"/>
      <path d="M30 20 C25 15, 15 20, 30 35 C45 20, 35 15, 30 20 Z" 
        fill={color} stroke={color} strokeWidth="1.5"/>
      <text x="30" y="50" textAnchor="middle" fontSize="10" fill={color} fontWeight="bold">#1</text>
    </svg>
  ),
  "rising-star": ({ color }) => (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
      <circle cx="30" cy="30" r="28" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2"/>
      <path d="M30 10 L34 22 L46 22 L36 30 L40 42 L30 34 L20 42 L24 30 L14 22 L26 22 Z" 
        fill={color} stroke="white" strokeWidth="1"/>
      <path d="M25 35 L30 25 L35 35" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  "album-collector": ({ color }) => (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
      <circle cx="30" cy="30" r="28" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2"/>
      <circle cx="30" cy="30" r="15" fill={color} fillOpacity="0.8"/>
      <circle cx="30" cy="30" r="8" fill="white"/>
      <circle cx="30" cy="30" r="3" fill={color}/>
      <path d="M22 18 L22 42 M26 18 L26 42 M34 18 L34 42 M38 18 L38 42" 
        stroke={color} strokeWidth="1" opacity="0.5"/>
    </svg>
  ),
  "slow-burn": ({ color }) => (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
      <circle cx="30" cy="30" r="28" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2"/>
      <path d="M30 45 C35 40, 32 35, 35 30 C38 25, 35 20, 30 15 C25 20, 22 25, 25 30 C28 35, 25 40, 30 45 Z" 
        fill={color} stroke={color} strokeWidth="1.5"/>
      <circle cx="30" cy="35" r="3" fill="white"/>
    </svg>
  ),
  "thousand-club": ({ color }) => (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
      <circle cx="30" cy="30" r="28" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2"/>
      <path d="M20 25 L30 15 L40 25 L40 40 Q40 45 35 45 L25 45 Q20 45 20 40 Z" 
        fill={color} stroke={color} strokeWidth="1.5"/>
      <text x="30" y="35" textAnchor="middle" fontSize="12" fill="white" fontWeight="bold">1K</text>
    </svg>
  ),
  "discovery-mode": ({ color }) => (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
      <circle cx="30" cy="30" r="28" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2"/>
      <circle cx="28" cy="28" r="10" fill="none" stroke={color} strokeWidth="2.5"/>
      <path d="M35 35 L42 42" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="28" cy="28" r="4" fill={color} fillOpacity="0.6"/>
    </svg>
  ),
  "binge-master": ({ color }) => (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
      <circle cx="30" cy="30" r="28" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2"/>
      <rect x="15" y="22" width="30" height="16" rx="2" fill={color} fillOpacity="0.8"/>
      <path d="M20 30 L20 30 L23 27 L26 33 L29 25 L32 35 L35 28 L38 31 L40 30" 
        stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
};

export function MilestoneAwards({ awards }: MilestoneAwardsProps) {
  const getBadge = (awardId: string, color: string) => {
    const BadgeComponent = BadgeDesigns[awardId] || BadgeDesigns["marathon-listener"];
    return <BadgeComponent color={color} />;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {awards.map((award, index) => (
        <motion.div
          key={award.id}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ 
            delay: index * 0.1,
            type: "spring",
            stiffness: 100,
            damping: 15
          }}
          whileHover={{ scale: 1.05 }}
          className="relative"
        >
          <div 
            className="p-4 rounded-xl border-2 backdrop-blur-sm transition-all hover:shadow-lg"
            style={{ 
              borderColor: award.color,
              backgroundColor: `${award.color}10`
            }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {getBadge(award.id, award.color)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm mb-1" style={{ color: award.color }}>
                  {award.title}
                </h3>
                <p className="text-xs text-muted-foreground mb-2">
                  {award.description}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium truncate pr-2">
                    {award.artist}
                  </p>
                  <span 
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ 
                      backgroundColor: award.color,
                      color: 'white'
                    }}
                  >
                    {award.metric}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}