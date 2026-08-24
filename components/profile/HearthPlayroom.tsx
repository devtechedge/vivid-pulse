"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAccessibility } from '@/components/ui/AccessibilityProvider';
import { FormattedDate } from '@/components/ui/FormattedDate';
import { Button } from '@/components/ui/Button';
import { 
  Heart, Sparkles, Plus, Image as ImageIcon, Volume2, HelpCircle, 
  Paintbrush, Smile, Award, Camera, BookOpen, Mic, Users, Flame,
  Send, RefreshCw, Star, Info, Check, ShieldAlert, ArrowRight, 
  Trash2, PlusCircle, VolumeX, Play, Pause, ChevronLeft, ChevronRight
} from 'lucide-react';
import {
  getScrapbooks, createScrapbook, addScrapbookSticker,
  getPenPals, createPenPalChain, addPenPalLetter,
  getCameraPhotos, addCameraPhoto,
  getCookbook, addCookbookStep,
  getWeavingPhotos, addWeavingPhoto,
  getChallengeBadges, unlockBadge,
  getVoiceClips, addVoiceClip,
  getFrameProjects, addFrameStroke, createFrameProject,
  getPicnicTable, updatePicnicTable
} from '@/lib/actions';
import {
  ScrapbookCollab, ScrapbookSticker, PenPalChain, CameraPhoto, 
  CookbookProject, WeavingPhoto, ChallengeBadge, SingalongVoiceClip, 
  CollabFrameProject, PicnicTableState, FrameStroke
} from '@/lib/db';

