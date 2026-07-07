import { sql } from '@vercel/postgres';

// --- DATABASE TYPES ---

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  website: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  userId: string;
  caption: string | null;
  location: string | null;
  createdAt: string;
  updatedAt: string;
  audioUrl?: string | null; // Identifier for ambient audio loop or voice description
  audioTitle?: string | null; // Friendly name of the loop
  focalAnchors?: string | null; // JSON stringified list of tagged focal points
  colorPalette?: string | null; // JSON stringified list of extracted colors
  layoutMatrix?: string | null; // layout type like 'normal', 'asymmetric-split', 'triptych'
  coAuthors?: string | null; // JSON stringified list of co-author usernames
  vectorTextPanel?: string | null; // Markdown blogging text
}

export interface PostMedia {
  id: string;
  postId: string;
  url: string;
  type: 'IMAGE' | 'VIDEO';
  orderIndex: number;
}

export interface Story {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO_WAVEFORM' | 'TEXT';
  expiresAt: string;
  createdAt: string;
  // Feature 11: Time-Decay Interactive Q&As
  qaQuestion?: string;
  qaAnswers?: { id: string; username: string; text: string; createdAt: string }[];
  // Feature 12: Pulse Chains
  chainedStoryId?: string;
  chainName?: string;
  // Feature 13: Audio Waveform Pulses
  audioDataUrl?: string;
  waveformPoints?: number[];
  // Feature 14: Coordinate Node Rings
  latitude?: number;
  longitude?: number;
  // Feature 15: Engagement Gated Visibility
  isGated?: boolean;
  // Feature 16: Ambient Micro-Poll Sliders
  pollQuestion?: string;
  pollMinLabel?: string;
  pollMaxLabel?: string;
  pollVotes?: { username: string; score: number }[];
  // Feature 17: Syntax Code Pulses
  codeSnippet?: string;
  codeLanguage?: string;
  // Feature 18: Anonymous Query Terminals
  hasAnonymousTerminal?: boolean;
  anonymousAnswers?: { id: string; text: string; createdAt: string }[];
  // Feature 19: Narrative Vault Hashtag Routing
  hashtags?: string[];
}

export interface PostLike {
  userId: string;
  postId: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  parentId: string | null; // For 2-level threaded replies
  createdAt: string;
}

export interface Bookmark {
  userId: string;
  postId: string;
}

export interface Follow {
  followerId: string;
  followingId: string;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  mediaUrl: string | null;
  isRead: boolean;
  createdAt: string;
  // Advanced Messaging Fields
  isVolatile?: boolean;
  expiresAt?: string;
  destructionDelay?: number; // duration in seconds
  parentId?: string; // for thread branching
  isPinned?: boolean; // resource pinboard
  hasAudio?: boolean; // voice memo logs
  audioDuration?: number; // voice memo length
  audioDataUrl?: string; // audio source base64/url
  codeSnippet?: string; // executable sandbox code
  codeLanguage?: string; // e.g. javascript, typescript, css, html
}

// Global state interface for server-side fallback storage
export interface SafeRoom {
  id: string;
  name: string;
  creatorId: string;
  creatorUsername: string;
  theme: 'slate' | 'violet' | 'amber' | 'emerald' | 'rose';
  soundscape: 'none' | 'rain' | 'crackle' | 'swallows' | 'lofi';
  passcode?: string;
  createdAt: string;
}

export interface SafeRoomMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderUsername: string;
  senderDisplayName: string;
  senderAvatarUrl: string | null;
  content: string;
  createdAt: string;
  isVolatile?: boolean;
  expiresAt?: string;
  destructionDelay?: number;
  codeSnippet?: string;
  codeLanguage?: string;
}

export interface DatabaseState {
  users: User[];
  posts: Post[];
  postMedia: PostMedia[];
  stories: Story[];
  postLikes: PostLike[];
  comments: Comment[];
  bookmarks: Bookmark[];
  follows: Follow[];
  directMessages: DirectMessage[];
  neighborWaves?: { id: string; senderId: string; receiverId: string; type: string; createdAt: string }[];
  neighborMoods?: { userId: string; vibeEmoji: string; vibeLabel: string; updatedAt: string }[];
  neighborBulletins?: { id: string; userId: string; content: string; color: string; createdAt: string }[];
  cozyStrolls?: { id: string; userId: string; title: string; time: string; location: string; attendees: string[]; createdAt: string }[];
  skySnapshots?: { id: string; userId: string; imageUrl: string; description: string; createdAt: string }[];
  cookieJarTreats?: { id: string; userId: string; title: string; description: string; totalPortions: number; claimedByUsernames: string[]; createdAt: string }[];
  wisdomReflections?: { id: string; userId: string; prompt: string; text: string; createdAt: string }[];
  helpingHandPosts?: { id: string; userId: string; title: string; description: string; type: 'need' | 'offer'; createdAt: string }[];
  neighborhoodSounds?: { id: string; userId: string; title: string; audioDataUrl?: string; createdAt: string }[];
  safeRooms?: SafeRoom[];
  safeRoomMessages?: SafeRoomMessage[];
  receivedExpressions?: { id: string; senderId: string; senderUsername: string; receiverId: string; receiverUsername: string; type: string; createdAt: string }[];
  gratitudeNotes?: { id: string; senderId: string; senderUsername: string; receiverId: string; receiverUsername: string; text: string; createdAt: string }[];
  userRoles?: { userId: string; role: string }[];
  interactionStreaks?: { userId1: string; userId2: string; count: number; lastInteractedAt: string }[];
  atticKeepsakes?: AtticKeepsake[];
  dailyWins?: DailyWin[];
  familyMembers?: FamilyMember[];
  gardenFlowers?: CozyGardenFlower[];
  patchworkQuiltMosaics?: PatchworkQuilt[];
  paperChainCountdowns?: PaperChainCountdown[];
  soundAlbums?: SoundAlbum[];
  leatherDiaryEntries?: LeatherDiaryEntry[];
  timeCapsuleJars?: TimeCapsuleJar[];
  nostalgicStories?: NostalgicStory[];
  neighborhoodBenches?: NeighborhoodBench[];
  furryFriendPets?: FurryFriendPet[];
  communityKitchenRecipes?: CommunityKitchenRecipe[];
  craftingGuildProjects?: CraftingGuildProject[];
}

