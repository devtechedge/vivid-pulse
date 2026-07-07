'use server';

import { cookies } from 'next/headers';
import { getDB, saveDB, hashPassword, generateUUID, User, Post, PostMedia, Story, PostLike, Comment, Bookmark, Follow, DirectMessage, SafeRoom, SafeRoomMessage, AtticKeepsake, DailyWin, FamilyMember, CozyGardenFlower, PatchworkQuilt, PaperChainCountdown, SoundAlbum, LeatherDiaryEntry, TimeCapsuleJar } from './db';

// Secret key for custom session integrity
const SESSION_SECRET = 'vividpulse_signing_secret_2026';

// --- SESSION HELPER OPERATIONS ---
async function generateSessionToken(userId: string): Promise<string> {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const data = `${userId}:${expiresAt}`;
  
  // Create HMAC-like SHA-256 signature
  const encoder = new TextEncoder();
  const rawData = encoder.encode(data + SESSION_SECRET);
  const sigBuffer = await crypto.subtle.digest('SHA-256', rawData);
  const sigArray = Array.from(new Uint8Array(sigBuffer));
  const signature = sigArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return `${userId}:${expiresAt}:${signature}`;
}

async function verifySessionToken(token: string): Promise<string | null> {
  if (!token) return null;
  const parts = token.split(':');
  if (parts.length !== 3) return null;

  const [userId, expiresAtStr, signature] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);
  if (isNaN(expiresAt) || expiresAt < Date.now()) return null;

  const data = `${userId}:${expiresAt}`;
  const encoder = new TextEncoder();
  const rawData = encoder.encode(data + SESSION_SECRET);
  const sigBuffer = await crypto.subtle.digest('SHA-256', rawData);
  const sigArray = Array.from(new Uint8Array(sigBuffer));
  const expectedSignature = sigArray.map(b => b.toString(16).padStart(2, '0')).join('');

  if (signature === expectedSignature) {
    return userId;
  }
  return null;
}

// --- 1. AUTHENTICATION & SECURITY SYSTEM ---

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('vp_session')?.value;
    if (!sessionToken) return null;

    const userId = await verifySessionToken(sessionToken);
    if (!userId) return null;

    const db = await getDB();
    const user = db.users.find(u => u.id === userId);
    return user || null;
  } catch {
    return null;
  }
}

