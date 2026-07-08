import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'vividpulse-db.json');

export interface Keepsake {
  id: string;
  title: string;
  memory: string;
  chest: string; // e.g. childhood, wedding, travel
  imageUrl: string;
  createdAt: string;
}

export interface Win {
  id: string;
  content: string;
  category: string; // e.g. health, social, mind
  createdAt: string;
}

export interface FamilyPhoto {
  url: string;
  caption: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  photos: FamilyPhoto[];
  createdAt: string;
}

export interface Flower {
  id: string;
  name: string;
  type: string;
  plantedAt: string;
  note: string;
}

export interface QuiltSquare {
  id: string;
  pattern: string;
  color: string;
  fabricNote: string;
  stitchedBy: string;
  createdAt: string;
}

export interface Countdown {
  id: string;
  label: string;
  targetDate: string;
  createdAt: string;
}

export interface SoundAlbum {
  id: string;
  title: string;
  soundtrack: string;
  imageUrl: string;
  description: string;
  createdAt: string;
}

export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  theme: string; // e.g. vintage, sepia, forest
  createdAt: string;
}

export interface TimeCapsuleJar {
  id: string;
  title: string;
  message: string;
  unlockYear: number;
  createdAt: string;
}

export interface TrustedHelper {
  id: string;
  name: string;
  relationship: string;
  createdAt: string;
}

export interface VaultPhoto {
  id: string;
  imageUrl: string;
  caption: string;
  createdAt: string;
}

export interface PaperChain {
  id: string;
  message: string;
  author: string;
  createdAt: string;
}

export interface DatabaseState {
  keepsakes: Keepsake[];
  wins: Win[];
  family: FamilyMember[];
  flowers: Flower[];
  quilts: QuiltSquare[];
  countdowns: Countdown[];
  soundAlbums: SoundAlbum[];
  diaryEntries: DiaryEntry[];
  jars: TimeCapsuleJar[];
  trustedHelpers: TrustedHelper[];
  vaultPhotos: VaultPhoto[];
  paperChains: PaperChain[];
}

const INITIAL_STATE: DatabaseState = {
  keepsakes: [
    {
      id: 'k1',
      title: 'Wooden Toy Train',
      memory: 'Given to me by Grandpa at Christmas in 1952. Still has the original green paint.',
      chest: 'childhood',
      imageUrl: 'https://images.unsplash.com/photo-1515488042361-404e9250afef?w=400&q=80',
      createdAt: new Date().toISOString()
    },
    {
      id: 'k2',
      title: 'My Brass Compass',
      memory: 'Guided us through the misty trails of Oregon in the summer of 1974.',
      chest: 'travel',
      imageUrl: 'https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?w=400&q=80',
      createdAt: new Date().toISOString()
    }
  ],
  wins: [
    { id: 'w1', content: 'Walked to the corner mailbox and back.', category: 'health', createdAt: new Date().toISOString() },
    { id: 'w2', content: 'Read three chapters of the old leather Bible.', category: 'mind', createdAt: new Date().toISOString() },
    { id: 'w3', content: 'Had a warm tea chat with Lily Green.', category: 'social', createdAt: new Date().toISOString() }
  ],
  family: [
    {
      id: 'f1',
      name: 'Lily Green',
      relationship: 'Daughter',
      photos: [
        { url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&q=80', caption: 'Lily at her college graduation' },
        { url: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=300&q=80', caption: 'Working in her community garden' }
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: 'f2',
      name: 'Arthur Green',
      relationship: 'Grandson',
      photos: [
        { url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&q=80', caption: 'Learning to ride his blue bicycle' }
      ],
      createdAt: new Date().toISOString()
    }
  ],
  flowers: [
    { id: 'fl1', name: 'Grandma’s Lavender', type: 'Lavender', note: 'Blooms sweet, helps with deep sleep.', plantedAt: new Date().toISOString() },
    { id: 'fl2', name: 'Sunny Marigold', type: 'Marigold', note: 'Shines bright in the morning sun.', plantedAt: new Date().toISOString() }
  ],
  quilts: [
    { id: 'q1', pattern: 'Starry Sky', color: 'bg-indigo-900', fabricNote: 'Stitched with scraps from Arthur’s baby blanket.', stitchedBy: 'Grandma', createdAt: new Date().toISOString() },
    { id: 'q2', pattern: 'Cabin Log', color: 'bg-amber-800', fabricNote: 'Made from old flannel shirts worn in Wisconsin.', stitchedBy: 'Lily', createdAt: new Date().toISOString() }
  ],
  countdowns: [
    { id: 'c1', label: '80th Birthday Jubilee', targetDate: '2026-12-25', createdAt: new Date().toISOString() }
  ],
  soundAlbums: [
    {
      id: 'sa1',
      title: 'Forest Songbirds',
      soundtrack: 'Soft morning sparrows chirping in the garden',
      imageUrl: 'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=400&q=80',
      description: 'Brings calm and a peaceful outdoor atmosphere.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'sa2',
      title: 'Evening Accordion',
      soundtrack: 'Gentle nostalgic accordion chords from the harbor',
      imageUrl: 'https://images.unsplash.com/photo-1552422535-c45813c61732?w=400&q=80',
      description: 'Stirs cozy memories of summer boardwalk dances.',
      createdAt: new Date().toISOString()
    }
  ],
  diaryEntries: [
    {
      id: 'd1',
      title: 'Summer of 1968',
      content: 'We spent the whole July by the lakeside cottage. There was no telephone, just the sound of gentle water lapping and paper books. Arthur caught a tiny perch with a wooden stick.',
      theme: 'sepia',
      createdAt: new Date().toISOString()
    },
    {
      id: 'd2',
      title: 'Planted the Front Peach Tree',
      content: 'Today Lily helped me plant a fresh dwarf peach sapling in the front yard. We mixed the soil with coffee grounds. May it bloom sweet fruit for Arthur.',
      theme: 'vintage',
      createdAt: new Date().toISOString()
    }
  ],
  jars: [
    { id: 'j1', title: 'Letter for Arthur’s Graduation', message: 'Never forget your grandfather’s courage and always look at the brass compass when you lose your way.', unlockYear: 2028, createdAt: new Date().toISOString() }
  ],
  trustedHelpers: [
    { id: 'th1', name: 'Lily Green', relationship: 'Daughter', createdAt: new Date().toISOString() }
  ],
  vaultPhotos: [
    { id: 'v1', imageUrl: 'https://images.unsplash.com/photo-1473163928189-364b2c4e1135?w=400&q=80', caption: 'Grandma’s wedding day original portrait, 1965', createdAt: new Date().toISOString() }
  ],
  paperChains: [
    { id: 'pc1', message: 'We are all stitched together in love.', author: 'Grandma', createdAt: new Date().toISOString() },
    { id: 'pc2', message: 'Keep shining your gentle light.', author: 'Lily', createdAt: new Date().toISOString() }
  ]
};

export function readDB(): DatabaseState {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_STATE, null, 2));
      return INITIAL_STATE;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error reading DB:', error);
    return INITIAL_STATE;
  }
}

export function writeDB(state: DatabaseState): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('Error writing DB:', error);
  }
}
