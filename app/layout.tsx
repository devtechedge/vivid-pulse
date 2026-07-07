import type { Metadata } from 'next';
import './globals.css';
import AccessibilityProvider from '@/components/ui/AccessibilityProvider';

export const metadata: Metadata = {
  title: 'VividPulse | Premium Visual Social Platform',
  description: 'Unveiling a neo-noir visual network built for modern digital creators.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0B0F19] text-slate-100 min-h-screen" suppressHydrationWarning>
        <AccessibilityProvider>
          {children}
        </AccessibilityProvider>
      </body>
    </html>
  );
}

