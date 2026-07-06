'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  MapPin, MessageSquare, Bookmark, ShieldAlert, Check, 
  MoreHorizontal, Volume2, VolumeX, Sparkles, Heart, Zap, RefreshCw, Sliders
} from 'lucide-react';
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

// Particle interface for Pulse reactions
interface ReactionParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  life: number;
  spin?: number;
  spinSpeed?: number;
}

function createParticle(spawnX: number, spawnY: number, physicsEngine: string, pulseColors: string[]): ReactionParticle {
  const angle = Math.random() * Math.PI * 2;
  const speed = Math.random() * 5 + 2;
  const col = pulseColors[Math.floor(Math.random() * pulseColors.length)];

  const p: ReactionParticle = {
    x: spawnX,
    y: spawnY,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: Math.random() * 4 + 1.5,
    color: col,
    alpha: 1.0,
    decay: Math.random() * 0.02 + 0.015,
    life: 1.0,
    spin: Math.random() * Math.PI * 2,
    spinSpeed: (Math.random() - 0.5) * 0.1
  };

  if (physicsEngine === 'vortex') {
    p.vx = Math.cos(angle) * 1.5;
    p.vy = Math.sin(angle) * 1.5;
  } else if (physicsEngine === 'embers') {
    p.vx = (Math.random() - 0.5) * 2;
    p.vy = -Math.random() * 4 - 1;
    p.decay = Math.random() * 0.01 + 0.01;
  }

  return p;
}

function generateRainSamples(bufferSize: number): Float32Array {
  const data = new Float32Array(bufferSize);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return data;
}

function generateHissSamples(bufferSize: number): Float32Array {
  const data = new Float32Array(bufferSize);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return data;
}

