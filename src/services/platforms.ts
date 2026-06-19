/**
 * Platform OAuth & Publishing Service
 * 
 * Each platform's real integration guide + publish function.
 * Replace the placeholder URLs/scopes with your actual API credentials.
 */

import type { Platform } from '../types';

// ─── OAUTH CONFIG ────────────────────────────────────────────────────────────

export const oauthConfig: Record<string, {
  authUrl: string;
  scopes: string[];
  clientIdEnvVar: string;
  docsUrl: string;
  setupSteps: string[];
}> = {
  facebook: {
    authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
    scopes: ['pages_manage_posts', 'pages_read_engagement', 'instagram_basic', 'instagram_content_publish'],
    clientIdEnvVar: 'VITE_FB_APP_ID',
    docsUrl: 'https://developers.facebook.com/docs/pages-api',
    setupSteps: [
      '1. Go to developers.facebook.com → Create App → Business type',
      '2. Add products: Facebook Login + Pages API',
      '3. Set redirect URI: https://yourdomain.com/auth/callback/facebook',
      '4. Copy App ID → set VITE_FB_APP_ID in .env',
      '5. Submit for review to get pages_manage_posts permission',
    ],
  },
  instagram: {
    authUrl: 'https://api.instagram.com/oauth/authorize',
    scopes: ['instagram_basic', 'instagram_content_publish', 'instagram_manage_insights'],
    clientIdEnvVar: 'VITE_FB_APP_ID', // Instagram uses Facebook App
    docsUrl: 'https://developers.facebook.com/docs/instagram-api',
    setupSteps: [
      '1. Instagram API uses the same Facebook App',
      '2. Add Instagram Graph API product to your Facebook App',
      '3. Connect your Instagram Professional account to a Facebook Page',
      '4. Request instagram_content_publish permission',
      '5. Use the same VITE_FB_APP_ID',
    ],
  },
  youtube: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scopes: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly'],
    clientIdEnvVar: 'VITE_GOOGLE_CLIENT_ID',
    docsUrl: 'https://developers.google.com/youtube/v3/guides/uploading_a_video',
    setupSteps: [
      '1. console.cloud.google.com → Create Project',
      '2. Enable YouTube Data API v3',
      '3. Create OAuth 2.0 credentials (Web Application)',
      '4. Add redirect URI: https://yourdomain.com/auth/callback/youtube',
      '5. Set VITE_GOOGLE_CLIENT_ID in .env',
    ],
  },
  tiktok: {
    authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
    scopes: ['user.info.basic', 'video.publish', 'video.upload'],
    clientIdEnvVar: 'VITE_TIKTOK_CLIENT_KEY',
    docsUrl: 'https://developers.tiktok.com/doc/content-posting-api-get-started',
    setupSteps: [
      '1. developers.tiktok.com → Create App',
      '2. Add product: Content Posting API',
      '3. Set redirect URI: https://yourdomain.com/auth/callback/tiktok',
      '4. Copy Client Key → set VITE_TIKTOK_CLIENT_KEY in .env',
      '5. Submit for review (video.publish requires approval)',
    ],
  },
  telegram: {
    authUrl: '',
    scopes: [],
    clientIdEnvVar: 'VITE_TELEGRAM_BOT_TOKEN',
    docsUrl: 'https://core.telegram.org/bots/api',
    setupSteps: [
      '1. Open Telegram → search @BotFather',
      '2. Send /newbot → follow prompts → get token',
      '3. Add bot as Administrator to your channel',
      '4. Set VITE_TELEGRAM_BOT_TOKEN in .env',
      '5. Get your channel username/ID (e.g. @yourchannel)',
    ],
  },
  linkedin: {
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    scopes: ['r_liteprofile', 'r_emailaddress', 'w_member_social', 'r_organization_social', 'w_organization_social'],
    clientIdEnvVar: 'VITE_LINKEDIN_CLIENT_ID',
    docsUrl: 'https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api',
    setupSteps: [
      '1. developer.linkedin.com → Create App → link to LinkedIn Page',
      '2. Request products: Share on LinkedIn + Marketing Developer Platform',
      '3. Set redirect URI: https://yourdomain.com/auth/callback/linkedin',
      '4. Copy Client ID → set VITE_LINKEDIN_CLIENT_ID in .env',
      '5. Also set VITE_LINKEDIN_CLIENT_SECRET in backend .env',
    ],
  },
  twitter: {
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'media.write', 'offline.access'],
    clientIdEnvVar: 'VITE_TWITTER_CLIENT_ID',
    docsUrl: 'https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets',
    setupSteps: [
      '1. developer.twitter.com → Create Project + App',
      '2. Enable OAuth 2.0 (User Auth settings)',
      '3. Set redirect URI: https://yourdomain.com/auth/callback/twitter',
      '4. Copy Client ID → set VITE_TWITTER_CLIENT_ID in .env',
      '5. Upgrade to Basic plan ($100/mo) for tweet.write access',
    ],
  },
  website: {
    authUrl: '',
    scopes: [],
    clientIdEnvVar: 'VITE_WEBSITE_WEBHOOK_URL',
    docsUrl: 'https://developer.wordpress.org/rest-api/',
    setupSteps: [
      '1. For WordPress: Install Application Passwords plugin',
      '2. Generate password in Users → Profile → Application Passwords',
      '3. Set VITE_WEBSITE_WEBHOOK_URL to your REST API endpoint',
      '4. Or use our webhook: POST https://yoursite.com/wp-json/wp/v2/posts',
      '5. For custom sites: implement POST /api/posts endpoint',
    ],
  },
};

