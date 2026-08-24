'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  MapPin, MessageSquare, Bookmark, ShieldAlert, Check, 
  MoreHorizontal, Volume2, VolumeX, Sparkles, Heart, Zap, RefreshCw
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

      const type = post.audioUrl;
      if (type === 'cyber_drone') {
        // Deep sub-bass cinematic drone
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(55, ctx.currentTime); // Low A

        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(55.4, ctx.currentTime); // Detuned

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(120, ctx.currentTime);

        gainNode.gain.setValueAtTime(0.18, ctx.currentTime);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start();
        osc2.start();
        audioNodesRef.current = [osc1, osc2, gainNode];
      } else if (type === 'neon_synth') {
        // Pulsing neo-tokyo synth bass
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(110, ctx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(250, ctx.currentTime);

        gainNode.gain.setValueAtTime(0.22, ctx.currentTime);

        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(3.5, ctx.currentTime); // 3.5Hz pulse
        lfoGain.gain.setValueAtTime(120, ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start();
        lfo.start();
        audioNodesRef.current = [osc, lfo, gainNode];
      } else if (type === 'rainy_jazz') {
        // Soothing vinyl static & rainy noise block
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
        noiseGain.connect(ctx.destination);
        whiteNoise.start();

        // Slow soft electric jazz chords synth
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 220;
        const padGain = ctx.createGain();
        padGain.gain.value = 0.08;

        osc.connect(padGain);
        padGain.connect(ctx.destination);
        osc.start();

        audioNodesRef.current = [whiteNoise, osc, noiseGain, padGain];
      } else if (type === 'vapor_echo') {
        // Ethereal echoed retro key block
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
        gain.connect(ctx.destination);

        osc.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(ctx.destination);

        osc.start();
        audioNodesRef.current = [osc, delay, gain];
      }
    } catch (e) {
      console.error('Failed to trigger audio synth loop:', e);
    }
  };

  const stopAudioLoop = () => {
    setIsPlayingAudio(false);
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
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAudioToggle();
            }}
            className={cn(
              "absolute top-4 right-4 p-2 rounded-full border backdrop-blur-md cursor-pointer transition-all flex items-center justify-center gap-1.5 z-20 shadow-lg",
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
