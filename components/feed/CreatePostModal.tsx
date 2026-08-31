'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { createPost } from '@/lib/actions';
import { 
  Layers, Sparkles, Volume2, VolumeX, Tag, Users, Layout, 
  Trash2, Loader2, Plus, Sliders, MapPin, Image as ImageIcon, 
  FileText, Check, AlertTriangle, Play, Pause, Eye, Pen
} from 'lucide-react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { id: string; username: string; displayName: string; avatarUrl: string | null } | null;
}

// Define a simple pure helper outside the component to satisfy ESLint purity rules
function generateRainSamples(bufferSize: number): Float32Array {
  const data = new Float32Array(bufferSize);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return data;
}

// Interfaces for our rich features
interface FocalAnchor {
  x: number; // percentage
  y: number; // percentage
  category: string;
  label: string;
}

interface ImageEditState {
  originalUrl: string;
  editedUrl: string;
  filter: string;
  textOverlay: string;
  textColor: string;
  textSize: string;
  textPlacement: 'top' | 'center' | 'bottom';
  anchors: FocalAnchor[];
}

export default function CreatePostModal({ isOpen, onClose, currentUser }: CreatePostModalProps) {
  const router = useRouter();
  
  // Basic states
  const [caption, setCaption] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [mediaUrls, setMediaUrls] = React.useState<string[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

  // 1. ASYNC CANVAS & FILTER STATE
  const [editingImageIndex, setEditingImageIndex] = React.useState<number | null>(null);
  const [imageEdits, setImageEdits] = React.useState<Record<number, ImageEditState>>({});
  
  // Canvas editing controls
  const [activeFilter, setActiveFilter] = React.useState('none');
  const [textOverlay, setTextOverlay] = React.useState('');
  const [textColor, setTextColor] = React.useState('#ffffff');
  const [textSize, setTextSize] = React.useState('24px');
  const [textPlacement, setTextPlacement] = React.useState<'top' | 'center' | 'bottom'>('bottom');
  
  // 4. FOCAL ANCHORS STATE
  const [anchors, setAnchors] = React.useState<FocalAnchor[]>([]);
  const [newAnchorCat, setNewAnchorCat] = React.useState('Gear');
  const [newAnchorLabel, setNewAnchorLabel] = React.useState('');
  const [tempAnchorPos, setTempAnchorPos] = React.useState<{ x: number; y: number } | null>(null);

  // 3. AUDIO-LINKED IMAGERY
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
  const [audioTitle, setAudioTitle] = React.useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = React.useState(false);
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const audioNodesRef = React.useRef<any[]>([]);

  // 7. VECTOR TEXT PANEL (Markdown mini-blog)
  const [hasVectorPanel, setHasVectorPanel] = React.useState(false);
  const [vectorPanelText, setVectorPanelText] = React.useState('');

  // 8. LIVE CO-AUTHOR STATE
  const [coAuthorInput, setCoAuthorInput] = React.useState('');
  const [coAuthors, setCoAuthors] = React.useState<string[]>([]);
  const [coAuthorStatuses, setCoAuthorStatuses] = React.useState<Record<string, string>>({});

  // 10. GEOMETRIC LAYOUT STATE
  const [layoutMatrix, setLayoutMatrix] = React.useState<'normal' | 'asymmetric-split' | 'triptych'>('normal');

  // Sync co-author statuses mock timing
  React.useEffect(() => {
    if (coAuthors.length > 0) {
      coAuthors.forEach(author => {
        if (!coAuthorStatuses[author]) {
          setCoAuthorStatuses(prev => ({ ...prev, [author]: 'Invited' }));
          
          setTimeout(() => {
            setCoAuthorStatuses(prev => ({ ...prev, [author]: 'Added' }));
          }, 1500);
        }
      });
    }
  }, [coAuthors]);

  // Web Audio Synth loops for ambient premium audio loop simulation
  const startAudioPreview = (type: string) => {
    stopAudioPreview();
    
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;
      setIsPlayingPreview(true);

      if (type === 'cyber_drone') {
        // Deep drone synth
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const lowpass = ctx.createBiquadFilter();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(55, ctx.currentTime); // Low A

        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(55.5, ctx.currentTime); // Detuned

        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(120, ctx.currentTime);

        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);

        osc1.connect(lowpass);
        osc2.connect(lowpass);
        lowpass.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start();
        osc2.start();
        audioNodesRef.current = [osc1, osc2, gainNode];
      } else if (type === 'neon_synth') {
        // Pulsing synth bass
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(110, ctx.currentTime); // A2

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, ctx.currentTime);

        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);

        // Create LFO to modulate filter
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(4, ctx.currentTime); // 4Hz Pulse
        lfoGain.gain.setValueAtTime(150, ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        
        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start();
        lfo.start();
        audioNodesRef.current = [osc, lfo, gainNode];
      } else if (type === 'rainy_jazz') {
        // White noise rain with retro chords
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        output.set(generateRainSamples(bufferSize));

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 800;
        filter.Q.value = 1.0;

        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.04; // quiet rain

        whiteNoise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        whiteNoise.start();

        // Add slow chord pads
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 220; // A3
        const padGain = ctx.createGain();
        padGain.gain.value = 0.08;

        osc.connect(padGain);
        padGain.connect(ctx.destination);
        osc.start();

        audioNodesRef.current = [whiteNoise, osc, noiseGain, padGain];
      } else if (type === 'vapor_echo') {
        // High soft ambient pad
        const osc = ctx.createOscillator();
        const delay = ctx.createDelay();
        const feedback = ctx.createGain();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime); // A4

        delay.delayTime.value = 0.4;
        feedback.gain.value = 0.5;
        gain.gain.value = 0.1;

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
      console.error('Audio synthesis failed:', e);
    }
  };

  const stopAudioPreview = () => {
    setIsPlayingPreview(false);
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

  // Clean up Audio on close
  React.useEffect(() => {
    return () => {
      stopAudioPreview();
    };
  }, []);

  const handleAudioSelection = (id: string, title: string) => {
    if (audioUrl === id) {
      // Toggle off
      setAudioUrl(null);
      setAudioTitle(null);
      stopAudioPreview();
    } else {
      setAudioUrl(id);
      setAudioTitle(title);
      startAudioPreview(id);
    }
  };

  // 10. File Ingestion & base64
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError('');

    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          setError('Images must be smaller than 5MB.');
          continue;
        }

        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        urls.push(base64);
      }
      
      const newUrls = [...mediaUrls, ...urls];
      setMediaUrls(newUrls);

      // Initialize default edits
      const updatedEdits = { ...imageEdits };
      newUrls.forEach((url, idx) => {
        if (!updatedEdits[idx]) {
          updatedEdits[idx] = {
            originalUrl: url,
            editedUrl: url,
            filter: 'none',
            textOverlay: '',
            textColor: '#ffffff',
            textSize: '24px',
            textPlacement: 'bottom',
            anchors: []
          };
        }
      });
      setImageEdits(updatedEdits);
    } catch (err) {
      setError('Failed to load picture.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeMedia = (index: number) => {
    const updatedUrls = mediaUrls.filter((_, i) => i !== index);
    setMediaUrls(updatedUrls);
    
    // Shift image edits
    const updatedEdits: Record<number, ImageEditState> = {};
    updatedUrls.forEach((url, i) => {
      // Find previous mapped edit
      const prevIndex = i >= index ? i + 1 : i;
      if (imageEdits[prevIndex]) {
        updatedEdits[i] = imageEdits[prevIndex];
      } else {
        updatedEdits[i] = {
          originalUrl: url,
          editedUrl: url,
          filter: 'none',
          textOverlay: '',
          textColor: '#ffffff',
          textSize: '24px',
          textPlacement: 'bottom',
          anchors: []
        };
      }
    });
    setImageEdits(updatedEdits);
  };

  // Open Canvas Editor
  const openCanvasEditor = (index: number) => {
    setEditingImageIndex(index);
    const state = imageEdits[index];
    if (state) {
      setActiveFilter(state.filter);
      setTextOverlay(state.textOverlay);
      setTextColor(state.textColor);
      setTextSize(state.textSize);
      setTextPlacement(state.textPlacement);
      setAnchors(state.anchors);
    } else {
      setActiveFilter('none');
      setTextOverlay('');
      setTextColor('#ffffff');
      setTextSize('24px');
      setTextPlacement('bottom');
      setAnchors([]);
    }
    setTempAnchorPos(null);
    setNewAnchorLabel('');
  };

  // Render processed image in the background canvas and commit
  const commitCanvasEdits = async () => {
    if (editingImageIndex === null) return;
    const index = editingImageIndex;
    const editState = imageEdits[index];
    if (!editState) return;

    // Build the canvas
    const img = new Image();
    img.src = editState.originalUrl;
    
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw base image
    ctx.drawImage(img, 0, 0);

    // Apply filter context effects manually so it is backed in the pixel buffer
    if (activeFilter === 'noir') {
      // High contrast deep slate
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];
        let v = (0.2126 * r + 0.7152 * g + 0.0722 * b);
        // High contrast curves
        v = v < 128 ? (v * v) / 128 : 255 - ((255 - v) * (255 - v)) / 128;
        data[i] = v * 0.8;       // deep blacks
        data[i+1] = v * 0.85;    // slate tint
        data[i+2] = v * 1.0;     // subtle cold blue
      }
      ctx.putImageData(imgData, 0, 0);
    } else if (activeFilter === 'cyber') {
      // Violet and pink glow tint
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * 1.2 + 30); // boost reds
        data[i+1] = data[i+1] * 0.8;                // dim greens
        data[i+2] = Math.min(255, data[i+2] * 1.4 + 40); // boost blues (purple tone)
      }
      ctx.putImageData(imgData, 0, 0);
    } else if (activeFilter === 'matrix') {
      // Green phosphor terminal overlay
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const grayscale = (data[i] + data[i+1] + data[i+2]) / 3;
        data[i] = grayscale * 0.2;
        data[i+1] = grayscale * 1.3; // intense green
        data[i+2] = grayscale * 0.2;
      }
      ctx.putImageData(imgData, 0, 0);
    } else if (activeFilter === 'amber') {
      // Warm nostalgic warm glow
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * 1.3 + 20); // Amber warm red
        data[i+1] = Math.min(255, data[i+1] * 1.1 + 10); // Warm yellow
        data[i+2] = data[i+2] * 0.7; // Cold dim
      }
      ctx.putImageData(imgData, 0, 0);
    }

    // Add translucent noise texture for cinematic vibe
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let i = 0; i < 500; i++) {
      const rx = Math.random() * canvas.width;
      const ry = Math.random() * canvas.height;
      const rSize = Math.random() * 2 + 1;
      ctx.fillRect(rx, ry, rSize, rSize);
    }

    // Draw vector text layer directly
    if (textOverlay.trim()) {
      ctx.fillStyle = textColor;
      const finalFontSize = parseInt(textSize) * (canvas.width / 500); // Scale with resolution
      ctx.font = `bold ${finalFontSize}px var(--font-sans), sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Shadow for maximum contrast readability
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;

      let yPos = canvas.height * 0.85;
      if (textPlacement === 'top') yPos = canvas.height * 0.15;
      if (textPlacement === 'center') yPos = canvas.height * 0.5;

      ctx.fillText(textOverlay.trim(), canvas.width / 2, yPos);
    }

    const exportedUrl = canvas.toDataURL('image/jpeg', 0.9);
    
    // Update state
    setImageEdits(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        editedUrl: exportedUrl,
        filter: activeFilter,
        textOverlay,
        textColor,
        textSize,
        textPlacement,
        anchors: anchors
      }
    }));

    // Re-assign in the active media list
    setMediaUrls(prev => {
      const copy = [...prev];
      copy[index] = exportedUrl;
      return copy;
    });

    setEditingImageIndex(null);
  };

  // Coordinate Click Tagging Focal Anchors
  const handleImageCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setTempAnchorPos({ x, y });
    setNewAnchorLabel('');
  };

  const addAnchor = () => {
    if (!tempAnchorPos || !newAnchorLabel.trim()) return;
    const nextAnchor: FocalAnchor = {
      x: tempAnchorPos.x,
      y: tempAnchorPos.y,
      category: newAnchorCat,
      label: newAnchorLabel.trim()
    };
    setAnchors(prev => [...prev, nextAnchor]);
    setTempAnchorPos(null);
    setNewAnchorLabel('');
  };

  const removeAnchor = (idx: number) => {
    setAnchors(prev => prev.filter((_, i) => i !== idx));
  };

  // Co-author binding
  const addCoAuthor = () => {
    const trimmed = coAuthorInput.replace('@', '').trim();
    if (!trimmed) return;
    if (coAuthors.includes(trimmed)) {
      setCoAuthorInput('');
      return;
    }
    setCoAuthors(prev => [...prev, trimmed]);
    setCoAuthorInput('');
  };

  const removeCoAuthor = (author: string) => {
    setCoAuthors(prev => prev.filter(a => a !== author));
    const nextStatuses = { ...coAuthorStatuses };
    delete nextStatuses[author];
    setCoAuthorStatuses(nextStatuses);
  };

  // Final Publish execution
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mediaUrls.length === 0) {
      setError('Please add at least one picture.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    stopAudioPreview();

    try {
      // Extrapolate average structural color profile palette for Feature 6 (Dynamic Color Frame)
      const colors = ['#7c3aed', '#2dd4bf', '#f43f5e']; // Fallbacks
      const palettes: string[] = [];
      
      // Draw first canvas thumbnail to retrieve exact RGB
      if (mediaUrls[0]) {
        const firstImg = new Image();
        firstImg.src = mediaUrls[0];
        await new Promise<void>((resolve) => { firstImg.onload = () => resolve(); });
        const canvas = document.createElement('canvas');
        canvas.width = 5;
        canvas.height = 5;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(firstImg, 0, 0, 5, 5);
          const pixelData = ctx.getImageData(0, 0, 5, 5).data;
          
          // Collect three distinct colors
          const rgb1 = `rgb(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]})`;
          const rgb2 = `rgb(${pixelData[12]}, ${pixelData[13]}, ${pixelData[14]})`;
          const rgb3 = `rgb(${pixelData[24]}, ${pixelData[25]}, ${pixelData[26]})`;
          palettes.push(rgb1, rgb2, rgb3);
        }
      }

      // Collect all anchors across edited images
      const allAnchors: FocalAnchor[] = [];
      Object.values(imageEdits).forEach(edit => {
        if (edit.anchors && edit.anchors.length > 0) {
          allAnchors.push(...edit.anchors);
        }
      });

      const meta = {
        audioUrl: audioUrl,
        audioTitle: audioTitle,
        focalAnchors: allAnchors.length > 0 ? JSON.stringify(allAnchors) : null,
        colorPalette: palettes.length > 0 ? JSON.stringify(palettes) : JSON.stringify(colors),
        layoutMatrix: layoutMatrix,
        coAuthors: coAuthors.length > 0 ? JSON.stringify(coAuthors) : null,
        vectorTextPanel: hasVectorPanel ? vectorPanelText : null,
      };

      const res = await createPost(caption, location, mediaUrls, meta);
      
      if (res.success) {
        setCaption('');
        setLocation('');
        setMediaUrls([]);
        setAudioUrl(null);
        setAudioTitle(null);
        setCoAuthors([]);
        setHasVectorPanel(false);
        setVectorPanelText('');
        setLayoutMatrix('normal');
        setImageEdits({});
        onClose();
        
        router.refresh();
        window.location.reload(); // Force full reload to rebuild state pipeline safely
      } else {
        setError(res.error || 'Failed to post. Please try again!');
      }
    } catch (err: any) {
      setError(err?.message || 'Something took too long. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={() => {
          stopAudioPreview();
          onClose();
        }}
        title="Share a photo"
        className="max-w-2xl"
      >
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-6">
          {error && (
            <div className="p-3.5 bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs font-semibold rounded flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Media uploader layout */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-violet-500" />
                Photos
              </label>
              {mediaUrls.length >= 2 && (
                <div className="flex items-center gap-1.5 px-2 py-1">
                  <span className="text-[11px] text-slate-500">Layout</span>
                  <select
                    value={layoutMatrix}
                    onChange={(e: any) => setLayoutMatrix(e.target.value)}
                    className="bg-transparent text-[11px] font-medium text-slate-700 border-none outline-none cursor-pointer"
                  >
                    <option value="normal" className="bg-white text-slate-700">Slideshow</option>
                    <option value="asymmetric-split" className="bg-white text-slate-700">Split</option>
                    {mediaUrls.length >= 3 && (
                      <option value="triptych" className="bg-white text-slate-700">Three photos</option>
                    )}
                  </select>
                </div>
              )}
            </div>
            
            {/* Upload Area */}
            <div className="relative border-2 border-dashed border-slate-800 hover:border-violet-500/50 transition-all rounded p-6 flex flex-col items-center justify-center bg-slate-900/30 group">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploading || isSubmitting}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center justify-center gap-2 text-center pointer-events-none">
                <ImageIcon className="w-8 h-8 text-slate-700 group-hover:text-violet-400 transition-all" />
                <span className="text-xs font-medium text-slate-700">Drag & drop, or click to add photos</span>
                <span className="text-[11px] text-slate-500">JPG, PNG, or WebP from your phone or computer</span>
              </div>
            </div>

            {/* Uploading indicator */}
            {isUploading && (
              <div className="flex items-center gap-2 text-xs font-semibold text-violet-400 py-1 px-2 bg-violet-950/20 rounded">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Adding your pictures...
              </div>
            )}

            {/* List & Edit Trigger previews */}
            {mediaUrls.length > 0 && (
              <div className="grid grid-cols-4 gap-3 mt-2">
                {mediaUrls.map((url, index) => (
                  <div key={index} className="relative aspect-square border border-slate-800 bg-slate-950 rounded overflow-hidden group">
                    <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                    
                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-between p-2">
                      <div className="flex items-center justify-between">
                        <span className="px-1.5 py-0.5 bg-black/80 text-[8px] text-white rounded">
                          {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeMedia(index)}
                          className="p-1 bg-rose-950/80 border border-rose-900/40 text-rose-300 hover:bg-rose-900 rounded cursor-pointer transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <Button
                        type="button"
                        onClick={() => openCanvasEditor(index)}
                        size="sm"
                        className="w-full h-7 text-[10px] uppercase font-bold tracking-wider py-0 px-2 bg-violet-600 hover:bg-violet-500"
                      >
                        Edit
                      </Button>
                    </div>

                    {index === 0 && (
                      <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-violet-600 text-[8px] font-bold tracking-wider text-white uppercase rounded-sm">
                        Cover
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. AUDIO-LINKED IMAGERY PRESETS */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-violet-500" />
                Add a sound <span className="font-normal text-slate-400">(optional)</span>
              </label>
              {audioUrl && (
                <button
                  type="button"
                  onClick={stopAudioPreview}
                  className="text-[11px] font-medium text-slate-500 flex items-center gap-1 hover:text-slate-800 cursor-pointer"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                  Stop
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { id: 'cyber_drone', title: 'Night city' },
                { id: 'neon_synth', title: 'Synthwave' },
                { id: 'rainy_jazz', title: 'Rainy jazz' },
                { id: 'vapor_echo', title: 'Retro' },
              ].map((sound) => {
                const isActive = audioUrl === sound.id;
                return (
                  <button
                    key={sound.id}
                    type="button"
                    onClick={() => handleAudioSelection(sound.id, sound.title)}
                    className={cn(
                      'px-3 py-2 border rounded text-left flex flex-col justify-between gap-1 transition-all group cursor-pointer',
                      isActive
                        ? 'bg-violet-50 border-violet-300'
                        : 'bg-white border-slate-200 hover:border-violet-200'
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={cn('text-[11px] font-medium truncate', isActive ? 'text-violet-700' : 'text-slate-600')}>
                        {sound.title}
                      </span>
                      {isActive ? (
                        <div className="flex items-center gap-0.5">
                          <span className="w-0.5 h-3 bg-violet-400 animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <span className="w-0.5 h-2 bg-violet-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                          <span className="w-0.5 h-4 bg-violet-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
                        </div>
                      ) : (
                        <Play className="w-2.5 h-2.5 text-slate-400" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">10 sec</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 7. VECTOR TEXT PANELS (Blogging inside slider) */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasVectorPanel}
                  onChange={(e) => setHasVectorPanel(e.target.checked)}
                  className="rounded border-slate-300 text-violet-500 focus:ring-violet-500/30"
                />
                Add a text slide <span className="font-normal text-slate-400">(optional)</span>
            </label>

            {hasVectorPanel && (
              <div className="flex flex-col gap-1.5 mt-1">
                <textarea
                  value={vectorPanelText}
                  onChange={(e) => setVectorPanelText(e.target.value)}
                  placeholder="Write a note that sits next to your photos..."
                  rows={4}
                  className="w-full bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 px-3 py-2 text-sm rounded outline-none focus:border-violet-400 transition-all resize-none"
                />
              </div>
            )}
          </div>

          {/* 8. LIVE CO-AUTHOR TEAM PIPELINE BIND */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-violet-500" />
              Tag people <span className="font-normal text-slate-400">(optional)</span>
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={coAuthorInput}
                onChange={(e) => setCoAuthorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCoAuthor();
                  }
                }}
                placeholder="Username, e.g. elena_pixels"
                className="flex-1 bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 px-3 py-2 text-sm rounded outline-none focus:border-violet-400"
              />
              <Button
                type="button"
                onClick={addCoAuthor}
                size="sm"
                className="bg-violet-600 hover:bg-violet-500 text-white text-[11px] px-4"
              >
                Add
              </Button>
            </div>

            {/* List active team pipeline syncing statuses */}
            {coAuthors.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-1">
                {coAuthors.map((author) => (
                  <div key={author} className="flex items-center justify-between p-2 bg-slate-950/60 border border-slate-900 rounded text-[11px]">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold text-[9px] border border-violet-500/20">
                        {author.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-300">@{author}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[9px] tracking-wide uppercase text-slate-500">
                        {coAuthorStatuses[author] || 'Invited'}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeCoAuthor(author)}
                        className="text-slate-500 hover:text-rose-500 transition-colors text-[11px] font-medium cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption..."
                rows={3}
                maxLength={1000}
                className="w-full bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 px-3 py-2.5 text-sm rounded outline-none focus:border-violet-400 transition-all resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Where was this taken?"
                  className="w-full bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 pl-10 pr-4 py-2.5 text-sm rounded outline-none focus:border-violet-400"
                />
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 -mx-5 -mb-5 px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => {
                stopAudioPreview();
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || mediaUrls.length === 0}
              className="gap-2 bg-violet-600 hover:bg-violet-500 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sharing...
                </>
              ) : (
                'Share'
              )}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* SUB-MODAL: CHANNELS POST-PROCESSING CANVAS EDITOR (Feature 1, 4) */}
      <Dialog
        isOpen={editingImageIndex !== null}
        onClose={() => setEditingImageIndex(null)}
        title="Adjust Picture Options"
        className="max-w-2xl"
      >
        <div className="flex flex-col gap-5">
          
          {/* Main interactive visual tag/click preview stage */}
          <div className="relative flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-400 tracking-wider uppercase">Interactive Canvas Workspace</label>
              <span className="text-[9px] font-mono text-slate-500 uppercase">Click directly on image to place Focal Anchor tags</span>
            </div>

            <div 
              onClick={handleImageCanvasClick}
              className="relative aspect-video w-full bg-slate-900 border border-slate-800 rounded overflow-hidden cursor-crosshair group flex items-center justify-center"
            >
              {editingImageIndex !== null && (
                <>
                  <img
                    src={imageEdits[editingImageIndex]?.originalUrl}
                    alt="Canvas Source"
                    className="max-h-full max-w-full object-contain select-none pointer-events-none"
                    style={{
                      filter: activeFilter === 'noir' ? 'contrast(1.3) brightness(0.9) grayscale(0.5) sepia(0.1) hue-rotate(190deg)' : 
                              activeFilter === 'cyber' ? 'hue-rotate(270deg) saturate(1.4) contrast(1.1)' :
                              activeFilter === 'matrix' ? 'hue-rotate(90deg) saturate(1.5) contrast(1.2)' : 
                              activeFilter === 'amber' ? 'sepia(0.6) saturate(1.2) hue-rotate(340deg) brightness(0.95)' : 'none'
                    }}
                  />

                  {/* Render existing anchors visually */}
                  {anchors.map((anchor, idx) => (
                    <div
                      key={idx}
                      style={{ left: `${anchor.x}%`, top: `${anchor.y}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-20"
                    >
                      <span className="absolute w-6 h-6 border-2 border-teal-400/60 rounded-full animate-ping pointer-events-none" />
                      <div className="w-3.5 h-3.5 rounded-full bg-teal-500 border border-black shadow-[0_0_8px_rgba(45,212,191,0.8)] flex items-center justify-center cursor-help">
                        <Tag className="w-2.5 h-2.5 text-white" />
                      </div>
                      
                      {/* Tooltip detail block */}
                      <div className="absolute top-5 left-0 translate-x-2 bg-slate-950/90 border border-slate-800 backdrop-blur-md px-2 py-1 rounded shadow-lg text-[9px] flex flex-col w-28 pointer-events-none z-30 opacity-90 group-hover:opacity-100">
                        <span className="font-bold text-teal-400 uppercase tracking-widest">{anchor.category}</span>
                        <span className="text-slate-300 font-medium">{anchor.label}</span>
                      </div>
                    </div>
                  ))}

                  {/* Pending/Temporary anchor */}
                  {tempAnchorPos && (
                    <div
                      style={{ left: `${tempAnchorPos.x}%`, top: `${tempAnchorPos.y}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-20"
                    >
                      <span className="absolute w-8 h-8 border-2 border-violet-500 rounded-full animate-pulse" />
                      <div className="w-4 h-4 rounded-full bg-violet-600 border border-white shadow-[0_0_12px_rgba(124,58,237,1)]" />
                    </div>
                  )}

                  {/* Render vector text overlay layer mockup */}
                  {textOverlay.trim() && (
                    <div 
                      className={cn(
                        "absolute left-0 right-0 px-6 py-2 text-center text-xs font-bold tracking-wider z-10 font-sans drop-shadow-[0_2px_4px_rgba(0,0,0,1)] pointer-events-none uppercase",
                        textPlacement === 'top' && 'top-4',
                        textPlacement === 'center' && 'top-1/2 -translate-y-1/2',
                        textPlacement === 'bottom' && 'bottom-4'
                      )}
                      style={{ color: textColor, fontSize: textPlacement === 'center' ? '18px' : '14px' }}
                    >
                      {textOverlay}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Tag editor container if pending position exists */}
          {tempAnchorPos && (
            <div className="p-3 bg-slate-900 border border-slate-800/80 rounded flex flex-col gap-3 animate-fadeIn">
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Configure focal coordinate tagging:</span>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-500 uppercase font-mono">Channel Category</label>
                  <select
                    value={newAnchorCat}
                    onChange={(e) => setNewAnchorCat(e.target.value)}
                    className="bg-slate-950 border border-slate-850 px-2 py-1 text-xs text-slate-200 rounded outline-none cursor-pointer"
                  >
                    <option value="Gear">📸 Camera / Gear</option>
                    <option value="Fashion">🧥 Apparel / Cyberwear</option>
                    <option value="Tech">💻 Tech Stack / Node</option>
                    <option value="Light">💡 Light Rig / Set</option>
                  </select>
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-[9px] text-slate-500 uppercase font-mono">Tag Description</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newAnchorLabel}
                      onChange={(e) => setNewAnchorLabel(e.target.value)}
                      placeholder="e.g. Hasselblad 907X, f/2.8"
                      className="flex-1 bg-slate-950 border border-slate-850 px-2 py-1 text-xs text-slate-200 rounded outline-none focus:border-teal-500"
                    />
                    <Button
                      type="button"
                      onClick={addAnchor}
                      className="bg-teal-500 hover:bg-teal-400 text-[10px] px-3.5 h-7"
                    >
                      Lock Tag
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* List of current anchors */}
          {anchors.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Active Focal Anchors:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {anchors.map((anchor, idx) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-900 border border-slate-850 rounded text-[10px] text-slate-300"
                  >
                    <span className="font-bold text-teal-400 uppercase">{anchor.category}:</span>
                    <span>{anchor.label}</span>
                    <button 
                      type="button" 
                      onClick={() => removeAnchor(idx)}
                      className="text-rose-400 hover:text-rose-300 ml-1 font-bold cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Asynchronous CSS Filters selection */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-violet-500" />
              1. Stack Translucent CSS Filter Shader
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { id: 'none', name: 'Original', color: 'from-slate-800 to-slate-900' },
                { id: 'noir', name: 'Noir Shadow', color: 'from-slate-950 to-slate-800' },
                { id: 'cyber', name: 'Cyber Neon', color: 'from-fuchsia-950/40 to-slate-950' },
                { id: 'matrix', name: 'Emerald Grids', color: 'from-emerald-950/40 to-slate-950' },
                { id: 'amber', name: 'Amber Film', color: 'from-amber-950/40 to-slate-950' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={cn(
                    'px-2 py-2 border rounded text-center text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer bg-gradient-to-br',
                    filter.color,
                    activeFilter === filter.id 
                      ? 'border-violet-500 text-violet-300 shadow-[0_0_10px_rgba(124,58,237,0.15)]' 
                      : 'border-slate-900 hover:border-slate-800 text-slate-400 hover:text-slate-200'
                  )}
                >
                  {filter.name}
                </button>
              ))}
            </div>
          </div>

          {/* Vector Text Layer settings */}
          <div className="flex flex-col gap-2.5 p-3.5 bg-slate-900/40 border border-slate-900 rounded">
            <label className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1">
              <Pen className="w-3.5 h-3.5 text-violet-500" />
              2. Inject Custom vector Typography Overlay Layer
            </label>
            
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={textOverlay}
                onChange={(e) => setTextOverlay(e.target.value)}
                placeholder="Inscribe Title Overlay text onto image vector space..."
                className="w-full bg-slate-950 border border-slate-900 text-slate-100 placeholder:text-slate-700 px-3 py-2 text-xs rounded outline-none focus:border-violet-500"
              />

              <div className="grid grid-cols-3 gap-3 mt-1">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-500 uppercase font-mono">Typography Color</label>
                  <div className="flex gap-1.5 items-center mt-1">
                    {[
                      { code: '#ffffff', title: 'White' },
                      { code: '#c084fc', title: 'Violet' },
                      { code: '#2dd4bf', title: 'Teal' },
                      { code: '#f43f5e', title: 'Pink' },
                    ].map((col) => (
                      <button
                        key={col.code}
                        type="button"
                        onClick={() => setTextColor(col.code)}
                        style={{ backgroundColor: col.code }}
                        className={cn(
                          "w-5 h-5 rounded-full border cursor-pointer transition-all",
                          textColor === col.code ? "border-violet-400 scale-110 shadow-[0_0_8px_rgba(255,255,255,0.4)]" : "border-transparent"
                        )}
                        title={col.title}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-500 uppercase font-mono">Stamp Dimension</label>
                  <select
                    value={textSize}
                    onChange={(e) => setTextSize(e.target.value)}
                    className="bg-slate-950 border border-slate-850 px-2.5 py-1 text-xs text-slate-300 rounded outline-none cursor-pointer mt-1"
                  >
                    <option value="16px">Small Label (16px)</option>
                    <option value="24px">Standard Header (24px)</option>
                    <option value="36px">Massive Poster (36px)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-500 uppercase font-mono">Vertical Alignment</label>
                  <select
                    value={textPlacement}
                    onChange={(e: any) => setTextPlacement(e.target.value)}
                    className="bg-slate-950 border border-slate-850 px-2.5 py-1 text-xs text-slate-300 rounded outline-none cursor-pointer mt-1"
                  >
                    <option value="top">Top Header</option>
                    <option value="center">Abs Center</option>
                    <option value="bottom">Lower Margin</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-900">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingImageIndex(null)}
            >
              Cancel Edit
            </Button>
            <Button
              type="button"
              onClick={commitCanvasEdits}
              className="gap-2 bg-violet-600 hover:bg-violet-500"
            >
              <Check className="w-4 h-4" />
              Apply & Render Pipeline
            </Button>
          </div>

        </div>
      </Dialog>
    </>
  );
}
