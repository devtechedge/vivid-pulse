import type { Metadata } from 'next';
import './globals.css';
import ThemeToggle from '@/components/ThemeToggle';

const PAGE_TITLE = 'VividPulse | Visual Social Network';
const PAGE_DESCRIPTION =
  'Neo-noir photo sharing network with a feed, stories, DMs, and a cozy neighbors board. Seeded in-memory demo.';
const SITE_URL = 'https://vividpulse-social.vercel.app';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  // Shared links (LinkedIn, Slack, email) render a bare URL without these.
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: SITE_URL,
    type: 'website',
    images: [{ url: 'https://vividpulse-social.vercel.app/og.png', width: 1200, height: 630, alt: 'VividPulse | Visual Social Network' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: ['https://vividpulse-social.vercel.app/og.png'],
  },
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
};

const THEME_BOOT = `(function(){try{var k="vivid-pulse-theme";var t=localStorage.getItem(k);if(t!=="light"&&t!=="dark")t="dark";var r=document.documentElement;r.setAttribute("data-theme",t);r.style.colorScheme=t;if(t==="dark")r.classList.add("dark");else r.classList.remove("dark");}catch(e){document.documentElement.setAttribute("data-theme","dark");}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body className="bg-[#0B0F19] text-slate-100 min-h-screen" suppressHydrationWarning>
        <div className="theme-toggle-slot">
          <ThemeToggle />
        </div>
        {children}
      </body>
    </html>
  );
}
