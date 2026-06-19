export type Platform =
  | 'facebook'
  | 'instagram'
  | 'youtube'
  | 'tiktok'
  | 'telegram'
  | 'linkedin'
  | 'twitter'
  | 'website';

export interface PlatformAccount {
  id: string;
  platform: Platform;
  name: string;
  handle: string;
  avatar?: string;
  connected: boolean;
  followers?: number;
  accessToken?: string;
}

export type ContentType = 'image' | 'video' | 'carousel' | 'text' | 'story' | 'reel';
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';

export interface MediaFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document';
  url: string;
  thumbnailUrl?: string;
  size: number;
  uploadedAt: string;
  tags: string[];
}

export interface Post {
  id: string;
  title: string;
  caption: string;
  hashtags: string[];
  contentType: ContentType;
  media: MediaFile[];
  platforms: Platform[];
  status: PostStatus;
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  analytics?: PostAnalytics;
}

export interface PostAnalytics {
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  engagementRate: number;
  byPlatform: Record<Platform, PlatformAnalytics>;
}

export interface PlatformAnalytics {
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
}

export interface DashboardStats {
  totalReach: number;
  totalImpressions: number;
  avgEngagementRate: number;
  postsPublished: number;
  reachChange: number;
  impressionsChange: number;
  engagementChange: number;
  dailyReach: { date: string; reach: number }[];
  reachByPlatform: { platform: Platform; reach: number }[];
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  avatar?: string;
  joinedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  businessName: string;
  plan: 'free' | 'pro' | 'enterprise';
}

export interface CalendarEvent {
  id: string;
  postId: string;
  title: string;
  platforms: Platform[];
  scheduledAt: string;
  status: PostStatus;
}

export interface AICaption {
  platform: Platform;
  caption: string;
  hashtags: string[];
  tone: string;
}