export async function registerUser(formData: {
  username: string;
  email: string;
  passwordHash: string; // Plain password passed, but we hash it securely inside
  displayName: string;
  bio: string;
}) {
  try {
    const db = await getDB();
    const normalizedUsername = formData.username.trim().toLowerCase();
    const normalizedEmail = formData.email.trim().toLowerCase();

    // Validations
    if (!normalizedUsername || normalizedUsername.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters.' };
    }
    if (!formData.passwordHash || formData.passwordHash.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }
    if (db.users.some(u => u.username === normalizedUsername)) {
      return { success: false, error: 'Username is already taken.' };
    }
    if (db.users.some(u => u.email === normalizedEmail)) {
      return { success: false, error: 'Email is already registered.' };
    }

    const hashed = await hashPassword(formData.passwordHash);
    const newUser: User = {
      id: generateUUID(),
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash: hashed,
      displayName: formData.displayName.trim() || normalizedUsername,
      bio: formData.bio.trim().substring(0, 150),
      avatarUrl: `https://picsum.photos/seed/${normalizedUsername}/300/300`,
      website: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    await saveDB(db);

    // Auto-login after register
    const token = await generateSessionToken(newUser.id);
    const cookieStore = await cookies();
    cookieStore.set('vp_session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return { success: true, user: newUser };
  } catch (error: any) {
    return { success: false, error: error.message || 'Registration failed.' };
  }
}

export async function loginUser(credentials: { usernameOrEmail: string; passwordHash: string }) {
  try {
    const db = await getDB();
    const input = credentials.usernameOrEmail.trim().toLowerCase();
    const hashed = await hashPassword(credentials.passwordHash);

    const user = db.users.find(u => u.username === input || u.email === input);
    if (!user) {
      return { success: false, error: 'Invalid username, email, or password.' };
    }

    if (user.passwordHash !== hashed) {
      return { success: false, error: 'Invalid username, email, or password.' };
    }

    const token = await generateSessionToken(user.id);
    const cookieStore = await cookies();
    cookieStore.set('vp_session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message || 'Login failed.' };
  }
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete('vp_session');
  return { success: true };
}


// --- 2. FEED & POST CAROUSEL SYSTEM ---

export interface FeedPost {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  caption: string | null;
  location: string | null;
  createdAt: string;
  media: PostMedia[];
  likesCount: number;
  commentsCount: number;
  hasLiked: boolean;
  hasBookmarked: boolean;
  isFollowing: boolean;
  audioUrl?: string | null;
  audioTitle?: string | null;
  focalAnchors?: string | null;
  colorPalette?: string | null;
  layoutMatrix?: string | null;
  coAuthors?: string | null;
  vectorTextPanel?: string | null;
}

export async function getFeed(cursor?: string, limit = 5): Promise<{ posts: FeedPost[]; nextCursor: string | null }> {
  const db = await getDB();
  const currentUser = await getCurrentUser();

  // Sort posts by newest first
  let sortedPosts = [...db.posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Cursor-based pagination logic
  let startIndex = 0;
  if (cursor) {
    const foundIndex = sortedPosts.findIndex(p => p.id === cursor);
    if (foundIndex !== -1) {
      startIndex = foundIndex + 1;
    }
  }

  const paginatedPosts = sortedPosts.slice(startIndex, startIndex + limit);
  const nextCursor = paginatedPosts.length === limit ? paginatedPosts[paginatedPosts.length - 1].id : null;

  const feedPosts: FeedPost[] = paginatedPosts.map(post => {
    const author = db.users.find(u => u.id === post.userId) || {
      username: 'anonymous',
      displayName: 'Anonymous User',
      avatarUrl: null
    };

    const media = db.postMedia
      .filter(m => m.postId === post.id)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    const likesCount = db.postLikes.filter(l => l.postId === post.id).length;
    const commentsCount = db.comments.filter(c => c.postId === post.id).length;

    const hasLiked = currentUser ? db.postLikes.some(l => l.postId === post.id && l.userId === currentUser.id) : false;
    const hasBookmarked = currentUser ? db.bookmarks.some(b => b.postId === post.id && b.userId === currentUser.id) : false;
    const isFollowing = currentUser ? db.follows.some(f => f.followerId === currentUser.id && f.followingId === post.userId) : false;

    return {
      id: post.id,
      userId: post.userId,
      username: author.username,
      displayName: author.displayName,
      avatarUrl: author.avatarUrl,
      caption: post.caption,
      location: post.location,
      createdAt: post.createdAt,
      media,
      likesCount,
      commentsCount,
      hasLiked,
      hasBookmarked,
      isFollowing,
      audioUrl: post.audioUrl,
      audioTitle: post.audioTitle,
      focalAnchors: post.focalAnchors,
      colorPalette: post.colorPalette,
      layoutMatrix: post.layoutMatrix,
      coAuthors: post.coAuthors,
      vectorTextPanel: post.vectorTextPanel,
    };
  });

  return { posts: feedPosts, nextCursor };
}

export async function createPost(
  caption: string,
  location: string,
  mediaUrls: string[],
  meta?: {
    audioUrl?: string | null;
    audioTitle?: string | null;
    focalAnchors?: string | null;
    colorPalette?: string | null;
    layoutMatrix?: string | null;
    coAuthors?: string | null;
    vectorTextPanel?: string | null;
  }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Unauthorized.' };

  if (!mediaUrls || mediaUrls.length === 0) {
    return { success: false, error: 'At least one image or video is required.' };
  }

  const db = await getDB();
  const newPostId = generateUUID();

  const newPost: Post = {
    id: newPostId,
    userId: currentUser.id,
    caption: caption.trim() || null,
    location: location.trim() || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    audioUrl: meta?.audioUrl || null,
    audioTitle: meta?.audioTitle || null,
    focalAnchors: meta?.focalAnchors || null,
    colorPalette: meta?.colorPalette || null,
    layoutMatrix: meta?.layoutMatrix || null,
    coAuthors: meta?.coAuthors || null,
    vectorTextPanel: meta?.vectorTextPanel || null,
  };

  const newMedia: PostMedia[] = mediaUrls.map((url, index) => ({
    id: generateUUID(),
    postId: newPostId,
    url,
    type: 'IMAGE',
    orderIndex: index,
  }));

  db.posts.push(newPost);
  db.postMedia.push(...newMedia);
  await saveDB(db);

  return { success: true, post: newPost };
}


// --- 3. EPHEMERAL STORY SYSTEM ---

export interface ActiveStoryTray {
  userId: string;
  username: string;
  avatarUrl: string | null;
  stories: Story[];
}

export async function getActiveStories(): Promise<ActiveStoryTray[]> {
  const db = await getDB();
  const now = new Date().toISOString();

  // Filter out expired stories
  const activeStories = db.stories.filter(s => s.expiresAt > now);

  // Group by user
  const userMap = new Map<string, Story[]>();
  activeStories.forEach(story => {
    if (!userMap.has(story.userId)) {
      userMap.set(story.userId, []);
    }
    userMap.get(story.userId)!.push(story);
  });

  const trays: ActiveStoryTray[] = [];
  
  // Sort users so that we display them in visual order
  userMap.forEach((userStories, userId) => {
    const user = db.users.find(u => u.id === userId);
    if (user) {
      trays.push({
        userId,
        username: user.username,
        avatarUrl: user.avatarUrl,
        stories: userStories.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
      });
    }
  });

  return trays;
}

export async function createStory(
  mediaUrl: string,
  mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO_WAVEFORM' | 'TEXT' = 'IMAGE',
  meta?: {
    qaQuestion?: string;
    chainedStoryId?: string;
    chainName?: string;
    audioDataUrl?: string;
    waveformPoints?: number[];
    latitude?: number;
    longitude?: number;
    isGated?: boolean;
    pollQuestion?: string;
    pollMinLabel?: string;
    pollMaxLabel?: string;
    codeSnippet?: string;
    codeLanguage?: string;
    hasAnonymousTerminal?: boolean;
    hashtags?: string[];
  }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Unauthorized.' };

  const db = await getDB();
  const newStory: Story = {
    id: generateUUID(),
    userId: currentUser.id,
    mediaUrl,
    mediaType,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    ...meta,
    qaAnswers: meta?.qaQuestion ? [] : undefined,
    pollVotes: meta?.pollQuestion ? [] : undefined,
    anonymousAnswers: meta?.hasAnonymousTerminal ? [] : undefined,
  };

  db.stories.push(newStory);
  await saveDB(db);

  return { success: true, story: newStory };
}

export async function submitStoryQAAnswer(storyId: string, answerText: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Unauthorized.' };

  const db = await getDB();
  const story = db.stories.find(s => s.id === storyId);
  if (!story) return { success: false, error: 'Story not found.' };

  if (!story.qaAnswers) {
    story.qaAnswers = [];
  }

  story.qaAnswers.push({
    id: generateUUID(),
    username: currentUser.username,
    text: answerText.trim(),
    createdAt: new Date().toISOString(),
  });

  await saveDB(db);
  return { success: true, story };
}

export async function submitStoryPollVote(storyId: string, score: number) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Unauthorized.' };

  const db = await getDB();
  const story = db.stories.find(s => s.id === storyId);
  if (!story) return { success: false, error: 'Story not found.' };

  if (!story.pollVotes) {
    story.pollVotes = [];
  }

  const existingIndex = story.pollVotes.findIndex(v => v.username === currentUser.username);
  if (existingIndex !== -1) {
    story.pollVotes[existingIndex].score = score;
  } else {
    story.pollVotes.push({
      username: currentUser.username,
      score,
    });
  }

  await saveDB(db);
  return { success: true, story };
}

export async function submitStoryAnonymousAnswer(storyId: string, text: string) {
  const db = await getDB();
  const story = db.stories.find(s => s.id === storyId);
  if (!story) return { success: false, error: 'Story not found.' };

  if (!story.anonymousAnswers) {
    story.anonymousAnswers = [];
  }

  story.anonymousAnswers.push({
    id: generateUUID(),
    text: text.trim(),
    createdAt: new Date().toISOString(),
  });

  await saveDB(db);
  return { success: true, story };
}

export async function getNarrativeVault(username: string) {
  const db = await getDB();
  const user = db.users.find(u => u.username === username);
  if (!user) return [];

  return db.stories
    .filter(s => s.userId === user.id && s.hashtags && s.hashtags.length > 0)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function checkEngagementGated(creatorId: string): Promise<boolean> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return false;
  if (currentUser.id === creatorId) return true;

  const db = await getDB();
  const creatorPostIds = db.posts.filter(p => p.userId === creatorId).map(p => p.id);
  if (creatorPostIds.length === 0) return false;

  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  
  const hasLiked = db.postLikes.some(l => creatorPostIds.includes(l.postId) && l.userId === currentUser.id);
  const hasCommented = db.comments.some(c => 
    creatorPostIds.includes(c.postId) && 
    c.userId === currentUser.id && 
    c.createdAt > fortyEightHoursAgo
  );

  return hasLiked || hasCommented;
}


// --- 4. THREADED ENGAGEMENT HUB (LIKES & COMMENTS) ---

export async function toggleLike(postId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Unauthorized' };

  const db = await getDB();
  const index = db.postLikes.findIndex(l => l.postId === postId && l.userId === currentUser.id);

  let hasLiked = false;
  if (index !== -1) {
    db.postLikes.splice(index, 1);
  } else {
    db.postLikes.push({ userId: currentUser.id, postId });
    hasLiked = true;
  }

  await saveDB(db);
  const likesCount = db.postLikes.filter(l => l.postId === postId).length;

  return { success: true, hasLiked, likesCount };
}

export async function toggleBookmark(postId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Unauthorized' };

  const db = await getDB();
  const index = db.bookmarks.findIndex(b => b.postId === postId && b.userId === currentUser.id);

  let hasBookmarked = false;
  if (index !== -1) {
    db.bookmarks.splice(index, 1);
  } else {
    db.bookmarks.push({ userId: currentUser.id, postId });
    hasBookmarked = true;
  }

  await saveDB(db);
  return { success: true, hasBookmarked };
}

export interface ThreadedComment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  content: string;
  parentId: string | null;
  createdAt: string;
  replies: ThreadedComment[];
}

export async function getComments(postId: string): Promise<ThreadedComment[]> {
  const db = await getDB();
  
  const allPostComments = db.comments.filter(c => c.postId === postId);
  
  // Format each comment
  const formattedComments: ThreadedComment[] = allPostComments.map(c => {
    const user = db.users.find(u => u.id === c.userId) || {
      username: 'anonymous',
      displayName: 'Anonymous User',
      avatarUrl: null
    };

    return {
      id: c.id,
      postId: c.postId,
      userId: c.userId,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      content: c.content,
      parentId: c.parentId,
      createdAt: c.createdAt,
      replies: [],
    };
  });

  // Nest them (2-level depth maximum)
  const parents = formattedComments.filter(c => c.parentId === null);
  const children = formattedComments.filter(c => c.parentId !== null);

  parents.forEach(parent => {
    parent.replies = children
      .filter(child => child.parentId === parent.id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  });

  // Sort parent comments by newest first
  return parents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function addComment(postId: string, content: string, parentId?: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Unauthorized' };

  if (!content.trim()) {
    return { success: false, error: 'Comment content cannot be empty.' };
  }

  const db = await getDB();
  const newComment: Comment = {
    id: generateUUID(),
    postId,
    userId: currentUser.id,
    content: content.trim(),
    parentId: parentId || null,
    createdAt: new Date().toISOString(),
  };

  db.comments.push(newComment);
  await saveDB(db);

  return { success: true, comment: newComment };
}


// --- 5. DISCOVER & MASONRY ALGORITHMIC GRID ---

export interface DiscoverPost {
  id: string;
  imageUrl: string;
  aspectRatioClass: string; // Dynamic sizes for masonry look
  likesCount: number;
  commentsCount: number;
  caption: string | null;
  location: string | null;
  authorUsername: string;
}

export async function getDiscoverPosts(searchQuery = ''): Promise<DiscoverPost[]> {
  const db = await getDB();
  const query = searchQuery.trim().toLowerCase();

  let filteredPosts = db.posts;

  if (query) {
    filteredPosts = db.posts.filter(post => {
      const author = db.users.find(u => u.id === post.userId);
      const inCaption = post.caption?.toLowerCase().includes(query);
      const inLocation = post.location?.toLowerCase().includes(query);
      const inUser = author?.username.toLowerCase().includes(query) || author?.displayName.toLowerCase().includes(query);
      return inCaption || inLocation || inUser;
    });
  }

  // Pre-determined aspect ratios to make the masonry grid beautiful and reliable
  const aspectRatios = [
    'aspect-square',      // 1:1
    'aspect-[3/4]',       // Tall
    'aspect-square',      // 1:1
    'aspect-[4/5]',       // Portrait
    'aspect-[3/4]',       // Tall
    'aspect-square',      // 1:1
  ];

  return filteredPosts.map((post, index) => {
    const author = db.users.find(u => u.id === post.userId);
    const media = db.postMedia.find(m => m.postId === post.id && m.orderIndex === 0);
    const likesCount = db.postLikes.filter(l => l.postId === post.id).length;
    const commentsCount = db.comments.filter(c => c.postId === post.id).length;

    return {
      id: post.id,
      imageUrl: media?.url || 'https://picsum.photos/seed/placeholder/800/800',
      aspectRatioClass: aspectRatios[index % aspectRatios.length],
      likesCount,
      commentsCount,
      caption: post.caption,
      location: post.location,
      authorUsername: author?.username || 'anonymous',
    };
  });
}


// --- 6. DIRECT MESSAGING HUB (POLLING COMPATIBLE) ---

export interface Conversation {
  otherUser: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  latestMessage: DirectMessage;
  unreadCount: number;
}

export async function getConversations(): Promise<Conversation[]> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return [];

  const db = await getDB();
  
  // Filter all messages where current user is sender or receiver
  const myMessages = db.directMessages.filter(
    m => m.senderId === currentUser.id || m.receiverId === currentUser.id
  );

  // Group by the other user's ID
  const conversationMap = new Map<string, DirectMessage[]>();
  myMessages.forEach(msg => {
    const otherId = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId;
    if (!conversationMap.has(otherId)) {
      conversationMap.set(otherId, []);
    }
    conversationMap.get(otherId)!.push(msg);
  });

  const list: Conversation[] = [];

  conversationMap.forEach((messages, otherId) => {
    const otherUser = db.users.find(u => u.id === otherId);
    if (otherUser) {
      // Sort messages to find latest
      const sorted = [...messages].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const latestMessage = sorted[0];

      const unreadCount = messages.filter(
        m => m.receiverId === currentUser.id && !m.isRead
      ).length;

      list.push({
        otherUser: {
          id: otherUser.id,
          username: otherUser.username,
          displayName: otherUser.displayName,
          avatarUrl: otherUser.avatarUrl,
        },
        latestMessage,
        unreadCount,
      });
    }
  });

  // Sort conversations by the latest message's date
  return list.sort((a, b) => new Date(b.latestMessage.createdAt).getTime() - new Date(a.latestMessage.createdAt).getTime());
}

export async function getDirectMessages(otherUserId: string): Promise<DirectMessage[]> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return [];

  const db = await getDB();

  // Fetch messages between currentUser and otherUserId
  const chatMessages = db.directMessages.filter(
    m => (m.senderId === currentUser.id && m.receiverId === otherUserId) ||
         (m.senderId === otherUserId && m.receiverId === currentUser.id)
  );

  // Mark received messages as read
  let changed = false;
  chatMessages.forEach(m => {
    if (m.receiverId === currentUser.id && !m.isRead) {
      m.isRead = true;
      changed = true;
    }
  });

  if (changed) {
    await saveDB(db);
  }

  // Sort chronologically (oldest to newest)
  return chatMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function sendMessage(
  receiverId: string, 
  content: string, 
  mediaUrl: string | null = null,
  options?: {
    isVolatile?: boolean;
    destructionDelay?: number;
    parentId?: string;
    hasAudio?: boolean;
    audioDuration?: number;
    audioDataUrl?: string;
    codeSnippet?: string;
    codeLanguage?: string;
  }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Unauthorized' };

  if (!content.trim() && !mediaUrl && !options?.audioDataUrl && !options?.codeSnippet) {
    return { success: false, error: 'Message cannot be empty.' };
  }

  const db = await getDB();
  const expiresAt = options?.isVolatile && options?.destructionDelay 
    ? new Date(Date.now() + options.destructionDelay * 1000).toISOString()
    : undefined;

  const newMessage: DirectMessage = {
    id: generateUUID(),
    senderId: currentUser.id,
    receiverId,
    content: content.trim(),
    mediaUrl,
    isRead: false,
    createdAt: new Date().toISOString(),
    isVolatile: options?.isVolatile,
    destructionDelay: options?.destructionDelay,
    expiresAt,
    parentId: options?.parentId,
    hasAudio: options?.hasAudio,
    audioDuration: options?.audioDuration,
    audioDataUrl: options?.audioDataUrl,
    codeSnippet: options?.codeSnippet,
    codeLanguage: options?.codeLanguage,
  };

  db.directMessages.push(newMessage);
  await saveDB(db);

  return { success: true, message: newMessage };
}

export async function togglePinMessage(messageId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Unauthorized' };

  const db = await getDB();
  const msg = db.directMessages.find(m => m.id === messageId);
  if (!msg) return { success: false, error: 'Message not found.' };

  msg.isPinned = !msg.isPinned;
  await saveDB(db);

  return { success: true, isPinned: msg.isPinned };
}

export async function deleteMessage(messageId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Unauthorized' };

  const db = await getDB();
  const initialLen = db.directMessages.length;
  db.directMessages = db.directMessages.filter(m => m.id !== messageId);
  
  if (db.directMessages.length !== initialLen) {
    await saveDB(db);
    return { success: true };
  }
  return { success: false, error: 'Message not found' };
}

export async function sendMultiRecipientBlast(
  receiverIds: string[], 
  content: string, 
  options?: { codeSnippet?: string; codeLanguage?: string }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Unauthorized' };

  if (receiverIds.length === 0) return { success: false, error: 'No recipients specified.' };
  if (receiverIds.length > 50) return { success: false, error: 'Cannot blast to more than 50 recipients concurrently.' };

  const db = await getDB();
  const sentMessages: DirectMessage[] = [];

  for (const rId of receiverIds) {
    const newMessage: DirectMessage = {
      id: generateUUID(),
      senderId: currentUser.id,
      receiverId: rId,
      content: content.trim(),
      mediaUrl: null,
      isRead: false,
      createdAt: new Date().toISOString(),
      codeSnippet: options?.codeSnippet,
      codeLanguage: options?.codeLanguage,
    };
    db.directMessages.push(newMessage);
    sentMessages.push(newMessage);
  }

  await saveDB(db);
  return { success: true, count: sentMessages.length };
}

export interface LinkPreviewData {
  url: string;
  title: string;
  description: string;
  image?: string;
  isCodeAsset?: boolean;
  codeLanguage?: string;
  codeSample?: string;
}

export async function resolveLinkPreview(url: string): Promise<LinkPreviewData> {
  const normalizedUrl = url.trim().toLowerCase();
  
  let isCodeAsset = false;
  let codeLanguage = 'javascript';
  let codeSample = '';
  let title = 'Web Resource Link';
  let description = 'Unpacked secure payload snippet from the remote frame.';
  let image = 'https://picsum.photos/seed/link_preview/400/250';

  if (normalizedUrl.endsWith('.js') || (normalizedUrl.includes('github.com') && normalizedUrl.includes('.js'))) {
    isCodeAsset = true;
    codeLanguage = 'javascript';
    title = 'Shinjuku Reflection Tracker Script';
    description = 'Source script evaluating relative coordinate vectors in generative neon matrices.';
    codeSample = `// Vector reflection formula
function reflectVector(incident, normal) {
  const dot = incident.x * normal.x + incident.y * normal.y;
  return {
    x: incident.x - 2 * dot * normal.x,
    y: incident.y - 2 * dot * normal.y
  };
}
console.log("Vector Reflect loaded!");`;
  } else if (normalizedUrl.endsWith('.ts') || normalizedUrl.endsWith('.tsx') || normalizedUrl.includes('/schema') || normalizedUrl.includes('/actions')) {
    isCodeAsset = true;
    codeLanguage = 'typescript';
    title = 'Database Connection Manager schema';
    description = 'Standard Drizzle connection interface configuring Postgres storage.';
    codeSample = `export interface DatabaseConfig {
  host: string;
  port: number;
  secure: boolean;
}
export class SecureNodePool {
  private activeConnections = 0;
  constructor(private config: DatabaseConfig) {}
  connect() { this.activeConnections++; }
}`;
  } else if (normalizedUrl.endsWith('.css') || normalizedUrl.includes('tailwind')) {
    isCodeAsset = true;
    codeLanguage = 'css';
    title = 'Vaporwave Neon Theme stylesheet';
    description = 'Custom global style specifications driving interactive color pulses.';
    codeSample = `@keyframes neonPulse {
  0%, 100% { filter: drop-shadow(0 0 2px #ec4899); }
  50% { filter: drop-shadow(0 0 12px #a855f7); }
}
.neon-pulse {
  animation: neonPulse 2s infinite ease-in-out;
}`;
  } else if (normalizedUrl.endsWith('.py')) {
    isCodeAsset = true;
    codeLanguage = 'python';
    title = 'Spectral Analysis Matrix model';
    description = 'Python script classifying visual feeds via deep learning weights.';
    codeSample = `import numpy as np

def extract_colors(image_path, num_clusters=5):
    # Simulating K-means clustering on neon pixels
    print(f"Clustering {image_path} coordinates...")
    return np.random.rand(num_clusters, 3) * 255`;
  } else if (normalizedUrl.includes('github.com')) {
    title = 'GitHub Repository - neon-canvas-vivid';
    description = 'Open-source web animations render loop built on dynamic canvas anchors.';
    image = 'https://picsum.photos/seed/github/400/250';
  } else if (normalizedUrl.includes('stackoverflow.com')) {
    title = 'Stack Overflow: How to safely handle React context in concurrent rendering?';
    description = 'Discussion on resolving state cascades and hooks in high-frequency short-poll networks.';
  } else if (normalizedUrl.includes('figma.com')) {
    title = 'Figma Design Board - VividPulse Web App';
    description = 'Prototype layouts, color guidelines, and interactive high-contrast buttons.';
  } else if (normalizedUrl.includes('picsum.photos') || normalizedUrl.includes('unsplash.com')) {
    title = 'Rich Visual Media Stream Asset';
    description = 'External high-definition media rendering inside conversation thread.';
    image = url;
  }

  return {
    url,
    title,
    description,
    image,
    isCodeAsset,
    codeLanguage,
    codeSample,
  };
}


// --- 7. PROFILE DASHBOARD & CREATOR ANALYTICS ---

export interface ProfileDetails {
  user: User;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isSelf: boolean;
  posts: FeedPost[];
  bookmarks: FeedPost[];
}

export async function getUserProfile(username: string): Promise<ProfileDetails | null> {
  const db = await getDB();
  const normalizedUsername = username.toLowerCase().trim();

  const user = db.users.find(u => u.username === normalizedUsername);
  if (!user) return null;

  const currentUser = await getCurrentUser();
  const isSelf = currentUser ? currentUser.id === user.id : false;

  const postsCount = db.posts.filter(p => p.userId === user.id).length;
  const followersCount = db.follows.filter(f => f.followingId === user.id).length;
  const followingCount = db.follows.filter(f => f.followerId === user.id).length;

  const isFollowing = currentUser 
    ? db.follows.some(f => f.followerId === currentUser.id && f.followingId === user.id) 
    : false;

  // Gather user's posts
  const userPosts = db.posts
    .filter(p => p.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const formattedPosts: FeedPost[] = userPosts.map(post => {
    const media = db.postMedia.filter(m => m.postId === post.id).sort((a, b) => a.orderIndex - b.orderIndex);
    const likesCount = db.postLikes.filter(l => l.postId === post.id).length;
    const commentsCount = db.comments.filter(c => c.postId === post.id).length;
    const hasLiked = currentUser ? db.postLikes.some(l => l.postId === post.id && l.userId === currentUser.id) : false;
    const hasBookmarked = currentUser ? db.bookmarks.some(b => b.postId === post.id && b.userId === currentUser.id) : false;

    return {
      id: post.id,
      userId: post.userId,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      caption: post.caption,
      location: post.location,
      createdAt: post.createdAt,
      media,
      likesCount,
      commentsCount,
      hasLiked,
      hasBookmarked,
      isFollowing,
    };
  });

  // Gather saved posts (only visible on own profile)
  let savedPosts: FeedPost[] = [];
  if (isSelf && currentUser) {
    const myBookmarks = db.bookmarks.filter(b => b.userId === currentUser.id);
    savedPosts = myBookmarks.map(b => {
      const p = db.posts.find(post => post.id === b.postId)!;
      if (!p) return null;
      const author = db.users.find(u => u.id === p.userId)!;
      const media = db.postMedia.filter(m => m.postId === p.id).sort((x, y) => x.orderIndex - y.orderIndex);
      const likesCount = db.postLikes.filter(l => l.postId === p.id).length;
      const commentsCount = db.comments.filter(c => c.postId === p.id).length;
      const hasLiked = db.postLikes.some(l => l.postId === p.id && l.userId === currentUser.id);

      return {
        id: p.id,
        userId: p.userId,
        username: author.username,
        displayName: author.displayName,
        avatarUrl: author.avatarUrl,
        caption: p.caption,
        location: p.location,
        createdAt: p.createdAt,
        media,
        likesCount,
        commentsCount,
        hasLiked,
        hasBookmarked: true,
        isFollowing: db.follows.some(f => f.followerId === currentUser.id && f.followingId === p.userId),
      };
    }).filter(Boolean) as FeedPost[];
  }

  return {
    user,
    postsCount,
    followersCount,
    followingCount,
    isFollowing,
    isSelf,
    posts: formattedPosts,
    bookmarks: savedPosts,
  };
}

export interface CreatorAnalytics {
  totalLikes: number;
  totalComments: number;
  avgEngagementRate: number;
  topPerformingPost: {
    id: string;
    caption: string | null;
    imageUrl: string;
    likesCount: number;
    commentsCount: number;
  } | null;
  growthMetrics: {
    label: string;
    value: string | number;
  }[];
}

export async function getCreatorAnalytics(userId: string): Promise<CreatorAnalytics> {
  const db = await getDB();
  const myPosts = db.posts.filter(p => p.userId === userId);
  
  let totalLikes = 0;
  let totalComments = 0;
  let topPost: Post | null = null;
  let maxEngagement = -1;

  myPosts.forEach(post => {
    const postLikesCount = db.postLikes.filter(l => l.postId === post.id).length;
    const postCommentsCount = db.comments.filter(c => c.postId === post.id).length;

    totalLikes += postLikesCount;
    totalComments += postCommentsCount;

    const engagement = postLikesCount + postCommentsCount;
    if (engagement > maxEngagement) {
      maxEngagement = engagement;
      topPost = post;
    }
  });

  const followersCount = db.follows.filter(f => f.followingId === userId).length;
  const avgEngagementRate = myPosts.length > 0 
    ? parseFloat(((totalLikes + totalComments) / myPosts.length).toFixed(1)) 
    : 0;

  let topPerformingPost: CreatorAnalytics['topPerformingPost'] = null;
  if (topPost) {
    const media = db.postMedia.find(m => m.postId === (topPost as Post).id);
    topPerformingPost = {
      id: (topPost as Post).id,
      caption: (topPost as Post).caption,
      imageUrl: media?.url || 'https://picsum.photos/seed/placeholder/800/800',
      likesCount: db.postLikes.filter(l => l.postId === (topPost as Post).id).length,
      commentsCount: db.comments.filter(c => c.postId === (topPost as Post).id).length,
    };
  }

  return {
    totalLikes,
    totalComments,
    avgEngagementRate,
    topPerformingPost,
    growthMetrics: [
      { label: 'Follower Count', value: followersCount },
      { label: 'Total Visual Content', value: myPosts.length },
      { label: 'Average Interaction', value: `${avgEngagementRate} pts` },
      { label: 'Profile Authority', value: followersCount > 3 ? 'Elite Visualizer' : 'Growing Pulse' }
    ]
  };
}

export async function toggleFollow(followingId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Unauthorized' };

  if (currentUser.id === followingId) {
    return { success: false, error: 'You cannot follow yourself.' };
  }

  const db = await getDB();
  const index = db.follows.findIndex(f => f.followerId === currentUser.id && f.followingId === followingId);

  let isFollowing = false;
  if (index !== -1) {
    db.follows.splice(index, 1);
  } else {
    db.follows.push({ followerId: currentUser.id, followingId });
    isFollowing = true;
  }

  await saveDB(db);
  return { success: true, isFollowing };
}

// Simple Vercel Blob mock function for client images
export async function mockUploadImage(base64Data: string): Promise<string> {
  // Simulates Vercel Blob intake and returns a high fidelity url
  // For the UI, we can just return the local base64 or a randomized picsum image with new seed so it works fully offline/locally!
  // To keep it clean, we can save the custom uploaded image in our global server database
  // or return the base64 itself (since next image handles standard base64/data URLs perfectly!)
  return base64Data;
}

// --- COZY NEIGHBORS & WARM COMMUNITY ACTIONS ---

export async function getNeighbors() {
  const db = await getDB();
  const currentUser = await getCurrentUser();

  // Initialize arrays if they don't exist yet
  if (!db.neighborMoods) db.neighborMoods = [];
  if (!db.neighborWaves) db.neighborWaves = [];

  // Map users with mood information and waves
  return db.users.map(user => {
    const mood = db.neighborMoods?.find(m => m.userId === user.id) || {
      vibeEmoji: '👋',
      vibeLabel: 'Available for a chat'
    };
    
    // Wave greeting counts to this user from current user or others
    const totalNudgesReceived = db.neighborWaves?.filter(w => w.receiverId === user.id).length || 0;
    const hasNudged = currentUser ? db.neighborWaves?.some(w => w.senderId === currentUser.id && w.receiverId === user.id) : false;

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      vibeEmoji: mood.vibeEmoji,
      vibeLabel: mood.vibeLabel,
      totalNudgesReceived,
      hasNudged
    };
  });
}

export async function sendNeighborNudge(receiverId: string, nudgeType: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Please log in to send warm vibes!' };

  if (currentUser.id === receiverId) {
    return { success: false, error: 'You are already filled with cozy thoughts!' };
  }

  const db = await getDB();
  if (!db.neighborWaves) db.neighborWaves = [];

  // Register the new wave/hug/tea nudge
  const newNudge = {
    id: generateUUID(),
    senderId: currentUser.id,
    receiverId,
    type: nudgeType,
    createdAt: new Date().toISOString()
  };

  db.neighborWaves.push(newNudge);
  await saveDB(db);

  return { success: true, nudge: newNudge };
}

export async function updateNeighborMood(vibeEmoji: string, vibeLabel: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Unauthorized' };

  const db = await getDB();
  if (!db.neighborMoods) db.neighborMoods = [];

  const existingMoodIdx = db.neighborMoods.findIndex(m => m.userId === currentUser.id);
  const now = new Date().toISOString();

  if (existingMoodIdx !== -1) {
    db.neighborMoods[existingMoodIdx] = {
      userId: currentUser.id,
      vibeEmoji,
      vibeLabel,
      updatedAt: now
    };
  } else {
    db.neighborMoods.push({
      userId: currentUser.id,
      vibeEmoji,
      vibeLabel,
      updatedAt: now
    });
  }

  await saveDB(db);
  return { success: true };
}

export async function getBulletins() {
  const db = await getDB();
  if (!db.neighborBulletins) db.neighborBulletins = [];

  // Enriched with author details
  const enriched = db.neighborBulletins.map(bulletin => {
    const author = db.users.find(u => u.id === bulletin.userId) || {
      username: 'neighbor',
      displayName: 'Cozy Neighbor',
      avatarUrl: null
    };

    return {
      ...bulletin,
      username: author.username,
      displayName: author.displayName,
      avatarUrl: author.avatarUrl
    };
  });

  // Newest first
  return enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createBulletin(content: string, color: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Please sign in to pin a sticky note.' };

  const db = await getDB();
  if (!db.neighborBulletins) db.neighborBulletins = [];

  const newBulletin = {
    id: generateUUID(),
    userId: currentUser.id,
    content,
    color,
    createdAt: new Date().toISOString()
  };

  db.neighborBulletins.push(newBulletin);
  await saveDB(db);

  return { success: true, bulletin: newBulletin };
}

export async function getCozyStrolls() {
  const db = await getDB();
  if (!db.cozyStrolls) db.cozyStrolls = [];

  const enriched = db.cozyStrolls.map(stroll => {
    const author = db.users.find(u => u.id === stroll.userId) || {
      username: 'neighbor',
      displayName: 'Cozy Neighbor',
      avatarUrl: null
    };

    return {
      ...stroll,
      username: author.username,
      displayName: author.displayName,
      avatarUrl: author.avatarUrl
    };
  });

  return enriched.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function createCozyStroll(title: string, time: string, location: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Please log in to schedule a stroll!' };

  const db = await getDB();
  if (!db.cozyStrolls) db.cozyStrolls = [];

  const newStroll = {
    id: generateUUID(),
    userId: currentUser.id,
    title,
    time,
    location,
    attendees: [currentUser.username],
    createdAt: new Date().toISOString()
  };

  db.cozyStrolls.push(newStroll);
  await saveDB(db);

  return { success: true, stroll: newStroll };
}

export async function joinCozyStroll(strollId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Please log in to join!' };

  const db = await getDB();
  if (!db.cozyStrolls) db.cozyStrolls = [];

  const stroll = db.cozyStrolls.find(s => s.id === strollId);
  if (!stroll) return { success: false, error: 'Stroll not found' };

  if (stroll.attendees.includes(currentUser.username)) {
    // Leave stroll
    stroll.attendees = stroll.attendees.filter(u => u !== currentUser.username);
  } else {
    // Join stroll
    stroll.attendees.push(currentUser.username);
  }

  await saveDB(db);
  return { success: true, attendees: stroll.attendees };
}

export async function getSkySnapshots() {
  const db = await getDB();
  if (!db.skySnapshots) db.skySnapshots = [];

  const enriched = db.skySnapshots.map(sky => {
    const author = db.users.find(u => u.id === sky.userId) || {
      username: 'neighbor',
      displayName: 'Cozy Neighbor',
      avatarUrl: null
    };

    return {
      ...sky,
      username: author.username,
      displayName: author.displayName,
      avatarUrl: author.avatarUrl
    };
  });

  return enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createSkySnapshot(imageUrl: string, description: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Please log in to share the sky!' };

  const db = await getDB();
  if (!db.skySnapshots) db.skySnapshots = [];

  const newSky = {
    id: generateUUID(),
    userId: currentUser.id,
    imageUrl,
    description,
    createdAt: new Date().toISOString()
  };

  db.skySnapshots.push(newSky);
  await saveDB(db);

  return { success: true, sky: newSky };
}

export async function getCookieJarTreats() {
  const db = await getDB();
  if (!db.cookieJarTreats) db.cookieJarTreats = [];

  const enriched = db.cookieJarTreats.map(treat => {
    const author = db.users.find(u => u.id === treat.userId) || {
      username: 'neighbor',
      displayName: 'Cozy Neighbor',
      avatarUrl: null
    };

    return {
      ...treat,
      username: author.username,
      displayName: author.displayName,
      avatarUrl: author.avatarUrl
    };
  });

  return enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createCookieJarTreat(title: string, description: string, totalPortions: number) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Please sign in to share a treat!' };

  const db = await getDB();
  if (!db.cookieJarTreats) db.cookieJarTreats = [];

  const newTreat = {
    id: generateUUID(),
    userId: currentUser.id,
    title,
    description,
    totalPortions,
    claimedByUsernames: [],
    createdAt: new Date().toISOString()
  };

  db.cookieJarTreats.push(newTreat);
  await saveDB(db);

  return { success: true, treat: newTreat };
}

export async function claimCookieJarTreat(treatId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Please sign in to stop by!' };

  const db = await getDB();
  if (!db.cookieJarTreats) db.cookieJarTreats = [];

  const treat = db.cookieJarTreats.find(t => t.id === treatId);
  if (!treat) return { success: false, error: 'Treat not found' };

  if (treat.claimedByUsernames.includes(currentUser.username)) {
    return { success: false, error: 'You have already secured a slice of this treat!' };
  }

  if (treat.claimedByUsernames.length >= treat.totalPortions) {
    return { success: false, error: 'Aww, all slices have already been enjoyed!' };
  }

  treat.claimedByUsernames.push(currentUser.username);
  await saveDB(db);

  return { success: true, claimedByUsernames: treat.claimedByUsernames };
}

export async function getWisdomReflections() {
  const db = await getDB();
  if (!db.wisdomReflections) db.wisdomReflections = [];

  const enriched = db.wisdomReflections.map(wisdom => {
    const author = db.users.find(u => u.id === wisdom.userId) || {
      username: 'neighbor',
      displayName: 'Cozy Neighbor',
      avatarUrl: null
    };

    return {
      ...wisdom,
      username: author.username,
      displayName: author.displayName,
      avatarUrl: author.avatarUrl
    };
  });

  return enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createWisdomReflection(prompt: string, text: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Please log in to share wisdom!' };

  const db = await getDB();
  if (!db.wisdomReflections) db.wisdomReflections = [];

  const newWisdom = {
    id: generateUUID(),
    userId: currentUser.id,
    prompt,
    text,
    createdAt: new Date().toISOString()
  };

  db.wisdomReflections.push(newWisdom);
  await saveDB(db);

  return { success: true, wisdom: newWisdom };
}

export async function getHelpingHandPosts() {
  const db = await getDB();
  if (!db.helpingHandPosts) db.helpingHandPosts = [];

  const enriched = db.helpingHandPosts.map(post => {
    const author = db.users.find(u => u.id === post.userId) || {
      username: 'neighbor',
      displayName: 'Cozy Neighbor',
      avatarUrl: null
    };

    return {
      ...post,
      username: author.username,
      displayName: author.displayName,
      avatarUrl: author.avatarUrl
    };
  });

  return enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createHelpingHandPost(title: string, description: string, type: 'need' | 'offer') {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Please log in to post!' };

  const db = await getDB();
  if (!db.helpingHandPosts) db.helpingHandPosts = [];

  const newPost = {
    id: generateUUID(),
    userId: currentUser.id,
    title,
    description,
    type,
    createdAt: new Date().toISOString()
  };

  db.helpingHandPosts.push(newPost);
  await saveDB(db);

  return { success: true, post: newPost };
}

export async function getNeighborhoodSounds() {
  const db = await getDB();
  if (!db.neighborhoodSounds) db.neighborhoodSounds = [];

  const enriched = db.neighborhoodSounds.map(sound => {
    const author = db.users.find(u => u.id === sound.userId) || {
      username: 'neighbor',
      displayName: 'Cozy Neighbor',
      avatarUrl: null
    };

    return {
      ...sound,
      username: author.username,
      displayName: author.displayName,
      avatarUrl: author.avatarUrl
    };
  });

  return enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createNeighborhoodSound(title: string, audioDataUrl: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Please sign in to capture sounds.' };

  const db = await getDB();
  if (!db.neighborhoodSounds) db.neighborhoodSounds = [];

  const newSound = {
    id: generateUUID(),
    userId: currentUser.id,
    title,
    audioDataUrl,
    createdAt: new Date().toISOString()
  };

  db.neighborhoodSounds.push(newSound);
  await saveDB(db);

  return { success: true, sound: newSound };
}

// --- SAFE ROOMS ACTIONS (BATCH 4) ---

export async function getSafeRooms(): Promise<SafeRoom[]> {
  const db = await getDB();
  if (!db.safeRooms) {
    db.safeRooms = [
      {
        id: 'room-1',
        name: 'Pinecone Wood Cabin 🌲',
        creatorId: 'system',
        creatorUsername: 'elena_pixels',
        theme: 'amber',
        soundscape: 'crackle',
        passcode: '1234',
        createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'room-2',
        name: 'Neon Rainfall Lounge 🌧️',
        creatorId: 'system',
        creatorUsername: 'cyber_pulse',
        theme: 'violet',
        soundscape: 'rain',
        passcode: '',
        createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
      },
      {
        id: 'room-3',
        name: 'Zen Courtyard Cafe 🎐',
        creatorId: 'system',
        creatorUsername: 'alex_vivid',
        theme: 'emerald',
        soundscape: 'swallows',
        passcode: '9999',
        createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString()
      },
      {
        id: 'room-4',
        name: 'Morning Lo-Fi Sanctuary ☕',
        creatorId: 'system',
        creatorUsername: 'kinetic_art',
        theme: 'slate',
        soundscape: 'lofi',
        passcode: '',
        createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
      }
    ];
    await saveDB(db);
  }

  return db.safeRooms;
}

export async function createSafeRoom(
  name: string,
  theme: 'slate' | 'violet' | 'amber' | 'emerald' | 'rose',
  soundscape: 'none' | 'rain' | 'crackle' | 'swallows' | 'lofi',
  passcode?: string
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Unauthorized' };

  if (!name.trim()) return { success: false, error: 'Room name is required.' };

  const db = await getDB();
  if (!db.safeRooms) db.safeRooms = [];

  const newRoom: SafeRoom = {
    id: generateUUID(),
    name: name.trim(),
    creatorId: currentUser.id,
    creatorUsername: currentUser.username,
    theme,
    soundscape,
    passcode: passcode?.trim() || undefined,
    createdAt: new Date().toISOString()
  };

  db.safeRooms.push(newRoom);
  await saveDB(db);

  return { success: true, room: newRoom };
}

export async function getSafeRoomMessages(roomId: string): Promise<SafeRoomMessage[]> {
  const db = await getDB();
  if (!db.safeRoomMessages) {
    db.safeRoomMessages = [
      {
        id: 'room-msg-1',
        roomId: 'room-1',
        senderId: 'user-2',
        senderUsername: 'elena_pixels',
        senderDisplayName: 'Elena Rostova',
        senderAvatarUrl: 'https://picsum.photos/seed/elena_avatar/300/300',
        content: 'Welcome to the Pinecone Wood Cabin sanctuary! Grab a warm blanket, listen to the crackling logs, and share what is on your mind. ☕🪵',
        createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
      },
      {
        id: 'room-msg-2',
        roomId: 'room-2',
        senderId: 'user-3',
        senderUsername: 'cyber_pulse',
        senderDisplayName: 'Marcus Chen',
        senderAvatarUrl: 'https://picsum.photos/seed/marcus_avatar/300/300',
        content: 'I love writing code in this neon rain room. It is so soothing. 💻🌧️',
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
      }
    ];
    await saveDB(db);
  }

  // Filter messages for this specific room
  const roomMsgs = db.safeRoomMessages.filter(m => m.roomId === roomId);
  return roomMsgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function sendSafeRoomMessage(
  roomId: string,
  content: string,
  options?: {
    isVolatile?: boolean;
    destructionDelay?: number;
    codeSnippet?: string;
    codeLanguage?: string;
  }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Unauthorized' };

  if (!content.trim() && !options?.codeSnippet) {
    return { success: false, error: 'Message cannot be empty.' };
  }

  const db = await getDB();
  if (!db.safeRoomMessages) db.safeRoomMessages = [];

  const expiresAt = options?.isVolatile && options?.destructionDelay 
    ? new Date(Date.now() + options.destructionDelay * 1000).toISOString()
    : undefined;

  const newMessage: SafeRoomMessage = {
    id: generateUUID(),
    roomId,
    senderId: currentUser.id,
    senderUsername: currentUser.username,
    senderDisplayName: currentUser.displayName,
    senderAvatarUrl: currentUser.avatarUrl,
    content: content.trim(),
    createdAt: new Date().toISOString(),
    isVolatile: options?.isVolatile,
    destructionDelay: options?.destructionDelay,
    expiresAt,
    codeSnippet: options?.codeSnippet,
    codeLanguage: options?.codeLanguage
  };

  db.safeRoomMessages.push(newMessage);
  await saveDB(db);

  return { success: true, message: newMessage };
}

export async function deleteSafeRoomMessage(messageId: string) {
  const db = await getDB();
  if (!db.safeRoomMessages) return { success: false, error: 'No messages found.' };

  const initialLen = db.safeRoomMessages.length;
  db.safeRoomMessages = db.safeRoomMessages.filter(m => m.id !== messageId);

  if (db.safeRoomMessages.length !== initialLen) {
    await saveDB(db);
    return { success: true };
  }
  return { success: false, error: 'Message not found' };
}

// --- BATCH 5: HEARTWARMING EXPRESSIONS & INTERACTION BADGES ACTIONS ---

export async function getReceivedExpressions(userId?: string) {
  const db = await getDB();
  let targetUserId = userId;
  if (!targetUserId) {
    const currentUser = await getCurrentUser();
    if (!currentUser) return [];
    targetUserId = currentUser.id;
  }
  
  if (!db.receivedExpressions) return [];
  return db.receivedExpressions.filter(e => e.receiverId === targetUserId);
}

export async function sendHeartwarmingExpression(receiverId: string, type: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Unauthorized' };

  const db = await getDB();
  if (!db.receivedExpressions) db.receivedExpressions = [];
  if (!db.interactionStreaks) db.interactionStreaks = [];

  const receiver = db.users.find(u => u.id === receiverId);
  if (!receiver) return { success: false, error: 'Recipient not found' };

  // 1. Save new expression gift
  const newExpr = {
    id: `expr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    senderId: currentUser.id,
    senderUsername: currentUser.username,
    receiverId: receiverId,
    receiverUsername: receiver.username,
    type,
    createdAt: new Date().toISOString()
  };
  db.receivedExpressions.push(newExpr);

  // 2. Update interaction streaks
  const u1 = currentUser.id;
  const u2 = receiverId;
  const existingStreak = db.interactionStreaks.find(s => 
    (s.userId1 === u1 && s.userId2 === u2) || (s.userId1 === u2 && s.userId2 === u1)
  );

  if (existingStreak) {
    existingStreak.count = (existingStreak.count || 0) + 1;
    existingStreak.lastInteractedAt = new Date().toISOString();
  } else {
    db.interactionStreaks.push({
      userId1: u1,
      userId2: u2,
      count: 1,
      lastInteractedAt: new Date().toISOString()
    });
  }

  await saveDB(db);
  return { success: true, expression: newExpr };
}

export async function getGratitudeNotes() {
  const db = await getDB();
  return db.gratitudeNotes || [];
}

export async function createGratitudeNote(receiverId: string, text: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Unauthorized' };

  const db = await getDB();
  if (!db.gratitudeNotes) db.gratitudeNotes = [];

  const receiver = db.users.find(u => u.id === receiverId);
  if (!receiver) return { success: false, error: 'Recipient not found' };

  const newNote = {
    id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    senderId: currentUser.id,
    senderUsername: currentUser.username,
    receiverId: receiverId,
    receiverUsername: receiver.username,
    text: text.trim(),
    createdAt: new Date().toISOString()
  };

  db.gratitudeNotes.push(newNote);
  await saveDB(db);

  return { success: true, note: newNote };
}

export async function getUserRoles() {
  const db = await getDB();
  return db.userRoles || [];
}

export async function updateUserRole(role: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Unauthorized' };

  const db = await getDB();
  if (!db.userRoles) db.userRoles = [];

  const existingRole = db.userRoles.find(r => r.userId === currentUser.id);
  if (existingRole) {
    existingRole.role = role;
  } else {
    db.userRoles.push({
      userId: currentUser.id,
      role: role
    });
  }

  await saveDB(db);
  return { success: true, role };
}

export async function getInteractionStreaks() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return [];

  const db = await getDB();
  if (!db.interactionStreaks) return [];

  return db.interactionStreaks.filter(s => 
    s.userId1 === currentUser.id || s.userId2 === currentUser.id
  );
}

// --- BATCH 6: EVERYDAY ORGANIZING & PERSONAL MEMORY LANES ACTIONS ---

export async function getAtticKeepsakes(userId?: string): Promise<AtticKeepsake[]> {
  const db = await getDB();
  if (!db.atticKeepsakes) db.atticKeepsakes = [];
  
  let targetId = userId;
  if (!targetId) {
    const currentUser = await getCurrentUser();
    if (!currentUser) return [];
    targetId = currentUser.id;
  }
  return db.atticKeepsakes.filter(k => k.userId === targetId);
}

export async function addAtticKeepsake(
  title: string,
  imageUrl: string,
  yearOffset: number,
  dateString: string,
  memoryText: string,
  chestId: string
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Unauthorized' };

  const db = await getDB();
  if (!db.atticKeepsakes) db.atticKeepsakes = [];

  const newKeepsake: AtticKeepsake = {
    id: generateUUID(),
    userId: currentUser.id,
    title,
    imageUrl,
    yearOffset,
    dateString,
    memoryText,
    chestId,
    createdAt: new Date().toISOString()
  };

  db.atticKeepsakes.push(newKeepsake);
  await saveDB(db);

  return { success: true, keepsake: newKeepsake };
}

export async function getDailyWins(userId?: string): Promise<DailyWin[]> {
  const db = await getDB();
  if (!db.dailyWins) db.dailyWins = [];

  let targetId = userId;
  if (!targetId) {
    const currentUser = await getCurrentUser();
    if (!currentUser) return [];
    targetId = currentUser.id;
  }
  return db.dailyWins.filter(w => w.userId === targetId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function addDailyWin(category: 'ferns' | 'reading' | 'stretching' | 'baking' | 'brewing' | 'resting', victoryText: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Unauthorized' };

  const db = await getDB();
  if (!db.dailyWins) db.dailyWins = [];

  const newWin: DailyWin = {
    id: generateUUID(),
    userId: currentUser.id,
    category,
    victoryText,
    createdAt: new Date().toISOString()
  };

  db.dailyWins.push(newWin);
  await saveDB(db);

  return { success: true, win: newWin };
}

export async function deleteDailyWin(id: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Unauthorized' };

  const db = await getDB();
  if (!db.dailyWins) return { success: false, error: 'No daily wins found.' };

  db.dailyWins = db.dailyWins.filter(w => w.id !== id);
  await saveDB(db);

  return { success: true };
}

export async function getFamilyMembers(userId?: string): Promise<FamilyMember[]> {
  const db = await getDB();
  if (!db.familyMembers) db.familyMembers = [];

  let targetId = userId;
  if (!targetId) {
    const currentUser = await getCurrentUser();
    if (!currentUser) return [];
    targetId = currentUser.id;
  }
  return db.familyMembers.filter(m => m.userId === targetId);
}

export async function addFamilyMember(name: string, relationship: string, avatarUrl: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Unauthorized' };

  const db = await getDB();
  if (!db.familyMembers) db.familyMembers = [];

  const newMember: FamilyMember = {
    id: generateUUID(),
    userId: currentUser.id,
    name,
    relationship,
    avatarUrl: avatarUrl || 'https://picsum.photos/seed/family/150/150',
    photos: []
  };

  db.familyMembers.push(newMember);
  await saveDB(db);

  return { success: true, member: newMember };
}

export async function addFamilyPhoto(memberId: string, url: string, caption: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Unauthorized' };

  const db = await getDB();
  if (!db.familyMembers) return { success: false, error: 'No members found' };

  const member = db.familyMembers.find(m => m.id === memberId);
  if (!member) return { success: false, error: 'Member not found' };

  member.photos.push({
    id: generateUUID(),
    url,
    caption,
    createdAt: new Date().toISOString()
  });

  await saveDB(db);
  return { success: true, member };
}

export async function getGardenFlowers(userId?: string): Promise<CozyGardenFlower[]> {
  const db = await getDB();
  if (!db.gardenFlowers) db.gardenFlowers = [];

  let targetId = userId;
  if (!targetId) {
    const currentUser = await getCurrentUser();
    if (!currentUser) return [];
    targetId = currentUser.id;
  }
  return db.gardenFlowers.filter(f => f.userId === targetId);
}

export async function addGardenFlowerUpdate(flowerType: 'sunflower' | 'tulip' | 'lavender' | 'rose' | 'daisy', positiveUpdate: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Unauthorized' };

  const db = await getDB();
  if (!db.gardenFlowers) db.gardenFlowers = [];

  const activeFlower = db.gardenFlowers.find(f => f.userId === currentUser.id && f.flowerType === flowerType && f.growthStage < 3);

  if (activeFlower) {
    activeFlower.growthStage += 1;
    activeFlower.positiveUpdate = positiveUpdate;
    await saveDB(db);
    return { success: true, flower: activeFlower, newlyCreated: false };
  } else {
    const newFlower: CozyGardenFlower = {
      id: generateUUID(),
      userId: currentUser.id,
      flowerType,
      growthStage: 1,
      positiveUpdate,
      createdAt: new Date().toISOString()
    };
    db.gardenFlowers.push(newFlower);
    await saveDB(db);
    return { success: true, flower: newFlower, newlyCreated: true };
  }
}

export async function getPatchworkQuilts(userId?: string): Promise<PatchworkQuilt[]> {
  const db = await getDB();
  if (!db.patchworkQuiltMosaics) db.patchworkQuiltMosaics = [];

  let targetId = userId;
  if (!targetId) {
    const currentUser = await getCurrentUser();
    if (!currentUser) return [];
    targetId = currentUser.id;
  }
  return db.patchworkQuiltMosaics.filter(q => q.userId === targetId);
}

export async function generatePatchworkQuilt(title: string, layoutPattern: 'starburst' | 'checkerboard' | 'chevron' | 'spiral', photoUrls: string[]) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Unauthorized' };

  const db = await getDB();
  if (!db.patchworkQuiltMosaics) db.patchworkQuiltMosaics = [];

  const newQuilt: PatchworkQuilt = {
    id: generateUUID(),
    userId: currentUser.id,
    title,
    layoutPattern,
    photoUrls: photoUrls.length > 0 ? photoUrls : [
      'https://picsum.photos/seed/q1/200/200',
      'https://picsum.photos/seed/q2/200/200',
      'https://picsum.photos/seed/q3/200/200',
      'https://picsum.photos/seed/q4/200/200',
      'https://picsum.photos/seed/q5/200/200',
      'https://picsum.photos/seed/q6/200/200',
      'https://picsum.photos/seed/q7/200/200',
      'https://picsum.photos/seed/q8/200/200',
      'https://picsum.photos/seed/q9/200/200',
    ],
    createdAt: new Date().toISOString()
  };

  db.patchworkQuiltMosaics.push(newQuilt);
  await saveDB(db);

  return { success: true, quilt: newQuilt };
}

export async function getPaperChains(userId?: string): Promise<PaperChainCountdown[]> {
  const db = await getDB();
  if (!db.paperChainCountdowns) db.paperChainCountdowns = [];

  let targetId = userId;
  if (!targetId) {
    const currentUser = await getCurrentUser();
    if (!currentUser) return [];
    targetId = currentUser.id;
  }
  return db.paperChainCountdowns.filter(c => c.userId === targetId);
}

export async function createPaperChain(title: string, targetDate: string, imageUrl: string, ringColor: 'pastel-pink' | 'warm-amber' | 'mint-green' | 'cozy-violet') {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Unauthorized' };

  const db = await getDB();
  if (!db.paperChainCountdowns) db.paperChainCountdowns = [];

  const newChain: PaperChainCountdown = {
    id: generateUUID(),
    userId: currentUser.id,
    title,
    targetDate,
    imageUrl: imageUrl || 'https://picsum.photos/seed/countdown/500/300',
    ringColor,
    createdAt: new Date().toISOString()
  };

  db.paperChainCountdowns.push(newChain);
  await saveDB(db);

  return { success: true, chain: newChain };
}

export async function getSoundAlbums(userId?: string): Promise<SoundAlbum[]> {
  const db = await getDB();
  if (!db.soundAlbums) db.soundAlbums = [];

  let targetId = userId;
  if (!targetId) {
    const currentUser = await getCurrentUser();
    if (!currentUser) return [];
    targetId = currentUser.id;
  }
  return db.soundAlbums.filter(a => a.userId === targetId);
}

export async function createSoundAlbum(title: string, slides: { imageUrl: string, description: string, voiceLabel?: string }[]) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Unauthorized' };

  const db = await getDB();
  if (!db.soundAlbums) db.soundAlbums = [];

  const newSoundAlbum: SoundAlbum = {
    id: generateUUID(),
    userId: currentUser.id,
    title,
    slides,
    createdAt: new Date().toISOString()
  };

  db.soundAlbums.push(newSoundAlbum);
  await saveDB(db);

  return { success: true, album: newSoundAlbum };
}

export async function getLeatherDiaryEntries(userId?: string): Promise<LeatherDiaryEntry[]> {
  const db = await getDB();
  if (!db.leatherDiaryEntries) db.leatherDiaryEntries = [];

  let targetId = userId;
  if (!targetId) {
    const currentUser = await getCurrentUser();
    if (!currentUser) return [];
    targetId = currentUser.id;
  }
  
  const currentUser = await getCurrentUser();
  const isSelf = currentUser && currentUser.id === targetId;

  const entries = db.leatherDiaryEntries.filter(e => e.userId === targetId);
  if (isSelf) {
    return entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else {
    return entries.filter(e => !e.isPrivate).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export async function createLeatherDiaryEntry(title: string, content: string, isPrivate: boolean, goldLeafTheme: 'classic-burgundy' | 'emerald-gold' | 'midnight-brass') {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Unauthorized' };

  const db = await getDB();
  if (!db.leatherDiaryEntries) db.leatherDiaryEntries = [];

  const newEntry: LeatherDiaryEntry = {
    id: generateUUID(),
    userId: currentUser.id,
    title,
    content,
    isPrivate,
    goldLeafTheme,
    createdAt: new Date().toISOString()
  };

  db.leatherDiaryEntries.push(newEntry);
  await saveDB(db);

  return { success: true, entry: newEntry };
}

export async function getTimeCapsuleJars(userId?: string): Promise<TimeCapsuleJar[]> {
  const db = await getDB();
  if (!db.timeCapsuleJars) db.timeCapsuleJars = [];

  let targetId = userId;
  if (!targetId) {
    const currentUser = await getCurrentUser();
    if (!currentUser) return [];
    targetId = currentUser.id;
  }
  return db.timeCapsuleJars.filter(j => j.userId === targetId);
}

export async function createTimeCapsuleJar(title: string, unlockDate: string, photoUrls: string[], message: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Unauthorized' };

  const db = await getDB();
  if (!db.timeCapsuleJars) db.timeCapsuleJars = [];

  const newJar: TimeCapsuleJar = {
    id: generateUUID(),
    userId: currentUser.id,
    title,
    unlockDate,
    photoUrls,
    message,
    createdAt: new Date().toISOString()
  };

  db.timeCapsuleJars.push(newJar);
  await saveDB(db);

  return { success: true, jar: newJar };
}