export interface NostalgicStory {
  id: string;
  userId: string;
  title: string;
  category: 'restoration' | 'gardening' | 'history' | 'crafts';
  imageUrl: string;
  storyText: string;
  createdAt: string;
}

export interface NeighborhoodBench {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: 'park' | 'bird' | 'bench';
  latitude: number; // For SVG map coordinates (percentage 0-100)
  longitude: number; // For SVG map coordinates (percentage 0-100)
  img50YearsAgo?: string;
  imgToday?: string;
  createdAt: string;
}

export interface FurryFriendPet {
  id: string;
  userId: string;
  name: string;
  type: 'dog' | 'cat' | 'rabbit' | 'bird';
  imageUrl: string;
  favoriteNapSpot: string;
  pettedCount: number;
  treatsCount: number;
  createdAt: string;
}

export interface CommunityKitchenRecipe {
  id: string;
  userId: string;
  title: string;
  description: string;
  coverImage: string;
  ingredients: string[];
  steps: { order: number; text: string; imageUrl: string }[];
  createdAt: string;
}

export interface CraftingGuildProject {
  id: string;
  userId: string;
  title: string;
  category: 'knitting' | 'carpentry' | 'pottery' | 'painting';
  creatorName: string;
  creatorAge: number;
  imageUrl: string;
  patternOrTips: string;
  progressText: string;
  cheers: number;
  encouragements: { id: string; authorName: string; text: string; createdAt: string }[];
  createdAt: string;
}

export interface AtticKeepsake {
  id: string;
  userId: string;
  title: string;
  imageUrl: string;
  yearOffset: number;
  dateString: string;
  memoryText: string;
  chestId: string;
  createdAt: string;
}

export interface DailyWin {
  id: string;
  userId: string;
  category: 'ferns' | 'reading' | 'stretching' | 'baking' | 'brewing' | 'resting';
  victoryText: string;
  createdAt: string;
}

export interface FamilyMember {
  id: string;
  userId: string;
  name: string;
  relationship: string;
  avatarUrl: string;
  photos: { id: string; url: string; caption: string; createdAt: string }[];
}

export interface CozyGardenFlower {
  id: string;
  userId: string;
  flowerType: 'sunflower' | 'tulip' | 'lavender' | 'rose' | 'daisy';
  growthStage: number; // 0: seed, 1: sprout, 2: budding, 3: full-bloom
  positiveUpdate: string;
  createdAt: string;
}

export interface PatchworkQuilt {
  id: string;
  userId: string;
  title: string;
  layoutPattern: 'starburst' | 'checkerboard' | 'chevron' | 'spiral';
  photoUrls: string[];
  createdAt: string;
}

export interface PaperChainCountdown {
  id: string;
  userId: string;
  title: string;
  targetDate: string;
  imageUrl: string;
  ringColor: 'pastel-pink' | 'warm-amber' | 'mint-green' | 'cozy-violet';
  createdAt: string;
}

export interface SoundAlbum {
  id: string;
  userId: string;
  title: string;
  slides: { imageUrl: string; description: string; voiceLabel?: string }[];
  createdAt: string;
}

export interface LeatherDiaryEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  isPrivate: boolean;
  goldLeafTheme: 'classic-burgundy' | 'emerald-gold' | 'midnight-brass';
  createdAt: string;
}

export interface TimeCapsuleJar {
  id: string;
  userId: string;
  title: string;
  unlockDate: string;
  photoUrls: string[];
  message: string;
  createdAt: string;
}


// --- SECURE CRYPTOGRAPHY UTILITY (WEB CRYPTO) ---
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'vividpulse_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate standard uuid
export function generateUUID(): string {
  return crypto.randomUUID();
}

