'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Grid, Bookmark, BarChart3, Users, Image as ImageIcon, Heart, MessageSquare, ExternalLink, ShieldAlert, Sparkles, Loader2, RefreshCw, Archive, FolderHeart, Activity } from 'lucide-react';
import { getUserProfile, getCreatorAnalytics, toggleFollow, getCurrentUser, ProfileDetails, CreatorAnalytics, getNarrativeVault } from '@/lib/actions';
import { User as UserType, Story } from '@/lib/db';
import { Dialog } from '@/components/ui/Dialog';
import PostCard from '@/components/feed/PostCard';
import StoryViewer from '@/components/stories/StoryViewer';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import MemoryLanes from '@/components/profile/MemoryLanes';

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params?.username as string;

  const [currentUser, setCurrentUser] = React.useState<UserType | null>(null);
  const [profile, setProfile] = React.useState<ProfileDetails | null>(null);
  const [analytics, setAnalytics] = React.useState<CreatorAnalytics | null>(null);
  const [vaultStories, setVaultStories] = React.useState<Story[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [followPending, setFollowPending] = React.useState(false);

  // Active Tab: 'posts' | 'bookmarks' | 'analytics' | 'vault' | 'organizers'
  const [activeTab, setActiveTab] = React.useState<'posts' | 'bookmarks' | 'analytics' | 'vault' | 'organizers'>('posts');

  // Story Viewer Modal trigger for highlight preview
  const [activeHighlightIndex, setActiveHighlightIndex] = React.useState<number | null>(null);

  // Selected post detail dialog
  const [selectedPostId, setSelectedPostId] = React.useState<string | null>(null);

  const fetchProfileData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const me = await getCurrentUser();
      if (me) setCurrentUser(me);

      const data = await getUserProfile(username);
      if (data) {
        setProfile(data);
        // Fetch analytics
        const stats = await getCreatorAnalytics(data.user.id);
        setAnalytics(stats);
        // Fetch narrative vault highlights
        const vault = await getNarrativeVault(username);
        setVaultStories(vault);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  React.useEffect(() => {
    if (username) {
      Promise.resolve().then(() => {
        fetchProfileData();
      });
    }
  }, [username]);

  const handleFollow = async () => {
    if (!profile || followPending) return;
    setFollowPending(true);

    const originalFollowing = profile.isFollowing;
    const originalFollowersCount = profile.followersCount;

    // Optimistic state
    setProfile(prev => {
      if (!prev) return null;
      return {
        ...prev,
        isFollowing: !prev.isFollowing,
        followersCount: prev.isFollowing ? prev.followersCount - 1 : prev.followersCount + 1,
      };
    });

    try {
      const res = await toggleFollow(profile.user.id);
      if (res.success) {
        // Sync complete state
        await fetchProfileData(true);
      } else {
        // Revert on failure
        setProfile(prev => {
          if (!prev) return null;
          return {
            ...prev,
            isFollowing: originalFollowing,
            followersCount: originalFollowersCount,
          };
        });
      }
    } catch {
      setProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          isFollowing: originalFollowing,
          followersCount: originalFollowersCount,
        };
      });
    } finally {
      setFollowPending(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center text-slate-500 font-mono gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
        <span>Porting user coordinates...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="w-full max-w-md mx-auto px-6 py-16 text-center flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full bg-rose-950/40 border border-rose-900/40 flex items-center justify-center text-rose-400">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-200">Identity Not Found</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          The requested profile namespace &quot;@{username}&quot; does not exist on the VividPulse registry. Verify the handle and try again.
        </p>
        <Button onClick={() => router.push('/feed')} size="sm">
          Return to Feed
        </Button>
      </div>
    );
  }

  const { user, postsCount, followersCount, followingCount, isFollowing, isSelf, posts, bookmarks } = profile;

  // Selected fully hydrated FeedPost to display inside Dialog
  const selectedPost = (activeTab === 'posts' ? posts : bookmarks).find(p => p.id === selectedPostId);

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-10 flex flex-col gap-8">
      
      {/* 1. DYNAMIC PROFILE HEADER DESCRIPTION */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 pb-8 border-b border-slate-900/60 bg-slate-950/30 p-6 rounded border border-slate-900/40">
        
        {/* Avatar */}
        <div className="relative w-24 h-24 md:w-28 md:h-28 rounded flex-shrink-0 bg-gradient-to-tr from-violet-600 to-teal-400 p-[3px] shadow-[0_0_20px_rgba(124,58,237,0.2)]">
          <div className="w-full h-full rounded bg-slate-950 p-[3px]">
            <img
              src={user.avatarUrl || 'https://picsum.photos/seed/placeholder/150/150'}
              alt={user.displayName}
              className="w-full h-full rounded object-cover"
            />
          </div>
        </div>

        {/* User metadata & description */}
        <div className="flex-1 flex flex-col items-center md:items-start gap-4 text-center md:text-left min-w-0">
          
          <div className="flex flex-col md:flex-row md:items-center gap-3 w-full justify-between">
            <div className="flex flex-col">
              <h1 className="text-base font-bold text-slate-100 leading-none mb-1.5">{user.displayName}</h1>
              <span className="text-xs font-mono text-slate-500">@{user.username}</span>
            </div>

            {/* Actions: Follow CTA, Edit Profile (disabled visual only for self), or DM button */}
            <div className="flex items-center gap-2 mt-2 md:mt-0">
              {isSelf ? (
                <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 bg-teal-950/30 border border-teal-900/60 text-teal-400 rounded-sm">
                  Authorized Owner Port
                </span>
              ) : (
                <>
                  <Button
                    onClick={handleFollow}
                    disabled={followPending}
                    variant={isFollowing ? 'outline' : 'primary'}
                    size="sm"
                    className="h-8.5 font-bold uppercase tracking-wider text-[10px] px-4 rounded-sm"
                  >
                    {isFollowing ? 'Sync Active' : 'Establish Link'}
                  </Button>

                  <Button
                    onClick={() => router.push('/messages')}
                    variant="secondary"
                    size="sm"
                    className="h-8.5 font-bold uppercase tracking-wider text-[10px] px-4 rounded-sm border-slate-800 hover:border-slate-700"
                  >
                    Message
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Core numerical stats */}
          <div className="flex items-center gap-6 mt-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-mono font-bold text-slate-100">{postsCount}</span>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">pulses</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-mono font-bold text-slate-100">{followersCount}</span>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">followers</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-mono font-bold text-slate-100">{followingCount}</span>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">following</span>
            </div>
          </div>

          {/* Description biography */}
          {user.bio && (
            <p className="text-xs text-slate-300 font-light leading-relaxed max-w-lg mt-1">
              {user.bio}
            </p>
          )}

          {/* Website link */}
          {user.website && (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-teal-400 hover:text-teal-300 hover:underline cursor-pointer">
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="font-mono">{user.website}</span>
            </div>
          )}

        </div>
      </div>

      {/* 2. TABBED NAVIGATION */}
      <div className="flex border-b border-slate-900/60 justify-center md:justify-start gap-8 bg-slate-950/20 px-4 py-2 rounded">
        
        {/* Posts Grid Tab */}
        <button
          onClick={() => setActiveTab('posts')}
          className={cn(
            'flex items-center gap-2 py-2 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all',
            activeTab === 'posts'
              ? 'border-violet-500 text-violet-400 shadow-[0_4px_10px_rgba(124,58,237,0.05)]'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          )}
        >
          <Grid className="w-4 h-4" />
          <span>Post Grid</span>
        </button>

        {/* Bookmarks Tab (Only visible to owner) */}
        {isSelf && (
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={cn(
              'flex items-center gap-2 py-2 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all',
              activeTab === 'bookmarks'
                ? 'border-violet-500 text-violet-400 shadow-[0_4px_10px_rgba(124,58,237,0.05)]'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            )}
          >
            <Bookmark className="w-4 h-4" />
            <span>Saved Pulses</span>
          </button>
        )}

        {/* Creator Analytics Tab (Premium metrics!) */}
        <button
          onClick={() => setActiveTab('analytics')}
          className={cn(
            'flex items-center gap-2 py-2 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all',
            activeTab === 'analytics'
              ? 'border-violet-500 text-violet-400 shadow-[0_4px_10px_rgba(124,58,237,0.05)]'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          )}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Creator Insights</span>
        </button>

        {/* Narrative Vault Highlights Tab (Feature 19) */}
        <button
          onClick={() => setActiveTab('vault')}
          className={cn(
            'flex items-center gap-2 py-2 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all',
            activeTab === 'vault'
              ? 'border-violet-500 text-violet-400 shadow-[0_4px_10px_rgba(124,58,237,0.05)]'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          )}
        >
          <Archive className="w-4 h-4" />
          <span>Narrative Vault</span>
        </button>

        {/* Memory Lanes Organizers Tab (Batch 6) */}
        <button
          onClick={() => setActiveTab('organizers')}
          className={cn(
            'flex items-center gap-2 py-2 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all',
            activeTab === 'organizers'
              ? 'border-teal-400 text-teal-300 shadow-[0_4px_10px_rgba(20,184,166,0.05)]'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          )}
        >
          <FolderHeart className="w-4 h-4" />
          <span>Memory Lanes</span>
        </button>
      </div>

      {/* 3. ACTIVE TAB CONTENT VIEW */}
      <div className="w-full">
        {activeTab === 'posts' && (
          posts.length === 0 ? (
            <div className="w-full py-16 text-center border border-dashed border-slate-900 rounded bg-slate-950/20 text-slate-600 flex flex-col items-center justify-center gap-2">
              <ImageIcon className="w-8 h-8 text-slate-800" />
              <span className="text-xs font-mono uppercase tracking-widest text-slate-500">Grid Unpublished</span>
              <span className="text-[10px] text-slate-600">This creator has not broadcasted any pulses yet.</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 md:gap-4 auto-rows-auto">
              {posts.map((p, idx) => {
                let gridClass = 'col-span-1 aspect-square';
                if (p.layoutMatrix === 'asymmetric-split') {
                  gridClass = 'col-span-2 aspect-[16/10]';
                } else if (p.layoutMatrix === 'triptych') {
                  gridClass = 'col-span-2 aspect-[21/9]';
                } else if (idx % 6 === 1) {
                  gridClass = 'col-span-1 aspect-[3/4]'; // Tall vertical format
                } else if (idx % 6 === 3) {
                  gridClass = 'col-span-2 aspect-[16/9]'; // Wide panoramic format
                }

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPostId(p.id)}
                    className={cn(
                      "relative bg-slate-950 border border-slate-900 rounded overflow-hidden group cursor-pointer hover:border-violet-500/50 hover:shadow-[0_0_15px_rgba(124,58,237,0.15)] transition-all duration-300",
                      gridClass
                    )}
                  >
                    <img
                      src={p.media[0]?.url || 'https://picsum.photos/seed/placeholder/300/300'}
                      alt="Post Media Cover"
                      className="w-full h-full object-cover select-none group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 backdrop-blur-[2px] transition-all flex justify-center items-center gap-4 text-white">
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                        <span className="font-mono text-xs font-bold">{p.likesCount}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4 text-violet-400 fill-violet-400/20" />
                        <span className="font-mono text-xs font-bold">{p.commentsCount}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {activeTab === 'bookmarks' && isSelf && (
          bookmarks.length === 0 ? (
            <div className="w-full py-16 text-center border border-dashed border-slate-900 rounded bg-slate-950/20 text-slate-600 flex flex-col items-center justify-center gap-2">
              <Bookmark className="w-8 h-8 text-slate-800" />
              <span className="text-xs font-mono uppercase tracking-widest text-slate-500">Vault Empty</span>
              <span className="text-[10px] text-slate-600">Saved content or bookmarked coordinates will appear here.</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 md:gap-4 auto-rows-auto">
              {bookmarks.map((p, idx) => {
                let gridClass = 'col-span-1 aspect-square';
                if (p.layoutMatrix === 'asymmetric-split') {
                  gridClass = 'col-span-2 aspect-[16/10]';
                } else if (p.layoutMatrix === 'triptych') {
                  gridClass = 'col-span-2 aspect-[21/9]';
                } else if (idx % 6 === 1) {
                  gridClass = 'col-span-1 aspect-[3/4]';
                } else if (idx % 6 === 3) {
                  gridClass = 'col-span-2 aspect-[16/9]';
                }

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPostId(p.id)}
                    className={cn(
                      "relative bg-slate-950 border border-slate-900 rounded overflow-hidden group cursor-pointer hover:border-violet-500/50 hover:shadow-[0_0_15px_rgba(124,58,237,0.15)] transition-all duration-300",
                      gridClass
                    )}
                  >
                    <img
                      src={p.media[0]?.url || 'https://picsum.photos/seed/placeholder/300/300'}
                      alt="Post Media Cover"
                      className="w-full h-full object-cover select-none group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 backdrop-blur-[2px] transition-all flex justify-center items-center gap-4 text-white">
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                        <span className="font-mono text-xs font-bold">{p.likesCount}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4 text-violet-400 fill-violet-400/20" />
                        <span className="font-mono text-xs font-bold">{p.commentsCount}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {activeTab === 'analytics' && analytics && (
          <div className="flex flex-col gap-6">
            {/* Numerical Grid cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-950 border border-slate-900 rounded flex flex-col gap-1.5 shadow-md">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Direct Appreciations</span>
                <span className="text-lg font-mono font-bold text-rose-400">{analytics.totalLikes} likes</span>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-900 rounded flex flex-col gap-1.5 shadow-md">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Signal Comments</span>
                <span className="text-lg font-mono font-bold text-violet-400">{analytics.totalComments} replies</span>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-900 rounded flex flex-col gap-1.5 shadow-md">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Average Engagement</span>
                <span className="text-lg font-mono font-bold text-teal-400">{analytics.avgEngagementRate} pts</span>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-900 rounded flex flex-col gap-1.5 shadow-md">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Audience Growth</span>
                <span className="text-lg font-mono font-bold text-slate-200">+{followersCount} subscribers</span>
              </div>
            </div>

            {/* In-depth details (top performing post + lists) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              
              {/* Left: Growth metrics items */}
              <div className="p-5 bg-slate-950 border border-slate-900 rounded flex flex-col gap-4 shadow-md">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 pb-2 border-b border-slate-900/60 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-violet-400" />
                  Performance Metrics
                </h3>
                <div className="flex flex-col gap-3">
                  {analytics.growthMetrics.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1.5 border-b border-slate-900/30 text-xs font-mono">
                      <span className="text-slate-500">{item.label}</span>
                      <span className="text-slate-200 font-bold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Top performing post detail */}
              <div className="p-5 bg-slate-950 border border-slate-900 rounded flex flex-col gap-4 shadow-md">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 pb-2 border-b border-slate-900/60 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  Peak Performance Content
                </h3>
                {analytics.topPerformingPost ? (
                  <div
                    onClick={() => setSelectedPostId(analytics.topPerformingPost!.id)}
                    className="flex gap-4 group cursor-pointer"
                  >
                    <img
                      src={analytics.topPerformingPost.imageUrl}
                      alt="Top performing post"
                      className="w-20 h-20 rounded object-cover border border-slate-900 group-hover:border-violet-500/50 transition-colors"
                    />
                    <div className="flex flex-col justify-between min-w-0 flex-1">
                      <p className="text-xs text-slate-400 truncate leading-relaxed italic font-light">
                        &quot;{analytics.topPerformingPost.caption || 'No caption.'}&quot;
                      </p>
                      <div className="flex gap-4 mt-2 font-mono text-[10px] font-bold">
                        <span className="text-rose-400">{analytics.topPerformingPost.likesCount} Likes</span>
                        <span className="text-violet-400">{analytics.topPerformingPost.commentsCount} Comments</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-slate-600 font-mono">Insufficient data packets received.</span>
                )}
              </div>

            </div>
          </div>
        )}

        {activeTab === 'vault' && (
          vaultStories.length === 0 ? (
            <div className="w-full py-16 text-center border border-dashed border-slate-900 rounded bg-slate-950/20 text-slate-600 flex flex-col items-center justify-center gap-2">
              <Archive className="w-8 h-8 text-slate-800 animate-bounce" />
              <span className="text-xs font-mono uppercase tracking-widest text-slate-500">Vault Highlights Empty</span>
              <span className="text-[10px] text-slate-600 max-w-xs leading-relaxed">
                Tag your live stories with **#hashtags** (e.g. #art, #code) during creation to auto-route them into permanent Narrative Vault categories on your profile!
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {/* Introduction card */}
              <div className="p-4 bg-slate-900/30 border border-slate-900 rounded flex gap-3.5 items-start">
                <Activity className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0 animate-pulse" />
                <div className="flex flex-col gap-1 text-xs">
                  <span className="font-bold text-slate-200">Programmatic Routing Engine</span>
                  <span className="text-slate-500 font-light leading-relaxed">
                    VividPulse automatically listens for hashtag patterns in expiring content. Once detected, the update packets are permanently moved and indexed in your local Narrative Vault workspace.
                  </span>
                </div>
              </div>

              {/* Grouped Folders list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(
                  vaultStories.reduce((groups: { [key: string]: { story: Story; originalIndex: number }[] }, story, idx) => {
                    story.hashtags?.forEach(tag => {
                      if (!groups[tag]) groups[tag] = [];
                      groups[tag].push({ story, originalIndex: idx });
                    });
                    return groups;
                  }, {})
                ).map(([tag, items]) => (
                  <div key={tag} className="p-5 bg-slate-950 border border-slate-900 rounded-lg flex flex-col gap-4 shadow-lg hover:border-teal-500/30 transition-all">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-900/60">
                      <span className="text-xs font-mono font-bold text-teal-400 uppercase tracking-wider">📁 {tag} Category</span>
                      <span className="text-[9px] font-mono text-slate-500">{items.length} archives saved</span>
                    </div>

                    {/* Horizontal preview of archived stories */}
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                      {items.map(({ story, originalIndex }) => (
                        <div
                          key={story.id}
                          onClick={() => setActiveHighlightIndex(originalIndex)}
                          className="relative w-16 h-24 rounded border border-slate-800 hover:border-teal-500 overflow-hidden flex-shrink-0 cursor-pointer group transition-all"
                        >
                          {/* Background gradient or image preview */}
                          {story.mediaUrl.startsWith('GRADIENT:') ? (
                            <div className={cn("absolute inset-0 flex items-center justify-center text-[18px]", 
                              story.mediaUrl.replace('GRADIENT:', '') === 'neon-violet' ? 'bg-gradient-to-tr from-violet-950 to-slate-900' : 'bg-slate-900'
                            )}>
                              🧬
                            </div>
                          ) : (
                            <img src={story.mediaUrl} alt="Archive" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-end justify-center p-1">
                            <span className="text-[7px] font-mono font-bold text-slate-300 group-hover:text-white truncate">
                              {story.mediaType}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        {activeTab === 'organizers' && (
          <MemoryLanes username={username} isSelf={isSelf} currentUser={currentUser} />
        )}
      </div>

      {/* DETAILED HYDRATED POST POPUP DIALOG */}
      <Dialog
        isOpen={selectedPostId !== null}
        onClose={() => setSelectedPostId(null)}
        className="max-w-xl border-slate-800"
      >
        {selectedPost && (
          <PostCard
            post={selectedPost}
            onRefresh={async () => {
              // Reload fully hydrated profile detail silently
              await fetchProfileData(true);
            }}
          />
        )}
      </Dialog>

      {/* NARRATIVE VAULT HIGHLIGHT IMMERSIVE STORY VIEWER */}
      {activeHighlightIndex !== null && vaultStories.length > 0 && (
        <StoryViewer
          trays={[{
            userId: user.id,
            username: user.username,
            avatarUrl: user.avatarUrl,
            stories: [vaultStories[activeHighlightIndex]]
          }]}
          initialUserIndex={0}
          isOpen={activeHighlightIndex !== null}
          onClose={() => setActiveHighlightIndex(null)}
        />
      )}

    </div>
  );
}
