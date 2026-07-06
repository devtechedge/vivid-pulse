'use client';

import * as React from 'react';
import { Search, Heart, MessageSquare, Compass, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { getDiscoverPosts, DiscoverPost, getFeed, FeedPost } from '@/lib/actions';
import { Dialog } from '@/components/ui/Dialog';
import PostCard from '@/components/feed/PostCard';
import { cn } from '@/lib/utils';

export default function DiscoverPage() {
  const [posts, setPosts] = React.useState<DiscoverPost[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [debounceTimeout, setDebounceTimeout] = React.useState<NodeJS.Timeout | null>(null);

  // Selected Post Details Dialog Modal
  const [selectedPost, setSelectedPost] = React.useState<FeedPost | null>(null);
  const [loadingPost, setLoadingPost] = React.useState(false);

  const fetchDiscover = async (query = '') => {
    setLoading(true);
    try {
      const data = await getDiscoverPosts(query);
      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    Promise.resolve().then(() => {
      fetchDiscover();
    });
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    // Clear old timeout for debounce
    if (debounceTimeout) clearTimeout(debounceTimeout);

    const nextTimeout = setTimeout(() => {
      fetchDiscover(val);
    }, 400); // 400ms debounce
    setDebounceTimeout(nextTimeout);
  };

  const handleOpenPostDetails = async (postId: string) => {
    setLoadingPost(true);
    try {
      // Find post by ID using feed fetcher (fetches complete hydrated FeedPost format)
      const feedRes = await getFeed(undefined, 100); // Safe fetch range
      const found = feedRes.posts.find(p => p.id === postId);
      if (found) {
        setSelectedPost(found);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPost(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-8 flex flex-col gap-8">
      
      {/* 1. DISCOVERY HEADER & DEBOUNCED SEARCH */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-violet-600/15 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-100">Algorithmic Grid</h1>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Explore curated high-contrast visuals</span>
          </div>
        </div>

        {/* Search Input Box */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-600" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search hashtags, locations, profiles..."
            className="w-full bg-slate-900/60 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 pl-10 pr-4 py-3 rounded outline-none focus:border-violet-500/80 focus:bg-slate-900 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"
          />
          {loading && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-500" />
            </div>
          )}
        </div>
      </div>

      {/* 2. MASONRY GEOMETRIC GRID INTERFACE */}
      {loading && posts.length === 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={cn(
                'bg-slate-950 border border-slate-900 rounded animate-pulse',
                i % 3 === 0 ? 'aspect-[3/4]' : 'aspect-square'
              )}
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="w-full bg-slate-950 border border-slate-900 rounded p-12 text-center flex flex-col items-center justify-center gap-3">
          <Sparkles className="w-8 h-8 text-slate-700 animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">No signals matching &quot;{searchQuery}&quot;</h3>
          <p className="text-[11px] text-slate-600 max-w-xs">
            Refine your query parameters to extract coordinates, profile namespaces, or hashtags.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              fetchDiscover();
            }}
            className="mt-2 text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Clear Coordinates
          </button>
        </div>
      ) : (
        <div className="columns-2 md:columns-3 gap-4 space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              onClick={() => handleOpenPostDetails(post.id)}
              className="relative break-inside-avoid bg-slate-950 border border-slate-900 rounded overflow-hidden group cursor-pointer hover:border-violet-500/50 hover:shadow-[0_0_20px_rgba(124,58,237,0.15)] transition-all duration-300"
            >
              {/* Media image */}
              <img
                src={post.imageUrl}
                alt={post.caption || 'Discover Content'}
                className="w-full h-auto object-cover select-none group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />

              {/* Glassmorphic overlay details on hover */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 backdrop-blur-sm transition-all duration-300 flex flex-col justify-center items-center gap-4 text-white p-4">
                <div className="flex gap-6">
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-5 h-5 text-rose-500 fill-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                    <span className="font-mono text-sm font-bold">{post.likesCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-5 h-5 text-violet-400 fill-violet-400/20" />
                    <span className="font-mono text-sm font-bold">{post.commentsCount}</span>
                  </div>
                </div>
                
                {/* Author attribution */}
                <div className="text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Author</span>
                  <span className="text-xs font-bold text-teal-300">@{post.authorUsername}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FULL HYDRATED DETAIL MODAL DIALOG */}
      <Dialog
        isOpen={selectedPost !== null}
        onClose={() => setSelectedPost(null)}
        className="max-w-xl border-slate-800"
      >
        {selectedPost && (
          <PostCard
            post={selectedPost}
            onRefresh={async () => {
              // Reload fully hydrated detail view silently on like/comment changes
              const discoverPosts = await getFeed(undefined, 100);
              const reloaded = discoverPosts.posts.find(p => p.id === selectedPost.id);
              if (reloaded) {
                setSelectedPost(reloaded);
              }
            }}
          />
        )}
      </Dialog>

    </div>
  );
}
