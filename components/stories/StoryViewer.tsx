'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, X, Play, Pause, RefreshCw } from 'lucide-react';
import { ActiveStoryTray } from '@/lib/actions';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface StoryViewerProps {
  trays: ActiveStoryTray[];
  initialUserIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function StoryViewer({ trays, initialUserIndex, isOpen, onClose }: StoryViewerProps) {
  const [userIndex, setUserIndex] = React.useState(initialUserIndex);
  const [storyIndex, setStoryIndex] = React.useState(0);
  const [progress, setProgress] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);

  const duration = 5000; // 5 seconds per slide
  const progressInterval = 50; // Update every 50ms
  const steps = duration / progressInterval;
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Sync index on open
  React.useEffect(() => {
    if (isOpen) {
      Promise.resolve().then(() => {
        setUserIndex(initialUserIndex);
        setStoryIndex(0);
        setProgress(0);
        setIsPaused(false);
      });
    }
  }, [initialUserIndex, isOpen]);

  const currentTray = trays[userIndex];
  const currentStory = currentTray?.stories[storyIndex];

  const handleNext = React.useCallback(() => {
    if (!currentTray) return;
    
    if (storyIndex < currentTray.stories.length - 1) {
      // Next story in current tray
      setStoryIndex(prev => prev + 1);
      setProgress(0);
    } else if (userIndex < trays.length - 1) {
      // Next user's story tray
      setUserIndex(prev => prev + 1);
      setStoryIndex(0);
      setProgress(0);
    } else {
      // End of all stories
      onClose();
    }
  }, [userIndex, storyIndex, trays, currentTray, onClose]);

  const handlePrev = React.useCallback(() => {
    if (!currentTray) return;

    if (storyIndex > 0) {
      // Previous story in current tray
      setStoryIndex(prev => prev - 1);
      setProgress(0);
    } else if (userIndex > 0) {
      // Go to previous user's tray (start at their last story)
      const prevUserIndex = userIndex - 1;
      const prevTray = trays[prevUserIndex];
      setUserIndex(prevUserIndex);
      setStoryIndex(prevTray.stories.length - 1);
      setProgress(0);
    } else {
      // Reset first story
      setProgress(0);
    }
  }, [userIndex, storyIndex, trays, currentTray]);

  // Keyboard navigation controls
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPaused(p => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  // Progress Bar timer logic
  React.useEffect(() => {
    if (!isOpen || isPaused || !currentStory) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          handleNext();
          return 0;
        }
        return p + (100 / steps);
      });
    }, progressInterval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isPaused, currentStory, handleNext, steps]);

  if (!isOpen || !currentTray || !currentStory) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl">
        
        {/* Desktop sidebar info cards */}
        <div className="absolute top-6 left-6 text-slate-500 hidden md:flex flex-col gap-1 pointer-events-none">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">VividPulse Live Stories</span>
          <span className="text-[10px] font-mono">Use Left/Right Arrows or Spacebar</span>
        </div>

        {/* Modal Close */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded cursor-pointer z-50 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Main story board content */}
        <div className="relative w-full max-w-[420px] aspect-[9/16] bg-slate-950 shadow-[0_0_80px_rgba(124,58,237,0.2)] border border-slate-900 rounded-lg overflow-hidden flex flex-col justify-between">
          
          {/* HEADER (Progress bars and user details) */}
          <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-40 flex flex-col gap-3">
            {/* Segment-based progress bars */}
            <div className="flex gap-1.5 w-full">
              {currentTray.stories.map((story, idx) => {
                let storyProgress = 0;
                if (idx < storyIndex) storyProgress = 100;
                else if (idx === storyIndex) storyProgress = progress;

                return (
                  <div key={story.id} className="h-1 flex-1 bg-slate-800 rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-violet-500 transition-all duration-[50ms]"
                      style={{ width: `${storyProgress}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* User details & pause control */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={currentTray.avatarUrl || 'https://picsum.photos/seed/placeholder/100/100'}
                  alt={currentTray.username}
                  className="w-9 h-9 rounded-full object-cover border border-violet-500/80 p-0.5"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white leading-none">@{currentTray.username}</span>
                  <span className="text-[9px] font-mono text-slate-400 mt-1">Live Feed</span>
                </div>
              </div>

              {/* Pause / Resume indicators */}
              <button
                onClick={() => setIsPaused(p => !p)}
                className="p-1.5 bg-black/40 hover:bg-black/60 rounded text-slate-400 hover:text-white border border-white/5 transition-all cursor-pointer"
              >
                {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* BACKGROUND STORY IMAGE/VIDEO (With tap-to-pause) */}
          <div
            onClick={() => setIsPaused(p => !p)}
            className="w-full h-full relative cursor-pointer group select-none"
          >
            <img
              src={currentStory.mediaUrl}
              alt="Story Content"
              className="w-full h-full object-cover pointer-events-none"
              draggable={false}
            />

            {/* Pause overlay message */}
            {isPaused && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px] z-20">
                <div className="px-4 py-2 bg-slate-950/80 border border-slate-800 rounded flex items-center gap-2 text-xs font-mono tracking-wider text-violet-400">
                  <Pause className="w-3.5 h-3.5 animate-pulse" />
                  STREAM SUSPENDED
                </div>
              </div>
            )}
          </div>

          {/* Navigation overlay chevrons for Desktop */}
          <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2.5 pointer-events-none">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="p-1.5 bg-black/60 hover:bg-black/90 text-slate-300 hover:text-white border border-slate-800 rounded pointer-events-auto cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="p-1.5 bg-black/60 hover:bg-black/90 text-slate-300 hover:text-white border border-slate-800 rounded pointer-events-auto cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </AnimatePresence>
  );
}
