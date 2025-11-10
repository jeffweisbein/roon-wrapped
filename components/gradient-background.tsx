"use client";

import { useEffect, useState } from "react";

export function GradientBackground() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Calculate opacity based on scroll position
  const overlayOpacity = Math.max(0, 1 - scrollY / 1000);

  return (
    <>
      {/* Base gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-black via-zinc-900 to-zinc-800 -z-10" />

      {/* Dynamic overlay that fades as you scroll */}
      <div
        className="fixed inset-0 bg-gradient-to-b from-black to-transparent -z-10 pointer-events-none"
        style={{ opacity: overlayOpacity }}
      />

      {/* Subtle radial gradients for depth */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500/10 rounded-full filter blur-3xl" />
      </div>
    </>
  );
}
