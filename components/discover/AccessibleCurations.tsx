"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAccessibility } from '@/components/ui/AccessibilityProvider';
import { Play, Square, Volume2, Heart, Search, HelpCircle, MapPin, Feather, Sparkles } from 'lucide-react';

interface CurationItem {
  id: string;
  title: string;
  description: string;
  category: 'nature' | 'music' | 'mindfulness' | 'community';
  imageUrl: string;
  duration?: string;
  location?: string;
  soundType?: 'birds' | 'waves' | 'chimes' | 'none';
}

const CURATED_ITEMS: CurationItem[] = [
  {
    id: 'c1',
    title: 'Forest Creek Stream',
    description: 'A 20-minute gentle recording of a bubbling wilderness stream and chirping sparrows to ease anxiety and promote resting.',
    category: 'nature',
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80',
    duration: '20 mins',
    soundType: 'birds'
  },
  {
    id: 'c2',
    title: 'Summer Meadow Wind Chimes',
    description: 'Relaxing copper wind chimes swaying in a light breeze. Helps transition into cozy mid-day naps.',
    category: 'nature',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
    duration: '15 mins',
    soundType: 'chimes'
  },
  {
    id: 'c3',
    title: 'Ocean Wave Harmonizer',
    description: 'Continuous slow rhythm of coastal ocean swells breaking on sandy beaches to align rhythmic breathing loops.',
    category: 'mindfulness',
    imageUrl: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=600&q=80',
    duration: '30 mins',
    soundType: 'waves'
  },
  {
    id: 'c4',
    title: 'Daughter’s Lullaby (Acoustic Guitar)',
    description: 'Nostalgic acoustic folk tunes played with steel strings. Evokes early morning sunshine.',
    category: 'music',
    imageUrl: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&q=80',
    duration: '12 mins',
    soundType: 'none'
  },
  {
    id: 'c5',
    title: 'Senior Chair Yoga for Balance',
    description: 'A gentle stretching sequence performed fully seated. Strengthens the back, neck, and leg alignment safely.',
    category: 'mindfulness',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80',
    duration: '10 mins',
    soundType: 'none'
  },
  {
    id: 'c6',
    title: 'Oak Street Botanical Walk',
    description: 'A weekly gathering of senior neighbors exploring the local botanical gardens and identifying fresh peach blossoms.',
    category: 'community',
    imageUrl: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=600&q=80',
    location: 'Botanical Conservatory Hub',
    soundType: 'none'
  }
];

