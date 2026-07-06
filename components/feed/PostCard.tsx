'use client';

import * as React from 'react';
import Link from 'next/link';
import { MapPin, MessageSquare, Bookmark, ShieldAlert, Check, MoreHorizontal } from 'lucide-react';
import { FeedPost, toggleBookmark, toggleFollow, getCurrentUser } from '@/lib/actions';
import { User as UserType } from '@/lib/db';
import Carousel from './Carousel';
import LikeButton from './LikeButton';
import CommentSection from './CommentSection';
import { cn } from '@/lib/utils';

interface PostCardProps {
  post: FeedPost;
  onRefresh?: () => void;
}

export default function PostCard({ post, onRefresh }: PostCardProps) {
  const [currentUser, setCurrentUser] = React.useState<UserType | null>(null);
  const [isBookmarked, setIsBookmarked] = React.useState(post.hasBookmarked);
  const [isFollowing, setIsFollowing] = React.useState(post.isFollowing);
  const [followPending, setFollowPending] = React.useState(false);
  const [showComments, setShowComments] = React.useState(false);
  const [commentsCount, setCommentsCount] = React.useState(post.commentsCount);
  const [isCaptionExpanded, setIsCaptionExpanded] = React.useState(false);

  React.useEffect(() => {
    getCurrentUser().then(user => {
      if (user) setCurrentUser(user);
    });
  }, []);

  const handleBookmark = async () => {
    const original = isBookmarked;
    setIsBookmarked(!isBookmarked);
    try {
      const res = await toggleBookmark(post.id);
      if (res.success) {
        setIsBookmarked(res.hasBookmarked ?? !original);
      } else {
        setIsBookmarked(original);
      }
    } catch {
      setIsBookmarked(original);
    }
  };

  const handleFollow = async () => {
    if (followPending) return;
    setFollowPending(true);

    const original = isFollowing;
    setIsFollowing(!isFollowing);

    try {
      const res = await toggleFollow(post.userId);
      if (res.success) {
        setIsFollowing(res.isFollowing ?? !original);
      } else {
        setIsFollowing(original);
      }
    } catch {
      setIsFollowing(original);
    } finally {
      setFollowPending(false);
    }
  };

  const getRelativeTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[d.getMonth()]} ${d.getDate()}`;
    } catch {
      return '';
    }
  };

  // Helper to color hashtags and mentions in Caption text
  const renderCaption = (text: string | null) => {
    if (!text) return null;
    const parts = text.split(/(\s+)/);
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        return (
          <span key={index} className="text-violet-400 font-medium hover:underline cursor-pointer">
            {part}
          </span>
        );
      }
      if (part.startsWith('@')) {
        return (
          <span key={index} className="text-teal-400 font-medium hover:underline cursor-pointer">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const isSelf = currentUser?.id === post.userId;
  const isLongCaption = post.caption ? post.caption.length > 120 : false;
  const captionToShow = isLongCaption && !isCaptionExpanded 
    ? `${post.caption?.substring(0, 120)}...` 
    : post.caption;

  return (
    <article className="w-full bg-slate-950 border border-slate-900 rounded overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.6)] flex flex-col hover:border-slate-800/80 transition-all duration-300">
      
      {/* CARD HEADER */}
      <div className="flex items-center justify-between p-4 bg-slate-950">
        <div className="flex items-center gap-3">
          <Link href={`/${post.username}`} className="relative group">
            <img
              src={post.avatarUrl || 'https://picsum.photos/seed/placeholder/100/100'}
              alt={post.username}
              className="w-10 h-10 rounded object-cover border border-slate-800 group-hover:border-violet-500/50 transition-colors"
            />
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <Link href={`/${post.username}`} className="text-xs font-bold text-slate-100 hover:text-violet-400 transition-colors leading-none">
                {post.username}
              </Link>
              <span className="text-[10px] font-mono text-slate-600">•</span>
              <span className="text-[10px] font-mono text-slate-500">{getRelativeTime(post.createdAt)}</span>
            </div>
            
            {/* Location tag with geolocation pin */}
            {post.location && (
              <div className="flex items-center gap-1 mt-1 text-[10px] font-medium text-slate-500">
                <MapPin className="w-3 h-3 text-teal-400/80" />
                <span>{post.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Follow CTA or Self visual tag */}
        {currentUser && !isSelf && (
          <button
            onClick={handleFollow}
            disabled={followPending}
            className={cn(
              'px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer rounded-sm',
              isFollowing
                ? 'bg-slate-900 text-slate-500 border border-slate-800'
                : 'bg-violet-600/15 hover:bg-violet-600/35 text-violet-300 hover:text-white border border-violet-500/20 shadow-[0_0_15px_rgba(124,58,237,0.1)]'
            )}
          >
            {isFollowing ? 'Pulse Sync' : 'Sync User'}
          </button>
        )}

        {isSelf && (
          <span className="text-[9px] font-bold tracking-wider uppercase bg-teal-950/40 border border-teal-900/60 text-teal-400 px-2 py-1 rounded-sm">
            My Pulse
          </span>
        )}
      </div>

      {/* MEDIA CAROUSEL MIDDLE */}
      <Carousel
        media={post.media}
        onDoubleTap={() => {
          // Double-tapping triggers standard custom event
          const event = new CustomEvent('double-tap-like', { detail: { postId: post.id } });
          window.dispatchEvent(event);
        }}
      />

      {/* INTERACTIONS BAR */}
      <div className="flex items-center justify-between p-4 bg-slate-950">
        <div className="flex items-center gap-5">
          {/* LikeButton (Dynamic Optimistic) */}
          <LikeButton
            postId={post.id}
            initialHasLiked={post.hasLiked}
            initialLikesCount={post.likesCount}
          />

          {/* Comment Section Toggle */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 text-slate-400 hover:text-violet-400 transition-colors cursor-pointer active:scale-95 group"
          >
            <MessageSquare className="w-5.5 h-5.5 group-hover:scale-105 transition-transform" />
            <span className="text-xs font-mono font-bold">{commentsCount}</span>
          </button>
        </div>

        {/* Bookmark post */}
        <button
          onClick={handleBookmark}
          className="text-slate-400 hover:text-teal-400 transition-colors cursor-pointer active:scale-90"
        >
          <Bookmark
            className={cn(
              'w-5.5 h-5.5 transition-transform duration-200',
              isBookmarked ? 'text-teal-400 fill-teal-400 scale-105 drop-shadow-[0_0_8px_rgba(20,184,166,0.5)]' : ''
            )}
          />
        </button>
      </div>

      {/* CAPTION DESCRIPTION */}
      {post.caption && (
        <div className="px-4 pb-4 bg-slate-950">
          <p className="text-xs text-slate-300 leading-relaxed font-light">
            <span className="font-bold text-slate-100 mr-2 hover:text-violet-400 transition-colors">
              {post.username}
            </span>
            {renderCaption(captionToShow)}
            {isLongCaption && (
              <button
                onClick={() => setIsCaptionExpanded(!isCaptionExpanded)}
                className="text-[10px] font-bold text-slate-500 hover:text-slate-300 ml-1 uppercase tracking-wider cursor-pointer transition-colors"
              >
                {isCaptionExpanded ? 'Collapse' : 'More'}
              </button>
            )}
          </p>
        </div>
      )}

      {/* COMMENT SHEET OVERLAY */}
      {showComments && (
        <div className="px-4 pb-4 border-t border-slate-900 bg-slate-950/50">
          <CommentSection
            postId={post.id}
            onCommentCountChanged={(count) => {
              setCommentsCount(count);
              if (onRefresh) onRefresh();
            }}
          />
        </div>
      )}

    </article>
  );
}
