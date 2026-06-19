import { create } from 'zustand';
import type { Post, MediaFile, PlatformAccount, TeamMember, User, DashboardStats, Platform, ContentType, PostStatus } from '../types';
import { postsService, mediaService, platformsService, teamService, authService, supabase } from '../services/supabase';
import { mockPosts, mockMediaFiles, mockPlatformAccounts, mockTeamMembers, mockDashboardStats } from '../services/mockData';

const isSupabaseConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL);

// ─── DB row → App type converters ──────────────────────────────────────────

function mapPostRow(row: any): Post {
  return {
    id: row.id,
    title: row.title,
    caption: row.caption,
    hashtags: row.hashtags || [],
    contentType: row.content_type as ContentType,
    media: (row.post_media || []).map((pm: any) => pm.media_files).filter(Boolean),
    platforms: (row.platforms || []) as Platform[],
    status: row.status as PostStatus,
    scheduledAt: row.scheduled_at || undefined,
    publishedAt: row.published_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    analytics: row.post_analytics?.length ? aggregateAnalytics(row.post_analytics) : undefined,
  };
}

function aggregateAnalytics(rows: any[]) {
  const totals = rows.reduce((acc, r) => ({
    reach: acc.reach + (r.reach || 0),
    impressions: acc.impressions + (r.impressions || 0),
    likes: acc.likes + (r.likes || 0),
    comments: acc.comments + (r.comments || 0),
    shares: acc.shares + (r.shares || 0),
    clicks: acc.clicks + (r.clicks || 0),
  }), { reach: 0, impressions: 0, likes: 0, comments: 0, shares: 0, clicks: 0 });
  const avgEngagement = rows.length
    ? rows.reduce((s, r) => s + Number(r.engagement_rate || 0), 0) / rows.length
    : 0;
  return { ...totals, engagementRate: Math.round(avgEngagement * 10) / 10, byPlatform: {} as any };
}

function mapMediaRow(row: any): MediaFile {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    url: row.url,
    thumbnailUrl: row.thumbnail_url || undefined,
    size: row.size,
    uploadedAt: row.created_at?.split('T')[0] || '',
    tags: row.tags || [],
  };
}

function mapPlatformRow(row: any): PlatformAccount {
  return {
    id: row.id,
    platform: row.platform,
    name: row.name,
    handle: row.handle,
    connected: row.connected,
    followers: row.followers || 0,
    accessToken: row.access_token || undefined,
  };
}

function mapTeamRow(row: any): TeamMember {
  return {
    id: row.id,
    name: row.profiles?.name || row.email.split('@')[0],
    email: row.email,
    role: row.role,
    joinedAt: (row.joined_at || row.invited_at)?.split('T')[0] || '',
  };
}

const emptyDashboardStats: DashboardStats = {
  totalReach: 0,
  totalImpressions: 0,
  avgEngagementRate: 0,
  postsPublished: 0,
  reachChange: 0,
  impressionsChange: 0,
  engagementChange: 0,
  dailyReach: [],
  reachByPlatform: [],
};

const emptyUser: User = { id: '', name: '', email: '', businessName: '', plan: 'free' };

interface AppStore {
  user: User;
  posts: Post[];
  mediaFiles: MediaFile[];
  platformAccounts: PlatformAccount[];
  teamMembers: TeamMember[];
  dashboardStats: DashboardStats;
  loading: boolean;
  isDemoMode: boolean;

  activeView: string;
  setActiveView: (view: string) => void;

  loadAll: () => Promise<void>;
  setUser: (user: User) => void;

