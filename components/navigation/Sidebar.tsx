'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Compass, MessageSquare, User, PlusSquare, LogOut, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { logoutUser, getCurrentUser } from '@/lib/actions';
import { User as UserType } from '@/lib/db';
import { cn } from '@/lib/utils';
import CreatePostModal from '@/components/feed/CreatePostModal';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState<UserType | null>(null);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  React.useEffect(() => {
    getCurrentUser().then(user => {
      if (user) setCurrentUser(user);
    });
  }, [pathname]);

  const handleLogout = async () => {
    await logoutUser();
    router.push('/login');
  };

  const navItems = [
    { label: 'Daily Posts', href: '/feed', icon: Home },
    { label: 'Cozy Neighbors', href: '/neighbors', icon: Coffee },
    { label: 'Find Friends', href: '/discover', icon: Compass },
    { label: 'Chats', href: '/messages', icon: MessageSquare },
    { label: 'My Page', href: currentUser ? `/${currentUser.username}` : '#', icon: User, disabled: !currentUser },
  ];

  return (
    <>
      <aside className="fixed top-0 left-0 h-screen w-64 bg-slate-950/80 backdrop-blur-md border-r border-slate-900 px-6 py-8 flex flex-col justify-between hidden md:flex z-30">
        {/* Logo Branding */}
        <div className="flex flex-col gap-8">
          <Link href="/feed" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 flex items-center justify-center bg-violet-600 rounded shadow-[0_0_15px_rgba(124,58,237,0.5)] group-hover:scale-105 transition-all">
              <span className="font-bold text-lg text-white tracking-widest italic">V</span>
              <div className="absolute inset-0 border border-teal-400/30 rounded scale-110 group-hover:scale-115 transition-all" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-[0.2em] text-slate-100 uppercase leading-none">VividPulse</span>
              <span className="text-[9px] font-semibold text-teal-400 tracking-wider uppercase mt-1">Our Friendly Community</span>
            </div>
          </Link>
 
           {/* Navigation Links */}
           <nav className="flex flex-col gap-2">
             {navItems.map((item) => {
               const Icon = item.icon;
               const isActive = pathname === item.href || (item.href !== '/feed' && pathname.startsWith(item.href));
               
               if (item.disabled) return null;
 
               return (
                 <Link
                   key={item.label}
                   href={item.href}
                   className={cn(
                     'flex items-center gap-4 px-4 py-3 text-sm font-medium rounded transition-all duration-200 group relative',
                     isActive
                       ? 'bg-slate-900 text-violet-400 border-l-2 border-violet-500 shadow-[inset_4px_0_10px_rgba(124,58,237,0.05)]'
                       : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/40'
                   )}
                 >
                   <Icon className={cn('w-5 h-5 transition-transform group-hover:scale-105', isActive ? 'text-violet-400' : 'text-slate-400 group-hover:text-slate-200')} />
                   <span className="tracking-wide">{item.label}</span>
                 </Link>
               );
             })}
 
             {/* Create Post Button */}
             {currentUser && (
               <button
                 onClick={() => setIsCreateOpen(true)}
                 className="mt-4 flex items-center gap-4 px-4 py-3 text-sm font-semibold rounded bg-violet-600/10 text-violet-300 border border-violet-500/20 hover:bg-violet-600/20 hover:text-white transition-all cursor-pointer group text-left w-full"
               >
                 <PlusSquare className="w-5 h-5 group-hover:scale-105 transition-transform flex-shrink-0" />
                 <span className="tracking-wide">Share Photo</span>
               </button>
             )}
          </nav>
        </div>

        {/* User profile details & Logout */}
        <div className="flex flex-col gap-6 pt-6 border-t border-slate-900/60">
          {currentUser && (
            <Link href={`/${currentUser.username}`} className="flex items-center gap-3 p-1.5 hover:bg-slate-900/40 rounded transition-all group">
              <img
                src={currentUser.avatarUrl || 'https://picsum.photos/seed/placeholder/100/100'}
                alt={currentUser.displayName}
                className="w-10 h-10 rounded object-cover border border-slate-800 group-hover:border-violet-500/50 transition-colors"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-200 truncate leading-none mb-1 group-hover:text-white">{currentUser.displayName}</span>
                <span className="text-[10px] font-medium text-slate-500 truncate leading-none">@{currentUser.username}</span>
              </div>
            </Link>
          )}

          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full gap-3 justify-start border-slate-900 hover:border-rose-950/60 hover:bg-rose-950/10 hover:text-rose-400 text-slate-400"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Log Out</span>
          </Button>
        </div>
      </aside>

      {/* RENDER DYNAMIC CREATIVE CANVAS PIPELINE MODAL */}
      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        currentUser={currentUser}
      />
    </>
  );
}
