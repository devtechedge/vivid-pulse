"use client";

import React, { useState, useEffect } from 'react';
import { useAccessibility } from '@/components/ui/AccessibilityProvider';
import { MemoryLanes } from '@/components/profile/MemoryLanes';
import { AccessibleCurations } from '@/components/discover/AccessibleCurations';
import { 
  Heart, Sparkles, Plus, Image as ImageIcon, Volume2, 
  HelpCircle, Home, Archive, Compass, Moon, Sun, Monitor, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Post {
  id: string;
  author: string;
  title: string;
  content: string;
  category: string;
  imageUrl?: string;
  likes: number;
  comments: string[];
  createdAt: string;
}

const INITIAL_POSTS: Post[] = [
  {
    id: 'p1',
    author: 'Lily Green',
    title: 'Sunny Marigolds in Bloom! 🌼',
    content: 'We planted these seeds near the front porch back in April. Today they burst into glorious yellow! Arthur took a photo to show Grandpa.',
    category: 'Garden Bloomer',
    imageUrl: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=600&q=80',
    likes: 4,
    comments: ['Beautiful blooms!', 'Can’t wait to smell them!'],
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString() // 2h ago
  },
  {
    id: 'p2',
    author: 'Grandma Green',
    title: 'Accordion Melodies in the Attic 🎵',
    content: 'Found Grandpa’s old maritime accordion tucked inside the traveling leather chest today. Strummed a few nostalgic harbor chords. Arthur sat on the floor and listened for an hour.',
    category: 'Attic Relic',
    imageUrl: 'https://images.unsplash.com/photo-1552422535-c45813c61732?w=600&q=80',
    likes: 6,
    comments: ['I remember that song!', 'Cozy afternoon!'],
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString() // 18h ago
  }
];

export default function Page() {
  const { 
    isEasyMode, setIsEasyMode, 
    isHighContrast, setIsHighContrast, 
    fontSizeMultiplier, setFontSizeMultiplier, 
    isReadAloudEnabled, setIsReadAloudEnabled, 
    speak 
  } = useAccessibility();

  // Active view tabs
  const [activeTab, setActiveTab] = useState<'feed' | 'lanes' | 'discover'>('feed');
  
  // Feed states
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('Family Update');
  const [newPostImageUrl, setNewPostImageUrl] = useState('');
  const [isAddingPost, setIsAddingPost] = useState(false);

  // Profile customization state
  const [profileName, setProfileName] = useState('Grandma Green');
  const [isEditingProfileName, setIsEditingProfileName] = useState(false);

  // Time state
  const [currentTime, setCurrentTime] = useState<string>('');
  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleTabChange = (tab: typeof activeTab, label: string) => {
    setActiveTab(tab);
    speak(`Switched tab to ${label}.`);
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) return;

    const newPost: Post = {
      id: 'p_' + Date.now(),
      author: profileName,
      title: newPostTitle.trim(),
      content: newPostContent.trim(),
      category: newPostCategory,
      imageUrl: newPostImageUrl.trim() || undefined,
      likes: 0,
      comments: [],
      createdAt: new Date().toISOString()
    };

    setPosts([newPost, ...posts]);
    setNewPostTitle('');
    setNewPostContent('');
    setNewPostImageUrl('');
    setIsAddingPost(false);
    speak("Post broadcast successfully to your family circle!");
  };

  const handleLikePost = (id: string, author: string) => {
    setPosts(posts.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
    speak(`Sending love to ${author}’s memory!`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-8 min-h-screen">
      {/* 1. TOP SENSORY-ACCESSIBILITY NAVIGATION DASHBOARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-14 h-14 bg-gradient-to-tr from-amber-600 to-amber-500 rounded-2xl flex items-center justify-center text-3xl shadow-inner cursor-pointer" onClick={() => speak("Welcome to VividPulse.")}>
            👵
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              {isEditingProfileName ? (
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  onBlur={() => {
                    setIsEditingProfileName(false);
                    speak(`Updated name to ${profileName}`);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setIsEditingProfileName(false);
                      speak(`Updated name to ${profileName}`);
                    }
                  }}
                  className="bg-stone-950 text-base font-bold text-amber-400 border border-slate-700 px-2 py-0.5 rounded outline-none"
                  autoFocus
                />
              ) : (
                <h1 
                  className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-1.5 cursor-pointer hover:text-amber-400"
                  onClick={() => setIsEditingProfileName(true)}
                  title="Click to edit name"
                >
                  {profileName}’s Cozy Hearth
                </h1>
              )}
              <span className="text-xs text-slate-500 font-mono select-none">({currentTime})</span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Secure, sensory-designed portal for precious memories and family updates.
            </p>
          </div>
        </div>

        {/* Dynamic Accessibility Controllers */}
        <div className="grid grid-cols-2 sm:flex items-center gap-3 w-full md:w-auto border-t md:border-t-0 border-slate-800 pt-4 md:pt-0">
          {/* Easy mode toggle */}
          <button
            onClick={() => setIsEasyMode(!isEasyMode)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border ${
              isEasyMode
                ? 'bg-emerald-500 text-stone-950 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900'
            }`}
          >
            ✨ {isEasyMode ? 'Easy Mode ON' : 'Easy Mode'}
          </button>

          {/* Read Aloud toggle */}
          <button
            onClick={() => setIsReadAloudEnabled(!isReadAloudEnabled)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border ${
              isReadAloudEnabled
                ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900'
            }`}
          >
            🔊 {isReadAloudEnabled ? 'Voice Guide ON' : 'Voice Guide'}
          </button>

          {/* Font Size cycle button */}
          <button
            onClick={() => {
              const next = fontSizeMultiplier === 1 ? 1.2 : fontSizeMultiplier === 1.2 ? 1.4 : 1;
              setFontSizeMultiplier(next);
              speak(`Font size scaled to ${next * 100} percent.`);
            }}
            className="px-4 py-2.5 bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-900 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>🔍 A⁺ ({fontSizeMultiplier * 100}%)</span>
          </button>

          {/* High contrast button */}
          <button
            onClick={() => setIsHighContrast(!isHighContrast)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border ${
              isHighContrast
                ? 'bg-blue-600 text-slate-100 border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.25)]'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900'
            }`}
          >
            👁️ {isHighContrast ? 'Contrast ON' : 'High Contrast'}
          </button>
        </div>
      </div>

      {/* 2. DYNAMIC WORKSPACE SECTIONS: TAB CHOICES */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => handleTabChange('feed', 'The Neighborhood Feed')}
          className={`px-6 py-3.5 text-xs font-bold uppercase tracking-wider rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'feed'
              ? 'border-amber-500 text-amber-400 bg-slate-900/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>🏠 Neighborhood Feed</span>
        </button>

        <button
          onClick={() => handleTabChange('lanes', 'Attic Memory Lanes')}
          className={`px-6 py-3.5 text-xs font-bold uppercase tracking-wider rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'lanes'
              ? 'border-amber-500 text-amber-400 bg-slate-900/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>📦 Memory Attic Lanes</span>
        </button>

        <button
          onClick={() => handleTabChange('discover', 'Calming Discovery Playlist')}
          className={`px-6 py-3.5 text-xs font-bold uppercase tracking-wider rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'discover'
              ? 'border-amber-500 text-amber-400 bg-slate-900/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>🧭 Sensory Discovery</span>
        </button>
      </div>

      {/* 3. DYNAMIC VIEWS */}
      <div className="flex-1">
        {/* VIEW A: NEIGHBORHOOD FEED */}
        {activeTab === 'feed' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Add Feed Post Header */}
              <div className="bg-slate-905 border border-slate-850 p-5 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Share a Family Moment</h3>
                  <p className="text-[11px] text-slate-500">Post an update, flower garden bloom, or attic keepsake for Arthur and Lily to see.</p>
                </div>
                {!isAddingPost && (
                  <Button 
                    onClick={() => {
                      setIsAddingPost(true);
                      speak("Opened post creator form.");
                    }}
                    className="bg-amber-600 text-stone-950 font-bold hover:bg-amber-500 flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Write Post
                  </Button>
                )}
              </div>

              {/* Feed Post Form */}
              {isAddingPost && (
                <form onSubmit={handleCreatePost} className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Broadcast Memory Post</h4>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-500 font-mono">Memory Heading / Title</label>
                    <input
                      type="text"
                      required
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                      placeholder="e.g. Grandma's Classic Apple Pie 🥧"
                      className="bg-stone-950 border border-slate-850 rounded p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-500 font-mono">Memory Story Content</label>
                    <textarea
                      required
                      rows={4}
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="Share what happened in simple, warm words..."
                      className="bg-stone-950 border border-slate-850 rounded p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 resize-none font-sans leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-slate-500 font-mono">Category Tag</label>
                      <select
                        value={newPostCategory}
                        onChange={(e) => setNewPostCategory(e.target.value)}
                        className="bg-stone-950 border border-slate-850 rounded p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                      >
                        <option value="Family Update">👪 Family Update</option>
                        <option value="Garden Bloomer">🌼 Garden Bloomer</option>
                        <option value="Attic Relic">🏺 Attic Relic</option>
                        <option value="Kitchen Recipe">🥧 Kitchen Recipe</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-slate-500 font-mono">Photo Image URL (Optional)</label>
                      <input
                        type="text"
                        value={newPostImageUrl}
                        onChange={(e) => setNewPostImageUrl(e.target.value)}
                        placeholder="Paste image link here..."
                        className="bg-stone-950 border border-slate-850 rounded p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 border-t border-slate-850 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsAddingPost(false)}
                      className="px-4 py-2 bg-stone-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold uppercase tracking-wider rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <Button type="submit" className="bg-amber-600 hover:bg-amber-500 text-stone-950">
                      Publish Post 🚀
                    </Button>
                  </div>
                </form>
              )}

              {/* Memory Feed Timeline */}
              <div className="flex flex-col gap-6">
                {posts.map(post => (
                  <div 
                    key={post.id} 
                    onClick={() => isReadAloudEnabled && speak(`${post.title}. Story: ${post.content}`)}
                    className={`bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-750 transition-all duration-300 flex flex-col cursor-pointer ${
                      isEasyMode ? 'p-1.5' : ''
                    }`}
                  >
                    {/* Header */}
                    <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-850 bg-slate-950/20">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-lg shadow-inner">
                          👵
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-200">{post.author}</span>
                          <span className="text-[9px] font-mono text-slate-500">{new Date(post.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono uppercase bg-slate-900 px-3 py-1 rounded-full text-amber-500 border border-amber-950">
                        {post.category}
                      </span>
                    </div>

                    {/* Image if available */}
                    {post.imageUrl && (
                      <div className="h-64 sm:h-80 w-full relative bg-slate-950">
                        <img 
                          src={post.imageUrl} 
                          alt={post.title} 
                          className="w-full h-full object-cover opacity-90"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-5 flex flex-col gap-3">
                      <h4 className="text-sm sm:text-base font-bold text-slate-100 font-serif leading-snug hover:text-amber-400 transition-colors">
                        {post.title}
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                        {post.content}
                      </p>

                      {/* Interaction Bar */}
                      <div className="flex items-center gap-4 border-t border-slate-850 pt-4 mt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLikePost(post.id, post.author);
                          }}
                          className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border border-rose-950"
                        >
                          <Heart className="w-3.5 h-3.5 fill-current" />
                          <span>Send Love ({post.likes})</span>
                        </button>

                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                          💬 Comments ({post.comments.length})
                        </div>
                      </div>

                      {/* Simple Comment Thread */}
                      {post.comments.length > 0 && (
                        <div className="flex flex-col gap-2 mt-3 p-3 bg-stone-950/60 border border-slate-850 rounded-xl">
                          {post.comments.map((comment, idx) => (
                            <div key={idx} className="text-xs text-slate-400 border-b border-slate-900 last:border-0 pb-1.5 last:pb-0 font-sans leading-relaxed flex items-start gap-1">
                              <span className="font-bold text-slate-300">👵:</span>
                              <span className="italic">&quot;{comment}&quot;</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar Column: Grandma Green's active companion status */}
            <div className="flex flex-col gap-6">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
                <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider">🌟 Everyday Memory Companions</h4>
                <div className="p-4 bg-stone-950 border border-slate-850 rounded-xl leading-relaxed text-xs font-serif italic text-slate-300">
                  💖 &quot;We keep our family ties bright and woven by sharing the smallest simple victories. Keep blooming!&quot;
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
                    <span className="text-xs text-slate-400">Helper status</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-900 text-emerald-400 font-bold">Lily Linked</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
                    <span className="text-xs text-slate-400">Storage usage</span>
                    <span className="text-[10px] uppercase font-mono text-slate-400">12.1MB of 2GB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Sync cycle</span>
                    <span className="text-[10px] uppercase font-mono text-slate-500">Real-time Local</span>
                  </div>
                </div>

                <Button 
                  onClick={() => speak(`Currently logged in as ${profileName}. Designate a trusted companion inside the helpers tab.`)}
                  variant="outline" 
                  size="sm"
                  className="mt-2 text-[10px] font-bold tracking-widest font-mono border-slate-800 hover:bg-slate-850"
                >
                  🔊 Read Status Aloud
                </Button>
              </div>

              {/* Accessible guidelines help box */}
              <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl flex flex-col gap-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  👵 High Legibility Design
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  VividPulse is styled desktop-first for elderly usability: high contrast ratios, soft eye-safe backing, and text-to-speech audio guidance. Click inside the cards to read stories out loud.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW B: MEMORY ATTIC LANES */}
        {activeTab === 'lanes' && (
          <MemoryLanes username={profileName} isSelf={true} />
        )}

        {/* VIEW C: SENSORY DISCOVERY */}
        {activeTab === 'discover' && (
          <AccessibleCurations />
        )}
      </div>

      <footer className="py-12 border-t border-slate-900 text-center flex flex-col items-center justify-center gap-2">
        <span className="text-xs text-slate-600 font-medium">VividPulse • Sensory Family Organiser Platform</span>
        <span className="text-[10px] font-mono text-slate-700">Durable Cloud-Sync • Crafted with maximum elder-accessibility</span>
      </footer>
    </div>
  );
}
