'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Compass, MessageSquare, User, PlusSquare, Image as ImageIcon, Trash2, MapPin, Loader2, Layers } from 'lucide-react';
import { getCurrentUser, createPost } from '@/lib/actions';
import { User as UserType } from '@/lib/db';
import { cn } from '@/lib/utils';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

export default function BottomBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState<UserType | null>(null);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  // Form states matching Sidebar
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
  }, [pathname]);

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
        window.location.reload();
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
    // Center: Create Post trigger button
    { label: 'Messages', href: '/messages', icon: MessageSquare },
    { label: 'Profile', href: currentUser ? `/${currentUser.username}` : '#', icon: User, disabled: !currentUser },
  ];

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
          <span className="text-[9px] font-semibold uppercase tracking-wider">Feed</span>
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
          <span className="text-[9px] font-semibold uppercase tracking-wider">Discover</span>
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
          <span className="text-[9px] font-semibold uppercase tracking-wider">Messages</span>
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
            <span className="text-[9px] font-semibold uppercase tracking-wider">Profile</span>
          </Link>
        ) : (
          <div className="w-10" />
        )}
      </nav>

      {/* CREATE POST MODAL DIALOG (MOBILE STRETCH) */}
      <Dialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Pulse"
      >
        <form onSubmit={handleCreatePost} className="flex flex-col gap-4">
          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs font-medium rounded">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 tracking-wider uppercase">Visual Media</label>
            <div className="relative border-2 border-dashed border-slate-800 rounded p-4 flex flex-col items-center justify-center bg-slate-900/30">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploading || isSubmitting}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <ImageIcon className="w-6 h-6 text-slate-600 mb-1" />
              <span className="text-[11px] font-semibold text-slate-300 text-center">Tap to Upload Images</span>
            </div>

            {isUploading && (
              <div className="flex items-center gap-2 text-xs font-semibold text-violet-400 mt-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Ingesting Media...
              </div>
            )}

            {mediaUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {mediaUrls.map((url, index) => (
                  <div key={index} className="relative aspect-square border border-slate-800 rounded overflow-hidden group">
                    <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeMedia(index)}
                      className="absolute top-1 right-1 p-1 bg-black/80 text-slate-400 hover:text-rose-400 rounded cursor-pointer z-20"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <span className="absolute bottom-1 right-1 px-1 bg-black/60 text-[8px] font-mono text-slate-400 rounded">
                      #{index + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 tracking-wider uppercase">Caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Inject captions, pins, or signatures..."
              rows={2}
              className="w-full bg-slate-900/60 border border-slate-800 text-slate-100 placeholder:text-slate-600 px-3 py-2 text-xs rounded outline-none focus:border-violet-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 tracking-wider uppercase">Location Signature</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-600" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Shinjuku, Tokyo"
                className="w-full bg-slate-900/60 border border-slate-800 text-slate-100 placeholder:text-slate-600 pl-9 pr-3 py-2 text-xs rounded outline-none focus:border-violet-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-900">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || mediaUrls.length === 0}
              className="gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Layers className="w-3.5 h-3.5" />
              )}
              Publish
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
