import React from 'react';
import type { Metadata } from 'next';
import { AccessibilityProvider } from '@/components/ui/AccessibilityProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'VividPulse - Sensory Family Preservation Chest',
  description: 'A cozy, highly accessible space for families and senior neighbors to preserve keepsakes, logs, and acoustic memories.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        <AccessibilityProvider>
          {children}
        </AccessibilityProvider>
      </body>
    </html>
  );
}
