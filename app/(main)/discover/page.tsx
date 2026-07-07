'use client';

import * as React from 'react';
import { Compass } from 'lucide-react';
import { getCurrentUser } from '@/lib/actions';
import { User as UserType } from '@/lib/db';
import AccessibleCurations from '@/components/discover/AccessibleCurations';

export default function DiscoverPage() {
  const [currentUser, setCurrentUser] = React.useState<UserType | null>(null);

  React.useEffect(() => {
    getCurrentUser().then(user => {
      setCurrentUser(user);
    });
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col gap-6 md:gap-8">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-600/15 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <Compass className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-100">Accessible Curations & Exploration</h1>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Quiet paths, local landmarks, nostalgic feeds, and beautiful crafts</span>
          </div>
        </div>
      </div>

      {/* CORE INTEGRATION COMPONENT */}
      <AccessibleCurations currentUser={currentUser} />

    </div>
  );
}
