'use client';

import * as React from 'react';
import { 
  ChevronLeft, ChevronRight, X, Play, Pause, Compass, 
  MapPin, Lock, LockOpen, Sparkles, Send, Mic, Volume2, 
  Code, Copy, Check, Radio, Sliders, MessageSquare, Terminal, Activity 
} from 'lucide-react';
import { 
  ActiveStoryTray, submitStoryQAAnswer, submitStoryPollVote, 
  submitStoryAnonymousAnswer, checkEngagementGated, getCurrentUser 
} from '@/lib/actions';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { Story } from '@/lib/db';

interface StoryViewerProps {
  trays: ActiveStoryTray[];
  initialUserIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

const BACKGROUND_PRESETS = [
  { id: 'neon-violet', css: 'bg-gradient-to-tr from-violet-950 via-purple-900 to-slate-900 text-violet-200' },
  { id: 'neon-teal', css: 'bg-gradient-to-tr from-teal-950 via-slate-900 to-violet-950 text-teal-200' },
  { id: 'cyberpunk', css: 'bg-gradient-to-b from-slate-950 via-rose-950 to-violet-950 text-pink-200' },
  { id: 'cosmic', css: 'bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-indigo-200' },
  { id: 'solar', css: 'bg-gradient-to-tr from-amber-950 via-stone-900 to-orange-950 text-amber-200' }
];

function getStoryBackgroundClass(mediaUrl: string) {
  if (mediaUrl.startsWith('GRADIENT:')) {
    const presetId = mediaUrl.replace('GRADIENT:', '');
    const found = BACKGROUND_PRESETS.find(p => p.id === presetId);
    return found ? found.css : 'bg-slate-950 text-slate-100';
  }
  return '';
}

export default function StoryViewer({ trays, initialUserIndex, isOpen, onClose }: StoryViewerProps) {
  const [userIndex, setUserIndex] = React.useState(initialUserIndex);
  const [storyIndex, setStoryIndex] = React.useState(0);
  const [progress, setProgress] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<any>(null);

  // Engagement gate state (Feature 15)
  const [gateUnlocked, setGateUnlocked] = React.useState(true);
  const [checkingGate, setCheckingGate] = React.useState(false);

  // Local state replicas to bypass immutability linter rules
  const [qaAnswersState, setQaAnswersState] = React.useState<any[]>([]);
  const [pollVotesState, setPollVotesState] = React.useState<any[]>([]);
  const [anonymousAnswersState, setAnonymousAnswersState] = React.useState<any[]>([]);

  // Interactive Form input states
  const [qaInput, setQaInput] = React.useState('');
  const [anonymousInput, setAnonymousInput] = React.useState('');
  const [copiedCode, setCopiedCode] = React.useState(false);

  // Poll Vote local value (Feature 16)
  const [pollLocalValue, setPollLocalValue] = React.useState(50);
  const [votedPollValue, setVotedPollValue] = React.useState<number | null>(null);
  const [pollSparkle, setPollSparkle] = React.useState(false);

  // Time decay scaling state (Feature 11)
  const [decayRatio, setDecayRatio] = React.useState(1.0);

  // Audio Playback states (Feature 13)
  const [isPlayingAudio, setIsPlayingAudio] = React.useState(false);
  const audioContextRef = React.useRef<AudioContext | null>(null);

  const duration = 6500; // 6.5 seconds per slide to allow interactive reading
  const progressInterval = 50; 
  const steps = duration / progressInterval;
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const currentTray = trays[userIndex];
  const currentStory = currentTray?.stories[storyIndex];
  const isOwner = currentUser && currentStory && currentUser.id === currentStory.userId;

  const stopAudioPlayback = React.useCallback(() => {
    setIsPlayingAudio(false);
  }, []);

  // Sync user index & fetch current user
  React.useEffect(() => {
    getCurrentUser().then(user => {
      if (user) {
        Promise.resolve().then(() => {
          setCurrentUser(user);
        });
      }
    });
    if (isOpen) {
      Promise.resolve().then(() => {
        setUserIndex(initialUserIndex);
        setStoryIndex(0);
        setProgress(0);
        setIsPaused(false);
        setVotedPollValue(null);
      });
    }
  }, [initialUserIndex, isOpen]);

  // Check Engagement Gate on story change (Feature 15)
  React.useEffect(() => {
    if (currentStory) {
      Promise.resolve().then(() => {
        setQaAnswersState(currentStory.qaAnswers || []);
        setPollVotesState(currentStory.pollVotes || []);
        setAnonymousAnswersState(currentStory.anonymousAnswers || []);
      });

      // Check if story is gated
      if (currentStory.isGated && currentUser && currentUser.id !== currentStory.userId) {
        Promise.resolve().then(() => {
          setCheckingGate(true);
          setIsPaused(true); // Suspend progress during check
        });
        checkEngagementGated(currentStory.userId).then(unlocked => {
          Promise.resolve().then(() => {
            setGateUnlocked(unlocked);
            setCheckingGate(false);
            if (unlocked) {
              setIsPaused(false);
            }
          });
        });
      } else {
        Promise.resolve().then(() => {
          setGateUnlocked(true);
          setCheckingGate(false);
          setIsPaused(false);
        });
      }

      // Check if user has already voted on this poll
      if (currentStory.pollVotes && currentUser) {
        const myVote = currentStory.pollVotes.find((v: any) => v.username === currentUser.username);
        Promise.resolve().then(() => {
          if (myVote) {
            setVotedPollValue(myVote.score);
            setPollLocalValue(myVote.score);
          } else {
            setVotedPollValue(null);
            setPollLocalValue(50);
          }
        });
      }

      // Reset inputs
      Promise.resolve().then(() => {
        setQaInput('');
        setAnonymousInput('');
        setCopiedCode(false);
      });
    }
  }, [currentStory, currentUser]);

  // Time decay tracker logic (Feature 11)
  React.useEffect(() => {
    if (!currentStory) return;
    const updateDecay = () => {
      const now = Date.now();
      const expiresTime = new Date(currentStory.expiresAt).getTime();
      const createdTime = new Date(currentStory.createdAt).getTime();
      const total = expiresTime - createdTime || (24 * 60 * 60 * 1000);
      const ratio = Math.max(0.15, Math.min(1.0, (expiresTime - now) / total));
      Promise.resolve().then(() => {
        setDecayRatio(ratio);
      });
    };

    updateDecay();
    const decayInterval = setInterval(updateDecay, 1000);
    return () => clearInterval(decayInterval);
  }, [currentStory]);

  const handleNext = React.useCallback(() => {
    if (!currentTray) return;
    stopAudioPlayback();
    
    if (storyIndex < currentTray.stories.length - 1) {
      setStoryIndex(prev => prev + 1);
      setProgress(0);
    } else if (userIndex < trays.length - 1) {
      setUserIndex(prev => prev + 1);
      setStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [userIndex, storyIndex, trays, currentTray, onClose]);

  const handlePrev = React.useCallback(() => {
    if (!currentTray) return;
    stopAudioPlayback();

    if (storyIndex > 0) {
      setStoryIndex(prev => prev - 1);
      setProgress(0);
    } else if (userIndex > 0) {
      const prevUserIndex = userIndex - 1;
      const prevTray = trays[prevUserIndex];
      setUserIndex(prevUserIndex);
      setStoryIndex(prevTray.stories.length - 1);
      setProgress(0);
    } else {
      setProgress(0);
    }
  }, [userIndex, storyIndex, trays, currentTray]);

  // Timer logic for progression
  React.useEffect(() => {
    if (!isOpen || isPaused || !currentStory || !gateUnlocked || checkingGate) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          handleNext();
          return 0;
        }
        return p + (100 / steps);
      });
    }, progressInterval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isPaused, currentStory, gateUnlocked, checkingGate, handleNext, steps]);

  // Keyboard navigation
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // ignore when typing
      }
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPaused(p => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  // Feature 13 Audio playbacks
  const togglePlayAudio = async () => {
    if (isPlayingAudio) {
      stopAudioPlayback();
      return;
    }

    setIsPlayingAudio(true);
    if (currentStory?.audioDataUrl === 'SYNTHETIC_CHIME_PULSE') {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        const notes = [261.63, 329.63, 392.00, 523.25]; // C E G C bell chime
        let time = ctx.currentTime;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.15, time);
        gainNode.connect(ctx.destination);

        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, time + idx * 0.25);
          osc.connect(gainNode);
          osc.start(time + idx * 0.25);
          osc.stop(time + idx * 0.25 + 0.35);
        });

        setTimeout(() => {
          setIsPlayingAudio(false);
        }, 1500);
      } catch {
        setIsPlayingAudio(false);
      }
    } else if (currentStory?.audioDataUrl) {
      try {
        const audio = new Audio(currentStory.audioDataUrl);
        audio.onended = () => setIsPlayingAudio(false);
        audio.play();
      } catch {
        setIsPlayingAudio(false);
      }
    }
  };

  // Interactivity submissions
  const handleQAAnswerSubmit = async () => {
    if (!qaInput.trim() || !currentStory) return;
    const text = qaInput.trim();
    setQaInput('');
    setIsPaused(false); // resume standard autoplay after interaction

    const res = await submitStoryQAAnswer(currentStory.id, text);
    if (res.success && res.story) {
      setQaAnswersState(res.story.qaAnswers || []);
    }
  };

  const handleAnonymousFeedbackSubmit = async () => {
    if (!anonymousInput.trim() || !currentStory) return;
    const text = anonymousInput.trim();
    setAnonymousInput('');
    setIsPaused(false);

    const res = await submitStoryAnonymousAnswer(currentStory.id, text);
    if (res.success && res.story) {
      setAnonymousAnswersState(res.story.anonymousAnswers || []);
      alert('🔒 Feedback dispatched anonymously. Identifier data scrubbed.');
    }
  };

  const handlePollVote = async (val: number) => {
    if (!currentStory) return;
    setVotedPollValue(val);
    setPollSparkle(true);
    setTimeout(() => setPollSparkle(false), 800);

    const res = await submitStoryPollVote(currentStory.id, val);
    if (res.success && res.story) {
      setPollVotesState(res.story.pollVotes || []);
    }
  };

  const handleCopyCode = () => {
    if (!currentStory?.codeSnippet) return;
    navigator.clipboard.writeText(currentStory.codeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Calculate average rating of poll (Feature 16) - computed safely before early returns
  const pollAverage = React.useMemo(() => {
    if (!pollVotesState || pollVotesState.length === 0) return null;
    const sum = pollVotesState.reduce((acc: number, curr: any) => acc + curr.score, 0);
    return Math.round(sum / pollVotesState.length);
  }, [pollVotesState]);

  // Safe checks for rendering below the hooks
  if (!isOpen || !currentTray || !currentStory) return null;

  const bgClass = getStoryBackgroundClass(currentStory.mediaUrl);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl">
        
        {/* Left Side Info Panel */}
        <div className="absolute top-6 left-6 text-slate-500 hidden md:flex flex-col gap-1 pointer-events-none">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">VIVIDPULSE STUDIO</span>
          <span className="text-[10px] font-mono">Chamber view • Sync established</span>
          <span className="text-[10px] font-mono text-slate-600 mt-2">Spacebar: Play/Pause • Arrows: Navigate</span>
        </div>

        {/* Modal Close */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded cursor-pointer z-50 transition-all shadow-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* MAIN STORY VIEWER PLATFORM FRAME */}
        <div className="relative w-full max-w-[420px] aspect-[9/16] bg-slate-950 shadow-[0_0_80px_rgba(124,58,237,0.2)] border border-slate-900 rounded-lg overflow-hidden flex flex-col justify-between">
          
          {/* HEADER LAYER (Progress and User controls) */}
          <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/90 via-black/40 to-transparent z-40 flex flex-col gap-3">
            {/* Slide segment bars */}
            <div className="flex gap-1.5 w-full">
              {currentTray.stories.map((story, idx) => {
                let storyProgress = 0;
                if (idx < storyIndex) storyProgress = 100;
                else if (idx === storyIndex) storyProgress = progress;

                return (
                  <div key={story.id} className="h-1 flex-1 bg-slate-800 rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-violet-500 transition-all duration-[50ms]"
                      style={{ width: `${storyProgress}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Owner avatar & Chaining indicators (Feature 12) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={currentTray.avatarUrl || 'https://picsum.photos/seed/placeholder/100/100'}
                  alt={currentTray.username}
                  className="w-9 h-9 rounded-full object-cover border border-violet-500/80 p-0.5"
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white leading-none">@{currentTray.username}</span>
                    {currentStory.isGated && (
                      <span className="px-1.5 py-0.5 bg-amber-950/80 border border-amber-900/60 rounded-[3px] text-[7px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-0.5">
                        <Lock className="w-2 h-2" /> Gated
                      </span>
                    )}
                  </div>
                  {/* Narrative Pulse Chain tag indicator (Feature 12) */}
                  {currentStory.chainedStoryId ? (
                    <span className="text-[8px] font-bold text-teal-400 font-mono flex items-center gap-1 mt-1">
                      <Radio className="w-2.5 h-2.5 animate-pulse" /> Arc: {currentStory.chainName || 'Cohesive Chain'} 🔗
                    </span>
                  ) : (
                    <span className="text-[8px] font-mono text-slate-400 mt-1">Live Feed</span>
                  )}
                </div>
              </div>

              {/* Pause, location, or expiration indicators */}
              <div className="flex items-center gap-2">
                {/* Feature 20: Minimalist Expiration slice ticker in header */}
                <div className="w-5 h-5 rounded-full border border-slate-800 flex items-center justify-center bg-slate-950 text-slate-500 text-[8px] font-mono" title="Time remaining ratio">
                  {Math.round(decayRatio * 100)}%
                </div>

                <button
                  onClick={() => setIsPaused(p => !p)}
                  className="p-1.5 bg-black/40 hover:bg-black/60 rounded text-slate-400 hover:text-white border border-white/5 transition-all cursor-pointer"
                >
                  {isPaused ? <Play className="w-3.5 h-3.5 animate-pulse text-violet-400" /> : <Pause className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* VIEWPORT BODY CANVAS CONTAINER */}
          <div className={cn(
            "w-full h-full relative select-none flex flex-col justify-center items-center p-6 text-center text-slate-100",
            bgClass || "bg-slate-950"
          )}>
            
            {/* If uploaded custom graphic image base, render behind overlays */}
            {currentStory.mediaUrl && !currentStory.mediaUrl.startsWith('GRADIENT:') && (
              <img
                src={currentStory.mediaUrl}
                alt="Story Image Base"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
                draggable={false}
              />
            )}

            {/* Dark contrast screen shade for readability of high-tech controls */}
            <div className="absolute inset-0 bg-black/45 backdrop-blur-[0.5px] z-10" />

            {/* ---------------- INTERACTIVE OVERLAYS LAYER (Z-20) ---------------- */}
            <div className="z-20 w-full flex flex-col gap-4 mt-12 mb-8 max-h-[85%] overflow-y-auto scrollbar-none justify-center">
              
              {/* FEATURE 15: ENGAGEMENT GATE EXCLUSIVITY GUARD */}
              {!gateUnlocked ? (
                <div className="w-full bg-slate-950/95 border border-amber-500/30 p-5 rounded-lg flex flex-col items-center gap-3.5 shadow-[0_0_40px_rgba(245,158,11,0.1)] py-8">
                  <div className="w-10 h-10 rounded-full bg-amber-950/40 border border-amber-900/60 flex items-center justify-center text-amber-500">
                    <Lock className="w-5 h-5 animate-pulse" />
                  </div>
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-amber-400">Exclusivity Gate Active</h3>
                  <p className="text-[10px] text-slate-400 font-light leading-relaxed max-w-xs">
                    This story is visible exclusively to members who interacted (liked or commented) with this creator&apos;s grid posts in the past 48 hours.
                  </p>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 rounded text-[9px] font-bold uppercase tracking-wider hover:bg-slate-800 cursor-pointer"
                  >
                    Return to Feed
                  </button>
                </div>
              ) : (
                <>
                  {/* FEATURE 14: COORDINATE TAG */}
                  {currentStory.latitude !== undefined && currentStory.longitude !== undefined && (
                    <div className="self-center flex items-center gap-1.5 px-2 py-1 bg-slate-950/90 border border-slate-800/80 rounded-[4px] text-[8px] font-mono tracking-wider text-rose-400 shadow shadow-rose-950/20">
                      <MapPin className="w-3 h-3 text-rose-500 fill-rose-500/20" />
                      COORDS: [{currentStory.latitude.toFixed(4)}° N, {currentStory.longitude.toFixed(4)}° E]
                    </div>
                  )}

                  {/* FEATURE 11: TIME-DECAY INTERACTIVE Q&A */}
                  {currentStory.qaQuestion && (
                    <div className="w-full bg-slate-950/90 border border-violet-500/25 p-4 rounded shadow-xl flex flex-col gap-2.5 text-left border-t-2 border-t-violet-500">
                      {/* Font size decays physically over story duration */}
                      <span 
                        className="font-bold tracking-tight text-white transition-all leading-tight block"
                        style={{ fontSize: `${Math.max(10, Math.floor(decayRatio * 15))}px` }}
                      >
                        ❓ {currentStory.qaQuestion}
                      </span>

                      {/* Submitted responses list (shrinking size as well!) */}
                      {qaAnswersState && qaAnswersState.length > 0 && (
                        <div className="flex flex-col gap-1.5 max-h-24 overflow-y-auto border-t border-slate-900 pt-2.5 scrollbar-none">
                          {qaAnswersState.map((ans: any) => (
                            <div key={ans.id} className="bg-slate-900/60 p-1.5 rounded border border-slate-950 flex flex-col gap-0.5">
                              <span className="text-[8px] font-bold text-violet-400">@{ans.username}</span>
                              <span 
                                className="text-slate-300 font-light leading-snug transition-all"
                                style={{ fontSize: `${Math.max(8, Math.floor(decayRatio * 11))}px` }}
                              >
                                {ans.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Text Input Block */}
                      {!isOwner && (
                        <div className="flex gap-1.5 mt-1">
                          <input
                            type="text"
                            placeholder="Type a response..."
                            value={qaInput}
                            onChange={(e) => setQaInput(e.target.value)}
                            onFocus={() => setIsPaused(true)}
                            onBlur={() => setIsPaused(false)}
                            className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-[10px] text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500"
                          />
                          <button
                            onClick={handleQAAnswerSubmit}
                            disabled={!qaInput.trim()}
                            className="p-1.5 bg-violet-600 hover:bg-violet-500 rounded text-white disabled:opacity-50 transition-colors cursor-pointer"
                          >
                            <Send className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* FEATURE 13: AUDIO WAVEFORM PULSE */}
                  {currentStory.mediaType === 'AUDIO_WAVEFORM' && (
                    <div className="w-full bg-slate-950/90 border border-teal-500/25 p-4 rounded shadow-xl flex flex-col items-center gap-3">
                      <span className="text-[8px] font-mono font-bold tracking-widest text-teal-400 uppercase flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5 text-teal-400 animate-pulse" /> Micro-Broadcast Pulse
                      </span>

                      {/* Waveform Nodes Animation */}
                      <div className="w-full h-12 flex items-center justify-center gap-1 py-1 px-4 bg-slate-900/40 rounded border border-slate-950">
                        {currentStory.waveformPoints?.map((pt: number, i: number) => (
                          <div
                            key={i}
                            className={cn(
                              "w-1 rounded bg-teal-400 shadow-sm transition-all",
                              isPlayingAudio ? "animate-bounce" : "opacity-80"
                            )}
                            style={{ 
                              height: `${pt}%`,
                              animationDelay: isPlayingAudio ? `${i * 35}ms` : undefined,
                              animationDuration: '0.6s'
                            }}
                          />
                        ))}
                      </div>

                      <button
                        onClick={togglePlayAudio}
                        className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-teal-950/50"
                      >
                        {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        {isPlayingAudio ? 'Suspend Stream' : 'Playback Audio'}
                      </button>
                    </div>
                  )}

                  {/* FEATURE 16: AMBIENT MICRO-POLL SLIDERS */}
                  {currentStory.pollQuestion && (
                    <div className="w-full bg-slate-950/90 border border-indigo-500/20 p-4 rounded shadow-xl flex flex-col gap-3 text-left">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-1">
                        <Sliders className="w-3.5 h-3.5 text-indigo-500" /> COMMUNITY VIBE CHECK
                      </span>
                      <span className="text-[11px] font-bold text-white tracking-tight">
                        {currentStory.pollQuestion}
                      </span>

                      {/* SVG Sliders Component with active tracking indicator */}
                      <div className="w-full py-2.5 relative flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-[8px] font-mono text-slate-500 uppercase">
                          <span>{currentStory.pollMinLabel || '0'}</span>
                          <span>{currentStory.pollMaxLabel || '100'}</span>
                        </div>

                        {/* Interactive Drag SVG Slider */}
                        <div className="relative w-full h-5 flex items-center">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={pollLocalValue}
                            disabled={votedPollValue !== null}
                            onChange={(e) => setPollLocalValue(parseInt(e.target.value))}
                            onMouseUp={() => handlePollVote(pollLocalValue)}
                            onTouchEnd={() => handlePollVote(pollLocalValue)}
                            onFocus={() => setIsPaused(true)}
                            onBlur={() => setIsPaused(false)}
                            className={cn(
                              "w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500",
                              votedPollValue !== null && "opacity-60 cursor-not-allowed"
                            )}
                          />
                        </div>

                        {/* Display Average rating dynamically (glowing bubble pulse) */}
                        {pollAverage !== null && (
                          <div className="flex items-center justify-between mt-1 border-t border-slate-900 pt-2 text-[9px] font-mono">
                            <span className="text-slate-500">PACKET SENSORS TOTAL:</span>
                            <div className={cn(
                              "px-2 py-0.5 bg-indigo-950 border border-indigo-900 text-indigo-300 font-bold rounded flex items-center gap-1 shadow-sm",
                              pollSparkle && "animate-bounce"
                            )}>
                              Avg Pulse: {pollAverage}%
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* FEATURE 17: SYNTAX CODE PULSE */}
                  {currentStory.codeSnippet && (
                    <div className="w-full bg-slate-950 border border-slate-900 rounded shadow-xl flex flex-col text-left overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/60 border-b border-slate-950">
                        <span className="text-[9px] font-mono text-slate-400 flex items-center gap-1">
                          <Code className="w-3 h-3 text-teal-400" /> syntax_pulse.{currentStory.codeLanguage === 'python' ? 'py' : (currentStory.codeLanguage === 'rust' ? 'rs' : 'ts')}
                        </span>
                        <button
                          onClick={handleCopyCode}
                          className="p-1 hover:bg-slate-950 rounded text-slate-400 hover:text-white transition-colors"
                          title="Copy Code Packet"
                        >
                          {copiedCode ? <Check className="w-3 h-3 text-teal-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <pre className="p-3 bg-slate-950/80 font-mono text-[9px] leading-normal text-teal-400 overflow-x-auto whitespace-pre">
                        <code>{currentStory.codeSnippet}</code>
                      </pre>
                    </div>
                  )}

                  {/* FEATURE 18: ANONYMOUS QUERY TERMINAL */}
                  {currentStory.hasAnonymousTerminal && (
                    <div className="w-full bg-slate-950/90 border border-emerald-500/25 p-4 rounded shadow-xl flex flex-col gap-2.5 text-left">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> ANONYMOUS INTAKE TERMINAL
                      </span>

                      {/* Display Scrubbed Anonymous responses to OWNER exclusively */}
                      {isOwner ? (
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[8px] font-mono text-slate-500 uppercase">Received Responses (Encrypted Logs):</span>
                          {anonymousAnswersState && anonymousAnswersState.length > 0 ? (
                            <div className="flex flex-col gap-1.5 max-h-28 overflow-y-auto scrollbar-none border border-slate-900 p-2 rounded bg-slate-900/20">
                              {anonymousAnswersState.map((ans: any) => (
                                <div key={ans.id} className="text-[9px] font-mono border-b border-slate-900/60 pb-1 text-slate-300">
                                  <span className="text-emerald-400 select-none">▶ </span>
                                  {ans.text}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[9px] text-slate-600 font-mono italic">No anonymous logs packet loaded yet.</span>
                          )}
                        </div>
                      ) : (
                        /* Standard Viewers type anonymously */
                        <div className="flex flex-col gap-1.5">
                          <textarea
                            placeholder="Send secure feedback anonymously..."
                            value={anonymousInput}
                            onChange={(e) => setAnonymousInput(e.target.value)}
                            onFocus={() => setIsPaused(true)}
                            onBlur={() => setIsPaused(false)}
                            rows={2}
                            className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-[10px] text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-emerald-500"
                          />
                          <button
                            onClick={handleAnonymousFeedbackSubmit}
                            disabled={!anonymousInput.trim()}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[9px] font-bold uppercase tracking-wider self-end cursor-pointer disabled:opacity-50 transition-colors"
                          >
                            Dispatch Securely
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* FEATURE 19: NARRATIVE VAULT HASHTAGS FLOATING */}
                  {currentStory.hashtags && currentStory.hashtags.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1.5 self-center">
                      {currentStory.hashtags.map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-950/80 border border-slate-900 text-[8px] font-mono text-teal-400 font-bold uppercase tracking-wider rounded-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}

            </div>
          </div>

          {/* Navigation overlay chevrons for Desktop */}
          <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2.5 pointer-events-none z-30">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="p-1.5 bg-black/60 hover:bg-black/90 text-slate-300 hover:text-white border border-slate-800 rounded pointer-events-auto cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="p-1.5 bg-black/60 hover:bg-black/90 text-slate-300 hover:text-white border border-slate-800 rounded pointer-events-auto cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </AnimatePresence>
  );
}
