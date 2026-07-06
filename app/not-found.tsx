'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#070A13] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-rose-950/40 border border-rose-900/40 flex items-center justify-center text-rose-400 mb-4 animate-pulse">
        <ShieldAlert className="w-5 h-5" />
      </div>
      <h2 className="text-sm font-bold uppercase tracking-widest text-slate-200 mb-2">
        Signal Lost (404)
      </h2>
      <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-6">
        The coordinate path you are attempting to trace does not exist on the VividPulse routing network.
      </p>
      <Button onClick={() => router.push('/feed')} size="sm">
        Return to Feed
      </Button>
    </div>
  );
}
