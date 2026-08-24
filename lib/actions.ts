"use server";

import {
  readDB,
  writeDB,
  Keepsake,
  Win,
  FamilyMember,
  Flower,
  QuiltSquare,
  Countdown,
  SoundAlbum,
  DiaryEntry,
  TimeCapsuleJar,
  TrustedHelper,
  VaultPhoto,
  PaperChain,
  ScrapbookCollab,
  ScrapbookSticker,
  PenPalChain,
  PenPalLetter,
  CameraPhoto,
  CookbookProject,
  CookbookStep,
  WeavingPhoto,
  ChallengeBadge,
  SingalongVoiceClip,
  CollabFrameProject,
  PicnicTableState,
  FrameStroke
} from './db';

// Keepsakes
export async function getKeepsakes(): Promise<Keepsake[]> {
  const db = readDB();
  return db.keepsakes || [];
}

export async function addKeepsake(title: string, memory: string, chest: string, imageUrl: string) {
  const db = readDB();
  const newItem: Keepsake = {
    id: 'k_' + Date.now(),
    title,
    memory,
    chest,
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1515488042361-404e9250afef?w=400&q=80',
    createdAt: new Date().toISOString()
  };
  db.keepsakes = [newItem, ...(db.keepsakes || [])];
  writeDB(db);
  return { success: true, item: newItem };
}

// Daily Wins
export async function getWins(): Promise<Win[]> {
  const db = readDB();
  return db.wins || [];
}

export async function addWin(content: string, category: string) {
  const db = readDB();
  const newItem: Win = {
    id: 'w_' + Date.now(),
    content,
    category,
    createdAt: new Date().toISOString()
  };
  db.wins = [newItem, ...(db.wins || [])];
  writeDB(db);
  return { success: true, item: newItem };
}

// Family Members
export async function getFamily(): Promise<FamilyMember[]> {
  const db = readDB();
  return db.family || [];
}

export async function addFamilyMember(name: string, relationship: string, initialPhotoUrl?: string, initialCaption?: string) {
  const db = readDB();
  const photos = initialPhotoUrl ? [{ url: initialPhotoUrl, caption: initialCaption || 'Family photo' }] : [];
  const newItem: FamilyMember = {
    id: 'f_' + Date.now(),
    name,
    relationship,
    photos,
    createdAt: new Date().toISOString()
  };
  db.family = [...(db.family || []), newItem];
  writeDB(db);
  return { success: true, item: newItem };
}

export async function addFamilyPhoto(memberId: string, url: string, caption: string) {
  const db = readDB();
  db.family = (db.family || []).map(m => {
    if (m.id === memberId) {
      return {
        ...m,
        photos: [...m.photos, { url, caption }]
      };
    }
    return m;
  });
  writeDB(db);
  return { success: true };
}

// Flowers
export async function getFlowers(): Promise<Flower[]> {
  const db = readDB();
  return db.flowers || [];
}

export async function plantFlower(name: string, type: string, note: string) {
  const db = readDB();
  const newItem: Flower = {
    id: 'fl_' + Date.now(),
    name,
    type,
    note,
    plantedAt: new Date().toISOString()
  };
  db.flowers = [newItem, ...(db.flowers || [])];
  writeDB(db);
  return { success: true, item: newItem };
}

// Quilts
export async function getQuilts(): Promise<QuiltSquare[]> {
  const db = readDB();
  return db.quilts || [];
}

export async function addQuiltSquare(pattern: string, color: string, fabricNote: string, stitchedBy: string) {
  const db = readDB();
  const newItem: QuiltSquare = {
    id: 'q_' + Date.now(),
    pattern,
    color,
    fabricNote,
    stitchedBy,
    createdAt: new Date().toISOString()
  };
  db.quilts = [...(db.quilts || []), newItem];
  writeDB(db);
  return { success: true, item: newItem };
}

// Countdowns
export async function getCountdowns(): Promise<Countdown[]> {
  const db = readDB();
  return db.countdowns || [];
}

export async function addCountdown(label: string, targetDate: string) {
  const db = readDB();
  const newItem: Countdown = {
    id: 'c_' + Date.now(),
    label,
    targetDate,
    createdAt: new Date().toISOString()
  };
  db.countdowns = [...(db.countdowns || []), newItem];
  writeDB(db);
  return { success: true, item: newItem };
}

// Sound Albums
export async function getSoundAlbums(): Promise<SoundAlbum[]> {
  const db = readDB();
  return db.soundAlbums || [];
}

export async function createSoundAlbum(title: string, soundtrack: string, imageUrl: string, description: string) {
  const db = readDB();
  const newItem: SoundAlbum = {
    id: 'sa_' + Date.now(),
    title,
    soundtrack,
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=400&q=80',
    description,
    createdAt: new Date().toISOString()
  };
  db.soundAlbums = [...(db.soundAlbums || []), newItem];
  writeDB(db);
  return { success: true, item: newItem };
}

