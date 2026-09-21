'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, MessageSquare, User, PlusSquare, Coffee } from 'lucide-react';
import { getCurrentUser } from '@/lib/actions';
import { User as UserType } from '@/lib/db';
import { cn } from '@/lib/utils';
import CreatePostModal from '@/components/feed/CreatePostModal';

export default function BottomBar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = React.useState<UserType | null>(null);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  React.useEffect(() => {
    getCurrentUser().then(user => {
      if (user) setCurrentUser(user);
    });
  }, [pathname]);

  const tabClass = (active: boolean) =>
    cn(
      'flex flex-col items-center justify-center gap-1 text-slate-400 p-1.5 rounded transition-all min-w-0 flex-1',
      active ? 'text-violet-400' : 'hover:text-slate-200'
    );

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-slate-950/90 backdrop-blur-md border-t border-slate-900 flex md:hidden items-center px-2 z-30">
        {/* Left tabs */}
        <div className="flex flex-1 items-center justify-evenly min-w-0">
          <Link href="/feed" className={tabClass(pathname === '/feed')}>
            <Home className="w-5 h-5" />
            <span className="text-[9px] font-semibold uppercase tracking-wider truncate">Daily Posts</span>
          </Link>

          <Link href="/discover" className={tabClass(pathname === '/discover')}>
            <Compass className="w-5 h-5" />
            <span className="text-[9px] font-semibold uppercase tracking-wider truncate">Find Friends</span>
          </Link>

          <Link href="/neighbors" className={tabClass(pathname === '/neighbors')}>
            <Coffee className="w-5 h-5" />
            <span className="text-[9px] font-semibold uppercase tracking-wider truncate">Neighbors</span>
          </Link>
        </div>

        {/* Spacer keeps tab groups apart so the FAB can sit in true center */}
        <div className="w-14 shrink-0" aria-hidden />

        {/* Right tabs */}
        <div className="flex flex-1 items-center justify-evenly min-w-0">
          <Link href="/messages" className={tabClass(pathname === '/messages')}>
            <MessageSquare className="w-5 h-5" />
            <span className="text-[9px] font-semibold uppercase tracking-wider truncate">Chats</span>
          </Link>

          {currentUser ? (
            <Link
              href={`/${currentUser.username}`}
              className={tabClass(pathname === `/${currentUser.username}`)}
            >
              <User className="w-5 h-5" />
              <span className="text-[9px] font-semibold uppercase tracking-wider truncate">My Page</span>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </div>

        {/* FAB pinned to viewport center of the bar */}
        {currentUser && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="absolute left-1/2 -translate-x-1/2 -translate-y-3 flex items-center justify-center w-12 h-12 bg-violet-600 rounded-full shadow-[0_0_15px_rgba(124,58,237,0.5)] border border-violet-500/20 text-white cursor-pointer active:scale-95 transition-all"
            aria-label="Create post"
          >
            <PlusSquare className="w-6 h-6" />
          </button>
        )}
      </nav>

      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        currentUser={currentUser}
      />
    </>
  );
}
