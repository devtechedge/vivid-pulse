'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Heart, MessageSquare, Compass, Sparkles, Loader2, RefreshCw,
  MapPin, Map, Footprints, Camera, Flame, Snowflake, Bird, Volume2, VolumeX,
  Utensils, MessageCircle, Share2, Plus, PenTool, Scissors, ArrowRight, ArrowLeft,
  Paintbrush, Hammer, Check, Info, Calendar, User, Eye, Sparkle, Sliders, Mic, HelpCircle
} from 'lucide-react';
import { useAccessibility } from '@/components/ui/AccessibilityProvider';
import { 
  getCurrentUser, getDiscoverPosts, DiscoverPost, getFeed, FeedPost,
  getNostalgicStories, createNostalgicStory, 
  getNeighborhoodBenches, createNeighborhoodBench, 
  getFurryFriendPets, createFurryFriendPet, interactWithPet, 
  getCommunityKitchenRecipes, createCommunityKitchenRecipe, 
  getCraftingGuildProjects, createCraftingGuildProject, cheerCraftingProject, addEncouragementToProject
} from '@/lib/actions';
import { User as UserType } from '@/lib/db';
import { cn } from '@/lib/utils';
import { Dialog } from '@/components/ui/Dialog';
import PostCard from '@/components/feed/PostCard';

interface AccessibleCurationsProps {
  currentUser: UserType | null;
}

