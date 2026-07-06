'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Compass, MessageSquare, User, PlusSquare, LogOut, Loader2, MapPin, Image as ImageIcon, Trash2, Layers } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { logoutUser, createPost, getCurrentUser } from '@/lib/actions';
import { User as UserType } from '@/lib/db';
import { cn } from '@/lib/utils';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState<UserType | null>(null);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  
  // Create Post Form States
  const [caption, setCaption] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [mediaUrls, setMediaUrls] = React.useState<string[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    getCurrentUser().then(user => {
      if (user) setCurrentUser(user);
    });
  }, [pathname]); // Refresh when page changes

  const handleLogout = async () => {
    await logoutUser();
    router.push('/login');
  };

  // Drag and drop or manual select multi-media
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError('');

    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          setError('File exceeds 5MB size limit.');
          continue;
        }

        // Read file as base64 for pure local/preview high-fidelity visualization
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        urls.push(base64);
      }
      setMediaUrls(prev => [...prev, ...urls]);
    } catch {
      setError('Failed to upload file.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeMedia = (index: number) => {
    setMediaUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mediaUrls.length === 0) {
      setError('Please add at least one visual media item.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const res = await createPost(caption, location, mediaUrls);
    if (res.success) {
      setCaption('');
      setLocation('');
      setMediaUrls([]);
      setIsCreateOpen(false);
      router.refresh();
      if (pathname === '/feed') {
        window.location.reload(); // Force full reload of feed to display new posts instantly
      } else {
        router.push('/feed');
      }
    } else {
      setError(res.error || 'Failed to publish post.');
    }
    setIsSubmitting(false);
  };

  const navItems = [
    { label: 'Feed', href: '/feed', icon: Home },
    { label: 'Discover', href: '/discover', icon: Compass },
    { label: 'Messages', href: '/messages', icon: MessageSquare },
    { label: 'Profile', href: currentUser ? `/${currentUser.username}` : '#', icon: User, disabled: !currentUser },
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
              <span className="text-[9px] font-semibold text-teal-400 tracking-wider uppercase mt-1">Creative Network</span>
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
                className="mt-4 flex items-center gap-4 px-4 py-3 text-sm font-semibold rounded bg-violet-600/10 text-violet-300 border border-violet-500/20 hover:bg-violet-600/20 hover:text-white transition-all cursor-pointer group"
              >
                <PlusSquare className="w-5 h-5 group-hover:scale-105 transition-transform" />
                <span className="tracking-wide">Create Pulse</span>
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
            <span className="text-xs font-semibold uppercase tracking-wider">Terminate Session</span>
          </Button>
        </div>
      </aside>

      {/* CREATE POST MODAL DIALOG */}
      <Dialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Pulse"
      >
        <form onSubmit={handleCreatePost} className="flex flex-col gap-5">
          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs font-medium rounded">
              {error}
            </div>
          )}

          {/* Media uploader layout */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 tracking-wider uppercase">Visual Media</label>
            
            {/* Upload Area */}
            <div className="relative border-2 border-dashed border-slate-800 hover:border-violet-500/50 transition-colors rounded p-6 flex flex-col items-center justify-center bg-slate-900/30 group">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploading || isSubmitting}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center justify-center gap-2 text-center pointer-events-none">
                <ImageIcon className="w-8 h-8 text-slate-600 group-hover:text-violet-400 transition-colors" />
                <span className="text-xs font-semibold text-slate-300">Drag & Drop or Click to Upload Images</span>
                <span className="text-[10px] font-medium text-slate-500">Supports JPEG, PNG up to 5MB</span>
              </div>
            </div>

            {/* Uploading indicator */}
            {isUploading && (
              <div className="flex items-center gap-2 text-xs font-semibold text-violet-400 py-1 px-2 bg-violet-950/20 rounded">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Ingesting Media stream...
              </div>
            )}

            {/* Carousel Previews */}
            {mediaUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-2">
                {mediaUrls.map((url, index) => (
                  <div key={index} className="relative aspect-square border border-slate-800 bg-slate-900 rounded overflow-hidden group">
                    <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeMedia(index)}
                      className="absolute top-1.5 right-1.5 p-1 bg-black/80 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/60 rounded cursor-pointer opacity-0 group-hover:opacity-100 transition-all z-20"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-violet-600 text-[8px] font-bold tracking-wider text-white uppercase rounded-sm">
                        Cover
                      </span>
                    )}
                    <span className="absolute bottom-1.5 right-1.5 px-1 bg-black/60 text-[8px] font-mono text-slate-400 rounded">
                      #{index + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Caption input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 tracking-wider uppercase">Caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Inject captions, location pins, or digital signatures..."
              rows={3}
              maxLength={1000}
              className="w-full bg-slate-900/60 border border-slate-800 text-slate-100 placeholder:text-slate-600 px-4 py-2.5 text-sm rounded outline-none focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/40 focus:bg-slate-900/90 transition-all resize-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"
            />
          </div>

          {/* Location input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 tracking-wider uppercase">Location Signature</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Shinjuku, Tokyo"
                className="w-full bg-slate-900/60 border border-slate-800 text-slate-100 placeholder:text-slate-600 pl-10 pr-4 py-2.5 text-sm rounded outline-none focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/40 focus:bg-slate-900/90 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-900">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || mediaUrls.length === 0}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4" />
                  Publish Pulse
                </>
              )}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
