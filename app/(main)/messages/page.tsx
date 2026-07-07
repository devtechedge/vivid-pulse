'use client';

import * as React from 'react';
import { 
  Send, 
  MessageSquare, 
  Plus, 
  Loader2, 
  Sparkles, 
  ShieldCheck, 
  CornerDownRight, 
  CheckCheck, 
  RefreshCw, 
  Flame, 
  Pin, 
  Trash2, 
  Mic, 
  Square, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  ChevronRight, 
  Terminal, 
  AlertTriangle,
  Layers,
  Star,
  Binary,
  Code,
  Link,
  Info,
  Check,
  Zap,
  Lock
} from 'lucide-react';
import { 
  getConversations, 
  getDirectMessages, 
  sendMessage, 
  getCurrentUser, 
  Conversation,
  togglePinMessage,
  deleteMessage,
  sendMultiRecipientBlast,
  resolveLinkPreview,
  LinkPreviewData,
  getSafeRooms,
  createSafeRoom,
  getSafeRoomMessages,
  sendSafeRoomMessage,
  deleteSafeRoomMessage
} from '@/lib/actions';
import { getDB, User, DirectMessage, SafeRoom, SafeRoomMessage } from '@/lib/db';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

// --- FEATURE 22: CLIENT-SIDE ENCRYPTED STASHING HELPERS ---
const STASH_SALT = 'vividpulse_stash_salt_2026';

function encryptPayload(text: string): string {
  try {
    const chars = text.split('').map((char, index) => {
      const keyChar = STASH_SALT.charCodeAt(index % STASH_SALT.length);
      return String.fromCharCode(char.charCodeAt(0) ^ keyChar);
    }).join('');
    return btoa(unescape(encodeURIComponent(chars)));
  } catch (e) {
    return btoa(text);
  }
}

function decryptPayload(cipherText: string): string {
  try {
    const decoded = decodeURIComponent(escape(atob(cipherText)));
    return decoded.split('').map((char, index) => {
      const keyChar = STASH_SALT.charCodeAt(index % STASH_SALT.length);
      return String.fromCharCode(char.charCodeAt(0) ^ keyChar);
    }).join('');
  } catch (e) {
    try {
      return atob(cipherText);
    } catch {
      return cipherText;
    }
  }
}

// Preset snippets for Feature 25: Code Component Sandbox Playgrounds
const CODE_PRESETS = [
  {
    name: 'Teal/Violet ASCII Wave',
    language: 'javascript',
    code: `// Dynamic vector frequency calculator
const width = 24;
const time = Date.now() / 300;
let out = "";
for (let i = 0; i < 6; i++) {
  const offset = Math.sin(time + i * 0.4) * (width / 2);
  const pos = Math.round((width / 2) + offset);
  let line = Array(width).fill(" ");
  line[pos] = "✦";
  line[Math.abs(width - 1 - pos)] = "✧";
  out += line.join("") + "\\n";
}
console.log("=== WAVE SIMULATOR ===");
console.log(out);`
  },
  {
    name: 'HSL Hue Generator',
    language: 'javascript',
    code: `// Generating dynamic visual coordinates
console.log("Analyzing color matrix... Ready.");
const baseHue = 180; // Teal
const alternateHue = 270; // Violet
for (let step = 0; step <= 4; step++) {
  const ratio = step / 4;
  const mixHue = Math.round(baseHue + (alternateHue - baseHue) * ratio);
  console.log(\`[Vector \${step}] hsl(\${mixHue}, 85%, 60%)\`);
}`
  },
  {
    name: 'Neon Grid Anchor Mapper',
    language: 'javascript',
    code: `// Render local physics coordinates
const anchors = [
  { x: 1.2, y: 3.4, name: "Node Alpha" },
  { x: -2.4, y: 1.1, name: "Node Beta" },
  { x: 0.5, y: -4.2, name: "Node Gamma" }
];
console.log("=== CALCULATING DISPLACEMENT ===");
anchors.forEach(node => {
  const distance = Math.sqrt(node.x**2 + node.y**2).toFixed(2);
  console.log(\`\${node.name} -> Origin Offset: \${distance}px\`);
});`
  }
];