// Leather Diary Entries
export async function getLeatherDiaryEntries(): Promise<DiaryEntry[]> {
  const db = readDB();
  return db.diaryEntries || [];
}

export async function createLeatherDiaryEntry(title: string, content: string, theme: string) {
  const db = readDB();
  const newItem: DiaryEntry = {
    id: 'd_' + Date.now(),
    title,
    content,
    theme,
    createdAt: new Date().toISOString()
  };
  db.diaryEntries = [newItem, ...(db.diaryEntries || [])];
  writeDB(db);
  return { success: true, item: newItem };
}

// Time Capsule Jars
export async function getTimeCapsuleJars(): Promise<TimeCapsuleJar[]> {
  const db = readDB();
  return db.jars || [];
}

export async function createTimeCapsuleJar(title: string, message: string, unlockYear: number) {
  const db = readDB();
  const newItem: TimeCapsuleJar = {
    id: 'tc_' + Date.now(),
    title,
    message,
    unlockYear,
    createdAt: new Date().toISOString()
  };
  db.jars = [...(db.jars || []), newItem];
  writeDB(db);
  return { success: true, item: newItem };
}

// Trusted Helpers
export async function getTrustedHelpers(): Promise<TrustedHelper[]> {
  const db = readDB();
  return db.trustedHelpers || [];
}

export async function addTrustedHelper(name: string, relationship: string) {
  const db = readDB();
  const newItem: TrustedHelper = {
    id: 'th_' + Date.now(),
    name,
    relationship,
    createdAt: new Date().toISOString()
  };
  db.trustedHelpers = [...(db.trustedHelpers || []), newItem];
  writeDB(db);
  return { success: true, item: newItem };
}

// Vault Photos
export async function getVaultPhotos(): Promise<VaultPhoto[]> {
  const db = readDB();
  return db.vaultPhotos || [];
}

export async function addVaultPhoto(imageUrl: string, caption: string) {
  const db = readDB();
  const newItem: VaultPhoto = {
    id: 'vp_' + Date.now(),
    imageUrl,
    caption,
    createdAt: new Date().toISOString()
  };
  db.vaultPhotos = [newItem, ...(db.vaultPhotos || [])];
  writeDB(db);
  return { success: true, item: newItem };
}

// Paper Chains
export async function getPaperChains(): Promise<PaperChain[]> {
  const db = readDB();
  return db.paperChains || [];
}

export async function createPaperChain(message: string, author: string) {
  const db = readDB();
  const newItem: PaperChain = {
    id: 'pc_' + Date.now(),
    message,
    author,
    createdAt: new Date().toISOString()
  };
  db.paperChains = [...(db.paperChains || []), newItem];
  writeDB(db);
  return { success: true, item: newItem };
}

// BATCH 10 Server Actions

// 1. Scrapbook Collabs
export async function getScrapbooks(): Promise<ScrapbookCollab[]> {
  const db = readDB();
  return db.scrapbooks || [];
}

export async function createScrapbook(title: string, photoUrl: string) {
  const db = readDB();
  const newItem: ScrapbookCollab = {
    id: 'sb_' + Date.now(),
    title,
    photoUrl,
    stickers: [],
    createdAt: new Date().toISOString()
  };
  db.scrapbooks = [newItem, ...(db.scrapbooks || [])];
  writeDB(db);
  return { success: true, item: newItem };
}

export async function addScrapbookSticker(scrapbookId: string, sticker: Omit<ScrapbookSticker, 'id'>) {
  const db = readDB();
  db.scrapbooks = (db.scrapbooks || []).map(sb => {
    if (sb.id === scrapbookId) {
      const newSticker: ScrapbookSticker = {
        ...sticker,
        id: 's_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
      };
      return {
        ...sb,
        stickers: [...sb.stickers, newSticker]
      };
    }
    return sb;
  });
  writeDB(db);
  return { success: true };
}

// 2. Nostalgic Pen Pal Chains
export async function getPenPals(): Promise<PenPalChain[]> {
  const db = readDB();
  return db.penPals || [];
}

export async function createPenPalChain(question: string) {
  const db = readDB();
  const newItem: PenPalChain = {
    id: 'pp_' + Date.now(),
    question,
    letters: [],
    activeAuthor: 'Grandma Green',
    createdAt: new Date().toISOString()
  };
  db.penPals = [newItem, ...(db.penPals || [])];
  writeDB(db);
  return { success: true, item: newItem };
}

export async function addPenPalLetter(chainId: string, text: string, author: string) {
  const db = readDB();
  db.penPals = (db.penPals || []).map(pp => {
    if (pp.id === chainId) {
      const newLetter: PenPalLetter = {
        id: 'l_' + Date.now(),
        author,
        text,
        createdAt: new Date().toISOString()
      };
      // Toggle active author based on who just wrote
      const nextAuthor = author === 'Grandma Green' ? 'Arthur Green' : 'Grandma Green';
      return {
        ...pp,
        activeAuthor: nextAuthor,
        letters: [...pp.letters, newLetter]
      };
    }
    return pp;
  });
  writeDB(db);
  return { success: true };
}

