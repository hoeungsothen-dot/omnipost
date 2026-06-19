import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export const authService = {
  async signUp(email: string, password: string, name: string, businessName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, business_name: businessName } },
    });
    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  async getProfile() {
    const session = await this.getSession();
    if (!session) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    if (error) throw error;
    return data;
  },

  async updateProfile(updates: { name?: string; business_name?: string; avatar_url?: string }) {
    const session = await this.getSession();
    if (!session) throw new Error('Not authenticated');
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', session.user.id);
    if (error) throw error;
  },

  onAuthStateChange(callback: (session: any) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => callback(session));
  },
};

// ─── POSTS ────────────────────────────────────────────────────────────────────

export const postsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('posts')
      .select(`*, post_media(media_id, position, media_files(*)), post_analytics(*)`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async create(post: {
    title: string; caption: string; hashtags: string[];
    content_type: string; platforms: string[]; status: string;
    scheduled_at?: string; media_ids?: string[];
  }) {
    const session = await authService.getSession();
    if (!session) throw new Error('Not authenticated');

    const { media_ids, ...postFields } = post;

    const { data, error } = await supabase
      .from('posts')
      .insert({ ...postFields, user_id: session.user.id })
      .select()
      .single();
    if (error) throw error;

    if (media_ids?.length) {
      const { error: mediaError } = await supabase.from('post_media').insert(
        media_ids.map((media_id, position) => ({ post_id: data.id, media_id, position }))
      );
      if (mediaError) throw mediaError;
    }
    return data;
  },

  async update(id: string, updates: Partial<{ title: string; caption: string; status: string; scheduled_at: string }>) {
    const { error } = await supabase.from('posts').update(updates).eq('id', id);
    if (error) throw error;
  },

  async delete(id: string) {
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) throw error;
  },
};

// ─── MEDIA ────────────────────────────────────────────────────────────────────

export const mediaService = {
  async getAll() {
    const { data, error } = await supabase
      .from('media_files')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async upload(file: File, userId: string) {
    const ext = file.name.split('.').pop();
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    const path = `${userId}/${Date.now()}-${randomSuffix}.${ext}`;

    const { error: uploadError } = await supabase.storage.from('media').upload(path, file);
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);

    const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'document';
    const { data, error } = await supabase.from('media_files').insert({
      user_id: userId,
      name: file.name,
      type,
      url: urlData.publicUrl,
      thumbnail_url: type === 'image' ? urlData.publicUrl : null,
      size: file.size,
      storage_path: path,
      tags: [],
    }).select().single();
    if (error) throw error;
    return data;
  },

  async delete(id: string, storagePath: string) {
    await supabase.storage.from('media').remove([storagePath]);
    const { error } = await supabase.from('media_files').delete().eq('id', id);
    if (error) throw error;
  },
};

// ─── PLATFORM ACCOUNTS ───────────────────────────────────────────────────────

export const platformsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('platform_accounts')
      .select('*')
      .order('platform');
    if (error) throw error;
    return data;
  },

  async upsert(platform: string, details: {
    name?: string; handle?: string; access_token?: string;
    page_id?: string; connected?: boolean; followers?: number;
  }) {
    const session = await authService.getSession();
    if (!session) throw new Error('Not authenticated');
    const { error } = await supabase.from('platform_accounts').upsert({
      user_id: session.user.id,
      platform,
      ...details,
    }, { onConflict: 'user_id,platform' });
    if (error) throw error;
  },

  async disconnect(platform: string) {
    const session = await authService.getSession();
    if (!session) throw new Error('Not authenticated');
    const { error } = await supabase
      .from('platform_accounts')
      .update({ connected: false, access_token: null, refresh_token: null })
      .eq('user_id', session.user.id)
      .eq('platform', platform);
    if (error) throw error;
  },
};

// ─── TEAM ─────────────────────────────────────────────────────────────────────

export const teamService = {
  async getAll() {
    const { data, error } = await supabase
      .from('team_members')
      .select('*, profiles!user_id(name, avatar_url)')
      .order('invited_at');
    if (error) throw error;
    return data;
  },

  async invite(email: string, role: string) {
    const session = await authService.getSession();
    if (!session) throw new Error('Not authenticated');
    const { error } = await supabase.from('team_members').insert({
      workspace_owner_id: session.user.id,
      email,
      role,
    });
    if (error) throw error;
  },

  async updateRole(id: string, role: string) {
    const { error } = await supabase.from('team_members').update({ role }).eq('id', id);
    if (error) throw error;
  },

  async remove(id: string) {
    const { error } = await supabase.from('team_members').delete().eq('id', id);
    if (error) throw error;
  },
};

// ─── ANALYTICS ───────────────────────────────────────────────────────────────

export const analyticsService = {
  async getDashboardStats() {
    const session = await authService.getSession();
    if (!session) throw new Error('Not authenticated');

    const [postsResult, analyticsResult] = await Promise.all([
      supabase.from('posts').select('id, platforms, status, published_at, created_at').eq('user_id', session.user.id),
      supabase.from('post_analytics').select('*').in(
        'post_id',
        (await supabase.from('posts').select('id').eq('user_id', session.user.id)).data?.map((p: any) => p.id) || []
      ),
    ]);

    const posts = postsResult.data || [];
    const analytics = analyticsResult.data || [];

    const totalReach = analytics.reduce((s: number, a: any) => s + (a.reach || 0), 0);
    const totalImpressions = analytics.reduce((s: number, a: any) => s + (a.impressions || 0), 0);
    const avgEngagement = analytics.length
      ? analytics.reduce((s: number, a: any) => s + (a.engagement_rate || 0), 0) / analytics.length
      : 0;

    return {
      totalReach,
      totalImpressions,
      avgEngagementRate: Math.round(avgEngagement * 10) / 10,
      postsPublished: posts.filter((p: any) => p.status === 'published').length,
    };
  },
};
