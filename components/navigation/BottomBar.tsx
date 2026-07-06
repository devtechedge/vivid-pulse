'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, MessageSquare, User, PlusSquare } from 'lucide-react';
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

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-slate-950/90 backdrop-blur-md border-t border-slate-900 flex md:hidden justify-around items-center px-4 z-30">
        {/* Feed link */}
        <Link
          href="/feed"
          className={cn(
            'flex flex-col items-center justify-center gap-1 text-slate-400 p-1.5 rounded transition-all',
            pathname === '/feed' ? 'text-violet-400' : 'hover:text-slate-200'
          )}
        >
          <Home className="w-5 h-5" />
          <span className="text-[9px] font-semibold uppercase tracking-wider">Daily Posts</span>
        </Link>

        {/* Discover Link */}
        <Link
          href="/discover"
          className={cn(
            'flex flex-col items-center justify-center gap-1 text-slate-400 p-1.5 rounded transition-all',
            pathname === '/discover' ? 'text-violet-400' : 'hover:text-slate-200'
          )}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[9px] font-semibold uppercase tracking-wider">Find Friends</span>
        </Link>

        {/* Center create button */}
        {currentUser && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center justify-center -translate-y-3 w-12 h-12 bg-violet-600 rounded-full shadow-[0_0_15px_rgba(124,58,237,0.5)] border border-violet-500/20 text-white cursor-pointer active:scale-95 transition-all"
          >
            <PlusSquare className="w-6 h-6" />
          </button>
        )}

        {/* Messages Link */}
        <Link
          href="/messages"
          className={cn(
            'flex flex-col items-center justify-center gap-1 text-slate-400 p-1.5 rounded transition-all',
            pathname === '/messages' ? 'text-violet-400' : 'hover:text-slate-200'
          )}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[9px] font-semibold uppercase tracking-wider">Chats</span>
        </Link>

        {/* Profile Link */}
        {currentUser ? (
          <Link
            href={`/${currentUser.username}`}
            className={cn(
              'flex flex-col items-center justify-center gap-1 text-slate-400 p-1.5 rounded transition-all',
              pathname === `/${currentUser.username}` ? 'text-violet-400' : 'hover:text-slate-200'
            )}
          >
            <User className="w-5 h-5" />
            <span className="text-[9px] font-semibold uppercase tracking-wider">My Page</span>
          </Link>
        ) : (
          <div className="w-10" />
        )}
      </nav>

      {/* RENDER DYNAMIC CREATIVE CANVAS PIPELINE MODAL */}
      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        currentUser={currentUser}
      />
    </>
  );
}
