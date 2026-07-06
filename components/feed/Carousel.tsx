'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { PostMedia } from '@/lib/db';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface CarouselProps {
  media: PostMedia[];
  onDoubleTap?: () => void;
}

export default function Carousel({ media, onDoubleTap }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [showHeart, setShowHeart] = React.useState(false);
  const lastTapRef = React.useRef<number>(0);

  const handleTap = (e: React.MouseEvent) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_PRESS_DELAY) {
      // Double tap detected!
      setShowHeart(true);
      if (onDoubleTap) onDoubleTap();
      setTimeout(() => {
        setShowHeart(false);
      }, 800);
    }
    lastTapRef.current = now;
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === 0 ? media.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === media.length - 1 ? 0 : prev + 1));
  };

  if (!media || media.length === 0) {
    return (
      <div className="w-full aspect-square bg-slate-900 flex items-center justify-center text-slate-500">
        No Media Available
      </div>
    );
  }

  return (
    <div
      onClick={handleTap}
      className="relative w-full aspect-square select-none overflow-hidden bg-black flex items-center justify-center group cursor-pointer"
    >
      {/* Media elements rendered via smooth transition */}
      <img
        src={media[currentIndex].url}
        alt={`Visual Content ${currentIndex + 1}`}
        className="w-full h-full object-cover select-none pointer-events-none"
        draggable={false}
      />

      {/* Floating Double Tap Heart Animation */}
      <AnimatePresence>
        {showHeart && (
          <motion.div
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1.2 }}
            exit={{ opacity: 0, scale: 1.5, y: -40 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute inset-0 m-auto w-24 h-24 flex items-center justify-center text-rose-500 pointer-events-none drop-shadow-[0_0_20px_rgba(244,63,94,0.6)] z-20"
          >
            <Heart className="w-20 h-20 fill-rose-500" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Chevrons */}
      {media.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-3 p-1.5 bg-black/60 hover:bg-black/90 text-slate-300 hover:text-white border border-slate-800 rounded opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-10"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-3 p-1.5 bg-black/60 hover:bg-black/90 text-slate-300 hover:text-white border border-slate-800 rounded opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-10"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Custom Carousel indicators / dot system */}
      {media.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/40 px-2.5 py-1.5 rounded backdrop-blur-sm border border-white/5">
          {media.map((_, index) => (
            <div
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
              }}
              className={cn(
                'w-1.5 h-1.5 rounded-full transition-all duration-200 cursor-pointer',
                index === currentIndex ? 'bg-violet-400 w-3' : 'bg-slate-600 hover:bg-slate-400'
              )}
            />
          ))}
        </div>
      )}

      {/* Counter Tag */}
      {media.length > 1 && (
        <span className="absolute top-4 right-4 px-2 py-1 bg-black/65 text-[10px] font-mono font-bold tracking-wider text-slate-300 border border-white/5 rounded backdrop-blur-sm z-10">
          {currentIndex + 1}/{media.length}
        </span>
      )}
    </div>
  );
}
