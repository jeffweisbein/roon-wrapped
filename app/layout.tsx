import "./globals.css";

import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { SiteNav } from "@/components/site-nav";
import { Toaster } from "@/src/components/ui/toaster";
import { GradientBackground } from "@/components/gradient-background";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Roon Wrapped",
  description: "Your Roon listening history, wrapped.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body
        className={`${inter.className} text-white min-h-screen pb-24 sm:pb-0 sm:pt-20`}
      >
        <GradientBackground />
        <div className="relative min-h-screen">
          <SiteNav />
          {children}
          <Toaster />
        </div>
      </body>
    </html>
  );
}
