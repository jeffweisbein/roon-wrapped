import './globals.css';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { SiteNav } from '@/components/site-nav';
import { Toaster } from '@/src/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Roon Wrapped',
  description: 'Your Roon listening history, wrapped.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white min-h-screen pb-20 sm:pb-0 sm:pt-20`}>
        <SiteNav />
        {children}
        <Toaster />
      </body>
    </html>
  )
}