// 3. Pass-the-Camera Game
export async function getCameraPhotos(): Promise<CameraPhoto[]> {
  const db = readDB();
  return db.cameraPhotos || [];
}

export async function addCameraPhoto(url: string, caption: string, color: string, submittedBy: string) {
  const db = readDB();
  const newItem: CameraPhoto = {
    id: 'cp_' + Date.now(),
    url,
    caption,
    color,
    submittedBy,
    createdAt: new Date().toISOString()
  };
  db.cameraPhotos = [newItem, ...(db.cameraPhotos || [])];
  writeDB(db);
  return { success: true, item: newItem };
}

// 4. Community Cookbook Patchwork
export async function getCookbook(): Promise<CookbookProject> {
  const db = readDB();
  return db.cookbook;
}

export async function addCookbookStep(photoUrl: string, instruction: string, contributedBy: string) {
  const db = readDB();
  if (!db.cookbook) {
    db.cookbook = {
      id: 'cb1',
      title: 'Blueberry Pie Collective Stitch',
      description: 'A baking masterclass compiled step-by-step by the family.',
      steps: []
    };
  }
  const nextStepNum = (db.cookbook.steps || []).length + 1;
  const newStep: CookbookStep = {
    id: 'cbs_' + Date.now(),
    stepNumber: nextStepNum,
    photoUrl,
    instruction,
    contributedBy,
    createdAt: new Date().toISOString()
  };
  db.cookbook.steps = [...(db.cookbook.steps || []), newStep];
  writeDB(db);
  return { success: true, item: newStep };
}

// 5. Scenic Color Weaving
export async function getWeavingPhotos(): Promise<WeavingPhoto[]> {
  const db = readDB();
  return db.weavingPhotos || [];
}

export async function addWeavingPhoto(url: string, colorTheme: 'green' | 'amber' | 'blue' | 'rose' | 'slate', scenery: string, uploadedBy: string) {
  const db = readDB();
  const newItem: WeavingPhoto = {
    id: 'wp_' + Date.now(),
    url,
    colorTheme,
    scenery,
    uploadedBy,
    createdAt: new Date().toISOString()
  };
  db.weavingPhotos = [newItem, ...(db.weavingPhotos || [])];
  writeDB(db);
  return { success: true, item: newItem };
}

// 6. Family Challenge Badges
export async function getChallengeBadges(): Promise<ChallengeBadge[]> {
  const db = readDB();
  return db.badges || [];
}

export async function unlockBadge(badgeId: string, unlockedBy: string, proofText: string, proofPhoto?: string) {
  const db = readDB();
  db.badges = (db.badges || []).map(b => {
    if (b.id === badgeId) {
      return {
        ...b,
        isUnlocked: true,
        unlockedBy,
        proofText,
        proofPhoto,
        unlockedAt: new Date().toISOString()
      };
    }
    return b;
  });
  writeDB(db);
  return { success: true };
}

// 7. Nostalgic Singalong Choir
export async function getVoiceClips(): Promise<SingalongVoiceClip[]> {
  const db = readDB();
  return db.voiceClips || [];
}

export async function addVoiceClip(member: string, synthNotes: number[]) {
  const db = readDB();
  const newItem: SingalongVoiceClip = {
    id: 'vc_' + Date.now(),
    member,
    synthNotes,
    duration: 4,
    createdAt: new Date().toISOString()
  };
  db.voiceClips = [...(db.voiceClips || []), newItem];
  writeDB(db);
  return { success: true, item: newItem };
}

// 8. Collaborative Hand-Painted Frames
export async function getFrameProjects(): Promise<CollabFrameProject[]> {
  const db = readDB();
  return db.frameProjects || [];
}

export async function addFrameStroke(projectId: string, stroke: FrameStroke) {
  const db = readDB();
  db.frameProjects = (db.frameProjects || []).map(fp => {
    if (fp.id === projectId) {
      return {
        ...fp,
        strokes: [...(fp.strokes || []), stroke]
      };
    }
    return fp;
  });
  writeDB(db);
  return { success: true };
}

export async function createFrameProject(photoUrl: string) {
  const db = readDB();
  const newItem: CollabFrameProject = {
    id: 'fp_' + Date.now(),
    photoUrl,
    strokes: []
  };
  db.frameProjects = [newItem, ...(db.frameProjects || [])];
  writeDB(db);
  return { success: true, item: newItem };
}

// 9. Picnic Table Room State
export async function getPicnicTable(): Promise<PicnicTableState> {
  const db = readDB();
  return db.picnicTable;
}

export async function updatePicnicTable(photoUrl: string, activeSeats: Record<string, string>, backgroundSound: string) {
  const db = readDB();
  db.picnicTable = {
    currentPhotoUrl: photoUrl,
    activeSeats,
    backgroundSound
  };
  writeDB(db);
  return { success: true, table: db.picnicTable };
}
