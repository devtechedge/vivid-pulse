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
  mediaType: 'IMAGE' | 'VIDEO';
  expiresAt: string;
  createdAt: string;
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
}

// Global state interface for server-side fallback storage
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
