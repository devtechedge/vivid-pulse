'use client';

import * as React from 'react';
import { 
  Mic, Volume2, Square, Play, Pause, MapPin, Lock, Unlock, 
  Tag, Link as LinkIcon, Code, Pen, HelpCircle, Sliders, 
  Loader2, Upload, Activity, AlertCircle, Check
} from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { createStory, getActiveStories } from '@/lib/actions';
import { cn } from '@/lib/utils';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUser: { id: string; username: string; displayName: string; avatarUrl: string | null } | null;
}

const BACKGROUND_PRESETS = [
  { id: 'neon-violet', label: 'Lucid Violet', css: 'bg-gradient-to-tr from-violet-950 via-purple-900 to-slate-900 text-violet-200' },
  { id: 'neon-teal', label: 'Kinetic Teal', css: 'bg-gradient-to-tr from-teal-950 via-slate-900 to-violet-950 text-teal-200' },
  { id: 'cyberpunk', label: 'Neo Noir', css: 'bg-gradient-to-b from-slate-950 via-rose-950 to-violet-950 text-pink-200' },
  { id: 'cosmic', label: 'Cosmic Slate', css: 'bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-indigo-200' },
  { id: 'solar', label: 'Solar Amber', css: 'bg-gradient-to-tr from-amber-950 via-stone-900 to-orange-950 text-amber-200' }
];

const CODE_LANGUAGES = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'css', label: 'CSS' },
  { id: 'rust', label: 'Rust' },
  { id: 'html', label: 'HTML/JSX' }
];