  addPost: (post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePost: (id: string, updates: Partial<Post>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;

  addMediaFile: (file: File) => Promise<void>;
  deleteMediaFile: (id: string) => Promise<void>;

  togglePlatformConnection: (id: string) => Promise<void>;

  addTeamMember: (email: string, role: TeamMember['role']) => Promise<void>;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => Promise<void>;
  removeTeamMember: (id: string) => Promise<void>;
}

export const useAppStore = create<AppStore>((set, get) => ({
  user: isSupabaseConfigured ? emptyUser : { id: '1', name: 'Demo User', email: 'demo@example.com', businessName: 'Demo Business', plan: 'pro' },
  posts: isSupabaseConfigured ? [] : mockPosts,
  mediaFiles: isSupabaseConfigured ? [] : mockMediaFiles,
  platformAccounts: isSupabaseConfigured ? [] : mockPlatformAccounts,
  teamMembers: isSupabaseConfigured ? [] : mockTeamMembers,
  dashboardStats: isSupabaseConfigured ? emptyDashboardStats : mockDashboardStats,
  loading: false,
  isDemoMode: !isSupabaseConfigured,

  activeView: 'dashboard',
  setActiveView: (view) => set({ activeView: view }),

  setUser: (user) => set({ user }),

  loadAll: async () => {
    if (!isSupabaseConfigured) return; // stay on mock data
    set({ loading: true });
    try {
      const [postsRows, mediaRows, platformRows, teamRows] = await Promise.all([
        postsService.getAll().catch(() => []),
        mediaService.getAll().catch(() => []),
        platformsService.getAll().catch(() => []),
        teamService.getAll().catch(() => []),
      ]);

      const posts = (postsRows || []).map(mapPostRow);
      const mediaFiles = (mediaRows || []).map(mapMediaRow);
      const platformAccounts = (platformRows || []).map(mapPlatformRow);
      const teamMembers = (teamRows || []).map(mapTeamRow);

      const publishedPosts = posts.filter((p) => p.status === 'published');
      const totalReach = posts.reduce((s, p) => s + (p.analytics?.reach || 0), 0);
      const totalImpressions = posts.reduce((s, p) => s + (p.analytics?.impressions || 0), 0);
      const avgEngagement = publishedPosts.length
        ? publishedPosts.reduce((s, p) => s + (p.analytics?.engagementRate || 0), 0) / publishedPosts.length
        : 0;

      const reachByPlatformMap: Record<string, number> = {};
      posts.forEach((p) => {
        p.platforms.forEach((plat) => {
          reachByPlatformMap[plat] = (reachByPlatformMap[plat] || 0) + (p.analytics?.reach || 0);
        });
      });

      set({
        posts,
        mediaFiles,
        platformAccounts,
        teamMembers,
        dashboardStats: {
          totalReach,
          totalImpressions,
          avgEngagementRate: Math.round(avgEngagement * 10) / 10,
          postsPublished: publishedPosts.length,
          reachChange: 0,
          impressionsChange: 0,
          engagementChange: 0,
          dailyReach: [],
          reachByPlatform: Object.entries(reachByPlatformMap).map(([platform, reach]) => ({ platform: platform as Platform, reach })),
        },
        loading: false,
      });
    } catch (e) {
      console.error('Failed to load data:', e);
      set({ loading: false });
    }
  },

  addPost: async (post) => {
    if (!isSupabaseConfigured) {
      const newPost: Post = { ...post, id: Math.random().toString(36).slice(2), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      set((s) => ({ posts: [newPost, ...s.posts] }));
      return;
    }
    await postsService.create({
      title: post.title,
      caption: post.caption,
      hashtags: post.hashtags,
      content_type: post.contentType,
      platforms: post.platforms,
      status: post.status,
      scheduled_at: post.scheduledAt,
    });
    await get().loadAll();
  },

  updatePost: async (id, updates) => {
    if (!isSupabaseConfigured) {
      set((s) => ({ posts: s.posts.map((p) => p.id === id ? { ...p, ...updates } : p) }));
      return;
    }
    await postsService.update(id, {
      title: updates.title,
      caption: updates.caption,
      status: updates.status,
      scheduled_at: updates.scheduledAt,
    });
    await get().loadAll();
  },

  deletePost: async (id) => {
    if (!isSupabaseConfigured) {
      set((s) => ({ posts: s.posts.filter((p) => p.id !== id) }));
      return;
    }
    await postsService.delete(id);
    set((s) => ({ posts: s.posts.filter((p) => p.id !== id) }));
  },

  addMediaFile: async (file) => {
    if (!isSupabaseConfigured) {
      const url = URL.createObjectURL(file);
      const newFile: MediaFile = {
        id: Math.random().toString(36).slice(2),
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'document',
        url,
        thumbnailUrl: file.type.startsWith('image/') ? url : undefined,
        size: file.size,
        uploadedAt: new Date().toISOString().split('T')[0],
        tags: [],
      };
      set((s) => ({ mediaFiles: [newFile, ...s.mediaFiles] }));
      return;
    }
    const session = await authService.getSession();
    if (!session) throw new Error('Not authenticated');
    const row = await mediaService.upload(file, session.user.id);
    set((s) => ({ mediaFiles: [mapMediaRow(row), ...s.mediaFiles] }));
  },

  deleteMediaFile: async (id) => {
    if (!isSupabaseConfigured) {
      set((s) => ({ mediaFiles: s.mediaFiles.filter((f) => f.id !== id) }));
      return;
    }
    const file = get().mediaFiles.find((f) => f.id === id);
    if (!file) return;
    // storage_path isn't on the mapped type, so refetch row for it
    const { data } = await supabase.from('media_files').select('storage_path').eq('id', id).single();
    await mediaService.delete(id, data?.storage_path || '');
    set((s) => ({ mediaFiles: s.mediaFiles.filter((f) => f.id !== id) }));
  },

  togglePlatformConnection: async (id) => {
    if (!isSupabaseConfigured) {
      set((s) => ({ platformAccounts: s.platformAccounts.map((p) => p.id === id ? { ...p, connected: !p.connected } : p) }));
      return;
    }
    const account = get().platformAccounts.find((p) => p.id === id);
    if (!account) return;
    if (account.connected) {
      await platformsService.disconnect(account.platform);
    } else {
      await platformsService.upsert(account.platform, { connected: true });
    }
    await get().loadAll();
  },

  addTeamMember: async (email, role) => {
    if (!isSupabaseConfigured) {
      const newMember: TeamMember = { id: Math.random().toString(36).slice(2), name: email.split('@')[0], email, role, joinedAt: new Date().toISOString().split('T')[0] };
      set((s) => ({ teamMembers: [...s.teamMembers, newMember] }));
      return;
    }
    await teamService.invite(email, role);
    await get().loadAll();
  },

  updateTeamMember: async (id, updates) => {
    if (!isSupabaseConfigured) {
      set((s) => ({ teamMembers: s.teamMembers.map((m) => m.id === id ? { ...m, ...updates } : m) }));
      return;
    }
    if (updates.role) await teamService.updateRole(id, updates.role);
    await get().loadAll();
  },

  removeTeamMember: async (id) => {
    if (!isSupabaseConfigured) {
      set((s) => ({ teamMembers: s.teamMembers.filter((m) => m.id !== id) }));
      return;
    }
    await teamService.remove(id);
    set((s) => ({ teamMembers: s.teamMembers.filter((m) => m.id !== id) }));
  },
}));