// ─── OAUTH HELPERS ───────────────────────────────────────────────────────────

export function buildOAuthUrl(platform: Platform, redirectUri: string): string {
  const config = oauthConfig[platform];
  if (!config?.authUrl) return '';

  const clientId = import.meta.env[config.clientIdEnvVar] || '';
  const state = btoa(JSON.stringify({ platform, timestamp: Date.now() }));

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state,
  });

  // TikTok uses different param names
  if (platform === 'tiktok') {
    params.set('client_key', clientId);
  }

  return `${config.authUrl}?${params.toString()}`;
}

// ─── PUBLISH FUNCTIONS ───────────────────────────────────────────────────────
// These call your backend API which handles the actual platform API calls
// (tokens must stay server-side for security)

export interface PublishPayload {
  caption: string;
  hashtags: string[];
  mediaUrls: string[];
  contentType: string;
  scheduledAt?: string;
}

export const publishService = {
  async publishToFacebook(pageId: string, payload: PublishPayload) {
    // Via your backend: POST /api/publish/facebook
    return await callBackend('facebook', pageId, payload);
  },

  async publishToInstagram(accountId: string, payload: PublishPayload) {
    return await callBackend('instagram', accountId, payload);
  },

  async publishToTelegram(channelId: string, payload: PublishPayload) {
    return await callBackend('telegram', channelId, payload);
  },

  async publishToLinkedIn(orgId: string, payload: PublishPayload) {
    return await callBackend('linkedin', orgId, payload);
  },

  async publishToTwitter(payload: PublishPayload) {
    return await callBackend('twitter', 'me', payload);
  },

  async publishToYouTube(payload: PublishPayload) {
    return await callBackend('youtube', 'me', payload);
  },

  async publishToTikTok(payload: PublishPayload) {
    return await callBackend('tiktok', 'me', payload);
  },

  /** Publish to all selected platforms in parallel */
  async publishAll(platforms: Platform[], accountIds: Record<string, string>, payload: PublishPayload) {
    const results = await Promise.allSettled(
      platforms.map((platform) => {
        switch (platform) {
          case 'facebook': return this.publishToFacebook(accountIds.facebook || '', payload);
          case 'instagram': return this.publishToInstagram(accountIds.instagram || '', payload);
          case 'telegram': return this.publishToTelegram(accountIds.telegram || '', payload);
          case 'linkedin': return this.publishToLinkedIn(accountIds.linkedin || '', payload);
          case 'twitter': return this.publishToTwitter(payload);
          case 'youtube': return this.publishToYouTube(payload);
          case 'tiktok': return this.publishToTikTok(payload);
          default: return Promise.resolve({ platform, status: 'skipped' });
        }
      })
    );

    return platforms.map((platform, i) => ({
      platform,
      success: results[i].status === 'fulfilled',
      error: results[i].status === 'rejected' ? (results[i] as PromiseRejectedResult).reason?.message : undefined,
    }));
  },
};

async function callBackend(platform: string, accountId: string, payload: PublishPayload) {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
  if (!backendUrl) {
    // In demo mode: simulate success
    await new Promise((r) => setTimeout(r, 500));
    return { platform, postId: 'demo_' + Date.now(), success: true };
  }

  const response = await fetch(`${backendUrl}/api/publish/${platform}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId, ...payload }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Failed to publish to ${platform}`);
  }

  return await response.json();
}