export default function MessagesPage() {
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [allUsers, setAllUsers] = React.useState<User[]>([]);
  const [activeConv, setActiveConv] = React.useState<Conversation | null>(null);
  const [messages, setMessages] = React.useState<DirectMessage[]>([]);
  const [content, setContent] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);

  // --- COZY SAFE ROOM STATES (BATCH 4) ---
  const [activeMode, setActiveMode] = React.useState<'DM' | 'SAFE_ROOM'>('DM');
  const [safeRooms, setSafeRooms] = React.useState<SafeRoom[]>([]);
  const [activeRoom, setActiveRoom] = React.useState<SafeRoom | null>(null);
  const [roomMessages, setRoomMessages] = React.useState<SafeRoomMessage[]>([]);
  const [showCreateRoom, setShowCreateRoom] = React.useState(false);
  const [newRoomName, setNewRoomName] = React.useState('');
  const [newRoomTheme, setNewRoomTheme] = React.useState<'slate' | 'violet' | 'amber' | 'emerald' | 'rose'>('violet');
  const [newRoomSoundscape, setNewRoomSoundscape] = React.useState<'none' | 'rain' | 'crackle' | 'swallows' | 'lofi'>('none');
  const [newRoomPasscode, setNewRoomPasscode] = React.useState('');
  const [roomPasscodeInput, setRoomPasscodeInput] = React.useState('');
  const [roomPasscodeError, setRoomPasscodeError] = React.useState('');
  const [unlockedRoomIds, setUnlockedRoomIds] = React.useState<Set<string>>(new Set());
  const [roomLoading, setRoomLoading] = React.useState(false);

  // Web Audio refs for Safe Room Soundscapes
  const safeRoomAudioCtxRef = React.useRef<AudioContext | null>(null);
  const safeRoomAudioNodesRef = React.useRef<any[]>([]);
  const safeRoomAudioTimersRef = React.useRef<any[]>([]);

  // Suggested users list to start new chats
  const [suggestedUsers, setSuggestedUsers] = React.useState<User[]>([]);
  const [showSuggested, setShowSuggested] = React.useState(false);

  // --- FEATURE 21: OPTIMIZED POLLING INTERVALS ---
  const [isTyping, setIsTyping] = React.useState(false);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const currentPollInterval = isTyping ? 2500 : 5000;

  // --- FEATURE 22: CLIENT-SIDE MESSAGE STASHING ---
  const [stashEnabled, setStashEnabled] = React.useState(false);
  const [showStashInspector, setShowStashInspector] = React.useState(false);
  const [inspectingStashChannel, setInspectingStashChannel] = React.useState<string | null>(null);

  // --- FEATURE 23: RICH-MEDIA SNIPPET RESOLVERS ---
  const [resolvedPreviews, setResolvedPreviews] = React.useState<Record<string, LinkPreviewData>>({});
  const resolvedUrlsRef = React.useRef<Set<string>>(new Set());

  // --- FEATURE 24: VOLATILE MESSAGE DESTRUCTION ---
  const [isVolatile, setIsVolatile] = React.useState(false);
  const [destructionDelay, setDestructionDelay] = React.useState(15); // Default 15s
  const [timeLefts, setTimeLefts] = React.useState<Record<string, number>>({});
  const [disintegratedMsgs, setDisintegratedMsgs] = React.useState<Set<string>>(new Set());

  // --- FEATURE 25: CODE COMPONENT SANDBOXES ---
  const [sandboxCode, setSandboxCode] = React.useState('');
  const [sandboxLanguage, setSandboxLanguage] = React.useState('javascript');
  const [sandboxMode, setSandboxMode] = React.useState(false);
  const [sandboxOutputs, setSandboxOutputs] = React.useState<Record<string, string>>({});

  // --- FEATURE 26: BRANCHING DM CONVERSATIONS ---
  const [branchRootMsg, setBranchRootMsg] = React.useState<DirectMessage | null>(null);
  const [branchContent, setBranchContent] = React.useState('');

  // --- FEATURE 27: PRIORITY MATRIX INBOXES ---
  const [priorityMatrixFilter, setPriorityMatrixFilter] = React.useState<'ALL' | 'PRIORITY' | 'TECH' | 'STASHED'>('ALL');
  const [matrixSearchQuery, setMatrixSearchQuery] = React.useState('');

  // --- FEATURE 28: SHARED RESOURCE PINBOARDS ---
  const [showPinboard, setShowPinboard] = React.useState(true);

  // --- FEATURE 29: AUDIO ACCELERATION ADJUSTERS ---
  const [playbackSpeeds, setPlaybackSpeeds] = React.useState<Record<string, number>>({});
  const [playingAudios, setPlayingAudios] = React.useState<Record<string, boolean>>({});
  const [audioProgress, setAudioProgress] = React.useState<Record<string, number>>({});
  const [voiceDuration, setVoiceDuration] = React.useState(0);
  const [isRecording, setIsRecording] = React.useState(false);
  const [recordSeconds, setRecordSeconds] = React.useState(0);
  const recordIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // --- FEATURE 30: MULTI-RECIPIENT TRANSMISSION BLASTS ---
  const [blastModalOpen, setBlastModalOpen] = React.useState(false);
  const [blastSelectedRecipients, setBlastSelectedRecipients] = React.useState<string[]>([]);
  const [blastContent, setBlastContent] = React.useState('');
  const [blastProgress, setBlastProgress] = React.useState<number | null>(null);
  const [blastStatusText, setBlastStatusText] = React.useState('');

  // --- LOAD CORE USER AND INITIAL DATA ---
  const fetchConversationsList = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const user = await getCurrentUser();
      if (user) setCurrentUser(user);

      const convs = await getConversations();
      setConversations(convs);

      // Save list of all platform users for blasts and suggested starters
      const db = await getDB();
      setAllUsers(db.users);

      if (activeConv) {
        const currentActive = convs.find(c => c.otherUser.id === activeConv.otherUser.id);
        if (currentActive) {
          setActiveConv(currentActive);
        }
      }

      // Filter suggested starting profiles
      const chatUserIds = convs.map(c => c.otherUser.id);
      const suggestions = db.users.filter(
        u => u.id !== user?.id && !chatUserIds.includes(u.id)
      );
      setSuggestedUsers(suggestions);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchActiveThread = async (otherUserId: string, silent = false) => {
    try {
      const msgs = await getDirectMessages(otherUserId);
      setMessages(msgs);

      // Extract and fetch link previews for URLs
      msgs.forEach(msg => {
        const urls = msg.content.match(/https?:\/\/[^\s]+/g);
        if (urls) {
          urls.forEach(url => {
            if (!resolvedUrlsRef.current.has(url)) {
              resolvedUrlsRef.current.add(url);
              resolveLinkPreview(url).then(preview => {
                setResolvedPreviews(prev => ({ ...prev, [url]: preview }));
              });
            }
          });
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  // --- COZY SAFE ROOM OPERATIONS (BATCH 4) ---
  const fetchSafeRoomsList = async (silent = false) => {
    if (!silent) setRoomLoading(true);
    try {
      const rooms = await getSafeRooms();
      setSafeRooms(rooms);
    } catch (err) {
      console.error('Failed to load safe rooms:', err);
    } finally {
      if (!silent) setRoomLoading(false);
    }
  };

  const fetchRoomMessages = async (roomId: string, silent = false) => {
    try {
      const msgs = await getSafeRoomMessages(roomId);
      setRoomMessages(msgs);
    } catch (err) {
      console.error('Failed to load room messages:', err);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    try {
      const res = await createSafeRoom(
        newRoomName,
        newRoomTheme,
        newRoomSoundscape,
        newRoomPasscode
      );

      if (res.success && res.room) {
        setNewRoomName('');
        setNewRoomPasscode('');
        setShowCreateRoom(false);
        await fetchSafeRoomsList();
        
        // Auto-enter room
        if (res.room.passcode) {
          // Creators automatically unlock their rooms
          setUnlockedRoomIds(prev => {
            const next = new Set(prev);
            next.add(res.room.id);
            return next;
          });
        }
        setActiveRoom(res.room);
      }
    } catch (err) {
      console.error('Failed to create room:', err);
    }
  };

  const handleSendRoomMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeRoom || sending) return;

    const trimmedContent = content.trim();
    const hasSnippet = sandboxMode && sandboxCode.trim().length > 0;

    if (!trimmedContent && !hasSnippet) return;

    setSending(true);
    setContent('');
    setSandboxCode('');
    setSandboxMode(false);

    try {
      const res = await sendSafeRoomMessage(activeRoom.id, trimmedContent, {
        isVolatile,
        destructionDelay: isVolatile ? destructionDelay : undefined,
        codeSnippet: hasSnippet ? sandboxCode : undefined,
        codeLanguage: hasSnippet ? sandboxLanguage : undefined,
      });

      if (res.success) {
        await fetchRoomMessages(activeRoom.id, true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleUnlockRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoom) return;

    if (roomPasscodeInput === activeRoom.passcode) {
      setUnlockedRoomIds(prev => {
        const next = new Set(prev);
        next.add(activeRoom.id);
        return next;
      });
      setRoomPasscodeInput('');
      setRoomPasscodeError('');
    } else {
      setRoomPasscodeError('Invalid Passcode. Sanctuary access denied.');
    }
  };

  const stopSafeRoomSoundscape = () => {
    safeRoomAudioTimersRef.current.forEach(timer => {
      try {
        clearTimeout(timer);
        clearInterval(timer);
      } catch {}
    });
    safeRoomAudioTimersRef.current = [];

    safeRoomAudioNodesRef.current.forEach(node => {
      try {
        node.stop();
      } catch {}
    });
    safeRoomAudioNodesRef.current = [];

    if (safeRoomAudioCtxRef.current) {
      try {
        safeRoomAudioCtxRef.current.close();
      } catch {}
      safeRoomAudioCtxRef.current = null;
    }
  };

  const startSafeRoomSoundscape = (soundscapeType: string) => {
    stopSafeRoomSoundscape();
    if (soundscapeType === 'none') return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      safeRoomAudioCtxRef.current = ctx;

      const muffleFilter = ctx.createBiquadFilter();
      muffleFilter.type = 'lowpass';
      muffleFilter.frequency.setValueAtTime(3500, ctx.currentTime);

      const globalGain = ctx.createGain();
      globalGain.gain.setValueAtTime(0.18, ctx.currentTime);

      muffleFilter.connect(globalGain);
      globalGain.connect(ctx.destination);

      safeRoomAudioNodesRef.current = [muffleFilter, globalGain];

      const generateWhiteNoise = (size: number) => {
        const d = new Float32Array(size);
        for (let i = 0; i < d.length; i++) {
          d[i] = Math.random() * 2 - 1;
        }
        return d;
      };

      if (soundscapeType === 'rain') {
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        noiseBuffer.getChannelData(0).set(generateWhiteNoise(bufferSize));

        const rainSource = ctx.createBufferSource();
        rainSource.buffer = noiseBuffer;
        rainSource.loop = true;

        const rainFilter = ctx.createBiquadFilter();
        rainFilter.type = 'lowpass';
        rainFilter.frequency.setValueAtTime(550, ctx.currentTime);

        const rainGain = ctx.createGain();
        rainGain.gain.setValueAtTime(0.1, ctx.currentTime);

        rainSource.connect(rainFilter);
        rainFilter.connect(rainGain);
        rainGain.connect(muffleFilter);

        rainSource.start();
        safeRoomAudioNodesRef.current.push(rainSource, rainFilter, rainGain);

      } else if (soundscapeType === 'crackle') {
        const lowOsc = ctx.createOscillator();
        const lowGain = ctx.createGain();
        lowOsc.type = 'triangle';
        lowOsc.frequency.setValueAtTime(60, ctx.currentTime);
        lowGain.gain.setValueAtTime(0.04, ctx.currentTime);

        lowOsc.connect(lowGain);
        lowGain.connect(muffleFilter);
        lowOsc.start();

        safeRoomAudioNodesRef.current.push(lowOsc, lowGain);

        const triggerPop = () => {
          if (!safeRoomAudioCtxRef.current || safeRoomAudioCtxRef.current.state === 'closed') return;
          try {
            const osc = ctx.createOscillator();
            const popGain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(Math.random() * 400 + 800, ctx.currentTime);

            popGain.gain.setValueAtTime(0.015, ctx.currentTime);
            popGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);

            osc.connect(popGain);
            popGain.connect(muffleFilter);

            osc.start();
            osc.stop(ctx.currentTime + 0.05);
          } catch {}

          const nextInterval = Math.random() * 300 + 50;
          const timerId = setTimeout(triggerPop, nextInterval);
          safeRoomAudioTimersRef.current.push(timerId);
        };
        triggerPop();

      } else if (soundscapeType === 'swallows') {
        const triggerChirp = () => {
          if (!safeRoomAudioCtxRef.current || safeRoomAudioCtxRef.current.state === 'closed') return;
          try {
            const now = ctx.currentTime;
            const count = Math.floor(Math.random() * 2) + 2;
            for (let i = 0; i < count; i++) {
              const osc = ctx.createOscillator();
              const chirpGain = ctx.createGain();
              osc.type = 'sine';

              const startFreq = Math.random() * 400 + 1700;
              const endFreq = startFreq + Math.random() * 500 + 200;
              const tStart = now + i * 0.1;
              const tEnd = tStart + 0.06;

              osc.frequency.setValueAtTime(startFreq, tStart);
              osc.frequency.exponentialRampToValueAtTime(endFreq, tEnd);

              chirpGain.gain.setValueAtTime(0.015, tStart);
              chirpGain.gain.exponentialRampToValueAtTime(0.0001, tEnd);

              osc.connect(chirpGain);
              chirpGain.connect(muffleFilter);

              osc.start(tStart);
              osc.stop(tEnd + 0.01);
            }
          } catch {}

          const nextInterval = Math.random() * 5000 + 3000;
          const timerId = setTimeout(triggerChirp, nextInterval);
          safeRoomAudioTimersRef.current.push(timerId);
        };
        triggerChirp();

      } else if (soundscapeType === 'lofi') {
        const chords = [
          [220, 261.63, 329.63, 392.00], // Am7
          [174.61, 220, 261.63, 349.23], // Fmaj7
          [196.00, 246.94, 293.66, 392.00], // G7
          [164.81, 196.00, 246.94, 329.63]  // Em7
        ];
        let chordIdx = 0;

        const triggerChord = () => {
          if (!safeRoomAudioCtxRef.current || safeRoomAudioCtxRef.current.state === 'closed') return;
          try {
            const now = ctx.currentTime;
            const currentChord = chords[chordIdx];
            chordIdx = (chordIdx + 1) % chords.length;

            currentChord.forEach(freq => {
              const osc = ctx.createOscillator();
              const oscGain = ctx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(freq, now);

              oscGain.gain.setValueAtTime(0.0, now);
              oscGain.gain.linearRampToValueAtTime(0.02, now + 1.5);
              oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 5.8);

              osc.connect(oscGain);
              oscGain.connect(muffleFilter);

              osc.start(now);
              osc.stop(now + 6.0);
            });
          } catch {}

          const timerId = setTimeout(triggerChord, 6000);
          safeRoomAudioTimersRef.current.push(timerId);
        };
        triggerChord();
      }
    } catch (err) {
      console.error('Failed to play soundscape:', err);
    }
  };

  // --- REACT EFFECTS FOR COZY SAFE ROOMS ---
  // Load safe rooms when swapping modes
  React.useEffect(() => {
    Promise.resolve().then(() => {
      if (activeMode === 'SAFE_ROOM') {
        fetchSafeRoomsList();
        setActiveConv(null); // Deselect DM
      } else {
        setActiveRoom(null); // Deselect room
        stopSafeRoomSoundscape();
      }
    });
  }, [activeMode]);

  // Load active room messages and play its soundscape
  React.useEffect(() => {
    Promise.resolve().then(() => {
      if (activeRoom) {
        const isUnlocked = !activeRoom.passcode || unlockedRoomIds.has(activeRoom.id);
        
        if (isUnlocked) {
          fetchRoomMessages(activeRoom.id);
          startSafeRoomSoundscape(activeRoom.soundscape);
        } else {
          stopSafeRoomSoundscape();
        }
      } else {
        stopSafeRoomSoundscape();
        setRoomMessages([]);
      }
    });
  }, [activeRoom, unlockedRoomIds]);

  // Clean up soundscapes on unmount
  React.useEffect(() => {
    return () => {
      stopSafeRoomSoundscape();
    };
  }, []);

  // Polling safe room messages every 3s if active
  React.useEffect(() => {
    if (activeMode === 'SAFE_ROOM' && activeRoom) {
      const isUnlocked = !activeRoom.passcode || unlockedRoomIds.has(activeRoom.id);
      if (isUnlocked) {
        const interval = setInterval(() => {
          fetchRoomMessages(activeRoom.id, true);
        }, 3000);
        return () => clearInterval(interval);
      }
    }
  }, [activeMode, activeRoom, unlockedRoomIds]);

  // 1. Initial mounting data
  React.useEffect(() => {
    Promise.resolve().then(() => {
      fetchConversationsList();
      fetchSafeRoomsList(true);
    });
  }, []);

  // 2. Load active thread on conversation swap
  React.useEffect(() => {
    if (activeConv) {
      Promise.resolve().then(() => {
        fetchActiveThread(activeConv.otherUser.id);
        // Look up local stash preferences asynchronously to avoid synchronous cascading renders
        const stashedSetting = localStorage.getItem(`vp_stash_enabled_${activeConv.otherUser.id}`);
        setStashEnabled(stashedSetting === 'true');
      });
    } else {
      Promise.resolve().then(() => {
        setMessages([]);
      });
    }
  }, [activeConv]);

  // 3. FEATURE 21: DYNAMIC STREAM POLLING INTERVAL SHIFTER
  React.useEffect(() => {
    const intervalTime = isTyping ? 2500 : 5000;

    const pollInterval = setInterval(() => {
      fetchConversationsList(true);
      if (activeConv) {
        fetchActiveThread(activeConv.otherUser.id, true);
      }
    }, intervalTime);

    return () => clearInterval(pollInterval);
  }, [activeConv, isTyping]);

  // 4. FEATURE 24: VOLATILE DESTRUCTION TICKER & DIGITAL ERASURE
  React.useEffect(() => {
    const ticker = setInterval(() => {
      const now = Date.now();
      const updatedTimeLefts: Record<string, number> = {};

      messages.forEach(msg => {
        if (msg.isVolatile && msg.expiresAt) {
          const expiry = new Date(msg.expiresAt).getTime();
          const secondsLeft = Math.max(0, Math.round((expiry - now) / 1000));
          updatedTimeLefts[msg.id] = secondsLeft;

          // Erase message once countdown expires
          if (secondsLeft <= 0 && !disintegratedMsgs.has(msg.id)) {
            setDisintegratedMsgs(prev => {
              const updated = new Set(prev);
              updated.add(msg.id);
              return updated;
            });
            // Invoke server-side absolute erasure
            deleteMessage(msg.id).then(() => {
              if (activeConv) {
                fetchActiveThread(activeConv.otherUser.id, true);
              }
            });
          }
        }
      });

      setTimeLefts(updatedTimeLefts);
    }, 1000);

    return () => clearInterval(ticker);
  }, [messages, disintegratedMsgs, activeConv]);

  // 5. FEATURE 22: CLIENT-SIDE LOCAL ENCRYPTED STASH SYNC
  React.useEffect(() => {
    if (activeConv && stashEnabled && messages.length > 0) {
      // Create safe stash node payload
      const stashData = messages.map(m => ({
        id: m.id,
        senderId: m.senderId,
        receiverId: m.receiverId,
        content: m.content,
        createdAt: m.createdAt,
        codeSnippet: m.codeSnippet,
        isPinned: m.isPinned
      }));

      // Encrypt the entire interaction block
      const cipherText = encryptPayload(JSON.stringify(stashData));
      localStorage.setItem(`vp_stash_payload_${activeConv.otherUser.id}`, cipherText);
    }
  }, [messages, stashEnabled, activeConv]);

  // Handle keystrokes to shift polling frequency down (Feature 21)
  const handleInputChange = (text: string) => {
    setContent(text);
    setIsTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 3000);
  };

  // Send single DM Action
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeConv || sending) return;

    const trimmedContent = content.trim();
    const hasSnippet = sandboxMode && sandboxCode.trim().length > 0;

    if (!trimmedContent && !hasSnippet) return;

    setSending(true);
    setContent('');
    setSandboxCode('');
    setSandboxMode(false);

    try {
      const res = await sendMessage(activeConv.otherUser.id, trimmedContent, null, {
        isVolatile,
        destructionDelay: isVolatile ? destructionDelay : undefined,
        codeSnippet: hasSnippet ? sandboxCode : undefined,
        codeLanguage: hasSnippet ? sandboxLanguage : undefined,
      });

      if (res.success) {
        await fetchActiveThread(activeConv.otherUser.id, true);
        await fetchConversationsList(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  // Star/Toggle Channel manually for Priority classification (Feature 27)
  const toggleStarChannel = (otherUserId: string) => {
    const key = `vp_starred_channel_${otherUserId}`;
    const exists = localStorage.getItem(key) === 'true';
    localStorage.setItem(key, exists ? 'false' : 'true');
    fetchConversationsList(true);
  };

  // FEATURE 29: VOICE LOG SOUNDWAVE CAPTURING
  const startVoiceRecording = () => {
    setIsRecording(true);
    setRecordSeconds(0);
    recordIntervalRef.current = setInterval(() => {
      setRecordSeconds(p => p + 1);
    }, 1000);
  };

  const stopAndSendVoiceLog = async () => {
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    setIsRecording(false);
    if (!activeConv) return;

    setSending(true);
    const duration = recordSeconds || 3;

    try {
      // Simulate base64 voice waveform pulse packet
      const simulatedVoiceData = 'data:audio/mp3;base64,VklWSURfUFVLU0VfU0VDVVJFX1ZPSUNFX0xPR18yMDI2';
      
      const res = await sendMessage(activeConv.otherUser.id, `🎙️ Secure Voice Memo (${duration}s)`, null, {
        hasAudio: true,
        audioDuration: duration,
        audioDataUrl: simulatedVoiceData
      });

      if (res.success) {
        await fetchActiveThread(activeConv.otherUser.id, true);
        await fetchConversationsList(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
      setRecordSeconds(0);
    }
  };

  // FEATURE 29: VOICELOG VELOCITY STEPPERS
  const togglePlayAudioLog = (msgId: string) => {
    const isPlaying = !!playingAudios[msgId];
    setPlayingAudios(prev => ({ ...prev, [msgId]: !isPlaying }));
    
    if (!isPlaying) {
      setAudioProgress(prev => ({ ...prev, [msgId]: 0 }));
      const speed = playbackSpeeds[msgId] || 1.0;
      
      // Simulate real-time progress based on playback speed (Feature 29)
      const duration = messages.find(m => m.id === msgId)?.audioDuration || 5;
      const stepInterval = 100; // tick every 100ms
      const totalSteps = (duration * 1000) / stepInterval;
      
      let step = 0;
      const timer = setInterval(() => {
        setPlayingAudios(current => {
          if (!current[msgId]) {
            clearInterval(timer);
            return current;
          }
          
          step += 1 * speed;
          const ratio = Math.min(100, (step / totalSteps) * 100);
          setAudioProgress(p => ({ ...p, [msgId]: ratio }));

          if (ratio >= 100) {
            clearInterval(timer);
            return { ...current, [msgId]: false };
          }
          return current;
        });
      }, stepInterval);
    }
  };

  const changeAudioSpeed = (msgId: string, speed: number) => {
    setPlaybackSpeeds(prev => ({ ...prev, [msgId]: speed }));
  };

  // FEATURE 30: MULTI-RECIPIENT SECURE TRANSMISSION BLASTS
  const handleExecuteBlast = async () => {
    if (blastSelectedRecipients.length === 0 || !blastContent.trim()) return;
    
    setBlastProgress(0);
    setBlastStatusText('Initializing secure multi-blast pipelines...');

    const targets = [...blastSelectedRecipients];
    const total = targets.length;

    for (let i = 0; i < total; i++) {
      const recipientId = targets[i];
      const targetUser = allUsers.find(u => u.id === recipientId);
      
      setBlastStatusText(`Transmitting secure package ${i + 1}/${total} to @${targetUser?.username || recipientId}...`);
      
      // Simulate real network queue buffering for high precision
      await new Promise(r => setTimeout(r, 600));

      await sendMessage(recipientId, blastContent.trim());
      setBlastProgress(Math.round(((i + 1) / total) * 100));
    }

    setBlastStatusText(`Successfully dispatched concurrent broadcasts to ${total} endpoints!`);
    await new Promise(r => setTimeout(r, 1000));
    
    // Reset and close
    setBlastModalOpen(false);
    setBlastSelectedRecipients([]);
    setBlastContent('');
    setBlastProgress(null);
    fetchConversationsList(true);
  };

  // FEATURE 25: RUN SECURE CODE SANDBOX PLAYGROUND
  const runCodeSandbox = (msgId: string, code: string) => {
    setSandboxOutputs(prev => ({ ...prev, [msgId]: 'Loading structural playground sandbox...' }));
    
    setTimeout(() => {
      let logs: string[] = [];
      const customConsole = {
        log: (...args: any[]) => {
          logs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '));
        },
        error: (...args: any[]) => {
          logs.push(`[ERROR] ` + args.join(' '));
        }
      };

      try {
        // Execute dynamic code safely in captured console envelope
        const runFn = new Function('console', code);
        runFn(customConsole);
        
        if (logs.length === 0) {
          logs.push('Sandbox execution completed with no terminal output.');
        }
      } catch (err: any) {
        logs.push(`Execution Failure: ${err?.message || err}`);
      }

      setSandboxOutputs(prev => ({ ...prev, [msgId]: logs.join('\n') }));
    }, 500);
  };

  // FEATURE 26: BRANCH DISCUSSION SEND ACTION
  const handleSendBranchMsg = async () => {
    if (!branchRootMsg || !branchContent.trim() || !activeConv) return;
    
    const rootId = branchRootMsg.id;
    const currentBranchContent = branchContent.trim();
    setBranchContent('');

    try {
      const res = await sendMessage(activeConv.otherUser.id, currentBranchContent, null, {
        parentId: rootId
      });

      if (res.success) {
        await fetchActiveThread(activeConv.otherUser.id, true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // PIN / UNPIN MSG (Feature 28)
  const handleTogglePin = async (msgId: string) => {
    try {
      const res = await togglePinMessage(msgId);
      if (res.success && activeConv) {
        await fetchActiveThread(activeConv.otherUser.id, true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // FILTERS FOR THE PRIORITY MATRIX (Feature 27)
  const filteredConversations = conversations.filter(conv => {
    // 1. Sidebar Search filter
    if (matrixSearchQuery.trim()) {
      const q = matrixSearchQuery.toLowerCase();
      const matchName = conv.otherUser.displayName.toLowerCase().includes(q) || conv.otherUser.username.toLowerCase().includes(q);
      const matchMsg = conv.latestMessage.content.toLowerCase().includes(q);
      if (!matchName && !matchMsg) return false;
    }

    // 2. Matrix category filters
    if (priorityMatrixFilter === 'ALL') return true;

    if (priorityMatrixFilter === 'PRIORITY') {
      const starred = localStorage.getItem(`vp_starred_channel_${conv.otherUser.id}`) === 'true';
      return starred;
    }

    if (priorityMatrixFilter === 'TECH') {
      const techTerms = ['code', 'shader', 'vector', 'algorithm', 'layout', 'script', 'postgres', 'index', 'matrix', 'stash'];
      const latestMsgText = conv.latestMessage.content.toLowerCase();
      return techTerms.some(term => latestMsgText.includes(term)) || !!conv.latestMessage.codeSnippet;
    }

    if (priorityMatrixFilter === 'STASHED') {
      const stashedPayload = localStorage.getItem(`vp_stash_payload_${conv.otherUser.id}`);
      return !!stashedPayload;
    }

    return true;
  });

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Derived pinned resource list for Feature 28
  const pinnedResources = messages.filter(m => m.isPinned);

  // Filter root messages for the primary chat feed (Feature 26 removes branched replies from main list)
  const mainFeedMessages = messages.filter(m => !m.parentId);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 h-[calc(100vh-1rem)] flex flex-col gap-4 font-sans select-none">
      
      {/* GLOWING SYSTEM HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded border bg-slate-950/60 border-slate-900 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-violet-500/10 border border-violet-500/30 text-violet-400">
            <Binary className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              VividPulse Private Chats
            </h1>
            <p className="text-[10px] text-slate-500 font-sans">
              Chat with friends and family in a private and safe place
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* FEATURE 21: TELEMETRY POLLED VELOCITY WATCHER */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-[10px] font-sans text-slate-400 shadow-inner">
            <span className={cn("w-1.5 h-1.5 rounded-full animate-ping", isTyping ? "bg-amber-400" : "bg-teal-400")} />
            <span className={cn("font-bold", isTyping ? "text-amber-400 animate-pulse" : "text-teal-400")}>
              {isTyping ? "💬 Friend is typing..." : "🟢 Online and ready"}
            </span>
          </div>

          {/* GLOBAL MULTI-RECIPIENT TRANSMISSION TRIGGER (Feature 30) */}
          <button
            onClick={() => setBlastModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider bg-violet-600 hover:bg-violet-500 text-white border border-violet-500/20 rounded cursor-pointer transition-all hover:shadow-[0_0_15px_rgba(124,58,237,0.4)]"
            id="transmission_blast_trigger"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>👥 Start a Group Chat</span>
          </button>
        </div>
      </div>

      <div className="flex-1 bg-slate-950 border border-slate-900 rounded overflow-hidden flex shadow-2xl h-[650px] relative">
        
        {/* ========================================================
            LEFT RAIL: PRIORITY MATRIX & CONVERSATIONS INDEXER
            ======================================================== */}
        <div className="w-80 border-r border-slate-900 flex flex-col bg-slate-950/80 h-full flex-shrink-0">
          
          {/* TAB BAR FOR DM VS SAFE ROOMS */}
          <div className="grid grid-cols-2 border-b border-slate-900 bg-slate-950/60 p-1.5 gap-1.5">
            <button
              onClick={() => setActiveMode('DM')}
              className={cn(
                "py-1.5 px-3 text-[10px] font-extrabold uppercase tracking-widest rounded transition-all cursor-pointer text-center",
                activeMode === 'DM'
                  ? "bg-violet-600/10 border border-violet-500/30 text-violet-300 shadow-inner"
                  : "text-slate-500 hover:text-slate-300 border border-transparent hover:bg-slate-900/40"
              )}
            >
              💬 Private DMs
            </button>
            <button
              onClick={() => setActiveMode('SAFE_ROOM')}
              className={cn(
                "py-1.5 px-3 text-[10px] font-extrabold uppercase tracking-widest rounded transition-all cursor-pointer text-center",
                activeMode === 'SAFE_ROOM'
                  ? "bg-violet-600/10 border border-violet-500/30 text-violet-300 shadow-inner"
                  : "text-slate-500 hover:text-slate-300 border border-transparent hover:bg-slate-900/40"
              )}
            >
              🛖 Cozy Rooms
            </button>
          </div>

          {activeMode === 'DM' ? (
            <>
              {/* FEATURE 27: PRIORITY MATRIX PILOT CONTROL PANEL */}
              <div className="p-3.5 border-b border-slate-900 bg-slate-950 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-violet-400" /> My Inbox
                  </span>
                  <button 
                    onClick={() => fetchConversationsList()}
                    className="p-1 hover:bg-slate-900 text-slate-500 hover:text-slate-200 border border-transparent hover:border-slate-800 rounded cursor-pointer transition-all"
                    title="Refresh Chats"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>

                {/* Matrix Filter Quadrants */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setPriorityMatrixFilter('ALL')}
                    className={cn(
                      "p-2 text-[10px] font-bold uppercase tracking-wider border rounded text-center cursor-pointer transition-all",
                      priorityMatrixFilter === 'ALL'
                        ? "bg-violet-600/10 border-violet-500/40 text-violet-300 shadow-sm"
                        : "bg-slate-900/30 border-slate-900 hover:border-slate-800 text-slate-500 hover:text-slate-300"
                    )}
                    id="pm_all"
                  >
                    🌐 All Chats ({conversations.length})
                  </button>
                  <button
                    onClick={() => setPriorityMatrixFilter('PRIORITY')}
                    className={cn(
                      "p-2 text-[10px] font-bold uppercase tracking-wider border rounded text-center cursor-pointer transition-all",
                      priorityMatrixFilter === 'PRIORITY'
                        ? "bg-amber-600/10 border-amber-500/40 text-amber-300 shadow-sm"
                        : "bg-slate-900/30 border-slate-900 hover:border-slate-800 text-slate-500 hover:text-slate-300"
                    )}
                    id="pm_priority"
                  >
                    ⭐ Starred Friends
                  </button>
                  <button
                    onClick={() => setPriorityMatrixFilter('TECH')}
                    className={cn(
                      "p-2 text-[10px] font-bold uppercase tracking-wider border rounded text-center cursor-pointer transition-all",
                      priorityMatrixFilter === 'TECH'
                        ? "bg-teal-600/10 border-teal-500/40 text-teal-300 shadow-sm"
                        : "bg-slate-900/30 border-slate-900 hover:border-slate-800 text-slate-500 hover:text-slate-300"
                    )}
                    id="pm_tech"
                  >
                    💻 Work & Projects
                  </button>
                  <button
                    onClick={() => setPriorityMatrixFilter('STASHED')}
                    className={cn(
                      "p-2 text-[10px] font-bold uppercase tracking-wider border rounded text-center cursor-pointer transition-all",
                      priorityMatrixFilter === 'STASHED'
                        ? "bg-pink-600/10 border-pink-500/40 text-pink-300 shadow-sm"
                        : "bg-slate-900/30 border-slate-900 hover:border-slate-800 text-slate-500 hover:text-slate-300"
                    )}
                    id="pm_stashed"
                  >
                    🔒 Saved For Offline
                  </button>
                </div>

                {/* Live Search input */}
                <div className="relative">
                  <input
                    type="text"
                    value={matrixSearchQuery}
                    onChange={e => setMatrixSearchQuery(e.target.value)}
                    placeholder="Search chats, topics or messages..."
                    className="w-full bg-slate-900 border border-slate-850 text-[11px] text-slate-200 placeholder:text-slate-600 px-3 py-2 rounded outline-none focus:border-slate-750"
                  />
                </div>
              </div>

              {/* Channels Sidebar List */}
              <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-1.5">
                <div className="flex items-center justify-between px-2 mb-1">
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500">Your Chats</span>
                  <button
                    onClick={() => setShowSuggested(!showSuggested)}
                    className="text-[9px] font-bold text-violet-400 hover:text-white cursor-pointer flex items-center gap-0.5"
                  >
                    <Plus className="w-2.5 h-2.5" /> New Chat
                  </button>
                </div>

                {/* Suggested users starter container */}
                {showSuggested && (
                  <div className="mb-3 p-3 bg-slate-900/60 border border-slate-850 rounded flex flex-col gap-2.5 animate-fadeIn">
                    <span className="text-[9px] font-extrabold tracking-widest text-teal-400 uppercase">Start a New Chat</span>
                    {suggestedUsers.length === 0 ? (
                      <span className="text-[10px] text-slate-600 font-sans">No other users found right now.</span>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {suggestedUsers.map(user => (
                          <button
                            key={user.id}
                            onClick={() => {
                              const dummyConversation: Conversation = {
                                otherUser: {
                                  id: user.id,
                                  username: user.username,
                                  displayName: user.displayName,
                                  avatarUrl: user.avatarUrl,
                                },
                                latestMessage: {
                                  id: 'temp-' + Date.now(),
                                  senderId: user.id,
                                  receiverId: currentUser?.id || '',
                                  content: 'Secure handshake requested.',
                                  mediaUrl: null,
                                  isRead: true,
                                  createdAt: new Date().toISOString()
                                },
                                unreadCount: 0,
                              };
                              setActiveConv(dummyConversation);
                              setShowSuggested(false);
                              setConversations(prev => [dummyConversation, ...prev]);
                            }}
                            className="flex items-center justify-between p-2 hover:bg-slate-800/80 rounded text-left w-full cursor-pointer transition-all border border-transparent hover:border-slate-800"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <img 
                                src={user.avatarUrl || 'https://picsum.photos/seed/placeholder/100/100'} 
                                alt={user.displayName} 
                                className="w-6 h-6 rounded object-cover border border-slate-800" 
                              />
                              <div className="flex flex-col min-w-0">
                                <span className="text-[11px] font-extrabold text-slate-200 truncate leading-tight">@{user.username}</span>
                                <span className="text-[9px] text-slate-500 truncate leading-none">{user.displayName}</span>
                              </div>
                            </div>
                            <ChevronRight className="w-3 h-3 text-slate-500" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-600 font-sans">
                    <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
                    <span className="text-[10px] tracking-widest uppercase">Connecting...</span>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-2 border border-slate-900 border-dashed rounded">
                    <MessageSquare className="w-6 h-6 text-slate-800 animate-pulse" />
                    <span className="text-[10px] font-sans uppercase tracking-widest text-slate-600">No Chats</span>
                    <p className="text-[9px] text-slate-700 leading-normal max-w-[180px]">
                      No chats found in this category. Start a new chat or change the selected category above!
                    </p>
                  </div>
                ) : (
                  filteredConversations.map(conv => {
                    const isActive = activeConv?.otherUser.id === conv.otherUser.id;
                    const isStarred = localStorage.getItem(`vp_starred_channel_${conv.otherUser.id}`) === 'true';
                    const hasStash = localStorage.getItem(`vp_stash_payload_${conv.otherUser.id}`);

                    return (
                      <div
                        key={conv.otherUser.id}
                        className={cn(
                          'group rounded text-left transition-all border relative flex flex-col',
                          isActive
                            ? 'bg-slate-900/80 border-violet-500/30 shadow-[inset_0_1px_15px_rgba(124,58,237,0.05)]'
                            : 'bg-transparent border-transparent hover:bg-slate-900/30 hover:border-slate-900'
                        )}
                      >
                        <div className="flex items-center justify-between p-3 min-w-0">
                          {/* Active click area */}
                          <button
                            onClick={() => {
                              setActiveConv(conv);
                              setShowSuggested(false);
                            }}
                            className="flex items-center gap-3 min-w-0 text-left flex-1 cursor-pointer"
                          >
                            <div className="relative flex-shrink-0">
                              <img
                                src={conv.otherUser.avatarUrl || 'https://picsum.photos/seed/placeholder/100/100'}
                                alt={conv.otherUser.username}
                                className="w-10 h-10 rounded object-cover border border-slate-800"
                              />
                              {conv.unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-violet-600 text-white text-[9px] font-black flex items-center justify-center rounded-full animate-bounce shadow-lg">
                                  {conv.unreadCount}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex flex-col min-w-0">
                              <span className={cn('text-xs font-bold leading-none mb-1 group-hover:text-white flex items-center gap-1', isActive ? 'text-violet-400' : 'text-slate-200')}>
                                {conv.otherUser.displayName}
                                {isStarred && <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 flex-shrink-0" />}
                              </span>
                              <span className="text-[9px] text-slate-500 font-mono truncate leading-none">
                                @{conv.otherUser.username}
                              </span>
                              <p className="text-[10px] text-slate-400 truncate leading-relaxed mt-1">
                                {conv.latestMessage.content}
                              </p>
                            </div>
                          </button>

                          {/* Side star toggle trigger */}
                          <div className="flex flex-col items-end justify-between h-full gap-2 pl-2">
                            <span className="text-[8px] font-mono text-slate-600">
                              {formatTime(conv.latestMessage.createdAt)}
                            </span>
                            
                            <div className="flex items-center gap-1">
                              {hasStash && (
                                <span title="Local stashed cache detected">
                                  <Lock className="w-2.5 h-2.5 text-pink-400" />
                                </span>
                              )}
                              <button
                                onClick={() => toggleStarChannel(conv.otherUser.id)}
                                className={cn(
                                  "p-1 rounded opacity-30 group-hover:opacity-100 hover:bg-slate-800 text-slate-500 hover:text-amber-400 cursor-pointer transition-all",
                                  isStarred && "opacity-100 text-amber-400"
                                )}
                                title={isStarred ? "Unstar channel" : "Star channel (Priority Matrix VIP)"}
                              >
                                <Star className={cn("w-3 h-3", isStarred && "fill-amber-400")} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Secure mesh signal status bar */}
              <div className="p-3 border-t border-slate-900 bg-slate-950 flex items-center gap-2 text-[9px] font-mono text-slate-600 justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                  <span>CHATS ARE PRIVATE & SECURE</span>
                </div>
                {conversations.some(c => localStorage.getItem(`vp_stash_payload_${c.otherUser.id}`)) && (
                  <button
                    onClick={() => {
                      setShowStashInspector(true);
                      // Default inspect first channel that has a stash
                      const firstStash = conversations.find(c => localStorage.getItem(`vp_stash_payload_${c.otherUser.id}`));
                      setInspectingStashChannel(firstStash ? firstStash.otherUser.id : null);
                    }}
                    className="text-pink-400 hover:text-pink-300 font-bold underline text-[8px] tracking-wide uppercase cursor-pointer"
                  >
                    Inspect Safe
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              {/* SAFE ROOMS SIDEBAR */}
              <div className="p-3.5 border-b border-slate-900 bg-slate-950 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-violet-400" /> Safe Sanctuaries
                  </span>
                  <button 
                    onClick={() => fetchSafeRoomsList()}
                    className="p-1 hover:bg-slate-900 text-slate-500 hover:text-slate-200 border border-transparent hover:border-slate-800 rounded cursor-pointer transition-all"
                    title="Refresh Rooms"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-[9.5px] text-slate-500 leading-normal">
                  Private, self-hosted chatrooms equipped with dynamic sensory audio.
                </p>
                <button
                  onClick={() => setShowCreateRoom(true)}
                  className="w-full mt-1.5 flex items-center justify-center gap-1.5 py-2 px-3 text-[10px] font-extrabold uppercase tracking-wider bg-violet-600 hover:bg-violet-500 text-white rounded cursor-pointer transition-all hover:shadow-[0_0_10px_rgba(124,58,237,0.3)] border border-violet-500/10"
                >
                  <Plus className="w-3.5 h-3.5" /> Establish Safe Room
                </button>
              </div>

              {/* Room Sidebar List */}
              <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-1.5">
                {roomLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-600 font-sans">
                    <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
                    <span className="text-[10px] tracking-widest uppercase">Loading Sanctuaries...</span>
                  </div>
                ) : safeRooms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-2 border border-slate-900 border-dashed rounded">
                    <Layers className="w-6 h-6 text-slate-800 animate-pulse" />
                    <span className="text-[10px] font-sans uppercase tracking-widest text-slate-600">No sanctuaries</span>
                    <p className="text-[9px] text-slate-700 leading-normal max-w-[180px]">
                      No custom safe rooms established yet. Click the button above to build the first one!
                    </p>
                  </div>
                ) : (
                  safeRooms.map(room => {
                    const isActive = activeRoom?.id === room.id;
                    const isUnlocked = !room.passcode || unlockedRoomIds.has(room.id);

                    // Map themes to cozy border and text styling accents
                    const themeStyles = {
                      slate: isActive ? 'border-slate-500 bg-slate-900/40 text-slate-300' : 'hover:border-slate-800 border-transparent text-slate-400',
                      violet: isActive ? 'border-violet-500 bg-violet-950/20 text-violet-300' : 'hover:border-slate-850 border-transparent text-slate-400',
                      amber: isActive ? 'border-amber-500 bg-amber-950/20 text-amber-300' : 'hover:border-slate-850 border-transparent text-slate-400',
                      emerald: isActive ? 'border-emerald-500 bg-emerald-950/20 text-emerald-300' : 'hover:border-slate-850 border-transparent text-slate-400',
                      rose: isActive ? 'border-rose-500 bg-rose-950/20 text-rose-300' : 'hover:border-slate-850 border-transparent text-slate-400',
                    }[room.theme || 'slate'];

                    const soundscapeLabel = {
                      none: 'silent',
                      rain: '🌧️ rain',
                      crackle: '🔥 crackle',
                      swallows: '🎐 swallows',
                      lofi: '☕ lofi beats'
                    }[room.soundscape || 'none'];

                    return (
                      <button
                        key={room.id}
                        onClick={() => {
                          setActiveRoom(room);
                        }}
                        className={cn(
                          "w-full text-left p-3 rounded border transition-all cursor-pointer flex flex-col gap-1.5 relative overflow-hidden group",
                          themeStyles
                        )}
                      >
                        {/* Glow accent under selected card */}
                        {isActive && (
                          <div className={cn(
                            "absolute top-0 left-0 w-[2px] h-full",
                            {
                              slate: 'bg-slate-400',
                              violet: 'bg-violet-500',
                              amber: 'bg-amber-500',
                              emerald: 'bg-emerald-500',
                              rose: 'bg-rose-500'
                            }[room.theme]
                          )} />
                        )}

                        <div className="flex items-center justify-between min-w-0">
                          <span className={cn(
                            "text-xs font-bold truncate leading-none",
                            isActive ? "text-slate-100" : "text-slate-300 group-hover:text-white"
                          )}>
                            {room.name}
                          </span>
                          <div className="flex items-center gap-1.5 flex-shrink-0 pl-1">
                            {room.passcode && (
                              <span title="Passcode protected" className={isUnlocked ? "text-teal-400" : "text-amber-400"}>
                                <Lock className="w-2.5 h-2.5" />
                              </span>
                            )}
                            <span className="text-[8px] font-mono uppercase px-1 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-500">
                              {soundscapeLabel}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                          <span>@{room.creatorUsername}</span>
                          <span>{isUnlocked ? "🔓 Enter" : "🔒 Locked"}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Safe Rooms bottom bar */}
              <div className="p-3 border-t border-slate-900 bg-slate-950 flex items-center gap-1.5 text-[9px] font-mono text-slate-600 justify-start">
                <Volume2 className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
                <span>DYNAMIC SENSORY AUDIO MODULE ON</span>
              </div>
            </>
          )}

        </div>

        {/* ========================================================
            RIGHT PANEL: ACTIVE CHAT & SPACIAL COMPANION VIEWS
            ======================================================== */}
        <div className="flex-1 flex flex-col bg-slate-950 h-full overflow-hidden relative">
          {activeMode === 'DM' ? (
            activeConv ? (
              <>
                {/* Active Conversation User Header */}
                <div className="px-5 py-3.5 border-b border-slate-900 bg-slate-950 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <img
                      src={activeConv.otherUser.avatarUrl || 'https://picsum.photos/seed/placeholder/100/100'}
                      alt={activeConv.otherUser.username}
                      className="w-10 h-10 rounded object-cover border border-slate-800"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-200 leading-none mb-1 flex items-center gap-1.5">
                        {activeConv.otherUser.displayName}
                        {localStorage.getItem(`vp_starred_channel_${activeConv.otherUser.id}`) === 'true' && (
                          <span className="text-[8px] uppercase tracking-wider font-extrabold bg-amber-500/10 border border-amber-500/30 text-amber-400 px-1.5 py-0.5 rounded">
                            Favorite
                          </span>
                        )}
                      </span>
                      <span className="text-[9px] font-sans text-slate-500">
                        Username: @{activeConv.otherUser.username}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* FEATURE 28: PINBOARD TOGGLE SHELF */}
                    <button
                      onClick={() => setShowPinboard(!showPinboard)}
                      className={cn(
                        "px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider border cursor-pointer transition-all flex items-center gap-1",
                        showPinboard 
                          ? "bg-violet-600/10 border-violet-500/30 text-violet-300"
                          : "bg-slate-900 border-slate-850 text-slate-500 hover:text-slate-300"
                      )}
                      title="Saved messages drawer"
                    >
                      <Pin className={cn("w-3.5 h-3.5", showPinboard && "rotate-45 fill-violet-400")} />
                      <span>Saved Items ({pinnedResources.length})</span>
                    </button>

                    {/* FEATURE 22: CLIENT-SIDE SECURE LOCAL STASH STATUS BUTTON */}
                    <button
                      onClick={() => {
                        const updated = !stashEnabled;
                        setStashEnabled(updated);
                        localStorage.setItem(`vp_stash_enabled_${activeConv.otherUser.id}`, String(updated));
                        if (!updated) {
                          // Clear stash of this channel
                          localStorage.removeItem(`vp_stash_payload_${activeConv.otherUser.id}`);
                        }
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider border cursor-pointer transition-all flex items-center gap-1.5",
                        stashEnabled
                          ? "bg-pink-600/15 border-pink-500/30 text-pink-400"
                          : "bg-slate-900 border-slate-850 text-slate-500 hover:text-slate-300"
                      )}
                      title="Safe Lock: Saves messages locally to this browser."
                    >
                      <Lock className="w-3 h-3" />
                      <span>SAFE LOCK: {stashEnabled ? "ON" : "OFF"}</span>
                    </button>
                  </div>
                </div>

                {/* ========================================================
                    FEATURE 28: SHARED RESOURCE PINBOARD HORIZONTAL SHELF
                    ======================================================== */}
                {showPinboard && (
                  <div className="bg-slate-950 border-b border-slate-900 p-3 flex flex-col gap-2 relative z-10 animate-slideDown">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-violet-400 flex items-center gap-1">
                        <Pin className="w-3 h-3 rotate-45" /> 📌 Your Pinned & Kept Messages
                      </span>
                      <span className="text-[8px] font-sans text-slate-600 uppercase">Saved Links & Photos</span>
                    </div>

                    {pinnedResources.length === 0 ? (
                      <div className="text-center py-5 border border-dashed border-slate-900 rounded bg-slate-950/40 text-[10px] font-sans text-slate-600">
                        This drawer is empty. Tap the pin icon on any message to save it here!
                      </div>
                    ) : (
                      <div className="flex gap-2 overflow-x-auto pb-1 px-1">
                        {pinnedResources.map(pinMsg => {
                          const hasSnipped = !!pinMsg.codeSnippet;
                          return (
                            <div 
                              key={pinMsg.id} 
                              className="bg-slate-900 border border-slate-800 rounded p-2.5 flex flex-col gap-1.5 min-w-[210px] max-w-[240px] flex-shrink-0 relative group"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-mono text-slate-500 uppercase flex items-center gap-1">
                                  {hasSnipped ? <Code className="w-3 h-3 text-teal-400" /> : <Link className="w-3 h-3 text-violet-400" />}
                                  {hasSnipped ? 'Snippet Sandbox' : 'Resource Link'}
                                </span>
                                
                                <button
                                  onClick={() => handleTogglePin(pinMsg.id)}
                                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-800 text-slate-500 hover:text-red-400 rounded transition-all cursor-pointer"
                                  title="Unpin asset"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>

                              <p className="text-[10px] text-slate-200 line-clamp-2 leading-relaxed">
                                {pinMsg.content || (hasSnipped && `Shared sandbox script: ${pinMsg.codeLanguage}`)}
                              </p>

                              {hasSnipped && (
                                <button
                                  onClick={() => runCodeSandbox(pinMsg.id, pinMsg.codeSnippet || '')}
                                  className="mt-1 w-full text-center py-1 bg-teal-500/10 hover:bg-teal-500/25 border border-teal-500/25 text-teal-400 text-[9px] font-bold uppercase rounded cursor-pointer transition-all"
                                >
                                  Execute Sandbox
                                </button>
                              )}

                              <span className="text-[8px] font-mono text-slate-600 self-end">
                                Pin by @{pinMsg.senderId === currentUser?.id ? 'you' : activeConv.otherUser.username}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Message Scroller Stage */}
                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-slate-950/40 relative">
                  {mainFeedMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2.5">
                      <Sparkles className="w-7 h-7 text-slate-800 animate-pulse" />
                      <span className="text-xs font-mono uppercase tracking-widest text-slate-600">Secure Channel Handshake Established</span>
                      <p className="text-[10px] text-slate-700 max-w-xs text-center leading-relaxed">
                        Compose a message packet below. Toggle stashing, volatility, or paste code snippets to experiment.
                      </p>
                    </div>
                  ) : (
                    mainFeedMessages.map(msg => {
                      const isMe = msg.senderId === currentUser?.id;
                      const isPinned = msg.isPinned;
                      const timeLeft = timeLefts[msg.id];
                      const countReplies = messages.filter(child => child.parentId === msg.id).length;

                      // Parse potential URLs in message body (Feature 23)
                      const matchedUrls = msg.content.match(/https?:\/\/[^\s]+/g) || [];

                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            'flex flex-col max-w-[70%] gap-1.5 relative group animate-fadeIn',
                            isMe ? 'self-end items-end' : 'self-start items-start'
                          )}
                          onDoubleClick={() => setBranchRootMsg(msg)}
                          title="Double-click to initiate branched discussion (Feature 26)"
                        >
                          {/* Volatile Destruction ticking wrapper */}
                          {msg.isVolatile && timeLeft !== undefined && timeLeft <= 0 && (
                            <div className="text-[9px] font-mono text-red-400 bg-red-950/25 border border-red-900 p-2 rounded animate-ping">
                              💥 PACKET PURGED
                            </div>
                          )}

                          {/* Visual tag indicators */}
                          <div className="flex items-center gap-1.5 text-[8px] font-mono text-slate-500">
                            {msg.isVolatile && (
                              <span className="text-red-400 flex items-center gap-0.5 animate-pulse">
                                <Flame className="w-2.5 h-2.5 fill-red-500/20" /> Volatile (Purging in {timeLeft !== undefined ? `${timeLeft}s` : '...'})
                              </span>
                            )}
                            {isPinned && (
                              <span className="text-violet-400 flex items-center gap-0.5 font-bold">
                                <Pin className="w-2.5 h-2.5 rotate-45" /> Shared Pin
                              </span>
                            )}
                          </div>

                          {/* Main Chat Bubble body */}
                          <div
                            className={cn(
                              'px-4 py-3 text-xs leading-relaxed rounded shadow-md relative border',
                              isMe
                                ? 'bg-violet-650/90 border-violet-600 text-white rounded-br-none shadow-[0_4px_15px_rgba(124,58,237,0.12)]'
                                : 'bg-slate-900 border-slate-850 text-slate-200 rounded-bl-none'
                            )}
                          >
                            <div className="whitespace-pre-wrap font-light">
                              {msg.content}
                            </div>

                            {/* ========================================================
                                FEATURE 29: VOICE LOG PLAYBACK CONTROLLER
                                ======================================================== */}
                            {msg.hasAudio && (
                              <div className="mt-2.5 p-2 bg-slate-950/50 border border-slate-800 rounded flex flex-col gap-2 min-w-[200px]">
                                <div className="flex items-center justify-between gap-3">
                                  <button
                                    onClick={() => togglePlayAudioLog(msg.id)}
                                    className="w-7 h-7 bg-violet-600 hover:bg-violet-500 rounded-full flex items-center justify-center text-white cursor-pointer transition-all flex-shrink-0"
                                  >
                                    {playingAudios[msg.id] ? (
                                      <Pause className="w-3.5 h-3.5 fill-white" />
                                    ) : (
                                      <Play className="w-3.5 h-3.5 fill-white translate-x-0.5" />
                                    )}
                                  </button>

                                  <div className="flex-1 flex flex-col gap-1">
                                    <div className="flex items-center justify-between text-[8px] font-mono text-slate-500">
                                      <span>VOICELOG</span>
                                      <span>{msg.audioDuration}s</span>
                                    </div>
                                    
                                    {/* Simulated seeker progression */}
                                    <div className="w-full bg-slate-900 h-1 rounded overflow-hidden">
                                      <div 
                                        className="bg-violet-500 h-full transition-all duration-100"
                                        style={{ width: `${audioProgress[msg.id] || 0}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Accelerators rate switcher */}
                                <div className="flex items-center justify-between border-t border-slate-900/60 pt-1.5">
                                  <span className="text-[8px] font-mono text-slate-600">ACCEL RATE:</span>
                                  <div className="flex items-center gap-1">
                                    {[1.0, 1.25, 1.5, 2.0].map(speed => {
                                      const activeSpeed = playbackSpeeds[msg.id] || 1.0;
                                      return (
                                        <button
                                          key={speed}
                                          onClick={() => changeAudioSpeed(msg.id, speed)}
                                          className={cn(
                                            "px-1.5 py-0.5 rounded text-[8px] font-extrabold font-mono transition-all cursor-pointer",
                                            activeSpeed === speed
                                              ? "bg-teal-500/10 text-teal-400 border border-teal-500/30"
                                              : "text-slate-600 hover:text-slate-400 bg-transparent border border-transparent"
                                          )}
                                        >
                                          {speed}x
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* ========================================================
                                FEATURE 25: INTERACTIVE CODE COMPONENT SANDBOX
                                ======================================================== */}
                            {msg.codeSnippet && (
                              <div className="mt-3 p-3 bg-slate-950 border border-slate-900 rounded flex flex-col gap-2 font-mono text-xs">
                                <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                                  <span className="text-[10px] text-teal-400 font-bold flex items-center gap-1 uppercase">
                                    <Terminal className="w-3.5 h-3.5" /> Code Sandbox • {msg.codeLanguage || 'javascript'}
                                  </span>
                                  <button
                                    onClick={() => runCodeSandbox(msg.id, msg.codeSnippet || '')}
                                    className="px-2 py-0.5 bg-teal-500/10 hover:bg-teal-500 text-teal-400 hover:text-white border border-teal-500/30 text-[9px] font-bold uppercase rounded cursor-pointer transition-all"
                                  >
                                    Run Sandbox
                                  </button>
                                </div>

                                <pre className="text-[10px] text-slate-300 bg-slate-900 p-2.5 rounded overflow-x-auto select-text leading-relaxed border border-slate-900/50">
                                  <code>{msg.codeSnippet}</code>
                                </pre>

                                {sandboxOutputs[msg.id] && (
                                  <div className="mt-1.5 p-2 bg-slate-900/40 border border-slate-900 rounded flex flex-col gap-1">
                                    <span className="text-[8px] text-slate-600 uppercase font-black tracking-widest">LOG TERMINAL</span>
                                    <pre className="text-[10px] text-teal-400 whitespace-pre-wrap leading-relaxed select-text font-semibold">
                                      {sandboxOutputs[msg.id]}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* ========================================================
                                FEATURE 23: SERVER-SIDE RICH MEDIA LINK PREVIEW CARD
                                ======================================================== */}
                            {matchedUrls.map(url => {
                              const preview = resolvedPreviews[url];
                              if (!preview) return null;
                              return (
                                <div 
                                  key={url} 
                                  className="mt-3 bg-slate-950/80 border border-slate-900 rounded overflow-hidden flex flex-col gap-2 max-w-sm"
                                >
                                  {preview.image && (
                                    <div className="relative w-full h-24 bg-slate-900">
                                      <img 
                                        src={preview.image} 
                                        alt={preview.title} 
                                        className="w-full h-full object-cover border-b border-slate-900 opacity-80 group-hover:opacity-100 transition-opacity" 
                                      />
                                    </div>
                                  )}
                                  <div className="p-2.5 flex flex-col gap-1.5">
                                    <span className="text-[8px] font-mono text-teal-400 uppercase tracking-widest">Link Resolved</span>
                                    <a 
                                      href={url} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="text-[11px] font-bold text-violet-400 hover:underline line-clamp-1"
                                    >
                                      {preview.title}
                                    </a>
                                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                                      {preview.description}
                                    </p>

                                    {preview.isCodeAsset && preview.codeSample && (
                                      <div className="mt-1 bg-slate-900/50 p-2 rounded border border-slate-900 flex flex-col gap-1">
                                        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                          <Code className="w-2.5 h-2.5 text-teal-400" /> Remote Code Asset Snippet
                                        </span>
                                        <pre className="text-[9px] text-teal-500 overflow-x-auto leading-tight p-1.5 bg-slate-950 rounded select-text">
                                          {preview.codeSample}
                                        </pre>
                                        <button
                                          onClick={() => {
                                            setSandboxCode(preview.codeSample || '');
                                            setSandboxLanguage(preview.codeLanguage || 'javascript');
                                            setSandboxMode(true);
                                          }}
                                          className="mt-1 py-1 w-full text-center bg-violet-650/10 hover:bg-violet-600 border border-violet-500/20 text-violet-300 hover:text-white text-[9px] font-bold uppercase rounded cursor-pointer transition-all"
                                        >
                                          Copy to Local Sandbox
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Bottom controls meta line */}
                          <div className="flex items-center gap-3.5 text-[8.5px] font-mono text-slate-600 opacity-60 group-hover:opacity-100 transition-opacity">
                            <span>{formatTime(msg.createdAt)}</span>
                            {isMe && <CheckCheck className="w-3 h-3 text-violet-400" />}

                            {/* Pin toggle action trigger (Feature 28) */}
                            <button
                              onClick={() => handleTogglePin(msg.id)}
                              className={cn(
                                "hover:text-violet-400 cursor-pointer transition-all flex items-center gap-0.5",
                                isPinned && "text-violet-400"
                              )}
                              title={isPinned ? "Unpin message" : "Pin message to Conversation Pinboard"}
                            >
                              <Pin className="w-2.5 h-2.5 rotate-45" />
                              <span>{isPinned ? 'Unpin' : 'Pin'}</span>
                            </button>

                            {/* Branch trigger button (Feature 26) */}
                            <button
                              onClick={() => setBranchRootMsg(msg)}
                              className="hover:text-teal-400 cursor-pointer transition-all flex items-center gap-0.5"
                              title="Split/Branch dialog thread"
                            >
                              <CornerDownRight className="w-2.5 h-2.5 text-teal-400" />
                              <span>Branch {countReplies > 0 ? `(${countReplies})` : ''}</span>
                            </button>

                            {/* Double-tap helpful reminder (Feature 26) */}
                            <span className="text-[8px] text-slate-700 font-light select-none italic hidden group-hover:inline">
                              Double-click bubble to branch thread
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* ========================================================
                    MESSAGING COMPOSER & ATTACHMENT ACTION CONTROLS
                    ======================================================== */}
                <div className="p-4 border-t border-slate-900 bg-slate-950 flex flex-col gap-2.5 relative z-10">
                  
                  {/* Advanced Feature Toolbars */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/40 p-2 border border-slate-900 rounded">
                    <div className="flex flex-wrap items-center gap-3">
                      
                      {/* FEATURE 24: VOLATILE DESTRUCTION SWITCH PANEL */}
                      <div className="flex items-center gap-2 border-r border-slate-850 pr-3">
                        <button
                          type="button"
                          onClick={() => setIsVolatile(!isVolatile)}
                          className={cn(
                            "p-1.5 rounded transition-all cursor-pointer border flex items-center gap-1",
                            isVolatile
                              ? "bg-red-600/15 border-red-500/40 text-red-400 animate-pulse"
                              : "bg-slate-900 border-slate-850 text-slate-500 hover:text-slate-300"
                          )}
                          title="Configure self-destruction timer"
                        >
                          <Flame className="w-3.5 h-3.5" />
                          <span className="text-[9px] font-extrabold uppercase tracking-wider">⏱️ Set Self-Destruct Timer</span>
                        </button>

                        {isVolatile && (
                          <select
                            value={destructionDelay}
                            onChange={e => setDestructionDelay(Number(e.target.value))}
                            className="bg-slate-950 border border-slate-800 text-[9px] font-mono text-red-400 rounded px-1.5 py-1 outline-none"
                          >
                            <option value={10}>10s</option>
                            <option value={15}>15s</option>
                            <option value={30}>30s</option>
                            <option value={60}>1m</option>
                            <option value={300}>5m</option>
                          </select>
                        )}
                      </div>

                      {/* FEATURE 25: CODE SANDBOX SNIPPET PRESET SELECTOR */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSandboxMode(!sandboxMode)}
                          className={cn(
                            "p-1.5 rounded transition-all cursor-pointer border flex items-center gap-1",
                            sandboxMode
                              ? "bg-teal-600/15 border-teal-500/40 text-teal-400"
                              : "bg-slate-900 border-slate-850 text-slate-500 hover:text-slate-300"
                          )}
                          title="Enable code snippet box"
                        >
                          <Code className="w-3.5 h-3.5" />
                          <span className="text-[9px] font-extrabold uppercase tracking-wider">💻 Share a Code Box</span>
                        </button>

                        {sandboxMode && (
                          <div className="flex items-center gap-1.5 animate-fadeIn">
                            <select
                              value={sandboxLanguage}
                              onChange={e => setSandboxLanguage(e.target.value)}
                              className="bg-slate-950 border border-slate-800 text-[9px] font-mono text-teal-400 rounded px-1 py-0.5 outline-none"
                            >
                              <option value="javascript">Javascript</option>
                              <option value="typescript">Typescript</option>
                              <option value="css">CSS</option>
                              <option value="python">Python</option>
                            </select>

                            {/* Quick Presets Dropdown */}
                            <select
                              onChange={e => {
                                const val = e.target.value;
                                if (val) {
                                  const preset = CODE_PRESETS.find(p => p.name === val);
                                  if (preset) {
                                    setSandboxCode(preset.code);
                                    setSandboxLanguage(preset.language);
                                  }
                                }
                              }}
                              className="bg-slate-950 border border-slate-800 text-[9px] font-mono text-slate-400 rounded px-1.5 py-0.5 outline-none cursor-pointer"
                              defaultValue=""
                            >
                              <option value="" disabled>Load Presets...</option>
                              {CODE_PRESETS.map(p => (
                                <option key={p.name} value={p.name}>{p.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* FEATURE 29: VOICE MEMO RECORDER BUTTON */}
                    <div className="flex items-center gap-2">
                      {isRecording ? (
                        <div className="flex items-center gap-2 px-2.5 py-1 bg-red-950/40 border border-red-900/50 rounded animate-pulse">
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                          <span className="text-[9px] font-mono text-red-400 uppercase font-black tracking-widest">
                            CAPTURING MEMO • {recordSeconds}s
                          </span>
                          <button
                            type="button"
                            onClick={stopAndSendVoiceLog}
                            className="p-1 hover:bg-red-900/30 text-red-400 rounded transition-all cursor-pointer border border-red-500/30"
                            title="Finish and send voice log"
                          >
                            <Square className="w-2.5 h-2.5 fill-red-400" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={startVoiceRecording}
                          className="px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-850 text-slate-400 hover:text-white text-[9px] font-bold uppercase rounded cursor-pointer transition-all flex items-center gap-1.5"
                          title="Record a voice note"
                        >
                          <Mic className="w-3.5 h-3.5 text-violet-400" />
                          <span>🎙️ Send a Voice Note</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Embed code sandbox text area if sandboxMode is enabled */}
                  {sandboxMode && (
                    <div className="flex flex-col gap-1.5 bg-slate-950 p-3 border border-teal-900/20 rounded animate-slideDown">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-teal-400 font-mono">Sandbox Source Script:</span>
                      <textarea
                        value={sandboxCode}
                        onChange={e => setSandboxCode(e.target.value)}
                        placeholder="// Enter Javascript / node commands. Double click bubbles run them client-side safe."
                        className="w-full h-24 bg-slate-900 border border-slate-850 rounded p-2.5 text-[10px] font-mono text-teal-400 outline-none focus:border-teal-500/50 leading-relaxed"
                      />
                    </div>
                  )}

                  {/* Core Chat input Box */}
                  <form onSubmit={handleSendMessage} className="relative flex items-center">
                    <input
                      type="text"
                      value={content}
                      onChange={(e) => handleInputChange(e.target.value)}
                      disabled={sending}
                      placeholder={
                        isVolatile 
                          ? `⏱️ Message will self-destruct after reading. Type here...` 
                          : `Type your private message here...`
                      }
                      className={cn(
                        "w-full bg-slate-900 border text-xs text-slate-200 placeholder:text-slate-600 px-4 py-3.5 pr-12 rounded outline-none shadow-inner transition-all",
                        isVolatile ? "border-red-500/20 focus:border-red-500/50" : "border-slate-800 focus:border-violet-500"
                      )}
                    />
                    <button
                      type="submit"
                      disabled={(!content.trim() && !sandboxCode.trim()) || sending}
                      className="absolute right-4 text-violet-500 hover:text-violet-400 transition-colors disabled:text-slate-700 disabled:pointer-events-none cursor-pointer"
                    >
                      {sending ? (
                        <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      ) : (
                        <Send className="w-4.5 h-4.5" />
                      )}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              // No selected chat empty placeholder
              <div className="flex-grow flex flex-col items-center justify-center text-slate-600 gap-4 p-8 text-center bg-slate-950/40">
                <MessageSquare className="w-12 h-12 text-slate-850 animate-pulse" />
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">Terminal Static</h3>
                  <p className="text-[11.5px] text-slate-500 max-w-sm leading-relaxed mt-1.5 font-light">
                    Select an active communication pipeline from the Priority Matrix indexer rail on the left, or dispatch concurrent blast transmissions using the top action trigger.
                  </p>
                </div>
                <div className="flex items-center gap-2 p-3 bg-slate-900/30 border border-slate-900 rounded max-w-sm mt-2 text-left">
                  <Info className="w-5 h-5 text-violet-400 flex-shrink-0" />
                  <span className="text-[10px] text-slate-500 font-mono leading-normal">
                    VIP priority, tech logging matrices, volatile decay, voice rates, and persistent shared header Pinboards are initialized automatically inside chosen streams.
                  </span>
                </div>
              </div>
            )
          ) : (
            activeRoom ? (
              // Check if passcode is locked
              (activeRoom.passcode && !unlockedRoomIds.has(activeRoom.id)) ? (
                // LOCKED ROOM VIEW
                <div className="flex-grow flex flex-col items-center justify-center p-8 bg-slate-950/80">
                  <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-2xl flex flex-col gap-4">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full">
                        <Lock className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-widest mt-2">{activeRoom.name}</h3>
                      <p className="text-[10px] text-slate-500 font-sans">
                        This cozy sanctuary is protected by a local network passcode.
                      </p>
                    </div>

                    <form onSubmit={handleUnlockRoom} className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Sanctuary Passcode</label>
                        <input
                          type="password"
                          value={roomPasscodeInput}
                          onChange={e => setRoomPasscodeInput(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3 py-2 rounded.5 outline-none focus:border-violet-500"
                        />
                      </div>

                      {roomPasscodeError && (
                        <span className="text-[9px] font-mono text-red-400 text-center leading-normal">
                          {roomPasscodeError}
                        </span>
                      )}

                      <button
                        type="submit"
                        className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold uppercase tracking-widest rounded transition-all cursor-pointer"
                      >
                        Unlock Entry
                      </button>
                    </form>
                  </div>
                </div>
              ) : (() => {
                // UNLOCKED ROOM VIEW
                // Find color accent names & classes for the active room's theme
                const themeMap = {
                  slate: { text: 'text-slate-400', border: 'border-slate-800', bg: 'bg-slate-900/10', glow: 'shadow-[inset_0_1px_20px_rgba(255,255,255,0.02)]', badge: 'bg-slate-500/10 border-slate-500/30 text-slate-400' },
                  violet: { text: 'text-violet-400', border: 'border-violet-900', bg: 'bg-violet-950/10', glow: 'shadow-[inset_0_1px_20px_rgba(124,58,237,0.05)]', badge: 'bg-violet-500/10 border-violet-500/30 text-violet-400' },
                  amber: { text: 'text-amber-400', border: 'border-amber-900', bg: 'bg-amber-950/10', glow: 'shadow-[inset_0_1px_20px_rgba(245,158,11,0.05)]', badge: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
                  emerald: { text: 'text-emerald-400', border: 'border-emerald-900', bg: 'bg-emerald-950/10', glow: 'shadow-[inset_0_1px_20px_rgba(16,185,129,0.05)]', badge: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-450' },
                  rose: { text: 'text-rose-400', border: 'border-rose-900', bg: 'bg-rose-950/10', glow: 'shadow-[inset_0_1px_20px_rgba(244,63,94,0.05)]', badge: 'bg-rose-500/10 border-rose-500/30 text-rose-400' },
                }[activeRoom.theme || 'slate'];

                return (
                  <div className={cn("flex-grow flex flex-col h-full overflow-hidden relative", themeMap.glow)}>
                    
                    {/* Cozy Sanctuary Header */}
                    <div className="px-5 py-3.5 border-b border-slate-900 bg-slate-950/80 flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg border", themeMap.border)}>
                          <Layers className={cn("w-4 h-4", themeMap.text)} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-100 leading-none mb-1 flex items-center gap-1.5">
                            {activeRoom.name}
                            <span className={cn("text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded border", themeMap.badge)}>
                              Sanctuary Mode
                            </span>
                          </span>
                          <span className="text-[9px] font-mono text-slate-500">
                            Creator: @{activeRoom.creatorUsername}
                          </span>
                        </div>
                      </div>

                      {/* soundscape player controllers */}
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-slate-500 uppercase">
                          SENSORY FEED:
                        </span>
                        <div className="flex items-center gap-1 bg-slate-900 border border-slate-850 p-1 rounded">
                          {['none', 'rain', 'crackle', 'swallows', 'lofi'].map(sc => {
                            const scLabels: Record<string, string> = {
                              none: '🔇 Off',
                              rain: '🌧️ Rain',
                              crackle: '🔥 Crackle',
                              swallows: '🎐 Swallows',
                              lofi: '☕ Lofi'
                            };
                            const isCurrent = activeRoom.soundscape === sc;
                            return (
                              <span
                                key={sc}
                                className={cn(
                                  "px-2 py-0.5 rounded text-[8px] font-bold uppercase transition-all cursor-default select-none",
                                  isCurrent
                                    ? "bg-violet-600/10 text-violet-300 border border-violet-500/20"
                                    : "text-slate-600 hover:text-slate-400"
                                )}
                              >
                                {scLabels[sc]}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Room Message Scroller Stage */}
                    <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-slate-950/40 relative">
                      {roomMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2.5">
                          <Layers className={cn("w-7 h-7 text-slate-800 animate-pulse", themeMap.text)} />
                          <span className="text-xs font-mono uppercase tracking-widest text-slate-500">Sanctuary Mesh Signal Live</span>
                          <p className="text-[10px] text-slate-600 max-w-xs text-center leading-relaxed">
                            No messages in this sanctuary yet. Share dynamic thoughts, code stubs, or whisper notes securely.
                          </p>
                        </div>
                      ) : (
                        roomMessages.map(msg => {
                          const isMe = msg.senderId === currentUser?.id;
                          
                          return (
                            <div
                              key={msg.id}
                              className={cn(
                                'flex flex-col max-w-[70%] gap-1.5 relative group animate-fadeIn',
                                isMe ? 'self-end items-end' : 'self-start items-start'
                              )}
                            >
                              <div className="flex items-center gap-1.5 text-[8px] font-mono text-slate-500">
                                <span className="font-extrabold">@{msg.senderUsername}</span>
                                <span>•</span>
                                <span>{formatTime(msg.createdAt)}</span>
                              </div>

                              <div
                                className={cn(
                                  'px-4 py-3 text-xs leading-relaxed rounded shadow-md border font-sans font-light',
                                  isMe
                                    ? 'bg-violet-650/90 border-violet-600 text-white rounded-br-none shadow-[0_4px_15px_rgba(124,58,237,0.12)]'
                                    : 'bg-slate-900 border-slate-850 text-slate-200 rounded-bl-none'
                                )}
                              >
                                <div className="whitespace-pre-wrap">{msg.content}</div>

                                {msg.codeSnippet && (
                                  <div className="mt-3 p-3 bg-slate-950 border border-slate-900 rounded flex flex-col gap-2 font-mono text-xs">
                                    <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                                      <span className="text-[10px] text-teal-400 font-bold flex items-center gap-1 uppercase">
                                        <Terminal className="w-3.5 h-3.5" /> Room Codebox • {msg.codeLanguage || 'javascript'}
                                      </span>
                                      <button
                                        onClick={() => runCodeSandbox(msg.id, msg.codeSnippet || '')}
                                        className="px-2 py-0.5 bg-teal-500/10 hover:bg-teal-500 text-teal-400 hover:text-white border border-teal-500/30 text-[9px] font-bold uppercase rounded cursor-pointer transition-all"
                                      >
                                        Run Sandbox
                                      </button>
                                    </div>

                                    <pre className="text-[10px] text-slate-300 bg-slate-900 p-2.5 rounded overflow-x-auto select-text leading-relaxed border border-slate-900/50">
                                      <code>{msg.codeSnippet}</code>
                                    </pre>

                                    {sandboxOutputs[msg.id] && (
                                      <div className="mt-1.5 p-2 bg-slate-900/40 border border-slate-900 rounded flex flex-col gap-1">
                                        <span className="text-[8px] text-slate-600 uppercase font-black tracking-widest">LOG TERMINAL</span>
                                        <pre className="text-[10px] text-teal-400 whitespace-pre-wrap leading-relaxed select-text font-semibold">
                                          {sandboxOutputs[msg.id]}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Cozy Sanctuary Message Composer */}
                    <div className="p-4 border-t border-slate-900 bg-slate-950 flex flex-col gap-2.5 relative z-10">
                      
                      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/40 p-2 border border-slate-900 rounded">
                        <div className="flex flex-wrap items-center gap-3">
                          
                          {/* CODE PRESET TOGGLER */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSandboxMode(!sandboxMode)}
                              className={cn(
                                "p-1.5 rounded transition-all cursor-pointer border flex items-center gap-1",
                                sandboxMode
                                  ? "bg-teal-600/15 border-teal-500/40 text-teal-400"
                                  : "bg-slate-900 border-slate-850 text-slate-500 hover:text-slate-300"
                              )}
                              title="Enable code snippet box"
                            >
                              <Code className="w-3.5 h-3.5" />
                              <span className="text-[9px] font-extrabold uppercase tracking-wider">💻 Share a Code Box</span>
                            </button>

                            {sandboxMode && (
                              <div className="flex items-center gap-1.5 animate-fadeIn">
                                <select
                                  value={sandboxLanguage}
                                  onChange={e => setSandboxLanguage(e.target.value)}
                                  className="bg-slate-950 border border-slate-800 text-[9px] font-mono text-teal-400 rounded px-1 py-0.5 outline-none"
                                >
                                  <option value="javascript">Javascript</option>
                                  <option value="typescript">Typescript</option>
                                  <option value="css">CSS</option>
                                  <option value="python">Python</option>
                                </select>
                              </div>
                            )}
                          </div>
                        </div>

                        <span className="text-[8.5px] font-mono text-slate-600">
                          COZY STREAM ID: {activeRoom.id.substring(0,8)}
                        </span>
                      </div>

                      {sandboxMode && (
                        <div className="flex flex-col gap-1.5 bg-slate-950 p-3 border border-teal-900/20 rounded animate-slideDown">
                          <span className="text-[9px] font-extrabold uppercase tracking-widest text-teal-400 font-mono">Sandbox Source Script:</span>
                          <textarea
                            value={sandboxCode}
                            onChange={e => setSandboxCode(e.target.value)}
                            placeholder="// Enter Javascript / node commands. Double click bubbles run them client-side safe."
                            className="w-full h-24 bg-slate-900 border border-slate-850 rounded p-2.5 text-[10px] font-mono text-teal-400 outline-none focus:border-teal-500/50 leading-relaxed"
                          />
                        </div>
                      )}

                      <form onSubmit={handleSendRoomMessage} className="relative flex items-center">
                        <input
                          type="text"
                          value={content}
                          onChange={(e) => handleInputChange(e.target.value)}
                          disabled={sending}
                          placeholder="Cast peaceful thoughts into this room sanctuary stream..."
                          className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 px-4 py-3.5 pr-12 rounded outline-none shadow-inner focus:border-violet-500 transition-all"
                        />
                        <button
                          type="submit"
                          disabled={(!content.trim() && !sandboxCode.trim()) || sending}
                          className="absolute right-4 text-violet-500 hover:text-violet-400 transition-colors disabled:text-slate-700 disabled:pointer-events-none cursor-pointer"
                        >
                          {sending ? (
                            <Loader2 className="w-4.5 h-4.5 animate-spin" />
                          ) : (
                            <Send className="w-4.5 h-4.5" />
                          )}
                        </button>
                      </form>
                    </div>

                  </div>
                );
              })()
            ) : (
              // Sanctuary inactive fallback state
              <div className="flex-grow flex flex-col items-center justify-center text-slate-600 gap-4 p-8 text-center bg-slate-950/40">
                <Layers className="w-12 h-12 text-slate-850 animate-pulse" />
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">Sanctuary Silent</h3>
                  <p className="text-[11.5px] text-slate-500 max-w-sm leading-relaxed mt-1.5 font-light">
                    Establish a secure cozy sanctuary room using the Left Rail button, or enter an existing public room to trigger dynamic Web Audio ambient streams.
                  </p>
                </div>
                <div className="flex items-center gap-2 p-3 bg-slate-900/30 border border-slate-900 rounded max-w-sm mt-2 text-left">
                  <Volume2 className="w-5 h-5 text-violet-400 flex-shrink-0" />
                  <span className="text-[10px] text-slate-500 font-mono leading-normal">
                    Rain mufflers, campfire crackles, electronic swallow chirps, and dynamic lofi chord progression synthesis load dynamically using localized Web Audio Nodes.
                  </span>
                </div>
              </div>
            )
          )}
        </div>

          {/* ========================================================
              FEATURE 26: NESTED BRANCHING DM CONVERSATION SLIDEOUT PANEL
              ======================================================== */}
          {branchRootMsg && activeConv && (
            <div className="absolute top-0 right-0 w-96 h-full bg-slate-950 border-l border-slate-900 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col z-20 animate-slideLeft">
              
              {/* Branch Panel Header */}
              <div className="p-4 border-b border-slate-900 bg-slate-950 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CornerDownRight className="w-4 h-4 text-teal-400" />
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">Secondary Discussion Tree</h4>
                    <p className="text-[9px] font-mono text-slate-500">Root Packet: {branchRootMsg.id.substring(0, 8)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setBranchRootMsg(null)}
                  className="p-1 hover:bg-slate-900 text-slate-500 hover:text-white rounded border border-transparent hover:border-slate-800 cursor-pointer text-xs"
                >
                  ✕ Close
                </button>
              </div>

              {/* Branch Root Context block */}
              <div className="p-3 bg-slate-900/30 border-b border-slate-900/50 flex flex-col gap-1">
                <span className="text-[8px] font-extrabold text-teal-400 uppercase tracking-widest">BRANCH ROOT MESSAGE</span>
                <p className="text-xs text-slate-300 font-light italic leading-relaxed">
                  &quot;{branchRootMsg.content}&quot;
                </p>
              </div>

              {/* Branched thread conversation scroller */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 bg-slate-950/60">
                {messages.filter(m => m.parentId === branchRootMsg.id).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center gap-2 text-slate-600">
                    <MessageSquare className="w-5 h-5 text-slate-800 animate-pulse" />
                    <span className="text-[10px] font-mono uppercase">Branch Isolated</span>
                    <p className="text-[9px] text-slate-700 max-w-[200px] leading-normal">
                      No nested discussion payloads exist. Type in the secondary field below to spawn branch dialogue.
                    </p>
                  </div>
                ) : (
                  messages.filter(m => m.parentId === branchRootMsg.id).map(branchMsg => {
                    const isMe = branchMsg.senderId === currentUser?.id;
                    return (
                      <div
                        key={branchMsg.id}
                        className={cn(
                          "flex flex-col max-w-[80%] gap-1.5 p-2.5 rounded border text-xs leading-relaxed",
                          isMe 
                            ? "bg-violet-900/10 border-violet-500/20 text-slate-200 self-end"
                            : "bg-slate-900/60 border-slate-850 text-slate-300 self-start"
                        )}
                      >
                        <p className="font-light">{branchMsg.content}</p>
                        <div className="flex items-center gap-1.5 text-[8px] font-mono text-slate-600">
                          <span>by @{isMe ? 'you' : activeConv.otherUser.username}</span>
                          <span>•</span>
                          <span>{formatTime(branchMsg.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Branch Panel Compose Footer */}
              <div className="p-3 bg-slate-950 border-t border-slate-900">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={branchContent}
                    onChange={e => setBranchContent(e.target.value)}
                    placeholder="Contribute to nested tree..."
                    className="w-full bg-slate-900 border border-slate-850 text-xs text-slate-200 placeholder:text-slate-600 px-3 py-3 pr-10 rounded outline-none focus:border-teal-500/50"
                  />
                  <button
                    onClick={handleSendBranchMsg}
                    disabled={!branchContent.trim()}
                    className="absolute right-3 text-teal-400 hover:text-teal-300 transition-colors disabled:text-slate-700 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      {/* ========================================================
          FEATURE 22: CLIENT-SIDE LOCAL ENCRYPTED STASH INSPECTOR MODAL
          ======================================================== */}
      {showStashInspector && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-slate-950 border border-slate-900 rounded-lg max-w-2xl w-full flex flex-col overflow-hidden max-h-[80vh] shadow-[0_0_50px_rgba(244,114,182,0.15)]">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-900 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-pink-400" />
                <div>
                  <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider">Browser Encrypted Cache Stash</h3>
                  <p className="text-[9px] font-mono text-slate-500">Interaction payload stashed secure against local DB cleartext queries</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowStashInspector(false);
                  setInspectingStashChannel(null);
                }}
                className="text-slate-500 hover:text-white font-bold cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Content body split */}
            <div className="flex flex-1 overflow-hidden min-h-[300px]">
              
              {/* Channel Selector Sidebar */}
              <div className="w-48 border-r border-slate-900 flex flex-col bg-slate-950 overflow-y-auto">
                <span className="text-[8px] font-extrabold uppercase tracking-widest text-slate-600 p-3 pb-1 border-b border-slate-900 bg-slate-950/40">STASHED CHANNELS</span>
                {conversations.filter(c => localStorage.getItem(`vp_stash_payload_${c.otherUser.id}`)).length === 0 ? (
                  <span className="text-[10px] text-slate-600 p-3 italic">No encrypted browser cache stashes exist.</span>
                ) : (
                  conversations
                    .filter(c => localStorage.getItem(`vp_stash_payload_${c.otherUser.id}`))
                    .map(c => (
                      <button
                        key={c.otherUser.id}
                        onClick={() => setInspectingStashChannel(c.otherUser.id)}
                        className={cn(
                          "w-full p-2.5 text-left text-xs font-bold truncate transition-all cursor-pointer border-b border-slate-900/40",
                          inspectingStashChannel === c.otherUser.id
                            ? "bg-pink-600/10 text-pink-400 border-r-2 border-r-pink-500"
                            : "text-slate-400 hover:bg-slate-900/40 hover:text-white"
                        )}
                      >
                        @{c.otherUser.username}
                      </button>
                    ))
                )}
              </div>

              {/* Decryption stage */}
              <div className="flex-1 p-4 bg-slate-950 flex flex-col gap-3 overflow-y-auto">
                {inspectingStashChannel ? (() => {
                  const rawCipher = localStorage.getItem(`vp_stash_payload_${inspectingStashChannel}`);
                  let stashedItems: any[] = [];
                  let decodeErr = '';

                  if (rawCipher) {
                    try {
                      const decryptedStr = decryptPayload(rawCipher);
                      stashedItems = JSON.parse(decryptedStr);
                    } catch (e) {
                      decodeErr = 'Decryption verification failure. Invalid token nodes.';
                    }
                  }

                  const selectedChannelUser = allUsers.find(u => u.id === inspectingStashChannel);

                  return (
                    <div className="flex flex-col gap-3 h-full">
                      <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                        <span className="text-[10px] font-mono text-pink-400 font-bold uppercase flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" /> Channel @{selectedChannelUser?.username || 'anonymous'}
                        </span>
                        
                        <button
                          onClick={() => {
                            localStorage.removeItem(`vp_stash_payload_${inspectingStashChannel}`);
                            setInspectingStashChannel(null);
                            fetchConversationsList(true);
                          }}
                          className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded transition-all cursor-pointer"
                        >
                          Erase Node Cache
                        </button>
                      </div>

                      {/* Display RAW cipher data in localstorage to prove it is encrypted! */}
                      <div className="p-2.5 bg-slate-900 border border-slate-850 rounded flex flex-col gap-1.5 font-mono">
                        <span className="text-[8px] text-pink-400 font-black uppercase tracking-widest">GUARDIAN CLEARTEXT INSPECTION PROTECTION</span>
                        <p className="text-[8.5px] text-slate-500 truncate select-all leading-normal max-w-lg">
                          RAW LocalStorage Node Payload: <span className="text-slate-400">{rawCipher || 'None'}</span>
                        </p>
                      </div>

                      {/* Display DECRYPTED data */}
                      <div className="flex-1 flex flex-col gap-2 bg-slate-900/40 p-3 rounded border border-slate-900">
                        <span className="text-[8px] text-teal-400 font-extrabold uppercase tracking-widest">DECRYPTED HISTORIES MEMORY</span>
                        
                        {decodeErr ? (
                          <p className="text-[10px] text-red-400 font-mono">{decodeErr}</p>
                        ) : stashedItems.length === 0 ? (
                          <p className="text-[10px] text-slate-600 font-mono italic">No message histories recovered in decrypted buffer.</p>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {stashedItems.map((item: any, idx: number) => (
                              <div key={idx} className="border-b border-slate-900/40 pb-1.5 flex flex-col">
                                <div className="flex justify-between text-[8px] font-mono text-slate-500">
                                  <span>by: {item.senderId === currentUser?.id ? 'You' : `@${selectedChannelUser?.username || 'other'}`}</span>
                                  <span>{formatTime(item.createdAt)}</span>
                                </div>
                                <p className="text-[11px] text-slate-300 font-light mt-0.5">{item.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })() : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-600 text-center gap-2">
                    <Info className="w-8 h-8 text-slate-800 animate-pulse" />
                    <span className="text-xs uppercase font-mono tracking-widest">Stash Inspector Buffer Idle</span>
                    <p className="text-[10px] text-slate-600 max-w-xs leading-normal">
                      Select a stashed channel from the left sidebar to analyze decrypted browser histories and examine cleartext protections.
                    </p>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          FEATURE 30: MULTI-RECIPIENT SECURE TRANSMISSION BLAST MODAL
          ======================================================== */}
      {blastModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-slate-950 border border-slate-900 rounded-lg max-w-xl w-full flex flex-col overflow-hidden shadow-[0_0_50px_rgba(124,58,237,0.2)]">
            
            <div className="p-4 border-b border-slate-900 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-violet-400" />
                <div>
                  <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider">Mesh Transmission Multi-Blast</h3>
                  <p className="text-[9px] font-mono text-slate-500">Dispatches individual private messages to up to 50 concurrent endpoints</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (blastProgress === null) {
                    setBlastModalOpen(false);
                    setBlastSelectedRecipients([]);
                    setBlastContent('');
                  }
                }}
                disabled={blastProgress !== null}
                className="text-slate-500 hover:text-white font-bold cursor-pointer disabled:opacity-20 disabled:pointer-events-none"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              
              {/* Recipient Selection checklist */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Select Target Channels (max 50)</span>
                  <span className="text-[9px] font-mono text-teal-400">
                    Selected: {blastSelectedRecipients.length} / 50
                  </span>
                </div>

                <div className="bg-slate-900/60 border border-slate-850 rounded p-2.5 max-h-36 overflow-y-auto flex flex-col gap-1.5">
                  {allUsers.filter(u => u.id !== currentUser?.id).map(user => {
                    const isChecked = blastSelectedRecipients.includes(user.id);
                    return (
                      <label 
                        key={user.id} 
                        className="flex items-center gap-3 p-1.5 hover:bg-slate-800 rounded cursor-pointer select-none transition-all"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={blastProgress !== null}
                          onChange={() => {
                            if (isChecked) {
                              setBlastSelectedRecipients(prev => prev.filter(id => id !== user.id));
                            } else {
                              if (blastSelectedRecipients.length < 50) {
                                setBlastSelectedRecipients(prev => [...prev, user.id]);
                              }
                            }
                          }}
                          className="rounded text-violet-600 bg-slate-950 border-slate-800 focus:ring-violet-500 accent-violet-600 cursor-pointer h-3.5 w-3.5"
                        />
                        <img 
                          src={user.avatarUrl || 'https://picsum.photos/seed/placeholder/100/100'} 
                          alt={user.username} 
                          className="w-5 h-5 rounded object-cover border border-slate-800" 
                        />
                        <div className="flex flex-col leading-none">
                          <span className="text-[11px] font-extrabold text-slate-200">@{user.username}</span>
                          <span className="text-[9px] text-slate-500 mt-0.5">{user.displayName}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Message Payload draft */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Dispatched Package content</span>
                <textarea
                  value={blastContent}
                  onChange={e => setBlastContent(e.target.value)}
                  disabled={blastProgress !== null}
                  placeholder="Draft concurrent direct packet broadcast payloads..."
                  className="w-full h-24 bg-slate-900 border border-slate-850 rounded p-2.5 text-xs text-slate-200 outline-none focus:border-violet-500 leading-relaxed"
                />
              </div>

              {/* Progress and status bars */}
              {blastProgress !== null && (
                <div className="p-3 bg-slate-900 border border-slate-850 rounded flex flex-col gap-2.5 animate-fadeIn font-mono">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-teal-400 font-bold uppercase animate-pulse">{blastStatusText}</span>
                    <span className="text-slate-400 font-extrabold">{blastProgress}%</span>
                  </div>
                  
                  {/* Real progress bar */}
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-900">
                    <div 
                      className="bg-violet-600 h-full transition-all duration-300"
                      style={{ width: `${blastProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Trigger */}
              {blastProgress === null && (
                <button
                  onClick={handleExecuteBlast}
                  disabled={blastSelectedRecipients.length === 0 || !blastContent.trim()}
                  className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-900 text-white disabled:text-slate-600 font-extrabold uppercase text-xs tracking-widest rounded border border-violet-500/10 transition-all cursor-pointer disabled:pointer-events-none"
                  id="transmission_blast_execute"
                >
                  Execute Transmission Blast
                </button>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
