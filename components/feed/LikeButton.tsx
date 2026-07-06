'use client';

import * as React from 'react';
import { Heart } from 'lucide-react';
import { toggleLike } from '@/lib/actions';
import { cn } from '@/lib/utils';

interface LikeButtonProps {
  postId: string;
  initialHasLiked: boolean;
  initialLikesCount: number;
  onLikeChanged?: (hasLiked: boolean, count: number) => void;
}

export default function LikeButton({ postId, initialHasLiked, initialLikesCount, onLikeChanged }: LikeButtonProps) {
  const [hasLiked, setHasLiked] = React.useState(initialHasLiked);
  const [likesCount, setLikesCount] = React.useState(initialLikesCount);
  const [isPending, setIsPending] = React.useState(false);

  // Sync state if initial props change
  React.useEffect(() => {
    Promise.resolve().then(() => {
      setHasLiked(initialHasLiked);
      setLikesCount(initialLikesCount);
    });
  }, [initialHasLiked, initialLikesCount]);

  const handleLike = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (isPending) return;

    // Optimistic Update
    const originalHasLiked = hasLiked;
    const originalCount = likesCount;

    const nextHasLiked = !hasLiked;
    const nextCount = hasLiked ? likesCount - 1 : likesCount + 1;

    setHasLiked(nextHasLiked);
    setLikesCount(nextCount);
    if (onLikeChanged) {
      onLikeChanged(nextHasLiked, nextCount);
    }

    setIsPending(true);
    try {
      const res = await toggleLike(postId);
      if (res.success) {
        const updatedHasLiked = res.hasLiked ?? nextHasLiked;
        const updatedCount = res.likesCount ?? nextCount;
        setHasLiked(updatedHasLiked);
        setLikesCount(updatedCount);
        if (onLikeChanged && (updatedHasLiked !== nextHasLiked || updatedCount !== nextCount)) {
          onLikeChanged(updatedHasLiked, updatedCount);
        }
      } else {
        // Revert on error
        setHasLiked(originalHasLiked);
        setLikesCount(originalCount);
        if (onLikeChanged) {
          onLikeChanged(originalHasLiked, originalCount);
        }
      }
    } catch {
      setHasLiked(originalHasLiked);
      setLikesCount(originalCount);
      if (onLikeChanged) {
        onLikeChanged(originalHasLiked, originalCount);
      }
    } finally {
      setIsPending(false);
    }
  };

  // Expose triggers so double tap on carousels can fire it!
  React.useEffect(() => {
    const handleDoubleTapLike = (e: CustomEvent<{ postId: string }>) => {
      if (e.detail.postId === postId) {
        // Trigger like if and only if not liked already
        if (!hasLiked) {
          handleLike();
        }
      }
    };
    window.addEventListener('double-tap-like' as any, handleDoubleTapLike);
    return () => window.removeEventListener('double-tap-like' as any, handleDoubleTapLike);
  }, [postId, hasLiked, likesCount, isPending]);

  return (
    <button
      onClick={handleLike}
      className="flex items-center gap-2 group text-slate-400 hover:text-rose-400 transition-colors cursor-pointer active:scale-90"
    >
      <Heart
        className={cn(
          'w-5.5 h-5.5 transition-transform duration-300',
          hasLiked 
            ? 'text-rose-500 fill-rose-500 scale-110 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]' 
            : 'group-hover:scale-105 group-active:scale-95'
        )}
      />
      <span className={cn('text-xs font-mono font-bold', hasLiked ? 'text-rose-400' : 'text-slate-400')}>
        {likesCount}
      </span>
    </button>
  );
}
