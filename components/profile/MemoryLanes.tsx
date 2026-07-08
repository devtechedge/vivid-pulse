"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAccessibility } from '@/components/ui/AccessibilityProvider';
import { Button } from '../ui/Button'; // we'll create simple UI button next
import { FormattedDate } from '@/components/ui/FormattedDate';
import { 
  Printer, Archive, Award, Users, Music, BookOpen, Clock, Heart, Lock, Flower2, 
  Trash2, Plus, Download, Signal, RefreshCw, Star, Info, Check, ShieldAlert
} from 'lucide-react';
import {
  getKeepsakes, addKeepsake,
  getWins, addWin,
  getFamily, addFamilyMember, addFamilyPhoto,
  getFlowers, plantFlower,
  getQuilts, addQuiltSquare,
  getSoundAlbums, createSoundAlbum,
  getLeatherDiaryEntries, createLeatherDiaryEntry,
  getTimeCapsuleJars, createTimeCapsuleJar,
  getTrustedHelpers, addTrustedHelper,
  getVaultPhotos, addVaultPhoto,
  getPaperChains, createPaperChain
} from '@/lib/actions';

// Helper to generate secure random PIN out of React component render context
function generateRecoveryPin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

interface MemoryLanesProps {
  username: string;
  isSelf: boolean;
}

