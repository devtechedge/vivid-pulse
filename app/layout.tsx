import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VividPulse | Visual Social Network',
  description:
    'Neo-noir photo sharing network with a feed, stories, DMs, and a cozy neighbors board. Seeded in-memory demo.',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0B0F19] text-slate-100 min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
