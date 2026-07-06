'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, Heart, Tag, Eye, Info, Sparkles } from 'lucide-react';
import { PostMedia } from '@/lib/db';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface CarouselProps {
  media: PostMedia[];
  onDoubleTap?: () => void;
  focalAnchors?: string | null;
  layoutMatrix?: string | null;
  vectorTextPanel?: string | null;
}

interface FocalAnchor {
  x: number;
  y: number;
  category: string;
  label: string;
}

export default function Carousel({ 
  media, 
  onDoubleTap, 
  focalAnchors, 
  layoutMatrix, 
  vectorTextPanel 
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [showHeart, setShowHeart] = React.useState(false);
  const lastTapRef = React.useRef<number>(0);

  // 4. Focal Anchors State
  const parsedAnchors = React.useMemo<FocalAnchor[]>(() => {
    if (!focalAnchors) return [];
    try {
      return JSON.parse(focalAnchors);
    } catch {
      return [];
    }
  }, [focalAnchors]);

  const [activeAnchorIdx, setActiveAnchorIdx] = React.useState<number | null>(null);

  // 9. Micro-Interaction Media Scrubber State
  const [isScrubbing, setIsScrubbing] = React.useState(false);
  const [scrubProgress, setScrubProgress] = React.useState(0); // 0 to 100%
  const [scrubTime, setScrubTime] = React.useState(0); // 0 to 10 seconds
  const dragStartRef = React.useRef<number>(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Double tap handler
  const handleTap = (e: React.MouseEvent) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_PRESS_DELAY) {
      setShowHeart(true);
      if (onDoubleTap) onDoubleTap();
      setTimeout(() => {
        setShowHeart(false);
      }, 800);
    }
    lastTapRef.current = now;
  };

  // Scrubber actions
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    setIsScrubbing(true);
    dragStartRef.current = e.clientX;
    updateScrub(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isScrubbing) return;
    updateScrub(e.clientX);
  };

  const handleMouseUpOrLeave = () => {
    setIsScrubbing(false);
  };

  // Touch variants
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || e.touches.length === 0) return;
    setIsScrubbing(true);
    dragStartRef.current = e.touches[0].clientX;
    updateScrub(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isScrubbing || e.touches.length === 0) return;
    updateScrub(e.touches[0].clientX);
  };

  const updateScrub = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const percentage = (relativeX / rect.width) * 100;
    setScrubProgress(percentage);
    setScrubTime((percentage / 100) * 10.0); // 10s timeline
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    const slidesCount = totalSlides;
    setCurrentIndex(prev => (prev === 0 ? slidesCount - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    const slidesCount = totalSlides;
    setCurrentIndex(prev => (prev === slidesCount - 1 ? 0 : prev + 1));
  };

  // Determine total slides: media images + optional vector text panel (as an extra slide!)
  const showVectorPanel = !!vectorTextPanel?.trim();
  const totalSlides = media.length + (showVectorPanel ? 1 : 0);

  if (!media || media.length === 0) {
    return (
      <div className="w-full aspect-square bg-slate-900 flex items-center justify-center text-slate-500 font-mono text-xs uppercase">
        No Media Channel
      </div>
    );
  }

  // 7. Render simple, gorgeous vector text panel as markdown slide
  const renderVectorPanel = () => {
    if (!vectorTextPanel) return null;
    
    // Quick, robust line-by-line custom parser to avoid third-party NPM dependency bugs
    const lines = vectorTextPanel.split('\n');
    return (
      <div className="w-full h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 flex flex-col justify-between border border-violet-500/10 rounded-sm relative overflow-y-auto">
        
        {/* Neon decorative background accents */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,38,0.05)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

        <div className="flex flex-col gap-4 relative z-10">
          <div className="flex items-center gap-1.5 pb-2 border-b border-slate-800">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[10px] font-mono font-bold tracking-[0.25em] text-violet-400 uppercase">Vector Blog Panel</span>
          </div>

          <div className="flex flex-col gap-2.5 font-sans leading-relaxed text-slate-300 text-xs">
            {lines.map((line, idx) => {
              const trimmed = line.trim();
              if (trimmed.startsWith('#')) {
                // Header
                const title = trimmed.replace(/^#+\s*/, '');
                return (
                  <h3 key={idx} className="text-sm font-bold uppercase tracking-wider text-slate-100 mt-2 text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-300">
                    {title}
                  </h3>
                );
              }
              if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
                // List item
                const content = trimmed.replace(/^[-*]\s*/, '');
                return (
                  <div key={idx} className="flex gap-2 items-start pl-2 font-light">
                    <span className="text-violet-400 mt-1">•</span>
                    <span>{content}</span>
                  </div>
                );
              }
              if (trimmed.startsWith('`')) {
                // Code block
                const code = trimmed.replace(/`/g, '');
                return (
                  <code key={idx} className="block p-2.5 bg-black/60 border border-slate-850 rounded font-mono text-[10px] text-teal-400 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]">
                    {code}
                  </code>
                );
              }
              if (trimmed === '') return <div key={idx} className="h-2" />;
              
              // Standard paragraph
              return <p key={idx} className="font-light">{line}</p>;
            })}
          </div>
        </div>

        <div className="flex justify-between items-center border-t border-slate-900/80 pt-4 text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-4">
          <span>Pulse Vector Node</span>
          <span>CH #BLG</span>
        </div>
      </div>
    );
  };

  // 10. Geometric Stitch Layout Renders
  const renderGeometricStitch = () => {
    if (layoutMatrix === 'asymmetric-split' && media.length >= 2) {
      return (
        <div className="w-full h-full grid grid-cols-5 gap-1 bg-black p-0.5">
          <div className="col-span-3 relative overflow-hidden group/stitch">
            <img 
              src={media[0].url} 
              alt="Asymmetric Stitch Left" 
              className="w-full h-full object-cover select-none pointer-events-none hover:scale-102 transition-transform duration-300" 
            />
            <span className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/70 border border-slate-800/40 text-[8px] font-mono text-teal-400 rounded">
              CH #1
            </span>
          </div>
          <div className="col-span-2 relative overflow-hidden group/stitch">
            <img 
              src={media[1].url} 
              alt="Asymmetric Stitch Right" 
              className="w-full h-full object-cover select-none pointer-events-none hover:scale-102 transition-transform duration-300" 
            />
            <span className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/70 border border-slate-800/40 text-[8px] font-mono text-teal-400 rounded">
              CH #2
            </span>
          </div>
        </div>
      );
    }

    if (layoutMatrix === 'triptych' && media.length >= 3) {
      return (
        <div className="w-full h-full grid grid-cols-3 gap-1 bg-black p-0.5">
          {media.slice(0, 3).map((item, idx) => (
            <div key={item.id} className="relative overflow-hidden group/stitch">
              <img 
                src={item.url} 
                alt={`Triptych Panel ${idx + 1}`} 
                className="w-full h-full object-cover select-none pointer-events-none hover:scale-102 transition-transform duration-300" 
              />
              <span className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/70 border border-slate-800/40 text-[8px] font-mono text-teal-400 rounded">
                CH #{idx + 1}
              </span>
            </div>
          ))}
        </div>
      );
    }

    if (layoutMatrix === 'bento-grid' && media.length >= 3) {
      const isFour = media.length >= 4;
      if (isFour) {
        return (
          <div className="w-full h-full grid grid-cols-6 grid-rows-2 gap-1 bg-black p-0.5">
            {/* First main featured tall box */}
            <div className="col-span-3 row-span-2 relative overflow-hidden group/stitch">
              <img 
                src={media[0].url} 
                alt="Bento 1" 
                className="w-full h-full object-cover select-none pointer-events-none hover:scale-102 transition-transform duration-300" 
              />
              <span className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/70 border border-slate-800/40 text-[8px] font-mono text-teal-400 rounded">
                CH #1 [FEATURED]
              </span>
            </div>
            {/* Second and third stacked on top-right */}
            <div className="col-span-3 row-span-1 grid grid-cols-2 gap-1">
              <div className="relative overflow-hidden group/stitch w-full h-full">
                <img 
                  src={media[1].url} 
                  alt="Bento 2" 
                  className="w-full h-full object-cover select-none pointer-events-none hover:scale-102 transition-transform duration-300" 
                />
                <span className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/70 border border-slate-800/40 text-[8px] font-mono text-teal-400 rounded">
                  CH #2
                </span>
              </div>
              <div className="relative overflow-hidden group/stitch w-full h-full">
                <img 
                  src={media[2].url} 
                  alt="Bento 3" 
                  className="w-full h-full object-cover select-none pointer-events-none hover:scale-102 transition-transform duration-300" 
                />
                <span className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/70 border border-slate-800/40 text-[8px] font-mono text-teal-400 rounded">
                  CH #3
                </span>
              </div>
            </div>
            {/* Fourth wide block on bottom-right */}
            <div className="col-span-3 row-span-1 relative overflow-hidden group/stitch">
              <img 
                src={media[3].url} 
                alt="Bento 4" 
                className="w-full h-full object-cover select-none pointer-events-none hover:scale-102 transition-transform duration-300" 
              />
              <span className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/70 border border-slate-800/40 text-[8px] font-mono text-teal-400 rounded">
                CH #4
              </span>
            </div>
          </div>
        );
      } else {
        return (
          <div className="w-full h-full grid grid-cols-5 grid-rows-2 gap-1 bg-black p-0.5">
            {/* Left Featured tall box */}
            <div className="col-span-3 row-span-2 relative overflow-hidden group/stitch">
              <img 
                src={media[0].url} 
                alt="Bento Main" 
                className="w-full h-full object-cover select-none pointer-events-none hover:scale-102 transition-transform duration-300" 
              />
              <span className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/70 border border-slate-800/40 text-[8px] font-mono text-teal-400 rounded">
                CH #1 [FEATURED]
              </span>
            </div>
            {/* Top Right box */}
            <div className="col-span-2 row-span-1 relative overflow-hidden group/stitch">
              <img 
                src={media[1].url} 
                alt="Bento Secondary" 
                className="w-full h-full object-cover select-none pointer-events-none hover:scale-102 transition-transform duration-300" 
              />
              <span className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/70 border border-slate-800/40 text-[8px] font-mono text-teal-400 rounded">
                CH #2
              </span>
            </div>
            {/* Bottom Right box */}
            <div className="col-span-2 row-span-1 relative overflow-hidden group/stitch">
              <img 
                src={media[2].url} 
                alt="Bento Tertiary" 
                className="w-full h-full object-cover select-none pointer-events-none hover:scale-102 transition-transform duration-300" 
              />
              <span className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/70 border border-slate-800/40 text-[8px] font-mono text-teal-400 rounded">
                CH #3
              </span>
            </div>
          </div>
        );
      }
    }

    if (layoutMatrix === 'quad-split' && media.length >= 4) {
      return (
        <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-1 bg-black p-0.5">
          {media.slice(0, 4).map((item, idx) => (
            <div key={item.id} className="relative overflow-hidden group/stitch">
              <img 
                src={item.url} 
                alt={`Quad Split Panel ${idx + 1}`} 
                className="w-full h-full object-cover select-none pointer-events-none hover:scale-102 transition-transform duration-300" 
              />
              <span className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/70 border border-slate-800/40 text-[8px] font-mono text-teal-400 rounded">
                CH #{idx + 1}
              </span>
            </div>
          ))}
        </div>
      );
    }

    if (layoutMatrix === 'panoramic-film' && media.length >= 2) {
      return (
        <div className="w-full h-full flex flex-col gap-1.5 bg-black p-1.5 justify-center">
          {media.slice(0, 2).map((item, idx) => (
            <div key={item.id} className="relative h-[47%] overflow-hidden group/stitch border border-slate-900 rounded-sm">
              <img 
                src={item.url} 
                alt={`Panoramic Film Panel ${idx + 1}`} 
                className="w-full h-full object-cover select-none pointer-events-none hover:scale-102 transition-transform duration-300" 
              />
              <div className="absolute top-0 inset-x-0 h-1 bg-black" />
              <div className="absolute bottom-0 inset-x-0 h-1 bg-black" />
              <span className="absolute bottom-2 left-3 px-1.5 py-0.5 bg-black/85 border border-slate-800/40 text-[8px] font-mono text-amber-400 rounded">
                ANAMORPHIC // CH #{idx + 1}
              </span>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  // Determine whether we render the active standard slide, vector text slide, or layout stitch
  const isStitchedLayoutActive = 
    (layoutMatrix === 'asymmetric-split' && media.length >= 2) || 
    (layoutMatrix === 'triptych' && media.length >= 3) ||
    (layoutMatrix === 'bento-grid' && media.length >= 3) ||
    (layoutMatrix === 'quad-split' && media.length >= 4) ||
    (layoutMatrix === 'panoramic-film' && media.length >= 2);
  const isCurrentSlideVectorBlog = showVectorPanel && currentIndex === media.length;

  return (
    <div
      ref={containerRef}
      onClick={handleTap}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUpOrLeave}
      className="relative w-full aspect-square select-none overflow-hidden bg-black flex items-center justify-center group cursor-pointer"
    >
      {/* 9. Render Micro-Interaction Media Scrubber overlay laser lines during dragging */}
      {isScrubbing && (
        <div className="absolute inset-x-0 top-0 h-1 bg-slate-900/30 z-20 overflow-hidden pointer-events-none flex">
          <div 
            style={{ width: `${scrubProgress}%` }} 
            className="h-full bg-gradient-to-r from-violet-500 to-teal-400 shadow-[0_0_8px_#2dd4bf] transition-all duration-75"
          />
        </div>
      )}

      {isScrubbing && (
        <div className="absolute top-4 left-4 px-2 py-1 bg-black/80 border border-violet-500/20 backdrop-blur-md rounded text-[9px] font-mono text-teal-400 z-20 uppercase tracking-widest animate-pulse pointer-events-none">
          SCRUBBING FRAME: {scrubTime.toFixed(1)}s / 10.0s
        </div>
      )}

      {/* Main Display Box */}
      <div 
        className="w-full h-full transition-all duration-300"
        style={{
          filter: isScrubbing ? `brightness(${1 + (scrubProgress - 50) / 150}) contrast(1.15) saturate(1.2)` : 'none'
        }}
      >
        {isStitchedLayoutActive ? (
          renderGeometricStitch()
        ) : isCurrentSlideVectorBlog ? (
          renderVectorPanel()
        ) : (
          <div className="relative w-full h-full">
            <img
              src={media[currentIndex].url}
              alt={`Visual Content ${currentIndex + 1}`}
              className="w-full h-full object-cover select-none pointer-events-none"
              draggable={false}
              loading="lazy"
            />

            {/* 4. Overlay pulsing focal anchors on the active image slide */}
            {currentIndex === 0 && parsedAnchors.map((anchor, idx) => {
              const isActive = activeAnchorIdx === idx;
              return (
                <div
                  key={idx}
                  style={{ left: `${anchor.x}%`, top: `${anchor.y}%` }}
                  onMouseEnter={() => setActiveAnchorIdx(idx)}
                  onMouseLeave={() => setActiveAnchorIdx(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveAnchorIdx(isActive ? null : idx);
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer"
                >
                  <span className="absolute w-5 h-5 border-2 border-violet-500/50 rounded-full animate-ping pointer-events-none" />
                  <div className={cn(
                    "w-3 h-3 rounded-full border border-black shadow-md flex items-center justify-center transition-all duration-200",
                    isActive ? "bg-teal-400 scale-125" : "bg-violet-500 hover:bg-teal-400"
                  )}>
                    <Tag className="w-2 h-2 text-white pointer-events-none" />
                  </div>

                  {/* High Contrast glassmorphism tooltip info box */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-slate-950/90 border border-slate-800/80 backdrop-blur-md p-2 rounded shadow-[0_4px_12px_rgba(0,0,0,0.8)] text-[9px] flex flex-col w-32 z-30 pointer-events-none"
                      >
                        <div className="flex items-center gap-1 mb-0.5 border-b border-slate-900 pb-0.5">
                          <Info className="w-2.5 h-2.5 text-teal-400" />
                          <span className="font-bold text-teal-400 uppercase tracking-widest">{anchor.category}</span>
                        </div>
                        <span className="text-slate-200 font-medium leading-normal">{anchor.label}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
      {!isStitchedLayoutActive && totalSlides > 1 && (
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
      {!isStitchedLayoutActive && totalSlides > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/40 px-2.5 py-1.5 rounded backdrop-blur-sm border border-white/5">
          {Array.from({ length: totalSlides }).map((_, index) => (
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
      {!isStitchedLayoutActive && totalSlides > 1 && (
        <span className="absolute top-4 right-4 px-2 py-1 bg-black/65 text-[10px] font-mono font-bold tracking-wider text-slate-300 border border-white/5 rounded backdrop-blur-sm z-10">
          {currentIndex === media.length ? 'BLOG' : `${currentIndex + 1}/${media.length}`}
        </span>
      )}
    </div>
  );
}