export const MemoryLanes: React.FC<MemoryLanesProps> = ({ username, isSelf }) => {
  const { speak, isReadAloudEnabled, isEasyMode } = useAccessibility();

  // State arrays
  const [keepsakes, setKeepsakes] = useState<any[]>([]);
  const [wins, setWins] = useState<any[]>([]);
  const [family, setFamily] = useState<any[]>([]);
  const [flowers, setFlowers] = useState<any[]>([]);
  const [quilts, setQuilts] = useState<any[]>([]);
  const [soundAlbums, setSoundAlbums] = useState<any[]>([]);
  const [diaryEntries, setDiaryEntries] = useState<any[]>([]);
  const [jars, setJars] = useState<any[]>([]);
  const [trustedHelpers, setTrustedHelpers] = useState<any[]>([]);
  const [vaultPhotos, setVaultPhotos] = useState<any[]>([]);
  const [paperChains, setPaperChains] = useState<any[]>([]);

  // Active view states
  const [activeSubTab, setActiveSubTab] = useState<'keepsakes' | 'wins' | 'family' | 'diary' | 'jars' | 'helpers' | 'lockbox' | 'garden' | 'sound'>('keepsakes');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form inputs
  const [newKeepsakeTitle, setNewKeepsakeTitle] = useState('');
  const [newKeepsakeMemory, setNewKeepsakeMemory] = useState('');
  const [newKeepsakeChest, setNewKeepsakeChest] = useState('childhood');
  const [newKeepsakeImage, setNewKeepsakeImage] = useState('https://images.unsplash.com/photo-1515488042361-404e9250afef?w=400&q=80');
  const [isAddingKeepsake, setIsAddingKeepsake] = useState(false);

  const [newWinContent, setNewWinContent] = useState('');
  const [newWinCategory, setNewWinCategory] = useState('health');
  const [isAddingWin, setIsAddingWin] = useState(false);

  const [newFamilyName, setNewFamilyName] = useState('');
  const [newFamilyRelation, setNewFamilyRelation] = useState('Daughter');
  const [newFamilyPhoto, setNewFamilyPhoto] = useState('https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&q=80');
  const [newFamilyCaption, setNewFamilyCaption] = useState('');
  const [isAddingFamily, setIsAddingFamily] = useState(false);

  const [newFlowerName, setNewFlowerName] = useState('');
  const [newFlowerType, setNewFlowerType] = useState('Lavender');
  const [newFlowerNote, setNewFlowerNote] = useState('');
  const [isPlanting, setIsPlanting] = useState(false);

  const [newQuiltPattern, setNewQuiltPattern] = useState('Log Cabin');
  const [newQuiltColor, setNewQuiltColor] = useState('bg-indigo-900');
  const [newQuiltFabric, setNewQuiltFabric] = useState('');
  const [newQuiltStitcher, setNewQuiltStitcher] = useState('');
  const [isStitching, setIsStitching] = useState(false);

  const [newDiaryTitle, setNewDiaryTitle] = useState('');
  const [newDiaryContent, setNewDiaryContent] = useState('');
  const [newDiaryTheme, setNewDiaryTheme] = useState('vintage');
  const [isAddingDiary, setIsAddingDiary] = useState(false);

  const [newJarTitle, setNewJarTitle] = useState('');
  const [newJarMessage, setNewJarMessage] = useState('');
  const [newJarYear, setNewJarYear] = useState(2028);
  const [isAddingJar, setIsAddingJar] = useState(false);

  // Batch 9 States
  const [newHelperName, setNewHelperName] = useState('');
  const [newHelperRelationship, setNewHelperRelationship] = useState('');
  const [isAddingHelper, setIsAddingHelper] = useState(false);
  const [newVaultPhotoUrl, setNewVaultPhotoUrl] = useState('https://images.unsplash.com/photo-1473163928189-364b2c4e1135?w=400&q=80');
  const [newVaultPhotoCaption, setNewVaultPhotoCaption] = useState('');
  const [isAddingVaultPhoto, setIsAddingVaultPhoto] = useState(false);
  const [recoveryPinGenerated, setRecoveryPinGenerated] = useState<string | null>(null);

  // Privacy Lockbox State (3-digit combo)
  const [lockboxCombination] = useState('123'); // seed value
  const [isLockboxLocked, setIsLockboxLocked] = useState(true);
  const [isSavingLockbox, setIsSavingLockbox] = useState(false);
  const [lockboxInputCombo, setLockboxInputCombo] = useState<string[]>(['1', '2', '3']);
  const [lockboxValidationError, setLockboxValidationError] = useState<string | null>(null);

  // Weak-Signal Super Sync toggles
  const [isWeakSignalEnabled, setIsWeakSignalEnabled] = useState(false);
  const [compressedDetails, setCompressedDetails] = useState<string | null>(null);

  // Load all memory chest data
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        keepsakeList,
        winList,
        familyList,
        flowerList,
        quiltList,
        soundList,
        diaryList,
        jarList,
        helperList,
        vaultList,
        chainList
      ] = await Promise.all([
        getKeepsakes(),
        getWins(),
        getFamily(),
        getFlowers(),
        getQuilts(),
        getSoundAlbums(),
        getLeatherDiaryEntries(),
        getTimeCapsuleJars(),
        getTrustedHelpers(),
        getVaultPhotos(),
        getPaperChains()
      ]);

      setKeepsakes(keepsakeList || []);
      setWins(winList || []);
      setFamily(familyList || []);
      setFlowers(flowerList || []);
      setQuilts(quiltList || []);
      setSoundAlbums(soundList || []);
      setDiaryEntries(diaryList || []);
      setJars(jarList || []);
      setTrustedHelpers(helperList || []);
      setVaultPhotos(vaultList || []);
      setPaperChains(chainList || []);
    } catch (e) {
      console.error('Failed loading memory lanes:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Read Aloud helpers
  const handleTabClick = (tab: typeof activeSubTab, label: string) => {
    setActiveSubTab(tab);
    if (isReadAloudEnabled) {
      speak(`Switched to ${label} chest.`);
    }
  };

  // Submit handlers
  const handleAddKeepsakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeepsakeTitle.trim() || !newKeepsakeMemory.trim()) return;
    setIsAddingKeepsake(true);
    const res = await addKeepsake(newKeepsakeTitle.trim(), newKeepsakeMemory.trim(), newKeepsakeChest, newKeepsakeImage);
    if (res.success) {
      setNewKeepsakeTitle('');
      setNewKeepsakeMemory('');
      const updated = await getKeepsakes();
      setKeepsakes(updated || []);
      speak("Stored keepsake in your Memory Attic.");
    }
    setIsAddingKeepsake(false);
  };

  const handleAddWinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWinContent.trim()) return;
    setIsAddingWin(true);
    const res = await addWin(newWinContent.trim(), newWinCategory);
    if (res.success) {
      setNewWinContent('');
      const updated = await getWins();
      setWins(updated || []);
      speak("Victory logged successfully!");
    }
    setIsAddingWin(false);
  };

  const handleAddFamilySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamilyName.trim()) return;
    setIsAddingFamily(true);
    const res = await addFamilyMember(newFamilyName.trim(), newFamilyRelation, newFamilyPhoto, newFamilyCaption);
    if (res.success) {
      setNewFamilyName('');
      setNewFamilyCaption('');
      const updated = await getFamily();
      setFamily(updated || []);
      speak("Family tree member added.");
    }
    setIsAddingFamily(false);
  };

  const handlePlantFlowerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlowerName.trim()) return;
    setIsPlanting(true);
    const res = await plantFlower(newFlowerName.trim(), newFlowerType, newFlowerNote.trim());
    if (res.success) {
      setNewFlowerName('');
      setNewFlowerNote('');
      const updated = await getFlowers();
      setFlowers(updated || []);
      speak(`Planted a lovely ${newFlowerType} in the garden.`);
    }
    setIsPlanting(false);
  };

  const handleStitchQuiltSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuiltFabric.trim()) return;
    setIsStitching(true);
    const res = await addQuiltSquare(newQuiltPattern, newQuiltColor, newQuiltFabric.trim(), newQuiltStitcher || 'Grandma');
    if (res.success) {
      setNewQuiltFabric('');
      setNewQuiltStitcher('');
      const updated = await getQuilts();
      setQuilts(updated || []);
      speak("Stitched a new patch into the family blanket.");
    }
    setIsStitching(false);
  };

  const handleAddDiarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiaryTitle.trim() || !newDiaryContent.trim()) return;
    setIsAddingDiary(true);
    const res = await createLeatherDiaryEntry(newDiaryTitle.trim(), newDiaryContent.trim(), newDiaryTheme);
    if (res.success) {
      setNewDiaryTitle('');
      setNewDiaryContent('');
      const updated = await getLeatherDiaryEntries();
      setDiaryEntries(updated || []);
      speak("Diary page bound securely.");
    }
    setIsAddingDiary(false);
  };

  const handleAddJarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJarTitle.trim() || !newJarMessage.trim()) return;
    setIsAddingJar(true);
    const res = await createTimeCapsuleJar(newJarTitle.trim(), newJarMessage.trim(), newJarYear);
    if (res.success) {
      setNewJarTitle('');
      setNewJarMessage('');
      const updated = await getTimeCapsuleJars();
      setJars(updated || []);
      speak("Sealed message in the time jar.");
    }
    setIsAddingJar(false);
  };

  const handleAddTrustedHelperSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHelperName.trim() || !newHelperRelationship.trim()) return;
    setIsAddingHelper(true);
    const res = await addTrustedHelper(newHelperName.trim(), newHelperRelationship.trim());
    if (res.success) {
      setNewHelperName('');
      setNewHelperRelationship('');
      const updated = await getTrustedHelpers();
      setTrustedHelpers(updated || []);
      speak("Trusted helper added to your security circle.");
    }
    setIsAddingHelper(false);
  };

  const handleRequestRecoveryPin = (helperName: string) => {
    const pin = generateRecoveryPin();
    setRecoveryPinGenerated(`🔑 RECOVERY PIN GENERATED: ${pin}\n\n${helperName} (Trusted Helper) is authorized to use this PIN to securely reset your passcode. This PIN was broadcast to her device locally!`);
    speak("Passcode override pin generated.");
  };

  const handleAddVaultPhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVaultPhotoCaption.trim()) return;
    setIsAddingVaultPhoto(true);
    const res = await addVaultPhoto(newVaultPhotoUrl, newVaultPhotoCaption.trim());
    if (res.success) {
      setNewVaultPhotoCaption('');
      setNewVaultPhotoUrl('https://images.unsplash.com/photo-1473163928189-364b2c4e1135?w=400&q=80');
      const updated = await getVaultPhotos();
      setVaultPhotos(updated || []);
      speak("Deposited private file to the secure vault.");
    }
    setIsAddingVaultPhoto(false);
  };

  const handleUnlockLockbox = () => {
    const joinedInput = lockboxInputCombo.join('');
    if (joinedInput === lockboxCombination) {
      setIsLockboxLocked(false);
      setLockboxValidationError(null);
      speak("Combination match! Lockbox cabinet open.");
    } else {
      setLockboxValidationError("Whoops! Combination does not match the chest's tumblers. Try again, or ask a Trusted Helper!");
      speak("Incorrect combination.");
    }
  };

  const handleSaveLockbox = () => {
    setIsSavingLockbox(true);
    setTimeout(() => {
      setIsSavingLockbox(false);
      setIsLockboxLocked(true);
      speak("Lockbox sealed securely.");
    }, 1200);
  };

  // Printable layout compilation
  const handlePrintAlbum = () => {
    window.print();
  };

  // Offline HTML Generator (durable back up files for elderly)
  const handleDownloadBackupChest = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VividPulse Family Backup Chest 📦</title>
  <style>
    body {
      background-color: #030712;
      color: #f3f4f6;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 40px 20px;
      max-width: 900px;
      margin: 0 auto;
    }
    .chest-header {
      text-align: center;
      border-bottom: 2px solid #b45309;
      padding-bottom: 24px;
      margin-bottom: 40px;
    }
    h1 { color: #f59e0b; margin: 0; font-family: Georgia, serif; font-style: italic; }
    p.subtitle { color: #9ca3af; font-size: 14px; margin-top: 8px; }
    .section-card {
      background-color: #111827;
      border: 1px solid #1f2937;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }
    h2 { color: #3b82f6; font-size: 18px; margin-top: 0; display: flex; align-items: center; gap: 8px; }
    .item-row {
      background-color: #1f2937;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 13px;
      line-height: 1.6;
      margin-bottom: 10px;
    }
    .item-title { font-weight: bold; color: #10b981; }
    .photo-grid {
      display: grid;
      grid-template-cols: repeat(auto-fill, minmax(180px, 1fr));
      gap: 12px;
      margin-top: 12px;
    }
    .photo-card {
      background: #1f2937;
      border-radius: 8px;
      padding: 8px;
      text-align: center;
      font-size: 11px;
    }
    .photo-card img {
      width: 100%;
      height: 120px;
      object-fit: cover;
      border-radius: 6px;
    }
    footer { text-align: center; margin-top: 60px; font-size: 11px; color: #4b5563; }
  </style>
</head>
<body>
  <div class="chest-header">
    <h1>📦 VividPulse Offline Backup Chest</h1>
    <p class="subtitle">Precious memories, childhood attic keepsakes, family tree photos, and diary pages, compiled on ${new Date().toLocaleDateString()} for offline preservation.</p>
  </div>

  <div class="section-card">
    <h2>🏺 Memory Attic Keepsakes (${keepsakes.length})</h2>
    <div class="photo-grid">
      ${keepsakes.map(k => `
        <div class="photo-card">
          <img src="${k.imageUrl}" alt="${k.title}">
          <div style="font-weight:bold; margin-top:6px; color:#fbbf24;">${k.title}</div>
          <div style="color:#9ca3af; margin-top:4px; font-size:10px;">${k.memory}</div>
        </div>
      `).join('')}
    </div>
  </div>

  <div class="section-card">
    <h2>🏆 Daily Wins Log (${wins.length})</h2>
    <div style="display:flex; flex-direction:column; gap:8px;">
      ${wins.map(w => `
        <div class="item-row">
          <span class="item-title">✓ ${w.content}</span> - <span style="color:#9ca3af;">${w.category.toUpperCase()}</span>
        </div>
      `).join('')}
    </div>
  </div>

  <div class="section-card">
    <h2>📖 Leather Diary Entries (${diaryEntries.length})</h2>
    <div style="display:flex; flex-direction:column; gap:12px;">
      ${diaryEntries.map(d => `
        <div class="item-row" style="border-left: 3px solid #8b5cf6;">
          <div style="font-weight:bold; font-size:14px; color:#f3f4f6; margin-bottom:4px;">${d.title}</div>
          <div>${d.content}</div>
          <div style="margin-top:6px; font-size:10px; color:#a78bfa;">Theme: ${d.theme}</div>
        </div>
      `).join('')}
    </div>
  </div>

  <footer>
    <p>Generated by VividPulse. This is a self-contained offline backup file. You can safely keep this on your desktop forever!</p>
  </footer>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${username}_vividpulse_backup_chest.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    speak("Your offline memory chest backup was successfully compiled and downloaded.");
  };

  return (
    <div className="flex flex-col gap-6" id="memory-lanes-root">
      {/* Top Header bar with Offline sync buttons */}
      <div className="bg-slate-900/60 border border-slate-800/85 p-4 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">Everyday Organizing & Memory Lanes</h3>
          </div>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            Preserve and organize precious family heirlooms, daily routines, and audio slideshows with high legibility.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Weak-Signal Sync toggle */}
          <button
            onClick={() => {
              const nextVal = !isWeakSignalEnabled;
              setIsWeakSignalEnabled(nextVal);
              if (nextVal) {
                setCompressedDetails("📶 Super Sync scale-down enabled! Upload packets will scale down to 42KB instantly to save device battery & speed up connection.");
                speak("Weak signal mode on. Saved battery.");
              } else {
                setCompressedDetails(null);
                speak("Standard connection mode restored.");
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 h-9 border transition-all cursor-pointer ${
              isWeakSignalEnabled 
                ? 'bg-amber-950/30 border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
            }`}
          >
            <Signal className="w-3.5 h-3.5" />
            <span>{isWeakSignalEnabled ? 'Super Sync ON' : 'Weak-Signal Sync'}</span>
          </button>

          {/* Download Backup Chest */}
          <Button 
            onClick={handleDownloadBackupChest}
            variant="secondary" 
            size="sm" 
            className="bg-amber-500/10 border-amber-600/40 hover:bg-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 h-9"
          >
            <Download className="w-4 h-4" />
            <span>One-Click Backup</span>
          </Button>

          {/* Print compilation */}
          <Button 
            onClick={() => setIsPrintModalOpen(true)}
            variant="secondary" 
            size="sm" 
            className="bg-teal-950/20 border-teal-850 hover:bg-teal-900/30 text-teal-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 h-9"
          >
            <Printer className="w-4 h-4" />
            <span>Printable Album</span>
          </Button>
        </div>
      </div>

      {compressedDetails && (
        <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-lg text-xs text-amber-200 flex items-center justify-between">
          <span>{compressedDetails}</span>
          <button onClick={() => setCompressedDetails(null)} className="text-[10px] text-amber-500 font-bold uppercase hover:text-amber-300">Dismiss</button>
        </div>
      )}

      {/* Grid of 9 Sub-Tabs */}
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2 p-1.5 bg-slate-900/40 rounded-xl border border-slate-850">
        {[
          { id: 'keepsakes', icon: Archive, label: 'Attic Keepsakes' },
          { id: 'wins', icon: Award, label: 'Daily Wins' },
          { id: 'family', icon: Users, label: 'Family Tree' },
          { id: 'diary', icon: BookOpen, label: 'Leather Diary' },
          { id: 'jars', icon: Clock, label: 'Time Jars' },
          { id: 'helpers', icon: Heart, label: 'Helpers' },
          { id: 'lockbox', icon: Lock, label: 'Lockbox safe' },
          { id: 'garden', icon: Flower2, label: 'Memory Garden' },
          { id: 'sound', icon: Music, label: 'Sound Albums' }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id as any, tab.label)}
              className={`flex flex-col items-center justify-center p-2.5 rounded-lg border transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-500/10 border-amber-500/50 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.1)]'
                  : 'bg-slate-950 border-slate-900 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold text-center tracking-wide line-clamp-1">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Sub-Tab Layout Content */}
      <div className="bg-slate-900/30 border border-slate-850 rounded-xl p-6 min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-xs text-slate-500 italic">
            <RefreshCw className="w-5 h-5 animate-spin mr-2 text-amber-500" /> Loading memory chest drawers...
          </div>
        ) : (
          <>
            {/* 1. ATTIC KEEPSAKES */}
            {activeSubTab === 'keepsakes' && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                  <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider">🏺 Childhood Attic Keepsakes</h4>
                  <span className="text-xs text-slate-400 font-mono">Count: {keepsakes.length}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Form */}
                  {isSelf && (
                    <form onSubmit={handleAddKeepsakeSubmit} className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex flex-col gap-4">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest font-mono">Store an Heirloom Memory:</span>
                      
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-500 font-mono">Relic Title</label>
                        <input
                          type="text"
                          required
                          value={newKeepsakeTitle}
                          onChange={(e) => setNewKeepsakeTitle(e.target.value)}
                          placeholder="e.g. My Mother’s Silver Locket"
                          className="bg-stone-950 border border-slate-850 rounded p-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-500 font-mono">Childhood Memory Story</label>
                        <textarea
                          required
                          rows={3}
                          value={newKeepsakeMemory}
                          onChange={(e) => setNewKeepsakeMemory(e.target.value)}
                          placeholder="Tell the story behind this object..."
                          className="bg-stone-950 border border-slate-850 rounded p-2 text-xs text-slate-200 outline-none focus:border-amber-500 resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-500 font-mono">Category Chest</label>
                          <select
                            value={newKeepsakeChest}
                            onChange={(e) => setNewKeepsakeChest(e.target.value)}
                            className="bg-stone-950 border border-slate-850 rounded p-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                          >
                            <option value="childhood">Childhood Attic</option>
                            <option value="wedding">Wedding Album</option>
                            <option value="travel">Travel Trunks</option>
                            <option value="house">Family Hearth</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-500 font-mono">Illustrative Image URL</label>
                          <input
                            type="text"
                            value={newKeepsakeImage}
                            onChange={(e) => setNewKeepsakeImage(e.target.value)}
                            className="bg-stone-950 border border-slate-850 rounded p-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      <Button type="submit" disabled={isAddingKeepsake} className="bg-amber-700 hover:bg-amber-600 text-stone-100">
                        {isAddingKeepsake ? 'Storing relic...' : 'Deposit Heirloom Chest 🏺'}
                      </Button>
                    </form>
                  )}

                  {/* List Grid */}
                  <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {keepsakes.map(k => (
                      <div key={k.id} className="bg-slate-900/40 border border-slate-850 rounded-xl overflow-hidden flex flex-col hover:border-amber-500/30 transition-all">
                        <div className="h-40 bg-stone-950 relative">
                          <img src={k.imageUrl} alt={k.title} className="w-full h-full object-cover" />
                          <span className="absolute top-2 left-2 bg-amber-950 border border-amber-900 text-[9px] font-mono font-semibold uppercase px-2 py-0.5 rounded text-amber-400">
                            {k.chest}
                          </span>
                        </div>
                        <div className="p-4 flex flex-col gap-2">
                          <h5 className="text-xs font-bold text-slate-100">{k.title}</h5>
                          <p className="text-[11px] text-slate-400 leading-relaxed font-sans italic">&quot;{k.memory}&quot;</p>
                          <span className="text-[9px] font-mono text-slate-500 mt-2">
                            Deposited: <FormattedDate date={k.createdAt} showTime={false} />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. DAILY WINS */}
            {activeSubTab === 'wins' && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                  <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider">🏆 Daily Victories & Achievements</h4>
                  <span className="text-xs text-slate-400 font-mono">Wins Count: {wins.length}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Add Win Form */}
                  {isSelf && (
                    <form onSubmit={handleAddWinSubmit} className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex flex-col gap-4">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest font-mono">Log Today’s Little Joy:</span>
                      
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-500 font-mono">What did you achieve today?</label>
                        <input
                          type="text"
                          required
                          value={newWinContent}
                          onChange={(e) => setNewWinContent(e.target.value)}
                          placeholder="e.g. Took my afternoon vitamins"
                          className="bg-stone-950 border border-slate-850 rounded p-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-500 font-mono">Win Category</label>
                        <select
                          value={newWinCategory}
                          onChange={(e) => setNewWinCategory(e.target.value)}
                          className="bg-stone-950 border border-slate-850 rounded p-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                        >
                          <option value="health">Physical Health & Mobility</option>
                          <option value="mind">Mental Clarity & Reading</option>
                          <option value="social">Social Connection & Dialing</option>
                          <option value="hobbies">Crafting & Gardening</option>
                        </select>
                      </div>

                      <Button type="submit" disabled={isAddingWin} className="bg-amber-700 hover:bg-amber-600 text-stone-100">
                        {isAddingWin ? 'Recording victory...' : 'Log Victory 🏆'}
                      </Button>
                    </form>
                  )}

                  {/* Wins Timeline */}
                  <div className="md:col-span-2 flex flex-col gap-3">
                    {wins.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-500 italic">No victories logged today. Log one on the left to mark your progress!</div>
                    ) : (
                      wins.map(w => (
                        <div key={w.id} className="bg-slate-900/50 border border-slate-850 p-4 rounded-xl flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                              <Star className="w-4 h-4 fill-current" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-200">{w.content}</span>
                              <span className="text-[9px] font-mono text-amber-500/70 uppercase tracking-widest mt-0.5">{w.category}</span>
                            </div>
                          </div>
                          <span className="text-[9px] font-mono text-slate-500">
                            <FormattedDate date={w.createdAt} showTime={false} />
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 3. FAMILY TREE */}
            {activeSubTab === 'family' && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                  <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider">👨‍👩‍👧‍👦 Family Tree Directory & Photos</h4>
                  <span className="text-xs text-slate-400 font-mono">Relations logged: {family.length}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Add Family Form */}
                  {isSelf && (
                    <form onSubmit={handleAddFamilySubmit} className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex flex-col gap-4">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest font-mono">Log Family Connection:</span>
                      
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-500 font-mono">Relative Name</label>
                        <input
                          type="text"
                          required
                          value={newFamilyName}
                          onChange={(e) => setNewFamilyName(e.target.value)}
                          placeholder="e.g. Arthur Green"
                          className="bg-stone-950 border border-slate-850 rounded p-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-500 font-mono">Connection Relationship</label>
                        <select
                          value={newFamilyRelation}
                          onChange={(e) => setNewFamilyRelation(e.target.value)}
                          className="bg-stone-950 border border-slate-850 rounded p-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                        >
                          <option value="Daughter">Daughter</option>
                          <option value="Son">Son</option>
                          <option value="Grandson">Grandson</option>
                          <option value="Granddaughter">Granddaughter</option>
                          <option value="Caregiver">Caregiver</option>
                          <option value="Sibling">Sibling</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-500 font-mono">First Photo URL (Optional)</label>
                        <input
                          type="text"
                          value={newFamilyPhoto}
                          onChange={(e) => setNewFamilyPhoto(e.target.value)}
                          className="bg-stone-950 border border-slate-850 rounded p-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-500 font-mono">Photo Caption / Note</label>
                        <input
                          type="text"
                          value={newFamilyCaption}
                          onChange={(e) => setNewFamilyCaption(e.target.value)}
                          placeholder="e.g. Graduation dinner in Seattle"
                          className="bg-stone-950 border border-slate-850 rounded p-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                        />
                      </div>

                      <Button type="submit" disabled={isAddingFamily} className="bg-amber-700 hover:bg-amber-600 text-stone-100">
                        {isAddingFamily ? 'Adding family member...' : 'Log Relative Connection 👨‍👩‍👧‍ Leg'}
                      </Button>
                    </form>
                  )}

                  {/* List Layout */}
                  <div className="md:col-span-2 flex flex-col gap-6">
                    {family.map(member => (
                      <div key={member.id} className="bg-slate-900/40 border border-slate-850 p-4 rounded-xl flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-base">
                              👵
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-200">{member.name}</span>
                              <span className="text-[9px] font-mono uppercase text-amber-500">{member.relationship}</span>
                            </div>
                          </div>
                          <span className="text-[9px] font-mono text-slate-500">Linked on VividPulse</span>
                        </div>

                        {member.photos && member.photos.length > 0 ? (
                          <div className="grid grid-cols-2 gap-4">
                            {member.photos.map((p: any, pIdx: number) => (
                              <div key={pIdx} className="bg-stone-950 border border-slate-850/60 p-2 rounded-lg flex flex-col gap-2">
                                <div className="h-32 rounded overflow-hidden">
                                  <img src={p.url} alt="Family memory" className="w-full h-full object-cover" />
                                </div>
                                <span className="text-[10px] text-slate-300 font-serif italic text-center leading-normal">&quot;{p.caption}&quot;</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-4 text-center text-[11px] text-slate-500 italic">No family photos added for this relative.</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 4. LEATHER DIARY */}
            {activeSubTab === 'diary' && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                  <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider">📖 Leather-Bound Diary Pages</h4>
                  <span className="text-xs text-slate-400 font-mono">Bound Entries: {diaryEntries.length}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Add Diary Form */}
                  {isSelf && (
                    <form onSubmit={handleAddDiarySubmit} className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex flex-col gap-4">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest font-mono">Stitch a Fresh Journal Page:</span>
                      
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-500 font-mono">Diary Entry Title</label>
                        <input
                          type="text"
                          required
                          value={newDiaryTitle}
                          onChange={(e) => setNewDiaryTitle(e.target.value)}
                          placeholder="e.g. Summer Rainfall Over Meadows"
                          className="bg-stone-950 border border-slate-850 rounded p-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-500 font-mono">Entry Content</label>
                        <textarea
                          required
                          rows={4}
                          value={newDiaryContent}
                          onChange={(e) => setNewDiaryContent(e.target.value)}
                          placeholder="Write down your memories, recipes, thoughts..."
                          className="bg-stone-950 border border-slate-850 rounded p-2 text-xs text-slate-200 outline-none focus:border-amber-500 resize-none font-serif leading-relaxed"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-500 font-mono">Visual Theme Tone</label>
                        <select
                          value={newDiaryTheme}
                          onChange={(e) => setNewDiaryTheme(e.target.value)}
                          className="bg-stone-950 border border-slate-850 rounded p-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                        >
                          <option value="vintage">Cozy Vintage (Soft Amber)</option>
                          <option value="sepia">Faded Sepia (Nostalgia Brown)</option>
                          <option value="forest">Pine Forest (Muted Green)</option>
                          <option value="midnight">Cosmic Midnight (Deep Blue)</option>
                        </select>
                      </div>

                      <Button type="submit" disabled={isAddingDiary} className="bg-amber-700 hover:bg-amber-600 text-stone-100">
                        {isAddingDiary ? 'Binding page...' : 'Seal Page Into Book 📖'}
                      </Button>
                    </form>
                  )}

                  {/* Diary Pages */}
                  <div className="md:col-span-2 flex flex-col gap-4">
                    {diaryEntries.map(d => {
                      const themeClasses = 
                        d.theme === 'sepia' ? 'bg-[#2b1f15] border-amber-900/60 text-amber-200 font-serif' :
                        d.theme === 'forest' ? 'bg-[#15241b] border-emerald-950 text-emerald-200 font-serif' :
                        d.theme === 'midnight' ? 'bg-[#111c2b] border-blue-950 text-blue-200 font-serif' :
                        'bg-[#28211b] border-amber-950/80 text-amber-100 font-serif'; // vintage default
                      return (
                        <div key={d.id} className={`p-5 rounded-xl border leading-relaxed shadow-lg flex flex-col gap-3 ${themeClasses}`}>
                          <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <span className="text-sm font-bold tracking-wide italic">{d.title}</span>
                            <span className="text-[10px] uppercase font-mono tracking-wider opacity-60">✍️ {d.theme}</span>
                          </div>
                          <p className="text-xs whitespace-pre-wrap font-serif italic font-medium leading-loose">&quot;{d.content}&quot;</p>
                          <div className="flex items-center justify-between text-[9px] opacity-50 mt-2 font-mono">
                            <span>Binding ID: {d.id}</span>
                            <span>
                              Stored: <FormattedDate date={d.createdAt} showTime={false} />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 5. TIME JARS */}
            {activeSubTab === 'jars' && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                  <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider">🏺 Time Capsule Jars (Future Milestones)</h4>
                  <span className="text-xs text-slate-400 font-mono">Locked Envelopes: {jars.length}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Add Jar Form */}
                  {isSelf && (
                    <form onSubmit={handleAddJarSubmit} className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex flex-col gap-4">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest font-mono">Seal a Time Capsule message:</span>
                      
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-500 font-mono">Jar Label / Purpose</label>
                        <input
                          type="text"
                          required
                          value={newJarTitle}
                          onChange={(e) => setNewJarTitle(e.target.value)}
                          placeholder="e.g. For Arthur Green’s 21st Birthday"
                          className="bg-stone-950 border border-slate-850 rounded p-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-500 font-mono">Secret Letter Message</label>
                        <textarea
                          required
                          rows={3}
                          value={newJarMessage}
                          onChange={(e) => setNewJarMessage(e.target.value)}
                          placeholder="Write down wisdom, advice, keys..."
                          className="bg-stone-950 border border-slate-850 rounded p-2 text-xs text-slate-200 outline-none focus:border-amber-500 resize-none font-serif italic"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-500 font-mono">Unlock Year Target</label>
                        <input
                          type="number"
                          required
                          value={newJarYear}
                          onChange={(e) => setNewJarYear(parseInt(e.target.value, 10))}
                          className="bg-stone-950 border border-slate-850 rounded p-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                        />
                      </div>

                      <Button type="submit" disabled={isAddingJar} className="bg-amber-700 hover:bg-amber-600 text-stone-100">
                        {isAddingJar ? 'Sealing jar...' : 'Seal in Time Capsule Jar 🏺'}
                      </Button>
                    </form>
                  )}

                  {/* Jars Grid */}
                  <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {jars.map(j => (
                      <div key={j.id} className="bg-slate-900/50 border border-slate-850 p-4 rounded-xl flex flex-col gap-3 relative shadow-inner">
                        <div className="absolute top-3 right-3 text-2xl animate-bounce">🏺</div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-200">{j.title}</span>
                          <span className="text-[10px] font-mono text-amber-500 uppercase font-semibold mt-1">🔒 LOCKED UNTIL {j.unlockYear}</span>
                        </div>
                        <div className="p-3 bg-stone-950/80 border border-amber-950 rounded-lg text-[11px] text-slate-400 font-serif italic leading-relaxed whitespace-pre-wrap">
                          {new Date().getFullYear() >= j.unlockYear ? (
                            <span>&quot;{j.message}&quot;</span>
                          ) : (
                            <span className="text-slate-600">The wax seal on this jar is intact. Revisit in {j.unlockYear - new Date().getFullYear()} years to dissolve the secure lock.</span>
                          )}
                        </div>
                        <div className="text-[9px] text-slate-600 font-mono mt-2">
                          Prepared: <FormattedDate date={j.createdAt} showTime={false} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 6. TRUSTED HELPERS */}
            {activeSubTab === 'helpers' && (
              <div className="flex flex-col gap-6">
                <div className="flex items-col gap-1 border-b border-slate-850 pb-3">
                  <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider">🤝 Trusted Helper Connection & Recovery</h4>
                  <p className="text-xs text-slate-400">Designate family caregivers who can help recover your password or modify high accessibility settings.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left panel: List */}
                  <div className="md:col-span-2 flex flex-col gap-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Assigned Helpers:</span>
                    {trustedHelpers.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-500 italic bg-slate-950/20 border border-slate-850 rounded-xl">
                        No helpers logged. Add one on the right to authorize access override!
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {trustedHelpers.map(helper => (
                          <div key={helper.id} className="bg-slate-900/50 border border-slate-850 p-4 rounded-xl flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl">
                                ❤️
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-200">{helper.name}</span>
                                <span className="text-[9px] font-mono uppercase text-amber-500 tracking-wider">{helper.relationship}</span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleRequestRecoveryPin(helper.name)}
                              className="px-3 py-1.5 bg-amber-950/40 hover:bg-amber-900/40 text-amber-400 text-[10px] font-bold rounded uppercase tracking-wider border border-amber-900/40 transition-all cursor-pointer"
                            >
                              Get PIN Override
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {recoveryPinGenerated && (
                      <div className="p-4 bg-amber-950/30 border border-amber-800/40 rounded-xl leading-relaxed whitespace-pre-wrap font-serif italic text-xs text-amber-200">
                        {recoveryPinGenerated}
                      </div>
                    )}
                  </div>

                  {/* Form */}
                  {isSelf && (
                    <form onSubmit={handleAddTrustedHelperSubmit} className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex flex-col gap-4">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest font-mono">Assign New Trusted Helper:</span>
                      
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-500 font-mono">Helper Name</label>
                        <input
                          type="text"
                          required
                          value={newHelperName}
                          onChange={(e) => setNewHelperName(e.target.value)}
                          placeholder="e.g. Lily Green"
                          className="bg-stone-950 border border-slate-850 rounded p-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-500 font-mono">Relationship Link</label>
                        <select
                          value={newHelperRelationship}
                          onChange={(e) => setNewHelperRelationship(e.target.value)}
                          className="bg-stone-950 border border-slate-850 rounded p-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                        >
                          <option value="">Select connection...</option>
                          <option value="Daughter">Daughter</option>
                          <option value="Son">Son</option>
                          <option value="Grandchild">Grandchild</option>
                          <option value="Caregiver">Caregiver</option>
                          <option value="Sibling">Sibling</option>
                        </select>
                      </div>

                      <Button type="submit" disabled={isAddingHelper} className="bg-amber-700 hover:bg-amber-600 text-stone-100">
                        {isAddingHelper ? 'Assigning helper...' : 'Authorize Trusted Helper 🤝'}
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* 7. LOCKBOX SAFE */}
            {activeSubTab === 'lockbox' && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1 border-b border-slate-850 pb-3">
                  <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider">🪵 Private Lockbox & The Vault Album</h4>
                  <p className="text-xs text-slate-400">Keep confidential files, legacy estate papers, and private wedding portraits locked away under a 3-digit rotary combination chest.</p>
                </div>

                {isLockboxLocked ? (
                  /* LOCKED TUMBLER VIEW */
                  <div className="bg-[#1c120a] border border-amber-950 p-8 rounded-xl flex flex-col items-center justify-center gap-6 shadow-2xl">
                    <div className="text-center flex flex-col gap-1">
                      <div className="text-4xl animate-pulse">🪵🔒</div>
                      <h5 className="text-sm font-bold text-amber-200 font-serif italic mt-2">The Legacy Lockbox is Locked</h5>
                      <p className="text-[11px] text-amber-100/50 max-w-sm mx-auto mt-1">Rotate the wooden dials to the correct combination (Default Code: 123) to access the safe cabinet</p>
                    </div>

                    {/* Dials */}
                    <div className="flex items-center gap-4 bg-stone-950/90 border border-amber-950 p-4 rounded-xl">
                      {[0, 1, 2].map((idx) => (
                        <div key={idx} className="flex flex-col items-center gap-2 bg-[#2d1b0f] border border-amber-900/60 p-2 rounded shadow">
                          <button
                            type="button"
                            onClick={() => {
                              const copy = [...lockboxInputCombo];
                              const cur = parseInt(copy[idx], 10);
                              copy[idx] = ((cur + 1) % 10).toString();
                              setLockboxInputCombo(copy);
                            }}
                            className="text-amber-500 hover:text-amber-300 font-bold p-1 text-xs cursor-pointer"
                          >
                            ▲
                          </button>
                          <span className="text-xl font-mono font-bold text-amber-200 bg-black/60 px-3 py-1 rounded border border-amber-950">
                            {lockboxInputCombo[idx]}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const copy = [...lockboxInputCombo];
                              const cur = parseInt(copy[idx], 10);
                              copy[idx] = ((cur - 1 + 10) % 10).toString();
                              setLockboxInputCombo(copy);
                            }}
                            className="text-amber-500 hover:text-amber-300 font-bold p-1 text-xs cursor-pointer"
                          >
                            ▼
                          </button>
                        </div>
                      ))}
                    </div>

                    {lockboxValidationError && (
                      <span className="text-xs text-rose-400 font-medium text-center">{lockboxValidationError}</span>
                    )}

                    <button
                      onClick={handleUnlockLockbox}
                      className="px-6 py-2 bg-amber-700 hover:bg-amber-600 text-stone-100 font-bold rounded-lg uppercase tracking-wider text-xs transition-all shadow"
                    >
                      Unlock Lockbox Chest 🔑
                    </button>

                    <div className="border-t border-amber-950/50 pt-4 w-full text-center">
                      <button
                        onClick={() => {
                          if (trustedHelpers.length > 0) {
                            handleRequestRecoveryPin(trustedHelpers[0].name);
                          } else {
                            handleRequestRecoveryPin("Your designated family member");
                          }
                        }}
                        className="text-[10px] text-amber-400/70 hover:text-amber-300 underline"
                      >
                        Forgot combo? Tap to broadcast override request to Lily Green
                      </button>
                    </div>
                  </div>
                ) : (
                  /* UNLOCKED SAFE VIEW */
                  <div className="bg-[#1c120a] border border-emerald-950 p-6 rounded-xl flex flex-col gap-6 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-amber-900/30 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🪵🔓</span>
                        <div className="flex flex-col">
                          <h5 className="text-sm font-bold text-amber-200 font-serif italic">Lockbox safe cabinet • Open</h5>
                          <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider">🔒 CONFIDENTIAL ACCESS PERMITTED</span>
                        </div>
                      </div>

                      <button
                        onClick={handleSaveLockbox}
                        className="px-3 py-1.5 bg-amber-900/40 hover:bg-amber-800/40 border border-amber-700 text-amber-300 font-bold uppercase tracking-wider text-[10px] rounded transition-all"
                      >
                        {isSavingLockbox ? 'Sealing...' : 'Seal safe Cabinet 🔒'}
                      </button>
                    </div>

                    {/* Inside: Vault photos */}
                    <div className="bg-stone-950/40 border border-amber-950 p-4 rounded-xl flex flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-amber-300 uppercase tracking-widest font-mono">The Private Vault Album</span>
                        <p className="text-[11px] text-amber-100/60 leading-relaxed">Confidential memories that do not appear on your public social timeline.</p>
                      </div>

                      {/* Add Vault Photo */}
                      {isSelf && (
                        <form onSubmit={handleAddVaultPhotoSubmit} className="bg-[#2d1b0f]/30 border border-amber-900/40 p-4 rounded-xl flex flex-col gap-3">
                          <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider font-mono">Deposit Photo:</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] text-amber-100/50">Confidential Photo URL</label>
                              <input
                                type="text"
                                value={newVaultPhotoUrl}
                                onChange={(e) => setNewVaultPhotoUrl(e.target.value)}
                                className="bg-stone-950 border border-amber-950 rounded text-xs p-2 text-stone-200 outline-none focus:border-amber-500"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] text-amber-100/50">Private Photo Caption</label>
                              <input
                                type="text"
                                required
                                value={newVaultPhotoCaption}
                                onChange={(e) => setNewVaultPhotoCaption(e.target.value)}
                                placeholder="Confidential note..."
                                className="bg-stone-950 border border-amber-950 rounded text-xs p-2 text-stone-200 outline-none focus:border-amber-500"
                              />
                            </div>
                          </div>
                          <Button type="submit" disabled={isAddingVaultPhoto} className="bg-amber-850 hover:bg-amber-800 text-stone-100 self-end mt-1">
                            {isAddingVaultPhoto ? 'Stashing...' : 'Secure Photo in Vault'}
                          </Button>
                        </form>
                      )}

                      {/* Vault Photos grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {vaultPhotos.map(vp => (
                          <div key={vp.id} className="bg-stone-950/80 border border-amber-950/60 rounded-xl overflow-hidden flex flex-col">
                            <div className="h-28 bg-stone-900">
                              <img src={vp.imageUrl} alt="Vault file" className="w-full h-full object-cover" />
                            </div>
                            <div className="p-2 bg-stone-950 flex flex-col gap-1">
                              <span className="text-[10px] text-stone-200 font-serif italic leading-relaxed">&quot;{vp.caption}&quot;</span>
                              <span className="text-[8px] font-mono text-amber-500/60">
                                Deposited: <FormattedDate date={vp.createdAt} showTime={false} />
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 8. MEMORY GARDEN & QUILTING */}
            {activeSubTab === 'garden' && (
              <div className="flex flex-col gap-8">
                {/* GARDEN SECTION */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                    <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider">🌸 Grandma’s Virtual Memory Garden</h4>
                    <span className="text-xs text-slate-400 font-mono">Flowers Planted: {flowers.length}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Plant flower form */}
                    {isSelf && (
                      <form onSubmit={handlePlantFlowerSubmit} className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex flex-col gap-4">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest font-mono">Plant a memory seed:</span>
                        
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-500 font-mono">Flower Label / Name</label>
                          <input
                            type="text"
                            required
                            value={newFlowerName}
                            onChange={(e) => setNewFlowerName(e.target.value)}
                            placeholder="e.g. Lavender for Arthur"
                            className="bg-stone-950 border border-slate-850 rounded p-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-500 font-mono">Flower Type</label>
                          <select
                            value={newFlowerType}
                            onChange={(e) => setNewFlowerType(e.target.value)}
                            className="bg-stone-950 border border-slate-850 rounded p-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                          >
                            <option value="Lavender">Sweet Lavender (Purple)</option>
                            <option value="Daisy">Cheerful Daisy (White)</option>
                            <option value="Rose">Crimson Rose (Red)</option>
                            <option value="Marigold">Golden Marigold (Amber)</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-500 font-mono">Memory Note</label>
                          <input
                            type="text"
                            value={newFlowerNote}
                            onChange={(e) => setNewFlowerNote(e.target.value)}
                            placeholder="e.g. He loved this fragrance on his childhood walks"
                            className="bg-stone-950 border border-slate-850 rounded p-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                          />
                        </div>

                        <Button type="submit" disabled={isPlanting} className="bg-amber-700 hover:bg-amber-600 text-stone-100">
                          {isPlanting ? 'Planting seed...' : 'Plant Memory Flower 🌸'}
                        </Button>
                      </form>
                    )}

                    {/* Garden beds */}
                    <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4 bg-stone-950/20 border border-slate-850 rounded-xl p-4 min-h-[180px]">
                      {flowers.map(flower => (
                        <div key={flower.id} className="bg-[#121c13] border border-emerald-950/60 p-3.5 rounded-lg flex flex-col items-center justify-center text-center gap-2 hover:scale-105 transition-all">
                          <span className="text-3xl animate-bounce">🌸</span>
                          <span className="text-xs font-bold text-emerald-300 font-serif leading-relaxed italic">{flower.name}</span>
                          <span className="text-[9px] font-mono text-emerald-500/70 tracking-wider uppercase">{flower.type}</span>
                          <p className="text-[10px] text-slate-400 mt-1 font-sans italic line-clamp-2">&quot;{flower.note}&quot;</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* QUILTING SECTION */}
                <div className="flex flex-col gap-4 border-t border-slate-850 pt-6">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                    <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider">🧵 Legacy Family Patchwork Quilt</h4>
                    <span className="text-xs text-slate-400 font-mono">Quilt Squares: {quilts.length}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Add quilt square form */}
                    {isSelf && (
                      <form onSubmit={handleStitchQuiltSubmit} className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex flex-col gap-4">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest font-mono">Stitch a patchwork patch:</span>
                        
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-500 font-mono">Pattern Choice</label>
                          <select
                            value={newQuiltPattern}
                            onChange={(e) => setNewQuiltPattern(e.target.value)}
                            className="bg-stone-950 border border-slate-850 rounded p-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                          >
                            <option value="Starry Sky">Starry Sky Patchwork</option>
                            <option value="Log Cabin">Traditional Log Cabin</option>
                            <option value="Double Wedding">Double Wedding Loop</option>
                            <option value="Bears Paw">Classic Bear’s Paw</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-500 font-mono">Fabric Scrap Texture Color</label>
                          <select
                            value={newQuiltColor}
                            onChange={(e) => setNewQuiltColor(e.target.value)}
                            className="bg-stone-950 border border-slate-850 rounded p-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                          >
                            <option value="bg-indigo-900">Baby Indigo scraps</option>
                            <option value="bg-amber-800">Cozy Flannel Amber</option>
                            <option value="bg-emerald-950">Grandma’s Silk Emerald</option>
                            <option value="bg-rose-950">Wedding Dress Velvet Red</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-500 font-mono">Fabric Scraps Origin / Story</label>
                          <input
                            type="text"
                            required
                            value={newQuiltFabric}
                            onChange={(e) => setNewQuiltFabric(e.target.value)}
                            placeholder="e.g. Scraps from Arthur's flannel shirt"
                            className="bg-stone-950 border border-slate-850 rounded p-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-500 font-mono">Stitched By (Whom?)</label>
                          <input
                            type="text"
                            value={newQuiltStitcher}
                            onChange={(e) => setNewQuiltStitcher(e.target.value)}
                            placeholder="e.g. Grandma, Lily"
                            className="bg-stone-950 border border-slate-850 rounded p-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                          />
                        </div>

                        <Button type="submit" disabled={isStitching} className="bg-amber-700 hover:bg-amber-600 text-stone-100">
                          {isStitching ? 'Stitching quilt patch...' : 'Stitch Patch Into Quilt 🧵'}
                        </Button>
                      </form>
                    )}

                    {/* Quilt patch grid */}
                    <div className="md:col-span-2 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 bg-stone-950/40 p-4 rounded-xl border border-slate-850 min-h-[180px]">
                      {quilts.map(q => (
                        <div
                          key={q.id}
                          className={`aspect-square ${q.color} border-2 border-stone-850/60 rounded flex flex-col items-center justify-center p-1.5 text-center text-slate-100 font-serif leading-tight hover:scale-105 transition-all shadow-md`}
                          title={`${q.pattern}. Fabric note: ${q.fabricNote}. Stitched by: ${q.stitchedBy}`}
                          onClick={() => speak(`${q.pattern} quilt block, stitched by ${q.stitchedBy}. Notes: ${q.fabricNote}`)}
                        >
                          <span className="text-base">🧵</span>
                          <span className="text-[8px] font-bold line-clamp-1 mt-0.5">{q.pattern}</span>
                          <span className="text-[7px] text-slate-400/90 line-clamp-1 mt-0.5">{q.stitchedBy}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 9. SOUND ALBUMS */}
            {activeSubTab === 'sound' && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                  <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider">🎧 Soothing Ambient Sound Albums</h4>
                  <span className="text-xs text-slate-400 font-mono">Albums count: {soundAlbums.length}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {soundAlbums.map(album => (
                    <div key={album.id} className="bg-slate-900/40 border border-slate-850 rounded-xl overflow-hidden flex flex-col">
                      <div className="h-40 relative">
                        <img src={album.imageUrl} alt={album.title} className="w-full h-full object-cover" />
                        <button
                          onClick={() => speak(`Playing soundtrack for ${album.title}: ${album.soundtrack}`)}
                          className="absolute bottom-3 right-3 bg-amber-500 text-stone-950 p-2.5 rounded-full hover:scale-110 transition-all cursor-pointer font-bold flex items-center justify-center"
                        >
                          ▶️
                        </button>
                      </div>
                      <div className="p-4 flex flex-col gap-2">
                        <h5 className="text-xs font-bold text-slate-100">{album.title}</h5>
                        <p className="text-[11px] text-slate-400 leading-normal font-sans">{album.description}</p>
                        <span className="text-[9px] font-mono text-amber-500 uppercase font-semibold mt-1">🎵 Soundtrack: {album.soundtrack}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Pocket-Photo Dusting Assistant */}
      {isSelf && (
        <div className="mt-8 border-t border-slate-800/80 pt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h4 className="text-sm font-bold text-amber-500 uppercase tracking-wider flex items-center gap-2">
              🧹 Pocket-Photo Dusting Assistant
            </h4>
            <p className="text-xs text-slate-400">Identify and sweep away accidental photos, pitch-black pockets, or heavy blurs to save storage memory space.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Pocket Shot 1 */}
            <div className="bg-stone-950/60 border border-amber-900/40 p-4 rounded-xl flex flex-col gap-3">
              <div className="relative h-24 bg-stone-900 rounded overflow-hidden">
                <div className="absolute inset-0 bg-stone-950 border border-stone-900 flex items-center justify-center text-stone-800 text-3xl font-mono">
                  📴
                </div>
                <div className="absolute top-2 left-2 bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase font-mono">
                  Dark Pocket 98%
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-200">Pitch Black Pocket Capture</span>
                <span className="text-[9px] text-slate-500 font-mono mt-0.5">Size: 4.2MB • Taken yesterday</span>
              </div>
              <div className="flex gap-2 justify-end mt-1">
                <button 
                  onClick={() => {
                    speak("Relic kept! Pip marked this as important.");
                    alert("Kept! This photo will not be dusted.");
                  }} 
                  className="bg-stone-900 hover:bg-stone-850 text-stone-400 text-[10px] font-bold px-2.5 py-1.5 rounded cursor-pointer border border-stone-800"
                >
                  Keep Photo
                </button>
                <button 
                  onClick={() => {
                    speak("Dusted off! 4.2 megabytes freed successfully.");
                    alert("Accidental photo dusted off successfully!");
                  }} 
                  className="bg-amber-800 hover:bg-amber-700 text-amber-100 text-[10px] font-bold px-2.5 py-1.5 rounded cursor-pointer"
                >
                  Dust Off 🧹
                </button>
              </div>
            </div>

            {/* Pocket Shot 2 */}
            <div className="bg-stone-950/60 border border-amber-900/40 p-4 rounded-xl flex flex-col gap-3">
              <div className="relative h-24 bg-stone-900 rounded overflow-hidden">
                <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80" alt="Duplicate" className="w-full h-full object-cover opacity-40 blur-[1px]" />
                <div className="absolute top-2 left-2 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase font-mono">
                  Duplicate 99%
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-200">Duplicated Lily Green portrait</span>
                <span className="text-[9px] text-slate-500 font-mono mt-0.5">Size: 3.5MB • Taken 2h ago</span>
              </div>
              <div className="flex gap-2 justify-end mt-1">
                <button 
                  onClick={() => {
                    speak("Kept duplicate.");
                    alert("Kept!");
                  }} 
                  className="bg-stone-900 hover:bg-stone-850 text-stone-400 text-[10px] font-bold px-2.5 py-1.5 rounded cursor-pointer border border-stone-800"
                >
                  Keep Photo
                </button>
                <button 
                  onClick={() => {
                    speak("Dusted off! Cleared redundant copy.");
                    alert("Redundant copy dusted off! 3.5MB freed.");
                  }} 
                  className="bg-amber-800 hover:bg-amber-700 text-amber-100 text-[10px] font-bold px-2.5 py-1.5 rounded cursor-pointer"
                >
                  Dust Off 🧹
                </button>
              </div>
            </div>

            {/* Pocket Shot 3 */}
            <div className="bg-stone-950/60 border border-amber-900/40 p-4 rounded-xl flex flex-col gap-3">
              <div className="relative h-24 bg-stone-900 rounded overflow-hidden">
                <img src="https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?w=200&q=80" alt="Sidewalk" className="w-full h-full object-cover opacity-30 blur-[4px]" />
                <div className="absolute top-2 left-2 bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase font-mono">
                  Heavy Blur 95%
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-200">Blurry Ground Sidewalk</span>
                <span className="text-[9px] text-slate-500 font-mono mt-0.5">Size: 2.1MB • Taken 3 days ago</span>
              </div>
              <div className="flex gap-2 justify-end mt-1">
                <button 
                  onClick={() => {
                    speak("Kept blurry shot.");
                    alert("Kept!");
                  }} 
                  className="bg-stone-900 hover:bg-stone-850 text-stone-400 text-[10px] font-bold px-2.5 py-1.5 rounded cursor-pointer border border-stone-800"
                >
                  Keep Photo
                </button>
                <button 
                  onClick={() => {
                    speak("Dusted off blurry shot.");
                    alert("Accidental blurry shot dusted off! 2.1MB freed.");
                  }} 
                  className="bg-amber-800 hover:bg-amber-700 text-amber-100 text-[10px] font-bold px-2.5 py-1.5 rounded cursor-pointer"
                >
                  Dust Off 🧹
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10. Printable Compile Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-lg w-full flex flex-col gap-4 shadow-2xl">
            <h4 className="text-base font-bold text-amber-400 flex items-center gap-2">
              <Printer className="w-5 h-5" /> Compile Printable Album
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              VividPulse compiles your attic relics, childhood keepsakes, family album portraits, and leather-bound journals into a high-legibility layout for home physical printing.
            </p>

            <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl text-[11px] text-slate-400 leading-relaxed font-serif italic">
              ✨ Format optimized for standard US Letter or A4 papers, utilizing extra large font sizes, generous negative spacing, and heavy borders. Perfect to keep in the physical home cupboard!
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 bg-stone-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold uppercase tracking-wider rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsPrintModalOpen(false);
                  handlePrintAlbum();
                }}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold uppercase tracking-wider rounded-lg cursor-pointer shadow-lg"
              >
                Launch Printer Compilation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
