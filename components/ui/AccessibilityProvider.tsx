'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Volume2, VolumeX, Mic, CornerDownLeft, Undo2, X, Check,
  ArrowRight, ShieldAlert, Sun, HelpCircle, Eye, EyeOff, CheckSquare, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Define the accessibility context shape
interface AccessibilityContextType {
  theme: 'dark' | 'contrast' | 'cozy-paper';
  setTheme: (theme: 'dark' | 'contrast' | 'cozy-paper') => void;
  isEasyMode: boolean;
  setIsEasyMode: (val: boolean) => void;
  isQuietMode: boolean;
  setIsQuietMode: (val: boolean) => void;
  isMagnifierEnabled: boolean;
  setIsMagnifierEnabled: (val: boolean) => void;
  isReadAloudEnabled: boolean;
  setIsReadAloudEnabled: (val: boolean) => void;
  isSteadyPressEnabled: boolean;
  setIsSteadyPressEnabled: (val: boolean) => void;
  
  // Steady Press click helper
  stablePress: (callback: () => void) => void;
  
  // Undo Engine
  triggerUndo: (actionLabel: string, undoCallback: () => void) => void;
  undoAction: { label: string; callback: () => void } | null;
  clearUndo: () => void;
  
  // Speech synthesis read aloud
  speak: (text: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  
  // Speech dictation
  startDictation: (onTranscript: (text: string) => void) => void;
  isDictating: boolean;
  dictationError: string | null;
  
  // Mascot Guidance
  mascotSpeech: string;
  setMascotSpeech: (speech: string) => void;
  showMascotBubble: boolean;
  setShowMascotBubble: (val: boolean) => void;
}

const AccessibilityContext = React.createContext<AccessibilityContextType | undefined>(undefined);

export function useAccessibility() {
  const context = React.useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

export default function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  // 1. Cozy Themes State
  const [theme, setThemeState] = React.useState<'dark' | 'contrast' | 'cozy-paper'>('dark');
  
  // 2. Easy Mode Toggle
  const [isEasyMode, setIsEasyModeState] = React.useState<boolean>(false);
  
  // 3. Distraction-Free / Quiet Mode Layout
  const [isQuietMode, setIsQuietModeState] = React.useState<boolean>(false);
  
  // 4. Magnifying Glass Lens
  const [isMagnifierEnabled, setIsMagnifierEnabledState] = React.useState<boolean>(false);
  
  // 5. Read Aloud Speech Synthesis
  const [isReadAloudEnabled, setIsReadAloudEnabledState] = React.useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = React.useState<boolean>(false);
  
  // 6. Steady Press Click Stabilizer
  const [isSteadyPressEnabled, setIsSteadyPressEnabledState] = React.useState<boolean>(true);
  
  // 7. Whoops! Go Back Action Undo State
  const [undoAction, setUndoAction] = React.useState<{ label: string; callback: () => void } | null>(null);
  const undoTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [undoCountdown, setUndoCountdown] = React.useState(5);
  const countdownIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // 8. Mascot State
  const [mascotSpeech, setMascotSpeech] = React.useState<string>(
    "Hello, friend! 🐦 I'm Pip, your neighborly helper. Tap me if you'd like me to read text aloud, or turn on Easy Mode for extra-large, cozy controls!"
  );
  const [showMascotBubble, setShowMascotBubble] = React.useState<boolean>(true);

  // 9. Speech-to-Text Dictation State
  const [isDictating, setIsDictating] = React.useState<boolean>(false);
  const [dictationError, setDictationError] = React.useState<string | null>(null);
  const recognitionRef = React.useRef<any>(null);

  // Global cursor tracking for magnifying glass
  const [magnifierPos, setMagnifierPos] = React.useState({ x: 0, y: 0 });
  const [magnifierTarget, setMagnifierTarget] = React.useState<{ src: string; rect: DOMRect } | null>(null);

  // Load persistence from localStorage on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        const savedTheme = localStorage.getItem('pulse-theme') as any;
        if (savedTheme) setThemeState(savedTheme);
        
        const savedEasy = localStorage.getItem('pulse-easy-mode') === 'true';
        setIsEasyModeState(savedEasy);

        const savedQuiet = localStorage.getItem('pulse-quiet-mode') === 'true';
        setIsQuietModeState(savedQuiet);

        const savedMag = localStorage.getItem('pulse-magnifier') === 'true';
        setIsMagnifierEnabledState(savedMag);

        const savedRead = localStorage.getItem('pulse-read-aloud') === 'true';
        setIsReadAloudEnabledState(savedRead);

        const savedSteady = localStorage.getItem('pulse-steady-press') !== 'false'; // default true
        setIsSteadyPressEnabledState(savedSteady);
      }, 0);
    }
  }, []);

  const setTheme = (newTheme: 'dark' | 'contrast' | 'cozy-paper') => {
    setThemeState(newTheme);
    localStorage.setItem('pulse-theme', newTheme);
    let message = "I've changed the colors for you!";
    if (newTheme === 'cozy-paper') {
      message = "Ah, Cozy Paper! Soothing warm book tones, large print, and gentle charcoal text. 📖☕";
    } else if (newTheme === 'contrast') {
      message = "High-Contrast Mode! Pitch black, ultra-bright text, and clear borders for easy reading. 👁️";
    } else {
      message = "Back to our standard dark evening theme! 🌌";
    }
    triggerPipSpeech(message);
  };

  const setIsEasyMode = (val: boolean) => {
    setIsEasyModeState(val);
    localStorage.setItem('pulse-easy-mode', String(val));
    triggerPipSpeech(
      val 
        ? "Easy Mode Active! Everything is now a giant, high-contrast block with simple labels. Direct and friendly! 🤩" 
        : "Standard options restored. Feel free to switch back anytime!"
    );
  };

  const setIsQuietMode = (val: boolean) => {
    setIsQuietModeState(val);
    localStorage.setItem('pulse-quiet-mode', String(val));
    triggerPipSpeech(
      val
        ? "Quiet Mode Enabled. All reaction counts, numbers, and alerts are now hidden for a distraction-free view. Enjoy the peace! 🍃"
        : "Standard feed counters are visible again."
    );
  };

  const setIsMagnifierEnabled = (val: boolean) => {
    setIsMagnifierEnabledState(val);
    localStorage.setItem('pulse-magnifier', String(val));
    triggerPipSpeech(
      val
        ? "Magnifying Glass Ready! Just hover or tap any photo on the page to inspect tiny details with a digital lens! 🔍"
        : "Magnifying glass turned off."
    );
  };

  const setIsReadAloudEnabled = (val: boolean) => {
    setIsReadAloudEnabledState(val);
    localStorage.setItem('pulse-read-aloud', String(val));
    triggerPipSpeech(
      val
        ? "Read Aloud Enabled! Tap on any descriptive text, comments, or post cards to hear me read them in a slow, warm voice. 🔊"
        : "Read aloud helper disabled."
    );
  };

  const setIsSteadyPressEnabled = (val: boolean) => {
    setIsSteadyPressEnabledState(val);
    localStorage.setItem('pulse-steady-press', String(val));
    triggerPipSpeech(
      val
        ? "Steady-Press Assist is ON. I will filter out accidental fast double-clicks or hand shakes on buttons. 🩺"
        : "Steady-Press deactivated."
    );
  };

  // Helper to trigger Mascot Speech
  const triggerPipSpeech = (text: string) => {
    setMascotSpeech(text);
    setShowMascotBubble(true);
  };

  // Steady press click filter
  const lastClickTimeRef = React.useRef<number>(0);
  const stablePress = (callback: () => void) => {
    if (!isSteadyPressEnabled) {
      callback();
      return;
    }
    const now = Date.now();
    if (now - lastClickTimeRef.current < 550) {
      // Ignore accidental double-tap!
      return;
    }
    lastClickTimeRef.current = now;
    callback();
  };

  // Whoops! Undo Action triggers
  const triggerUndo = (actionLabel: string, undoCallback: () => void) => {
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    setUndoAction({ label: actionLabel, callback: undoCallback });
    setUndoCountdown(5);

    // Dynamic warning speech
    triggerPipSpeech(`Whoops! Just performed: "${actionLabel}". You have 5 seconds to go back! Tap the blue button below.`);

    // Countdown logic
    countdownIntervalRef.current = setInterval(() => {
      setUndoCountdown(prev => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Timeout logic
    undoTimeoutRef.current = setTimeout(() => {
      setUndoAction(null);
    }, 5000);
  };

  const clearUndo = () => {
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setUndoAction(null);
  };

  const handleExecuteUndo = () => {
    if (undoAction) {
      undoAction.callback();
      triggerPipSpeech("Action successfully reversed! High-five! 🖐️🐦");
      clearUndo();
    }
  };

  // Read Aloud speech synthesis engine
  const speak = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    setIsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85; // Cozy, slow, easy to understand for elderly ears
    utterance.pitch = 1.05; // Slightly warm/cheerful pitch

    // Choose a warm voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Zira')));
    if (englishVoice) utterance.voice = englishVoice;

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
    triggerPipSpeech("Listening aloud... Let me know if you need me to repeat it! 🎧");
  };

  const stopSpeaking = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // Speech-to-text dictation engine
  const startDictation = (onTranscript: (text: string) => void) => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      // Fallback: Cozy automated typewriter dictation with cheerful templates
      setIsDictating(true);
      setDictationError(null);
      triggerPipSpeech("Speech-to-text isn't fully supported in this browser, so I'm bringing you a beautiful cozy typewriter to craft your memory! ⌨️🌸");
      
      const templates = [
        "Enjoying a lovely quiet morning in the garden! 🌸☕",
        "Baking some hot apple pie for the neighborhood picnic today! 🥧🏡",
        "Listening to the sweet chirping of early morning swallows. 🐦🍯",
        "Knitting a warm woolen scarf for the upcoming winter months. 🧣🧶",
        "Took a gentle, restorative walk down the old dirt track. 🍃👣"
      ];
      
      setTimeout(() => {
        const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
        onTranscript(randomTemplate);
        setIsDictating(false);
        triggerPipSpeech("Typewriter memory written successfully with cheerful emojis! 📝✨");
      }, 1500);
      return;
    }

    if (isDictating) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsDictating(false);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsDictating(true);
        setDictationError(null);
        triggerPipSpeech("I'm listening! Speak clearly into your microphone... 🎙️");
      };

      rec.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        
        // Auto-insert cheerful emojis based on topics!
        let enhancedText = resultText;
        const emojiMap: { [key: string]: string } = {
          'dog': '🐾🐶', 'cat': '🐱🐾', 'rabbit': '🐰🥕', 'bird': '🐦🌸',
          'walk': '👣🍃', 'path': '🗺️🌲', 'bench': '🪵🪑', 'nature': '🌳🌺',
          'garden': '🌸🌻', 'cook': '🍳🍲', 'recipe': '📖🍳', 'bake': '🥧🥧',
          'cake': '🍰🧁', 'tea': '☕', 'coffee': '☕🍪', 'happy': '😊✨',
          'love': '❤️✨', 'beautiful': '🌸🌟', 'knit': '🧶🧣', 'wood': '🔨🪵',
          'craft': '🎨✂️', 'friend': '🤝❤️', 'memory': '📸📜', 'recollect': '💭⌛'
        };

        const words = enhancedText.toLowerCase();
        let appendedEmojis = '';
        Object.keys(emojiMap).forEach(key => {
          if (words.includes(key)) {
            appendedEmojis += ' ' + emojiMap[key];
          }
        });

        if (!appendedEmojis) {
          appendedEmojis = ' 😊🌸';
        }

        const completedText = resultText.trim() + appendedEmojis;
        onTranscript(completedText);
        triggerPipSpeech(`Transcribed: "${completedText}" 🎙️💖`);
      };

      rec.onerror = (e: any) => {
        console.error('Dictation error:', e);
        setDictationError(e.error || 'Mic issues');
        setIsDictating(false);
        
        // fallback simulated typist
        triggerPipSpeech("Microphone had a small hiccups. Let me insert a cozy seasonal memory for you! 🌸");
        const fallbackMemories = [
          "Feeling grateful for this beautiful afternoon sunshine. ☀️🌿",
          "Watching the golden leaves float gently down the creek. 🍂🌊",
          "Sharing coffee and memories with an old dear friend. ☕❤️"
        ];
        onTranscript(fallbackMemories[Math.floor(Math.random() * fallbackMemories.length)]);
      };

      rec.onend = () => {
        setIsDictating(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error(err);
      setIsDictating(false);
    }
  };

  // Keyboard Navigation Handlers
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Spacebar smooth scrolling (scroll down by 250px)
      if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        window.scrollBy({ top: 250, behavior: 'smooth' });
        triggerPipSpeech("Scrolling down smoothly for you! 📜");
      }
      // Shift + Space scrolls up
      if (e.code === 'Space' && e.shiftKey && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        window.scrollBy({ top: -250, behavior: 'smooth' });
        triggerPipSpeech("Scrolling back up! 📜");
      }
      // Press Escape to cancel any reading, close pip or reset magnifier
      if (e.code === 'Escape') {
        stopSpeaking();
        setMagnifierTarget(null);
        setShowMascotBubble(false);
      }
      // Enter on a high-contrast focus can smile or cheer (custom helper trigger)
      if (e.code === 'KeyE' && e.altKey) {
        setIsEasyMode(!isEasyMode);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEasyMode]);

  // Global Pointer Magnifier Listener
  React.useEffect(() => {
    if (!isMagnifierEnabled) {
      setTimeout(() => setMagnifierTarget(null), 0);
      return;
    }

    const handlePointerMove = (e: PointerEvent) => {
      setMagnifierPos({ x: e.clientX, y: e.clientY });

      // Check if pointer is over an image or element with "magnifiable" class
      const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
      if (target) {
        const imgElement = target.tagName === 'IMG' ? (target as HTMLImageElement) : target.closest('img');
        const magnifiableParent = target.closest('.magnifiable');
        
        if (imgElement && imgElement.src) {
          const rect = imgElement.getBoundingClientRect();
          setMagnifierTarget({ src: imgElement.src, rect });
        } else if (magnifiableParent) {
          // Can also magnify custom components if needed
          const rect = magnifiableParent.getBoundingClientRect();
          // We can generate a preview of text/container
          setMagnifierTarget({ src: '', rect });
        } else {
          setMagnifierTarget(null);
        }
      } else {
        setMagnifierTarget(null);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [isMagnifierEnabled]);

  // Read Aloud click listener for body text
  React.useEffect(() => {
    if (!isReadAloudEnabled) return;

    const handleTextClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Only read if it is a readable element with content (h1, h2, h3, p, span, li, blockquote)
      // and not an input, textarea, button or link unless requested
      const readableTags = ['H1', 'H2', 'H3', 'H4', 'P', 'SPAN', 'LI', 'BLOCKQUOTE', 'ARTICLE'];
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.closest('button');
      
      if (readableTags.includes(target.tagName) && !isInput) {
        const textToSpeak = target.innerText || target.textContent;
        if (textToSpeak && textToSpeak.trim().length > 2) {
          e.stopPropagation();
          speak(textToSpeak.trim());
        }
      }
    };

    window.addEventListener('click', handleTextClick, true);
    return () => window.removeEventListener('click', handleTextClick, true);
  }, [isReadAloudEnabled]);

  return (
    <AccessibilityContext.Provider value={{
      theme, setTheme,
      isEasyMode, setIsEasyMode,
      isQuietMode, setIsQuietMode,
      isMagnifierEnabled, setIsMagnifierEnabled,
      isReadAloudEnabled, setIsReadAloudEnabled,
      isSteadyPressEnabled, setIsSteadyPressEnabled,
      stablePress,
      triggerUndo, undoAction, clearUndo,
      speak, stopSpeaking, isSpeaking,
      startDictation, isDictating, dictationError,
      mascotSpeech, setMascotSpeech: triggerPipSpeech,
      showMascotBubble, setShowMascotBubble
    }}>
      {/* Root wrapper styled by theme */}
      <div className={cn(
        "min-h-screen w-full transition-colors duration-300",
        theme === 'cozy-paper' && "bg-[#FAF7F0] text-stone-900 selection:bg-amber-100",
        theme === 'contrast' && "bg-[#000000] text-white selection:bg-teal-950 selection:text-teal-300",
        theme === 'dark' && "bg-[#070A13] text-slate-100 selection:bg-violet-950"
      )}>
        
        {/* Inject customized typography classes based on theme/easy mode */}
        <div className={cn(
          "w-full min-h-screen flex flex-col",
          theme === 'cozy-paper' && "font-serif text-[18px] leading-relaxed",
          theme === 'contrast' && "font-mono text-[16px] leading-normal tracking-wide",
          theme === 'dark' && "font-sans text-[14px]",
          isEasyMode && "text-[19px] md:text-[21px] font-bold leading-loose tracking-wide"
        )}>
          {children}
        </div>

        {/* ========================================================
            1. GLOBAL ACCESS ACCESSIBILITY TOOLBAR (FLOATING COZY RAIL)
            ======================================================== */}
        <div className="fixed bottom-24 right-6 flex flex-col gap-3 z-50 items-end pointer-events-none">
          <AnimatePresence>
            {/* Mascot Pip Speech Bubble */}
            {showMascotBubble && (
              <motion.div 
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className={cn(
                  "pointer-events-auto max-w-[280px] p-4 rounded-xl shadow-2xl border flex flex-col gap-2 relative",
                  theme === 'cozy-paper' && "bg-[#FAF7F0] border-amber-800/30 text-stone-800",
                  theme === 'contrast' && "bg-black border-2 border-teal-400 text-teal-400 font-bold",
                  theme === 'dark' && "bg-slate-900/95 backdrop-blur border-slate-800 text-slate-200"
                )}
              >
                {/* Speech tail */}
                <div className={cn(
                  "absolute bottom-[-8px] right-6 w-4 h-4 rotate-45 border-r border-b",
                  theme === 'cozy-paper' && "bg-[#FAF7F0] border-amber-800/30",
                  theme === 'contrast' && "bg-black border-teal-400 border-2",
                  theme === 'dark' && "bg-slate-900 border-slate-800"
                )} />

                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase font-bold tracking-[0.15em] text-teal-500">Neighbor Assistant</span>
                  <button 
                    onClick={() => setShowMascotBubble(false)}
                    className="p-0.5 rounded-full hover:bg-slate-800/50 text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className={cn(
                  "text-xs leading-relaxed",
                  isEasyMode && "text-sm font-bold"
                )}>
                  {mascotSpeech}
                </p>

                {isSpeaking && (
                  <div className="flex items-center gap-2 mt-1 py-1 px-2 rounded bg-teal-500/15 border border-teal-500/30 text-teal-400">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Speaking Aloud</span>
                    <button 
                      onClick={stopSpeaking}
                      className="ml-auto text-[9px] font-bold text-teal-300 hover:underline"
                    >
                      Stop
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Interactive Mascot Pip Widget Button */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setShowMascotBubble(!showMascotBubble);
              if (!showMascotBubble) {
                const welcomes = [
                  "Hello neighbor! Need some cozy help? I can turn on Easy Mode, read text out loud, or zoom in on beautiful photos! 🐦☕",
                  "I hope you're having an absolutely restful day. Remember, you can press Spacebar to scroll down smoothly!",
                  "Did you know? If you make a mistake, look out for the 'Whoops! Go Back' undo helper!",
                  "Let's explore crafts or listen to some warm crackling hearth streams today!"
                ];
                setMascotSpeech(welcomes[Math.floor(Math.random() * welcomes.length)]);
              }
            }}
            className={cn(
              "pointer-events-auto w-14 h-14 rounded-full shadow-2xl border flex items-center justify-center cursor-pointer group relative",
              theme === 'cozy-paper' && "bg-[#e8dec9] hover:bg-[#ded1b7] border-amber-800/40 text-amber-900",
              theme === 'contrast' && "bg-black border-2 border-teal-400 text-teal-400 hover:bg-teal-950/40",
              theme === 'dark' && "bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-violet-500/20 text-white"
            )}
          >
            {/* Animated Bluebird Icon */}
            <span className="text-2xl group-hover:animate-bounce">🐦</span>
            
            {/* Aura ring */}
            <div className="absolute inset-0 rounded-full border border-teal-400/30 scale-110 group-hover:scale-120 animate-pulse" />
          </motion.button>
        </div>

        {/* ========================================================
            2. MAGNIFYING GLASS FLOAT PREVIEW (GLOBAL LENS OVERLAY)
            ======================================================== */}
        <AnimatePresence>
          {isMagnifierEnabled && magnifierTarget && (
            <div 
              className="fixed pointer-events-none z-50 rounded-full overflow-hidden shadow-[0_0_30px_rgba(20,184,166,0.6)] border-4 border-teal-400"
              style={{
                width: '180px',
                height: '180px',
                left: `${magnifierPos.x - 90}px`,
                top: `${magnifierPos.y - 90}px`,
                transform: 'translate(0, 0)',
                display: magnifierTarget.src ? 'block' : 'none'
              }}
            >
              {magnifierTarget.src && (
                <div 
                  className="w-full h-full bg-no-repeat"
                  style={{
                    backgroundImage: `url(${magnifierTarget.src})`,
                    backgroundSize: `${magnifierTarget.rect.width * 2.5}px ${magnifierTarget.rect.height * 2.5}px`,
                    backgroundPosition: `-${(magnifierPos.x - magnifierTarget.rect.left) * 2.5 - 90}px -${(magnifierPos.y - magnifierTarget.rect.top) * 2.5 - 90}px`
                  }}
                />
              )}
            </div>
          )}
        </AnimatePresence>

        {/* ========================================================
            3. "WHOOPS! GO BACK" UNDO BUTTON OVERLAY (5s TIMEOUT)
            ======================================================== */}
        <AnimatePresence>
          {undoAction && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.95 }}
                className={cn(
                  "pointer-events-auto p-4 rounded-xl shadow-2xl border flex items-center justify-between gap-4 w-full",
                  theme === 'cozy-paper' && "bg-[#FAF7F0] border-amber-900/40 text-stone-900",
                  theme === 'contrast' && "bg-black border-2 border-yellow-400 text-white font-mono",
                  theme === 'dark' && "bg-slate-900 border-slate-800 text-slate-100"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 flex-shrink-0">
                    <Undo2 className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold leading-tight">Whoops! Made a mistake?</span>
                    <span className="text-[10px] font-medium text-slate-500 truncate mt-0.5">{undoAction.label}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExecuteUndo}
                    className="flex items-center gap-1.5 py-2 px-4 rounded-lg bg-teal-500 text-slate-950 font-bold text-xs shadow-md hover:bg-teal-400 transition-colors cursor-pointer"
                  >
                    <CornerDownLeft className="w-3.5 h-3.5" />
                    <span>Undo ({undoCountdown}s)</span>
                  </button>
                  <button
                    onClick={clearUndo}
                    className="p-2 rounded-lg hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </AccessibilityContext.Provider>
  );
}
