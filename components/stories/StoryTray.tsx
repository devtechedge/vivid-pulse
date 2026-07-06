'use client';

import * as React from 'react';
import { Plus, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { getActiveStories, createStory, getCurrentUser, ActiveStoryTray } from '@/lib/actions';
import { User as UserType } from '@/lib/db';
import StoryViewer from './StoryViewer';
import { cn } from '@/lib/utils';

export default function StoryTray() {
  const [trays, setTrays] = React.useState<ActiveStoryTray[]>([]);
  const [currentUser, setCurrentUser] = React.useState<UserType | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [uploadingStory, setUploadingStory] = React.useState(false);
  
  // Story modal state
  const [activeUserIndex, setActiveUserIndex] = React.useState<number | null>(null);

  const fetchStories = async () => {
    setLoading(true);
    try {
      const data = await getActiveStories();
      setTrays(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    getCurrentUser().then(user => {
      if (user) setCurrentUser(user);
    });
    Promise.resolve().then(() => {
      fetchStories();
    });
  }, []);

  const handleCreateStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File exceeds 5MB story limit.');
      return;
    }

    setUploadingStory(true);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const res = await createStory(base64, 'IMAGE');
      if (res.success) {
        await fetchStories();
      } else {
        alert(res.error || 'Failed to publish story.');
      }
    } catch {
      alert('Error uploading story.');
    } finally {
      setUploadingStory(false);
    }
  };

  return (
    <div className="w-full bg-slate-950 border border-slate-900 rounded p-4 flex gap-4 overflow-x-auto scrollbar-none shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
      
      {/* 1. CURRENT USER "ADD STORY" BUBBLE */}
      {currentUser && (
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer select-none">
          <div className="relative w-15 h-15 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center group">
            <img
              src={currentUser.avatarUrl || 'https://picsum.photos/seed/placeholder/100/100'}
              alt="My Avatar"
              className="w-13 h-13 rounded-full object-cover p-0.5"
            />
            {/* Overlay input button */}
            <input
              type="file"
              accept="image/*"
              onChange={handleCreateStory}
              disabled={uploadingStory}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            
            {/* Create Story badge */}
            <div className="absolute bottom-0 right-0 w-5 h-5 bg-violet-600 rounded-full border border-slate-950 flex items-center justify-center text-white shadow-[0_0_8px_rgba(124,58,237,0.6)] group-hover:bg-violet-500 transition-colors">
              {uploadingStory ? (
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-200">
            {uploadingStory ? 'Syncing...' : 'Your Pulse'}
          </span>
        </div>
      )}

      {/* 2. LIVE STORIES TRAYS SCROLL */}
      {loading ? (
        <div className="flex items-center gap-3 py-2 text-xs font-mono text-slate-600">
          <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
          Syncing Stories...
        </div>
      ) : trays.length === 0 ? (
        <div className="flex items-center gap-2 text-xs font-mono text-slate-600 py-3 px-1 border border-dashed border-slate-900/60 rounded">
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          No Live Stories active. Be the first to start a Pulse.
        </div>
      ) : (
        trays.map((tray, index) => (
          <div
            key={tray.userId}
            onClick={() => setActiveUserIndex(index)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer select-none group"
          >
            {/* Colored Neon Border representing unviewed stories */}
            <div className="w-15 h-15 rounded-full flex items-center justify-center bg-gradient-to-tr from-violet-600 to-teal-400 p-[2px] shadow-[0_0_10px_rgba(124,58,237,0.15)] group-hover:shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-all">
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center p-[2px]">
                <img
                  src={tray.avatarUrl || 'https://picsum.photos/seed/placeholder/100/100'}
                  alt={tray.username}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>
            <span className="text-[10px] font-bold text-slate-300 group-hover:text-slate-100 truncate w-14 text-center">
              @{tray.username}
            </span>
          </div>
        ))
      )}

      {/* IMMERSIVE STORY VIEWER MODAL PANEL */}
      {activeUserIndex !== null && (
        <StoryViewer
          trays={trays}
          initialUserIndex={activeUserIndex}
          isOpen={activeUserIndex !== null}
          onClose={() => setActiveUserIndex(null)}
        />
      )}

    </div>
  );
}
