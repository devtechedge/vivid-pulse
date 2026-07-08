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
  PaperChain
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