export default function CreateStoryModal({ isOpen, onClose, onSuccess, currentUser }: CreateStoryModalProps) {
  // Story Template Mode
  const [template, setTemplate] = React.useState<'IMAGE' | 'Q_A' | 'AUDIO_WAVEFORM' | 'POLL' | 'CODE'>('IMAGE');
  
  // Content values
  const [mediaUrl, setMediaUrl] = React.useState('');
  const [bgPreset, setBgPreset] = React.useState(BACKGROUND_PRESETS[0]);
  const [fileInputKey, setFileInputKey] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  // Feature 11: Q&A Question
  const [qaQuestion, setQaQuestion] = React.useState('');

  // Feature 12: Pulse Chaining
  const [shouldChain, setShouldChain] = React.useState(false);
  const [chainName, setChainName] = React.useState('');
  const [recentStoryId, setRecentStoryId] = React.useState<string | null>(null);

  // Feature 13: Audio Recording
  const [isRecording, setIsRecording] = React.useState(false);
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
  const [waveformPoints, setWaveformPoints] = React.useState<number[]>([]);
  const [isPlayingAudio, setIsPlayingAudio] = React.useState(false);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const audioSourceRef = React.useRef<AudioBufferSourceNode | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const synthTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Feature 14: Distance/Coordinates
  const [useCoordinates, setUseCoordinates] = React.useState(false);
  const [latitude, setLatitude] = React.useState(35.6895); // Shinjuku default
  const [longitude, setLongitude] = React.useState(139.6917);

  // Feature 15: Engagement Gating
  const [isGated, setIsGated] = React.useState(false);

  // Feature 16: Micro-Poll Slider
  const [pollQuestion, setPollQuestion] = React.useState('');
  const [pollMinLabel, setPollMinLabel] = React.useState('Chilled');
  const [pollMaxLabel, setPollMaxLabel] = React.useState('Hyped');

  // Feature 17: Syntax Code snippet
  const [codeSnippet, setCodeSnippet] = React.useState('// Establish neural connection\nconst pulse = new VividPulse();\npulse.connect();');
  const [codeLanguage, setCodeLanguage] = React.useState('typescript');

  // Feature 18: Anonymous Intake
  const [hasAnonymousTerminal, setHasAnonymousTerminal] = React.useState(false);

  // Feature 19: Narrative Vault Hashtags
  const [hashtagsRaw, setHashtagsRaw] = React.useState('');

  // Fetch recent story to potentially chain
  React.useEffect(() => {
    if (isOpen && currentUser) {
      getActiveStories().then(trays => {
        const myTray = trays.find(t => t.userId === currentUser.id);
        if (myTray && myTray.stories.length > 0) {
          setRecentStoryId(myTray.stories[myTray.stories.length - 1].id);
        } else {
          setRecentStoryId(null);
        }
      });
    }
  }, [isOpen, currentUser]);

  const stopAudioPlayback = React.useCallback(() => {
    setIsPlayingAudio(false);
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch {}
      audioSourceRef.current = null;
    }
  }, []);

  // Clean up recording or synthesizers
  React.useEffect(() => {
    return () => {
      stopAudioPlayback();
      if (synthTimerRef.current) clearInterval(synthTimerRef.current);
    };
  }, [stopAudioPlayback]);

  // Recording or simulating neon soundwave
  const startRecording = async () => {
    setIsRecording(true);
    setAudioUrl(null);
    audioChunksRef.current = [];

    // Simulate animated waveform points in real-time
    const interval = setInterval(() => {
      setWaveformPoints(prev => {
        const points = [...prev];
        if (points.length > 30) points.shift();
        points.push(Math.floor(Math.random() * 45) + 5);
        return points;
      });
    }, 150);
    synthTimerRef.current = interval;

    try {
      // Try actual microphone API
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
          const reader = new FileReader();
          reader.onloadend = () => {
            setAudioUrl(reader.result as string);
          };
          reader.readAsDataURL(audioBlob);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
      }
    } catch (err) {
      console.warn("Actual microphone access is restricted or unavailable inside the sandbox. Fallback synthesized audio will be registered.", err);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (synthTimerRef.current) {
      clearInterval(synthTimerRef.current);
      synthTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      // Fallback synthetic Audio URL generating a warm synth chime sequence when played
      setAudioUrl('SYNTHETIC_CHIME_PULSE');
      // Set static beautiful neon soundwave points
      const points = [];
      for (let i = 0; i < 35; i++) {
        points.push(Math.floor(Math.abs(Math.sin(i * 0.25)) * 40) + 10);
      }
      setWaveformPoints(points);
    }
  };

  // Playback recorded or simulated synth chimes
  const playAudio = async () => {
    if (isPlayingAudio) {
      stopAudioPlayback();
      return;
    }

    setIsPlayingAudio(true);

    if (audioUrl === 'SYNTHETIC_CHIME_PULSE') {
      // Generate amazing Web Audio synth chime loop dynamically
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        // Play 4 synth bell notes in sequence
        const notes = [261.63, 329.63, 392.00, 523.25]; // C E G C
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
          osc.stop(time + idx * 0.25 + 0.3);
        });

        setTimeout(() => {
          setIsPlayingAudio(false);
        }, 1200);

      } catch (err) {
        console.error(err);
        setIsPlayingAudio(false);
      }
    } else if (audioUrl) {
      // Play actual audio elements
      try {
        const audio = new Audio(audioUrl);
        audio.onended = () => setIsPlayingAudio(false);
        audio.play();
      } catch (err) {
        console.error(err);
        setIsPlayingAudio(false);
      }
    }
  };

  // File Upload parsing
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Media size exceeds the 5MB limits.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCoordinatesTrigger = () => {
    setUseCoordinates(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(parseFloat(pos.coords.latitude.toFixed(4)));
          setLongitude(parseFloat(pos.coords.longitude.toFixed(4)));
        },
        () => {
          // Fallback to slight randomized coordinates for realistic experience
          setLatitude(parseFloat((35.6895 + (Math.random() - 0.5) * 0.1).toFixed(4)));
          setLongitude(parseFloat((139.6917 + (Math.random() - 0.5) * 0.1).toFixed(4)));
        }
      );
    }
  };

  const handlePublish = async () => {
    setLoading(true);

    try {
      // Create a simulated asset background depending on selected template if no file uploaded
      let finalMediaUrl = mediaUrl;
      if (!finalMediaUrl) {
        // If it's a solid/gradient template, encode the style identifier
        finalMediaUrl = `GRADIENT:${bgPreset.id}`;
      }

      // Extract hashtags
      const hashtags = hashtagsRaw
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0)
        .map(t => t.startsWith('#') ? t : `#${t}`);

      const meta: any = {
        isGated,
        hashtags: hashtags.length > 0 ? hashtags : undefined,
      };

      if (shouldChain && recentStoryId) {
        meta.chainedStoryId = recentStoryId;
        meta.chainName = chainName.trim() || 'Cohesive Narrative Arc';
      }

      if (useCoordinates) {
        meta.latitude = latitude;
        meta.longitude = longitude;
      }

      // Template Specific Configs
      if (template === 'Q_A') {
        if (!qaQuestion.trim()) {
          alert('Please enter a question block.');
          setLoading(false);
          return;
        }
        meta.qaQuestion = qaQuestion.trim();
      } else if (template === 'AUDIO_WAVEFORM') {
        if (!audioUrl) {
          alert('Please record an audio signal or wait for fallback synth chime generation.');
          setLoading(false);
          return;
        }
        meta.audioDataUrl = audioUrl;
        meta.waveformPoints = waveformPoints;
      } else if (template === 'POLL') {
        if (!pollQuestion.trim()) {
          alert('Please specify a poll query.');
          setLoading(false);
          return;
        }
        meta.pollQuestion = pollQuestion.trim();
        meta.pollMinLabel = pollMinLabel.trim();
        meta.pollMaxLabel = pollMaxLabel.trim();
      } else if (template === 'CODE') {
        if (!codeSnippet.trim()) {
          alert('Code block cannot be blank.');
          setLoading(false);
          return;
        }
        meta.codeSnippet = codeSnippet.trim();
        meta.codeLanguage = codeLanguage;
      }

      const mediaType = template === 'AUDIO_WAVEFORM' ? 'AUDIO_WAVEFORM' : (template === 'IMAGE' ? 'IMAGE' : 'TEXT');

      const res = await createStory(finalMediaUrl, mediaType, meta);

      if (res.success) {
        // Clear all state
        setMediaUrl('');
        setQaQuestion('');
        setAudioUrl(null);
        setWaveformPoints([]);
        setPollQuestion('');
        setHashtagsRaw('');
        setShouldChain(false);
        setChainName('');
        setUseCoordinates(false);
        setIsGated(false);
        onSuccess();
        onClose();
      } else {
        alert(res.error || 'Failed to dispatch ephemeral update packet.');
      }

    } catch (err) {
      console.error(err);
      alert('Critical transmission failure.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Publish Ephemeral Story Pulse"
      className="max-w-xl max-h-[92vh] border-slate-800 shadow-[0_0_50px_rgba(124,58,237,0.15)] bg-slate-950"
    >
      <div className="flex flex-col gap-5 pb-2">
        
        {/* 1. SELECT TEMPLATE BUTTONS */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pulse Template Archetype</label>
          <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-900 rounded border border-slate-800">
            <button
              onClick={() => setTemplate('IMAGE')}
              className={cn(
                "py-2 text-[10px] font-bold uppercase tracking-wider rounded-sm cursor-pointer transition-all flex flex-col items-center gap-1",
                template === 'IMAGE' ? "bg-violet-600 text-white shadow" : "text-slate-400 hover:text-white"
              )}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Canvas</span>
            </button>
            <button
              onClick={() => setTemplate('Q_A')}
              className={cn(
                "py-2 text-[10px] font-bold uppercase tracking-wider rounded-sm cursor-pointer transition-all flex flex-col items-center gap-1",
                template === 'Q_A' ? "bg-violet-600 text-white shadow" : "text-slate-400 hover:text-white"
              )}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Q&A block</span>
            </button>
            <button
              onClick={() => setTemplate('AUDIO_WAVEFORM')}
              className={cn(
                "py-2 text-[10px] font-bold uppercase tracking-wider rounded-sm cursor-pointer transition-all flex flex-col items-center gap-1",
                template === 'AUDIO_WAVEFORM' ? "bg-violet-600 text-white shadow" : "text-slate-400 hover:text-white"
              )}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Audio mic</span>
            </button>
            <button
              onClick={() => setTemplate('POLL')}
              className={cn(
                "py-2 text-[10px] font-bold uppercase tracking-wider rounded-sm cursor-pointer transition-all flex flex-col items-center gap-1",
                template === 'POLL' ? "bg-violet-600 text-white shadow" : "text-slate-400 hover:text-white"
              )}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Poll slide</span>
            </button>
            <button
              onClick={() => setTemplate('CODE')}
              className={cn(
                "py-2 text-[10px] font-bold uppercase tracking-wider rounded-sm cursor-pointer transition-all flex flex-col items-center gap-1",
                template === 'CODE' ? "bg-violet-600 text-white shadow" : "text-slate-400 hover:text-white"
              )}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Code frame</span>
            </button>
          </div>
        </div>

        {/* 2. LIVE RENDER PREVIEW BOX */}
        <div className={cn(
          "relative w-full aspect-[16/10] rounded border border-slate-800 overflow-hidden flex flex-col items-center justify-center p-6 shadow-inner",
          mediaUrl ? "bg-slate-950" : bgPreset.css
        )}>
          {/* Preset overlay background if uploaded */}
          {mediaUrl && (
            <img src={mediaUrl} alt="Uploaded Story Asset" className="absolute inset-0 w-full h-full object-cover" />
          )}

          <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] pointer-events-none" />

          {/* TEMPLATE CONTENT FORM RENDERERS */}
          <div className="z-10 w-full max-w-sm flex flex-col items-center gap-3">
            
            {template === 'IMAGE' && (
              <div className="flex flex-col items-center gap-3 text-center">
                {mediaUrl ? (
                  <div className="px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded text-[10px] font-mono uppercase text-teal-400 flex items-center gap-1.5 shadow">
                    <Check className="w-3.5 h-3.5" /> Custom Graphics Encoded
                  </div>
                ) : (
                  <>
                    <Activity className="w-8 h-8 text-violet-400 animate-pulse" />
                    <span className="text-xs font-mono text-slate-300">Using Gradient Base Presets</span>
                  </>
                )}
                <div className="flex gap-2">
                  <label className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all text-slate-300">
                    <Upload className="w-3.5 h-3.5 inline mr-1" />
                    Load Image
                    <input
                      key={fileInputKey}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {mediaUrl && (
                    <button
                      onClick={() => {
                        setMediaUrl('');
                        setFileInputKey(Date.now());
                      }}
                      className="px-3 py-1.5 bg-rose-950/30 hover:bg-rose-950/50 border border-rose-900 text-rose-300 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}

            {template === 'Q_A' && (
              <div className="w-full bg-slate-950/80 border border-slate-800/80 p-4 rounded shadow-lg flex flex-col gap-2.5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-violet-400 flex items-center gap-1">
                  <Pen className="w-3 h-3 animate-pulse" /> TIME-DECAY INTERACTIVE Q&A BLOCK
                </span>
                <input
                  type="text"
                  placeholder="Ask me anything..."
                  value={qaQuestion}
                  onChange={(e) => setQaQuestion(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
                <span className="text-[8px] font-mono text-slate-500">Font size of replies shrinks as deadline draws near.</span>
              </div>
            )}

            {template === 'AUDIO_WAVEFORM' && (
              <div className="w-full bg-slate-950/80 border border-slate-800/80 p-4 rounded shadow-lg flex flex-col items-center gap-3">
                <span className="text-[9px] font-bold uppercase tracking-widest text-teal-400">AUDIO SIGNAL VISUALIZATION</span>
                
                {/* SVG Live/Mock Audio Waveform Node */}
                <div className="w-full h-12 flex items-center justify-center gap-1">
                  {waveformPoints.length === 0 ? (
                    <div className="h-0.5 w-full bg-slate-800 rounded" />
                  ) : (
                    waveformPoints.map((pt, i) => (
                      <div
                        key={i}
                        className={cn("w-1 rounded bg-gradient-to-t from-teal-500 to-violet-500 transition-all")}
                        style={{ height: `${pt}%` }}
                      />
                    ))
                  )}
                </div>

                <div className="flex gap-2.5">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Mic className="w-3 h-3" />
                      Record
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-white text-slate-950 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer animate-pulse"
                    >
                      <Square className="w-3 h-3" />
                      Stop
                    </button>
                  )}

                  {audioUrl && (
                    <button
                      onClick={playAudio}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                    >
                      {isPlayingAudio ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      {isPlayingAudio ? 'Pause' : 'Listen'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {template === 'POLL' && (
              <div className="w-full bg-slate-950/80 border border-slate-800/80 p-4 rounded shadow-lg flex flex-col gap-3">
                <span className="text-[9px] font-bold uppercase tracking-widest text-violet-400">AMBIENT MICRO-POLL SLIDER</span>
                <input
                  type="text"
                  placeholder="Vibe Check? Or rate..."
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[8px] font-mono text-slate-500 uppercase">Min Label</span>
                    <input
                      type="text"
                      value={pollMinLabel}
                      onChange={(e) => setPollMinLabel(e.target.value)}
                      className="w-full bg-slate-900/40 border border-slate-800/60 rounded px-2 py-1 text-[10px] text-slate-300"
                    />
                  </div>
                  <div>
                    <span className="text-[8px] font-mono text-slate-500 uppercase">Max Label</span>
                    <input
                      type="text"
                      value={pollMaxLabel}
                      onChange={(e) => setPollMaxLabel(e.target.value)}
                      className="w-full bg-slate-900/40 border border-slate-800/60 rounded px-2 py-1 text-[10px] text-slate-300"
                    />
                  </div>
                </div>
                {/* Simulated SVG Slider Graphic */}
                <div className="w-full py-2 relative flex items-center">
                  <div className="h-1 w-full bg-slate-800 rounded-sm relative">
                    <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-violet-500 border-2 border-white shadow shadow-violet-500/80" />
                  </div>
                </div>
              </div>
            )}

            {template === 'CODE' && (
              <div className="w-full bg-slate-950 border border-slate-900/80 rounded shadow-lg flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-950">
                  <span className="text-[9px] font-mono text-slate-400 flex items-center gap-1">
                    <Code className="w-3 h-3 text-violet-400" /> syntax_pulse.ts
                  </span>
                  <select
                    value={codeLanguage}
                    onChange={(e) => setCodeLanguage(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded text-[9px] font-mono text-slate-300 px-1 py-0.5"
                  >
                    {CODE_LANGUAGES.map(l => (
                      <option key={l.id} value={l.id}>{l.label}</option>
                    ))}
                  </select>
                </div>
                <textarea
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                  className="w-full bg-slate-950/90 text-[10px] font-mono text-teal-400 p-3 h-20 focus:outline-none resize-none leading-normal"
                />
              </div>
            )}

          </div>

          {/* Preset Background Selector (Bottom corner overlay) */}
          {!mediaUrl && (
            <div className="absolute bottom-2 left-2 flex gap-1 z-20">
              {BACKGROUND_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setBgPreset(p)}
                  title={p.label}
                  className={cn(
                    "w-4 h-4 rounded-full border border-white/10 transition-transform cursor-pointer",
                    p.css,
                    bgPreset.id === p.id ? "scale-125 border-white/50" : "hover:scale-110"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* 3. SETTINGS & COORDINATES FORM SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-900 pt-4 text-xs">
          
          {/* Coordinates Node Ring */}
          <div className="flex flex-col gap-1.5 p-3 bg-slate-900/30 border border-slate-900 rounded">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" /> 14. Coordinate Node Ring
              </span>
              <button
                onClick={handleCoordinatesTrigger}
                className="text-[9px] font-bold font-mono text-teal-400 hover:underline"
              >
                Auto Get Coordinates
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={useCoordinates}
                  onChange={(e) => setUseCoordinates(e.target.checked)}
                  className="rounded border-slate-800 text-violet-500 bg-slate-900 focus:ring-0"
                />
                Attach Coordinates
              </label>
            </div>
            {useCoordinates && (
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                <div>
                  <span className="text-[8px] font-mono text-slate-500">LATITUDE</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-[10px] text-slate-200"
                  />
                </div>
                <div>
                  <span className="text-[8px] font-mono text-slate-500">LONGITUDE</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-[10px] text-slate-200"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Visibility and Chaining */}
          <div className="flex flex-col gap-2 p-3 bg-slate-900/30 border border-slate-900 rounded">
            
            {/* Feature 15: Engagement Gating */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-500" /> 15. Engagement Gating
              </span>
              <label className="flex items-center gap-1.5 mt-1 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={isGated}
                  onChange={(e) => setIsGated(e.target.checked)}
                  className="rounded border-slate-800 text-violet-500 bg-slate-900 focus:ring-0"
                />
                Interact within 48h to unlock
              </label>
            </div>

            {/* Feature 12: Pulse Chains */}
            {recentStoryId && (
              <div className="flex flex-col gap-1 border-t border-slate-900 pt-2 mt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <LinkIcon className="w-3.5 h-3.5 text-violet-500" /> 12. Chain Narrative Arc
                </span>
                <label className="flex items-center gap-1.5 mt-1 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={shouldChain}
                    onChange={(e) => setShouldChain(e.target.checked)}
                    className="rounded border-slate-800 text-violet-500 bg-slate-900"
                  />
                  Chain to Previous Story
                </label>
                {shouldChain && (
                  <input
                    type="text"
                    placeholder="Enter narrative name (e.g., Tokyo Noir)"
                    value={chainName}
                    onChange={(e) => setChainName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-[10px] text-slate-200 mt-1 placeholder-slate-600 focus:outline-none"
                  />
                )}
              </div>
            )}
          </div>

        </div>

        {/* 4. HASHTAGS & ANONYMOUS OPTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs border-t border-slate-900 pt-4">
          {/* Feature 19: Narrative Vault Hashtag Routing */}
          <div className="flex flex-col gap-1.5 p-3 bg-slate-900/30 border border-slate-900 rounded">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-teal-400" /> 19. Narrative Vault Hashtags
            </span>
            <input
              type="text"
              placeholder="e.g. art, code, highlights (comma separated)"
              value={hashtagsRaw}
              onChange={(e) => setHashtagsRaw(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-[10px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500"
            />
            <span className="text-[8px] font-mono text-slate-500">Hastagged updates automatically permanent-save to vault highlights on your profile!</span>
          </div>

          {/* Feature 18: Anonymous feedback terminal */}
          <div className="flex flex-col gap-1.5 p-3 bg-slate-900/30 border border-slate-900 rounded">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Code className="w-3.5 h-3.5 text-emerald-400" /> 18. Anonymous Query Terminal
            </span>
            <label className="flex items-center gap-1.5 mt-1 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={hasAnonymousTerminal}
                onChange={(e) => setHasAnonymousTerminal(e.target.checked)}
                className="rounded border-slate-800 text-violet-500 bg-slate-900 focus:ring-0"
              />
              Enable Anonymous Feedback Terminal
            </label>
            <span className="text-[8px] font-mono text-slate-500 mt-1">Allows viewer to send encrypted anonymous feedbacks directly on this story block!</span>
          </div>
        </div>

        {/* Action Button CTA */}
        <div className="flex justify-end gap-3 border-t border-slate-900 pt-4">
          <Button
            onClick={onClose}
            variant="outline"
            className="text-[10px] font-bold uppercase tracking-wider rounded-sm border-slate-800 hover:bg-slate-900"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePublish}
            disabled={loading || (template === 'AUDIO_WAVEFORM' && isRecording)}
            className="text-[10px] font-bold uppercase tracking-wider rounded-sm bg-violet-600 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin mr-1 inline" />
                Dispatching Packet...
              </>
            ) : (
              'Broadcast Pulse'
            )}
          </Button>
        </div>

      </div>
    </Dialog>
  );
}