export default function PostCard({ post, onRefresh }: PostCardProps) {
  const [currentUser, setCurrentUser] = React.useState<UserType | null>(null);
  const [isBookmarked, setIsBookmarked] = React.useState(post.hasBookmarked);
  const [isFollowing, setIsFollowing] = React.useState(post.isFollowing);
  const [followPending, setFollowPending] = React.useState(false);
  const [showComments, setShowComments] = React.useState(false);
  const [commentsCount, setCommentsCount] = React.useState(post.commentsCount);
  const [isCaptionExpanded, setIsCaptionExpanded] = React.useState(false);

  // --- 6. DYNAMIC COLOR-HARMONIZED FRAMING ---
  const harmonizedColors = React.useMemo<string[]>(() => {
    if (!post.colorPalette) return ['rgba(124, 58, 237, 0.2)', 'rgba(45, 212, 191, 0.2)'];
    try {
      return JSON.parse(post.colorPalette);
    } catch {
      return ['rgba(124, 58, 237, 0.2)', 'rgba(45, 212, 191, 0.2)'];
    }
  }, [post.colorPalette]);

  // --- 8. LIVE CO-AUTHORS ---
  const coAuthorList = React.useMemo<string[]>(() => {
    if (!post.coAuthors) return [];
    try {
      return JSON.parse(post.coAuthors);
    } catch {
      return [];
    }
  }, [post.coAuthors]);

  // --- 3. AUDIO-LINKED IMAGERY STATE & SYNTH SYNTAX ---
  const [isPlayingAudio, setIsPlayingAudio] = React.useState(false);
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const audioNodesRef = React.useRef<any[]>([]);
  const audioTimersRef = React.useRef<any[]>([]);

  // Real-time Audio Mixer Controls
  const globalGainRef = React.useRef<GainNode | null>(null);
  const muffleFilterRef = React.useRef<BiquadFilterNode | null>(null);
  const hissGainRef = React.useRef<GainNode | null>(null);

  const [audioVolume, setAudioVolume] = React.useState(75); // 0 - 100
  const [audioMuffle, setAudioMuffle] = React.useState(100); // 100% = clear, lower = muffled
  const [vinylHiss, setVinylHiss] = React.useState(15); // 0 - 100
  const [showMixer, setShowMixer] = React.useState(false);

  // Real-time audio parameters updater
  React.useEffect(() => {
    if (globalGainRef.current && audioCtxRef.current) {
      globalGainRef.current.gain.setValueAtTime((audioVolume / 100) * 0.25, audioCtxRef.current.currentTime);
    }
  }, [audioVolume]);

  React.useEffect(() => {
    if (muffleFilterRef.current && audioCtxRef.current) {
      const freq = audioMuffle === 100 ? 12000 : Math.max(150, (audioMuffle / 100) * 4000);
      muffleFilterRef.current.frequency.setValueAtTime(freq, audioCtxRef.current.currentTime);
    }
  }, [audioMuffle]);

  React.useEffect(() => {
    if (hissGainRef.current && audioCtxRef.current) {
      hissGainRef.current.gain.setValueAtTime((vinylHiss / 100) * 0.08, audioCtxRef.current.currentTime);
    }
  }, [vinylHiss]);

  // --- 2. PULSE REACTIONS MATRIX CANVAS STATE ---
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [physicsEngine, setPhysicsEngine] = React.useState<'burst' | 'vortex' | 'embers'>('burst');
  const [showPhysicsMenu, setShowPhysicsMenu] = React.useState(false);
  const particlesRef = React.useRef<ReactionParticle[]>([]);
  const animationFrameRef = React.useRef<number | null>(null);
  const longPressTimerRef = React.useRef<any>(null);

  // Web Audio Synth loops for ambient audio channels
  const startAudioLoop = () => {
    stopAudioLoop();
    if (!post.audioUrl) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;
      setIsPlayingAudio(true);

      // 1. Create Core Mixer Nodes: Muffle Filter & Global Gain
      const muffleFilter = ctx.createBiquadFilter();
      muffleFilter.type = 'lowpass';
      const muffleFreq = audioMuffle === 100 ? 12000 : Math.max(150, (audioMuffle / 100) * 4000);
      muffleFilter.frequency.setValueAtTime(muffleFreq, ctx.currentTime);
      muffleFilterRef.current = muffleFilter;

      const globalGain = ctx.createGain();
      globalGain.gain.setValueAtTime((audioVolume / 100) * 0.25, ctx.currentTime);
      globalGainRef.current = globalGain;

      // Connect Muffle Filter -> Global Gain -> Output Destination
      muffleFilter.connect(globalGain);
      globalGain.connect(ctx.destination);

      audioNodesRef.current = [muffleFilter, globalGain];

      // 2. Cozy Analog Tape Hiss / Vinyl Crackle generator
      const hissBuffer = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
      hissBuffer.getChannelData(0).set(generateHissSamples(ctx.sampleRate * 4));
      const hissSource = ctx.createBufferSource();
      hissSource.buffer = hissBuffer;
      hissSource.loop = true;

      const hissFilter = ctx.createBiquadFilter();
      hissFilter.type = 'bandpass';
      hissFilter.frequency.setValueAtTime(4500, ctx.currentTime);
      hissFilter.Q.setValueAtTime(1.2, ctx.currentTime);

      const hGain = ctx.createGain();
      hGain.gain.setValueAtTime((vinylHiss / 100) * 0.08, ctx.currentTime);
      hissGainRef.current = hGain;

      hissSource.connect(hissFilter);
      hissFilter.connect(hGain);
      hGain.connect(muffleFilter); // Route through muffle so muffle filters hiss too
      
      hissSource.start();
      audioNodesRef.current.push(hissSource, hissFilter, hGain);

      // 3. Preset-specific Synth Generators
      const type = post.audioUrl;
      if (type === 'cyber_drone') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(55, ctx.currentTime); // Low A

        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(55.4, ctx.currentTime); // Detuned

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(120, ctx.currentTime);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(muffleFilter);

        osc1.start();
        osc2.start();
        audioNodesRef.current.push(osc1, osc2, filter);
      } else if (type === 'neon_synth') {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(110, ctx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(250, ctx.currentTime);

        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(3.5, ctx.currentTime); // 3.5Hz pulse
        lfoGain.gain.setValueAtTime(120, ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        osc.connect(filter);
        filter.connect(muffleFilter);

        osc.start();
        lfo.start();
        audioNodesRef.current.push(osc, filter, lfo, lfoGain);
      } else if (type === 'rainy_jazz') {
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        output.set(generateRainSamples(bufferSize));

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 850;
        filter.Q.value = 1.0;

        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.04;

        whiteNoise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(muffleFilter);
        whiteNoise.start();

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 220;
        const padGain = ctx.createGain();
        padGain.gain.value = 0.08;

        osc.connect(padGain);
        padGain.connect(muffleFilter);
        osc.start();

        audioNodesRef.current.push(whiteNoise, filter, noiseGain, osc, padGain);
      } else if (type === 'vapor_echo') {
        const osc = ctx.createOscillator();
        const delay = ctx.createDelay();
        const feedback = ctx.createGain();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);

        delay.delayTime.value = 0.35;
        feedback.gain.value = 0.45;
        gain.gain.value = 0.12;

        osc.connect(gain);
        gain.connect(muffleFilter);

        osc.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(muffleFilter);

        osc.start();
        audioNodesRef.current.push(osc, delay, feedback, gain);
      } else if (type === 'campfire_wind') {
        // Wind noise
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        output.set(generateRainSamples(bufferSize));

        const windSource = ctx.createBufferSource();
        windSource.buffer = noiseBuffer;
        windSource.loop = true;

        const windFilter = ctx.createBiquadFilter();
        windFilter.type = 'bandpass';
        windFilter.frequency.setValueAtTime(400, ctx.currentTime);
        windFilter.Q.setValueAtTime(1.0, ctx.currentTime);

        const windGain = ctx.createGain();
        windGain.gain.setValueAtTime(0.05, ctx.currentTime);

        // Wind LFO
        const windLfo = ctx.createOscillator();
        const windLfoGain = ctx.createGain();
        windLfo.frequency.setValueAtTime(0.2, ctx.currentTime); // very slow gusts
        windLfoGain.gain.setValueAtTime(150, ctx.currentTime);

        windLfo.connect(windLfoGain);
        windLfoGain.connect(windFilter.frequency);

        windSource.connect(windFilter);
        windFilter.connect(windGain);
        windGain.connect(muffleFilter);

        windSource.start();
        windLfo.start();

        // Base fire hum
        const humOsc = ctx.createOscillator();
        const humGain = ctx.createGain();
        humOsc.type = 'triangle';
        humOsc.frequency.setValueAtTime(80, ctx.currentTime);
        humGain.gain.setValueAtTime(0.12, ctx.currentTime);
        humOsc.connect(humGain);
        humGain.connect(muffleFilter);
        humOsc.start();

        audioNodesRef.current.push(windSource, windFilter, windGain, windLfo, windLfoGain, humOsc, humGain);

        // Periodic random campfire snaps & crackles
        const triggerSnap = () => {
          if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
          try {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            osc.type = Math.random() > 0.5 ? 'sawtooth' : 'triangle';
            osc.frequency.setValueAtTime(Math.random() * 1200 + 350, ctx.currentTime);
            
            // sharp envelope
            gainNode.gain.setValueAtTime(0.04, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
            
            osc.connect(gainNode);
            gainNode.connect(muffleFilter);
            
            osc.start();
            osc.stop(ctx.currentTime + 0.05);
          } catch {}

          const nextInterval = Math.random() * 600 + 150;
          const timerId = setTimeout(triggerSnap, nextInterval);
          audioTimersRef.current.push(timerId);
        };
        triggerSnap();
      } else if (type === 'forest_brook') {
        // Gurgling brook noise
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        output.set(generateRainSamples(bufferSize));

        const brookSource = ctx.createBufferSource();
        brookSource.buffer = noiseBuffer;
        brookSource.loop = true;

        const brookFilter = ctx.createBiquadFilter();
        brookFilter.type = 'bandpass';
        brookFilter.frequency.setValueAtTime(450, ctx.currentTime);
        brookFilter.Q.setValueAtTime(1.5, ctx.currentTime);

        const brookGain = ctx.createGain();
        brookGain.gain.setValueAtTime(0.06, ctx.currentTime);

        // Brook LFO for gurgling rhythm
        const brookLfo = ctx.createOscillator();
        const brookLfoGain = ctx.createGain();
        brookLfo.frequency.setValueAtTime(6.0, ctx.currentTime); // 6Hz bubble rate
        brookLfoGain.gain.setValueAtTime(90, ctx.currentTime);

        brookLfo.connect(brookLfoGain);
        brookLfoGain.connect(brookFilter.frequency);

        brookSource.connect(brookFilter);
        brookFilter.connect(brookGain);
        brookGain.connect(muffleFilter);

        brookSource.start();
        brookLfo.start();

        audioNodesRef.current.push(brookSource, brookFilter, brookGain, brookLfo, brookLfoGain);

        // Periodic forest bird chirps
        const triggerChirp = () => {
          if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
          try {
            const now = ctx.currentTime;
            const count = Math.floor(Math.random() * 3) + 2; // 2 to 4 rapid chirps
            for (let i = 0; i < count; i++) {
              const osc = ctx.createOscillator();
              const gainNode = ctx.createGain();
              osc.type = 'sine';
              
              const startFreq = Math.random() * 600 + 1800;
              const endFreq = startFreq + Math.random() * 1000 + 400;
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

          const nextInterval = Math.random() * 3000 + 2000; // birds chirp every 2-5s
          const timerId = setTimeout(triggerChirp, nextInterval);
          audioTimersRef.current.push(timerId);
        };
        triggerChirp();
      } else if (type === 'coffee_shop') {
        // Coffee shop murmur base
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        output.set(generateRainSamples(bufferSize));

        const baseNoise = ctx.createBufferSource();
        baseNoise.buffer = noiseBuffer;
        baseNoise.loop = true;

        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(180, ctx.currentTime); // muffled chatter low frequencies

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.08, ctx.currentTime);

        baseNoise.connect(lowpass);
        lowpass.connect(noiseGain);
        noiseGain.connect(muffleFilter);
        baseNoise.start();

        // Slow soft Rhodes-like chord drone
        const chordOsc1 = ctx.createOscillator();
        const chordOsc2 = ctx.createOscillator();
        const chordGain = ctx.createGain();
        chordOsc1.type = 'sine';
        chordOsc2.type = 'sine';
        
        chordOsc1.frequency.setValueAtTime(196.00, ctx.currentTime); // G3
        chordOsc2.frequency.setValueAtTime(246.94, ctx.currentTime); // B3

        chordGain.gain.setValueAtTime(0.06, ctx.currentTime);

        chordOsc1.connect(chordGain);
        chordOsc2.connect(chordGain);
        chordGain.connect(muffleFilter);

        chordOsc1.start();
        chordOsc2.start();

        audioNodesRef.current.push(baseNoise, lowpass, noiseGain, chordOsc1, chordOsc2, chordGain);

        // Periodic ceramic cup clinks
        const triggerClink = () => {
          if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
          try {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(Math.random() * 1000 + 1500, ctx.currentTime);
            
            gainNode.gain.setValueAtTime(0.012, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
            
            osc.connect(gainNode);
            gainNode.connect(muffleFilter);
            
            osc.start();
            osc.stop(ctx.currentTime + 0.2);
          } catch {}

          const nextInterval = Math.random() * 4000 + 1500; // cup clinks every 1.5 - 5.5s
          const timerId = setTimeout(triggerClink, nextInterval);
          audioTimersRef.current.push(timerId);
        };
        triggerClink();
      } else if (type === 'heavy_rain') {
        // Rain noise
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        output.set(generateRainSamples(bufferSize));

        const rainSource = ctx.createBufferSource();
        rainSource.buffer = noiseBuffer;
        rainSource.loop = true;

        const rainFilter = ctx.createBiquadFilter();
        rainFilter.type = 'lowpass';
        rainFilter.frequency.setValueAtTime(650, ctx.currentTime);

        const rainGain = ctx.createGain();
        rainGain.gain.setValueAtTime(0.08, ctx.currentTime);

        rainSource.connect(rainFilter);
        rainFilter.connect(rainGain);
        rainGain.connect(muffleFilter);

        rainSource.start();

        audioNodesRef.current.push(rainSource, rainFilter, rainGain);

        // Periodic thunder rolls
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
            thunderGain.gain.linearRampToValueAtTime(0.09, ctx.currentTime + 1.2);
            thunderGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 6.0);
            
            thunderFilter.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + 5.5);

            thunderOsc.connect(thunderFilter);
            thunderFilter.connect(thunderGain);
            thunderGain.connect(muffleFilter);

            thunderOsc.start();
            thunderOsc.stop(ctx.currentTime + 6.5);
          } catch {}

          const nextInterval = Math.random() * 10000 + 8000; // thunder rolls every 8-18s
          const timerId = setTimeout(triggerThunder, nextInterval);
          audioTimersRef.current.push(timerId);
        };
        const initialThunderId = setTimeout(triggerThunder, 3000);
        audioTimersRef.current.push(initialThunderId);
      }
    } catch (e) {
      console.error('Failed to trigger audio synth loop:', e);
    }
  };

  const stopAudioLoop = () => {
    setIsPlayingAudio(false);
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
    globalGainRef.current = null;
    muffleFilterRef.current = null;
    hissGainRef.current = null;
  };

  React.useEffect(() => {
    getCurrentUser().then(user => {
      if (user) setCurrentUser(user);
    });
    
    return () => {
      stopAudioLoop();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const handleAudioToggle = () => {
    if (isPlayingAudio) {
      stopAudioLoop();
    } else {
      startAudioLoop();
    }
  };

  // --- PULSE REACTIONS PHYSICS PARTICLE CANVAS DRAWING ---
  const triggerParticleBurst = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const spawnX = clientX - rect.left;
    const spawnY = clientY - rect.top;

    // Pulse color profile based on extracted palette or thematic shades
    const pulseColors = [
      '#7c3aed', // electric violet
      '#2dd4bf', // cyber teal
      '#f43f5e', // neon fuchsia
      '#a855f7', // soft purple
      '#06b6d4', // arctic sky
    ];

    const particleCount = physicsEngine === 'burst' ? 65 : physicsEngine === 'vortex' ? 80 : 50;
    const nextParticles: ReactionParticle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const p = createParticle(spawnX, spawnY, physicsEngine, pulseColors);
      nextParticles.push(p);
    }

    particlesRef.current = [...particlesRef.current, ...nextParticles];

    // Play double tap or pulse highlight custom event to simulate like
    const event = new CustomEvent('double-tap-like', { detail: { postId: post.id } });
    window.dispatchEvent(event);

    if (!animationFrameRef.current) {
      runAnimationLoop();
    }
  };

  const runAnimationLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const activeParticles = particlesRef.current.filter(p => p.life > 0);
    
    activeParticles.forEach(p => {
      p.life -= p.decay;
      p.alpha = Math.max(0, p.life);

      if (physicsEngine === 'vortex') {
        // Apply vortex centering force
        const dx = canvas.width / 2 - p.x;
        const dy = canvas.height / 2 - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 5) {
          p.vx += (dx / dist) * 0.15;
          p.vy += (dy / dist) * 0.15;
          
          // Orthogonal orbit force
          p.vx += (-dy / dist) * 0.35;
          p.vy += (dx / dist) * 0.35;
        }
      } else if (physicsEngine === 'burst') {
        // Friction decay
        p.vx *= 0.96;
        p.vy *= 0.96;
        // Subtle gravity pull
        p.vy += 0.08;
      } else if (physicsEngine === 'embers') {
        // Float side to side slightly
        p.vx += Math.sin(Date.now() * 0.005 + p.decay * 100) * 0.1;
      }

      p.x += p.vx;
      p.y += p.vy;

      // Draw particle glowing shadow
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    particlesRef.current = activeParticles;

    if (activeParticles.length > 0) {
      animationFrameRef.current = requestAnimationFrame(runAnimationLoop);
    } else {
      animationFrameRef.current = null;
    }
  };

  // Long press listeners to open physics settings HUD
  const handlePressStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    // Reset particle canvas size dynamically
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    longPressTimerRef.current = setTimeout(() => {
      // Trigger long-press menus or kinetic reactions
      setShowPhysicsMenu(true);
      triggerParticleBurst(clientX, clientY);
    }, 450);
  };

  const handlePressEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  const triggerDirectClickBurst = (e: React.MouseEvent) => {
    // If they just click without long-pressing, still fire the kinetic particles at click coordinates!
    if (showPhysicsMenu) return; // Menu covers interaction
    triggerParticleBurst(e.clientX, e.clientY);
  };

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

  // Extract color shadows programmatically
  const borderTintStyle = {
    borderColor: harmonizedColors[0] ? `${harmonizedColors[0].replace('rgb', 'rgba').replace(')', ', 0.25)')}` : 'rgba(124,58,237,0.15)',
    boxShadow: harmonizedColors[0] ? `0 0 30px ${harmonizedColors[0].replace('rgb', 'rgba').replace(')', ', 0.08)')}` : 'none'
  };

  return (
    <article 
      style={borderTintStyle}
      className="w-full bg-slate-950 border rounded overflow-hidden flex flex-col relative transition-all duration-500 ease-out"
    >
      
      {/* 2. Absolute kinetic reaction overlay canvas */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-20"
      />

      {/* Floating Pulse reactions physics controller HUD */}
      {showPhysicsMenu && (
        <div className="absolute top-14 left-4 right-4 bg-slate-950/95 border border-violet-500/20 backdrop-blur-md p-3 rounded shadow-[0_10px_35px_rgba(0,0,0,0.9)] flex flex-col gap-2.5 z-30 animate-fadeIn text-xs">
          <div className="flex justify-between items-center pb-1.5 border-b border-slate-900">
            <span className="font-bold text-violet-400 uppercase tracking-widest flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-violet-400" />
              Pulse Physics Reaction Matrix
            </span>
            <button 
              onClick={() => setShowPhysicsMenu(false)}
              className="text-[10px] font-bold text-slate-500 hover:text-slate-300 uppercase cursor-pointer"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'burst', title: 'Hyper Burst 💥', desc: 'Concentric shockwave' },
              { id: 'vortex', title: 'Spiral Storm 🌀', desc: 'Centripetal whirlpool' },
              { id: 'embers', title: 'Quantum Embers 🔥', desc: 'Rising thermodynamic heat' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPhysicsEngine(opt.id as any)}
                className={cn(
                  'p-2 border rounded text-left flex flex-col justify-between gap-0.5 transition-all cursor-pointer',
                  physicsEngine === opt.id 
                    ? 'bg-violet-950/20 border-violet-500/50 shadow-[0_0_8px_rgba(124,58,237,0.15)] text-violet-300' 
                    : 'bg-slate-950/40 border-slate-900 hover:border-slate-850 text-slate-400'
                )}
              >
                <span className="font-bold text-[10px]">{opt.title}</span>
                <span className="text-[8px] font-mono text-slate-600 leading-normal uppercase">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CARD HEADER */}
      <div className="flex items-center justify-between p-4 bg-slate-950 z-10">
        <div className="flex items-center gap-3">
          <Link href={`/${post.username}`} className="relative group">
            <img
              src={post.avatarUrl || 'https://picsum.photos/seed/placeholder/100/100'}
              alt={post.username}
              className="w-10 h-10 rounded object-cover border border-slate-800 group-hover:border-violet-500/50 transition-colors"
            />
          </Link>

          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-1.5 leading-none">
              <Link href={`/${post.username}`} className="text-xs font-bold text-slate-100 hover:text-violet-400 transition-colors leading-none">
                {post.username}
              </Link>
              
              {/* Render Co-authors if present */}
              {coAuthorList.length > 0 && (
                <>
                  <span className="text-[10px] text-slate-600 font-mono">×</span>
                  <div className="flex items-center gap-1">
                    {coAuthorList.map((coAuthor, idx) => (
                      <React.Fragment key={coAuthor}>
                        {idx > 0 && <span className="text-[10px] text-slate-600 font-mono">,</span>}
                        <Link 
                          href={`/${coAuthor}`} 
                          className="text-[10px] font-bold text-teal-400 hover:text-teal-300 transition-colors leading-none"
                        >
                          {coAuthor}
                        </Link>
                      </React.Fragment>
                    ))}
                  </div>
                </>
              )}

              <span className="text-[10px] font-mono text-slate-600 leading-none">•</span>
              <span className="text-[10px] font-mono text-slate-500 leading-none">{getRelativeTime(post.createdAt)}</span>
            </div>
            
            {/* Location tag */}
            {post.location && (
              <div className="flex items-center gap-1 mt-1 text-[10px] font-medium text-slate-500">
                <MapPin className="w-3 h-3 text-teal-400/80" />
                <span>{post.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Follow button or tag */}
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
            {isFollowing ? 'Live Now' : 'Follow Friend'}
          </button>
        )}

        {isSelf && (
          <span className="text-[9px] font-bold tracking-wider uppercase bg-teal-950/40 border border-teal-900/60 text-teal-400 px-2 py-1 rounded-sm">
            New Post
          </span>
        )}
      </div>

      {/* MEDIA CAROUSEL MIDDLE CONTAINER */}
      <div 
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onClick={triggerDirectClickBurst}
        className="relative w-full z-10"
      >
        <Carousel
          media={post.media}
          onDoubleTap={() => {
            const event = new CustomEvent('double-tap-like', { detail: { postId: post.id } });
            window.dispatchEvent(event);
          }}
          focalAnchors={post.focalAnchors}
          layoutMatrix={post.layoutMatrix}
          vectorTextPanel={post.vectorTextPanel}
        />

        {/* Floating Equalizer button overlay if audio attachment exists */}
        {post.audioUrl && (
          <div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-20">
            <div className="flex items-center gap-1.5">
              {isPlayingAudio && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMixer(!showMixer);
                  }}
                  className={cn(
                    "p-2 rounded-full border backdrop-blur-md cursor-pointer transition-all flex items-center justify-center shadow-lg",
                    showMixer
                      ? "bg-violet-950/90 border-violet-500 text-violet-300"
                      : "bg-black/75 border-slate-800 text-slate-400 hover:text-white"
                  )}
                  title="Acoustic Comfort Mixer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAudioToggle();
                  if (isPlayingAudio) setShowMixer(false);
                }}
                className={cn(
                  "p-2 rounded-full border backdrop-blur-md cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-lg",
                  isPlayingAudio 
                    ? "bg-teal-950/90 border-teal-500 text-teal-300 shadow-[0_0_12px_rgba(45,212,191,0.3)] animate-pulse"
                    : "bg-black/75 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                )}
                title={isPlayingAudio ? "Stop Audio Loop" : "Play Ambient Loop"}
              >
                {isPlayingAudio ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-teal-400" />
                    <div className="flex items-end gap-0.5 h-3 w-5">
                      <span className="w-0.5 h-2.5 bg-teal-400 animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <span className="w-0.5 h-1.5 bg-teal-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <span className="w-0.5 h-3 bg-teal-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </div>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    <span className="text-[8px] font-mono tracking-widest font-bold uppercase">OFF</span>
                  </>
                )}
              </button>
            </div>

            {/* Expended Sensory Vibe / Acoustic Comfort Mixer Board */}
            {isPlayingAudio && showMixer && (
              <div 
                className="p-3 w-56 rounded-xl border border-slate-800 bg-slate-950/95 backdrop-blur-md shadow-2xl text-left flex flex-col gap-2.5 transition-all text-xs text-slate-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-slate-900 pb-1.5 mb-0.5">
                  <span className="font-bold tracking-wider text-[10px] uppercase text-teal-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 animate-pulse" />
                    Acoustic Comfort
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">Live Synthesis</span>
                </div>

                {/* Slider 1: Master Volume */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">Master Level</span>
                    <span className="font-mono text-teal-400">{audioVolume}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={audioVolume}
                    onChange={(e) => setAudioVolume(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
                  />
                </div>

                {/* Slider 2: Cozy Blanket Muffle filter */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      Cozy Muffle ☁️
                    </span>
                    <span className="font-mono text-violet-400">{audioMuffle === 100 ? 'Clear 🍃' : `${audioMuffle}%`}</span>
                  </div>
                  <input 
                    type="range" 
                    min="5" 
                    max="100" 
                    value={audioMuffle}
                    onChange={(e) => setAudioMuffle(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-400"
                  />
                  <span className="text-[8px] text-slate-500 italic">Simulates listening through glass or cozy blankets</span>
                </div>

                {/* Slider 3: Vintage Tape Vinyl Hiss level */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">Analog Hiss & Crackle 📻</span>
                    <span className="font-mono text-amber-400">{vinylHiss}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={vinylHiss}
                    onChange={(e) => setVinylHiss(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* INTERACTIONS BAR */}
      <div className="flex items-center justify-between p-4 bg-slate-950 z-10">
        <div className="flex items-center gap-5">
          <LikeButton
            postId={post.id}
            initialHasLiked={post.hasLiked}
            initialLikesCount={post.likesCount}
          />

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 text-slate-400 hover:text-violet-400 transition-colors cursor-pointer active:scale-95 group"
          >
            <MessageSquare className="w-5.5 h-5.5 group-hover:scale-105 transition-transform" />
            <span className="text-xs font-mono font-bold">{commentsCount}</span>
          </button>

          {/* Quick instructions to long press */}
          <span className="text-[10px] font-sans text-slate-500 normal-case tracking-normal hidden sm:inline">
            Tip: Press and hold on the photo to throw a burst of hearts!
          </span>
        </div>

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
        <div className="px-4 pb-4 bg-slate-950 z-10">
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
        <div className="px-4 pb-4 border-t border-slate-900 bg-slate-950/50 z-10">
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