export default function AccessibleCurations({ currentUser }: AccessibleCurationsProps) {
  const {
    theme, setTheme,
    isEasyMode, setIsEasyMode,
    isQuietMode, setIsQuietMode,
    isMagnifierEnabled, setIsMagnifierEnabled,
    isReadAloudEnabled, setIsReadAloudEnabled,
    isSteadyPressEnabled, setIsSteadyPressEnabled,
    stablePress,
    triggerUndo,
    speak, stopSpeaking, isSpeaking,
    startDictation, isDictating
  } = useAccessibility();

  // Navigation tabs: 'photos' | 'nostalgic' | 'map' | 'furry' | 'kitchen' | 'slow' | 'craft'
  const [activeTab, setActiveTab] = React.useState<'photos' | 'nostalgic' | 'map' | 'furry' | 'kitchen' | 'slow' | 'craft'>('photos');

  // --- 1. DAILY MORNING GREETING STATE ---
  const [isGreetingOpen, setIsGreetingOpen] = React.useState(true);
  const [blessingText, setBlessingText] = React.useState<string | null>(null);

  // --- 2. THE QUIET FEED SLIDER & SEARCH STATES ---
  const [posts, setPosts] = React.useState<DiscoverPost[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isQuietOnly, setIsQuietOnly] = React.useState(false); // The Quiet Feed Slider
  const [loading, setLoading] = React.useState(true);
  const [debounceTimeout, setDebounceTimeout] = React.useState<NodeJS.Timeout | null>(null);
  const [selectedPost, setSelectedPost] = React.useState<FeedPost | null>(null);
  const [loadingPost, setLoadingPost] = React.useState(false);

  // --- 3. NOSTALGIC CORNER STATE ---
  const [nostalgicStories, setNostalgicStories] = React.useState<any[]>([]);
  const [isStoryModalOpen, setIsStoryModalOpen] = React.useState(false);
  const [newStoryTitle, setNewStoryTitle] = React.useState('');
  const [newStoryCategory, setNewStoryCategory] = React.useState<'restoration' | 'gardening' | 'history' | 'crafts'>('restoration');
  const [newStoryText, setNewStoryText] = React.useState('');
  const [newStoryImage, setNewStoryImage] = React.useState('');

  // --- 4. NEIGHBORHOOD BENCHES & HISTORY STATE ---
  const [benches, setBenches] = React.useState<any[]>([]);
  const [selectedBench, setSelectedBench] = React.useState<any | null>(null);
  const [isBenchModalOpen, setIsBenchModalOpen] = React.useState(false);
  const [historySwipePercent, setHistorySwipePercent] = React.useState(50); // Swipe Contrast percent
  const [newBenchTitle, setNewBenchTitle] = React.useState('');
  const [newBenchDesc, setNewBenchDesc] = React.useState('');
  const [newBenchType, setNewBenchType] = React.useState<'park' | 'bird' | 'bench'>('bench');
  const [newBenchX, setNewBenchX] = React.useState(50);
  const [newBenchY, setNewBenchY] = React.useState(50);
  const [tempPin, setTempPin] = React.useState<{ x: number; y: number } | null>(null);

  // --- 5. FURRY FRIENDS STATE ---
  const [pets, setPets] = React.useState<any[]>([]);
  const [isPetModalOpen, setIsPetModalOpen] = React.useState(false);
  const [newPetName, setNewPetName] = React.useState('');
  const [newPetType, setNewPetType] = React.useState<'dog' | 'cat' | 'rabbit' | 'bird'>('dog');
  const [newPetSpot, setNewPetSpot] = React.useState('');
  const [newPetImage, setNewPetImage] = React.useState('');
  const [petActionEffect, setPetActionEffect] = React.useState<{ [key: string]: 'pet' | 'treat' | null }>({});

  // --- 6. COMMUNITY KITCHEN STATE ---
  const [recipes, setRecipes] = React.useState<any[]>([]);
  const [selectedRecipe, setSelectedRecipe] = React.useState<any | null>(null);
  const [currentRecipeStep, setCurrentRecipeStep] = React.useState(0);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = React.useState(false);
  const [newRecipeTitle, setNewRecipeTitle] = React.useState('');
  const [newRecipeDesc, setNewRecipeDesc] = React.useState('');
  const [newRecipeImage, setNewRecipeImage] = React.useState('');
  const [newRecipeIngredients, setNewRecipeIngredients] = React.useState('');
  const [newRecipeStepsText, setNewRecipeStepsText] = React.useState(''); // newline separated

  // --- 7. SLOW LIVING STREAMS STATE ---
  const streams = [
    { id: 'fireplace', name: '🔥 Crackling Hearth', desc: 'Gentle logs burning in a dry brick oven, radiating deep gold warmth.', audio: 'crackle', bg: 'bg-gradient-to-t from-amber-950 via-stone-900 to-black' },
    { id: 'snowfall', name: '❄️ Silent Forest Cabin', desc: 'Snowflakes sliding down pine needles outside a cozy library window.', audio: 'piano', bg: 'bg-gradient-to-t from-slate-900 via-stone-900 to-black' },
    { id: 'birdfeeder', name: '🐦 Backyard Bird Feeder', desc: 'Morning finches and bluebirds landing on cedar wood seed troughs.', audio: 'swallows', bg: 'bg-gradient-to-t from-teal-950 via-stone-900 to-black' }
  ];
  const [activeStreamId, setActiveStreamId] = React.useState('fireplace');
  const [streamVolume, setStreamVolume] = React.useState(40);
  const [isStreamMuted, setIsStreamMuted] = React.useState(false);
  const [streamHearts, setStreamHearts] = React.useState<number>(128);
  const [streamComments, setStreamComments] = React.useState<{ id: string; user: string; text: string; time: string }[]>([
    { id: 'sc-1', user: 'Arthur Vance', text: 'This fireplace reminds me of winter up north.', time: 'Just now' },
    { id: 'sc-2', user: 'Eleanor Higgins', text: 'The snow channel is lovely to listen to with tea.', time: '2m ago' },
    { id: 'sc-3', user: 'Sarah Jenkins', text: 'Spotted a woodpecker on the bird feed today!', time: '5m ago' }
  ]);
  const [newStreamComment, setNewStreamComment] = React.useState('');

  // --- 8. CRAFTING GUILD STATE ---
  const [crafts, setCrafts] = React.useState<any[]>([]);
  const [isCraftModalOpen, setIsCraftModalOpen] = React.useState(false);
  const [newCraftTitle, setNewCraftTitle] = React.useState('');
  const [newCraftCat, setNewCraftCat] = React.useState<'knitting' | 'carpentry' | 'pottery' | 'painting'>('knitting');
  const [newCraftTips, setNewCraftTips] = React.useState('');
  const [newCraftProgress, setNewCraftProgress] = React.useState('');
  const [newCraftImage, setNewCraftImage] = React.useState('');
  const [newCraftCreatorName, setNewCraftCreatorName] = React.useState('');
  const [newCraftCreatorAge, setNewCraftCreatorAge] = React.useState(70);
  const [selectedCraft, setSelectedCraft] = React.useState<any | null>(null);
  const [craftEncouragement, setCraftEncouragement] = React.useState('');

  // --- FETCH DATA FOR ACTIVE VIEWS ---
  const loadActiveViewData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'photos') {
        const data = await getDiscoverPosts(searchQuery);
        // The Quiet Feed Slider filter: Filter out video/fast imagery (simulated via file patterns or just a random tag filter)
        if (isQuietOnly) {
          // Keep only tranquil photography containing certain peaceful words or simple placeholders
          setPosts(data.filter(p => !p.imageUrl.includes('video') && !p.imageUrl.includes('motion')));
        } else {
          setPosts(data);
        }
      } else if (activeTab === 'nostalgic') {
        const data = await getNostalgicStories();
        setNostalgicStories(data);
      } else if (activeTab === 'map') {
        const data = await getNeighborhoodBenches();
        setBenches(data);
      } else if (activeTab === 'furry') {
        const data = await getFurryFriendPets();
        setPets(data);
      } else if (activeTab === 'kitchen') {
        const data = await getCommunityKitchenRecipes();
        setRecipes(data);
      } else if (activeTab === 'craft') {
        const data = await getCraftingGuildProjects();
        setCrafts(data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadActiveViewData();
  }, [activeTab, isQuietOnly]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (debounceTimeout) clearTimeout(debounceTimeout);

    const nextTimeout = setTimeout(() => {
      loadActiveViewData();
    }, 400);
    setDebounceTimeout(nextTimeout);
  };

  // --- TOPIC BUTTON SEARCH HANDLER ---
  const handleTopicClick = (topicName: string) => {
    setSearchQuery(topicName);
    setLoading(true);
    getDiscoverPosts(topicName).then(data => {
      setPosts(isQuietOnly ? data.filter(p => !p.imageUrl.includes('video')) : data);
      setLoading(false);
    });
  };

  // --- OPEN HYDRATED PHOTO DETAIL ---
  const handleOpenPostDetails = async (postId: string) => {
    setLoadingPost(true);
    try {
      const feedRes = await getFeed(undefined, 100);
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

  // --- DAILY BLESSING GENERATOR ---
  const handleReceiveBlessing = () => {
    const blessings = [
      "🌸 'May your garden of memories bloom bright today, and may you enjoy the silent warmth of this moment.'",
      "☕ 'Take a slow sip of tea, take a gentle deep breath. There is nowhere else you need to be right now.'",
      "🍂 'Like the rustle of dry autumn leaves, some of life's most beautiful songs are written in quiet whispers.'",
      "🐦 'The swallows return to their nests with patience. You, too, are exactly where you are meant to protect and grow.'",
      "🎨 'The strokes of our years are like fine watercolor. The spaces we leave unpainted are just as beautiful as the rest.'"
    ];
    const randomIndex = Math.floor(Math.random() * blessings.length);
    setBlessingText(blessings[randomIndex]);
  };

  // --- CREATE STORY HANDLER ---
  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoryTitle.trim() || !newStoryText.trim()) return;

    const img = newStoryImage.trim() || `https://images.unsplash.com/photo-${['1509198397868-475647b2a1e5', '1518709268805-4e9042af9f23', '1513836279014-a89f7a76ae86', '1502082553048-f009c37129b9'][Math.floor(Math.random() * 4)]}?auto=format&fit=crop&q=80&w=600`;

    const res = await createNostalgicStory(newStoryTitle, newStoryCategory, img, newStoryText);
    if (res.success) {
      const storyId = res.story?.id;
      setIsStoryModalOpen(false);
      setNewStoryTitle('');
      setNewStoryText('');
      setNewStoryImage('');
      loadActiveViewData();

      triggerUndo("Story Shared to Nostalgic Corner", () => {
        if (storyId) {
          setNostalgicStories(prev => prev.filter(s => s.id !== storyId));
        }
      });
    }
  };

  // --- RECOMMEND BENCH HANDLER ---
  const handleRecommendBench = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBenchTitle.trim() || !newBenchDesc.trim()) return;

    // Use selected pin coordinate or random center
    const x = tempPin ? tempPin.x : Math.floor(Math.random() * 60) + 20;
    const y = tempPin ? tempPin.y : Math.floor(Math.random() * 60) + 20;

    const res = await createNeighborhoodBench(newBenchTitle, newBenchDesc, newBenchType, x, y);
    if (res.success) {
      const benchId = res.bench?.id;
      setIsBenchModalOpen(false);
      setNewBenchTitle('');
      setNewBenchDesc('');
      setTempPin(null);
      loadActiveViewData();

      triggerUndo("Neighborhood Bench Point Added", () => {
        if (benchId) {
          setBenches(prev => prev.filter(b => b.id !== benchId));
        }
      });
    }
  };

  // --- REGISTER PET HANDLER ---
  const handleRegisterPet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPetName.trim() || !newPetSpot.trim()) return;

    const img = newPetImage.trim() || `https://images.unsplash.com/photo-${['1543466835-00a7907e9de1', '1514888286974-6c03e2ca1dba', '1452570053594-1b985d6ea890', '1533738363-b7f9aef128ce'][Math.floor(Math.random() * 4)]}?auto=format&fit=crop&q=80&w=500`;

    const res = await createFurryFriendPet(newPetName, newPetType, img, newPetSpot);
    if (res.success) {
      setIsPetModalOpen(false);
      setNewPetName('');
      setNewPetSpot('');
      setNewPetImage('');
      loadActiveViewData();
    }
  };

  const handlePetAction = async (petId: string, action: 'pet' | 'treat') => {
    // Sparkle anim effect
    setPetActionEffect(prev => ({ ...prev, [petId]: action }));
    setTimeout(() => {
      setPetActionEffect(prev => ({ ...prev, [petId]: null }));
    }, 1000);

    const res = await interactWithPet(petId, action);
    if (res.success) {
      setPets(prev => prev.map(p => p.id === petId ? res.pet : p));
    }
  };

  // --- SHARE RECIPE HANDLER ---
  const handleShareRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipeTitle.trim() || !newRecipeDesc.trim()) return;

    const img = newRecipeImage.trim() || `https://images.unsplash.com/photo-${['1568569302499-1e177770aa09', '1547592180-85f173990554', '1519869325930-281384150729'][Math.floor(Math.random() * 3)]}?auto=format&fit=crop&q=80&w=600`;
    
    // Parse ingredients from lines
    const ings = newRecipeIngredients.split('\n').map(l => l.trim()).filter(Boolean);
    
    // Parse steps
    const rawSteps = newRecipeStepsText.split('\n').map(l => l.trim()).filter(Boolean);
    const steps = rawSteps.map((text, idx) => ({
      order: idx + 1,
      text,
      imageUrl: idx === 0 ? img : `https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=500`
    }));

    const res = await createCommunityKitchenRecipe(newRecipeTitle, newRecipeDesc, img, ings, steps);
    if (res.success) {
      setIsRecipeModalOpen(false);
      setNewRecipeTitle('');
      setNewRecipeDesc('');
      setNewRecipeImage('');
      setNewRecipeIngredients('');
      setNewRecipeStepsText('');
      loadActiveViewData();
    }
  };

  // --- SUBMIT STREAM CHAT ---
  const handleSendStreamComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreamComment.trim()) return;

    const name = currentUser?.displayName || 'A Kind Neighbor';
    const newComm = {
      id: Math.random().toString(),
      user: name,
      text: newStreamComment.trim(),
      time: 'Just now'
    };

    setStreamComments(prev => [newComm, ...prev]);
    setNewStreamComment('');
  };

  // --- SHARE CRAFT GUILD PROJECT ---
  const handleShareCraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCraftTitle.trim() || !newCraftProgress.trim()) return;

    const img = newCraftImage.trim() || `https://images.unsplash.com/photo-${['1584992236310-6edddc08acff', '1586023492125-27b2c045efd7', '1508193638397-1c4234db14d8'][Math.floor(Math.random() * 3)]}?auto=format&fit=crop&q=80&w=500`;

    const res = await createCraftingGuildProject(
      newCraftTitle,
      newCraftCat,
      img,
      newCraftTips || 'No special pattern needed. Crafted with love!',
      newCraftProgress,
      newCraftCreatorName || currentUser?.displayName || 'Anonymous Hand',
      newCraftCreatorAge || 70
    );

    if (res.success) {
      setIsCraftModalOpen(false);
      setNewCraftTitle('');
      setNewCraftTips('');
      setNewCraftProgress('');
      setNewCraftImage('');
      setNewCraftCreatorName('');
      loadActiveViewData();
    }
  };

  const handleCheerCraft = async (projectId: string) => {
    const res = await cheerCraftingProject(projectId);
    if (res.success && res.project) {
      const cheersVal = res.project.cheers;
      setCrafts(prev => prev.map(c => c.id === projectId ? { ...c, cheers: cheersVal } : c));
      if (selectedCraft && selectedCraft.id === projectId) {
        setSelectedCraft({ ...selectedCraft, cheers: cheersVal });
      }
    }
  };

  const handleSubmitEncouragement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!craftEncouragement.trim() || !selectedCraft) return;

    const author = currentUser?.displayName || 'A Kind Neighbor';
    const res = await addEncouragementToProject(selectedCraft.id, craftEncouragement.trim(), author);
    if (res.success && res.project) {
      const proj = res.project;
      setCrafts(prev => prev.map(c => c.id === selectedCraft.id ? proj : c));
      setSelectedCraft(proj);
      setCraftEncouragement('');
    }
  };

  // Render Category styling helpers
  const categoryColors = {
    restoration: 'border-orange-500/20 text-orange-400 bg-orange-950/20',
    gardening: 'border-emerald-500/20 text-emerald-400 bg-emerald-950/20',
    history: 'border-amber-500/20 text-amber-400 bg-amber-950/20',
    crafts: 'border-violet-500/20 text-violet-400 bg-violet-950/20',
  };

  return (
    <div className="w-full flex flex-col gap-8">
      
      {/* 1. DAILY MORNING GREETING INTERACTIVE CARD */}
      <AnimatePresence>
        {isGreetingOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            id="morning-greeting-card"
            className="relative w-full overflow-hidden bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center"
          >
            {/* Visual background atmospheric elements */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-violet-500/5 to-transparent pointer-events-none" />
            
            {/* Hand-painted digital sunrise illustration */}
            <div className="relative w-full md:w-1/3 aspect-[4/3] rounded-lg overflow-hidden border border-slate-800 flex-shrink-0 shadow-lg">
              <img 
                src="https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&q=80&w=600" 
                alt="Cozy Watercolor Sunrise Painting" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
              <span className="absolute bottom-3 left-3 text-[10px] font-mono uppercase tracking-widest text-amber-200/80 bg-slate-950/60 px-2 py-1 rounded">
                Morning Sunrise Painting
              </span>
            </div>

            {/* Greeting Card Content */}
            <div className="flex-1 flex flex-col gap-4 text-center md:text-left">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-[0.2em] block mb-1">🌅 Beautiful Morning Greeting</span>
                <h2 className="text-xl font-bold text-slate-100 tracking-tight">
                  Good Morning, Friend!
                </h2>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  The sun has risen gently over our neighborhood today. The swallows are singing from the courtyard veranda, and a fresh pot of herbal chamomile tea is steeping on the stove. May your day be filled with quiet wonder and cozy smiles.
                </p>
              </div>

              {/* Dynamic Interactive blessing words */}
              {blessingText && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-amber-950/20 border border-amber-900/30 text-amber-300 rounded p-4 text-xs italic leading-relaxed"
                >
                  {blessingText}
                </motion.div>
              )}

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2">
                <button
                  onClick={handleReceiveBlessing}
                  className="bg-amber-500 text-stone-950 text-xs font-bold px-4 py-2.5 rounded hover:bg-amber-400 transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_2px_10px_rgba(245,158,11,0.2)]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Receive Morning Blessing
                </button>
                <button
                  onClick={() => setIsGreetingOpen(false)}
                  className="text-slate-500 hover:text-slate-300 text-xs font-medium px-3 py-2 cursor-pointer"
                >
                  Dismiss Greeting
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ACCESS & COMFORT INTERACTIVE CONTROL BOARD */}
      <div 
        id="comfort-accessibility-board"
        className={cn(
          "w-full rounded-2xl border-2 p-6 md:p-8 flex flex-col gap-6 shadow-xl relative mt-2",
          theme === 'cozy-paper' && "bg-[#eae3d2]/40 border-amber-800/25 text-stone-900",
          theme === 'contrast' && "bg-black border-4 border-yellow-400 text-white font-mono",
          theme === 'dark' && "bg-slate-900/40 border-slate-800 text-slate-100"
        )}
      >
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400">Comfort System Active</span>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-teal-500 uppercase tracking-[0.2em] block">👵 HIGH ACCESSIBILITY & COMFORT CENTER</span>
          <h2 className="text-xl font-bold tracking-tight">Cozy Vision & Audio Companion</h2>
          <p className="text-xs opacity-80 leading-relaxed max-w-2xl">
            We want this community space to feel as restorative, warm, and clear as a peaceful morning porch. 
            Adjust the toggles below to set things exactly how your eyes and hands like them.
          </p>
        </div>

        {/* Bento Grid layout for simple toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
          
          {/* 1. THEME SWITCHER */}
          <div className={cn(
            "p-4 rounded-xl border flex flex-col justify-between gap-3",
            theme === 'cozy-paper' ? "bg-stone-50 border-stone-200" : theme === 'contrast' ? "bg-black border-2 border-white" : "bg-slate-950 border-slate-850"
          )}>
            <div className="flex flex-col">
              <span className="text-xs font-extrabold uppercase tracking-wider text-teal-400">Cozy Themes</span>
              <span className="text-[11px] opacity-70 mt-1">Eye-rest color presets</span>
            </div>
            <div className="flex flex-col gap-1.5 mt-1">
              {[
                { id: 'dark', label: '🌃 Dark evening (Standard)', color: 'bg-[#070A13] text-slate-100 border-slate-700' },
                { id: 'contrast', label: '👁️ High-Contrast Black', color: 'bg-black text-white border-yellow-400 font-mono' },
                { id: 'cozy-paper', label: '📖 Soothing Cozy Paper', color: 'bg-[#FAF7F0] text-stone-900 border-amber-800' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => stablePress(() => setTheme(t.id as any))}
                  className={cn(
                    "w-full text-left py-2 px-3 text-xs font-bold rounded border transition-all cursor-pointer flex items-center justify-between",
                    t.color,
                    theme === t.id ? "ring-2 ring-teal-400 scale-102 font-extrabold" : "opacity-60 hover:opacity-100"
                  )}
                >
                  <span>{t.label}</span>
                  {theme === t.id && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* 2. EASY MODE TOGGLE */}
          <div className={cn(
            "p-4 rounded-xl border flex flex-col justify-between gap-3",
            theme === 'cozy-paper' ? "bg-stone-50 border-stone-200" : theme === 'contrast' ? "bg-black border-2 border-white" : "bg-slate-950 border-slate-850"
          )}>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-teal-400">Easy Mode Toggle</span>
              <span className="text-[11px] opacity-70 mt-0.5">Huge squares & clear non-technical words</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-bold">{isEasyMode ? "🌟 GIANT EASY MODE ON" : "Standard settings active"}</span>
              <div 
                onClick={() => stablePress(() => setIsEasyMode(!isEasyMode))}
                className={cn(
                  "w-14 h-7 rounded-full p-0.5 cursor-pointer transition-all duration-300",
                  isEasyMode ? "bg-teal-500" : "bg-slate-800"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full bg-white shadow-md transform transition-all duration-300 flex items-center justify-center",
                  isEasyMode ? "translate-x-7" : "translate-x-0"
                )}>
                  {isEasyMode && <Check className="w-4 h-4 text-teal-600" />}
                </div>
              </div>
            </div>
          </div>

          {/* 3. READ-ALOUD COMPANION */}
          <div className={cn(
            "p-4 rounded-xl border flex flex-col justify-between gap-3",
            theme === 'cozy-paper' ? "bg-stone-50 border-stone-200" : theme === 'contrast' ? "bg-black border-2 border-white" : "bg-slate-950 border-slate-850"
          )}>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-teal-400">The Read-Aloud Companion</span>
              <span className="text-[11px] opacity-70 mt-0.5">Click any text block to hear Pip speak it aloud</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-bold">{isReadAloudEnabled ? "🔊 COMPANION SPEAKING" : "Companion quiet"}</span>
              <div 
                onClick={() => stablePress(() => setIsReadAloudEnabled(!isReadAloudEnabled))}
                className={cn(
                  "w-14 h-7 rounded-full p-0.5 cursor-pointer transition-all duration-300",
                  isReadAloudEnabled ? "bg-teal-500" : "bg-slate-800"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full bg-white shadow-md transform transition-all duration-300 flex items-center justify-center",
                  isReadAloudEnabled ? "translate-x-7" : "translate-x-0"
                )}>
                  {isReadAloudEnabled && <Check className="w-4 h-4 text-teal-600" />}
                </div>
              </div>
            </div>
          </div>

          {/* 4. DIGITAL MAGNIFYING GLASS */}
          <div className={cn(
            "p-4 rounded-xl border flex flex-col justify-between gap-3",
            theme === 'cozy-paper' ? "bg-stone-50 border-stone-200" : theme === 'contrast' ? "bg-black border-2 border-white" : "bg-slate-950 border-slate-850"
          )}>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-teal-400">Magnifying Glass Lens</span>
              <span className="text-[11px] opacity-70 mt-0.5">Hover or tap photo to zoom & read fine print</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-bold">{isMagnifierEnabled ? "🔍 LENS ACTIVATED" : "Lens folded away"}</span>
              <div 
                onClick={() => stablePress(() => setIsMagnifierEnabled(!isMagnifierEnabled))}
                className={cn(
                  "w-14 h-7 rounded-full p-0.5 cursor-pointer transition-all duration-300",
                  isMagnifierEnabled ? "bg-teal-500" : "bg-slate-800"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full bg-white shadow-md transform transition-all duration-300 flex items-center justify-center",
                  isMagnifierEnabled ? "translate-x-7" : "translate-x-0"
                )}>
                  {isMagnifierEnabled && <Check className="w-4 h-4 text-teal-600" />}
                </div>
              </div>
            </div>
          </div>

          {/* 5. DISTRACTION-FREE LAYOUT */}
          <div className={cn(
            "p-4 rounded-xl border flex flex-col justify-between gap-3",
            theme === 'cozy-paper' ? "bg-stone-50 border-stone-200" : theme === 'contrast' ? "bg-black border-2 border-white" : "bg-slate-950 border-slate-850"
          )}>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-teal-400">Distraction-Free Layout</span>
              <span className="text-[11px] opacity-70 mt-0.5">Hides reaction metrics & alerts for pure quiet</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-bold">{isQuietMode ? "🍃 PURE QUIET FEED" : "Standard counters ON"}</span>
              <div 
                onClick={() => stablePress(() => setIsQuietMode(!isQuietMode))}
                className={cn(
                  "w-14 h-7 rounded-full p-0.5 cursor-pointer transition-all duration-300",
                  isQuietMode ? "bg-teal-500" : "bg-slate-800"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full bg-white shadow-md transform transition-all duration-300 flex items-center justify-center",
                  isQuietMode ? "translate-x-7" : "translate-x-0"
                )}>
                  {isQuietMode && <Check className="w-4 h-4 text-teal-600" />}
                </div>
              </div>
            </div>
          </div>

          {/* 6. STEADY-PRESS ASSIST */}
          <div className={cn(
            "p-4 rounded-xl border flex flex-col justify-between gap-3",
            theme === 'cozy-paper' ? "bg-stone-50 border-stone-200" : theme === 'contrast' ? "bg-black border-2 border-white" : "bg-slate-950 border-slate-850"
          )}>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-teal-400">Steady-Press Assist</span>
              <span className="text-[11px] opacity-70 mt-0.5">Filters out slight hand shakes & double-clicks</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-bold">{isSteadyPressEnabled ? "🩺 STABILIZER ON" : "Stabilizer off"}</span>
              <div 
                onClick={() => stablePress(() => setIsSteadyPressEnabled(!isSteadyPressEnabled))}
                className={cn(
                  "w-14 h-7 rounded-full p-0.5 cursor-pointer transition-all duration-300",
                  isSteadyPressEnabled ? "bg-teal-500" : "bg-slate-800"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full bg-white shadow-md transform transition-all duration-300 flex items-center justify-center",
                  isSteadyPressEnabled ? "translate-x-7" : "translate-x-0"
                )}>
                  {isSteadyPressEnabled && <Check className="w-4 h-4 text-teal-600" />}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Global Keyboard Shortcut Guidelines Footnote */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2 pt-4 border-t border-slate-850 text-[10px] opacity-65 font-medium leading-relaxed">
          <span className="flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-teal-500" />
            <span><strong>Desktop Keyboard Helpers:</strong> Press <strong>Spacebar</strong> to scroll down smoothly, <strong>Shift+Space</strong> to scroll up. Press <strong>Alt+E</strong> to toggle Easy Mode.</span>
          </span>
          <span>Click <strong>Pip the Bluebird 🐦</strong> in the bottom right corner to hear cozy jokes or receive guides.</span>
        </div>
      </div>

      {/* 2. ACCESSIBLE EXPLORATION NAVIGATION RAILS */}
      {isEasyMode ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5" id="easy-mode-navigation-rail">
          {[
            { id: 'photos', label: '📸 EXPLORE PHOTOS', desc: 'Look at beautiful quiet pictures shared by neighbors', emoji: '📸' },
            { id: 'nostalgic', label: '📜 STORIES & MEMORIES', desc: 'Read recollections or write a new one', emoji: '✍️' },
            { id: 'map', label: '🗺️ NEIGHBORHOOD MAP', desc: 'Find park benches and historic neighborhood places', emoji: '🌳' },
            { id: 'furry', label: '🐾 PET AN ANIMAL', desc: 'Say hello to dogs, cats, and bunny rabbits', emoji: '🐶' },
            { id: 'kitchen', label: '🍳 RECIPE BOOK', desc: 'Cozy kitchen ideas and simple cooking steps', emoji: '🥧' },
            { id: 'slow', label: '📺 COZY CHANNELS', desc: 'Listen to a crackling fireplace or birds chirping', emoji: '🔥' },
            { id: 'craft', label: '🧶 CRAFT GUILD', desc: 'See neighborly woodwork, knitting, and pottery', emoji: '🎨' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                stablePress(() => {
                  setActiveTab(tab.id as any);
                  setSearchQuery('');
                });
              }}
              className={cn(
                'p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-3 border-4 transition-all cursor-pointer group shadow-lg',
                activeTab === tab.id
                  ? theme === 'cozy-paper'
                    ? 'bg-amber-100 border-amber-800 text-stone-900 shadow-amber-900/10'
                    : theme === 'contrast'
                      ? 'bg-white border-teal-400 text-black'
                      : 'bg-violet-950/60 border-teal-400 text-teal-300 animate-pulse'
                  : theme === 'cozy-paper'
                    ? 'bg-[#eae3d2]/60 border-amber-800/10 text-stone-700 hover:bg-[#ded1b7]/60'
                    : theme === 'contrast'
                      ? 'bg-black border-2 border-slate-700 text-slate-300 hover:border-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              )}
            >
              <span className="text-4xl group-hover:scale-110 transition-transform">{tab.emoji}</span>
              <span className="text-lg font-extrabold uppercase tracking-wider">{tab.label}</span>
              <span className="text-xs opacity-75 font-medium leading-relaxed max-w-[200px]">{tab.desc}</span>
            </button>
          ))}
        </div>
      ) : (
        <div id="curations-navigation-rail" className="flex flex-wrap gap-2 border-b border-slate-900 pb-2 overflow-x-auto scrollbar-none">
          {[
            { id: 'photos', label: '📸 Find Photos', emoji: '📸' },
            { id: 'nostalgic', label: 'Nostalgic Corner', emoji: '📜' },
            { id: 'map', label: 'Neighborhood Map', emoji: '🗺️' },
            { id: 'furry', label: 'Furry Friends', emoji: '🐾' },
            { id: 'kitchen', label: 'Community Kitchen', emoji: '🍳' },
            { id: 'slow', label: 'Slow Streams', emoji: '📺' },
            { id: 'craft', label: 'Craft Guild', emoji: '🧶' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                stablePress(() => {
                  setActiveTab(tab.id as any);
                  setSearchQuery('');
                });
              }}
              className={cn(
                'flex items-center gap-2 px-4 py-3 rounded-t-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-t border-x',
                activeTab === tab.id
                  ? 'bg-slate-950 border-slate-800 text-teal-400 border-b-2 border-b-teal-400 shadow-[0_4px_15px_rgba(20,184,166,0.05)]'
                  : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/30'
              )}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* 3. DYNAMIC VIEWS CONTAINER */}
      <div className="w-full min-h-[400px]">

        {/* ======================================================== */}
        {/* VIEW A: SEARCH & DISCOVERY (STILL-LIFE TOGGLE, TOPIC BUTTONS) */}
        {/* ======================================================== */}
        {activeTab === 'photos' && (
          <div className="flex flex-col gap-6">
            
            {/* SEARCH AND THE QUIET FEED SLIDER CONTROLS */}
            <div className="bg-slate-950 border border-slate-900 rounded-xl p-5 md:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex flex-col gap-1.5 max-w-lg">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Search Cozy Pictures</h3>
                <p className="text-[11px] text-slate-500">
                  Search shared images, or filter using our Quiet Feed switch to remove dynamic images.
                </p>

                {/* The Quiet Feed Slider Toggle */}
                <div id="quiet-feed-slider" className="flex items-center gap-3 mt-3 bg-slate-900/60 p-2.5 rounded border border-slate-800 max-w-xs">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">The Quiet Feed</span>
                  <div 
                    onClick={() => setIsQuietOnly(!isQuietOnly)}
                    className={cn(
                      "w-12 h-6 rounded-full p-0.5 cursor-pointer transition-all duration-300",
                      isQuietOnly ? "bg-teal-500" : "bg-slate-800"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full bg-white shadow-md transform transition-all duration-300 flex items-center justify-center",
                      isQuietOnly ? "translate-x-6" : "translate-x-0"
                    )}>
                      {isQuietOnly && <Check className="w-3.5 h-3.5 text-teal-600" />}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {isQuietOnly ? 'Still-life Only' : 'All Pictures'}
                  </span>
                </div>
              </div>

              {/* Standard search bar */}
              <div className="relative w-full lg:max-w-xs flex-shrink-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-600" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search cozy photos..."
                  className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 pl-10 pr-4 py-3.5 rounded outline-none focus:border-teal-500/80 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"
                />
                {loading && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-500" />
                  </div>
                )}
              </div>
            </div>

            {/* CIRCLE TOPIC BUTTONS - ACCESSIBLE REPLACEMENT FOR CONFUSING HASHTAGS */}
            <div id="circle-topic-buttons" className="flex flex-col gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">
                Tap a topic to explore instantly:
              </span>
              <div className="flex flex-wrap gap-4">
                {[
                  { name: 'Baking', emoji: '🍰', color: 'border-rose-500/30 hover:border-rose-400 bg-rose-950/20 text-rose-300' },
                  { name: 'Gardens', emoji: '🌸', color: 'border-emerald-500/30 hover:border-emerald-400 bg-emerald-950/20 text-emerald-300' },
                  { name: 'Crafts', emoji: '🎨', color: 'border-violet-500/30 hover:border-violet-400 bg-violet-950/20 text-violet-300' },
                  { name: 'Animals', emoji: '🐕', color: 'border-sky-500/30 hover:border-sky-400 bg-sky-950/20 text-sky-300' },
                  { name: 'Nostalgia', emoji: '📜', color: 'border-amber-500/30 hover:border-amber-400 bg-amber-950/20 text-amber-300' }
                ].map((topic) => (
                  <button
                    key={topic.name}
                    onClick={() => handleTopicClick(topic.name)}
                    className={cn(
                      'flex flex-col items-center gap-1 cursor-pointer transition-all hover:scale-105 active:scale-95 group'
                    )}
                  >
                    {/* Big tactile round circle */}
                    <div className={cn(
                      'w-16 h-16 rounded-full border flex items-center justify-center text-2xl shadow-lg transition-transform group-hover:rotate-6',
                      topic.color
                    )}>
                      {topic.emoji}
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-200 mt-1 uppercase tracking-wider">
                      {topic.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* MASONRY PICTURES GRID */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-slate-950 border border-slate-900 rounded aspect-square animate-pulse" />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="w-full bg-slate-950 border border-slate-900 rounded p-12 text-center flex flex-col items-center justify-center gap-3">
                <Sparkles className="w-8 h-8 text-slate-700 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">No Pictures found matching &quot;{searchQuery}&quot;</h3>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    loadActiveViewData();
                  }}
                  className="mt-2 text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Show All Pictures
                </button>
              </div>
            ) : (
              <div className="columns-2 md:columns-3 gap-4 space-y-4">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => handleOpenPostDetails(post.id)}
                    className="relative break-inside-avoid bg-slate-950 border border-slate-900 rounded overflow-hidden group cursor-pointer hover:border-teal-500/50 hover:shadow-[0_0_20px_rgba(20,184,166,0.15)] transition-all duration-300"
                  >
                    <img
                      src={post.imageUrl}
                      alt={post.caption || 'Cozy Community Photo'}
                      className="w-full h-auto object-cover select-none group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 backdrop-blur-sm transition-all duration-300 flex flex-col justify-center items-center gap-4 text-white p-4">
                      {!isQuietMode && (
                        <div className="flex gap-4">
                          <div className="flex items-center gap-1">
                            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                            <span className="text-xs font-bold">{post.likesCount}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4 text-teal-400" />
                            <span className="text-xs font-bold">{post.commentsCount}</span>
                          </div>
                        </div>
                      )}
                      <span className="text-[10px] font-bold text-teal-300">@{post.authorUsername}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW B: NOSTALGIC CORNER */}
        {/* ======================================================== */}
        {activeTab === 'nostalgic' && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center bg-slate-950 border border-slate-900 rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">Nostalgic Corner Feed</h3>
                  <span className="text-[10px] font-medium text-slate-500 block">Dedicated strictly to antique restorations, gardening, history, and classical crafts.</span>
                </div>
              </div>

              {currentUser && (
                <button
                  onClick={() => setIsStoryModalOpen(true)}
                  className="bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold px-4 py-2.5 rounded cursor-pointer transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Write a Memory
                </button>
              )}
            </div>

            {/* Stories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nostalgicStories.map((story) => (
                <div 
                  key={story.id}
                  className="bg-slate-950 border border-slate-900 rounded-xl overflow-hidden flex flex-col h-full hover:border-amber-500/30 transition-all shadow-lg"
                >
                  <div className="relative aspect-[3/2] overflow-hidden">
                    <img 
                      src={story.imageUrl} 
                      alt={story.title} 
                      className="w-full h-full object-cover"
                    />
                    <span className={cn(
                      "absolute top-3 left-3 text-[9px] font-mono uppercase tracking-widest px-2.5 py-1 rounded border",
                      categoryColors[story.category as keyof typeof categoryColors] || 'border-slate-800 text-slate-400'
                    )}>
                      {story.category}
                    </span>
                  </div>

                  <div className="p-5 flex flex-col gap-3 flex-1">
                    <h4 className="text-sm font-bold text-slate-100 leading-snug tracking-tight">
                      {story.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed flex-1 italic line-clamp-4">
                      &quot;{story.storyText}&quot;
                    </p>
                    <div className="border-t border-slate-900 pt-3 flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-amber-500/60" />
                        A Cozy Member
                      </span>
                      <span>{new Date(story.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* WRITE MEMORY MODAL */}
            <Dialog 
              isOpen={isStoryModalOpen} 
              onClose={() => setIsStoryModalOpen(false)}
              className="max-w-md border-amber-900/40 bg-slate-950"
            >
              <form onSubmit={handleCreateStory} className="flex flex-col gap-4 text-slate-200">
                <div className="border-b border-slate-900 pb-3">
                  <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Share a Memory / Project</h3>
                  <p className="text-[10px] text-slate-500 mt-1">Add a story of a craft restoration, garden update, or historical moment.</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Title</label>
                  <input
                    type="text"
                    required
                    value={newStoryTitle}
                    onChange={(e) => setNewStoryTitle(e.target.value)}
                    placeholder="e.g., Polishing my 1930s Typewriter"
                    className="bg-slate-900 border border-slate-800 text-xs text-slate-200 p-3 rounded outline-none focus:border-amber-500/50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
                  <select
                    value={newStoryCategory}
                    onChange={(e: any) => setNewStoryCategory(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-xs text-slate-200 p-3 rounded outline-none focus:border-amber-500/50"
                  >
                    <option value="restoration">⚙️ Antique Restoration</option>
                    <option value="gardening">🌸 Heritage Gardening</option>
                    <option value="history">📜 Local History / Photos</option>
                    <option value="crafts">🎨 Classical Crafts</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Image URL (Optional)</label>
                  <input
                    type="text"
                    value={newStoryImage}
                    onChange={(e) => setNewStoryImage(e.target.value)}
                    placeholder="Paste a photo web link or leave blank"
                    className="bg-slate-900 border border-slate-800 text-xs text-slate-200 p-3 rounded outline-none focus:border-amber-500/50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Write the Story</label>
                    <button
                      type="button"
                      onClick={() => startDictation((t) => setNewStoryText(prev => prev ? prev + " " + t : t))}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold transition-all border cursor-pointer",
                        isDictating 
                          ? "bg-rose-500 border-rose-400 text-white animate-pulse" 
                          : "bg-teal-500/10 border-teal-500/20 text-teal-400 hover:bg-teal-500/20"
                      )}
                    >
                      <Mic className="w-3 h-3" />
                      <span>{isDictating ? "Listening..." : "Dictate Story Voice 🎙️"}</span>
                    </button>
                  </div>
                  <textarea
                    required
                    rows={4}
                    value={newStoryText}
                    onChange={(e) => setNewStoryText(e.target.value)}
                    placeholder="What is the story behind this? Share step details and memories..."
                    className="bg-slate-900 border border-slate-800 text-xs text-slate-200 p-3 rounded outline-none focus:border-amber-500/50 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs py-3 rounded cursor-pointer mt-2"
                >
                  Share to Nostalgic Corner
                </button>
              </form>
            </Dialog>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW C: NEIGHBORHOOD MAP & LOCAL HISTORY CONTRAST */}
        {/* ======================================================== */}
        {activeTab === 'map' && (
          <div className="flex flex-col gap-6">
            <div className="bg-slate-950 border border-slate-900 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">Neighborhood Benches & History</h3>
                <span className="text-[10px] font-medium text-slate-500 block">
                  Find local parks, bird-watching areas, and peaceful benches recommended by other elders. Tap anywhere to recommend!
                </span>
              </div>
              <div className="flex gap-2 flex-wrap text-[10px] font-mono">
                <span className="flex items-center gap-1 bg-amber-950/20 text-amber-300 border border-amber-900/30 px-2 py-1 rounded">
                  🪑 Bench Pin
                </span>
                <span className="flex items-center gap-1 bg-teal-950/20 text-teal-300 border border-teal-900/30 px-2 py-1 rounded">
                  🐦 Bird Watch
                </span>
                <span className="flex items-center gap-1 bg-emerald-950/20 text-emerald-300 border border-emerald-900/30 px-2 py-1 rounded">
                  🌲 Local Park
                </span>
              </div>
            </div>

            {/* THE INTERACTIVE NEIGHBORHOOD SVG CANVAS MAP */}
            <div className="flex flex-col lg:flex-row gap-6">
              
              {/* SVG Canvas Map Box */}
              <div className="flex-1 relative aspect-[4/3] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
                {/* Winding paths layout inside SVG */}
                <svg 
                  className="w-full h-full text-slate-700/20" 
                  viewBox="0 0 100 100" 
                  preserveAspectRatio="none"
                  onClick={(e) => {
                    // Tap on map to trigger recommendation form
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
                    setTempPin({ x, y });
                    setIsBenchModalOpen(true);
                  }}
                >
                  {/* Rivers / streams */}
                  <path d="M 0 35 Q 20 45 40 30 T 80 50 T 100 40" fill="none" stroke="#0ea5e9" strokeWidth="2.5" opacity="0.3" />
                  <path d="M 30 0 Q 35 40 40 30" fill="none" stroke="#0ea5e9" strokeWidth="1" opacity="0.2" />

                  {/* Winding Walking paths */}
                  <path d="M 10 90 Q 20 60 50 50 T 90 20" fill="none" stroke="#a1a1aa" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />
                  <path d="M 5 10 Q 50 15 65 60 T 95 90" fill="none" stroke="#a1a1aa" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />

                  {/* Shady Botanical Parks overlay squares */}
                  <rect x="15" y="55" width="20" height="20" rx="3" fill="#10b981" opacity="0.05" />
                  <rect x="60" y="20" width="25" height="25" rx="4" fill="#059669" opacity="0.05" />
                </svg>

                <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-sm border border-slate-800 text-[10px] text-slate-400 p-2 rounded pointer-events-none">
                  🧭 Tap anywhere on map grid to place a new recommendation
                </div>

                {/* Plot Pins dynamically from active benches state */}
                {benches.map((bench) => {
                  const isSelected = selectedBench?.id === bench.id;
                  const colorClass = bench.type === 'bench' ? 'bg-amber-500' : bench.type === 'bird' ? 'bg-sky-500' : 'bg-emerald-500';

                  return (
                    <button
                      key={bench.id}
                      onClick={(e) => {
                        e.stopPropagation(); // Stop parent SVG triggers
                        setSelectedBench(bench);
                      }}
                      style={{ left: `${bench.longitude}%`, top: `${bench.latitude}%` }}
                      className={cn(
                        "absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center border border-white cursor-pointer hover:scale-125 transition-transform z-10",
                        colorClass,
                        isSelected && "ring-4 ring-teal-400 ring-offset-2 ring-offset-slate-950 scale-125"
                      )}
                    >
                      <MapPin className="w-3.5 h-3.5 text-stone-950" />
                    </button>
                  );
                })}

                {/* Show Temporary marker while adding */}
                {tempPin && (
                  <div
                    style={{ left: `${tempPin.x}%`, top: `${tempPin.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-teal-400 bg-teal-500/30 flex items-center justify-center animate-bounce pointer-events-none"
                  >
                    <Plus className="w-4 h-4 text-teal-400" />
                  </div>
                )}
              </div>

              {/* DETAILS PANEL & LOCAL HISTORY CONTRAST SWIPE SLIDER */}
              <div className="w-full lg:w-80 bg-slate-950 border border-slate-900 rounded-xl p-5 flex flex-col gap-4 shadow-xl">
                {selectedBench ? (
                  <div className="flex flex-col gap-4">
                    <div className="border-b border-slate-900 pb-3">
                      <span className="text-[9px] font-mono uppercase bg-slate-900 px-2 py-0.5 rounded text-teal-400">
                        {selectedBench.type === 'bench' ? '🪑 Cozy Bench' : selectedBench.type === 'bird' ? '🐦 Bird Spot' : '🌲 Park Area'}
                      </span>
                      <h4 className="text-sm font-bold text-slate-100 mt-1">{selectedBench.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{selectedBench.description}</p>
                    </div>

                    {/* LOCAL HISTORY CONTRAST - SWIPE BEFORE/AFTER SCREEN SLIDER */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-teal-400" />
                          Local History Contrast
                        </span>
                        <span className="text-[9px] text-slate-500">Swipe slider handle</span>
                      </div>

                      {/* Before/After Container */}
                      <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-slate-800 bg-slate-900 select-none">
                        {/* Underlay: TODAY */}
                        <img 
                          src={selectedBench.imgToday || 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&q=80&w=600'} 
                          alt="Street view today" 
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <span className="absolute bottom-2 right-2 text-[8px] font-mono text-white bg-slate-950/80 px-1.5 py-0.5 rounded z-10 uppercase tracking-widest">
                          Today
                        </span>

                        {/* Overlay: 50 YEARS AGO (Width Masked) */}
                        <div 
                          style={{ width: `${historySwipePercent}%` }}
                          className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-teal-400 transition-all duration-75"
                        >
                          <img 
                            src={selectedBench.img50YearsAgo || 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&q=80&w=600'} 
                            alt="Street view 50 years ago" 
                            className="absolute inset-y-0 left-0 max-w-none h-full grayscale sepia contrast-125"
                            style={{ width: '280px' }} // fixed scale boundary to avoid sliding compression
                          />
                          <span className="absolute bottom-2 left-2 text-[8px] font-mono text-amber-100 bg-amber-950/90 px-1.5 py-0.5 rounded z-10 uppercase tracking-widest">
                            1976 (50 yrs ago)
                          </span>
                        </div>

                        {/* Invisible slider input overlay */}
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={historySwipePercent}
                          onChange={(e) => setHistorySwipePercent(Number(e.target.value))}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                        />

                        {/* Visual handle representation */}
                        <div 
                          style={{ left: `${historySwipePercent}%` }}
                          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-950 border border-teal-400 flex items-center justify-center shadow-lg pointer-events-none z-10"
                        >
                          <Sliders className="w-3.5 h-3.5 text-teal-400 rotate-90" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 flex flex-col items-center gap-3">
                    <Map className="w-8 h-8 text-slate-800 animate-pulse" />
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">No Landmark Selected</h4>
                    <p className="text-[10px] text-slate-600 max-w-[200px]">
                      Click on any pin marker on the map canvas to inspect history or details!
                    </p>
                  </div>
                )}
              </div>

            </div>

            {/* RECOMMEND BENCH MODAL */}
            <Dialog 
              isOpen={isBenchModalOpen} 
              onClose={() => {
                setIsBenchModalOpen(false);
                setTempPin(null);
              }}
              className="max-w-md bg-slate-950 border-slate-900"
            >
              <form onSubmit={handleRecommendBench} className="flex flex-col gap-4 text-slate-200">
                <div className="border-b border-slate-900 pb-2">
                  <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider">Recommend a Bench / Park</h3>
                  <p className="text-[10px] text-slate-500 mt-1">Share a peaceful spot so neighbors can go there and find rest.</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Landmark Name</label>
                  <input
                    type="text"
                    required
                    value={newBenchTitle}
                    onChange={(e) => setNewBenchTitle(e.target.value)}
                    placeholder="e.g., Willow Path Meadow Bench"
                    className="bg-slate-900 border border-slate-800 text-xs text-slate-200 p-3 rounded outline-none focus:border-teal-500/50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Type of Spot</label>
                  <select
                    value={newBenchType}
                    onChange={(e: any) => setNewBenchType(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-xs text-slate-200 p-3 rounded outline-none focus:border-teal-500/50"
                  >
                    <option value="bench">🪑 Peaceful Wood/Iron Bench</option>
                    <option value="bird">🐦 Bird Watching Hideout</option>
                    <option value="park">🌲 Local Accessible Park</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Why is it peaceful?</label>
                  <textarea
                    required
                    rows={3}
                    value={newBenchDesc}
                    onChange={(e) => setNewBenchDesc(e.target.value)}
                    placeholder="Describe the shade, sound of wind, stream, ducks, or bird songs..."
                    className="bg-slate-900 border border-slate-800 text-xs text-slate-200 p-3 rounded outline-none focus:border-teal-500/50 resize-none"
                  />
                </div>

                <div className="text-[10px] text-slate-500 bg-slate-900/40 p-2 border border-slate-900 rounded">
                  📍 Pin plotted at map coordinates (x: {tempPin?.x}%, y: {tempPin?.y}%)
                </div>

                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-500 text-stone-950 font-bold text-xs py-3 rounded cursor-pointer mt-2"
                >
                  Confirm Landmark Location
                </button>
              </form>
            </Dialog>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW D: FURRY FRIENDS HUB */}
        {/* ======================================================== */}
        {activeTab === 'furry' && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center bg-slate-950 border border-slate-900 rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <Bird className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">Furry Friends Hub</h3>
                  <span className="text-[10px] font-medium text-slate-500 block">Check out the cute cats, dogs, rabbits, and backyard birds posted by your neighbors.</span>
                </div>
              </div>

              {currentUser && (
                <button
                  onClick={() => setIsPetModalOpen(true)}
                  className="bg-sky-600 hover:bg-sky-500 text-stone-950 text-xs font-bold px-4 py-2.5 rounded cursor-pointer transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Show off Pet
                </button>
              )}
            </div>

            {/* Pets grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {pets.map((pet) => (
                <div 
                  key={pet.id}
                  className="relative bg-slate-950 border border-slate-900 rounded-xl overflow-hidden flex flex-col hover:border-sky-500/20 transition-all shadow-xl"
                >
                  <div className="relative aspect-square overflow-hidden bg-stone-900">
                    <img 
                      src={pet.imageUrl} 
                      alt={pet.name} 
                      className="w-full h-full object-cover"
                    />

                    {/* Sparkly interactive petting overlay */}
                    <AnimatePresence>
                      {petActionEffect[pet.id] && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1.2 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 text-white font-bold"
                        >
                          <motion.div 
                            animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }}
                            className="flex flex-col items-center gap-1 bg-slate-950/80 px-4 py-2 rounded-lg border border-sky-400/30 shadow-2xl"
                          >
                            <Sparkle className="w-6 h-6 text-yellow-400 animate-spin" />
                            <span className="text-[10px] uppercase font-mono tracking-widest text-sky-300">
                              {petActionEffect[pet.id] === 'pet' ? 'Gently Petted! 💕' : 'Gave a Treat! 🦴'}
                            </span>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Animal Tag */}
                    <span className="absolute bottom-3 right-3 text-[9px] uppercase tracking-wider font-mono font-bold bg-slate-950/80 text-sky-400 border border-sky-950 px-2 py-0.5 rounded">
                      {pet.type}
                    </span>
                  </div>

                  <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                        {pet.name}
                        <span className="text-[10px] font-semibold text-slate-500">@{pet.type === 'dog' ? 'bark' : pet.type === 'cat' ? 'meow' : 'tweet'}</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-2 italic bg-slate-900/40 p-2.5 border border-slate-900 rounded">
                        <strong className="text-[9px] uppercase tracking-wider text-slate-500 not-italic block mb-0.5">Favorite Nap Spot:</strong>
                        &quot;{pet.favoriteNapSpot}&quot;
                      </p>
                    </div>

                    {/* Interactive petting handles */}
                    <div className="border-t border-slate-900 pt-3 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mb-1">
                        <span>Petted: {pet.pettedCount || 0} times</span>
                        <span>Treats: {pet.treatsCount || 0} given</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handlePetAction(pet.id, 'pet')}
                          className="bg-slate-900 hover:bg-sky-950/20 hover:border-sky-500/20 text-sky-300 border border-slate-800 text-[10px] font-bold py-2 rounded cursor-pointer transition-all flex items-center justify-center gap-1.5"
                        >
                          👋 Gently Pet
                        </button>
                        <button
                          onClick={() => handlePetAction(pet.id, 'treat')}
                          className="bg-slate-900 hover:bg-amber-950/20 hover:border-amber-500/20 text-amber-300 border border-slate-800 text-[10px] font-bold py-2 rounded cursor-pointer transition-all flex items-center justify-center gap-1.5"
                        >
                          🦴 Give Treat
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* REGISTER PET MODAL */}
            <Dialog 
              isOpen={isPetModalOpen} 
              onClose={() => setIsPetModalOpen(false)}
              className="max-w-md bg-slate-950 border-sky-900/30"
            >
              <form onSubmit={handleRegisterPet} className="flex flex-col gap-4 text-slate-200">
                <div className="border-b border-slate-900 pb-2">
                  <h3 className="text-sm font-bold text-sky-400 uppercase tracking-wider">Show Off Your Furry/Feathered Friend</h3>
                  <p className="text-[10px] text-slate-500 mt-1">Post a cozy picture of your pet so neighbors can send them digital treats and petting pats.</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Pet Name</label>
                  <input
                    type="text"
                    required
                    value={newPetName}
                    onChange={(e) => setNewPetName(e.target.value)}
                    placeholder="e.g., Barnaby"
                    className="bg-slate-900 border border-slate-800 text-xs text-slate-200 p-3 rounded outline-none focus:border-sky-500/50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Pet Type</label>
                  <select
                    value={newPetType}
                    onChange={(e: any) => setNewPetType(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-xs text-slate-200 p-3 rounded outline-none focus:border-sky-500/50"
                  >
                    <option value="dog">🐕 Friendly Dog</option>
                    <option value="cat">🐈 Cozy Cat</option>
                    <option value="rabbit">🐇 Tiny Rabbit</option>
                    <option value="bird">🐦 Backyard Songbird</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Photo Web Link</label>
                  <input
                    type="text"
                    value={newPetImage}
                    onChange={(e) => setNewPetImage(e.target.value)}
                    placeholder="Paste a photo URL, or leave blank for preset"
                    className="bg-slate-900 border border-slate-800 text-xs text-slate-200 p-3 rounded outline-none focus:border-sky-500/50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Favorite Nap Spot</label>
                  <input
                    type="text"
                    required
                    value={newPetSpot}
                    onChange={(e) => setNewPetSpot(e.target.value)}
                    placeholder="e.g., Cozy spots on the kitchen wool rug..."
                    className="bg-slate-900 border border-slate-800 text-xs text-slate-200 p-3 rounded outline-none focus:border-sky-500/50"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-500 text-stone-950 font-bold text-xs py-3 rounded cursor-pointer mt-2"
                >
                  Post Pet to Hub
                </button>
              </form>
            </Dialog>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW E: COMMUNITY KITCHEN */}
        {/* ======================================================== */}
        {activeTab === 'kitchen' && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center bg-slate-950 border border-slate-900 rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">Weekly Community Kitchen</h3>
                  <span className="text-[10px] font-medium text-slate-500 block">Share and view step-by-step photos of your favorite cozy home-cooked recipes.</span>
                </div>
              </div>

              {currentUser && (
                <button
                  onClick={() => setIsRecipeModalOpen(true)}
                  className="bg-rose-600 hover:bg-rose-500 text-stone-950 text-xs font-bold px-4 py-2.5 rounded cursor-pointer transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Share Recipe
                </button>
              )}
            </div>

            {/* Recipes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recipes.map((recipe) => (
                <div 
                  key={recipe.id}
                  className="bg-slate-950 border border-slate-900 rounded-xl overflow-hidden flex flex-col md:flex-row hover:border-rose-500/20 transition-all shadow-xl"
                >
                  <div className="w-full md:w-2/5 aspect-video md:aspect-auto relative bg-stone-900">
                    <img 
                      src={recipe.coverImage} 
                      alt={recipe.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-5 flex-1 flex flex-col gap-3 justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-100 leading-tight">{recipe.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed line-clamp-3">{recipe.description}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-900 pt-3">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {recipe.steps?.length || 0} Cooking Steps
                      </span>
                      <button
                        onClick={() => {
                          setSelectedRecipe(recipe);
                          setCurrentRecipeStep(0);
                          setIsRecipeModalOpen(false); // make sure edit form doesn't overlay
                        }}
                        className="bg-rose-950/40 text-rose-300 hover:bg-rose-900/30 border border-rose-900/40 text-[10px] font-bold px-3 py-1.5 rounded cursor-pointer transition-colors"
                      >
                        Start Cooking Step-by-Step 🍳
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* STEP-BY-STEP COOKING POPUP MODAL */}
            {selectedRecipe && (
              <Dialog 
                isOpen={selectedRecipe !== null} 
                onClose={() => setSelectedRecipe(null)}
                className="max-w-xl bg-slate-950 border-rose-950"
              >
                <div className="flex flex-col gap-4 text-slate-200">
                  <div className="border-b border-slate-900 pb-2 flex justify-between items-center">
                    <div>
                      <span className="text-[9px] font-mono uppercase text-rose-400">Weekly Community Kitchen</span>
                      <h3 className="text-sm font-bold text-slate-100">{selectedRecipe.title}</h3>
                    </div>
                    <button 
                      onClick={() => setSelectedRecipe(null)}
                      className="text-xs text-slate-500 hover:text-slate-300"
                    >
                      Close Recipe
                    </button>
                  </div>

                  {/* COZY INGREDIENTS SLIDE BAR (Before steps) */}
                  {currentRecipeStep === 0 ? (
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="w-full md:w-1/2 aspect-video md:aspect-[4/3] rounded overflow-hidden">
                        <img 
                          src={selectedRecipe.coverImage} 
                          alt={selectedRecipe.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 flex flex-col gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300">Cozy Ingredients List:</span>
                        <ul className="flex flex-col gap-1.5">
                          {selectedRecipe.ingredients?.map((ing: string, i: number) => (
                            <li key={i} className="text-xs flex items-center gap-2 text-slate-300">
                              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full flex-shrink-0" />
                              {ing}
                            </li>
                          ))}
                        </ul>
                        <button
                          onClick={() => setCurrentRecipeStep(1)}
                          className="mt-4 bg-rose-600 hover:bg-rose-500 text-stone-950 font-bold text-xs py-2.5 rounded cursor-pointer w-full text-center"
                        >
                          Let&apos;s Start Cooking Step 1 ➜
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* DYNAMIC COOKING STEPS VIEW */
                    <div className="flex flex-col gap-4">
                      {/* Step details */}
                      {selectedRecipe.steps?.map((step: any, idx: number) => {
                        const stepNum = idx + 1;
                        if (stepNum !== currentRecipeStep) return null;

                        return (
                          <div key={idx} className="flex flex-col md:flex-row gap-6 items-center">
                            <div className="w-full md:w-1/2 aspect-video md:aspect-[4/3] rounded overflow-hidden border border-slate-900">
                              <img 
                                src={step.imageUrl} 
                                alt={`Step ${stepNum}`} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 flex flex-col gap-3">
                              <span className="text-xs font-bold text-rose-400 uppercase tracking-widest block">
                                Step {stepNum} of {selectedRecipe.steps.length}
                              </span>
                              <p className="text-xs text-slate-200 leading-relaxed italic">
                                &quot;{step.text}&quot;
                              </p>
                            </div>
                          </div>
                        );
                      })}

                      {/* Navigation controls */}
                      <div className="border-t border-slate-900 pt-4 flex justify-between items-center mt-2">
                        <button
                          disabled={currentRecipeStep === 0}
                          onClick={() => setCurrentRecipeStep(prev => prev - 1)}
                          className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-xs px-4 py-2 rounded text-slate-400 cursor-pointer flex items-center gap-1.5"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" /> Back
                        </button>
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                          Steps Indicator: {currentRecipeStep} / {selectedRecipe.steps?.length}
                        </span>
                        <button
                          disabled={currentRecipeStep === selectedRecipe.steps?.length}
                          onClick={() => setCurrentRecipeStep(prev => prev + 1)}
                          className="bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-xs px-4 py-2 rounded text-stone-950 font-bold cursor-pointer flex items-center gap-1.5"
                        >
                          Next <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Dialog>
            )}

            {/* SHARE RECIPE MODAL */}
            <Dialog 
              isOpen={isRecipeModalOpen} 
              onClose={() => setIsRecipeModalOpen(false)}
              className="max-w-md bg-slate-950 border-rose-950"
            >
              <form onSubmit={handleShareRecipe} className="flex flex-col gap-4 text-slate-200">
                <div className="border-b border-slate-900 pb-2">
                  <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider">Share a Home-Cooked Recipe</h3>
                  <p className="text-[10px] text-slate-500 mt-1">Post step-by-step photos of your favorite meals with cozy spices.</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Recipe Name</label>
                  <input
                    type="text"
                    required
                    value={newRecipeTitle}
                    onChange={(e) => setNewRecipeTitle(e.target.value)}
                    placeholder="e.g., Mrs. Higgins' Sunday Apple Cobbler"
                    className="bg-slate-900 border border-slate-800 text-xs text-slate-200 p-3 rounded outline-none focus:border-rose-500/50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Short Description</label>
                  <input
                    type="text"
                    required
                    value={newRecipeDesc}
                    onChange={(e) => setNewRecipeDesc(e.target.value)}
                    placeholder="Briefly describe what makes this so comforting..."
                    className="bg-slate-900 border border-slate-800 text-xs text-slate-200 p-3 rounded outline-none focus:border-rose-500/50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Cover Image URL</label>
                  <input
                    type="text"
                    value={newRecipeImage}
                    onChange={(e) => setNewRecipeImage(e.target.value)}
                    placeholder="Paste a photo web link or leave blank"
                    className="bg-slate-900 border border-slate-800 text-xs text-slate-200 p-3 rounded outline-none focus:border-rose-500/50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Ingredients (One per line)</label>
                  <textarea
                    rows={3}
                    required
                    value={newRecipeIngredients}
                    onChange={(e) => setNewRecipeIngredients(e.target.value)}
                    placeholder="6 cups sliced apples&#10;1 cup sifted flour&#10;1 tablespoon ground cinnamon..."
                    className="bg-slate-900 border border-slate-800 text-xs text-slate-200 p-3 rounded outline-none focus:border-rose-500/50 resize-none font-mono text-[11px]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Cooking Steps (One per line)</label>
                  <textarea
                    rows={3}
                    required
                    value={newRecipeStepsText}
                    onChange={(e) => setNewRecipeStepsText(e.target.value)}
                    placeholder="Step 1: Toss sliced apples with cinnamon and nutmeg.&#10;Step 2: Sift flour and cut butter into a crumble...&#10;Step 3: Bake at 375F for 45 minutes."
                    className="bg-slate-900 border border-slate-800 text-xs text-slate-200 p-3 rounded outline-none focus:border-rose-500/50 resize-none text-[11px]"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-500 text-stone-950 font-bold text-xs py-3 rounded cursor-pointer mt-2"
                >
                  Confirm Recipe Publication
                </button>
              </form>
            </Dialog>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW F: SLOW LIVING STREAMS */}
        {/* ======================================================== */}
        {activeTab === 'slow' && (
          <div className="flex flex-col gap-6">
            <div className="bg-slate-950 border border-slate-900 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">Slow Living Streams</h3>
                <span className="text-[10px] font-medium text-slate-500 block">
                  Cozy, silent channels showing fireplace crackles, snow falling, or backyard bird feeders. Perfect for relaxing background.
                </span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded border border-slate-800 text-[10px]">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span className="font-mono text-slate-300 font-bold uppercase">Streaming Live</span>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              
              {/* STREAM SELECTION & CHANNEL CONTROLS */}
              <div className="w-full lg:w-72 flex flex-col gap-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Cozy Streams Menu:</span>
                <div className="flex flex-col gap-2">
                  {streams.map((s) => {
                    const isActive = s.id === activeStreamId;
                    return (
                      <button
                        key={s.id}
                        onClick={() => {
                          setActiveStreamId(s.id);
                        }}
                        className={cn(
                          "p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col gap-1.5",
                          isActive 
                            ? "bg-slate-900 border-teal-500/40 text-teal-300"
                            : "bg-slate-950 border-slate-900 text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
                        )}
                      >
                        <span className="text-xs font-bold">{s.name}</span>
                        <span className="text-[10px] text-slate-500 font-medium leading-relaxed">{s.desc}</span>
                      </button>
                    );
                  })}
                </div>

                {/* VOLUME AND AUDIO CONTROLS */}
                <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 flex flex-col gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Stream Soundscape</span>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setIsStreamMuted(!isStreamMuted)}
                      className="text-slate-400 hover:text-teal-400 cursor-pointer transition-colors"
                    >
                      {isStreamMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-teal-400" />}
                    </button>
                    
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={isStreamMuted ? 0 : streamVolume}
                      onChange={(e) => {
                        setStreamVolume(Number(e.target.value));
                        setIsStreamMuted(false);
                      }}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer mx-3"
                    />

                    <span className="text-[10px] font-mono text-slate-400 w-8 text-right">
                      {isStreamMuted ? '0%' : `${streamVolume}%`}
                    </span>
                  </div>
                </div>
              </div>

              {/* LIVE PLAYBACK STAGE AND FLOATING COMMS CHAT */}
              <div className="flex-1 flex flex-col lg:flex-row gap-6 bg-slate-950 border border-slate-900 rounded-xl p-5 shadow-2xl">
                
                {/* Visual Stage screen with ambient css simulations */}
                <div className="flex-1 aspect-video relative bg-slate-950 rounded-lg overflow-hidden border border-slate-900 flex items-center justify-center">
                  
                  {/* Fireplace scene elements */}
                  {activeStreamId === 'fireplace' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-amber-950/40 via-stone-900 to-slate-950">
                      {/* Burning wood flame placeholder animation */}
                      <div className="relative w-28 h-28 bg-amber-500/15 rounded-full flex items-center justify-center blur-xl animate-pulse" />
                      <div className="absolute bottom-6 flex flex-col items-center gap-1 text-center">
                        <Flame className="w-12 h-12 text-amber-500 animate-bounce" />
                        <span className="text-[10px] font-bold text-amber-200/60 uppercase tracking-widest">🔥 Hearth Logs Burning</span>
                        <span className="text-[9px] text-slate-500">Natural wood pops and deep ambient warmth</span>
                      </div>
                    </div>
                  )}

                  {/* Snowfall cabin forest scene elements */}
                  {activeStreamId === 'snowfall' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-slate-900/60 via-stone-900 to-black">
                      <div className="absolute inset-0 opacity-25">
                        {/* Falling small white dots */}
                        <div className="w-full h-full bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[size:20px_20px] animate-pulse" />
                      </div>
                      <div className="absolute bottom-6 flex flex-col items-center gap-1 text-center">
                        <Snowflake className="w-12 h-12 text-sky-400 animate-spin" style={{ animationDuration: '20s' }} />
                        <span className="text-[10px] font-bold text-sky-200/60 uppercase tracking-widest">❄️ Gentle Snowfall Outside Cabin</span>
                        <span className="text-[9px] text-slate-500">Soft fireplace light and quiet piano melody</span>
                      </div>
                    </div>
                  )}

                  {/* Backyard bird feeder elements */}
                  {activeStreamId === 'birdfeeder' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-emerald-950/40 via-stone-900 to-slate-950">
                      <div className="absolute bottom-6 flex flex-col items-center gap-1 text-center">
                        <Bird className="w-12 h-12 text-teal-400 animate-bounce" />
                        <span className="text-[10px] font-bold text-teal-200/60 uppercase tracking-widest">🐦 Meadow Bird Feeder Camera</span>
                        <span className="text-[9px] text-slate-500">Wild bluebirds feeding, soft swallow chirps</span>
                      </div>
                    </div>
                  )}

                  {/* Overlay live hearts controls */}
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-slate-950/80 px-2.5 py-1 rounded border border-slate-800 text-[10px]">
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                    <span className="font-mono text-slate-300 font-semibold">{streamHearts} likes</span>
                  </div>

                  {/* Stream tap action */}
                  <button
                    onClick={() => {
                      setStreamHearts(prev => prev + 1);
                    }}
                    className="absolute bottom-4 right-4 bg-slate-900/90 border border-slate-800 hover:border-rose-500/40 hover:text-rose-400 text-slate-400 text-[9px] font-bold px-3 py-1.5 rounded cursor-pointer transition-all flex items-center gap-1"
                  >
                    💖 Tap to send heart
                  </button>
                </div>

                {/* Floating neighborhood chat sidebox */}
                <div className="w-full lg:w-64 flex flex-col gap-3 justify-between">
                  <div className="border-b border-slate-900 pb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Stream Chat:</span>
                  </div>

                  {/* Comment records */}
                  <div className="flex-1 max-h-[160px] overflow-y-auto flex flex-col gap-2 scrollbar-none">
                    {streamComments.map((comm) => (
                      <div key={comm.id} className="text-[11px] leading-relaxed bg-slate-900/40 p-2 border border-slate-900 rounded">
                        <strong className="text-teal-400 block font-bold mb-0.5">{comm.user}:</strong>
                        <span className="text-slate-300 italic">&quot;{comm.text}&quot;</span>
                      </div>
                    ))}
                  </div>

                  {/* Comment submit form */}
                  <form onSubmit={handleSendStreamComment} className="flex gap-2 items-center">
                    <input
                      type="text"
                      required
                      value={newStreamComment}
                      onChange={(e) => setNewStreamComment(e.target.value)}
                      placeholder="Say something nice..."
                      className="flex-1 bg-slate-900 border border-slate-850 text-[11px] text-slate-200 px-3 py-2 rounded outline-none focus:border-teal-500/50"
                    />
                    <button
                      type="button"
                      onClick={() => startDictation((t) => setNewStreamComment(prev => prev ? prev + " " + t : t))}
                      className={cn(
                        "p-2 rounded border cursor-pointer",
                        isDictating 
                          ? "bg-rose-500 border-rose-400 text-white animate-pulse" 
                          : "bg-slate-900 border-slate-800 text-teal-400 hover:bg-slate-800"
                      )}
                      title="Speak comment voice dictation 🎙️"
                    >
                      <Mic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="submit"
                      className="bg-teal-600 hover:bg-teal-500 text-stone-950 font-bold text-[11px] px-3 py-2 rounded cursor-pointer"
                    >
                      Send
                    </button>
                  </form>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW G: MY CRAFTING GUILD */}
        {/* ======================================================== */}
        {activeTab === 'craft' && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center bg-slate-950 border border-slate-900 rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">My Crafting Guild</h3>
                  <span className="text-[10px] font-medium text-slate-500 block">A friendly, intergenerational space to share knitting patterns, carpentry, pottery, or painting.</span>
                </div>
              </div>

              {currentUser && (
                <button
                  onClick={() => setIsCraftModalOpen(true)}
                  className="bg-violet-600 hover:bg-violet-500 text-stone-950 text-xs font-bold px-4 py-2.5 rounded cursor-pointer transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Show Off Craft
                </button>
              )}
            </div>

            {/* Crafts Display Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {crafts.map((craft) => (
                <div 
                  key={craft.id}
                  className="bg-slate-950 border border-slate-900 rounded-xl overflow-hidden flex flex-col h-full hover:border-violet-500/30 transition-all shadow-lg"
                >
                  <div className="relative aspect-square overflow-hidden bg-stone-900">
                    <img 
                      src={craft.imageUrl} 
                      alt={craft.title} 
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-3 left-3 text-[9px] font-mono uppercase tracking-widest bg-slate-950/85 text-violet-300 border border-violet-950 px-2.5 py-1 rounded">
                      {craft.category}
                    </span>
                  </div>

                  <div className="p-5 flex flex-col gap-3 flex-1 justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                          {craft.title}
                        </h4>
                        <span className="text-[9px] bg-slate-900 px-2 py-0.5 rounded text-slate-500 font-mono">
                          Age {craft.creatorAge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                        <strong className="text-[9px] uppercase tracking-wider text-slate-500 block mb-0.5">Progress Today:</strong>
                        {craft.progressText}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-2 leading-relaxed italic bg-slate-900/40 p-2 border border-slate-900 rounded">
                        <strong className="text-[9px] uppercase tracking-wider text-slate-500 not-italic block mb-0.5">Pattern & Tips:</strong>
                        {craft.patternOrTips}
                      </p>
                    </div>

                    {/* interactive encourages */}
                    <div className="border-t border-slate-900 pt-3 mt-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mb-2">
                        <span>Cheers: {craft.cheers || 0} 👏</span>
                        <span>{craft.encouragements?.length || 0} Letters ✉️</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleCheerCraft(craft.id)}
                          className="bg-slate-900 hover:bg-violet-950/20 text-violet-300 border border-slate-800 text-[10px] font-bold py-2 rounded cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          👏 Cheer on
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCraft(craft);
                            setCraftEncouragement('');
                          }}
                          className="bg-slate-900 hover:bg-teal-950/20 text-teal-300 border border-slate-800 text-[10px] font-bold py-2 rounded cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          ✉️ Write Letter
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* WRITE LETTER OF ENCOURAGEMENT MODAL */}
            {selectedCraft && (
              <Dialog 
                isOpen={selectedCraft !== null} 
                onClose={() => setSelectedCraft(null)}
                className="max-w-md bg-slate-950 border-teal-950"
              >
                <div className="flex flex-col gap-4 text-slate-200">
                  <div className="border-b border-slate-900 pb-2 flex justify-between items-center">
                    <div>
                      <span className="text-[9px] font-mono uppercase text-teal-400">Craft Encouragement Letter</span>
                      <h3 className="text-sm font-bold text-slate-100">Send support to {selectedCraft.creatorName}</h3>
                    </div>
                  </div>

                  <div className="bg-slate-900/60 p-3 rounded border border-slate-850 text-xs text-slate-400 leading-relaxed italic">
                    &quot;{selectedCraft.progressText}&quot;
                  </div>

                  {/* Encouragements Log */}
                  {selectedCraft.encouragements?.length > 0 && (
                    <div className="flex flex-col gap-2 max-h-[120px] overflow-y-auto">
                      <span className="text-[9px] font-bold uppercase text-slate-500">Neighbor Letters:</span>
                      {selectedCraft.encouragements.map((enc: any, i: number) => (
                        <div key={i} className="text-[11px] bg-slate-900/40 p-2 rounded border border-slate-900 leading-relaxed">
                          <strong className="text-violet-400 block font-bold mb-0.5">{enc.authorName}:</strong>
                          <span className="text-slate-300">&quot;{enc.text}&quot;</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Letter post form */}
                  <form onSubmit={handleSubmitEncouragement} className="flex flex-col gap-3 mt-1">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Write your encouragement letter</label>
                      <textarea
                        required
                        rows={3}
                        value={craftEncouragement}
                        onChange={(e) => setCraftEncouragement(e.target.value)}
                        placeholder="Say something warm and kind about their beautiful wood carving or knitting stitch..."
                        className="bg-slate-900 border border-slate-800 text-xs text-slate-200 p-3 rounded outline-none focus:border-teal-500/50 resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-teal-600 hover:bg-teal-500 text-stone-950 font-bold text-xs py-3 rounded cursor-pointer w-full text-center"
                    >
                      Slip Letter in Postbox 📬
                    </button>
                  </form>
                </div>
              </Dialog>
            )}

            {/* SHOW OFF CRAFT MODAL */}
            <Dialog 
              isOpen={isCraftModalOpen} 
              onClose={() => setIsCraftModalOpen(false)}
              className="max-w-md bg-slate-950 border-violet-950"
            >
              <form onSubmit={handleShareCraft} className="flex flex-col gap-4 text-slate-200">
                <div className="border-b border-slate-900 pb-2">
                  <h3 className="text-sm font-bold text-violet-400 uppercase tracking-wider">Show off Craft Progress</h3>
                  <p className="text-[10px] text-slate-500 mt-1">Share knitting, wood carving, or clay progress with neighbors.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Your Name</label>
                    <input
                      type="text"
                      value={newCraftCreatorName}
                      onChange={(e) => setNewCraftCreatorName(e.target.value)}
                      placeholder="e.g., Arthur Vance"
                      className="bg-slate-900 border border-slate-800 text-xs text-slate-200 p-3 rounded outline-none focus:border-violet-500/50"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Your Age (Encouraged)</label>
                    <input
                      type="number"
                      value={newCraftCreatorAge}
                      onChange={(e) => setNewCraftCreatorAge(Number(e.target.value))}
                      placeholder="65"
                      className="bg-slate-900 border border-slate-800 text-xs text-slate-200 p-3 rounded outline-none focus:border-violet-500/50"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Craft Project Name</label>
                  <input
                    type="text"
                    required
                    value={newCraftTitle}
                    onChange={(e) => setNewCraftTitle(e.target.value)}
                    placeholder="e.g., Autumn Wool Scarf with Cable Stitch"
                    className="bg-slate-900 border border-slate-800 text-xs text-slate-200 p-3 rounded outline-none focus:border-violet-500/50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Craft Category</label>
                  <select
                    value={newCraftCat}
                    onChange={(e: any) => setNewCraftCat(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-xs text-slate-200 p-3 rounded outline-none focus:border-violet-500/50"
                  >
                    <option value="knitting">🧶 Knitting & Crochet</option>
                    <option value="carpentry">🪵 Woodwork & Carpentry</option>
                    <option value="pottery">🏺 Clay & Pottery</option>
                    <option value="painting">🎨 Painting & Sketching</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Photo URL</label>
                  <input
                    type="text"
                    value={newCraftImage}
                    onChange={(e) => setNewCraftImage(e.target.value)}
                    placeholder="Paste a progress photo link or leave blank"
                    className="bg-slate-900 border border-slate-800 text-xs text-slate-200 p-3 rounded outline-none focus:border-violet-500/50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Progress Description</label>
                  <textarea
                    required
                    rows={2}
                    value={newCraftProgress}
                    onChange={(e) => setNewCraftProgress(e.target.value)}
                    placeholder="e.g., Finished the heel turn and pattern length looks gorgeous!"
                    className="bg-slate-900 border border-slate-800 text-xs text-slate-200 p-3 rounded outline-none focus:border-violet-500/50 resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Patterns, Tips, or Materials Used</label>
                  <input
                    type="text"
                    value={newCraftTips}
                    onChange={(e) => setNewCraftTips(e.target.value)}
                    placeholder="e.g., Needles size 4, 100% cashmere yarn"
                    className="bg-slate-900 border border-slate-800 text-xs text-slate-200 p-3 rounded outline-none focus:border-violet-500/50"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-violet-600 hover:bg-violet-500 text-stone-950 font-bold text-xs py-3 rounded cursor-pointer mt-2"
                >
                  Share Project with Guild
                </button>
              </form>
            </Dialog>
          </div>
        )}

      </div>

      {/* FULL COZY DETAILED PHOTO LIGHTBOX DIALOG */}
      <Dialog
        isOpen={selectedPost !== null}
        onClose={() => setSelectedPost(null)}
        className="max-w-xl border-slate-800 bg-slate-950"
      >
        {selectedPost && (
          <PostCard
            post={selectedPost}
            onRefresh={async () => {
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
