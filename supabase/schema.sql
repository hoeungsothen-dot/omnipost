-- OmniPost Supabase Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS / PROFILES ────────────────────────────────────────────────
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  business_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro','enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PLATFORM ACCOUNTS ───────────────────────────────────────────────
CREATE TABLE platform_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('facebook','instagram','youtube','tiktok','telegram','linkedin','twitter','website')),
  name TEXT NOT NULL DEFAULT '',
  handle TEXT NOT NULL DEFAULT '',
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  page_id TEXT,
  connected BOOLEAN DEFAULT FALSE,
  followers INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- ─── MEDIA FILES ─────────────────────────────────────────────────────
CREATE TABLE media_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image','video','document')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  size INTEGER NOT NULL DEFAULT 0,
  storage_path TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── POSTS ───────────────────────────────────────────────────────────
CREATE TABLE posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '',
  hashtags TEXT[] DEFAULT '{}',
  content_type TEXT NOT NULL DEFAULT 'image' CHECK (content_type IN ('image','video','carousel','text','story','reel')),
  platforms TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','published','failed')),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post <-> Media join table
CREATE TABLE post_media (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  media_id UUID REFERENCES media_files(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  PRIMARY KEY (post_id, media_id)
);

-- ─── POST ANALYTICS ──────────────────────────────────────────────────
CREATE TABLE post_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  engagement_rate NUMERIC(5,2) DEFAULT 0,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, platform)
);

-- ─── TEAM MEMBERS ────────────────────────────────────────────────────
CREATE TABLE team_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin','editor','viewer')),
  invite_status TEXT NOT NULL DEFAULT 'pending' CHECK (invite_status IN ('pending','accepted','declined')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  UNIQUE(workspace_owner_id, email)
);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only see/edit their own
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Platform accounts: own only
CREATE POLICY "Users manage own platform accounts" ON platform_accounts
  FOR ALL USING (auth.uid() = user_id);

-- Media files: own only
CREATE POLICY "Users manage own media" ON media_files
  FOR ALL USING (auth.uid() = user_id);

-- Posts: own only
CREATE POLICY "Users manage own posts" ON posts
  FOR ALL USING (auth.uid() = user_id);

-- Post media: via post ownership
CREATE POLICY "Users manage own post media" ON post_media
  FOR ALL USING (
    EXISTS (SELECT 1 FROM posts WHERE posts.id = post_media.post_id AND posts.user_id = auth.uid())
  );

-- Post analytics: own posts only
CREATE POLICY "Users view own post analytics" ON post_analytics
  FOR ALL USING (
    EXISTS (SELECT 1 FROM posts WHERE posts.id = post_analytics.post_id AND posts.user_id = auth.uid())
  );

-- Team members: workspace owner or member
CREATE POLICY "Team members visibility" ON team_members
  FOR SELECT USING (auth.uid() = workspace_owner_id OR auth.uid() = user_id);
CREATE POLICY "Workspace owner manages team" ON team_members
  FOR ALL USING (auth.uid() = workspace_owner_id);

-- ─── STORAGE BUCKETS ─────────────────────────────────────────────────
-- Run these in Supabase Storage settings or via API:
-- CREATE BUCKET: 'media' (public: true, file size limit: 100MB)
-- Allowed mime types: image/*, video/*

-- ─── FUNCTIONS ───────────────────────────────────────────────────────
-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, business_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER platform_accounts_updated_at BEFORE UPDATE ON platform_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
