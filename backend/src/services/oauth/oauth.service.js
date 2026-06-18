const axios = require('axios');
const { Workspace } = require('../../models/User.model');
const logger = require('../../utils/logger');

/**
 * Centralised OAuth helper.
 * Each platform has: getAuthUrl(), exchangeCode(), refreshToken()
 */

// ─── Facebook / Instagram ─────────────────────────────────────────────────
const facebook = {
  getAuthUrl(workspaceId, scope = ['pages_manage_posts', 'pages_read_engagement', 'instagram_basic', 'instagram_content_publish']) {
    const params = new URLSearchParams({
      client_id: process.env.FACEBOOK_APP_ID,
      redirect_uri: `${process.env.BACKEND_URL}/api/oauth/facebook/callback`,
      scope: scope.join(','),
      state: workspaceId,
      response_type: 'code',
    });
    return `https://www.facebook.com/v18.0/dialog/oauth?${params}`;
  },

  async exchangeCode(code, workspaceId) {
    // Exchange short-lived code for long-lived token
    const tokenRes = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: `${process.env.BACKEND_URL}/api/oauth/facebook/callback`,
        code,
      },
    });
    const shortToken = tokenRes.data.access_token;

    // Exchange for long-lived token (60 days)
    const longRes = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        fb_exchange_token: shortToken,
      },
    });
    const longToken = longRes.data.access_token;

    // Get user pages
    const pagesRes = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
      params: { access_token: longToken, fields: 'id,name,picture,access_token' },
    });
    const pages = pagesRes.data.data;

    // Get Instagram business accounts linked to pages
    const igAccounts = [];
    for (const page of pages) {
      try {
        const igRes = await axios.get(`https://graph.facebook.com/v18.0/${page.id}`, {
          params: { fields: 'instagram_business_account{id,name,profile_picture_url}', access_token: page.access_token },
        });
        if (igRes.data.instagram_business_account) {
          igAccounts.push({ page, igAccount: igRes.data.instagram_business_account });
        }
      } catch { /* page has no IG */ }
    }

    return { longToken, pages, igAccounts };
  },

  async refreshToken(currentToken) {
    // Facebook long-lived tokens auto-refresh if used within 60 days
    const res = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        fb_exchange_token: currentToken,
      },
    });
    return res.data.access_token;
  },
};

// ─── Google / YouTube ─────────────────────────────────────────────────────
const google = {
  getAuthUrl(workspaceId) {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: `${process.env.BACKEND_URL}/api/oauth/google/callback`,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly',
      access_type: 'offline',
      prompt: 'consent',
      state: workspaceId,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  },

  async exchangeCode(code) {
    const res = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${process.env.BACKEND_URL}/api/oauth/google/callback`,
      grant_type: 'authorization_code',
    });
    const { access_token, refresh_token, expires_in } = res.data;

    // Get channel info
    const channelRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: { part: 'snippet', mine: true },
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const channel = channelRes.data.items?.[0];

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: new Date(Date.now() + expires_in * 1000),
      channelId: channel?.id,
      channelName: channel?.snippet?.title,
      channelAvatar: channel?.snippet?.thumbnails?.default?.url,
    };
  },

  async refreshToken(refreshToken) {
    const res = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });
    return {
      accessToken: res.data.access_token,
      expiresAt: new Date(Date.now() + res.data.expires_in * 1000),
    };
  },
};

// ─── TikTok ───────────────────────────────────────────────────────────────
const tiktok = {
  getAuthUrl(workspaceId) {
    const params = new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY,
      redirect_uri: `${process.env.BACKEND_URL}/api/oauth/tiktok/callback`,
      response_type: 'code',
      scope: 'user.info.basic,video.publish,video.upload',
      state: workspaceId,
    });
    return `https://www.tiktok.com/v2/auth/authorize/?${params}`;
  },

  async exchangeCode(code) {
    const res = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', {
      client_key: process.env.TIKTOK_CLIENT_KEY,
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.BACKEND_URL}/api/oauth/tiktok/callback`,
    });
    const { access_token, refresh_token, expires_in, open_id } = res.data.data;

    // Get user info
    const userRes = await axios.get('https://open.tiktokapis.com/v2/user/info/', {
      params: { fields: 'display_name,avatar_url' },
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const user = userRes.data.data?.user;

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: new Date(Date.now() + expires_in * 1000),
      accountId: open_id,
      accountName: user?.display_name,
      accountAvatar: user?.avatar_url,
    };
  },

  async refreshToken(refreshToken) {
    const res = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', {
      client_key: process.env.TIKTOK_CLIENT_KEY,
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });
    return {
      accessToken: res.data.data.access_token,
      refreshToken: res.data.data.refresh_token,
      expiresAt: new Date(Date.now() + res.data.data.expires_in * 1000),
    };
  },
};

// ─── LinkedIn ─────────────────────────────────────────────────────────────
const linkedin = {
  getAuthUrl(workspaceId) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.LINKEDIN_CLIENT_ID,
      redirect_uri: `${process.env.BACKEND_URL}/api/oauth/linkedin/callback`,
      scope: 'w_member_social r_organization_social w_organization_social',
      state: workspaceId,
    });
    return `https://www.linkedin.com/oauth/v2/authorization?${params}`;
  },

  async exchangeCode(code) {
    const res = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${process.env.BACKEND_URL}/api/oauth/linkedin/callback`,
      client_id: process.env.LINKEDIN_CLIENT_ID,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET,
    }));
    const { access_token, expires_in } = res.data;

    // Get organisation list
    const orgRes = await axios.get('https://api.linkedin.com/v2/organizationAcls?q=roleAssignee', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const orgs = orgRes.data.elements || [];

    return {
      accessToken: access_token,
      expiresAt: new Date(Date.now() + expires_in * 1000),
      organizations: orgs,
    };
  },
};

// ─── Token auto-refresh middleware ────────────────────────────────────────
async function ensureFreshToken(workspace, platformId) {
  const conn = workspace.platforms.find(p => p.platform === platformId);
  if (!conn || !conn.connected) return null;

  const isExpiring = conn.tokenExpiresAt && conn.tokenExpiresAt < new Date(Date.now() + 5 * 60 * 1000);
  if (!isExpiring) return conn;

  logger.info(`Refreshing token for ${platformId}`);
  try {
    let updated;
    if (platformId === 'youtube') updated = await google.refreshToken(conn.refreshToken);
    else if (platformId === 'tiktok') updated = await tiktok.refreshToken(conn.refreshToken);
    else if (platformId === 'facebook' || platformId === 'instagram') {
      updated = { accessToken: await facebook.refreshToken(conn.accessToken) };
    }

    if (updated) {
      Object.assign(conn, updated);
      await workspace.save();
    }
  } catch (err) {
    logger.error(`Token refresh failed for ${platformId}:`, err.message);
  }
  return conn;
}

module.exports = { facebook, google, tiktok, linkedin, ensureFreshToken };