export default function HearthPlayroom() {
  const { isEasyMode, isHighContrast, speak } = useAccessibility();

  // Role simulation state (to allow testing real-time multi-user capabilities easily!)
  const [currentUserRole, setCurrentUserRole] = useState<'Grandma Green' | 'Arthur Green' | 'Lily Green' | 'Uncle Bob'>('Grandma Green');

  // Sub-tabs for the 10 Batch 10 features
  const PLAY_FEATURES = [
    { id: 'scrapbook', label: '🎨 Scrapbook Collabs', desc: 'Decorate shared photos with stamps' },
    { id: 'penpal', label: '✉️ Pen Pal Chains', desc: 'Sweet alternating prompts' },
    { id: 'camera', label: '📸 Pass-the-Camera', desc: 'Daily color scavenger game' },
    { id: 'cookbook', label: '🥧 Cookbook Patchwork', desc: 'Step-by-step family baking stitch' },
    { id: 'picnic', label: '🧺 Picnic Table Room', desc: 'Shared viewer with low-noise audio' },
    { id: 'weaving', label: '🌈 Scenic Color Weaving', desc: 'Ombre scenery tapestry' },
    { id: 'badges', label: '🏆 Challenge Badges', desc: 'Unlock micro-quests together' },
    { id: 'singalong', label: '🎶 Singalong Choir', desc: 'Record & blend voice harmonies' },
    { id: 'frame', label: '🖼️ Frame Painting', desc: 'Collaborative side-by-side border painting' },
    { id: 'fireplace', label: '🔥 The Hearth Fire', desc: 'A cozy Screensaver & Crackling audio' }
  ];

  const [activeFeature, setActiveFeature] = useState<string>('scrapbook');

  // Common Loading / Syncing State
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);

  // 1. Scrapbook State
  const [scrapbooks, setScrapbooks] = useState<ScrapbookCollab[]>([]);
  const [activeScrapbookIdx, setActiveScrapbookIdx] = useState<number>(0);
  const [selectedSticker, setSelectedSticker] = useState<string>('heart');
  const [newScrapbookTitle, setNewScrapbookTitle] = useState('');
  const [newScrapbookUrl, setNewScrapbookUrl] = useState('');
  const [isAddingScrapbook, setIsAddingScrapbook] = useState(false);

  // 2. Pen Pal State
  const [penPals, setPenPals] = useState<PenPalChain[]>([]);
  const [activePenPalIdx, setActivePenPalIdx] = useState<number>(0);
  const [newLetterText, setNewLetterText] = useState('');
  const [newChainPrompt, setNewChainPrompt] = useState('');
  const [isAddingChain, setIsAddingChain] = useState(false);

  // 3. Camera Game State
  const [cameraPhotos, setCameraPhotos] = useState<CameraPhoto[]>([]);
  const [activeColorChallenge, setActiveColorChallenge] = useState<string>('yellow');
  const [newCameraPhotoUrl, setNewCameraPhotoUrl] = useState('');
  const [newCameraPhotoCaption, setNewCameraPhotoCaption] = useState('');

  // 4. Cookbook State
  const [cookbook, setCookbook] = useState<CookbookProject | null>(null);
  const [newCookbookUrl, setNewCookbookUrl] = useState('');
  const [newCookbookInstruction, setNewCookbookInstruction] = useState('');

  // 5. Picnic Table State
  const [picnicTable, setPicnicTable] = useState<PicnicTableState | null>(null);
  const [isAudioLineActive, setIsAudioLineActive] = useState<boolean>(false);
  const [picnicSoundStatus, setPicnicSoundStatus] = useState<string>('idle');

  // 6. Color Weaving State
  const [weavingPhotos, setWeavingPhotos] = useState<WeavingPhoto[]>([]);
  const [weavingFilter, setWeavingFilter] = useState<string>('all');
  const [newWeaveUrl, setNewWeaveUrl] = useState('');
  const [newWeaveScenery, setNewWeaveScenery] = useState('');
  const [newWeaveColor, setNewWeaveColor] = useState<'green' | 'amber' | 'blue' | 'rose' | 'slate'>('green');

  // 7. Challenge Badges State
  const [badges, setBadges] = useState<ChallengeBadge[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<ChallengeBadge | null>(null);
  const [badgeProofText, setBadgeProofText] = useState('');
  const [badgeProofPhoto, setBadgeProofPhoto] = useState('');

  // 8. Choir / Singalong State
  const [voiceClips, setVoiceClips] = useState<SingalongVoiceClip[]>([]);
  const [choirStatus, setChoirStatus] = useState<'idle' | 'playing'>('idle');
  const [customVocalMutes, setCustomVocalMutes] = useState<Record<string, boolean>>({});

  // 9. Hand-Painted Frames State
  const [frameProjects, setFrameProjects] = useState<CollabFrameProject[]>([]);
  const [activeFrameIdx, setActiveFrameIdx] = useState<number>(0);
  const [selectedPaintColor, setSelectedPaintColor] = useState<string>('#f59e0b'); // amber-500
  const [activePaintSide, setActivePaintSide] = useState<'left' | 'right' | 'top' | 'bottom'>('left');

  // 10. Fireplace State
  const [fireIntensity, setFireIntensity] = useState<'ember' | 'cozy' | 'blazing'>('cozy');
  const [isWoodCrackleEnabled, setIsWoodCrackleEnabled] = useState<boolean>(false);
  const [fireplacePhotoIndex, setFireplacePhotoIndex] = useState<number>(0);

  // Audio Context Ref for Nostalgic Synthesized Chords
  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioWorkletNode | ScriptProcessorNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);
  const choirPlayingRef = useRef<boolean>(false);

  // Load all initial state
  const loadData = async (isSync: boolean = false) => {
    if (!isSync) setLoading(true);
    else setSyncing(true);

    try {
      const [
        sbs, pps, cams, cook, wevs, bdgs, clips, frames, picnic
      ] = await Promise.all([
        getScrapbooks(),
        getPenPals(),
        getCameraPhotos(),
        getCookbook(),
        getWeavingPhotos(),
        getChallengeBadges(),
        getVoiceClips(),
        getFrameProjects(),
        getPicnicTable()
      ]);

      setScrapbooks(sbs);
      setPenPals(pps);
      setCameraPhotos(cams);
      setCookbook(cook);
      setWeavingPhotos(wevs);
      setBadges(bdgs);
      setVoiceClips(clips);
      setFrameProjects(frames);
      setPicnicTable(picnic);
    } catch (err) {
      console.error('Error fetching co-authoring data:', err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadData();
    // Set up a gentle 5-second polling system to simulate real-time collaborative state sync!
    const pollTimer = setInterval(() => {
      loadData(true);
    }, 5000);
    return () => clearInterval(pollTimer);
  }, []);

  const handleFeatureChange = (id: string, label: string) => {
    setActiveFeature(id);
    speak(`Switched playroom tab to ${label}.`);
  };

  // Helper function to synthesize retro cozy sound notes in browser!
  const playSynthesizedTone = (frequencies: number[], durationSec: number = 0.5) => {
    try {
      // Lazy load/init audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      frequencies.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine'; // gentle tone
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        // Gentle envelope to avoid popping
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + durationSec);
      });
    } catch (e) {
      console.warn('Audio context synthesis unsupported or blocked:', e);
    }
  };

  // Generate cozy crackling log fireplace noise
  const toggleFireplaceNoise = (enable: boolean, intensity: 'ember' | 'cozy' | 'blazing') => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      if (!enable) {
        if (noiseNodeRef.current) {
          noiseNodeRef.current.disconnect();
          noiseNodeRef.current = null;
        }
        return;
      }

      if (noiseNodeRef.current) {
        noiseNodeRef.current.disconnect();
      }

      // Create white/pink noise for the cracking fire effect
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Pink noise filter formula
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        b6 = white * 0.115926;
        output[i] = pink * 0.05; // soften Pink noise
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const gainNode = ctx.createGain();
      const targetGain = intensity === 'ember' ? 0.05 : intensity === 'cozy' ? 0.15 : 0.3;
      gainNode.gain.setValueAtTime(targetGain, ctx.currentTime);

      noiseSource.connect(gainNode);
      gainNode.connect(ctx.destination);

      noiseSource.start();
      // Keep reference to stop it later
      noiseNodeRef.current = noiseSource as any;
      noiseGainRef.current = gainNode;

      // Crackling embers (random pops)
      const popInterval = setInterval(() => {
        if (!noiseNodeRef.current) {
          clearInterval(popInterval);
          return;
        }
        // Synthesise a tiny fire crackle pop!
        const osc = ctx.createOscillator();
        const popGain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100 + Math.random() * 300, ctx.currentTime);
        popGain.gain.setValueAtTime(0, ctx.currentTime);
        popGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.002);
        popGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

        osc.connect(popGain);
        popGain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.04);
      }, intensity === 'ember' ? 900 : intensity === 'cozy' ? 400 : 150);

    } catch (e) {
      console.warn('Fire noise synthesis blocked:', e);
    }
  };

  // Automated slideshow for Screensaver Hearth Fireplace
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeFeature === 'fireplace') {
      timer = setInterval(() => {
        setFireplacePhotoIndex((prev) => {
          const count = scrapbooks.length || 1;
          return (prev + 1) % count;
        });
      }, 7000);
    }
    return () => clearInterval(timer);
  }, [activeFeature, scrapbooks.length]);

  // Cleanup synthesizer noises on unmount
  useEffect(() => {
    return () => {
      if (noiseNodeRef.current) {
        try {
          noiseNodeRef.current.disconnect();
        } catch(e) {}
      }
    };
  }, []);

  // Action: Add Sticker to Scrapbook Collage
  const handlePlaceSticker = async (e: React.MouseEvent<HTMLDivElement>) => {
    const scrapbook = scrapbooks[activeScrapbookIdx];
    if (!scrapbook) return;

    // Calculate click coordinates inside container as percentage
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    // Optimistic Update
    const mockSticker: ScrapbookSticker = {
      id: 'mock_' + Date.now(),
      type: selectedSticker,
      x,
      y,
      scale: 1.0,
      placedBy: currentUserRole
    };

    const updatedScrapbooks = [...scrapbooks];
    updatedScrapbooks[activeScrapbookIdx] = {
      ...scrapbook,
      stickers: [...scrapbook.stickers, mockSticker]
    };
    setScrapbooks(updatedScrapbooks);

    // Play tactile stamp sound!
    playSynthesizedTone([440, 554, 659], 0.15);
    speak(`Stamped ${selectedSticker} sticker onto the scrapbook collage!`);

    await addScrapbookSticker(scrapbook.id, {
      type: selectedSticker,
      x,
      y,
      scale: 1.0,
      placedBy: currentUserRole
    });

    loadData(true);
  };

  // Action: Create fresh Scrapbook
  const handleCreateNewScrapbook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScrapbookTitle.trim()) return;
    const fallbackUrl = newScrapbookUrl.trim() || 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=600&q=80';
    
    setNewScrapbookTitle('');
    setNewScrapbookUrl('');
    setIsAddingScrapbook(false);
    speak("Creating a cozy new scrapbook collage!");

    await createScrapbook(newScrapbookTitle.trim(), fallbackUrl);
    loadData();
  };

  // Action: Send Pen Pal Letter
  const handleSendPenPal = async (e: React.FormEvent) => {
    e.preventDefault();
    const chain = penPals[activePenPalIdx];
    if (!chain || !newLetterText.trim()) return;

    const typedText = newLetterText;
    setNewLetterText('');

    // Optimistic Update
    const mockLetter = {
      id: 'mock_' + Date.now(),
      author: currentUserRole,
      text: typedText,
      createdAt: new Date().toISOString()
    };
    const updatedChains = [...penPals];
    updatedChains[activePenPalIdx] = {
      ...chain,
      activeAuthor: currentUserRole === 'Grandma Green' ? 'Arthur Green' : 'Grandma Green',
      letters: [...chain.letters, mockLetter]
    };
    setPenPals(updatedChains);

    playSynthesizedTone([523, 659, 784], 0.25);
    speak("Letter folded, stamped, and posted down the family paper line.");

    await addPenPalLetter(chain.id, typedText, currentUserRole);
    loadData(true);
  };

  // Action: Create Pen Pal Chain
  const handleCreateChain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChainPrompt.trim()) return;

    setNewChainPrompt('');
    setIsAddingChain(false);
    speak("Preparing a new cozy Pen Pal chain.");

    await createPenPalChain(newChainPrompt.trim());
    loadData();
  };

  // Action: Pass the Camera Photo Scavenger
  const handleAddCameraPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCameraPhotoUrl.trim()) return;

    const url = newCameraPhotoUrl;
    const caption = newCameraPhotoCaption || 'Spotted some daily colors!';
    setNewCameraPhotoUrl('');
    setNewCameraPhotoCaption('');

    speak(`Added ${activeColorChallenge} photo to the scavenger hunt list.`);
    playSynthesizedTone([587, 739, 880], 0.3);

    await addCameraPhoto(url, caption, activeColorChallenge, currentUserRole);
    loadData();
  };

  // Action: Cookbook Step Contribution
  const handleAddCookbookStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCookbookUrl.trim() || !newCookbookInstruction.trim()) return;

    const url = newCookbookUrl;
    const inst = newCookbookInstruction;
    setNewCookbookUrl('');
    setNewCookbookInstruction('');

    speak("Stitched your baking photo into the community cookbook.");
    playSynthesizedTone([349, 440, 523], 0.4);

    await addCookbookStep(url, inst, currentUserRole);
    loadData();
  };

  // Action: Weaving Photo Contribution
  const handleAddWeavingPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeaveUrl.trim() || !newWeaveScenery.trim()) return;

    const url = newWeaveUrl;
    const scenery = newWeaveScenery;
    const theme = newWeaveColor;
    setNewWeaveUrl('');
    setNewWeaveScenery('');

    speak(`Weaving your scenic photo into the collective landscape.`);
    playSynthesizedTone([293, 370, 440], 0.3);

    await addWeavingPhoto(url, theme, scenery, currentUserRole);
    loadData();
  };

  // Action: Claim Challenge Badge
  const handleClaimBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBadge || !badgeProofText.trim()) return;

    const proofText = badgeProofText;
    const proofPhoto = badgeProofPhoto || undefined;

    setBadgeProofText('');
    setBadgeProofPhoto('');
    setSelectedBadge(null);

    speak(`Hooray! Badge "${selectedBadge.title}" claimed and unlocked for the entire family!`);
    playSynthesizedTone([523, 659, 784, 1046], 0.6); // Glorious arpeggio

    await unlockBadge(selectedBadge.id, currentUserRole, proofText, proofPhoto);
    loadData();
  };

  // Action: Choir Add Singalong Node
  const handleAddSingalongClip = async () => {
    const notesPreset = currentUserRole === 'Grandma Green' 
      ? [261.63, 329.63, 392.00] // C4 Major
      : currentUserRole === 'Arthur Green'
      ? [392.00, 440.00, 523.25] // High harmonious blend
      : currentUserRole === 'Lily Green'
      ? [329.63, 392.00, 493.88] // Em middle
      : [196.00, 246.94, 293.66]; // G3 warm bass for Uncle Bob

    speak(`Submitted ${currentUserRole}'s warm harmonized vocal track to the family singing card.`);
    playSynthesizedTone(notesPreset, 1.2);

    await addVoiceClip(currentUserRole, notesPreset);
    loadData();
  };

  // Action: Harmonize & Play Singalong Choir
  const handleHarmonizeChoir = () => {
    if (choirStatus === 'playing') {
      setChoirStatus('idle');
      choirPlayingRef.current = false;
      return;
    }

    setChoirStatus('playing');
    choirPlayingRef.current = true;
    speak("Gathering the family choir... Blending harmonies now!");

    // Synthesize harmonized chords sequentially with family vocal parts!
    let delay = 0;
    voiceClips.forEach((clip, index) => {
      // Skip if muted in UI
      if (customVocalMutes[clip.member]) return;

      setTimeout(() => {
        if (!choirPlayingRef.current) return; // if stopped early
        playSynthesizedTone(clip.synthNotes, 2.0);
      }, delay);
      delay += 800; // stagger choir entry for beautiful lush soundscape
    });

    setTimeout(() => {
      if (choirPlayingRef.current) {
        setChoirStatus('idle');
        choirPlayingRef.current = false;
      }
    }, delay + 2500);
  };

  // Action: Collaborate Frame Drawing Paint Stroke
  const handleAddPaintStroke = async (side: 'left' | 'right' | 'top' | 'bottom') => {
    const project = frameProjects[activeFrameIdx];
    if (!project) return;

    const newStroke: FrameStroke = {
      color: selectedPaintColor,
      side,
      points: [
        { x: Math.floor(Math.random() * 100), y: Math.floor(Math.random() * 100) }
      ],
      drawnBy: currentUserRole
    };

    speak(`Painted the ${side} border frame in warm colors!`);
    playSynthesizedTone([440, 587, 659], 0.2);

    // Optimistic Update
    const updatedProjects = [...frameProjects];
    updatedProjects[activeFrameIdx] = {
      ...project,
      strokes: [...(project.strokes || []), newStroke]
    };
    setFrameProjects(updatedProjects);

    await addFrameStroke(project.id, newStroke);
    loadData(true);
  };

  // Action: Join Picnic Seat
  const handleJoinPicnicSeat = async (seatIdx: number) => {
    if (!picnicTable) return;

    const updatedSeats = { ...picnicTable.activeSeats };
    // Occupy seat
    updatedSeats[String(seatIdx)] = currentUserRole;

    speak(`You pulled up a wooden chair and sat at Seat ${seatIdx + 1} as ${currentUserRole}.`);
    playSynthesizedTone([330, 392, 523], 0.3);

    setPicnicTable({
      ...picnicTable,
      activeSeats: updatedSeats
    });

    await updatePicnicTable(picnicTable.currentPhotoUrl, updatedSeats, picnicTable.backgroundSound);
    loadData(true);
  };

  // Action: Leave Picnic Seat
  const handleLeavePicnicSeat = async (seatIdx: number) => {
    if (!picnicTable) return;

    const updatedSeats = { ...picnicTable.activeSeats };
    delete updatedSeats[String(seatIdx)];

    speak("Stepped away from the virtual picnic blanket.");
    playSynthesizedTone([220, 196, 147], 0.3);

    setPicnicTable({
      ...picnicTable,
      activeSeats: updatedSeats
    });

    await updatePicnicTable(picnicTable.currentPhotoUrl, updatedSeats, picnicTable.backgroundSound);
    loadData(true);
  };

  // Action: Sync Photo on Picnic Table Slider
  const handlePicnicPhotoChange = async (url: string) => {
    if (!picnicTable) return;

    speak("Synchronized the slideshow photo for all connected picnic guests.");
    playSynthesizedTone([392, 523, 659], 0.25);

    setPicnicTable({
      ...picnicTable,
      currentPhotoUrl: url
    });

    await updatePicnicTable(url, picnicTable.activeSeats, picnicTable.backgroundSound);
    loadData(true);
  };

  // Action: Update Picnic Ambient backdrop noise
  const handlePicnicSoundChange = async (sound: string) => {
    if (!picnicTable) return;

    speak(`Toggled low-noise backdrop to ${sound}.`);
    playSynthesizedTone([440, 554, 659], 0.15);

    setPicnicTable({
      ...picnicTable,
      backgroundSound: sound
    });

    await updatePicnicTable(picnicTable.currentPhotoUrl, picnicTable.activeSeats, sound);
    loadData(true);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 min-h-screen pb-12">
      {/* 1. COLLAB SIMULATOR SELECTOR & INSTRUCTION COLUMN */}
      <div className="xl:col-span-1 flex flex-col gap-6">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4 shadow-lg">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest">🎭 Family Co-Author role</h4>
            {syncing && (
              <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-1 animate-pulse">
                ● Live Synced
              </span>
            )}
          </div>
          
          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
            To experience real-time multi-user collaboration inside AI Studio, toggle your role below to simulate actions as Grandma, grandson Arthur, or other family circles.
          </p>

          <div className="flex flex-col gap-2">
            {[
              { role: 'Grandma Green', desc: 'Family Elder 👵', color: 'border-amber-500 text-amber-400' },
              { role: 'Arthur Green', desc: 'Grandson 👦 (Age 10)', color: 'border-sky-500 text-sky-400' },
              { role: 'Lily Green', desc: 'Daughter 👩 (Caregiver)', color: 'border-emerald-500 text-emerald-400' },
              { role: 'Uncle Bob', desc: 'Nostalgic Brother 👨', color: 'border-rose-500 text-rose-400' }
            ].map((roleObj) => (
              <button
                key={roleObj.role}
                onClick={() => {
                  setCurrentUserRole(roleObj.role as any);
                  speak(`Simulating co-author workspace as ${roleObj.role}.`);
                  playSynthesizedTone([330, 392], 0.15);
                }}
                className={`p-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex justify-between items-center ${
                  currentUserRole === roleObj.role
                    ? `${roleObj.color} bg-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.1)] font-bold`
                    : 'bg-stone-950/40 border-slate-850 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{roleObj.role}</span>
                <span className="text-[10px] font-mono opacity-80">{roleObj.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Feature Navigation Links */}
        <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-2xl flex flex-col gap-1 shadow-lg">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 py-1 font-mono">Batch 10 Portals</span>
          {PLAY_FEATURES.map((feat) => (
            <button
              key={feat.id}
              onClick={() => handleFeatureChange(feat.id, feat.label)}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                activeFeature === feat.id
                  ? 'bg-amber-600 text-stone-950 font-bold shadow-md'
                  : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              <span className="font-semibold">{feat.label}</span>
              <span className={`text-[9px] ${activeFeature === feat.id ? 'text-stone-900/80' : 'text-slate-500'}`}>{feat.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. DYNAMIC COLLABORATION WORKSPACE CANVAS */}
      <div className="xl:col-span-3 flex flex-col gap-6">
        {loading ? (
          <div className="bg-slate-900 border border-slate-800 p-12 rounded-3xl flex flex-col items-center justify-center gap-4 text-center min-h-[400px]">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
            <span className="text-xs text-slate-400 font-mono uppercase tracking-widest">Opening Family Playroom...</span>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col gap-6 min-h-[500px]">
            
            {/* FEATURE A: SCRAPBOOK STICKER COLLABS */}
            {activeFeature === 'scrapbook' && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="flex flex-col">
                    <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">🎨 Real-Time Scrapbook Collabs</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Click anywhere on the photo to stamp decorative stickers in real time with grandkids!</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => {
                        setIsAddingScrapbook(!isAddingScrapbook);
                        speak("Toggled scrapbook album form.");
                      }}
                      variant="outline"
                      size="sm"
                      className="text-xs font-mono font-semibold"
                    >
                      {isAddingScrapbook ? 'Close Creator' : '➕ New Album'}
                    </Button>
                  </div>
                </div>

                {isAddingScrapbook && (
                  <form onSubmit={handleCreateNewScrapbook} className="bg-stone-950 border border-slate-800 p-4 rounded-xl flex flex-col gap-3">
                    <span className="text-xs font-bold text-amber-400">Launch New Scrapbook Canvas</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input
                        type="text"
                        required
                        placeholder="Album Title (e.g., Summer Fishing Trip 🎣)"
                        value={newScrapbookTitle}
                        onChange={(e) => setNewScrapbookTitle(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-100 outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Photo URL (Optional)"
                        value={newScrapbookUrl}
                        onChange={(e) => setNewScrapbookUrl(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-100 outline-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="submit"
                        className="bg-amber-600 text-stone-950 font-bold text-xs uppercase px-4 py-2 rounded hover:bg-amber-500 cursor-pointer"
                      >
                        Create Canvas
                      </button>
                    </div>
                  </form>
                )}

                {scrapbooks.length === 0 ? (
                  <div className="p-8 text-center bg-stone-950/40 rounded-2xl border border-slate-850 text-xs text-slate-500 italic">
                    No scrapbook boards created yet. Click New Album above to start!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* List of scrapbooks */}
                    <div className="lg:col-span-1 flex flex-col gap-2 border-r border-slate-800/80 pr-4">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Select Album</span>
                      {scrapbooks.map((sb, idx) => (
                        <button
                          key={sb.id}
                          onClick={() => {
                            setActiveScrapbookIdx(idx);
                            speak(`Switched scrapbook canvas to ${sb.title}.`);
                          }}
                          className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                            activeScrapbookIdx === idx
                              ? 'bg-amber-950/40 border-amber-500 text-amber-400'
                              : 'bg-stone-950/20 border-slate-850 text-slate-400 hover:bg-stone-950'
                          }`}
                        >
                          {sb.title}
                        </button>
                      ))}
                    </div>

                    {/* Active Sandbox Canvas */}
                    <div className="lg:col-span-3 flex flex-col gap-4">
                      <div className="flex items-center justify-between bg-stone-950/40 p-3 rounded-xl border border-slate-850">
                        <span className="text-xs font-bold text-slate-200">Active Board: {scrapbooks[activeScrapbookIdx]?.title}</span>
                        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
                          <span className="text-[10px] font-mono text-slate-400 font-bold">Active Stamp:</span>
                          <div className="flex gap-1">
                            {[
                              { emoji: '💖', val: 'heart' },
                              { emoji: '⭐', val: 'star' },
                              { emoji: '🌸', val: 'flower' },
                              { emoji: '😊', val: 'smile' },
                              { emoji: '🔑', val: 'key' },
                              { emoji: '🏷️', val: 'seal' }
                            ].map((st) => (
                              <button
                                key={st.val}
                                onClick={() => {
                                  setSelectedSticker(st.val);
                                  speak(`Sticker tool set to ${st.val}.`);
                                  playSynthesizedTone([554], 0.1);
                                }}
                                className={`w-8 h-8 rounded flex items-center justify-center text-sm cursor-pointer border ${
                                  selectedSticker === st.val
                                    ? 'bg-amber-600 border-amber-500 text-stone-950 text-base scale-110'
                                    : 'bg-stone-950 hover:bg-slate-900 border-slate-800'
                                }`}
                                title={st.val}
                              >
                                {st.emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Interactive Stamping Stage */}
                      <div 
                        onClick={handlePlaceSticker}
                        className="relative w-full h-96 bg-stone-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner cursor-crosshair group"
                      >
                        <img 
                          src={scrapbooks[activeScrapbookIdx]?.photoUrl} 
                          alt="Collage backdrop" 
                          className="w-full h-full object-cover opacity-75 select-none pointer-events-none"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/40 to-transparent pointer-events-none" />

                        {/* Stamped Stickers Render */}
                        {(scrapbooks[activeScrapbookIdx]?.stickers || []).map((stk) => {
                          const emojiMap: Record<string, string> = {
                            heart: '💖', star: '⭐', flower: '🌸', smile: '😊', key: '🔑', seal: '🏷'
                          };
                          return (
                            <div
                              key={stk.id}
                              style={{ left: `${stk.x}%`, top: `${stk.y}%` }}
                              className="absolute -translate-x-1/2 -translate-y-1/2 select-none group/stk cursor-pointer transition-transform hover:scale-125 duration-100 z-10"
                              title={`Placed by ${stk.placedBy}`}
                              onClick={(e) => {
                                e.stopPropagation(); // prevent adding sticker on top
                                speak(`Sticker ${stk.type} stamped by ${stk.placedBy}.`);
                              }}
                            >
                              <span className="text-4xl filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] animate-bounce-slow">
                                {emojiMap[stk.type] || '✨'}
                              </span>
                              <span className="absolute left-1/2 -translate-x-1/2 -bottom-5 scale-0 group-hover/stk:scale-100 bg-stone-950 text-slate-300 text-[8px] font-mono whitespace-nowrap px-1.5 py-0.5 rounded border border-slate-800 transition-all">
                                {stk.placedBy}
                              </span>
                            </div>
                          );
                        })}

                        {/* Interactive crosshair hover instruction */}
                        <div className="absolute bottom-4 left-4 right-4 text-center pointer-events-none">
                          <span className="text-[10px] uppercase font-mono tracking-wider bg-stone-950/80 text-amber-500 border border-amber-950 px-3 py-1.5 rounded-full select-none shadow">
                            🎯 Tap anywhere to place sticker &quot;{selectedSticker}&quot;
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* FEATURE B: NOSTALGIC PEN PAL CHAINS */}
            {activeFeature === 'penpal' && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex flex-col">
                    <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">✉️ Nostalgic Pen Pal Chains</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Alternating weekly handwritten prompts to connect grandparents & grandkids!</p>
                  </div>
                  <Button
                    onClick={() => {
                      setIsAddingChain(!isAddingChain);
                      speak("Toggled pen pal chain form.");
                    }}
                    variant="outline"
                    size="sm"
                    className="text-xs font-mono font-semibold"
                  >
                    {isAddingChain ? 'Close Chain Form' : '➕ New Pen Pal Prompt'}
                  </Button>
                </div>

                {isAddingChain && (
                  <form onSubmit={handleCreateChain} className="bg-stone-950 border border-slate-800 p-4 rounded-xl flex flex-col gap-3">
                    <span className="text-xs font-bold text-amber-400">Launch New Pen Pal Mailbox</span>
                    <input
                      type="text"
                      required
                      placeholder="Prompt Question (e.g., What was your favorite holiday food recipe? 🥧)"
                      value={newChainPrompt}
                      onChange={(e) => setNewChainPrompt(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-slate-100 outline-none w-full"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="bg-amber-600 text-stone-950 font-bold text-xs uppercase px-4 py-2 rounded hover:bg-amber-500 cursor-pointer"
                      >
                        Create Mailbox Prompt
                      </button>
                    </div>
                  </form>
                )}

                {penPals.length === 0 ? (
                  <div className="p-8 text-center bg-stone-950/40 rounded-2xl border border-slate-850 text-xs text-slate-500 italic">
                    No active pen pal mailboxes. Create one to begin alternating prompts!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* List of chains */}
                    <div className="lg:col-span-1 flex flex-col gap-2 border-r border-slate-800/80 pr-4 font-sans">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Mailboxes</span>
                      {penPals.map((pp, idx) => (
                        <button
                          key={pp.id}
                          onClick={() => {
                            setActivePenPalIdx(idx);
                            speak(`Opened pen pal chain question: ${pp.question}`);
                          }}
                          className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer flex flex-col gap-1 ${
                            activePenPalIdx === idx
                              ? 'bg-amber-950/40 border-amber-500 text-amber-400'
                              : 'bg-stone-950/20 border-slate-850 text-slate-400 hover:bg-stone-950'
                          }`}
                        >
                          <span className="line-clamp-2 font-medium">{pp.question}</span>
                          <span className="text-[9px] text-slate-500 font-mono">({pp.letters.length} responses)</span>
                        </button>
                      ))}
                    </div>

                    {/* Active Mailbox Envelope */}
                    <div className="lg:col-span-3 flex flex-col gap-4">
                      <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-5 flex flex-col gap-3 font-serif">
                        <span className="text-[11px] font-mono uppercase tracking-widest text-amber-500 font-bold">✉️ Alternating Family Prompt</span>
                        <h4 className="text-sm sm:text-base font-bold text-stone-100 leading-relaxed italic">&quot;{penPals[activePenPalIdx]?.question}&quot;</h4>
                        
                        <div className="flex items-center gap-2 border-t border-slate-800/80 pt-3 mt-1 text-xs">
                          <span className="text-slate-400">Current Turn:</span>
                          <span className={`font-mono px-2 py-0.5 rounded text-[10px] font-bold ${
                            penPals[activePenPalIdx]?.activeAuthor === currentUserRole
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-900 animate-pulse'
                              : 'bg-stone-950 text-slate-500 border border-slate-850'
                          }`}>
                            {penPals[activePenPalIdx]?.activeAuthor === currentUserRole ? '🌟 Your Turn!' : `${penPals[activePenPalIdx]?.activeAuthor}'s Turn`}
                          </span>
                        </div>
                      </div>

                      {/* Pen Pal Letter Stack */}
                      <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2">
                        {penPals[activePenPalIdx]?.letters.length === 0 ? (
                          <div className="p-8 text-center bg-stone-950/20 rounded-xl text-xs text-slate-500 italic">
                            No letter notes written yet. Be the first to start the chain!
                          </div>
                        ) : (
                          (penPals[activePenPalIdx]?.letters || []).map((letter) => (
                            <div 
                              key={letter.id}
                              className={`p-4 rounded-2xl border relative font-sans leading-relaxed flex flex-col gap-2 ${
                                letter.author === 'Grandma Green'
                                  ? 'bg-slate-900/60 border-slate-800 self-start w-11/12'
                                  : 'bg-stone-950 border-slate-850 self-end w-11/12 text-slate-200'
                              }`}
                            >
                              <div className="flex items-center justify-between border-b border-slate-850 pb-1.5 text-xs">
                                <span className="font-bold flex items-center gap-1">
                                  {letter.author === 'Grandma Green' ? '👵' : '👦'} {letter.author}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500">
                                  <FormattedDate date={letter.createdAt} />
                                </span>
                              </div>
                              <p className="text-xs sm:text-sm font-serif italic text-slate-300 whitespace-pre-wrap leading-relaxed">
                                &quot;{letter.text}&quot;
                              </p>

                              {/* Cute Vintage Postage Stamp decoration! */}
                              <div className="absolute right-4 bottom-4 w-7 h-7 bg-amber-600/10 border-2 border-dashed border-amber-600/40 rounded flex items-center justify-center opacity-60">
                                <span className="text-[10px]">📬</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Letter submission form */}
                      <form onSubmit={handleSendPenPal} className="bg-stone-950 border border-slate-850 p-4 rounded-xl flex flex-col gap-3">
                        <textarea
                          required
                          rows={3}
                          placeholder={`Write a sweet handwritten response as ${currentUserRole}...`}
                          value={newLetterText}
                          onChange={(e) => setNewLetterText(e.target.value)}
                          className="bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-100 outline-none font-serif leading-relaxed resize-none"
                        />
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono text-slate-500">Writing as: {currentUserRole}</span>
                          <Button 
                            type="submit" 
                            className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs flex items-center gap-1"
                          >
                            <Send className="w-3.5 h-3.5" /> Post Letter
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* FEATURE C: PASS-THE-CAMERA GAME */}
            {activeFeature === 'camera' && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="flex flex-col">
                    <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">📸 Pass-the-Camera Daily Color Scavenger</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Take turns uploading one photo representing today&apos;s chosen target color!</p>
                  </div>
                  
                  {/* Select Color Challenge */}
                  <div className="flex items-center gap-1 bg-stone-950/60 border border-slate-850 p-1 rounded-xl">
                    {[
                      { name: 'yellow', label: '🟡 Yellow', bg: 'hover:bg-amber-500/10' },
                      { name: 'red', label: '🔴 Red', bg: 'hover:bg-rose-500/10' },
                      { name: 'blue', label: '🔵 Blue', bg: 'hover:bg-sky-500/10' },
                      { name: 'green', label: '🟢 Green', bg: 'hover:bg-emerald-500/10' }
                    ].map((col) => (
                      <button
                        key={col.name}
                        onClick={() => {
                          setActiveColorChallenge(col.name);
                          speak(`Target color swapped to ${col.name}.`);
                          playSynthesizedTone([440, 554], 0.15);
                        }}
                        className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                          activeColorChallenge === col.name
                            ? 'bg-slate-900 border border-slate-700 text-slate-100'
                            : `text-slate-400 ${col.bg}`
                        }`}
                      >
                        {col.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Form to submit daily scavenger photos */}
                  <div className="bg-stone-950/40 border border-slate-850 p-5 rounded-2xl flex flex-col gap-4">
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-widest font-mono">🌟 Submit Scavenger Hunt</span>
                    
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      Spotted something matching <span className="font-bold text-slate-200 capitalize">{activeColorChallenge}</span> around the house or garden? Paste or tap a sample photo!
                    </p>

                    {/* Pre-made sample photo presets so users don't have to look for image links! */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[9px] font-mono text-slate-500 uppercase">Sample Presets:</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { url: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400&q=80', label: '🌼 Yellow Marigolds', color: 'yellow' },
                          { url: 'https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?w=400&q=80', label: '🔑 Gold Compass', color: 'yellow' },
                          { url: 'https://images.unsplash.com/photo-1543157145-f78c636d023d?w=400&q=80', label: '🍎 Red Apple Pie', color: 'red' },
                          { url: 'https://images.unsplash.com/photo-1552422535-c45813c61732?w=400&q=80', label: '🎵 Blue Maritime Accordion', color: 'blue' }
                        ].map((preset, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => {
                              setNewCameraPhotoUrl(preset.url);
                              setNewCameraPhotoCaption(preset.label);
                              setActiveColorChallenge(preset.color);
                              speak(`Selected preset photo: ${preset.label}.`);
                              playSynthesizedTone([554], 0.1);
                            }}
                            className="bg-slate-900 hover:bg-slate-850 border border-slate-800 p-2 rounded text-[10px] text-slate-300 text-left truncate cursor-pointer transition-colors"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <form onSubmit={handleAddCameraPhoto} className="flex flex-col gap-3 mt-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-500 font-mono">Photo Image URL</label>
                        <input
                          type="text"
                          required
                          placeholder="Paste image link here..."
                          value={newCameraPhotoUrl}
                          onChange={(e) => setNewCameraPhotoUrl(e.target.value)}
                          className="bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-100 outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-500 font-mono">Sensory Caption</label>
                        <input
                          type="text"
                          placeholder="e.g. Grandma's bright yellow teacup! ☕"
                          value={newCameraPhotoCaption}
                          onChange={(e) => setNewCameraPhotoCaption(e.target.value)}
                          className="bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-100 outline-none"
                        />
                      </div>

                      <Button type="submit" className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs uppercase w-full">
                        📷 Publish Scavenger Frame
                      </Button>
                    </form>
                  </div>

                  {/* Scavenger Film Strip Gallery */}
                  <div className="lg:col-span-2 flex flex-col gap-3">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Film Strip Gallery</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
                      {cameraPhotos.length === 0 ? (
                        <div className="p-8 text-center bg-stone-950/20 rounded-xl text-xs text-slate-500 italic col-span-2">
                          No scavenger photos submitted yet for today. Be the first to spot the color!
                        </div>
                      ) : (
                        cameraPhotos.map((cam) => {
                          const colorIndicator: Record<string, string> = {
                            red: '🔴', blue: '🔵', yellow: '🟡', green: '🟢'
                          };
                          return (
                            <div 
                              key={cam.id}
                              className="bg-stone-950 border border-slate-850 rounded-2xl overflow-hidden shadow-md hover:border-slate-750 transition-all"
                            >
                              <div className="h-40 w-full relative bg-slate-950">
                                <img src={cam.url} alt={cam.caption} className="w-full h-full object-cover" />
                                <div className="absolute top-2 left-2 bg-stone-950/80 border border-slate-800 text-[9px] px-2 py-0.5 rounded-full text-slate-300 font-mono font-bold flex items-center gap-1 shadow">
                                  <span>{colorIndicator[cam.color] || '🎨'}</span>
                                  <span className="capitalize">{cam.color}</span>
                                </div>
                              </div>
                              <div className="p-3.5 flex flex-col gap-1">
                                <span className="text-xs font-bold text-slate-200">{cam.caption}</span>
                                <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 border-t border-slate-900/60 pt-2 mt-1">
                                  <span>By: {cam.submittedBy}</span>
                                  <span><FormattedDate date={cam.createdAt} showTime={false} /></span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FEATURE D: COMMUNITY COOKBOOK PATCHWORK */}
            {activeFeature === 'cookbook' && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col border-b border-slate-800 pb-4">
                  <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">🥧 Community Cookbook Patchwork</h3>
                  <p className="text-xs text-slate-400 mt-0.5">A collective baking diary where family & friends contribute one step-of-the-way photo to compile a baking book!</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Cookbook Metadata */}
                  <div className="lg:col-span-1 flex flex-col gap-4 bg-stone-950/40 p-4 rounded-2xl border border-slate-850 font-serif">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-amber-500 font-bold">Stitched recipe book</span>
                    <h4 className="text-base font-bold text-slate-100">{cookbook?.title || 'Baking Book Project'}</h4>
                    <p className="text-xs text-slate-400 font-sans leading-relaxed italic">&quot;{cookbook?.description}&quot;</p>
                    
                    {/* Presets to make it easier for seniors */}
                    <div className="flex flex-col gap-1.5 border-t border-slate-800 pt-3 mt-1 font-sans">
                      <span className="text-[9px] font-mono text-slate-500 uppercase">Step Presets:</span>
                      {[
                        { url: 'https://images.unsplash.com/photo-1543157145-f78c636d023d?w=400&q=80', inst: 'Whisk the egg yolks and blueberries thoroughly into a smooth foam.' },
                        { url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80', inst: 'Dust the kitchen table with flour and fold the pie lattice crust.' }
                      ].map((pre, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => {
                            setNewCookbookUrl(pre.url);
                            setNewCookbookInstruction(pre.inst);
                            speak("Selected cooking step preset.");
                            playSynthesizedTone([440], 0.1);
                          }}
                          className="bg-slate-900 hover:bg-slate-850 border border-slate-800 p-2 rounded text-[10px] text-slate-300 text-left cursor-pointer transition-colors"
                        >
                          Step {pIdx + 2}: {pre.inst.substring(0, 30)}...
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recipe Step Flow list */}
                  <div className="lg:col-span-3 flex flex-col gap-4 font-sans">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-2">
                      {(cookbook?.steps || []).map((step) => (
                        <div 
                          key={step.id} 
                          className="bg-stone-950 border border-slate-850 p-4 rounded-2xl flex gap-3 hover:border-slate-700 transition-all"
                        >
                          <div className="w-20 h-20 relative rounded-xl overflow-hidden bg-slate-950 shrink-0">
                            <img src={step.photoUrl} alt={`Step ${step.stepNumber}`} className="w-full h-full object-cover" />
                            <div className="absolute top-1 left-1 bg-amber-500 text-stone-950 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
                              {step.stepNumber}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-mono font-semibold text-amber-500">Step {step.stepNumber}</span>
                            <p className="text-[11px] text-slate-300 leading-relaxed font-serif italic">&quot;{step.instruction}&quot;</p>
                            <span className="text-[9px] font-mono text-slate-500 mt-1">Stitched by: {step.contributedBy}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Step contributor form */}
                    <form onSubmit={handleAddCookbookStep} className="bg-stone-950/60 border border-slate-850 p-4 rounded-xl flex flex-col gap-3">
                      <span className="text-xs font-semibold text-slate-200">➕ Stitch Next Baking Step</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                          type="text"
                          required
                          placeholder="Step Photo Link..."
                          value={newCookbookUrl}
                          onChange={(e) => setNewCookbookUrl(e.target.value)}
                          className="bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-100 outline-none"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Action instruction (e.g. Sprinkle warm sugar & cinnamon over crust)..."
                          value={newCookbookInstruction}
                          onChange={(e) => setNewCookbookInstruction(e.target.value)}
                          className="bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-100 outline-none"
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit" className="bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold uppercase">
                          Stitch Baking Step 🥧
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* FEATURE E: THE VIRTUAL PICNIC TABLE */}
            {activeFeature === 'picnic' && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="flex flex-col">
                    <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">🧺 The Virtual Picnic Table</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Sit together at our private family blanket to watch photos while talking on a gentle, low-noise audio line!</p>
                  </div>

                  {/* Ambient Backdrop Audio Controller */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-500">Backdrop Line:</span>
                    <select
                      value={picnicTable?.backgroundSound || 'fire'}
                      onChange={(e) => handlePicnicSoundChange(e.target.value)}
                      className="bg-stone-950 border border-slate-800 text-[10px] text-amber-500 p-1.5 rounded outline-none font-mono"
                    >
                      <option value="none">🔇 Silent Room</option>
                      <option value="fire">🔥 Crackling Wood</option>
                      <option value="birds">🐦 Morning Meadow Sparrows</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 font-sans">
                  {/* Picnic Table Seats */}
                  <div className="lg:col-span-1 flex flex-col gap-4">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Table Blanket (Seats 1-4)</span>
                    
                    <div className="flex flex-col gap-2.5">
                      {[0, 1, 2, 3].map((seatIdx) => {
                        const occupant = picnicTable?.activeSeats[String(seatIdx)];
                        return (
                          <div 
                            key={seatIdx}
                            className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                              occupant
                                ? occupant === currentUserRole
                                  ? 'bg-amber-950/30 border-amber-500 text-amber-400 shadow'
                                  : 'bg-stone-950 border-slate-850 text-slate-300'
                                : 'bg-stone-950/10 border-dashed border-slate-800 text-slate-500'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-base">{occupant ? '👵' : '🪑'}</span>
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold">{occupant || 'Vacant Table Seat'}</span>
                                <span className="text-[9px] font-mono opacity-80">Seat {seatIdx + 1}</span>
                              </div>
                            </div>

                            {occupant ? (
                              occupant === currentUserRole ? (
                                <button
                                  onClick={() => handleLeavePicnicSeat(seatIdx)}
                                  className="text-[9px] uppercase font-mono font-bold px-2 py-0.5 bg-rose-950 text-rose-400 border border-rose-900 rounded cursor-pointer"
                                >
                                  Leave
                                </button>
                              ) : null
                            ) : (
                              <button
                                onClick={() => handleJoinPicnicSeat(seatIdx)}
                                className="text-[9px] uppercase font-mono font-bold px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-900 rounded cursor-pointer hover:bg-emerald-900"
                              >
                                Sit Down
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Shared Slideshow Viewer & Audio Line */}
                  <div className="lg:col-span-3 flex flex-col gap-4">
                    <div className="relative h-80 w-full bg-stone-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                      {picnicTable?.currentPhotoUrl ? (
                        <img 
                          src={picnicTable.currentPhotoUrl} 
                          alt="Shared Slideshow" 
                          className="w-full h-full object-cover opacity-80"
                        />
                      ) : (
                        <span className="text-xs text-slate-500">No active photo in table viewer</span>
                      )}

                      {/* Photo Sync Controller overlay */}
                      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center bg-stone-950/80 border border-slate-800 p-2 rounded-xl backdrop-blur-sm">
                        <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">🔴 Live Photo Sync</span>
                        <div className="flex gap-2">
                          {[
                            'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=600&q=80',
                            'https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?w=600&q=80',
                            'https://images.unsplash.com/photo-1552422535-c45813c61732?w=600&q=80'
                          ].map((url, uIdx) => (
                            <button
                              key={uIdx}
                              onClick={() => handlePicnicPhotoChange(url)}
                              className={`w-8 h-8 rounded border overflow-hidden cursor-pointer transition-transform hover:scale-105 ${
                                picnicTable?.currentPhotoUrl === url
                                  ? 'border-amber-500 scale-110'
                                  : 'border-slate-800 opacity-60'
                              }`}
                            >
                              <img src={url} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Cozy low-noise gentle audio controller */}
                    <div className="bg-stone-950 border border-slate-850 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-500">
                          <Volume2 className={`w-5 h-5 ${isAudioLineActive ? 'animate-pulse' : ''}`} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-200">Cozy Voice Communication Line</span>
                          <span className="text-[10px] text-slate-400 mt-0.5">Filter out sharp noises, overlay gentle sparrows or crackles</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const nextState = !isAudioLineActive;
                          setIsAudioLineActive(nextState);
                          speak(nextState ? "Gentle audio voice line connected." : "Gentle audio voice line disconnected.");
                          toggleFireplaceNoise(nextState, 'cozy');
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border cursor-pointer transition-all ${
                          isAudioLineActive
                            ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                            : 'bg-slate-900 text-slate-300 border-slate-800'
                        }`}
                      >
                        {isAudioLineActive ? '🔊 Line connected (ON)' : '🔇 Click to Join Line'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FEATURE F: SCENIC COLOR WEAVING */}
            {activeFeature === 'weaving' && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="flex flex-col">
                    <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">🌈 Scenic Color Weaving</h3>
                    <p className="text-xs text-slate-400 mt-0.5">A collaborative collage stream where photos from different users flow together based on color tones!</p>
                  </div>

                  {/* Filter controls */}
                  <div className="flex gap-1.5 bg-stone-950/60 p-1 rounded-xl border border-slate-850">
                    {['all', 'green', 'blue', 'amber', 'rose'].map((col) => (
                      <button
                        key={col}
                        onClick={() => {
                          setWeavingFilter(col);
                          speak(`Weaving filter set to ${col}.`);
                          playSynthesizedTone([330, 440], 0.15);
                        }}
                        className={`px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase rounded-lg cursor-pointer transition-colors ${
                          weavingFilter === col
                            ? 'bg-slate-900 border border-slate-700 text-slate-100 font-bold'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {col === 'all' ? '🌈 All Scenery' : col}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Photo submission panel */}
                  <div className="lg:col-span-1 bg-stone-950/40 p-4 rounded-2xl border border-slate-850 flex flex-col gap-3 font-sans">
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-widest font-mono">🌟 Weave a Scenery</span>
                    
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Upload scenic snapshots and select their dominant color tone so they automatically flow together into the family ombre timeline.
                    </p>

                    <form onSubmit={handleAddWeavingPhoto} className="flex flex-col gap-3 mt-1">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-500 font-mono">Photo URL</label>
                        <input
                          type="text"
                          required
                          placeholder="Paste scenery image..."
                          value={newWeaveUrl}
                          onChange={(e) => setNewWeaveUrl(e.target.value)}
                          className="bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-100 outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-500 font-mono">Scenery Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Lavender Meadows"
                          value={newWeaveScenery}
                          onChange={(e) => setNewWeaveScenery(e.target.value)}
                          className="bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-100 outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-500 font-mono">Color Theme</label>
                        <select
                          value={newWeaveColor}
                          onChange={(e) => setNewWeaveColor(e.target.value as any)}
                          className="bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-100 outline-none font-mono text-amber-500"
                        >
                          <option value="green">🟢 Forest Scenery (Green)</option>
                          <option value="blue">🔵 Sky & Oceans (Blue)</option>
                          <option value="amber">🟡 Sunset Gardens (Amber)</option>
                          <option value="rose">🔴 Floral Mantle (Rose)</option>
                        </select>
                      </div>

                      <Button type="submit" className="bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold uppercase w-full">
                        Weave Photo
                      </Button>
                    </form>
                  </div>

                  {/* Flow Tapestry */}
                  <div className="lg:col-span-3 flex flex-col gap-3">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Woven Ombre Landscape Stream</span>

                    <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-2">
                      {weavingPhotos
                        .filter((p) => weavingFilter === 'all' || p.colorTheme === weavingFilter)
                        .map((weave) => {
                          const themeStyles: Record<string, string> = {
                            green: 'bg-emerald-950/20 border-emerald-900 text-emerald-400',
                            blue: 'bg-sky-950/20 border-sky-900 text-sky-400',
                            amber: 'bg-amber-950/20 border-amber-900 text-amber-400',
                            rose: 'bg-rose-950/20 border-rose-900 text-rose-400',
                            slate: 'bg-slate-900 border-slate-800 text-slate-300'
                          };
                          return (
                            <div 
                              key={weave.id}
                              className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center gap-4 transition-all hover:border-slate-600 ${
                                themeStyles[weave.colorTheme] || themeStyles.slate
                              }`}
                            >
                              <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-slate-950 border border-slate-800/60 shadow">
                                <img src={weave.url} alt={weave.scenery} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex flex-col gap-1 w-full text-center sm:text-left">
                                <span className="text-xs font-bold uppercase tracking-widest font-mono">🎨 {weave.colorTheme} landscape tapestry</span>
                                <h4 className="text-sm font-bold text-slate-200">{weave.scenery}</h4>
                                <div className="flex items-center justify-between text-[10px] font-mono opacity-80 border-t border-slate-900/60 pt-2 mt-2">
                                  <span>Weaver: {weave.uploadedBy}</span>
                                  <span><FormattedDate date={weave.createdAt} showTime={false} /></span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FEATURE G: FAMILY CHALLENGE BADGES */}
            {activeFeature === 'badges' && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col border-b border-slate-800 pb-4">
                  <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">🏆 Family Challenge Badges</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Participate in delightful weekly family micro-quests to earn sparkling digital badges for the mantel cabinet!</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Badge Cabinet */}
                  <div className="lg:col-span-3 flex flex-col gap-4 font-sans">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Cabinet Shelf Showcase</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {badges.map((bdg) => (
                        <div 
                          key={bdg.id}
                          className={`p-5 rounded-2xl border flex items-center gap-4 transition-all ${
                            bdg.isUnlocked
                              ? 'bg-amber-950/20 border-amber-500/50 shadow-[0_4px_20px_rgba(245,158,11,0.15)] animate-pulse'
                              : 'bg-stone-950 border-slate-850 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl border shadow-inner shrink-0 ${
                            bdg.isUnlocked ? 'bg-amber-500 text-stone-950 border-amber-400' : 'bg-slate-900 text-slate-500 border-slate-800'
                          }`}>
                            {bdg.icon}
                          </div>
                          
                          <div className="flex flex-col gap-1 w-full">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-200">{bdg.title}</span>
                              <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                                bdg.isUnlocked ? 'bg-emerald-950 text-emerald-400 font-bold' : 'bg-stone-950 text-slate-500'
                              }`}>
                                {bdg.isUnlocked ? 'Unlocked' : 'Pending'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">{bdg.description}</p>
                            
                            {bdg.isUnlocked && bdg.unlockedBy && (
                              <div className="text-[8px] font-mono text-amber-500/70 border-t border-slate-900/60 pt-1 mt-1">
                                Unlocked by {bdg.unlockedBy} • &quot;{bdg.proofText}&quot;
                              </div>
                            )}

                            {!bdg.isUnlocked && (
                              <button
                                onClick={() => {
                                  setSelectedBadge(bdg);
                                  speak(`Opened quest claim card for ${bdg.title}.`);
                                  playSynthesizedTone([440, 554], 0.15);
                                }}
                                className="mt-2 text-[10px] font-mono font-bold text-amber-500 uppercase text-left hover:text-amber-400 cursor-pointer"
                              >
                                🎯 Complete Quest & Claim
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Complete/Claim Portal overlay */}
                  <div className="lg:col-span-1 bg-stone-950/40 p-4 rounded-2xl border border-slate-850 flex flex-col gap-4">
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-widest font-mono">🏆 Claim Portal</span>
                    
                    {selectedBadge ? (
                      <form onSubmit={handleClaimBadge} className="flex flex-col gap-3 font-sans">
                        <div className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-2xl">{selectedBadge.icon}</span>
                          <span className="text-xs font-bold text-slate-200">{selectedBadge.title}</span>
                        </div>

                        <div className="flex flex-col gap-1 mt-1">
                          <label className="text-[9px] text-slate-500 font-mono">Scavenger proof text / memory</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Spotted one that looks like a sailboat! ☁️"
                            value={badgeProofText}
                            onChange={(e) => setBadgeProofText(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-100 outline-none"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-500 font-mono">Proof Image URL (Optional)</label>
                          <input
                            type="text"
                            placeholder="Link to camera scavenger photo..."
                            value={badgeProofPhoto}
                            onChange={(e) => setBadgeProofPhoto(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-100 outline-none"
                          />
                        </div>

                        <div className="flex gap-2 border-t border-slate-900/60 pt-3 mt-1">
                          <button
                            type="button"
                            onClick={() => setSelectedBadge(null)}
                            className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-[10px] uppercase font-mono rounded text-slate-400 hover:text-slate-200 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <Button type="submit" className="bg-amber-600 hover:bg-amber-500 text-stone-950 text-[10px] uppercase font-mono flex-1">
                            Claim Badge 🏆
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="p-8 text-center text-[11px] text-slate-500 italic leading-relaxed">
                        No badge selected. Click &quot;Complete Quest&quot; on any pending card to unlock!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* FEATURE H: NOSTALGIC SINGALONG CHOIR */}
            {activeFeature === 'singalong' && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="flex flex-col">
                    <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">🎶 Nostalgic Singalong Cards</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Family members record cozy vocal clips that blend together into a harmonized family choir!</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      onClick={handleHarmonizeChoir}
                      className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs uppercase flex items-center gap-1.5 shadow"
                    >
                      {choirStatus === 'playing' ? <Pause className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      {choirStatus === 'playing' ? 'Playing Harmony Choir...' : '🎶 Gather Choir & Harmonize'}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 font-sans">
                  {/* Choir Members Mixer */}
                  <div className="lg:col-span-3 flex flex-col gap-4">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Vocal Harmonizer Mixer</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {voiceClips.map((clip) => {
                        const isMuted = customVocalMutes[clip.member] || false;
                        return (
                          <div 
                            key={clip.id}
                            className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                              isMuted
                                ? 'bg-stone-950 border-slate-850 opacity-40'
                                : 'bg-slate-900/60 border-slate-800 shadow-[0_4px_12px_rgba(0,0,0,0.1)]'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-950 border border-slate-850 flex items-center justify-center text-lg shadow-inner">
                                {clip.member === 'Grandma Green' ? '👵' : '👦'}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-200">{clip.member}</span>
                                <span className="text-[9px] font-mono text-slate-500">Chord pitch sequence (hz)</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Test voice clip tone */}
                              <button
                                onClick={() => {
                                  speak(`Playing ${clip.member}'s harmony track.`);
                                  playSynthesizedTone(clip.synthNotes, 1.2);
                                }}
                                className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 text-[9px] font-mono font-bold uppercase rounded-lg hover:bg-slate-900 cursor-pointer text-amber-500"
                              >
                                Test Vocal
                              </button>

                              <button
                                onClick={() => {
                                  setCustomVocalMutes({
                                    ...customVocalMutes,
                                    [clip.member]: !isMuted
                                  });
                                  speak(isMuted ? `Unmuted ${clip.member}.` : `Muted ${clip.member}.`);
                                }}
                                className="p-1.5 rounded-lg border border-slate-850 bg-stone-950 text-slate-400 hover:text-slate-200 cursor-pointer"
                                title={isMuted ? 'Unmute' : 'Mute'}
                              >
                                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mic clip submission */}
                  <div className="lg:col-span-1 bg-stone-950/40 p-4 rounded-2xl border border-slate-850 flex flex-col gap-4 text-center">
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-widest font-mono">🎙️ Retro Micro-Line</span>
                    
                    <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-3xl mx-auto shadow shadow-amber-500/10">
                      🎙️
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Hum or sing into the family microphone to register your harmonic chord nodes for {currentUserRole}!
                    </p>

                    <button
                      onClick={handleAddSingalongClip}
                      className="px-4 py-3 bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold uppercase rounded-xl cursor-pointer w-full shadow"
                    >
                      🎤 Record simulated Vocal clip
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* FEATURE I: COLLABORATIVE FRAMES PAINTING */}
            {activeFeature === 'frame' && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col border-b border-slate-800 pb-4">
                  <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">🖼️ Collaborative Hand-Painted Frames</h3>
                  <p className="text-xs text-slate-400 mt-0.5">A drawing game where Grandma and grandchildren paint a decorative border together, each taking care of one side of the photo!</p>
                </div>

                {frameProjects.length === 0 ? (
                  <div className="p-8 text-center bg-stone-950/40 rounded-2xl border border-slate-850 text-xs text-slate-500 italic">
                    No drawing projects loaded yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 font-sans">
                    {/* Controls & Paint palette */}
                    <div className="lg:col-span-1 bg-stone-950/40 p-4 rounded-2xl border border-slate-850 flex flex-col gap-4">
                      <span className="text-xs font-bold text-amber-500 uppercase tracking-widest font-mono">🎨 Paint Controls</span>
                      
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-mono text-slate-500 uppercase">Paint Brush Color:</span>
                        <div className="flex gap-2">
                          {[
                            { hex: '#f59e0b', label: 'Amber' },
                            { hex: '#ef4444', label: 'Ruby' },
                            { hex: '#10b981', label: 'Emerald' },
                            { hex: '#3b82f6', label: 'Sapphire' }
                          ].map((col) => (
                            <button
                              key={col.hex}
                              onClick={() => {
                                setSelectedPaintColor(col.hex);
                                speak(`Selected paint brush color ${col.label}.`);
                                playSynthesizedTone([554], 0.1);
                              }}
                              style={{ backgroundColor: col.hex }}
                              className={`w-8 h-8 rounded-full border cursor-pointer transition-transform hover:scale-110 ${
                                selectedPaintColor === col.hex
                                  ? 'border-slate-100 scale-125 shadow-[0_0_10px_rgba(255,255,255,0.4)]'
                                  : 'border-slate-900'
                              }`}
                              title={col.label}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 border-t border-slate-800/80 pt-3">
                        <span className="text-[10px] font-mono text-slate-500 uppercase">Designated Painting Side:</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { key: 'top', label: 'Top' },
                            { key: 'left', label: 'Left' },
                            { key: 'right', label: 'Right' },
                            { key: 'bottom', label: 'Bottom' }
                          ].map((side) => (
                            <button
                              key={side.key}
                              onClick={() => {
                                setActivePaintSide(side.key as any);
                                speak(`Target frame painting side swapped to ${side.label}.`);
                                playSynthesizedTone([440], 0.15);
                              }}
                              className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                activePaintSide === side.key
                                  ? 'bg-amber-950/40 border-amber-500 text-amber-400'
                                  : 'bg-stone-950 border-slate-850 text-slate-400 hover:bg-stone-900'
                              }`}
                            >
                              {side.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-slate-800/80 pt-3 flex flex-col gap-2">
                        <span className="text-[10px] font-mono text-slate-500 uppercase">Paint Stroke:</span>
                        <Button 
                          onClick={() => handleAddPaintStroke(activePaintSide)}
                          className="bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold uppercase w-full"
                        >
                          🖌️ Apply Paint Stroke
                        </Button>
                      </div>
                    </div>

                    {/* Paint Canvas Display */}
                    <div className="lg:col-span-3 flex flex-col gap-4">
                      <div className="relative w-full h-80 bg-stone-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center p-8">
                        
                        {/* Decorative Hand-Painted Borders overlay */}
                        <div className="absolute inset-0 border-8 pointer-events-none transition-all duration-300 rounded-2xl border-stone-900 flex items-center justify-center" />

                        {/* Top Painted Border */}
                        <div className="absolute top-0 left-0 right-0 h-4 flex gap-1 items-center justify-around overflow-hidden px-4">
                          {(frameProjects[activeFrameIdx]?.strokes || [])
                            .filter(s => s.side === 'top')
                            .map((s, idx) => (
                              <div key={idx} style={{ backgroundColor: s.color }} className="h-2 w-1/4 rounded-full opacity-80 blur-[1px] animate-pulse" />
                            ))}
                        </div>

                        {/* Left Painted Border */}
                        <div className="absolute top-0 bottom-0 left-0 w-4 flex flex-col gap-1 items-center justify-around overflow-hidden py-4">
                          {(frameProjects[activeFrameIdx]?.strokes || [])
                            .filter(s => s.side === 'left')
                            .map((s, idx) => (
                              <div key={idx} style={{ backgroundColor: s.color }} className="w-2 h-1/4 rounded-full opacity-80 blur-[1px] animate-pulse" />
                            ))}
                        </div>

                        {/* Right Painted Border */}
                        <div className="absolute top-0 bottom-0 right-0 w-4 flex flex-col gap-1 items-center justify-around overflow-hidden py-4">
                          {(frameProjects[activeFrameIdx]?.strokes || [])
                            .filter(s => s.side === 'right')
                            .map((s, idx) => (
                              <div key={idx} style={{ backgroundColor: s.color }} className="w-2 h-1/4 rounded-full opacity-80 blur-[1px] animate-pulse" />
                            ))}
                        </div>

                        {/* Bottom Painted Border */}
                        <div className="absolute bottom-0 left-0 right-0 h-4 flex gap-1 items-center justify-around overflow-hidden px-4">
                          {(frameProjects[activeFrameIdx]?.strokes || [])
                            .filter(s => s.side === 'bottom')
                            .map((s, idx) => (
                              <div key={idx} style={{ backgroundColor: s.color }} className="h-2 w-1/4 rounded-full opacity-80 blur-[1px] animate-pulse" />
                            ))}
                        </div>

                        {/* Centered Album Photo */}
                        <div className="w-full h-full relative rounded-xl overflow-hidden border border-slate-850">
                          <img 
                            src={frameProjects[activeFrameIdx]?.photoUrl} 
                            alt="Drawing canvas background" 
                            className="w-full h-full object-cover opacity-80"
                          />
                        </div>

                        {/* Painting Side guide */}
                        <div className="absolute bottom-4 left-4 right-4 text-center pointer-events-none">
                          <span className="text-[10px] uppercase font-mono tracking-wider bg-stone-950/80 text-amber-500 border border-amber-950 px-3 py-1.5 rounded-full shadow">
                            🎨 Painting side designated: &quot;{activePaintSide}&quot; (Role: {currentUserRole})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* FEATURE J: THE HEARTH FIREPLACE SCREENSAVER */}
            {activeFeature === 'fireplace' && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="flex flex-col">
                    <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">🔥 The Hearth Fireplace Screensaver</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Relaxing screensaver room where family pictures float onto a cozy fireplace mantle with real wood-crackling sounds!</p>
                  </div>

                  {/* Audio Cracking toggle */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-mono">Crackling log audio:</span>
                    <button
                      onClick={() => {
                        const next = !isWoodCrackleEnabled;
                        setIsWoodCrackleEnabled(next);
                        speak(next ? "Wood crackle sound loop active." : "Silent fireplace.");
                        toggleFireplaceNoise(next, fireIntensity);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase border cursor-pointer transition-all ${
                        isWoodCrackleEnabled
                          ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                          : 'bg-slate-950 text-slate-400 border-slate-850'
                      }`}
                    >
                      {isWoodCrackleEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 font-sans">
                  {/* Mantel slide controls */}
                  <div className="lg:col-span-1 bg-stone-950/40 p-4 rounded-2xl border border-slate-850 flex flex-col gap-4">
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-widest font-mono font-bold">🔥 Fire Controls</span>
                    
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Fire Intensity:</span>
                      <div className="flex gap-2">
                        {[
                          { key: 'ember', label: '🍂 Smoldering' },
                          { key: 'cozy', label: '🔥 Warm Hearth' },
                          { key: 'blazing', label: '💥 Blazing Fire' }
                        ].map((intensity) => (
                          <button
                            key={intensity.key}
                            onClick={() => {
                              setFireIntensity(intensity.key as any);
                              speak(`Fire intensity set to ${intensity.label}.`);
                              playSynthesizedTone([220, 330], 0.2);
                              if (isWoodCrackleEnabled) {
                                toggleFireplaceNoise(true, intensity.key as any);
                              }
                            }}
                            className={`flex-1 p-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                              fireIntensity === intensity.key
                                ? 'bg-amber-950/40 border-amber-500 text-amber-400'
                                : 'bg-stone-950 border-slate-850 text-slate-400 hover:bg-slate-900'
                            }`}
                          >
                            {intensity.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-slate-800/80 pt-3 flex flex-col gap-2 leading-relaxed text-xs text-slate-400">
                      <span className="font-bold text-slate-300">Sensory Relaxation Tips</span>
                      <p>
                        Let this virtual room play in the background on your iPad or TV. High-contrast embers combined with soft frequency crackling creates a soothing environment for dementia-friendly relaxation.
                      </p>
                    </div>
                  </div>

                  {/* Fireplace Stage */}
                  <div className="lg:col-span-3 flex flex-col gap-4">
                    <div className="relative w-full h-96 bg-stone-950 rounded-3xl border border-amber-950/40 overflow-hidden flex flex-col items-center justify-between p-6 shadow-inner shadow-amber-950/20">
                      
                      {/* Floating Family Photo above the mantle */}
                      <div className="w-11/12 sm:w-80 h-44 bg-stone-950 border-4 border-stone-900 p-2 rounded-lg shadow-lg relative animate-fade-in-out transition-all duration-1000 z-10 shrink-0">
                        {scrapbooks[fireplacePhotoIndex] ? (
                          <>
                            <img 
                              src={scrapbooks[fireplacePhotoIndex].photoUrl} 
                              alt="Floating Keepsake" 
                              className="w-full h-full object-cover rounded"
                            />
                            <div className="absolute bottom-3 left-3 right-3 bg-stone-950/80 p-1 rounded border border-slate-800 text-[9px] text-slate-300 truncate font-serif italic text-center">
                              &quot;{scrapbooks[fireplacePhotoIndex].title}&quot;
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-center w-full h-full bg-slate-900 text-[10px] text-slate-500 italic">
                            Adding scrapbook photographs...
                          </div>
                        )}
                      </div>

                      {/* Fire Hearth animation frame */}
                      <div className="w-full flex flex-col items-center justify-end flex-1 mt-4 relative">
                        {/* Cozy animated firewood */}
                        <div className="flex gap-1.5 text-3xl select-none z-10 mb-1">
                          <span>🪵</span>
                          <span>🪵</span>
                        </div>

                        {/* Dynamic Flame sizes */}
                        <div className="flex gap-1 items-end select-none h-16 relative">
                          <span className={`text-4xl filter drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] ${
                            fireIntensity === 'ember' ? 'scale-75 animate-pulse' : fireIntensity === 'cozy' ? 'scale-100 animate-bounce' : 'scale-150 animate-bounce text-5xl'
                          }`}>
                            🔥
                          </span>
                          <span className={`text-3xl filter drop-shadow-[0_0_15px_rgba(239,68,68,0.5)] delay-100 ${
                            fireIntensity === 'ember' ? 'scale-50 opacity-40 animate-pulse' : fireIntensity === 'cozy' ? 'scale-100 animate-bounce' : 'scale-125 animate-bounce'
                          }`}>
                            🔥
                          </span>
                        </div>

                        {/* Fire mantle overlay */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-950 via-amber-600 to-amber-950 border-t border-amber-600/40 opacity-80 shadow-[0_-15px_40px_rgba(245,158,11,0.2)]" />
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
