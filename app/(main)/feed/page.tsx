'use client';

import * as React from 'react';
import { getFeed, FeedPost, getCurrentUser } from '@/lib/actions';
import { User as UserType } from '@/lib/db';
import PostCard from '@/components/feed/PostCard';
import StoryTray from '@/components/stories/StoryTray';
import { Loader2, RefreshCw, Layers, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function FeedPage() {
  const [posts, setPosts] = React.useState<FeedPost[]>([]);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<UserType | null>(null);

  const loadInitialFeed = async () => {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      if (user) setCurrentUser(user);

      const res = await getFeed(undefined, 5);
      setPosts(res.posts);
      setNextCursor(res.nextCursor);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMorePosts = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await getFeed(nextCursor, 5);
      setPosts(prev => [...prev, ...res.posts]);
      setNextCursor(res.nextCursor);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  React.useEffect(() => {
    Promise.resolve().then(() => {
      loadInitialFeed();
    });
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 flex flex-col gap-8">
      
      {/* 1. EPHEMERAL STORY BAR TRAY */}
      <StoryTray />

      {/* 2. CORE FEED CONTROL TIMELINE */}
      <div className="flex flex-col gap-6">
        {loading ? (
          // Infinite Feed Loader Skeletal placeholder
          <div className="flex flex-col gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="w-full h-96 bg-slate-950 border border-slate-900 rounded p-4 flex flex-col gap-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-slate-900" />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="w-24 h-3 bg-slate-900 rounded" />
                    <div className="w-16 h-2 bg-slate-900 rounded" />
                  </div>
                </div>
                <div className="flex-1 bg-slate-900 rounded" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          // Structural Empty State with call-to-action
          <div className="w-full bg-slate-950 border border-slate-900 rounded p-12 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-2">
              <Sparkles className="w-6 h-6 animate-bounce" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">No posts to show yet</h3>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              No posts found here. Share your first photo or follow your friends to see their updates!
            </p>
            <div className="flex items-center gap-3 mt-2">
              <Button onClick={() => window.location.reload()} variant="outline" size="sm" className="gap-2">
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh Page
              </Button>
            </div>
          </div>
        ) : (
          // Live Render Feed Card Timeline
          <div className="flex flex-col gap-6">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onRefresh={async () => {
                  // Reload specific states or full feed silently
                  const res = await getFeed(undefined, posts.length);
                  setPosts(res.posts);
                }}
              />
            ))}

            {/* Pagination CTA */}
            {nextCursor && (
              <div className="flex justify-center pt-4">
                <Button
                  onClick={loadMorePosts}
                  disabled={loadingMore}
                  variant="outline"
                  className="gap-2 px-8 py-2 border-slate-900 hover:border-violet-500/40 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-all shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Loading More Posts...
                    </>
                  ) : (
                    <>
                      <Layers className="w-3.5 h-3.5 text-violet-400" />
                      See More Posts
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