export const AccessibleCurations: React.FC = () => {
  const { speak, isReadAloudEnabled, isEasyMode } = useAccessibility();
  const [activeTab, setActiveTab] = useState<'all' | 'nature' | 'music' | 'mindfulness' | 'community'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [activeNodes, setActiveNodes] = useState<any[]>([]);

  // Cleanup audio nodes on unmount
  useEffect(() => {
    return () => {
      activeNodes.forEach(node => {
        try { node.stop(); } catch(e) {}
      });
    };
  }, [activeNodes]);

  const handleCardClick = (item: CurationItem) => {
    if (isReadAloudEnabled) {
      speak(`${item.title}. Description: ${item.description}`);
    }
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
    speak("Saved to your personal favorites library.");
  };

  const playSoothingSound = (type: 'birds' | 'waves' | 'chimes' | 'none', itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // If already playing, stop it
    if (playingId === itemId) {
      stopAllSounds();
      return;
    }

    stopAllSounds();
    setPlayingId(itemId);

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioCtx(ctx);

      const nodes: any[] = [];

      if (type === 'birds') {
        // High frequency pleasant chirps
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1500, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(2500, ctx.currentTime + 0.15);
        osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.3);
        
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        nodes.push(osc);

        // Schedule secondary chirp
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1600, ctx.currentTime + 0.4);
        osc2.frequency.exponentialRampToValueAtTime(2800, ctx.currentTime + 0.55);
        osc2.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.7);

        gain2.gain.setValueAtTime(0.001, ctx.currentTime);
        gain2.gain.setValueAtTime(0.08, ctx.currentTime + 0.4);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);

        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        nodes.push(osc2);

      } else if (type === 'waves') {
        // White noise modulated like slow breathing ocean wave
        const bufferSize = ctx.sampleRate * 4; // 4 seconds
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        // Lowpass filter to make it sound like gentle rushing water
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, ctx.currentTime);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 1.8);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 3.8);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start();
        nodes.push(noise);

      } else if (type === 'chimes') {
        // Deep resonant chimes
        const frequencies = [329.63, 392.00, 440.00, 523.25]; // E4, G4, A4, C5
        frequencies.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.4);
          
          gain.gain.setValueAtTime(0.001, ctx.currentTime);
          gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.4);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.4 + 1.8);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          nodes.push(osc);
        });
      }

      setActiveNodes(nodes);
      speak(`Playing ambient soundtrack demo.`);
    } catch (e) {
      console.error(e);
    }
  };

  const stopAllSounds = () => {
    activeNodes.forEach(node => {
      try { node.stop(); } catch (e) {}
    });
    if (audioCtx) {
      try { audioCtx.close(); } catch(e) {}
    }
    setActiveNodes([]);
    setPlayingId(null);
  };

  const filteredItems = CURATED_ITEMS.filter(item => {
    const matchesTab = activeTab === 'all' || item.category === activeTab;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6" id="accessible-curations-root">
      {/* Search and Navigation */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Feather className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Sensory & Calming Discoveries</h3>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search cozy audio or yoga..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-950 border border-slate-800 text-xs pl-9 pr-4 py-2 rounded-lg text-slate-200 focus:border-emerald-500 outline-none"
          />
        </div>
      </div>

      {/* Categories Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(['all', 'nature', 'music', 'mindfulness', 'community'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              speak(`Selected ${tab === 'all' ? 'all activities' : tab} filter`);
            }}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              activeTab === tab
                ? 'bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.1)]'
                : 'bg-slate-900/50 border border-slate-850 text-slate-400 hover:bg-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500 italic bg-slate-900/20 border border-slate-850 rounded-xl">
          No soothing activities found matching your filter or query.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const isFav = favorites.includes(item.id);
            const isPlaying = playingId === item.id;
            return (
              <div
                key={item.id}
                onClick={() => handleCardClick(item)}
                className={`group bg-slate-900/40 border rounded-xl overflow-hidden hover:border-slate-750 transition-all duration-300 flex flex-col cursor-pointer ${
                  isEasyMode ? 'p-1.5' : ''
                } ${isPlaying ? 'border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.08)]' : 'border-slate-800/80'}`}
              >
                {/* Cover Image */}
                <div className="h-44 w-full relative overflow-hidden bg-slate-950">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 opacity-80"
                  />
                  
                  {item.duration && (
                    <span className="absolute bottom-3 right-3 bg-stone-950/80 border border-slate-800 text-[10px] font-mono px-2 py-0.5 rounded text-slate-300">
                      ⏱️ {item.duration}
                    </span>
                  )}
                  {item.location && (
                    <span className="absolute bottom-3 left-3 bg-emerald-950/80 border border-emerald-900/60 text-[10px] font-medium px-2 py-0.5 rounded text-emerald-300 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {item.location}
                    </span>
                  )}
                </div>

                {/* Info and Actions */}
                <div className="p-4 flex flex-col justify-between flex-1 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                        {item.title}
                      </h4>
                      <span className="text-[9px] font-mono uppercase bg-slate-900 px-2 py-0.5 rounded text-slate-500">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-slate-850 pt-3">
                    <button
                      onClick={(e) => toggleFavorite(item.id, e)}
                      className={`p-2 rounded-lg border transition-all cursor-pointer ${
                        isFav 
                          ? 'bg-rose-500/10 border-rose-500/40 text-rose-400' 
                          : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                      title="Add to Favorites"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>

                    {item.soundType && item.soundType !== 'none' && (
                      <button
                        onClick={(e) => playSoothingSound(item.soundType!, item.id, e)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
                          isPlaying
                            ? 'bg-emerald-500 text-stone-950 hover:bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                            : 'bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 hover:bg-emerald-900/40'
                        }`}
                      >
                        {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        <span>{isPlaying ? 'Stop Soothing' : 'Listen Demo'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
