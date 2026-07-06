'use server';

import { cookies } from 'next/headers';
import { getDB, saveDB, hashPassword, generateUUID, User, Post, PostMedia, Story, PostLike, Comment, Bookmark, Follow, DirectMessage } from './db';

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

export async function createStory(mediaUrl: string, mediaType: 'IMAGE' | 'VIDEO' = 'IMAGE') {
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
  };

  db.stories.push(newStory);
  await saveDB(db);

  return { success: true, story: newStory };
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

export async function sendMessage(receiverId: string, content: string, mediaUrl: string | null = null) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Unauthorized' };

  if (!content.trim() && !mediaUrl) {
    return { success: false, error: 'Message cannot be empty.' };
  }

  const db = await getDB();
  const newMessage: DirectMessage = {
    id: generateUUID(),
    senderId: currentUser.id,
    receiverId,
    content: content.trim(),
    mediaUrl,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  db.directMessages.push(newMessage);
  await saveDB(db);

  return { success: true, message: newMessage };
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
