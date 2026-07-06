'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coffee, Users, Smile, Heart, MapPin, Radio, Sparkles, Send, Plus, Loader2, 
  Music, Check, HelpCircle, Sunset, Sun, Eye, ChevronRight, MessageSquare 
} from 'lucide-react';
import { 
  getNeighbors, sendNeighborNudge, updateNeighborMood, 
  getBulletins, createBulletin, 
  getCozyStrolls, createCozyStroll, joinCozyStroll,
  getSkySnapshots, createSkySnapshot,
  getCookieJarTreats, createCookieJarTreat, claimCookieJarTreat,
  getWisdomReflections, createWisdomReflection,
  getHelpingHandPosts, createHelpingHandPost,
  getNeighborhoodSounds, createNeighborhoodSound,
  getCurrentUser
} from '@/lib/actions';
import { User as UserType } from '@/lib/db';
import { cn } from '@/lib/utils';

export default function CozyNeighborsPage() {
  const [currentUser, setCurrentUser] = React.useState<UserType | null>(null);
  const [loading, setLoading] = React.useState(true);
  
  // Data States
  const [neighbors, setNeighbors] = React.useState<any[]>([]);
  const [bulletins, setBulletins] = React.useState<any[]>([]);
  const [strolls, setStrolls] = React.useState<any[]>([]);
  const [skySnaps, setSkySnaps] = React.useState<any[]>([]);
  const [treats, setTreats] = React.useState<any[]>([]);
  const [wisdom, setWisdom] = React.useState<any[]>([]);
  const [helps, setHelps] = React.useState<any[]>([]);
  const [sounds, setSounds] = React.useState<any[]>([]);

  // Interactive Form States
  const [myVibeEmoji, setMyVibeEmoji] = React.useState('☕');
  const [myVibeLabel, setMyVibeLabel] = React.useState('');
  const [isUpdatingVibe, setIsUpdatingVibe] = React.useState(false);

  const [newBulletinText, setNewBulletinText] = React.useState('');
  const [newBulletinColor, setNewBulletinColor] = React.useState('yellow');
  const [isPostingBulletin, setIsPostingBulletin] = React.useState(false);

  const [strollTitle, setStrollTitle] = React.useState('');
  const [strollTime, setStrollTime] = React.useState('');
  const [strollLocation, setStrollLocation] = React.useState('');
  const [isPostingStroll, setIsPostingStroll] = React.useState(false);

  const [skyUrl, setSkyUrl] = React.useState('');
  const [skyDesc, setSkyDesc] = React.useState('');
  const [isPostingSky, setIsPostingSky] = React.useState(false);

  const [treatTitle, setTreatTitle] = React.useState('');
  const [treatDesc, setTreatDesc] = React.useState('');
  const [treatPortions, setTreatPortions] = React.useState(4);
  const [isPostingTreat, setIsPostingTreat] = React.useState(false);

  const [wisdomText, setWisdomText] = React.useState('');
  const [wisdomPrompt, setWisdomPrompt] = React.useState('What is a small detail in nature that brings you pure joy?');
  const [isPostingWisdom, setIsPostingWisdom] = React.useState(false);

  const [helpTitle, setHelpTitle] = React.useState('');
  const [helpDesc, setHelpDesc] = React.useState('');
  const [helpType, setHelpType] = React.useState<'need' | 'offer'>('need');
  const [isPostingHelp, setIsPostingHelp] = React.useState(false);

  const [soundTitle, setSoundTitle] = React.useState('');
  const [isPostingSound, setIsPostingSound] = React.useState(false);

  // Floating Hearts / Emojis Particle State for Nudges (Feature 1)
  const [activeParticles, setActiveParticles] = React.useState<{ id: number; emoji: string; x: number; y: number; targetX: number }[]>([]);

  // Soundscape Playing State (Feature 10)
  const [playingSoundId, setPlayingSoundId] = React.useState<string | null>(null);

  // Web Audio refs for neighborhood soundscapes
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const audioNodesRef = React.useRef<any[]>([]);
  const audioTimersRef = React.useRef<any[]>([]);

  const stopNeighborhoodSound = () => {
    audioTimersRef.current.forEach(timer => {
      try {
        clearTimeout(timer);
        clearInterval(timer);
      } catch {}
    });
    audioTimersRef.current = [];

    audioNodesRef.current.forEach(node => {
      try {
        node.stop();
      } catch {}
    });
    audioNodesRef.current = [];
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {}
      audioCtxRef.current = null;
    }
  };

  const startNeighborhoodSound = (sound: any) => {
    stopNeighborhoodSound();

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const title = sound.title.toLowerCase();
      const audioUrl = sound.audioDataUrl || '';

      const muffleFilter = ctx.createBiquadFilter();
      muffleFilter.type = 'lowpass';
      muffleFilter.frequency.setValueAtTime(3200, ctx.currentTime);

      const globalGain = ctx.createGain();
      globalGain.gain.setValueAtTime(0.2, ctx.currentTime);

      muffleFilter.connect(globalGain);
      globalGain.connect(ctx.destination);

      audioNodesRef.current = [muffleFilter, globalGain];

      const generateRainSamples = (size: number) => {
        const d = new Float32Array(size);
        for (let i = 0; i < d.length; i++) {
          d[i] = Math.random() * 2 - 1;
        }
        return d;
      };

      if (audioUrl === 'simulated_rain' || title.includes('rain') || title.includes('canopy')) {
        // Raindrops soundscape
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        noiseBuffer.getChannelData(0).set(generateRainSamples(bufferSize));

        const rainSource = ctx.createBufferSource();
        rainSource.buffer = noiseBuffer;
        rainSource.loop = true;

        const rainFilter = ctx.createBiquadFilter();
        rainFilter.type = 'lowpass';
        rainFilter.frequency.setValueAtTime(600, ctx.currentTime);

        const rainGain = ctx.createGain();
        rainGain.gain.setValueAtTime(0.12, ctx.currentTime);

        rainSource.connect(rainFilter);
        rainFilter.connect(rainGain);
        rainGain.connect(muffleFilter);

        rainSource.start();
        audioNodesRef.current.push(rainSource, rainFilter, rainGain);

        // Slow soft thunder rolls
        const triggerThunder = () => {
          if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
          try {
            const thunderOsc = ctx.createOscillator();
            const thunderFilter = ctx.createBiquadFilter();
            const thunderGain = ctx.createGain();

            thunderOsc.type = 'sawtooth';
            thunderOsc.frequency.setValueAtTime(45, ctx.currentTime);

            thunderFilter.type = 'lowpass';
            thunderFilter.frequency.setValueAtTime(65, ctx.currentTime);

            thunderGain.gain.setValueAtTime(0.001, ctx.currentTime);
            thunderGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 1.2);
            thunderGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 5.5);

            thunderOsc.connect(thunderFilter);
            thunderFilter.connect(thunderGain);
            thunderGain.connect(muffleFilter);

            thunderOsc.start();
            thunderOsc.stop(ctx.currentTime + 6.0);
          } catch {}

          const nextInterval = Math.random() * 8000 + 7000;
          const timerId = setTimeout(triggerThunder, nextInterval);
          audioTimersRef.current.push(timerId);
        };
        const timerId = setTimeout(triggerThunder, 3000);
        audioTimersRef.current.push(timerId);

      } else if (audioUrl === 'simulated_birds' || title.includes('bird') || title.includes('swallow') || title.includes('chirp')) {
        // Brook & bird chirping soundscape
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        noiseBuffer.getChannelData(0).set(generateRainSamples(bufferSize));

        const brookSource = ctx.createBufferSource();
        brookSource.buffer = noiseBuffer;
        brookSource.loop = true;

        const brookFilter = ctx.createBiquadFilter();
        brookFilter.type = 'bandpass';
        brookFilter.frequency.setValueAtTime(420, ctx.currentTime);
        brookFilter.Q.setValueAtTime(1.5, ctx.currentTime);

        const brookGain = ctx.createGain();
        brookGain.gain.setValueAtTime(0.08, ctx.currentTime);

        const brookLfo = ctx.createOscillator();
        const brookLfoGain = ctx.createGain();
        brookLfo.frequency.setValueAtTime(5.5, ctx.currentTime);
        brookLfoGain.gain.setValueAtTime(80, ctx.currentTime);

        brookLfo.connect(brookLfoGain);
        brookLfoGain.connect(brookFilter.frequency);

        brookSource.connect(brookFilter);
        brookFilter.connect(brookGain);
        brookGain.connect(muffleFilter);

        brookSource.start();
        brookLfo.start();

        audioNodesRef.current.push(brookSource, brookFilter, brookGain, brookLfo, brookLfoGain);

        // Birds chirps
        const triggerChirp = () => {
          if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
          try {
            const now = ctx.currentTime;
            const count = Math.floor(Math.random() * 3) + 2;
            for (let i = 0; i < count; i++) {
              const osc = ctx.createOscillator();
              const gainNode = ctx.createGain();
              osc.type = 'sine';

              const startFreq = Math.random() * 500 + 1900;
              const endFreq = startFreq + Math.random() * 800 + 300;
              const tStart = now + i * 0.12;
              const tEnd = tStart + 0.08;

              osc.frequency.setValueAtTime(startFreq, tStart);
              osc.frequency.exponentialRampToValueAtTime(endFreq, tEnd);

              gainNode.gain.setValueAtTime(0.02, tStart);
              gainNode.gain.exponentialRampToValueAtTime(0.0001, tEnd);

              osc.connect(gainNode);
              gainNode.connect(muffleFilter);

              osc.start(tStart);
              osc.stop(tEnd + 0.01);
            }
          } catch {}

          const nextInterval = Math.random() * 4000 + 2000;
          const timerId = setTimeout(triggerChirp, nextInterval);
          audioTimersRef.current.push(timerId);
        };
        triggerChirp();

      } else {
        // General warm neighborhood hum / lawn mower / wind / fountain drone
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(110, ctx.currentTime); // Low A

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(110.4, ctx.currentTime); // Detuned

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(280, ctx.currentTime);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(muffleFilter);

        osc1.start();
        osc2.start();

        audioNodesRef.current.push(osc1, osc2, filter);

        // Gentle cricket chirps or background wind sweeps
        const triggerCricket = () => {
          if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
          try {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(4200, ctx.currentTime);

            gainNode.gain.setValueAtTime(0.005, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);

            osc.connect(gainNode);
            gainNode.connect(muffleFilter);

            osc.start();
            osc.stop(ctx.currentTime + 0.16);
          } catch {}

          const nextInterval = Math.random() * 2000 + 800;
          const timerId = setTimeout(triggerCricket, nextInterval);
          audioTimersRef.current.push(timerId);
        };
        triggerCricket();
      }

    } catch (e) {
      console.error('Neighborhood soundscape play failed:', e);
    }
  };

  React.useEffect(() => {
    return () => {
      stopNeighborhoodSound();
    };
  }, []);

  // Selected Hub Tab
  const [activeTab, setActiveTab] = React.useState<'board' | 'strolls' | 'sky' | 'kitchen' | 'wisdom' | 'kindness' | 'sounds'>('board');

  const loadAllData = async () => {
    try {
      const [
        userRes, neighborsRes, bulletinsRes, strollsRes, 
        skyRes, treatsRes, wisdomRes, helpsRes, soundsRes
      ] = await Promise.all([
        getCurrentUser(), getNeighbors(), getBulletins(), getCozyStrolls(),
        getSkySnapshots(), getCookieJarTreats(), getWisdomReflections(), 
        getHelpingHandPosts(), getNeighborhoodSounds()
      ]);

      setCurrentUser(userRes);
      setNeighbors(neighborsRes);
      setBulletins(bulletinsRes);
      setStrolls(strollsRes);
      setSkySnaps(skyRes);
      setTreats(treatsRes);
      setWisdom(wisdomRes);
      setHelps(helpsRes);
      setSounds(soundsRes);

      if (userRes) {
        const myMood = neighborsRes.find(n => n.id === userRes.id);
        if (myMood) {
          setMyVibeEmoji(myMood.vibeEmoji);
          setMyVibeLabel(myMood.vibeLabel);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    Promise.resolve().then(() => {
      loadAllData();
    });
  }, []);

  // 1. Friendly Waves / Hugs Nudges Action
  const handleSendNudge = async (neighborId: string, type: 'wave' | 'hug' | 'tea', e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top;

    const emojiMap = { wave: '👋', hug: '🤗', tea: '☕' };
    const emoji = emojiMap[type];

    // Spawn 5 bounciness particles
    const newParticles = Array.from({ length: 6 }).map((_, i) => {
      const offset = Math.random() * 40 - 20;
      return {
        id: Date.now() + i,
        emoji,
        x: x + (Math.random() * 80 - 40),
        y: y - (Math.random() * 40 + 20),
        targetX: x + offset
      };
    });

    setActiveParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setActiveParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 1500);

    const res = await sendNeighborNudge(neighborId, type);
    if (res.success) {
      setNeighbors(prev => prev.map(n => {
        if (n.id === neighborId) {
          return { ...n, totalNudgesReceived: n.totalNudgesReceived + 1, hasNudged: true };
        }
        return n;
      }));
    }
  };

  // 2. Local Mood Badges update
  const handleUpdateVibe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingVibe(true);
    const res = await updateNeighborMood(myVibeEmoji, myVibeLabel);
    if (res.success) {
      const updatedNeighbors = await getNeighbors();
      setNeighbors(updatedNeighbors);
    }
    setIsUpdatingVibe(false);
  };

  // 3. Post-it Bulletins Action
  const handlePostBulletin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBulletinText.trim()) return;
    setIsPostingBulletin(true);
    const res = await createBulletin(newBulletinText, newBulletinColor);
    if (res.success) {
      setNewBulletinText('');
      const updated = await getBulletins();
      setBulletins(updated);
    }
    setIsPostingBulletin(false);
  };

  // 4. Strolls Actions
  const handleCreateStroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!strollTitle.trim() || !strollTime.trim() || !strollLocation.trim()) return;
    setIsPostingStroll(true);
    const res = await createCozyStroll(strollTitle, strollTime, strollLocation);
    if (res.success) {
      setStrollTitle('');
      setStrollTime('');
      setStrollLocation('');
      const updated = await getCozyStrolls();
      setStrolls(updated);
    }
    setIsPostingStroll(false);
  };

  const handleJoinStroll = async (strollId: string) => {
    const res = await joinCozyStroll(strollId);
    if (res.success) {
      const updated = await getCozyStrolls();
      setStrolls(updated);
    }
  };

  // 5. Sky Snapshots Actions
  const handlePostSky = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skyUrl.trim()) return;
    setIsPostingSky(true);
    const res = await createSkySnapshot(skyUrl, skyDesc);
    if (res.success) {
      setSkyUrl('');
      setSkyDesc('');
      const updated = await getSkySnapshots();
      setSkySnaps(updated);
    }
    setIsPostingSky(false);
  };

  // 6. Kitchen Treats Actions
  const handlePostTreat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!treatTitle.trim() || !treatDesc.trim()) return;
    setIsPostingTreat(true);
    const res = await createCookieJarTreat(treatTitle, treatDesc, Number(treatPortions));
    if (res.success) {
      setTreatTitle('');
      setTreatDesc('');
      setTreatPortions(4);
      const updated = await getCookieJarTreats();
      setTreats(updated);
    }
    setIsPostingTreat(false);
  };

  const handleClaimTreat = async (treatId: string) => {
    const res = await claimCookieJarTreat(treatId);
    if (res.success) {
      const updated = await getCookieJarTreats();
      setTreats(updated);
    } else {
      alert(res.error);
    }
  };

  // 7. Wisdom Prompts Actions
  const handlePostWisdom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wisdomText.trim()) return;
    setIsPostingWisdom(true);
    const res = await createWisdomReflection(wisdomPrompt, wisdomText);
    if (res.success) {
      setWisdomText('');
      const updated = await getWisdomReflections();
      setWisdom(updated);
    }
    setIsPostingWisdom(false);
  };

  // 8. Kindness Helping Hands Actions
  const handlePostHelp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!helpTitle.trim() || !helpDesc.trim()) return;
    setIsPostingHelp(true);
    const res = await createHelpingHandPost(helpTitle, helpDesc, helpType);
    if (res.success) {
      setHelpTitle('');
      setHelpDesc('');
      const updated = await getHelpingHandPosts();
      setHelps(updated);
    }
    setIsPostingHelp(false);
  };

  // 9. Soundscapes Actions
  const handlePostSound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!soundTitle.trim()) return;
    setIsPostingSound(true);
    const res = await createNeighborhoodSound(soundTitle, 'simulated_sound');
    if (res.success) {
      setSoundTitle('');
      const updated = await getNeighborhoodSounds();
      setSounds(updated);
    }
    setIsPostingSound(false);
  };

  if (loading) {
    return (
      <div className="w-full h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Opening Neighborhood Gate...</span>
      </div>
    );
  }

  return (
    <div id="cozy-neighbors-hub" className="w-full max-w-5xl mx-auto px-6 py-8 flex flex-col gap-8 text-slate-200">
      
      {/* Dynamic Floating particles for Wave / Hug reactions */}
      <AnimatePresence>
        {activeParticles.map(p => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, scale: 0.8, x: p.x, y: p.y }}
            animate={{ opacity: 0, scale: 2, y: p.y - 120, x: p.targetX }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="fixed pointer-events-none z-50 text-3xl filter drop-shadow-[0_4px_10px_rgba(124,58,237,0.3)]"
          >
            {p.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* HEADER HERO AREA */}
      <div className="w-full bg-slate-900/40 border border-slate-900 rounded p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Coffee className="w-7 h-7" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-base font-bold uppercase tracking-[0.2em] text-slate-100 flex items-center gap-2">
              Cozy Neighborhood Hub <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Local</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-xl mt-1.5 leading-relaxed font-sans">
              Welcome to our warm neighborhood center! A peaceful, simple space to connect, share fresh treats, schedule relaxed walks, and support each other with small kindnesses. Perfect for kids, parents, and grannies alike!
            </p>
          </div>
        </div>

        {/* CURRENT USER VIBE UPDATE CARD */}
        {currentUser && (
          <div className="bg-slate-950 p-4 rounded border border-slate-900 w-full md:max-w-xs flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Set My Daily Vibe:</span>
            </div>
            <form onSubmit={handleUpdateVibe} className="flex gap-2">
              <select
                value={myVibeEmoji}
                onChange={(e) => setMyVibeEmoji(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs px-2 py-1.5 rounded outline-none focus:border-violet-500 cursor-pointer"
              >
                {['☕', '🌸', '🚶‍♀️', '📖', '☀️', '🍲', '🎨', '🧹', '🐈', '🧘‍♀️'].map(emoji => (
                  <option key={emoji} value={emoji}>{emoji}</option>
                ))}
              </select>
              <input
                type="text"
                value={myVibeLabel}
                onChange={(e) => setMyVibeLabel(e.target.value.substring(0, 30))}
                placeholder="What are you up to today?"
                className="flex-1 bg-slate-900/60 border border-slate-800 text-[11px] text-slate-200 px-3 py-1.5 rounded outline-none placeholder:text-slate-600 focus:border-violet-500 focus:bg-slate-900"
              />
              <button
                type="submit"
                disabled={isUpdatingVibe}
                className="px-2.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded text-[10px] font-bold uppercase cursor-pointer"
              >
                {isUpdatingVibe ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Set'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* SECTION 1: NEIGHBOR VIBE GRID WITH WARM REACTIONS */}
      <div className="flex flex-col gap-4">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2">
          <Smile className="w-4 h-4 text-teal-400" /> Active Cozy Neighbors Around You
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {neighbors.map(n => {
            const isMe = currentUser ? currentUser.id === n.id : false;

            return (
              <div 
                key={n.id}
                className="relative bg-slate-900/30 border border-slate-900 rounded p-4 flex flex-col items-center text-center gap-2 hover:border-violet-500/30 transition-all group"
              >
                {/* Neighbor avatar & Active Vibe Badge */}
                <div className="relative">
                  <img
                    src={n.avatarUrl || 'https://picsum.photos/seed/placeholder/100/100'}
                    alt={n.displayName}
                    className="w-14 h-14 rounded-full object-cover p-0.5 border border-slate-800 group-hover:border-violet-500/40 transition-colors"
                  />
                  {/* Floating vibe bubble */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-xs shadow-md">
                    {n.vibeEmoji}
                  </div>
                </div>

                <div className="flex flex-col leading-tight mt-1 max-w-full">
                  <span className="text-[11px] font-bold text-slate-200 truncate">{n.displayName}</span>
                  <span className="text-[9px] text-teal-400 font-medium truncate mt-0.5">@{n.username}</span>
                </div>

                <div className="bg-slate-950 px-2.5 py-1 rounded border border-slate-900/60 max-w-full">
                  <span className="text-[10px] text-slate-400 italic font-sans break-words block">
                    {n.vibeLabel || '"Just relaxing"'}
                  </span>
                </div>

                {/* React Greetings Drawer (Hidden for self) */}
                {!isMe ? (
                  <div className="flex gap-1 pt-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleSendNudge(n.id, 'wave', e)}
                      title="Wave Hello"
                      className="p-1.5 hover:bg-slate-800 rounded text-[11px] transition-colors cursor-pointer"
                    >
                      👋
                    </button>
                    <button
                      onClick={(e) => handleSendNudge(n.id, 'hug', e)}
                      title="Send Cozy Hug"
                      className="p-1.5 hover:bg-slate-800 rounded text-[11px] transition-colors cursor-pointer"
                    >
                      🤗
                    </button>
                    <button
                      onClick={(e) => handleSendNudge(n.id, 'tea', e)}
                      title="Offer Warm Cup of Tea"
                      className="p-1.5 hover:bg-slate-800 rounded text-[11px] transition-colors cursor-pointer"
                    >
                      ☕
                    </button>
                  </div>
                ) : (
                  <span className="text-[8px] font-bold text-violet-500/60 uppercase mt-2">That is You!</span>
                )}

                {/* Total Nudges Tracker */}
                {n.totalNudgesReceived > 0 && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 text-[8px] font-semibold bg-violet-600/10 text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded-full">
                    <span>{n.totalNudgesReceived} vibes received</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CORE INTERACTIVE BULLETINS / STROLLS / KITCHEN TABBED HUB */}
      <div className="w-full flex flex-col gap-6">
        
        {/* TAB SWITCHER */}
        <div className="flex border-b border-slate-900 overflow-x-auto scrollbar-none pb-0.5 gap-1">
          {[
            { id: 'board', label: '📌 Neighbor Bulletin', color: 'text-amber-400 border-amber-500' },
            { id: 'strolls', label: '🚶‍♀️ Cozy Strolls', color: 'text-emerald-400 border-emerald-500' },
            { id: 'kitchen', label: '🧁 The Cookie Jar', color: 'text-rose-400 border-rose-500' },
            { id: 'sky', label: '☁️ Sky Window', color: 'text-sky-400 border-sky-500' },
            { id: 'wisdom', label: '📜 Wisdom Corner', color: 'text-violet-400 border-violet-500' },
            { id: 'kindness', label: '🤝 Helping Hands', color: 'text-teal-400 border-teal-500' },
            { id: 'sounds', label: '🎧 Local Hums', color: 'text-indigo-400 border-indigo-500' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap cursor-pointer",
                activeTab === tab.id 
                  ? `${tab.color} bg-slate-900/30` 
                  : "border-transparent text-slate-500 hover:text-slate-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB CONTENTS CONTAINER */}
        <div className="bg-slate-900/10 border border-slate-900 rounded p-6 min-h-[300px] shadow-sm">
          
          {/* TAB A: THE BULLETIN BOARD */}
          {activeTab === 'board' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col">
                  <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                    📌 Interactive Neighborhood bulletins
                  </h3>
                  <span className="text-[10px] text-slate-500 font-sans mt-0.5">Write simple sticky notes, share lost items, or tell quick cozy local updates!</span>
                </div>

                {/* Bulletin Poster Form */}
                <form onSubmit={handlePostBulletin} className="flex flex-col sm:flex-row gap-2 max-w-md w-full">
                  <div className="flex gap-2 flex-1">
                    <select
                      value={newBulletinColor}
                      onChange={(e) => setNewBulletinColor(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-[11px] px-2.5 py-1.5 rounded outline-none cursor-pointer"
                    >
                      <option value="yellow">💛 Pastel Yellow</option>
                      <option value="green">💚 Soft Green</option>
                      <option value="pink">💖 Gentle Pink</option>
                    </select>
                    <input
                      type="text"
                      required
                      value={newBulletinText}
                      onChange={(e) => setNewBulletinText(e.target.value.substring(0, 150))}
                      placeholder="Write a sweet message (e.g. Spotted lost kitty!)"
                      className="flex-1 bg-slate-950/80 border border-slate-800 text-[11px] text-slate-200 px-3 py-2 rounded outline-none placeholder:text-slate-600 focus:border-amber-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isPostingBulletin}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded text-[10px] uppercase tracking-wider cursor-pointer"
                  >
                    {isPostingBulletin ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" /> : 'Pin Note'}
                  </button>
                </form>
              </div>

              {/* POST-IT CORKBOARD CONTAINER */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                {bulletins.length === 0 ? (
                  <div className="col-span-3 py-12 text-center text-xs text-slate-600 italic">No notes pinned yet. Share something friendly!</div>
                ) : (
                  bulletins.map((bulletin, index) => {
                    const colorClasses = {
                      yellow: "bg-amber-100 border-amber-200 text-amber-950 shadow-[0_4px_12px_rgba(245,158,11,0.15)]",
                      green: "bg-emerald-100 border-emerald-200 text-emerald-950 shadow-[0_4px_12px_rgba(16,185,129,0.15)]",
                      pink: "bg-rose-100 border-rose-200 text-rose-950 shadow-[0_4px_12px_rgba(244,63,94,0.15)]"
                    }[bulletin.color as 'yellow' | 'green' | 'pink'] || "bg-amber-100";

                    return (
                      <motion.div
                        key={bulletin.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          "p-5 rounded border relative font-sans flex flex-col justify-between min-h-[140px]",
                          colorClasses
                        )}
                        style={{ transform: `rotate(${(index % 3 - 1) * 1.5}deg)` }}
                      >
                        {/* Red pin detail at the top center */}
                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-rose-500 border border-rose-600 shadow-md flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-white opacity-60" />
                        </div>

                        <p className="text-xs font-medium leading-relaxed font-sans mb-4">
                          {bulletin.content}
                        </p>

                        <div className="flex items-center gap-2 border-t border-black/5 pt-2.5 mt-auto">
                          <img
                            src={bulletin.avatarUrl || 'https://picsum.photos/seed/placeholder/50/50'}
                            alt={bulletin.displayName}
                            className="w-5 h-5 rounded-full object-cover border border-black/10"
                          />
                          <div className="flex flex-col leading-none">
                            <span className="text-[9px] font-bold">@{bulletin.username}</span>
                            <span className="text-[8px] opacity-60 mt-0.5">
                              {new Date(bulletin.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB B: COZY STROLLS */}
          {activeTab === 'strolls' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex flex-col">
                  <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                    🚶‍♀️ Cozy Strolls & Dog walks
                  </h3>
                  <span className="text-[10px] text-slate-500 font-sans mt-0.5">Organize zero-pressure morning walking routines, bird-watching, or courtyard tea meetups!</span>
                </div>

                {/* Stroll Creation Form */}
                <form onSubmit={handleCreateStroll} className="bg-slate-950 p-4 rounded border border-slate-900 w-full md:max-w-md flex flex-col gap-3">
                  <span className="text-[9px] font-bold uppercase text-slate-400">Propose a Local Meetup/Walk:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={strollTitle}
                      onChange={(e) => setStrollTitle(e.target.value.substring(0, 40))}
                      placeholder="Stroll Name (e.g. Dog Walk 🐕)"
                      className="bg-slate-900 border border-slate-800 text-[11px] px-3 py-1.5 rounded outline-none focus:border-emerald-500"
                    />
                    <input
                      type="text"
                      required
                      value={strollTime}
                      onChange={(e) => setStrollTime(e.target.value.substring(0, 30))}
                      placeholder="When (e.g. 5:30 PM Today)"
                      className="bg-slate-900 border border-slate-800 text-[11px] px-3 py-1.5 rounded outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={strollLocation}
                      onChange={(e) => setStrollLocation(e.target.value.substring(0, 50))}
                      placeholder="Meeting Spot (e.g. Near Rose Garden Bench)"
                      className="flex-1 bg-slate-900 border border-slate-800 text-[11px] px-3 py-1.5 rounded outline-none focus:border-emerald-500"
                    />
                    <button
                      type="submit"
                      disabled={isPostingStroll}
                      className="px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase rounded tracking-wider cursor-pointer flex-shrink-0"
                    >
                      {isPostingStroll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Schedule'}
                    </button>
                  </div>
                </form>
              </div>

              {/* STROLLS LIST */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {strolls.length === 0 ? (
                  <div className="col-span-2 py-12 text-center text-xs text-slate-600 italic">No strolls scheduled yet. Be the first to start a cozy walk!</div>
                ) : (
                  strolls.map(stroll => {
                    const isAttending = currentUser ? stroll.attendees.includes(currentUser.username) : false;

                    return (
                      <div key={stroll.id} className="bg-slate-900/40 border border-slate-900 rounded p-4 flex flex-col justify-between gap-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                              <MapPin className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[11px] font-bold text-slate-200">{stroll.title}</span>
                              <span className="text-[9px] text-emerald-400 font-medium mt-0.5">{stroll.time}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-900/60 text-[9px] text-slate-500 font-medium">
                            <span>Started by</span>
                            <span className="text-slate-300 font-bold">@{stroll.username}</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1 px-1 text-[10px] text-slate-400 font-sans">
                          <span className="flex items-center gap-1.5">📍 Meet-up at: <strong className="text-slate-200">{stroll.location}</strong></span>
                        </div>

                        {/* Attendees List */}
                        <div className="flex items-center justify-between border-t border-slate-900/60 pt-3 mt-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Joining:</span>
                            <div className="flex flex-wrap gap-1">
                              {stroll.attendees.map((user: string) => (
                                <span key={user} className="bg-slate-950 border border-slate-800 text-slate-300 px-2 py-0.5 rounded text-[8px] font-bold">
                                  @{user}
                                </span>
                              ))}
                            </div>
                          </div>

                          <button
                            onClick={() => handleJoinStroll(stroll.id)}
                            className={cn(
                              "px-3 py-1.5 rounded text-[9px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1",
                              isAttending
                                ? "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white"
                                : "bg-emerald-600 text-white hover:bg-emerald-500"
                            )}
                          >
                            {isAttending ? <Check className="w-3 h-3" /> : null}
                            {isAttending ? 'Leave Stroll' : 'Join Stroll 🐾'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB C: THE COOKIE JAR TREATS */}
          {activeTab === 'kitchen' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex flex-col">
                  <h3 className="text-sm font-bold text-rose-400 flex items-center gap-1.5">
                    🧁 The Cookie Jar (Treat Sharing)
                  </h3>
                  <span className="text-[10px] text-slate-500 font-sans mt-0.5">Baked extra cookies, lemons, or home-cooked pies? Share a plate with neighbors!</span>
                </div>

                {/* Baked share Form */}
                <form onSubmit={handlePostTreat} className="bg-slate-950 p-4 rounded border border-slate-900 w-full md:max-w-md flex flex-col gap-3">
                  <span className="text-[9px] font-bold uppercase text-slate-400">Offer plates / baking treats:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={treatTitle}
                      onChange={(e) => setTreatTitle(e.target.value.substring(0, 40))}
                      placeholder="What is it? (e.g. Sourdough Loaf 🍞)"
                      className="bg-slate-900 border border-slate-800 text-[11px] px-3 py-1.5 rounded outline-none focus:border-rose-500"
                    />
                    <select
                      value={treatPortions}
                      onChange={(e) => setTreatPortions(Number(e.target.value))}
                      className="bg-slate-900 border border-slate-800 text-[11px] px-3 py-1.5 rounded outline-none cursor-pointer focus:border-rose-500"
                    >
                      {[2, 3, 4, 5, 6, 8, 10].map(p => (
                        <option key={p} value={p}>{p} portions available</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={treatDesc}
                      onChange={(e) => setTreatDesc(e.target.value.substring(0, 100))}
                      placeholder="Add simple details (e.g. Warm out of the oven!)"
                      className="flex-1 bg-slate-900 border border-slate-800 text-[11px] px-3 py-1.5 rounded outline-none focus:border-rose-500"
                    />
                    <button
                      type="submit"
                      disabled={isPostingTreat}
                      className="px-4 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold uppercase rounded tracking-wider cursor-pointer"
                    >
                      {isPostingTreat ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Share Treats'}
                    </button>
                  </div>
                </form>
              </div>

              {/* TREATS LIST */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {treats.length === 0 ? (
                  <div className="col-span-2 py-12 text-center text-xs text-slate-600 italic">No delicious treats shared yet. Why not bake some muffins?</div>
                ) : (
                  treats.map(treat => {
                    const portionsLeft = treat.totalPortions - treat.claimedByUsernames.length;
                    const isClaimed = currentUser ? treat.claimedByUsernames.includes(currentUser.username) : false;

                    return (
                      <div key={treat.id} className="bg-slate-900/40 border border-slate-900 rounded p-4 flex gap-4">
                        {/* Treat image wrapper with emoji overlay */}
                        <div className="relative w-16 h-16 rounded bg-slate-950 border border-slate-800 flex items-center justify-center flex-shrink-0 text-3xl">
                          🧁
                        </div>

                        <div className="flex-1 flex flex-col justify-between gap-2">
                          <div className="flex justify-between items-start gap-1">
                            <div className="flex flex-col">
                              <span className="text-[11px] font-bold text-slate-200">{treat.title}</span>
                              <span className="text-[9px] text-slate-500 mt-0.5">Shared by @{treat.username}</span>
                            </div>

                            <span className={cn(
                              "text-[8px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider",
                              portionsLeft > 0 
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
                                : "bg-slate-900 text-slate-600 border-slate-800"
                            )}>
                              {portionsLeft} / {treat.totalPortions} left
                            </span>
                          </div>

                          <p className="text-[10px] text-slate-400 leading-normal font-sans">
                            {treat.description}
                          </p>

                          {/* Claim button & Claimers list */}
                          <div className="flex items-center justify-between border-t border-slate-900/60 pt-2 mt-1">
                            <div className="flex flex-wrap gap-1">
                              {treat.claimedByUsernames.map((user: string) => (
                                <span key={user} className="bg-slate-950 border border-slate-850 rounded px-1.5 py-0.5 text-[7px] text-slate-500">
                                  @{user} claimed 🧺
                                </span>
                              ))}
                            </div>

                            <button
                              disabled={portionsLeft === 0 && !isClaimed}
                              onClick={() => handleClaimTreat(treat.id)}
                              className={cn(
                                "px-3 py-1.5 rounded text-[9px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1",
                                isClaimed
                                  ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                                  : (portionsLeft === 0 
                                      ? "bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-850" 
                                      : "bg-rose-600 hover:bg-rose-500 text-white")
                              )}
                            >
                              {isClaimed ? <Check className="w-3 h-3" /> : null}
                              {isClaimed ? 'Claimed!' : (portionsLeft === 0 ? 'Empty Jar' : 'Stop by & Pick Up 🧺')}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB D: THE SKY WINDOW */}
          {activeTab === 'sky' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex flex-col">
                  <h3 className="text-sm font-bold text-sky-400 flex items-center gap-1.5">
                    ☁️ Neighborhood Sky Window
                  </h3>
                  <span className="text-[10px] text-slate-500 font-sans mt-0.5">Snap a simple picture of the clouds, sunset, or morning sky and share it with everyone!</span>
                </div>

                {/* Sky Snapshot Creation Form */}
                <form onSubmit={handlePostSky} className="bg-slate-950 p-4 rounded border border-slate-900 w-full md:max-w-md flex flex-col gap-3">
                  <span className="text-[9px] font-bold uppercase text-slate-400">Share today&apos;s sky picture:</span>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      required
                      value={skyUrl}
                      onChange={(e) => setSkyUrl(e.target.value)}
                      placeholder="Image URL (e.g., https://picsum.photos/seed/sky/600/400)"
                      className="flex-1 bg-slate-900 border border-slate-800 text-[11px] px-3 py-1.5 rounded outline-none focus:border-sky-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={skyDesc}
                      onChange={(e) => setSkyDesc(e.target.value.substring(0, 100))}
                      placeholder="Add short caption (e.g. Dreamy pink sunset)"
                      className="flex-1 bg-slate-900 border border-slate-800 text-[11px] px-3 py-1.5 rounded outline-none focus:border-sky-500"
                    />
                    <button
                      type="submit"
                      disabled={isPostingSky}
                      className="px-4 bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold uppercase rounded tracking-wider cursor-pointer"
                    >
                      {isPostingSky ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Share Sky'}
                    </button>
                  </div>
                </form>
              </div>

              {/* SKY WINDOW GALLERY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {skySnaps.length === 0 ? (
                  <div className="col-span-3 py-12 text-center text-xs text-slate-600 italic">No skies shared yet today. Look up and snap! ⛅</div>
                ) : (
                  skySnaps.map(sky => (
                    <div key={sky.id} className="bg-slate-900/40 border border-slate-900 rounded overflow-hidden flex flex-col gap-2 p-2">
                      <div className="relative aspect-[3/2] w-full rounded overflow-hidden">
                        <img
                          src={sky.imageUrl}
                          alt={sky.description}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-1 rounded">
                          <img
                            src={sky.avatarUrl || 'https://picsum.photos/seed/placeholder/50/50'}
                            alt={sky.displayName}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                          <span className="text-[8px] font-bold text-slate-200">@{sky.username}</span>
                        </div>
                      </div>

                      <div className="p-1 leading-snug">
                        <p className="text-[10px] font-medium text-slate-300 font-sans">
                          {sky.description || '"Just looking up!"'}
                        </p>
                        <span className="text-[8px] text-slate-500 font-mono mt-1 block">
                          Shared {new Date(sky.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB E: WISDOM CORNER */}
          {activeTab === 'wisdom' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex flex-col">
                  <h3 className="text-sm font-bold text-violet-400 flex items-center gap-1.5">
                    📜 Generational Wisdom Corner
                  </h3>
                  <span className="text-[10px] text-slate-500 font-sans mt-0.5">Let&apos;s connect through simple storytelling. Share small memoirs, advice, or childhood stories!</span>
                </div>

                {/* Wisdom reflection Form */}
                <form onSubmit={handlePostWisdom} className="bg-slate-950 p-4 rounded border border-slate-900 w-full md:max-w-md flex flex-col gap-3">
                  <span className="text-[9px] font-bold uppercase text-slate-400">Answer Weekly Prompt:</span>
                  <select
                    value={wisdomPrompt}
                    onChange={(e) => setWisdomPrompt(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-[11px] px-3 py-1.5 rounded outline-none cursor-pointer focus:border-violet-500 w-full"
                  >
                    <option value="What is a small detail in nature that brings you pure joy?">What brings you pure joy in nature? 🌸</option>
                    <option value="What is a piece of simple advice you would give to someone feeling stressed today?">Advice for someone feeling stressed 🧘‍♀️</option>
                    <option value="What was your favorite games or memories from your childhood neighborhood?">Favorite childhood neighborhood memories? 🏡</option>
                  </select>
                  <div className="flex gap-2">
                    <textarea
                      required
                      value={wisdomText}
                      onChange={(e) => setWisdomText(e.target.value.substring(0, 300))}
                      placeholder="Write your beautiful reflection..."
                      rows={2}
                      className="flex-1 bg-slate-900 border border-slate-800 text-[11px] text-slate-200 px-3 py-1.5 rounded outline-none focus:border-violet-500 placeholder:text-slate-600 resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isPostingWisdom}
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold uppercase rounded py-2 tracking-wider cursor-pointer"
                  >
                    {isPostingWisdom ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Share My Reflection'}
                  </button>
                </form>
              </div>

              {/* WISDOM LIST */}
              <div className="flex flex-col gap-4">
                {wisdom.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-600 italic">No reflections shared yet. Share some warm wisdom!</div>
                ) : (
                  wisdom.map(w => (
                    <div key={w.id} className="bg-slate-900/40 border border-slate-900 rounded p-4 flex flex-col gap-2.5">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-900/40">
                        <span className="text-[10px] font-semibold text-violet-400 bg-violet-950/20 px-2.5 py-0.5 rounded border border-violet-950/20">
                          Prompt: {w.prompt}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <img
                            src={w.avatarUrl || 'https://picsum.photos/seed/placeholder/50/50'}
                            alt={w.displayName}
                            className="w-4.5 h-4.5 rounded-full object-cover border border-slate-800"
                          />
                          <span className="text-[10px] font-bold text-slate-300">@{w.username}</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-300 font-serif leading-relaxed italic px-2">
                        &ldquo;{w.text}&rdquo;
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB F: HELPING HANDS */}
          {activeTab === 'kindness' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex flex-col">
                  <h3 className="text-sm font-bold text-teal-400 flex items-center gap-1.5">
                    🤝 Simple Helping Hands (Acts of Kindness)
                  </h3>
                  <span className="text-[10px] text-slate-500 font-sans mt-0.5">Need a ladder? Can water plants for anyone? Post small favors or offers here!</span>
                </div>

                {/* Kindness post Form */}
                <form onSubmit={handlePostHelp} className="bg-slate-950 p-4 rounded border border-slate-900 w-full md:max-w-md flex flex-col gap-3">
                  <span className="text-[9px] font-bold uppercase text-slate-400">Post an offer or request:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={helpTitle}
                      onChange={(e) => setHelpTitle(e.target.value.substring(0, 50))}
                      placeholder="Title (e.g. Borrow a ladder 🪜)"
                      className="bg-slate-900 border border-slate-800 text-[11px] px-3 py-1.5 rounded outline-none focus:border-teal-500"
                    />
                    <select
                      value={helpType}
                      onChange={(e) => setHelpType(e.target.value as any)}
                      className="bg-slate-900 border border-slate-800 text-[11px] px-3 py-1.5 rounded outline-none cursor-pointer focus:border-teal-500"
                    >
                      <option value="need">🙋 I need a favor</option>
                      <option value="offer">💝 I can help offer</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={helpDesc}
                      onChange={(e) => setHelpDesc(e.target.value.substring(0, 150))}
                      placeholder="Detail (e.g. Need to water balcony plants, away for 3 days)"
                      className="flex-1 bg-slate-900 border border-slate-800 text-[11px] px-3 py-1.5 rounded outline-none focus:border-teal-500"
                    />
                    <button
                      type="submit"
                      disabled={isPostingHelp}
                      className="px-4 bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold uppercase rounded tracking-wider cursor-pointer"
                    >
                      {isPostingHelp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Post Kindness'}
                    </button>
                  </div>
                </form>
              </div>

              {/* HELPS LIST */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {helps.length === 0 ? (
                  <div className="col-span-2 py-12 text-center text-xs text-slate-600 italic">All quiet! No favor requests or offers at the moment.</div>
                ) : (
                  helps.map(help => (
                    <div key={help.id} className="bg-slate-900/40 border border-slate-900 rounded p-4 flex flex-col justify-between gap-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded flex items-center justify-center font-bold text-xs flex-shrink-0",
                            help.type === 'need' 
                              ? "bg-amber-500/10 border border-amber-500/20 text-amber-400" 
                              : "bg-teal-500/10 border border-teal-500/20 text-teal-400"
                          )}>
                            {help.type === 'need' ? '🙋' : '💝'}
                          </div>

                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-slate-200">{help.title}</span>
                            <span className={cn(
                              "text-[8px] uppercase tracking-wider font-bold mt-0.5",
                              help.type === 'need' ? "text-amber-400" : "text-teal-400"
                            )}>
                              {help.type === 'need' ? 'Requesting Favor' : 'Friendly Offer'}
                            </span>
                          </div>
                        </div>

                        <span className="text-[8px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-900">
                          @{help.username}
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                        {help.description}
                      </p>

                      {/* Contact neighbor CTA */}
                      <div className="flex items-center justify-between border-t border-slate-900/60 pt-2.5 mt-1">
                        <span className="text-[8px] text-slate-500">Posted {new Date(help.createdAt).toLocaleDateString()}</span>
                        
                        <a 
                          href={`/messages`}
                          className="px-2.5 py-1 bg-slate-950 border border-slate-800 text-[9px] font-bold uppercase rounded text-slate-400 hover:border-violet-500 hover:text-white flex items-center gap-1 transition-all"
                        >
                          <MessageSquare className="w-3 h-3" /> Say Hello / Chat
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB G: LOCAL SOUNDSCAPES */}
          {activeTab === 'sounds' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex flex-col">
                  <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-1.5">
                    🎧 Neighborhood Hum Soundscapes
                  </h3>
                  <span className="text-[10px] text-slate-500 font-sans mt-0.5">Listen to peaceful daily ambient noises captured locally (e.g. courtyard rain, chirping swallows)!</span>
                </div>

                {/* Soundscape creation Form */}
                <form onSubmit={handlePostSound} className="bg-slate-950 p-4 rounded border border-slate-900 w-full md:max-w-md flex flex-col gap-3">
                  <span className="text-[9px] font-bold uppercase text-slate-400">Capture local hum sound:</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={soundTitle}
                      onChange={(e) => setSoundTitle(e.target.value.substring(0, 45))}
                      placeholder="Sound Name (e.g. Courtyard Fountain Hum ⛲)"
                      className="flex-1 bg-slate-900 border border-slate-800 text-[11px] px-3 py-1.5 rounded outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={isPostingSound}
                      className="px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase rounded tracking-wider cursor-pointer"
                    >
                      {isPostingSound ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Pin Sound'}
                    </button>
                  </div>
                </form>
              </div>

              {/* SOUNDS PLAYLIST GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sounds.map(sound => {
                  const isPlaying = playingSoundId === sound.id;

                  return (
                    <div 
                      key={sound.id} 
                      className={cn(
                        "bg-slate-900/40 border p-4 rounded flex items-center justify-between gap-4 transition-all",
                        isPlaying ? "border-indigo-500/40 bg-indigo-950/5" : "border-slate-900"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            if (isPlaying) {
                              setPlayingSoundId(null);
                              stopNeighborhoodSound();
                            } else {
                              setPlayingSoundId(sound.id);
                              startNeighborhoodSound(sound);
                            }
                          }}
                          className={cn(
                            "w-10 h-10 rounded-full border flex items-center justify-center cursor-pointer transition-all",
                            isPlaying 
                              ? "bg-indigo-600 text-white border-indigo-500 animate-pulse" 
                              : "bg-slate-950 text-indigo-400 border-slate-800 hover:border-indigo-500"
                          )}
                        >
                          {isPlaying ? (
                            <div className="flex items-end gap-[2px] h-3">
                              <span className="w-[2px] h-2 bg-white animate-bounce" style={{ animationDelay: '0.1s' }} />
                              <span className="w-[2px] h-3 bg-white animate-bounce" style={{ animationDelay: '0.3s' }} />
                              <span className="w-[2px] h-1 bg-white animate-bounce" style={{ animationDelay: '0.2s' }} />
                            </div>
                          ) : (
                            <Music className="w-4 h-4 ml-0.5" />
                          )}
                        </button>

                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-slate-200">{sound.title}</span>
                          <span className="text-[9px] text-slate-500 mt-0.5">Recorded by @{sound.username}</span>
                        </div>
                      </div>

                      {/* Playing details / timing metadata */}
                      <div className="flex flex-col items-end gap-1 font-sans text-right">
                        <span className="text-[8px] text-slate-500">Shared {new Date(sound.createdAt).toLocaleDateString()}</span>
                        {isPlaying && (
                          <span className="text-[9px] text-indigo-400 font-mono tracking-widest uppercase animate-pulse">Now Playing</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