// --- INITIAL SEED DATA FOR VIVIDPULSE ---
const getInitialSeedData = async (): Promise<DatabaseState> => {
  const pHash = await hashPassword('password123');

  const users: User[] = [
    {
      id: 'user-1',
      username: 'alex_vivid',
      email: 'alex@vividpulse.com',
      passwordHash: pHash,
      displayName: 'Alex Rivers',
      bio: 'Visual designer exploring high-contrast digital worlds. ✨ Tokyo-bound.',
      avatarUrl: 'https://picsum.photos/seed/alex_avatar/300/300',
      website: 'alexrivers.design',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'user-2',
      username: 'elena_pixels',
      email: 'elena@vividpulse.com',
      passwordHash: pHash,
      displayName: 'Elena Rostova',
      bio: 'Neo-noir photographer. Chasing neon lights & rainy alleyways.',
      avatarUrl: 'https://picsum.photos/seed/elena_avatar/300/300',
      website: 'elenapixels.net',
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'user-3',
      username: 'cyber_pulse',
      email: 'cyber@vividpulse.com',
      passwordHash: pHash,
      displayName: 'Marcus Chen',
      bio: 'Generative artist. Transforming signal noise into beautiful digital motion.',
      avatarUrl: 'https://picsum.photos/seed/marcus_avatar/300/300',
      website: 'cyberpulse.io',
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'user-4',
      username: 'neon_lens',
      email: 'sarah@vividpulse.com',
      passwordHash: pHash,
      displayName: 'Sarah Jenkins',
      bio: 'Cinematographer and colorist. Lucid violet and kinetic teal obsessed.',
      avatarUrl: 'https://picsum.photos/seed/sarah_avatar/300/300',
      website: 'neonlens.co',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'user-5',
      username: 'kinetic_art',
      email: 'lucas@vividpulse.com',
      passwordHash: pHash,
      displayName: 'Lucas Vance',
      bio: 'Geometric abstract painter. Simplicity is the ultimate sophistication.',
      avatarUrl: 'https://picsum.photos/seed/lucas_avatar/300/300',
      website: 'kineticart.com',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  const posts: Post[] = [
    {
      id: 'post-1',
      userId: 'user-1',
      caption: 'Chasing neon reflections in Shinjuku tonight. The violet hues are absolutely mesmerizing. #shinjuku #neonoir #tokyo',
      location: 'Shinjuku, Tokyo',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'post-2',
      userId: 'user-2',
      caption: 'Rainy nights make the city shine twice as bright. Captured this on a crisp cinematic setup. 🌧️⚡ #cyberpunk #lensculture',
      location: 'Metropolis Core',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'post-3',
      userId: 'user-3',
      caption: 'Generative algorithm 042. Mapping digital frequencies into kinetic curves. Turn up the volume! #creativecoding #generative',
      location: 'Synthesis Lab',
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'post-4',
      userId: 'user-4',
      caption: 'Obsessed with this color correction flow. Combining lucid violet shadows with kinetic teal highlights. What do you think? 🎨',
      location: 'Studio Neon',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'post-5',
      userId: 'user-5',
      caption: 'Minimalist geometric constructs. Playing with deep slate contrasts and razor-sharp angles. Less is always more.',
      location: 'Vance Gallery',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'post-6',
      userId: 'user-1',
      caption: 'A double-carousel highlight of Tokyo streetscapes. Sweep right to see the dark narrow alleys. #tokyostreets #explore',
      location: 'Akihabara',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      updatedAt: new Date().toISOString(),
    }
  ];

  // Post media (carousels)
  const postMedia: PostMedia[] = [
    { id: 'media-1', postId: 'post-1', url: 'https://picsum.photos/seed/shinjuku_neon/800/800', type: 'IMAGE', orderIndex: 0 },
    { id: 'media-2', postId: 'post-2', url: 'https://picsum.photos/seed/rainy_city/800/1000', type: 'IMAGE', orderIndex: 0 },
    { id: 'media-3', postId: 'post-3', url: 'https://picsum.photos/seed/generative_art/800/800', type: 'IMAGE', orderIndex: 0 },
    { id: 'media-4', postId: 'post-4', url: 'https://picsum.photos/seed/color_grade/800/800', type: 'IMAGE', orderIndex: 0 },
    { id: 'media-5', postId: 'post-5', url: 'https://picsum.photos/seed/minimal_construct/800/1000', type: 'IMAGE', orderIndex: 0 },
    
    // Carousel for post-6 (multiple items)
    { id: 'media-6a', postId: 'post-6', url: 'https://picsum.photos/seed/tokyo_street_1/800/800', type: 'IMAGE', orderIndex: 0 },
    { id: 'media-6b', postId: 'post-6', url: 'https://picsum.photos/seed/tokyo_street_2/800/800', type: 'IMAGE', orderIndex: 1 },
    { id: 'media-6c', postId: 'post-6', url: 'https://picsum.photos/seed/tokyo_street_3/800/800', type: 'IMAGE', orderIndex: 2 }
  ];

  // Active Stories (within 24 hours)
  const stories: Story[] = [
    {
      id: 'story-1',
      userId: 'user-1',
      mediaUrl: 'https://picsum.photos/seed/alex_story/800/1400',
      mediaType: 'IMAGE',
      expiresAt: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(), // expires in 20 hours
      createdAt: new Date().toISOString()
    },
    {
      id: 'story-2',
      userId: 'user-2',
      mediaUrl: 'https://picsum.photos/seed/elena_story/800/1400',
      mediaType: 'IMAGE',
      expiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    },
    {
      id: 'story-3',
      userId: 'user-3',
      mediaUrl: 'https://picsum.photos/seed/marcus_story/800/1400',
      mediaType: 'IMAGE',
      expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    },
    {
      id: 'story-4',
      userId: 'user-4',
      mediaUrl: 'https://picsum.photos/seed/sarah_story/800/1400',
      mediaType: 'IMAGE',
      expiresAt: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    }
  ];

  // Likes
  const postLikes: PostLike[] = [
    { userId: 'user-2', postId: 'post-1' },
    { userId: 'user-3', postId: 'post-1' },
    { userId: 'user-4', postId: 'post-1' },
    { userId: 'user-1', postId: 'post-2' },
    { userId: 'user-3', postId: 'post-2' },
    { userId: 'user-5', postId: 'post-2' },
    { userId: 'user-1', postId: 'post-3' },
    { userId: 'user-4', postId: 'post-3' },
    { userId: 'user-2', postId: 'post-4' },
    { userId: 'user-5', postId: 'post-4' },
    { userId: 'user-1', postId: 'post-5' },
    { userId: 'user-2', postId: 'post-5' },
    { userId: 'user-2', postId: 'post-6' },
    { userId: 'user-4', postId: 'post-6' }
  ];

  // Bookmarks
  const bookmarks: Bookmark[] = [
    { userId: 'user-1', postId: 'post-2' },
    { userId: 'user-1', postId: 'post-4' },
    { userId: 'user-2', postId: 'post-1' },
    { userId: 'user-3', postId: 'post-5' }
  ];

  // Follows
  const follows: Follow[] = [
    { followerId: 'user-1', followingId: 'user-2' },
    { followerId: 'user-1', followingId: 'user-3' },
    { followerId: 'user-1', followingId: 'user-4' },
    { followerId: 'user-2', followingId: 'user-1' },
    { followerId: 'user-2', followingId: 'user-3' },
    { followerId: 'user-3', followingId: 'user-1' },
    { followerId: 'user-4', followingId: 'user-1' },
    { followerId: 'user-4', followingId: 'user-2' },
    { followerId: 'user-5', followingId: 'user-1' }
  ];

  // Comments (including nesting parentId fields)
  const comments: Comment[] = [
    { id: 'comment-1', postId: 'post-1', userId: 'user-2', content: 'These tones are absolutely unreal! What lens did you use?', parentId: null, createdAt: new Date(Date.now() - 110 * 60 * 1000).toISOString() },
    { id: 'comment-2', postId: 'post-1', userId: 'user-1', content: 'Thanks Elena! I shot this on a 35mm f/1.4 prime, wide open.', parentId: 'comment-1', createdAt: new Date(Date.now() - 100 * 60 * 1000).toISOString() },
    { id: 'comment-3', postId: 'post-1', userId: 'user-3', content: 'Incredible reflection symmetry on the asphalt pavement.', parentId: null, createdAt: new Date(Date.now() - 95 * 60 * 1000).toISOString() },
    
    { id: 'comment-4', postId: 'post-2', userId: 'user-1', content: 'Stunning cinematic depth here. Love the neon fog feel.', parentId: null, createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
    { id: 'comment-5', postId: 'post-2', userId: 'user-2', content: 'Much appreciated Alex! Rainy weather is my favorite studio.', parentId: 'comment-4', createdAt: new Date(Date.now() - 3.8 * 60 * 60 * 1000).toISOString() },
    
    { id: 'comment-6', postId: 'post-3', userId: 'user-4', content: 'The motion rhythm matches the cyberpunk soundtrack perfectly.', parentId: null, createdAt: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString() },
    { id: 'comment-7', postId: 'post-5', userId: 'user-1', content: 'This composition is so clean it looks almost architectural.', parentId: null, createdAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString() }
  ];

  // Direct Messages
  const directMessages: DirectMessage[] = [
    { id: 'dm-1', senderId: 'user-2', receiverId: 'user-1', content: 'Hey Alex! Are we still collaborating on that rainy neon photoshoot next Thursday?', mediaUrl: null, isRead: true, createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
    { id: 'dm-2', senderId: 'user-1', receiverId: 'user-2', content: 'Absolutely! I just scouted a brilliant alleyway in Kabukicho with a flawless purple glass panel. Let’s do 9 PM.', mediaUrl: null, isRead: true, createdAt: new Date(Date.now() - 2.8 * 60 * 60 * 1000).toISOString() },
    { id: 'dm-3', senderId: 'user-2', receiverId: 'user-1', content: 'Perfect. I will bring the wide-angle cinematic prime. See you there!', mediaUrl: null, isRead: false, createdAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString() },
    
    { id: 'dm-4', senderId: 'user-3', receiverId: 'user-1', content: 'Hey Alex, do you know how I can map custom RGB vectors in my node engine?', mediaUrl: null, isRead: true, createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'dm-5', senderId: 'user-1', receiverId: 'user-3', content: 'Send me your shader file, Marcus. I can audit the core fragment calculations for you!', mediaUrl: null, isRead: true, createdAt: new Date(Date.now() - 0.9 * 24 * 60 * 60 * 1000).toISOString() }
  ];

  const neighborWaves = [
    { id: 'wave-1', senderId: 'user-2', receiverId: 'user-1', type: 'wave', createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
    { id: 'wave-2', senderId: 'user-3', receiverId: 'user-1', type: 'tea', createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
  ];

  const neighborMoods = [
    { userId: 'user-1', vibeEmoji: '🎨', vibeLabel: 'Designing icons', updatedAt: new Date().toISOString() },
    { userId: 'user-2', vibeEmoji: '📸', vibeLabel: 'Chasing rainy alleys', updatedAt: new Date().toISOString() },
    { userId: 'user-3', vibeEmoji: '☕', vibeLabel: 'Drinking morning coffee', updatedAt: new Date().toISOString() },
    { userId: 'user-4', vibeEmoji: '🚶‍♀️', vibeLabel: 'Out for a warm walk', updatedAt: new Date().toISOString() },
    { userId: 'user-5', vibeEmoji: '🍪', vibeLabel: 'Baking sweet treats', updatedAt: new Date().toISOString() },
  ];

  const neighborBulletins = [
    { id: 'bulletin-1', userId: 'user-2', content: 'Spotted a gorgeous fluffy grey cat near the main gate! Super friendly, wearing a purple collar with a bell. 🐈', color: 'yellow', createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
    { id: 'bulletin-2', userId: 'user-3', content: 'Sharing fresh organic rosemary and mint from my windowsill herb garden! Feel free to knock or message me for a small bundle. 🌿', color: 'green', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { id: 'bulletin-3', userId: 'user-4', content: 'Beautiful clear afternoon sky today! Highly recommend sitting on the park bench for a bit. ☀️', color: 'pink', createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
  ];

  const cozyStrolls = [
    { id: 'stroll-1', userId: 'user-3', title: 'Sunset Lake Path Stroll 🌅', time: '6:30 PM Today', location: 'Lake Courtyard Gate', attendees: ['cyber_pulse', 'alex_vivid'], createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
    { id: 'stroll-2', userId: 'user-4', title: 'Morning Dog Walk & Chats 🐾', time: '8:00 AM Tomorrow', location: 'Central Green Bench', attendees: ['neon_lens'], createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
  ];

  const skySnapshots = [
    { id: 'sky-1', userId: 'user-1', imageUrl: 'https://picsum.photos/seed/sky1/600/400', description: 'Pastel dream above the rooftop this morning. 🌸☁️', createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
    { id: 'sky-2', userId: 'user-2', imageUrl: 'https://picsum.photos/seed/sky2/600/400', description: 'Ominous but gorgeous neon cloud setup right before the rain! ⚡🌧️', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  ];

  const cookieJarTreats = [
    { id: 'treat-1', userId: 'user-5', title: 'Fresh Warm Blueberry Muffins 🧁', description: 'Just pulled out of the oven! Super moist and sweet. Sharing with lovely neighbors.', totalPortions: 6, claimedByUsernames: ['alex_vivid', 'elena_pixels'], createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString() },
    { id: 'treat-2', userId: 'user-1', title: 'Chilled Peach Iced Tea Jar 🍑🍹', description: 'Infused with real peaches and mint! Perfect for a warm afternoon.', totalPortions: 4, claimedByUsernames: [], createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  ];

  const wisdomReflections = [
    { id: 'wisdom-1', userId: 'user-5', prompt: 'What is a small detail in nature that brings you pure joy?', text: 'Watching how young sparrows learn to splash around in puddle water after a rainy morning. It is a reminder that simple things can be the most rewarding.', createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() },
    { id: 'wisdom-2', userId: 'user-2', prompt: 'What is a piece of simple advice you would give to someone feeling stressed today?', text: 'Step outside without your phone for just five minutes. Look at the furthest visible horizon or tree line and breathe in deeply. The world is much larger than our screens.', createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() },
  ];

  const helpingHandPosts: { id: string; userId: string; title: string; description: string; type: 'need' | 'offer'; createdAt: string }[] = [
    { id: 'help-1', userId: 'user-1', title: 'Need a spare bicycle pump for 10 mins 🚲', description: 'Need to inflate my front tire before a quick evening ride. Can stop by to borrow and return it immediately!', type: 'need', createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString() },
    { id: 'help-2', userId: 'user-3', title: 'Happy to help carry heavy boxes/groceries! 📦', description: 'If any neighbors need some extra muscle moving heavy things or carrying boxes up the stairs this weekend, let me know!', type: 'offer', createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
  ];

  const neighborhoodSounds = [
    { id: 'sound-1', userId: 'user-2', title: 'Raindrops on Tin Canopy 🌧️', audioDataUrl: 'simulated_rain', createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
    { id: 'sound-2', userId: 'user-3', title: 'Chirping courtyard swallows 🐦', audioDataUrl: 'simulated_birds', createdAt: new Date(Date.now() - 50 * 60 * 1000).toISOString() },
  ];

  const receivedExpressions = [
    { id: 'expr-1', senderId: 'user-2', senderUsername: 'elena_pixels', receiverId: 'user-1', receiverUsername: 'alex_vivid', type: 'cocoa', createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
    { id: 'expr-2', senderId: 'user-3', senderUsername: 'cyber_pulse', receiverId: 'user-1', receiverUsername: 'alex_vivid', type: 'blanket', createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString() },
    { id: 'expr-3', senderId: 'user-5', senderUsername: 'kinetic_art', receiverId: 'user-2', receiverUsername: 'elena_pixels', type: 'pie', createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString() },
    { id: 'expr-4', senderId: 'user-1', senderUsername: 'alex_vivid', receiverId: 'user-3', receiverUsername: 'cyber_pulse', type: 'teddy', createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString() },
  ];

  const gratitudeNotes = [
    { id: 'note-1', senderId: 'user-1', senderUsername: 'alex_vivid', receiverId: 'user-2', receiverUsername: 'elena_pixels', text: 'Thank you Elena for scouting that incredible alleyway for our photoshoot! You have an amazing eye for lights. 📸✨', createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
    { id: 'note-2', senderId: 'user-3', senderUsername: 'cyber_pulse', receiverId: 'user-5', receiverUsername: 'kinetic_art', text: 'Marcus loved those blueberry muffins! Thanks for sweetening up our study session, Lucas. 🧁🙏', createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString() },
  ];

  const userRoles = [
    { userId: 'user-1', role: 'Quiet Dreamer 🌙' },
    { userId: 'user-2', role: 'Symphonist 🎵' },
    { userId: 'user-3', role: 'Stroll Organizer 👟' },
    { userId: 'user-4', role: 'Kind Helper 🤝' },
    { userId: 'user-5', role: 'Cozy Baker 🥖' },
  ];

  const interactionStreaks = [
    { userId1: 'user-1', userId2: 'user-2', count: 4, lastInteractedAt: new Date().toISOString() },
    { userId1: 'user-1', userId2: 'user-3', count: 2, lastInteractedAt: new Date().toISOString() },
  ];

  const atticKeepsakes: AtticKeepsake[] = [
    {
      id: 'keepsake-1',
      userId: 'user-1',
      title: 'Grandma’s Blueberry Pie Baking Lesson 🥧',
      imageUrl: 'https://picsum.photos/seed/keepsake1/600/400',
      yearOffset: 2,
      dateString: 'July 7',
      memoryText: 'This was exactly two years ago today. Grandma spent three hours teaching me how to crimp the edges of a perfect pie crust. The kitchen smelled like butter and warm berries.',
      chestId: 'holidays',
      createdAt: new Date(Date.now() - 2 * 365 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'keepsake-2',
      userId: 'user-1',
      title: 'Summer Lake Hammock Reading Day 📖',
      imageUrl: 'https://picsum.photos/seed/keepsake2/600/400',
      yearOffset: 1,
      dateString: 'July 7',
      memoryText: 'Last summer’s peaceful afternoon reading by the lake. Best afternoon snooze of my life.',
      chestId: 'childhood',
      createdAt: new Date(Date.now() - 1 * 365 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'keepsake-3',
      userId: 'user-1',
      title: 'First Windowbox Fern Sprout 🌱',
      imageUrl: 'https://picsum.photos/seed/keepsake3/600/400',
      yearOffset: 3,
      dateString: 'July 7',
      memoryText: 'Three years ago today, our very first fern sprouted its baby fronds in the kitchen. Now it has taken over the whole corner!',
      chestId: 'travels',
      createdAt: new Date(Date.now() - 3 * 365 * 24 * 3600 * 1000).toISOString()
    }
  ];

  const dailyWins: DailyWin[] = [
    { id: 'win-1', userId: 'user-1', category: 'ferns', victoryText: 'Gave all five ferns a thorough deep watering and trimmed the dry leaves.', createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
    { id: 'win-2', userId: 'user-1', category: 'reading', victoryText: 'Finally finished Chapter 4 of my cozy detective mystery book!', createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString() },
    { id: 'win-3', userId: 'user-1', category: 'stretching', victoryText: 'Did a slow, peaceful 15-minute leg and back stretch routine by the window.', createdAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString() }
  ];

  const familyMembers: FamilyMember[] = [
    {
      id: 'fam-1',
      userId: 'user-1',
      name: 'Grandma Martha',
      relationship: 'Grandmother',
      avatarUrl: 'https://picsum.photos/seed/grandma/150/150',
      photos: [
        { id: 'fp-1', url: 'https://picsum.photos/seed/f1/400/300', caption: 'Grandma Martha stitching her winter wool quilt.', createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString() },
        { id: 'fp-2', url: 'https://picsum.photos/seed/f2/400/300', caption: 'Martha’s award-winning lemon meringue tarts.', createdAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString() }
      ]
    },
    {
      id: 'fam-2',
      userId: 'user-1',
      name: 'Uncle David',
      relationship: 'Uncle',
      avatarUrl: 'https://picsum.photos/seed/uncle/150/150',
      photos: [
        { id: 'fp-3', url: 'https://picsum.photos/seed/f3/400/300', caption: 'Uncle David teaching us how to kayak down the gentle river.', createdAt: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString() }
      ]
    },
    {
      id: 'fam-3',
      userId: 'user-1',
      name: 'Little Lily',
      relationship: 'Sister',
      avatarUrl: 'https://picsum.photos/seed/sister/150/150',
      photos: [
        { id: 'fp-4', url: 'https://picsum.photos/seed/f4/400/300', caption: 'Lily blowing bubbles under the warm afternoon sun.', createdAt: new Date().toISOString() }
      ]
    }
  ];

  const gardenFlowers: CozyGardenFlower[] = [
    { id: 'flower-1', userId: 'user-1', flowerType: 'sunflower', growthStage: 3, positiveUpdate: 'Shared home-baked cinnamon rolls with Sarah next door! 🌻', createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() },
    { id: 'flower-2', userId: 'user-1', flowerType: 'lavender', growthStage: 2, positiveUpdate: 'Spent 20 minutes sitting in silent meditation listening to bird hums.', createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString() },
    { id: 'flower-3', userId: 'user-1', flowerType: 'rose', growthStage: 1, positiveUpdate: 'Watered the front garden and rescued a tiny bumblebee from a puddle.', createdAt: new Date().toISOString() }
  ];

  const patchworkQuiltMosaics: PatchworkQuilt[] = [
    {
      id: 'quilt-1',
      userId: 'user-1',
      title: 'Our Cozy Mid-Summer Quilt Tapestry',
      layoutPattern: 'checkerboard',
      photoUrls: [
        'https://picsum.photos/seed/qu1/200/200',
        'https://picsum.photos/seed/qu2/200/200',
        'https://picsum.photos/seed/qu3/200/200',
        'https://picsum.photos/seed/qu4/200/200',
        'https://picsum.photos/seed/qu5/200/200',
        'https://picsum.photos/seed/qu6/200/200',
        'https://picsum.photos/seed/qu7/200/200',
        'https://picsum.photos/seed/qu8/200/200',
        'https://picsum.photos/seed/qu9/200/200',
      ],
      createdAt: new Date().toISOString()
    }
  ];

  const paperChainCountdowns: PaperChainCountdown[] = [
    {
      id: 'countdown-1',
      userId: 'user-1',
      title: 'Family Summer Gathering at the Cottage 🏡',
      targetDate: new Date(Date.now() + 12 * 24 * 3600 * 1000).toISOString().split('T')[0], // 12 days away
      imageUrl: 'https://picsum.photos/seed/cottage/500/300',
      ringColor: 'warm-amber',
      createdAt: new Date().toISOString()
    }
  ];

  const soundAlbums: SoundAlbum[] = [
    {
      id: 'salbum-1',
      userId: 'user-1',
      title: 'Courtyard Summer Wind Chimes 🍃',
      slides: [
        { imageUrl: 'https://picsum.photos/seed/slide1/500/350', description: 'The old rusty brass wind chimes Grandma hung on the veranda.', voiceLabel: '"Listen to the soft evening clink..."' },
        { imageUrl: 'https://picsum.photos/seed/slide2/500/350', description: 'Fresh herbal lavender tea cooling on the wooden table.', voiceLabel: '"The steam smells like mountain fields..."' },
        { imageUrl: 'https://picsum.photos/seed/slide3/500/350', description: 'Golden sunshine streaming through the kitchen lace curtains.', voiceLabel: '"Warm spots on the wooden floor..."' }
      ],
      createdAt: new Date().toISOString()
    }
  ];

  const leatherDiaryEntries: LeatherDiaryEntry[] = [
    {
      id: 'diary-1',
      userId: 'user-1',
      title: 'A Solitary Rain in July',
      content: 'The rain began around noon. A gentle, persistent patter that cooled the hot asphalt. I sat on the covered porch with a mug of oolong tea, watching the swallows nesting under the eaves. There is a deep, restorative stillness that only a summer rain can bring.',
      isPrivate: true,
      goldLeafTheme: 'classic-burgundy',
      createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
    }
  ];

  const timeCapsuleJars: TimeCapsuleJar[] = [
    {
      id: 'capsule-1',
      userId: 'user-1',
      title: 'Family Christmas Surprise Jar 🎄',
      unlockDate: '2026-12-25',
      photoUrls: [
        'https://picsum.photos/seed/cap1/400/300',
        'https://picsum.photos/seed/cap2/400/300'
      ],
      message: 'Can’t wait to celebrate! This jar holds our favorite cottage memories from this summer. Merry Christmas!',
      createdAt: new Date().toISOString()
    }
  ];

  const nostalgicStories: NostalgicStory[] = [
    {
      id: 'nstory-1',
      userId: 'user-1',
      title: 'Restoring an 1890s Ansonia Grandfather Clock',
      category: 'restoration',
      imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=600',
      storyText: 'Found this masterpiece in a dusty barn in Maine. The pendulum rod was rusted shut and the escape wheel was chipped. Spent three months gently polishing the solid oak casing with orange oil, and micro-soldering the gear pinions. Now, its hourly chime sounds like a resonant brass bell echoing across the hall.',
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
    },
    {
      id: 'nstory-2',
      userId: 'user-2',
      title: 'Cultivating the Heritage "Apothecary" Rose',
      category: 'gardening',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=600',
      storyText: 'This rose variety dates back to the 13th century. It produces deep pink, semi-double petals with a heavy, spicy fragrance that modern roses have lost. I make rosewater and dry the petals for winter linen sachets just as my mother did.',
      createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'nstory-3',
      userId: 'user-3',
      title: 'The Great Elm under the Old Courthouse Square',
      category: 'history',
      imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=600',
      storyText: 'A historic snapshot of our town square back in 1948. People gathered beneath the shade of the great 200-year-old Elm, which unfortunately succumbed to Dutch Elm disease in the late seventies. It was the heart of the community, where the Saturday farmers market thrived.',
      createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
    }
  ];

  const neighborhoodBenches: NeighborhoodBench[] = [
    {
      id: 'bench-1',
      userId: 'user-1',
      title: 'Whispering Willow Creek Park Bench',
      description: 'Under the great willow tree right beside the stream. Best place to watch the mallard ducks and hear the bubbling water around 3:00 PM.',
      type: 'bench',
      latitude: 45,
      longitude: 32,
      img50YearsAgo: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&q=80&w=600',
      imgToday: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&q=80&w=600',
      createdAt: new Date().toISOString()
    },
    {
      id: 'bench-2',
      userId: 'user-2',
      title: 'Sunset Crest Bird Sanctuary',
      description: 'Features three beautiful handmade cedar benches. Perfect elevation to see bluebirds, finches, and the occasional sparrow hawk nested in the oak shrubs.',
      type: 'bird',
      latitude: 65,
      longitude: 78,
      img50YearsAgo: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=600',
      imgToday: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=600',
      createdAt: new Date().toISOString()
    },
    {
      id: 'bench-3',
      userId: 'user-3',
      title: 'Oakwood Historic Botanical Garden',
      description: 'A magnificent garden with fully accessible brick walking paths, raised flowerbeds, and ironwork arches overflowing with lavender and honeysuckle.',
      type: 'park',
      latitude: 25,
      longitude: 60,
      img50YearsAgo: 'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?auto=format&fit=crop&q=80&w=600',
      imgToday: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&q=80&w=600',
      createdAt: new Date().toISOString()
    }
  ];

  const furryFriendPets: FurryFriendPet[] = [
    {
      id: 'pet-1',
      userId: 'user-1',
      name: 'Barnaby',
      type: 'dog',
      imageUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=500',
      favoriteNapSpot: 'The patch of warm afternoon sun on the living room wool rug.',
      pettedCount: 24,
      treatsCount: 15,
      createdAt: new Date().toISOString()
    },
    {
      id: 'pet-2',
      userId: 'user-2',
      name: 'Mr. Fluffington',
      type: 'cat',
      imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=500',
      favoriteNapSpot: 'Cozying up directly on top of the fresh warm laundry straight from the dryer.',
      pettedCount: 42,
      treatsCount: 18,
      createdAt: new Date().toISOString()
    },
    {
      id: 'pet-3',
      userId: 'user-3',
      name: 'Hazel & Pip',
      type: 'bird',
      imageUrl: 'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?auto=format&fit=crop&q=80&w=500',
      favoriteNapSpot: 'Standing close together on the willow branch outside the kitchen window.',
      pettedCount: 12,
      treatsCount: 22,
      createdAt: new Date().toISOString()
    }
  ];

  const communityKitchenRecipes: CommunityKitchenRecipe[] = [
    {
      id: 'recipe-1',
      userId: 'user-1',
      title: 'Mrs. Higgins\' Sunday Apple Cobbler',
      description: 'A deeply comforting dessert made with hand-sliced Granny Smith apples, dynamic cinnamon crumble, and a secret pinch of ground nutmeg.',
      coverImage: 'https://images.unsplash.com/photo-1568569302499-1e177770aa09?auto=format&fit=crop&q=80&w=600',
      ingredients: [
        '6 cups sliced Granny Smith apples',
        '1 cup raw organic sugar',
        '1 tablespoon ground cinnamon',
        '1 cup all-purpose sifted flour',
        '1/2 cup cold salted butter',
        'A pinch of freshly grated nutmeg'
      ],
      steps: [
        { order: 1, text: 'Toss the sliced apples with sugar, cinnamon, and nutmeg, then spread evenly in a buttered baking dish.', imageUrl: 'https://images.unsplash.com/photo-1568569302499-1e177770aa09?auto=format&fit=crop&q=80&w=500' },
        { order: 2, text: 'Cut the cold butter into the flour using a pastry cutter until the mixture resembles coarse breadcrumbs.', imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=500' },
        { order: 3, text: 'Sprinkle the crumble mixture over the apples and bake at 375°F (190°C) for 45 minutes until the topping is golden brown.', imageUrl: 'https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&q=80&w=500' }
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: 'recipe-2',
      userId: 'user-2',
      title: 'Grandpa Arthur\'s Slow-Simmered Beef Stew',
      description: 'Rich, warming comfort bowl cooked over five hours on the woodstove with sweet root vegetables and deep rosemary broth.',
      coverImage: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=600',
      ingredients: [
        '2 lbs marbled beef chuck, cubed',
        '4 large sweet carrots, thickly chopped',
        '3 golden russet potatoes',
        '1 large yellow onion, diced',
        '4 cups rich bone broth',
        '2 sprigs fresh mountain rosemary'
      ],
      steps: [
        { order: 1, text: 'Sear the beef cubes in a cast iron Dutch oven with olive oil until beautifully browned on all sides.', imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=500' },
        { order: 2, text: 'Add carrots, potatoes, onions, bone broth, and tuck the rosemary sprigs into the center.', imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=500' },
        { order: 3, text: 'Cover and simmer on low heat for 4 hours until the beef is incredibly tender and melt-in-your-mouth.', imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=500' }
      ],
      createdAt: new Date().toISOString()
    }
  ];

  const craftingGuildProjects: CraftingGuildProject[] = [
    {
      id: 'craft-1',
      userId: 'user-1',
      title: 'Winter Merino Wool Cable-Knit Socks',
      category: 'knitting',
      creatorName: 'Eleanor Higgins',
      creatorAge: 72,
      imageUrl: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&q=80&w=500',
      patternOrTips: 'Yarn: 100% Merino, Needles: US Size 2 double-pointed. Tip: Reinforce the heel flap with a slip-stitch pattern for extra durability!',
      progressText: 'Finished the left heel turn today! Starting the foot length now. The pattern is coming together beautifully.',
      cheers: 15,
      encouragements: [
        { id: 'enc-1', authorName: 'Arthur Vance', text: 'Those look incredibly warm and neat, Eleanor! Splendid needlework.', createdAt: new Date().toISOString() }
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: 'craft-2',
      userId: 'user-2',
      title: 'Hand-Carved Mahogany Rocking Chair',
      category: 'carpentry',
      creatorName: 'Robert Vance',
      creatorAge: 68,
      imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=500',
      patternOrTips: 'Wood: Aged Mahogany. Technique: Mortise and tenon joinery. Sanded up to 400 grit for an ultra-smooth finish.',
      progressText: 'Just finished applying the second coat of natural tung oil. The wood grain is shining with a deep, warm amber glow.',
      cheers: 28,
      encouragements: [
        { id: 'enc-2', authorName: 'Sarah Jenkins', text: 'Stunning craftsmanship, Robert. This is a true heirloom piece!', createdAt: new Date().toISOString() }
      ],
      createdAt: new Date().toISOString()
    }
  ];

  return {
    users,
    posts,
    postMedia,
    stories,
    postLikes,
    comments,
    bookmarks,
    follows,
    directMessages,
    neighborWaves,
    neighborMoods,
    neighborBulletins,
    cozyStrolls,
    skySnapshots,
    cookieJarTreats,
    wisdomReflections,
    helpingHandPosts,
    neighborhoodSounds,
    receivedExpressions,
    gratitudeNotes,
    userRoles,
    interactionStreaks,
    atticKeepsakes,
    dailyWins,
    familyMembers,
    gardenFlowers,
    patchworkQuiltMosaics,
    paperChainCountdowns,
    soundAlbums,
    leatherDiaryEntries,
    timeCapsuleJars,
    nostalgicStories,
    neighborhoodBenches,
    furryFriendPets,
    communityKitchenRecipes,
    craftingGuildProjects,
  };
};

// --- INITIALIZE SERVER-SIDE PERSISTENCE Fallback ---
// We attach our reactive virtual DB state directly to globalThis to persist changes during development runtime
declare global {
  var __vividpulse_db: DatabaseState | undefined;
}

export async function getDB(): Promise<DatabaseState> {
  if (!globalThis.__vividpulse_db) {
    globalThis.__vividpulse_db = await getInitialSeedData();
  }
  return globalThis.__vividpulse_db;
}

// Function to save/modify global DB state
export async function saveDB(state: DatabaseState): Promise<void> {
  globalThis.__vividpulse_db = state;
}

// Ensure database table structures exist if Vercel Postgres is connected
// For hiring managers, we provide the SQL schema creation string so it runs out-of-the-box
export async function initializeDatabaseSchema() {
  if (!process.env.POSTGRES_URL) {
    // Logging silently or acting as fallback safely
    return;
  }
  try {
    // Create Users table
    await sql`
      CREATE TABLE IF NOT EXISTS vp_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        bio VARCHAR(150),
        avatar_url VARCHAR(1000),
        website VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create Posts table
    await sql`
      CREATE TABLE IF NOT EXISTS vp_posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES vp_users(id) ON DELETE CASCADE,
        caption TEXT,
        location VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create PostMedia table
    await sql`
      CREATE TABLE IF NOT EXISTS vp_post_media (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID REFERENCES vp_posts(id) ON DELETE CASCADE,
        url VARCHAR(1000) NOT NULL,
        type VARCHAR(50) NOT NULL,
        order_index INT DEFAULT 0
      );
    `;

    // Create Stories table
    await sql`
      CREATE TABLE IF NOT EXISTS vp_stories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES vp_users(id) ON DELETE CASCADE,
        media_url VARCHAR(1000) NOT NULL,
        media_type VARCHAR(50) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create Likes, Comments, Bookmarks, Follows tables
    await sql`
      CREATE TABLE IF NOT EXISTS vp_post_likes (
        user_id UUID REFERENCES vp_users(id) ON DELETE CASCADE,
        post_id UUID REFERENCES vp_posts(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, post_id)
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS vp_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID REFERENCES vp_posts(id) ON DELETE CASCADE,
        user_id UUID REFERENCES vp_users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        parent_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS vp_bookmarks (
        user_id UUID REFERENCES vp_users(id) ON DELETE CASCADE,
        post_id UUID REFERENCES vp_posts(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, post_id)
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS vp_follows (
        follower_id UUID REFERENCES vp_users(id) ON DELETE CASCADE,
        following_id UUID REFERENCES vp_users(id) ON DELETE CASCADE,
        PRIMARY KEY (follower_id, following_id)
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS vp_direct_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id UUID REFERENCES vp_users(id) ON DELETE CASCADE,
        receiver_id UUID REFERENCES vp_users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        media_url VARCHAR(1000),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
  } catch (error) {
    console.error('Failed to initialize database schema via Vercel Postgres:', error);
  }
}
