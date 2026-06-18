const express = require('express');
const router = express.Router();
const { facebook, google, tiktok, linkedin } = require('../services/oauth/oauth.service');
const { Workspace } = require('../models/User.model');
const logger = require('../utils/logger');

const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:5173';

// ─── Redirect helpers ─────────────────────────────────────────────────────
function redirectSuccess(res, platform) {
  return res.redirect(`${FRONTEND}/platforms?connected=${platform}`);
}
function redirectError(res, platform, msg) {
  logger.error(`OAuth error [${platform}]:`, msg);
  return res.redirect(`${FRONTEND}/platforms?error=${encodeURIComponent(msg)}`);
}

// ─── Initiate OAuth flows ─────────────────────────────────────────────────
router.get('/facebook', (req, res) => {
  const { workspaceId } = req.query;
  res.redirect(facebook.getAuthUrl(workspaceId));
});

router.get('/google', (req, res) => {
  const { workspaceId } = req.query;
  res.redirect(google.getAuthUrl(workspaceId));
});

router.get('/tiktok', (req, res) => {
  const { workspaceId } = req.query;
  res.redirect(tiktok.getAuthUrl(workspaceId));
});

router.get('/linkedin', (req, res) => {
  const { workspaceId } = req.query;
  res.redirect(linkedin.getAuthUrl(workspaceId));
});

// ─── Callbacks ────────────────────────────────────────────────────────────
router.get('/facebook/callback', async (req, res) => {
  const { code, state: workspaceId, error } = req.query;
  if (error) return redirectError(res, 'facebook', error);
  try {
    const { longToken, pages, igAccounts } = await facebook.exchangeCode(code, workspaceId);
    const ws = await Workspace.findById(workspaceId);
    if (!ws) return redirectError(res, 'facebook', 'Workspace not found');

    // Connect first page as Facebook
    if (pages.length) {
      const page = pages[0];
      upsertPlatform(ws, 'facebook', {
        accessToken: page.access_token || longToken,
        accountId: page.id,
        accountName: page.name,
        accountAvatar: page.picture?.data?.url,
        pageId: page.id,
      });
    }

    // Connect Instagram if available
    if (igAccounts.length) {
      const { page, igAccount } = igAccounts[0];
      upsertPlatform(ws, 'instagram', {
        accessToken: page.access_token || longToken,
        accountId: igAccount.id,
        accountName: igAccount.name,
        accountAvatar: igAccount.profile_picture_url,
      });
    }

    await ws.save();
    redirectSuccess(res, igAccounts.length ? 'facebook,instagram' : 'facebook');
  } catch (err) {
    redirectError(res, 'facebook', err.message);
  }
});

router.get('/google/callback', async (req, res) => {
  const { code, state: workspaceId, error } = req.query;
  if (error) return redirectError(res, 'youtube', error);
  try {
    const data = await google.exchangeCode(code);
    const ws = await Workspace.findById(workspaceId);
    if (!ws) return redirectError(res, 'youtube', 'Workspace not found');
    upsertPlatform(ws, 'youtube', {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      tokenExpiresAt: data.expiresAt,
      accountId: data.channelId,
      accountName: data.channelName,
      accountAvatar: data.channelAvatar,
      channelId: data.channelId,
    });
    await ws.save();
    redirectSuccess(res, 'youtube');
  } catch (err) {
    redirectError(res, 'youtube', err.message);
  }
});

router.get('/tiktok/callback', async (req, res) => {
  const { code, state: workspaceId, error } = req.query;
  if (error) return redirectError(res, 'tiktok', error);
  try {
    const data = await tiktok.exchangeCode(code);
    const ws = await Workspace.findById(workspaceId);
    if (!ws) return redirectError(res, 'tiktok', 'Workspace not found');
    upsertPlatform(ws, 'tiktok', {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      tokenExpiresAt: data.expiresAt,
      accountId: data.accountId,
      accountName: data.accountName,
      accountAvatar: data.accountAvatar,
    });
    await ws.save();
    redirectSuccess(res, 'tiktok');
  } catch (err) {
    redirectError(res, 'tiktok', err.message);
  }
});

router.get('/linkedin/callback', async (req, res) => {
  const { code, state: workspaceId, error } = req.query;
  if (error) return redirectError(res, 'linkedin', error);
  try {
    const data = await linkedin.exchangeCode(code);
    const ws = await Workspace.findById(workspaceId);
    if (!ws) return redirectError(res, 'linkedin', 'Workspace not found');
    upsertPlatform(ws, 'linkedin', {
      accessToken: data.accessToken,
      tokenExpiresAt: data.expiresAt,
      accountId: data.organizations?.[0]?.organization?.split(':').pop(),
      accountName: 'LinkedIn Page',
    });
    await ws.save();
    redirectSuccess(res, 'linkedin');
  } catch (err) {
    redirectError(res, 'linkedin', err.message);
  }
});

// ─── Manual connect (Telegram, Website) ──────────────────────────────────
router.post('/telegram', async (req, res, next) => {
  try {
    const { workspaceId, botToken, channelId } = req.body;
    // Verify bot token works
    const axios = require('axios');
    const test = await axios.get(`https://api.telegram.org/bot${botToken}/getMe`);
    if (!test.data.ok) throw new Error('Invalid bot token');

    const ws = await Workspace.findById(workspaceId);
    upsertPlatform(ws, 'telegram', {
      accessToken: botToken,
      channelId,
      accountName: `@${channelId.replace('@', '')}`,
    });
    await ws.save();
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.post('/website', async (req, res, next) => {
  try {
    const { workspaceId, siteUrl, appPassword, username } = req.body;
    const axios = require('axios');
    // Verify WordPress REST API
    const test = await axios.get(`${siteUrl}/wp-json/wp/v2/posts?per_page=1`, {
      auth: { username, password: appPassword },
    });
    const ws = await Workspace.findById(workspaceId);
    const token = Buffer.from(`${username}:${appPassword}`).toString('base64');
    upsertPlatform(ws, 'website', {
      accessToken: `Basic ${token}`,
      accountName: siteUrl,
      metadata: new Map([['siteUrl', siteUrl]]),
    });
    await ws.save();
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ─── Helper ───────────────────────────────────────────────────────────────
function upsertPlatform(workspace, platform, data) {
  const idx = workspace.platforms.findIndex(p => p.platform === platform);
  const entry = { platform, connected: true, ...data };
  if (idx >= 0) Object.assign(workspace.platforms[idx], entry);
  else workspace.platforms.push(entry);
}

module.exports = router;
