'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FolderHeart, Archive, Award, Users, Flower2, Grid, Printer, 
  Calendar, Music, BookOpen, Lock, Unlock, Trash2, Plus, 
  ChevronRight, ChevronLeft, Volume2, Sparkles, Check, X, Camera
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { User as UserType } from '@/lib/db';
import { 
  getAtticKeepsakes, addAtticKeepsake, 
  getDailyWins, addDailyWin, deleteDailyWin,
  getFamilyMembers, addFamilyMember, addFamilyPhoto,
  getGardenFlowers, addGardenFlowerUpdate,
  getPatchworkQuilts, generatePatchworkQuilt,
  getPaperChains, createPaperChain,
  getSoundAlbums, createSoundAlbum,
  getLeatherDiaryEntries, createLeatherDiaryEntry,
  getTimeCapsuleJars, createTimeCapsuleJar
} from '@/lib/actions';

// Define the interface props
interface MemoryLanesProps {
  username: string;
  isSelf: boolean;
  currentUser: UserType | null;
}

export default function MemoryLanes({ username, isSelf, currentUser }: MemoryLanesProps) {
  // Active inner tool tab
  const [activeSubTab, setActiveSubTab] = React.useState<
    'attic' | 'wins' | 'family' | 'garden' | 'quilt' | 'countdown' | 'sounds' | 'diary' | 'capsule'
  >('attic');

  // Loading indicator for lists
  const [loading, setLoading] = React.useState(true);

  // Lists state
  const [keepsakes, setKeepsakes] = React.useState<any[]>([]);
  const [wins, setWins] = React.useState<any[]>([]);
  const [family, setFamily] = React.useState<any[]>([]);
  const [flowers, setFlowers] = React.useState<any[]>([]);
  const [quilts, setQuilts] = React.useState<any[]>([]);
  const [countdowns, setCountdowns] = React.useState<any[]>([]);
  const [soundAlbums, setSoundAlbums] = React.useState<any[]>([]);
  const [diaryEntries, setDiaryEntries] = React.useState<any[]>([]);
  const [jars, setJars] = React.useState<any[]>([]);

  // Modals / forms state
  const [activeChest, setActiveChest] = React.useState<string | null>(null);
  const [newKeepsakeForm, setNewKeepsakeForm] = React.useState({ title: '', memory: '', chest: 'childhood', image: 'https://picsum.photos/seed/keepsake_new/600/400', yearOffset: 1 });
  const [newWinText, setNewWinText] = React.useState('');
  const [newWinCategory, setNewWinCategory] = React.useState<'ferns' | 'reading' | 'stretching' | 'baking' | 'brewing' | 'resting'>('ferns');
  const [newMemberForm, setNewMemberForm] = React.useState({ name: '', relationship: '', avatar: '' });
  const [selectedMemberId, setSelectedMemberId] = React.useState<string | null>(null);
  const [newPhotoForm, setNewPhotoForm] = React.useState({ url: 'https://picsum.photos/seed/fam_photo/600/450', caption: '' });
  const [newGardenUpdate, setNewGardenUpdate] = React.useState('');
  const [newGardenFlowerType, setNewGardenFlowerType] = React.useState<'sunflower' | 'tulip' | 'lavender' | 'rose' | 'daisy'>('sunflower');
  const [newQuiltTitle, setNewQuiltTitle] = React.useState('');
  const [newQuiltPattern, setNewQuiltPattern] = React.useState<'checkerboard' | 'starburst' | 'chevron' | 'spiral'>('checkerboard');
  const [newCountdownForm, setNewCountdownForm] = React.useState({ title: '', targetDate: '', image: 'https://picsum.photos/seed/chain/500/300', ringColor: 'warm-amber' });
  const [newSoundForm, setNewSoundForm] = React.useState({ title: '', slides: [{ imageUrl: 'https://picsum.photos/seed/slidea/600/400', description: '', voiceLabel: '' }] });
  const [newDiaryForm, setNewDiaryForm] = React.useState({ title: '', content: '', isPrivate: true, theme: 'classic-burgundy' });
  const [newJarForm, setNewJarForm] = React.useState({ title: '', unlockDate: '', message: '', photoUrls: ['https://picsum.photos/seed/jar1/500/400', 'https://picsum.photos/seed/jar2/500/400'] });

  // Sound slideshow active player state
  const [activeSlideshowAlbumId, setActiveSlideshowAlbumId] = React.useState<string | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = React.useState(0);
  const [isPlayingLullaby, setIsPlayingLullaby] = React.useState(false);

  // Printable monthly compilation view modal
  const [isPrintModalOpen, setIsPrintModalOpen] = React.useState(false);
  const [selectedPrintMonth, setSelectedPrintMonth] = React.useState('Current Month');

  // Load all lists
  const loadAllData = async () => {
    setLoading(true);
    try {
      const keepsakesList = await getAtticKeepsakes();
      const winsList = await getDailyWins();
      const familyList = await getFamilyMembers();
      const gardenList = await getGardenFlowers();
      const quiltsList = await getPatchworkQuilts();
      const countdownsList = await getPaperChains();
      const soundsList = await getSoundAlbums();
      const diaryList = await getLeatherDiaryEntries();
      const jarsList = await getTimeCapsuleJars();

      setKeepsakes(keepsakesList || []);
      setWins(winsList || []);
      setFamily(familyList || []);
      setFlowers(gardenList || []);
      setQuilts(quiltsList || []);
      setCountdowns(countdownsList || []);
      setSoundAlbums(soundsList || []);
      setDiaryEntries(diaryList || []);
      setJars(jarsList || []);
    } catch (e) {
      console.error('Failed loading memory lanes data:', e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadAllData();
  }, [username]);

  // Form submission helpers
  const handleAddKeepsake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeepsakeForm.title || !newKeepsakeForm.memory) return;
    const res = await addAtticKeepsake(
      newKeepsakeForm.title,
      newKeepsakeForm.image,
      newKeepsakeForm.yearOffset,
      'July 7', // exact day context
      newKeepsakeForm.memory,
      newKeepsakeForm.chest
    );
    if (res.success) {
      setNewKeepsakeForm({ title: '', memory: '', chest: 'childhood', image: 'https://picsum.photos/seed/keepsake_new/600/400', yearOffset: 1 });
      const updated = await getAtticKeepsakes();
      setKeepsakes(updated || []);
    }
  };

  const handleAddDailyWin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWinText.trim()) return;
    const res = await addDailyWin(newWinCategory, newWinText);
    if (res.success) {
      setNewWinText('');
      const updated = await getDailyWins();
      setWins(updated || []);
    }
  };

  const handleDeleteWin = async (id: string) => {
    const res = await deleteDailyWin(id);
    if (res.success) {
      const updated = await getDailyWins();
      setWins(updated || []);
    }
  };

  const handleAddFamilyMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberForm.name || !newMemberForm.relationship) return;
    const seedId = Math.floor(Math.random() * 1000);
    const avatar = newMemberForm.avatar || `https://picsum.photos/seed/${seedId}/150/150`;
    const res = await addFamilyMember(newMemberForm.name, newMemberForm.relationship, avatar);
    if (res.success) {
      setNewMemberForm({ name: '', relationship: '', avatar: '' });
      const updated = await getFamilyMembers();
      setFamily(updated || []);
    }
  };

  const handleAddFamilyPhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || !newPhotoForm.caption) return;
    const res = await addFamilyPhoto(selectedMemberId, newPhotoForm.url, newPhotoForm.caption);
    if (res.success) {
      setNewPhotoForm({ url: `https://picsum.photos/seed/fam_photo_${Date.now()}/600/450`, caption: '' });
      setSelectedMemberId(null);
      const updated = await getFamilyMembers();
      setFamily(updated || []);
    }
  };

  const handleAddGardenUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGardenUpdate.trim()) return;
    const res = await addGardenFlowerUpdate(newGardenFlowerType, newGardenUpdate);
    if (res.success) {
      setNewGardenUpdate('');
      const updated = await getGardenFlowers();
      setFlowers(updated || []);
    }
  };

  const handleGenerateQuiltSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newQuiltTitle.trim() || 'My Memory Tapestry';
    // gather some photos from posts or keepsakes to build quilt
    const photoUrls = [
      'https://picsum.photos/seed/q1/200/200',
      'https://picsum.photos/seed/q2/200/200',
      'https://picsum.photos/seed/q3/200/200',
      'https://picsum.photos/seed/q4/200/200',
      'https://picsum.photos/seed/q5/200/200',
      'https://picsum.photos/seed/q6/200/200',
      'https://picsum.photos/seed/q7/200/200',
      'https://picsum.photos/seed/q8/200/200',
      'https://picsum.photos/seed/q9/200/200',
    ];
    const res = await generatePatchworkQuilt(title, newQuiltPattern, photoUrls);
    if (res.success) {
      setNewQuiltTitle('');
      const updated = await getPatchworkQuilts();
      setQuilts(updated || []);
    }
  };

  const handleAddCountdownSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCountdownForm.title || !newCountdownForm.targetDate) return;
    const res = await createPaperChain(
      newCountdownForm.title,
      newCountdownForm.targetDate,
      newCountdownForm.image,
      newCountdownForm.ringColor as any
    );
    if (res.success) {
      setNewCountdownForm({ title: '', targetDate: '', image: 'https://picsum.photos/seed/chain/500/300', ringColor: 'warm-amber' });
      const updated = await getPaperChains();
      setCountdowns(updated || []);
    }
  };

  const handleAddSoundAlbumSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSoundForm.title) return;
    const res = await createSoundAlbum(newSoundForm.title, newSoundForm.slides);
    if (res.success) {
      setNewSoundForm({ title: '', slides: [{ imageUrl: 'https://picsum.photos/seed/slidea/600/400', description: '', voiceLabel: '' }] });
      const updated = await getSoundAlbums();
      setSoundAlbums(updated || []);
    }
  };

  const handleAddDiarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiaryForm.title || !newDiaryForm.content) return;
    const res = await createLeatherDiaryEntry(
      newDiaryForm.title,
      newDiaryForm.content,
      newDiaryForm.isPrivate,
      newDiaryForm.theme as any
    );
    if (res.success) {
      setNewDiaryForm({ title: '', content: '', isPrivate: true, theme: 'classic-burgundy' });
      const updated = await getLeatherDiaryEntries();
      setDiaryEntries(updated || []);
    }
  };

  const handleAddJarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJarForm.title || !newJarForm.unlockDate || !newJarForm.message) return;
    const res = await createTimeCapsuleJar(
      newJarForm.title,
      newJarForm.unlockDate,
      newJarForm.photoUrls,
      newJarForm.message
    );
    if (res.success) {
      setNewJarForm({ title: '', unlockDate: '', message: '', photoUrls: ['https://picsum.photos/seed/jar1/500/400', 'https://picsum.photos/seed/jar2/500/400'] });
      const updated = await getTimeCapsuleJars();
      setJars(updated || []);
    }
  };

  // Helper to calculate days remaining
  const getDaysRemaining = (targetDateStr: string) => {
    const target = new Date(targetDateStr);
    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Trigger browser print
  const handlePrintAlbum = () => {
    window.print();
  };

  const currentSlideshow = soundAlbums.find(sa => sa.id === activeSlideshowAlbumId);

  return (
    <div className="w-full bg-[#070A13] border border-slate-900/40 rounded-lg p-1 sm:p-4 text-slate-100 flex flex-col gap-6 md:gap-8">
      
      {/* Tab Nav Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4 flex-wrap gap-4 px-2">
        <div className="flex items-center gap-3">
          <FolderHeart className="w-5 h-5 text-teal-400" />
          <h2 className="text-base font-bold tracking-wider text-slate-100">Everyday Organizing & Memory Lanes</h2>
        </div>
        
        {/* Grandma's One-Tap Printable Album button */}
        <Button 
          onClick={() => setIsPrintModalOpen(true)}
          variant="secondary" 
          size="sm" 
          className="bg-teal-950/20 border-teal-800 hover:bg-teal-900/30 text-teal-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 h-9"
        >
          <Printer className="w-4 h-4" />
          Printable Album compiles
        </Button>
      </div>

      {/* Grid of the 9 Memory Organizing features */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-9 gap-1.5 p-1 bg-slate-950/40 rounded border border-slate-900/60">
        {[
          { id: 'attic', label: 'Memory Attic', icon: Archive },
          { id: 'wins', label: 'Daily Wins', icon: Award },
          { id: 'family', label: 'Family Tree', icon: Users },
          { id: 'garden', label: 'Cozy Garden', icon: Flower2 },
          { id: 'quilt', label: 'Quilt Mosaic', icon: Grid },
          { id: 'countdown', label: 'Countdowns', icon: Calendar },
          { id: 'sounds', label: 'Sound Albums', icon: Music },
          { id: 'diary', label: 'Leather Diary', icon: BookOpen },
          { id: 'capsule', label: 'Time Capsule', icon: Lock }
        ].map((sub) => {
          const Icon = sub.icon;
          const isActive = activeSubTab === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => {
                setActiveSubTab(sub.id as any);
                setActiveChest(null);
                setActiveSlideshowAlbumId(null);
              }}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded transition-all gap-1 border cursor-pointer ${
                isActive 
                  ? 'bg-teal-950/30 border-teal-500/50 text-teal-300 shadow-[0_0_10px_rgba(20,184,166,0.1)]' 
                  : 'bg-slate-950 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] font-semibold text-center tracking-wide truncate max-w-full">{sub.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="w-full py-16 flex flex-col items-center justify-center text-slate-500 font-mono text-xs gap-3">
          <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <span>Opening memory logs...</span>
        </div>
      ) : (
        <div className="min-h-[400px]">
          
          {/* 1. THE MEMORY ATTIC (Retro wooden-attic interface) */}
          {activeSubTab === 'attic' && (
            <div className="bg-[#1e130c] border border-[#3e2723] rounded-lg p-6 text-orange-100 relative overflow-hidden shadow-2xl">
              {/* Wood Plank Background Lines */}
              <div className="absolute inset-0 bg-[radial-gradient(#5d4037_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
              <div className="absolute top-0 bottom-0 left-12 w-[1px] bg-amber-900/30 pointer-events-none" />
              <div className="absolute top-0 bottom-0 right-12 w-[1px] bg-amber-900/30 pointer-events-none" />

              <div className="relative z-10 flex flex-col gap-6">
                <div className="flex flex-col gap-1.5 border-b border-amber-900 pb-4">
                  <h3 className="text-lg font-serif italic font-bold text-amber-200 flex items-center gap-2">
                    🍂 The Memory Attic
                  </h3>
                  <p className="text-xs text-amber-100/70">
                    A rustic wooden vault sealing photos and hand-written keepsakes posted on this exact calendar day in previous years.
                  </p>
                </div>

                {/* Cardboard Chests Selector */}
                {!activeChest ? (
                  <div className="flex flex-col gap-6">
                    <span className="text-xs font-semibold text-amber-200 tracking-wider uppercase">Choose a Chest to Unlock:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { id: 'childhood', label: 'Childhood Chest', desc: 'Old toys, school days & bedtime tales', color: 'border-amber-800 bg-[#3e2723]/60' },
                        { id: 'travels', label: 'Travel Chest', desc: 'Plane tickets, sandy shores & train trails', color: 'border-amber-800 bg-[#3e2723]/60' },
                        { id: 'holidays', label: 'Holiday Chest', desc: 'Winter quilts, birthday pies & cozy lights', color: 'border-amber-800 bg-[#3e2723]/60' }
                      ].map((chest) => {
                        const itemsInChest = keepsakes.filter(k => k.chestId === chest.id);
                        return (
                          <div
                            key={chest.id}
                            onClick={() => setActiveChest(chest.id)}
                            className={`p-4 border-2 rounded-lg cursor-pointer hover:scale-[1.02] hover:border-amber-500 transition-all flex flex-col gap-3 text-left ${chest.color}`}
                          >
                            <div className="text-4xl">📦</div>
                            <div>
                              <h4 className="text-xs font-bold text-amber-200 uppercase tracking-wider">{chest.label}</h4>
                              <p className="text-[10px] text-amber-100/60 mt-1 leading-relaxed">{chest.desc}</p>
                            </div>
                            <div className="border-t border-amber-900/60 pt-2 flex justify-between items-center text-[9px] font-mono text-amber-300">
                              <span>Locked items:</span>
                              <span className="font-bold">{itemsInChest.length} keepsakes</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Add keepsake form if profile owner */}
                    {isSelf && (
                      <form onSubmit={handleAddKeepsake} className="mt-8 bg-black/30 border border-amber-900/60 rounded-lg p-4 flex flex-col gap-4">
                        <h4 className="text-xs font-bold text-amber-200 uppercase tracking-widest flex items-center gap-2">
                          <Plus className="w-4 h-4" /> Store an Attic Keepsake for today (July 7)
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-amber-100/70 font-mono">Keepsake Title</label>
                            <input 
                              type="text" 
                              value={newKeepsakeForm.title}
                              onChange={e => setNewKeepsakeForm({...newKeepsakeForm, title: e.target.value})}
                              placeholder="e.g. Baking berry tart on the porch"
                              className="bg-stone-950 border border-amber-900/60 text-amber-100 rounded text-xs p-2 focus:border-amber-500 outline-none"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-amber-100/70 font-mono">Year Offset</label>
                            <select
                              value={newKeepsakeForm.yearOffset}
                              onChange={e => setNewKeepsakeForm({...newKeepsakeForm, yearOffset: parseInt(e.target.value, 10)})}
                              className="bg-stone-950 border border-amber-900/60 text-amber-100 rounded text-xs p-2 focus:border-amber-500 outline-none"
                            >
                              <option value={1}>1 Year Ago Today</option>
                              <option value={2}>2 Years Ago Today</option>
                              <option value={3}>3 Years Ago Today</option>
                              <option value={5}>5 Years Ago Today</option>
                              <option value={10}>10 Years Ago Today</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-amber-100/70 font-mono">Attic Chest Category</label>
                          <select
                            value={newKeepsakeForm.chest}
                            onChange={e => setNewKeepsakeForm({...newKeepsakeForm, chest: e.target.value})}
                            className="bg-stone-950 border border-amber-900/60 text-amber-100 rounded text-xs p-2 focus:border-amber-500 outline-none"
                          >
                            <option value="childhood">Childhood Chest</option>
                            <option value="travels">Travel Chest</option>
                            <option value="holidays">Holiday Chest</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-amber-100/70 font-mono">Memory Description</label>
                          <textarea
                            rows={2}
                            value={newKeepsakeForm.memory}
                            onChange={e => setNewKeepsakeForm({...newKeepsakeForm, memory: e.target.value})}
                            placeholder="Write your beautiful retrospective recollections here..."
                            className="bg-stone-950 border border-amber-900/60 text-amber-100 rounded text-xs p-2 focus:border-amber-500 outline-none resize-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-amber-100/70 font-mono">Memory Photo Link (or upload simulator)</label>
                          <input 
                            type="text" 
                            value={newKeepsakeForm.image}
                            onChange={e => setNewKeepsakeForm({...newKeepsakeForm, image: e.target.value})}
                            className="bg-stone-950 border border-amber-900/60 text-amber-100 rounded text-xs p-2 focus:border-amber-500 outline-none"
                          />
                        </div>
                        <Button type="submit" size="sm" className="bg-amber-700 border-amber-600 hover:bg-amber-600 text-stone-100 self-end">
                          Seal in Attic Chest
                        </Button>
                      </form>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between border-b border-amber-900/40 pb-2">
                      <button 
                        onClick={() => setActiveChest(null)}
                        className="text-xs font-semibold text-amber-300 hover:text-amber-100 flex items-center gap-1 cursor-pointer"
                      >
                        ← Back to Chest Selection
                      </button>
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-200">
                        📦 Open Chest: {activeChest}
                      </span>
                    </div>

                    {keepsakes.filter(k => k.chestId === activeChest).length === 0 ? (
                      <div className="py-12 text-center text-xs text-amber-100/50 italic">
                        This cardboard storage chest is empty. Add a keepsake to seal your memories inside!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {keepsakes.filter(k => k.chestId === activeChest).map((k) => (
                          <div key={k.id} className="bg-stone-950/60 border border-amber-900/60 rounded-lg overflow-hidden flex flex-col shadow-lg">
                            <div className="relative h-48 w-full bg-stone-900">
                              <img 
                                src={k.imageUrl} 
                                alt={k.title} 
                                className="w-full h-full object-cover grayscale-[30%] sepia-[20%] contrast-[95%]"
                              />
                              <div className="absolute top-2 right-2 bg-amber-950/90 border border-amber-800 text-amber-200 text-[9px] font-mono font-bold px-2 py-0.5 rounded shadow">
                                {k.yearOffset} YEARS AGO TODAY
                              </div>
                            </div>
                            <div className="p-4 flex flex-col gap-2">
                              <h5 className="text-xs font-bold text-amber-200">{k.title}</h5>
                              <p className="text-[11px] text-amber-100/70 font-serif leading-relaxed italic">
                                &quot;{k.memoryText}&quot;
                              </p>
                              <span className="text-[9px] font-mono text-amber-500/80 mt-1 align-self-end">
                                Sealed on: {new Date(k.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. DAILY WINS JOURNAL */}
          {activeSubTab === 'wins' && (
            <div className="bg-[#0c1410] border border-[#1b3a24] rounded-lg p-6 text-emerald-100 flex flex-col gap-6 shadow-2xl">
              <div className="flex flex-col gap-1.5 border-b border-emerald-900 pb-4">
                <h3 className="text-lg font-serif italic font-bold text-emerald-300 flex items-center gap-2">
                  🌿 Daily Wins Journal
                </h3>
                <p className="text-xs text-emerald-100/70">
                  Celebrate and share cozy tiny daily accomplishments, such as watering the ferns, finishing a book chapter, or slow-stretching.
                </p>
              </div>

              {/* Add a daily win if profile owner */}
              {isSelf && (
                <form onSubmit={handleAddDailyWin} className="bg-emerald-950/20 border border-emerald-900/50 rounded-lg p-4 flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1 flex flex-col gap-1.5 w-full">
                    <label className="text-[10px] text-emerald-300/80 font-mono uppercase tracking-wider">What tiny victory did you complete today?</label>
                    <input 
                      type="text"
                      value={newWinText}
                      onChange={e => setNewWinText(e.target.value)}
                      placeholder="e.g. Brewed a fresh cup of organic mint chamomile tea..."
                      className="bg-slate-950 border border-emerald-900/60 text-emerald-100 rounded text-xs p-2.5 focus:border-emerald-500 outline-none w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 w-full sm:w-48">
                    <label className="text-[10px] text-emerald-300/80 font-mono uppercase tracking-wider">Category</label>
                    <select
                      value={newWinCategory}
                      onChange={e => setNewWinCategory(e.target.value as any)}
                      className="bg-slate-950 border border-emerald-900/60 text-emerald-100 rounded text-xs p-2.5 focus:border-emerald-500 outline-none"
                    >
                      <option value="ferns">🌿 Watering Ferns</option>
                      <option value="reading">📖 Reading Chapters</option>
                      <option value="stretching">🧘 Slow Stretching</option>
                      <option value="baking">🍞 Warm Baking</option>
                      <option value="brewing">🍵 Tea Brewing</option>
                      <option value="resting">🛌 Healthy Resting</option>
                    </select>
                  </div>
                  <Button type="submit" size="sm" className="bg-emerald-700 border-emerald-600 hover:bg-emerald-600 text-stone-100 h-10 px-4 w-full sm:w-auto">
                    Record Win
                  </Button>
                </form>
              )}

              {/* Grid of recorded victories */}
              <div className="flex flex-col gap-4 mt-2">
                <span className="text-xs font-semibold text-emerald-300 tracking-wider uppercase">Recorded Cozy Achievements:</span>

                {wins.length === 0 ? (
                  <div className="py-12 text-center text-xs text-emerald-100/50 italic border border-dashed border-emerald-900/40 rounded bg-emerald-950/5">
                    No tiny victories logged yet. Start celebrating the little accomplishments!
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {wins.map((win) => {
                      // Get emoji and label for category
                      const categoryMap: any = {
                        ferns: { emoji: '🌿', label: 'Watering Ferns', color: 'bg-green-950/40 text-green-300 border-green-900/60' },
                        reading: { emoji: '📖', label: 'Reading Chapter', color: 'bg-blue-950/40 text-blue-300 border-blue-900/60' },
                        stretching: { emoji: '🧘', label: 'Slow Stretch', color: 'bg-purple-950/40 text-purple-300 border-purple-900/60' },
                        baking: { emoji: '🍞', label: 'Warm Baking', color: 'bg-amber-950/40 text-amber-300 border-amber-900/60' },
                        brewing: { emoji: '🍵', label: 'Tea Brewing', color: 'bg-teal-950/40 text-teal-300 border-teal-900/60' },
                        resting: { emoji: '🛌', label: 'Healthy Rest', color: 'bg-stone-950/40 text-stone-300 border-stone-900/60' }
                      };
                      const cat = categoryMap[win.category] || { emoji: '✨', label: 'Accomplishment', color: 'bg-slate-900' };

                      return (
                        <div key={win.id} className="p-4 rounded-lg bg-slate-950/60 border border-emerald-900/40 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl w-10 h-10 rounded-full bg-emerald-950/40 border border-emerald-800 flex items-center justify-center flex-shrink-0">
                              {cat.emoji}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] uppercase tracking-wider font-mono text-emerald-400 font-bold">{cat.label}</span>
                              <p className="text-xs text-slate-100 mt-1 leading-relaxed">{win.victoryText}</p>
                              <span className="text-[9px] font-mono text-slate-500 mt-0.5">
                                Completed: {new Date(win.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                          {isSelf && (
                            <button 
                              onClick={() => handleDeleteWin(win.id)}
                              className="text-rose-500/70 hover:text-rose-400 p-2 hover:bg-rose-950/20 rounded cursor-pointer transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. SAFE FAMILY TREE ALBUMS */}
          {activeSubTab === 'family' && (
            <div className="bg-[#0b1220] border border-[#1b2b4a] rounded-lg p-6 text-slate-100 flex flex-col gap-6 shadow-2xl">
              <div className="flex flex-col gap-1.5 border-b border-blue-900 pb-4">
                <h3 className="text-lg font-serif italic font-bold text-blue-300 flex items-center gap-2">
                  👨‍👩‍👧‍👦 Safe Family Tree Albums
                </h3>
                <p className="text-xs text-slate-400">
                  Connect beloved family profiles into a visual tree where shared vacation and childhood memories automatically sort under each relative.
                </p>
              </div>

              {/* Visual Tree Display */}
              <div className="bg-slate-950/80 border border-slate-900 p-6 rounded-lg flex flex-col items-center gap-8 relative overflow-x-auto min-h-[220px]">
                {/* Horizontal branches svg path or pure visual styling */}
                <div className="absolute top-1/2 left-10 right-10 h-[2px] bg-blue-900/30 -translate-y-1/2 pointer-events-none hidden sm:block" />

                <div className="flex flex-wrap items-center justify-center gap-8 relative z-10 w-full">
                  {family.map((member) => (
                    <div key={member.id} className="flex flex-col items-center gap-2">
                      <div 
                        onClick={() => setSelectedMemberId(member.id)}
                        className={`relative w-20 h-20 rounded-full p-[3px] cursor-pointer hover:scale-105 transition-all shadow-[0_0_15px_rgba(59,130,246,0.15)] ${
                          selectedMemberId === member.id ? 'bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.4)]' : 'bg-slate-800 hover:bg-slate-700'
                        }`}
                      >
                        <img 
                          src={member.avatarUrl} 
                          alt={member.name}
                          className="w-full h-full rounded-full object-cover border border-slate-950"
                        />
                      </div>
                      <div className="text-center">
                        <h4 className="text-xs font-bold text-slate-100">{member.name}</h4>
                        <span className="text-[9px] uppercase font-mono tracking-widest text-blue-400 font-bold">{member.relationship}</span>
                      </div>
                    </div>
                  ))}

                  {/* Add Family Member card if owner */}
                  {isSelf && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-20 h-20 rounded-full border border-dashed border-blue-900/60 bg-blue-950/10 flex items-center justify-center cursor-pointer hover:bg-blue-950/20 transition-all p-1">
                        <form onSubmit={handleAddFamilyMember} className="flex flex-col gap-1.5 items-center w-full">
                          <input 
                            type="text" 
                            required
                            placeholder="Add Name"
                            value={newMemberForm.name}
                            onChange={e => setNewMemberForm({...newMemberForm, name: e.target.value})}
                            className="bg-stone-950 border border-slate-900 rounded text-[9px] p-1 text-center w-16 text-slate-200 outline-none"
                          />
                          <input 
                            type="text" 
                            required
                            placeholder="Relationship"
                            value={newMemberForm.relationship}
                            onChange={e => setNewMemberForm({...newMemberForm, relationship: e.target.value})}
                            className="bg-stone-950 border border-slate-900 rounded text-[8px] p-0.5 text-center w-16 text-blue-400 outline-none font-mono uppercase"
                          />
                          <button type="submit" className="hidden" />
                        </form>
                      </div>
                      <div className="text-center">
                        <span className="text-[9px] font-mono text-slate-500 font-bold">Add Member</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Photos sorting area */}
              {selectedMemberId && (
                <div className="bg-slate-950/60 border border-slate-900 p-6 rounded-lg flex flex-col gap-4">
                  {(() => {
                    const activeMember = family.find(m => m.id === selectedMemberId);
                    if (!activeMember) return null;
                    return (
                      <>
                        <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                          <h4 className="text-xs font-bold text-blue-300">
                            📂 Photo Album: {activeMember.name} ({activeMember.relationship})
                          </h4>
                          <button 
                            onClick={() => setSelectedMemberId(null)}
                            className="text-[10px] text-slate-500 hover:text-slate-300 cursor-pointer"
                          >
                            Close Album
                          </button>
                        </div>

                        {/* Add Photo form */}
                        {isSelf && (
                          <form onSubmit={handleAddFamilyPhotoSubmit} className="bg-blue-950/10 border border-blue-900/40 p-4 rounded flex flex-col gap-3">
                            <h5 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                              <Camera className="w-3.5 h-3.5" /> Add a vacation or childhood memory photo
                            </h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <input 
                                type="text"
                                placeholder="Photo URL"
                                value={newPhotoForm.url}
                                onChange={e => setNewPhotoForm({...newPhotoForm, url: e.target.value})}
                                className="bg-stone-950 border border-slate-900 text-slate-100 text-xs p-2 rounded outline-none"
                              />
                              <input 
                                type="text"
                                required
                                placeholder="Write a short heartfelt caption..."
                                value={newPhotoForm.caption}
                                onChange={e => setNewPhotoForm({...newPhotoForm, caption: e.target.value})}
                                className="bg-stone-950 border border-slate-900 text-slate-100 text-xs p-2 rounded outline-none"
                              />
                            </div>
                            <Button type="submit" size="sm" className="bg-blue-700 border-blue-600 hover:bg-blue-600 text-slate-100 self-end">
                              Add Photo
                            </Button>
                          </form>
                        )}

                        {/* Photo list */}
                        {activeMember.photos.length === 0 ? (
                          <div className="py-8 text-center text-xs text-slate-500 italic">
                            No photos added under {activeMember.name} yet.
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
                            {activeMember.photos.map((photo: any) => (
                              <div key={photo.id} className="bg-slate-900/60 border border-slate-800 rounded overflow-hidden flex flex-col shadow">
                                <img 
                                  src={photo.url} 
                                  alt="Family Photo"
                                  className="w-full h-32 object-cover"
                                />
                                <div className="p-2.5 flex flex-col gap-1 bg-slate-950/80">
                                  <p className="text-[10px] text-slate-200 font-medium leading-relaxed">
                                    {photo.caption}
                                  </p>
                                  <span className="text-[8px] font-mono text-slate-500">
                                    Added: {new Date(photo.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* 4. THE COZY GARDEN (Profile Flowers grow) */}
          {activeSubTab === 'garden' && (
            <div className="bg-[#0f1b13] border border-[#1b3a24] rounded-lg p-6 text-slate-100 flex flex-col gap-6 shadow-2xl">
              <div className="flex flex-col gap-1.5 border-b border-emerald-900 pb-4">
                <h3 className="text-lg font-serif italic font-bold text-emerald-300 flex items-center gap-2">
                  🌻 The Cozy Garden
                </h3>
                <p className="text-xs text-emerald-100/70">
                  Your personal virtual garden. Grow and sprout beautiful colorful cartoon flowers as you post positive daily updates or record heartwarming moments.
                </p>
              </div>

              {/* Garden Soil Plot Display */}
              <div className="bg-[#2d221c] border-4 border-[#3e2723] rounded-xl p-6 flex flex-col gap-6 shadow-inner relative">
                {/* Grass borders */}
                <div className="absolute inset-x-0 bottom-0 h-4 bg-emerald-950/60 pointer-events-none rounded-b-lg" />
                
                <span className="text-[10px] font-bold text-amber-200 uppercase tracking-widest font-mono">Your Garden Soil Plot:</span>
                
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 justify-center items-end min-h-[160px]">
                  {flowers.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-xs text-amber-100/50 italic">
                      Soil is fresh and ready. Sprout a new flower below by sharing a positive daily moment!
                    </div>
                  ) : (
                    flowers.map((flower) => {
                      // Map visual stage
                      const stageLabels = ['Seed 🌱', 'Sprout 🌿', 'Budding 🌸', 'Full Bloom 🌻'];
                      const typeEmojis: any = {
                        sunflower: '🌻',
                        tulip: '🌷',
                        lavender: '🪻',
                        rose: '🌹',
                        daisy: '🌼'
                      };
                      const emoji = typeEmojis[flower.flowerType] || '🌻';

                      return (
                        <div key={flower.id} className="flex flex-col items-center gap-2 bg-[#211713] p-3 border border-amber-950 rounded-lg shadow-md hover:scale-[1.03] transition-transform">
                          <div className="text-4xl animate-bounce" style={{ animationDuration: `${2 + Math.random()*2}s` }}>
                            {flower.growthStage === 0 && '🌱'}
                            {flower.growthStage === 1 && '🌿'}
                            {flower.growthStage === 2 && '🌸'}
                            {flower.growthStage === 3 && emoji}
                          </div>
                          <div className="text-center flex flex-col">
                            <span className="text-[10px] font-bold text-amber-300 font-serif leading-none truncate capitalize">{flower.flowerType}</span>
                            <span className="text-[8px] font-mono text-emerald-400 mt-1 uppercase font-bold leading-none bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-900/40">
                              {stageLabels[flower.growthStage]}
                            </span>
                          </div>
                          <div className="w-full border-t border-amber-900/40 mt-1 pt-1.5">
                            <p className="text-[8px] text-stone-300 leading-tight italic line-clamp-2" title={flower.positiveUpdate}>
                              &quot;{flower.positiveUpdate}&quot;
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Add garden update form if owner */}
              {isSelf && (
                <form onSubmit={handleAddGardenUpdateSubmit} className="bg-emerald-950/20 border border-emerald-900/50 rounded-lg p-4 flex flex-col gap-4">
                  <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" /> Share a positive update to grow your cozy garden
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-emerald-300/80 font-mono">What colorful flower type do you want to nurture?</label>
                      <select
                        value={newGardenFlowerType}
                        onChange={e => setNewGardenFlowerType(e.target.value as any)}
                        className="bg-slate-950 border border-emerald-900/60 text-emerald-100 rounded text-xs p-2.5 focus:border-emerald-500 outline-none"
                      >
                        <option value="sunflower">🌻 Radiant Sunflower</option>
                        <option value="tulip">🌷 Tender Tulip</option>
                        <option value="lavender">🪻 Calming Lavender</option>
                        <option value="rose">🌹 Romantic Rose</option>
                        <option value="daisy">🌼 Cheerful Daisy</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-emerald-300/80 font-mono">Your positive daily moment</label>
                      <input 
                        type="text"
                        required
                        value={newGardenUpdate}
                        onChange={e => setNewGardenUpdate(e.target.value)}
                        placeholder="e.g. Complimented a complete stranger on their lovely knitted scarf!"
                        className="bg-slate-950 border border-emerald-900/60 text-emerald-100 rounded text-xs p-2.5 focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                  <Button type="submit" size="sm" className="bg-emerald-700 border-emerald-600 hover:bg-emerald-600 text-stone-100 self-end px-5">
                    Sprout / Grow Flower
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* 5. PATCHWORK QUILT MOSAICS */}
          {activeSubTab === 'quilt' && (
            <div className="bg-[#1c1216] border border-[#3e1f2b] rounded-lg p-6 text-slate-100 flex flex-col gap-6 shadow-2xl">
              <div className="flex flex-col gap-1.5 border-b border-pink-900 pb-4">
                <h3 className="text-lg font-serif italic font-bold text-pink-300 flex items-center gap-2">
                  🧵 Patchwork Quilt Mosaics
                </h3>
                <p className="text-xs text-pink-100/70">
                  Stitch recent photos into beautiful quilted tapestry patterns. Generates cozy patchwork grids with textured borders.
                </p>
              </div>

              {/* Generate Mosaic option if owner */}
              {isSelf && (
                <form onSubmit={handleGenerateQuiltSubmit} className="bg-pink-950/10 border border-pink-900/40 rounded-lg p-4 flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-grow flex flex-col gap-1.5">
                    <label className="text-[10px] text-pink-300/80 font-mono">Tapestry Title</label>
                    <input 
                      type="text"
                      placeholder="e.g. Mid-Summer Quilt of Warm Memories"
                      value={newQuiltTitle}
                      onChange={e => setNewQuiltTitle(e.target.value)}
                      className="bg-slate-950 border border-pink-900/60 text-pink-100 rounded text-xs p-2.5 focus:border-pink-500 outline-none w-full"
                    />
                  </div>
                  <div className="w-full sm:w-48 flex flex-col gap-1.5">
                    <label className="text-[10px] text-pink-300/80 font-mono">Quilted Pattern Layout</label>
                    <select
                      value={newQuiltPattern}
                      onChange={e => setNewQuiltPattern(e.target.value as any)}
                      className="bg-slate-950 border border-pink-900/60 text-pink-100 rounded text-xs p-2.5 focus:border-pink-500 outline-none"
                    >
                      <option value="checkerboard">Checkerboard Patchwork</option>
                      <option value="starburst">Starburst Collage</option>
                      <option value="chevron">Chevron Stitches</option>
                      <option value="spiral">Spiral Tapestry</option>
                    </select>
                  </div>
                  <Button type="submit" size="sm" className="bg-pink-700 border-pink-600 hover:bg-pink-600 text-slate-100 h-10 px-5 w-full sm:w-auto">
                    Stitch Quilt Mosaic
                  </Button>
                </form>
              )}

              {/* Tapestries list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {quilts.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-xs text-pink-100/50 italic border border-dashed border-pink-900/40 rounded bg-pink-950/5">
                    No quilted tapestries stitched yet. Compile recent memories above!
                  </div>
                ) : (
                  quilts.map((q) => (
                    <div key={q.id} className="p-4 rounded-xl bg-slate-950/80 border-2 border-pink-950 flex flex-col gap-3 shadow-lg">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-pink-200 tracking-wide">{q.title}</h4>
                        <span className="text-[8px] font-mono bg-pink-950 text-pink-300 border border-pink-900 px-1.5 py-0.5 rounded">
                          {q.layoutPattern.toUpperCase()} PATTERN
                        </span>
                      </div>
                      
                      {/* Quilted Collage Box with dashed stitch lines */}
                      <div className="grid grid-cols-3 gap-1 p-2 bg-stone-900 border-2 border-dashed border-amber-800/60 rounded relative overflow-hidden">
                        {/* Stitched borders effect */}
                        <div className="absolute inset-0 border-4 border-dashed border-stone-800/80 pointer-events-none" />
                        
                        {q.photoUrls.slice(0, 9).map((photoUrl: string, idx: number) => {
                          let shapeClass = 'aspect-square';
                          if (q.layoutPattern === 'starburst' && idx === 4) {
                            shapeClass = 'aspect-square scale-110 border-2 border-dashed border-pink-500 z-10';
                          }
                          return (
                            <div key={idx} className={`relative overflow-hidden group ${shapeClass} border border-dashed border-stone-700/60`}>
                              <img 
                                src={photoUrl} 
                                alt="Quilt Patch" 
                                className="w-full h-full object-cover grayscale-[10%] sepia-[10%] brightness-95"
                              />
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
                        <span>Automatic End-Of-Month Tapestry</span>
                        <span>Stitched: {new Date(q.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 6. PAPER CHAIN COUNTDOWNS */}
          {activeSubTab === 'countdown' && (
            <div className="bg-[#14121a] border border-[#2d1b40] rounded-lg p-6 text-slate-100 flex flex-col gap-6 shadow-2xl">
              <div className="flex flex-col gap-1.5 border-b border-purple-900 pb-4">
                <h3 className="text-lg font-serif italic font-bold text-purple-300 flex items-center gap-2">
                  🎪 Paper Chain Countdowns
                </h3>
                <p className="text-xs text-purple-100/70">
                  Post a family photo framed by a beautiful, paper-ring countdown chain showing exactly how many days remain until a happy birthday, holiday or gathering.
                </p>
              </div>

              {/* Add Countdown form if owner */}
              {isSelf && (
                <form onSubmit={handleAddCountdownSubmit} className="bg-purple-950/10 border border-purple-900/40 rounded-lg p-4 flex flex-col gap-4">
                  <h4 className="text-xs font-bold text-purple-300 uppercase tracking-widest">Create New Countdown Chain</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-purple-300/80 font-mono">Celebration Title</label>
                      <input 
                        type="text" 
                        required
                        value={newCountdownForm.title}
                        onChange={e => setNewCountdownForm({...newCountdownForm, title: e.target.value})}
                        placeholder="e.g. Winter Cabin Gathering"
                        className="bg-slate-950 border border-purple-900/60 text-purple-100 rounded text-xs p-2 focus:border-purple-500 outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-purple-300/80 font-mono">Target Date</label>
                      <input 
                        type="date" 
                        required
                        value={newCountdownForm.targetDate}
                        onChange={e => setNewCountdownForm({...newCountdownForm, targetDate: e.target.value})}
                        className="bg-slate-950 border border-purple-900/60 text-purple-100 rounded text-xs p-2 focus:border-purple-500 outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-purple-300/80 font-mono">Ring Link Color</label>
                      <select
                        value={newCountdownForm.ringColor}
                        onChange={e => setNewCountdownForm({...newCountdownForm, ringColor: e.target.value})}
                        className="bg-slate-950 border border-purple-900/60 text-purple-100 rounded text-xs p-2 focus:border-purple-500 outline-none"
                      >
                        <option value="warm-amber">Warm Amber Loops</option>
                        <option value="pastel-pink">Pastel Pink Loops</option>
                        <option value="mint-green">Mint Green Loops</option>
                        <option value="cozy-violet">Cozy Violet Loops</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-purple-300/80 font-mono font-bold text-teal-400">Add custom photo URL</label>
                      <input 
                        type="text" 
                        value={newCountdownForm.image}
                        onChange={e => setNewCountdownForm({...newCountdownForm, image: e.target.value})}
                        className="bg-slate-950 border border-purple-900/60 text-purple-100 rounded text-xs p-2 focus:border-purple-500 outline-none"
                      />
                    </div>
                  </div>
                  <Button type="submit" size="sm" className="bg-purple-700 border-purple-600 hover:bg-purple-600 text-stone-100 self-end px-5">
                    Hang Countdown Chain
                  </Button>
                </form>
              )}

              {/* Active countdown paper chains list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                {countdowns.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-xs text-purple-100/50 italic border border-dashed border-purple-900/40 rounded bg-purple-950/5">
                    No active paper chains. Hang one above to start counting down!
                  </div>
                ) : (
                  countdowns.map((c) => {
                    const daysLeft = getDaysRemaining(c.targetDate);
                    // Determine Ring Styles
                    const colors: any = {
                      'warm-amber': 'bg-amber-600/30 border-amber-500 text-amber-300',
                      'pastel-pink': 'bg-pink-600/30 border-pink-500 text-pink-300',
                      'mint-green': 'bg-teal-600/30 border-teal-500 text-teal-300',
                      'cozy-violet': 'bg-purple-600/30 border-purple-500 text-purple-300'
                    };
                    const ringClass = colors[c.ringColor] || colors['warm-amber'];

                    return (
                      <div key={c.id} className="p-4 rounded-xl bg-slate-950 border border-purple-900/40 flex flex-col gap-4 shadow-lg overflow-hidden">
                        <div className="flex justify-between items-center border-b border-purple-950 pb-2">
                          <h4 className="text-xs font-bold text-purple-200 tracking-wide">{c.title}</h4>
                          <span className="text-[10px] font-mono text-purple-400 font-bold">{c.targetDate}</span>
                        </div>

                        <div className="relative h-44 rounded-lg overflow-hidden border border-purple-900">
                          <img 
                            src={c.imageUrl} 
                            alt={c.title} 
                            className="w-full h-full object-cover opacity-80"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent flex flex-col justify-end p-4">
                            <span className="text-lg font-serif italic text-white font-bold leading-none">{daysLeft} Days Remaining</span>
                            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider mt-1">hanging family chain</span>
                          </div>
                        </div>

                        {/* Physical Chain Rings Drawing */}
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] font-mono text-purple-400 font-bold tracking-wider uppercase">Your Paper-Ring Link Chain ({daysLeft} rings remaining):</span>
                          
                          <div className="flex items-center gap-1.5 overflow-x-auto py-3 bg-black/40 rounded px-3 border border-purple-950/30 min-h-[50px]">
                            {daysLeft === 0 ? (
                              <span className="text-[10px] italic text-emerald-400 font-bold">🎉 Celebration Day Has Arrived! All loops torn down.</span>
                            ) : (
                              Array.from({ length: Math.min(daysLeft, 15) }).map((_, i) => (
                                <div 
                                  key={i} 
                                  className={`w-8 h-8 rounded-full border-4 border-double flex items-center justify-center flex-shrink-0 relative shadow-md ${ringClass}`}
                                  style={{ transform: `rotate(${i % 2 === 0 ? '15deg' : '-15deg'})` }}
                                >
                                  {/* Interlinking loop line shadow */}
                                  <div className="absolute inset-0 border border-white/20 rounded-full" />
                                  <span className="text-[8px] font-mono font-bold leading-none">{daysLeft - i}</span>
                                </div>
                              ))
                            )}
                            {daysLeft > 15 && (
                              <span className="text-[9px] font-mono text-slate-500 font-bold flex-shrink-0">+{daysLeft - 15} more rings...</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* 7. SOUND ALBUM EXPORTERS */}
          {activeSubTab === 'sounds' && (
            <div className="bg-[#0b1b1a] border border-[#1b3d3b] rounded-lg p-6 text-slate-100 flex flex-col gap-6 shadow-2xl">
              <div className="flex flex-col gap-1.5 border-b border-teal-900 pb-4">
                <h3 className="text-lg font-serif italic font-bold text-teal-300 flex items-center gap-2">
                  🎙️ Sound Album Exporters
                </h3>
                <p className="text-xs text-teal-100/70">
                  Combine up to 5 recent photos with short vocal narrations or voice annotations to generate a beautiful family slideshow slide with custom transition playbacks.
                </p>
              </div>

              {/* Add Sound Album Form if owner */}
              {isSelf && (
                <form onSubmit={handleAddSoundAlbumSubmit} className="bg-teal-950/10 border border-teal-900/40 rounded-lg p-4 flex flex-col gap-4">
                  <h4 className="text-xs font-bold text-teal-300 uppercase tracking-widest">Create Cozy Slide Show</h4>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 flex flex-col gap-1">
                      <label className="text-[10px] text-teal-300/80 font-mono">Slideshow Title</label>
                      <input 
                        type="text" 
                        required
                        value={newSoundForm.title}
                        onChange={e => setNewSoundForm({...newSoundForm, title: e.target.value})}
                        placeholder="e.g. Grandma's Tea Ceremony Narratives"
                        className="bg-slate-950 border border-teal-900/60 text-teal-100 rounded text-xs p-2 focus:border-teal-500 outline-none w-full"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <span className="text-[9px] font-mono text-teal-300 uppercase tracking-wider font-bold">Slide Images & Short voice annotations:</span>
                    
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center border border-teal-950 bg-black/20 p-2 rounded">
                        <input 
                          type="text"
                          placeholder={`Slide ${i+1} Photo URL`}
                          defaultValue={`https://picsum.photos/seed/slide_${i+1}/500/350`}
                          className="bg-slate-950 border border-slate-900 text-slate-200 text-[11px] p-2 rounded outline-none"
                          onChange={e => {
                            const newSlides = [...newSoundForm.slides];
                            if (!newSlides[i]) newSlides[i] = { imageUrl: '', description: '', voiceLabel: '' };
                            newSlides[i].imageUrl = e.target.value;
                            setNewSoundForm({...newSoundForm, slides: newSlides});
                          }}
                        />
                        <input 
                          type="text"
                          placeholder="Short narrative text..."
                          className="bg-slate-950 border border-slate-900 text-slate-200 text-[11px] p-2 rounded outline-none"
                          onChange={e => {
                            const newSlides = [...newSoundForm.slides];
                            if (!newSlides[i]) newSlides[i] = { imageUrl: '', description: '', voiceLabel: '' };
                            newSlides[i].description = e.target.value;
                            setNewSoundForm({...newSoundForm, slides: newSlides});
                          }}
                        />
                        <input 
                          type="text"
                          placeholder="Voice caption (e.g. 'Listen to Grandma laughs...')"
                          className="bg-slate-950 border border-slate-900 text-slate-200 text-[11px] p-2 rounded outline-none"
                          onChange={e => {
                            const newSlides = [...newSoundForm.slides];
                            if (!newSlides[i]) newSlides[i] = { imageUrl: '', description: '', voiceLabel: '' };
                            newSlides[i].voiceLabel = e.target.value;
                            setNewSoundForm({...newSoundForm, slides: newSlides});
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <Button type="submit" size="sm" className="bg-teal-700 border-teal-600 hover:bg-teal-600 text-stone-100 self-end px-5">
                    Generate Slide Show
                  </Button>
                </form>
              )}

              {/* Sound slide shows playlist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                {soundAlbums.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-xs text-teal-100/50 italic border border-dashed border-teal-900/40 rounded bg-teal-950/5">
                    No active sound slide shows found. Create one to play memory reels!
                  </div>
                ) : (
                  soundAlbums.map((album) => (
                    <div key={album.id} className="p-4 rounded-xl bg-slate-950 border border-teal-900/40 flex flex-col gap-4 shadow-lg">
                      <div className="flex justify-between items-center border-b border-teal-950 pb-2">
                        <h4 className="text-xs font-bold text-teal-200 tracking-wide">{album.title}</h4>
                        <span className="text-[9px] font-mono text-teal-500">{album.slides.length} memory slides</span>
                      </div>

                      {/* Active Slideshow presentation console */}
                      {activeSlideshowAlbumId === album.id ? (
                        <div className="bg-black rounded-lg p-3 flex flex-col gap-3 border border-teal-900/50">
                          <div className="relative h-48 bg-stone-950 rounded overflow-hidden">
                            <img 
                              src={album.slides[currentSlideIndex]?.imageUrl} 
                              alt="Slide content" 
                              className="w-full h-full object-cover"
                            />
                            {/* Slides progress dots */}
                            <div className="absolute top-2 right-2 bg-black/60 px-2 py-0.5 rounded text-[9px] font-mono text-teal-400">
                              Slide {currentSlideIndex + 1} / {album.slides.length}
                            </div>
                            {/* Voice Annotation Overlay */}
                            {album.slides[currentSlideIndex]?.voiceLabel && (
                              <div className="absolute bottom-2 inset-x-2 bg-teal-950/90 border border-teal-800 rounded p-2 flex items-center gap-2 text-teal-200 text-[10px] font-serif shadow-md">
                                <Volume2 className="w-4 h-4 text-teal-400 animate-pulse flex-shrink-0" />
                                <span>Voice note: {album.slides[currentSlideIndex]?.voiceLabel}</span>
                              </div>
                            )}
                          </div>

                          <p className="text-xs font-serif text-slate-300 italic text-center px-4 leading-relaxed">
                            &quot;{album.slides[currentSlideIndex]?.description || 'No descriptive narration provided.'}&quot;
                          </p>

                          {/* Sound slide controls */}
                          <div className="flex items-center justify-between border-t border-teal-950 pt-2.5">
                            <button 
                              onClick={() => setIsPlayingLullaby(!isPlayingLullaby)}
                              className={`text-[9px] font-mono font-bold tracking-widest uppercase px-2 py-1 rounded flex items-center gap-1.5 border transition-all ${
                                isPlayingLullaby ? 'bg-teal-500/20 border-teal-500 text-teal-300' : 'bg-slate-900 border-slate-800 text-slate-500'
                              }`}
                            >
                              <Music className={`w-3 h-3 ${isPlayingLullaby ? 'animate-spin' : ''}`} />
                              {isPlayingLullaby ? 'Playing Serene Lullaby' : 'Ambient Lullaby'}
                            </button>

                            <div className="flex gap-2">
                              <Button 
                                size="sm"
                                variant="secondary"
                                onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                                disabled={currentSlideIndex === 0}
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </Button>
                              <Button 
                                size="sm"
                                variant="secondary"
                                onClick={() => setCurrentSlideIndex(prev => Math.min(album.slides.length - 1, prev + 1))}
                                disabled={currentSlideIndex === album.slides.length - 1}
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <div className="h-32 bg-stone-900 rounded-lg relative overflow-hidden">
                            <img 
                              src={album.slides[0]?.imageUrl} 
                              alt="slideshow first cover" 
                              className="w-full h-full object-cover brightness-75"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                              <Button 
                                size="sm"
                                className="bg-teal-700 border-teal-600 hover:bg-teal-600 text-stone-100 flex items-center gap-2"
                                onClick={() => {
                                  setActiveSlideshowAlbumId(album.id);
                                  setCurrentSlideIndex(0);
                                  setIsPlayingLullaby(true);
                                }}
                              >
                                Play slideshow presentation
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 8. LEATHER-BOUND DIARY MODE */}
          {activeSubTab === 'diary' && (
            <div className="bg-[#1a110e] border border-[#2b1712] rounded-lg p-6 text-stone-100 flex flex-col gap-6 shadow-2xl relative">
              {/* Gold leaf margin layout border */}
              <div className="absolute inset-3 border-2 border-dashed border-[#b8860b]/40 pointer-events-none rounded" />
              
              <div className="relative z-10 flex flex-col gap-6">
                <div className="flex flex-col gap-1.5 border-b border-amber-950 pb-4">
                  <h3 className="text-lg font-serif italic font-bold text-amber-200 flex items-center gap-2">
                    📓 Leather-Bound Diary Mode
                  </h3>
                  <p className="text-xs text-stone-400">
                    An offline-safe, highly private diary styled with luxurious leather bindings, gold-foil titles, and elegant gold-leaf pages.
                  </p>
                </div>

                {/* Diary composition form if owner */}
                {isSelf && (
                  <form onSubmit={handleAddDiarySubmit} className="bg-stone-950/70 border border-amber-950 p-5 rounded flex flex-col gap-4 relative">
                    <div className="absolute inset-2 border border-double border-[#b8860b]/30 pointer-events-none rounded" />
                    
                    <h4 className="text-xs font-bold text-amber-300 font-serif uppercase tracking-widest flex items-center gap-2">
                      ✍️ Compose a gold-leaf private entry
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-amber-200/80 font-serif">Entry Title</label>
                        <input 
                          type="text"
                          required
                          value={newDiaryForm.title}
                          onChange={e => setNewDiaryForm({...newDiaryForm, title: e.target.value})}
                          placeholder="A Solitary Rain in July..."
                          className="bg-black/80 border border-[#b8860b]/40 text-stone-100 rounded text-xs p-2.5 focus:border-amber-400 outline-none font-serif"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-amber-200/80 font-serif">Binding Color Theme</label>
                        <select
                          value={newDiaryForm.theme}
                          onChange={e => setNewDiaryForm({...newDiaryForm, theme: e.target.value})}
                          className="bg-black/80 border border-[#b8860b]/40 text-stone-100 rounded text-xs p-2.5 focus:border-amber-400 outline-none font-serif"
                        >
                          <option value="classic-burgundy">🍷 Classic Burgundy Leather</option>
                          <option value="emerald-gold">🌲 Emerald & Brass Leather</option>
                          <option value="midnight-brass">🌌 Midnight Charcoal Leather</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 relative z-10">
                      <label className="text-[10px] text-amber-200/80 font-serif">Journal Content</label>
                      <textarea
                        rows={4}
                        required
                        value={newDiaryForm.content}
                        onChange={e => setNewDiaryForm({...newDiaryForm, content: e.target.value})}
                        placeholder="Write down your quietest personal retrospections..."
                        className="bg-black/80 border border-[#b8860b]/40 text-stone-100 rounded text-xs p-3 focus:border-amber-400 outline-none font-serif resize-none leading-relaxed"
                      />
                    </div>

                    <div className="flex items-center justify-between relative z-10 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-400 font-serif select-none">
                        <input 
                          type="checkbox" 
                          checked={newDiaryForm.isPrivate}
                          onChange={e => setNewDiaryForm({...newDiaryForm, isPrivate: e.target.checked})}
                          className="rounded border-[#b8860b]/40 text-amber-600 bg-stone-900 focus:ring-0 cursor-pointer"
                        />
                        <span>Keep this entry completely private (Only you can read)</span>
                      </label>

                      <Button type="submit" size="sm" className="bg-amber-800 border-amber-600 hover:bg-amber-700 text-stone-100 px-6 font-serif tracking-wider shadow">
                        Record Gold-Leaf Entry
                      </Button>
                    </div>
                  </form>
                )}

                {/* Saved diary entries */}
                <div className="flex flex-col gap-4 mt-2">
                  <span className="text-xs font-serif text-amber-200 tracking-wider uppercase font-bold">Past Private Journal entries:</span>

                  {diaryEntries.length === 0 ? (
                    <div className="py-12 text-center text-xs text-stone-500 italic font-serif">
                      No diary entries written yet. Express your private thoughts in the leather journal above!
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {diaryEntries.map((entry) => {
                        // Binding visual theme
                        const themes: any = {
                          'classic-burgundy': 'bg-[#2b1712] border-[#b8860b]/50 border-l-[10px] border-l-[#5c1c0e]',
                          'emerald-gold': 'bg-[#0f1d13] border-[#b8860b]/50 border-l-[10px] border-l-[#094017]',
                          'midnight-brass': 'bg-[#151922] border-[#b8860b]/50 border-l-[10px] border-l-[#202738]'
                        };
                        const bindClass = themes[entry.goldLeafTheme] || themes['classic-burgundy'];

                        return (
                          <div key={entry.id} className={`p-5 rounded-lg border flex flex-col gap-3 shadow-md relative overflow-hidden ${bindClass}`}>
                            {/* Gold leaf inside corner accents */}
                            <div className="absolute top-1 right-1 text-amber-500/30 text-xs font-serif">⚜️</div>
                            
                            <div className="flex justify-between items-center relative z-10">
                              <h4 className="text-xs font-serif font-bold text-amber-200 flex items-center gap-1.5">
                                {entry.title}
                                {entry.isPrivate && <Lock className="w-3 h-3 text-amber-500/80" />}
                              </h4>
                              <span className="text-[9px] font-mono text-stone-500 uppercase font-bold">
                                {new Date(entry.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            <p className="text-xs text-stone-300 font-serif leading-relaxed italic relative z-10">
                              &quot;{entry.content}&quot;
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 9. THE TIME CAPSULE JAR (Locked bottle) */}
          {activeSubTab === 'capsule' && (
            <div className="bg-[#091522] border border-[#1b2b40] rounded-lg p-6 text-slate-100 flex flex-col gap-6 shadow-2xl">
              <div className="flex flex-col gap-1.5 border-b border-blue-900 pb-4">
                <h3 className="text-lg font-serif italic font-bold text-blue-300 flex items-center gap-2">
                  🫙 The Time Capsule Jar
                </h3>
                <p className="text-xs text-slate-400">
                  Seal a group of family photos and warm words in a digital capsule jar that remains locked and cannot be opened until a future calendar date.
                </p>
              </div>

              {/* Create Jar option if owner */}
              {isSelf && (
                <form onSubmit={handleAddJarSubmit} className="bg-blue-950/10 border border-blue-900/40 rounded-lg p-4 flex flex-col gap-4">
                  <h4 className="text-xs font-bold text-blue-300 uppercase tracking-widest">Seal a New Time Capsule Jar</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-blue-300/80 font-mono">Jar Title</label>
                      <input 
                        type="text" 
                        required
                        value={newJarForm.title}
                        onChange={e => setNewJarForm({...newJarForm, title: e.target.value})}
                        placeholder="e.g. Christmas 2026 Celebration Capsule"
                        className="bg-slate-950 border border-blue-900/60 text-blue-100 rounded text-xs p-2 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-blue-300/80 font-mono">Unlock Date</label>
                      <input 
                        type="date" 
                        required
                        value={newJarForm.unlockDate}
                        onChange={e => setNewJarForm({...newJarForm, unlockDate: e.target.value})}
                        className="bg-slate-950 border border-blue-900/60 text-blue-100 rounded text-xs p-2 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-blue-300/80 font-mono">Group of Photos (simulated link array)</label>
                      <input 
                        type="text" 
                        required
                        value={newJarForm.photoUrls.join(',')}
                        onChange={e => setNewJarForm({...newJarForm, photoUrls: e.target.value.split(',')})}
                        className="bg-slate-950 border border-blue-900/60 text-blue-100 rounded text-xs p-2 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-blue-300/80 font-mono">Heartwarming Message inside the Jar</label>
                    <textarea 
                      rows={2}
                      required
                      value={newJarForm.message}
                      onChange={e => setNewJarForm({...newJarForm, message: e.target.value})}
                      placeholder="Write your secret future blessings..."
                      className="bg-slate-950 border border-blue-900/60 text-blue-100 rounded text-xs p-2 focus:border-blue-500 outline-none resize-none"
                    />
                  </div>
                  <Button type="submit" size="sm" className="bg-blue-700 border-blue-600 hover:bg-blue-600 text-stone-100 self-end px-5">
                    Seal & Lock Jar
                  </Button>
                </form>
              )}

              {/* Saved capsule jars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                {jars.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-xs text-blue-100/50 italic border border-dashed border-blue-900/40 rounded bg-blue-950/5">
                    No time capsule jars sealed yet. Seal your memories above!
                  </div>
                ) : (
                  jars.map((j) => {
                    const daysLeft = getDaysRemaining(j.unlockDate);
                    const isLocked = daysLeft > 0;

                    return (
                      <div key={j.id} className="p-4 rounded-xl bg-slate-950 border border-blue-900/40 flex items-center gap-4 shadow-lg overflow-hidden relative">
                        {/* Glass Jar Drawing representation */}
                        <div className="w-20 h-28 rounded-b-2xl rounded-t-lg border-2 border-slate-400 bg-slate-800/20 relative flex flex-col items-center justify-center flex-shrink-0 shadow-inner">
                          {/* Cork Lid */}
                          <div className="absolute top-0 w-14 h-3 bg-amber-900 border border-amber-950 rounded-b" style={{ transform: 'translateY(-100%)' }} />
                          {isLocked ? (
                            <Lock className="w-6 h-6 text-amber-500 animate-pulse" />
                          ) : (
                            <Unlock className="w-6 h-6 text-emerald-400" />
                          )}
                        </div>

                        <div className="flex-1 flex flex-col gap-1 text-left min-w-0">
                          <h4 className="text-xs font-bold text-blue-200 truncate">{j.title}</h4>
                          <span className="text-[9px] font-mono text-slate-500">
                            Unlock Calendar Date: {j.unlockDate}
                          </span>
                          
                          {isLocked ? (
                            <div className="mt-1.5 p-2 rounded bg-amber-950/20 border border-amber-900/40 flex items-center gap-1.5 text-[9px] font-mono text-amber-300">
                              <span>Locked for:</span>
                              <span className="font-bold">{daysLeft} days remaining</span>
                            </div>
                          ) : (
                            <div className="mt-1.5 p-2.5 rounded bg-emerald-950/30 border border-emerald-900/40 flex flex-col gap-1">
                              <span className="text-[9px] font-bold text-emerald-400 uppercase font-mono tracking-widest">Jar Unlocked!</span>
                              <p className="text-[10px] text-slate-100 italic leading-relaxed">
                                &quot;{j.message}&quot;
                              </p>
                              <div className="flex gap-1.5 mt-1.5">
                                {j.photoUrls.map((pUrl: string, index: number) => (
                                  <img 
                                    key={index} 
                                    src={pUrl} 
                                    alt="Time Capsule content" 
                                    className="w-8 h-8 rounded object-cover border border-slate-700"
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ONE-TAP PRINTABLE ALBUM FULL VIEW WINDOW MODAL */}
      <AnimatePresence>
        {isPrintModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="p-1 sm:p-6 bg-slate-950 border border-slate-900 rounded-lg max-w-2xl w-full mx-auto text-slate-100 flex flex-col gap-6 relative shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-teal-400" />
                  <h3 className="text-base font-bold tracking-wider text-slate-100 uppercase">One-Tap Printable Memory Album</h3>
                </div>
                <button 
                  onClick={() => setIsPrintModalOpen(false)}
                  className="text-slate-500 hover:text-slate-300 cursor-pointer p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-4 text-center sm:text-left">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Hi Grandma! Choose a month, tap the button, and we will export a beautifully compiled high-contrast, double-spaced album that is ready to print at home!
                </p>

                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <span className="text-xs font-mono text-slate-400 flex-shrink-0">Select compilation month:</span>
                  <select 
                    value={selectedPrintMonth}
                    onChange={e => setSelectedPrintMonth(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-slate-200 text-xs p-2 rounded outline-none flex-1 w-full"
                  >
                    <option value="Current Month">July 2026 (Current Month)</option>
                    <option value="June 2026">June 2026</option>
                    <option value="May 2026">May 2026</option>
                    <option value="April 2026">April 2026</option>
                  </select>
                </div>
              </div>

              {/* Printable Compilation Preview (High Contrast, Large Typography) */}
              <div className="bg-white text-stone-900 p-8 rounded-lg border-2 border-stone-300 shadow-inner max-h-96 overflow-y-auto leading-relaxed text-left font-serif border-box print:bg-white print:text-black">
                
                {/* Print Title */}
                <div className="text-center border-b-2 border-stone-800 pb-4 mb-6">
                  <h1 className="text-xl font-bold tracking-tight uppercase">My Monthly Album Compilation</h1>
                  <p className="text-xs font-mono tracking-wider text-stone-500 mt-1">{selectedPrintMonth} - Compiled on VividPulse</p>
                </div>

                {/* Print Item 1 */}
                <div className="mb-6 break-inside-avoid">
                  <h2 className="text-sm font-bold border-b border-stone-300 pb-1 uppercase tracking-wide">Memory 1: Cottage Blueberry Lesson</h2>
                  <p className="text-xs text-stone-600 font-mono mt-1">July 7, 2026 - Memory Attic Box</p>
                  <p className="text-xs text-stone-800 leading-relaxed mt-2 italic font-serif">
                    &quot;Grandma spent three hours teaching me how to crimp the edges of a perfect pie crust. The kitchen smelled like butter and warm berries.&quot;
                  </p>
                  <div className="border border-stone-400 bg-stone-100 p-2 text-center text-[10px] font-mono uppercase text-stone-500 rounded mt-3">
                    [ Physical Photo Placeholder: July 7 Attic keepsake pie ]
                  </div>
                </div>

                {/* Print Item 2 */}
                <div className="mb-6 break-inside-avoid">
                  <h2 className="text-sm font-bold border-b border-stone-300 pb-1 uppercase tracking-wide">Accomplishment: Watering the Ferns</h2>
                  <p className="text-xs text-stone-600 font-mono mt-1">July 7, 2026 - Daily Wins Journal</p>
                  <p className="text-xs text-stone-800 leading-relaxed mt-2 font-serif">
                    &quot;Gave all five ferns a thorough deep watering and trimmed the dry leaves.&quot;
                  </p>
                </div>

                {/* Print Item 3 */}
                <div className="break-inside-avoid">
                  <h2 className="text-sm font-bold border-b border-stone-300 pb-1 uppercase tracking-wide">Family Gathering at the Cottage</h2>
                  <p className="text-xs text-stone-600 font-mono mt-1">July 7, 2026 - Paper Chain Countdown</p>
                  <p className="text-xs text-stone-800 leading-relaxed mt-2 font-serif">
                    We hung our colorful loop paper-chain to count down the 12 days remaining until our happy cottage gathering this mid-summer.
                  </p>
                </div>

                <div className="text-center border-t border-stone-300 pt-4 mt-8 text-[9px] font-mono text-stone-400">
                  VividPulse - Designed for Grandmothers to easily print home memories.
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button 
                  variant="outline"
                  onClick={() => setIsPrintModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handlePrintAlbum}
                  className="bg-teal-700 border-teal-600 hover:bg-teal-600 text-stone-100 flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Now
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
