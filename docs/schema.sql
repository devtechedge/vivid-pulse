-- Intended production schema for VividPulse.
-- The public demo does not connect to Postgres; it uses process memory
-- seeded in lib/db.ts. Keep this file as the local production path.

CREATE TABLE IF NOT EXISTS vp_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  bio VARCHAR(150),
  avatar_url VARCHAR(1000),
  website VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vp_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES vp_users(id) ON DELETE CASCADE,
  caption TEXT,
  location VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vp_post_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES vp_posts(id) ON DELETE CASCADE,
  url VARCHAR(1000) NOT NULL,
  type VARCHAR(50) NOT NULL,
  order_index INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS vp_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES vp_users(id) ON DELETE CASCADE,
  media_url VARCHAR(1000) NOT NULL,
  media_type VARCHAR(50) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vp_post_likes (
  user_id UUID REFERENCES vp_users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES vp_posts(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, post_id)
);

CREATE TABLE IF NOT EXISTS vp_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES vp_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES vp_users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vp_bookmarks (
  user_id UUID REFERENCES vp_users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES vp_posts(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, post_id)
);

CREATE TABLE IF NOT EXISTS vp_follows (
  follower_id UUID REFERENCES vp_users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES vp_users(id) ON DELETE CASCADE,
  PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS vp_direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES vp_users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES vp_users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url VARCHAR(1000),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
