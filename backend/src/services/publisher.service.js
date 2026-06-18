const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Base publisher interface. Each platform extends this.
 */
class BasePlatformPublisher {
  constructor(connection) {
    this.connection = connection;
    this.platform = connection.platform;
  }
  async publish(_content) { throw new Error('publish() not implemented'); }
  async refreshToken() { throw new Error('refreshToken() not implemented'); }
  async getAnalytics(_postId, _dateRange) { throw new Error('getAnalytics() not implemented'); }
}

// ─── Facebook / Instagram (Meta Graph API) ─────────────────────────────────
class FacebookPublisher extends BasePlatformPublisher {
  async publish(content) {
    const { accessToken, pageId } = this.connection;
    const caption = content.captions.get('facebook') || content.captions.get('default') || '';
    try {
      let response;
      if (content.media && content.media.length > 0) {
        const media = content.media[0];
        if (media.type === 'video') {
          // Upload video to Facebook
          response = await axios.post(
            `https://graph.facebook.com/v18.0/${pageId}/videos`,
            { file_url: media.url, description: caption, access_token: accessToken }
          );
        } else {
          // Upload photo
          response = await axios.post(
            `https://graph.facebook.com/v18.0/${pageId}/photos`,
            { url: media.url, caption, access_token: accessToken }
          );
        }
      } else {
        // Text-only post
        response = await axios.post(
          `https://graph.facebook.com/v18.0/${pageId}/feed`,
          { message: caption, access_token: accessToken }
        );
      }
      return {
        platform: 'facebook',
        status: 'published',
        platformPostId: response.data.id,
        platformUrl: `https://facebook.com/${pageId}/posts/${response.data.id}`,
        publishedAt: new Date(),
      };
    } catch (err) {
      logger.error('Facebook publish error:', err.response?.data || err.message);
      throw new Error(err.response?.data?.error?.message || err.message);
    }
  }

  async getAnalytics(postId) {
    const { accessToken } = this.connection;
    const fields = 'impressions,reach,engaged_users,likes.summary(true),comments.summary(true),shares';
    const res = await axios.get(
      `https://graph.facebook.com/v18.0/${postId}/insights?metric=${fields}&access_token=${accessToken}`
    );
    return this._normalizeMetrics(res.data.data);
  }

  _normalizeMetrics(data) {
    const m = {};
    data.forEach(item => { m[item.name] = item.values?.[0]?.value || 0; });
    return {
      impressions: m.impressions || 0,
      reach: m.reach || 0,
      engagement: m.engaged_users || 0,
    };
  }
}

class InstagramPublisher extends BasePlatformPublisher {
  async publish(content) {
    const { accessToken, accountId } = this.connection;
    const caption = content.captions.get('instagram') || content.captions.get('default') || '';
    const hashtags = content.hashtags?.get('instagram')?.join(' ') || '';
    const fullCaption = `${caption}\n\n${hashtags}`.trim();
    try {
      const media = content.media?.[0];
      let mediaId;
      if (media?.type === 'video') {
        // Create container for reel
        const containerRes = await axios.post(
          `https://graph.facebook.com/v18.0/${accountId}/media`,
          { video_url: media.url, caption: fullCaption, media_type: 'REELS', access_token: accessToken }
        );
        mediaId = containerRes.data.id;
      } else {
        const containerRes = await axios.post(
          `https://graph.facebook.com/v18.0/${accountId}/media`,
          { image_url: media?.url, caption: fullCaption, access_token: accessToken }
        );
        mediaId = containerRes.data.id;
      }
      // Publish container
      const publishRes = await axios.post(
        `https://graph.facebook.com/v18.0/${accountId}/media_publish`,
        { creation_id: mediaId, access_token: accessToken }
      );
      return {
        platform: 'instagram',
        status: 'published',
        platformPostId: publishRes.data.id,
        platformUrl: `https://www.instagram.com/p/${publishRes.data.id}`,
        publishedAt: new Date(),
      };
    } catch (err) {
      logger.error('Instagram publish error:', err.response?.data || err.message);
      throw new Error(err.response?.data?.error?.message || err.message);
    }
  }
}

// ─── YouTube ───────────────────────────────────────────────────────────────
class YouTubePublisher extends BasePlatformPublisher {
  async publish(content) {
    const { accessToken } = this.connection;
    const title = content.title;
    const description = content.captions.get('youtube') || content.captions.get('default') || '';
    const video = content.media?.find(m => m.type === 'video');
    if (!video) throw new Error('YouTube requires a video file');
    try {
      // Upload using YouTube Data API v3 (resumable upload)
      const metaRes = await axios.post(
        'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
        {
          snippet: { title, description, categoryId: '22' },
          status: { privacyStatus: 'public' },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Upload-Content-Type': video.mimeType || 'video/mp4',
          },
        }
      );
      const uploadUrl = metaRes.headers.location;
      // Stream video from URL
      const videoStream = await axios.get(video.url, { responseType: 'stream' });
      const uploadRes = await axios.put(uploadUrl, videoStream.data, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': video.mimeType || 'video/mp4',
        },
      });
      const videoId = uploadRes.data.id;
      return {
        platform: 'youtube',
        status: 'published',
        platformPostId: videoId,
        platformUrl: `https://www.youtube.com/watch?v=${videoId}`,
        publishedAt: new Date(),
      };
    } catch (err) {
      logger.error('YouTube publish error:', err.response?.data || err.message);
      throw new Error(err.response?.data?.error?.message || err.message);
    }
  }
}

// ─── Telegram ──────────────────────────────────────────────────────────────
class TelegramPublisher extends BasePlatformPublisher {
  async publish(content) {
    const { accessToken: botToken, channelId } = this.connection;
    const caption = content.captions.get('telegram') || content.captions.get('default') || '';
    const BASE = `https://api.telegram.org/bot${botToken}`;
    try {
      const media = content.media?.[0];
      let response;
      if (!media) {
        response = await axios.post(`${BASE}/sendMessage`, {
          chat_id: channelId, text: caption, parse_mode: 'HTML',
        });
      } else if (media.type === 'video') {
        response = await axios.post(`${BASE}/sendVideo`, {
          chat_id: channelId, video: media.url, caption, parse_mode: 'HTML',
        });
      } else {
        response = await axios.post(`${BASE}/sendPhoto`, {
          chat_id: channelId, photo: media.url, caption, parse_mode: 'HTML',
        });
      }
      const msgId = response.data.result.message_id;
      return {
        platform: 'telegram',
        status: 'published',
        platformPostId: String(msgId),
        platformUrl: `https://t.me/${channelId.replace('@', '')}/${msgId}`,
        publishedAt: new Date(),
      };
    } catch (err) {
      logger.error('Telegram publish error:', err.response?.data || err.message);
      throw new Error(err.response?.data?.description || err.message);
    }
  }
}

// ─── LinkedIn ──────────────────────────────────────────────────────────────
class LinkedInPublisher extends BasePlatformPublisher {
  async publish(content) {
    const { accessToken, accountId } = this.connection;
    const text = content.captions.get('linkedin') || content.captions.get('default') || '';
    try {
      const body = {
        author: `urn:li:organization:${accountId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text },
            shareMediaCategory: content.media?.length ? 'IMAGE' : 'NONE',
            ...(content.media?.length && {
              media: [{
                status: 'READY',
                originalUrl: content.media[0].url,
              }]
            }),
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      };
      const res = await axios.post('https://api.linkedin.com/v2/ugcPosts', body, {
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      });
      return {
        platform: 'linkedin',
        status: 'published',
        platformPostId: res.data.id,
        platformUrl: `https://www.linkedin.com/feed/update/${res.data.id}`,
        publishedAt: new Date(),
      };
    } catch (err) {
      logger.error('LinkedIn publish error:', err.response?.data || err.message);
      throw new Error(err.response?.data?.message || err.message);
    }
  }
}

// ─── TikTok ────────────────────────────────────────────────────────────────
class TikTokPublisher extends BasePlatformPublisher {
  async publish(content) {
    const { accessToken } = this.connection;
    const video = content.media?.find(m => m.type === 'video');
    if (!video) throw new Error('TikTok requires a video file');
    const caption = content.captions.get('tiktok') || content.captions.get('default') || '';
    try {
      // TikTok Content Posting API
      const initRes = await axios.post(
        'https://open.tiktokapis.com/v2/post/publish/video/init/',
        {
          post_info: { title: caption, privacy_level: 'PUBLIC_TO_EVERYONE', disable_duet: false, disable_comment: false },
          source_info: { source: 'URL', video_url: video.url },
        },
        { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
      );
      const publishId = initRes.data.data.publish_id;
      return {
        platform: 'tiktok',
        status: 'published',
        platformPostId: publishId,
        platformUrl: `https://www.tiktok.com`,
        publishedAt: new Date(),
      };
    } catch (err) {
      logger.error('TikTok publish error:', err.response?.data || err.message);
      throw new Error(err.response?.data?.error?.message || err.message);
    }
  }
}

// ─── Website (WordPress REST API) ─────────────────────────────────────────
class WebsitePublisher extends BasePlatformPublisher {
  async publish(content) {
    const { accessToken, metadata } = this.connection;
    const siteUrl = metadata?.get('siteUrl');
    if (!siteUrl) throw new Error('Website URL not configured');
    const caption = content.captions.get('website') || content.captions.get('default') || '';
    try {
      const res = await axios.post(
        `${siteUrl}/wp-json/wp/v2/posts`,
        {
          title: content.title,
          content: caption,
          status: 'publish',
          featured_media: undefined,
        },
        { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
      );
      return {
        platform: 'website',
        status: 'published',
        platformPostId: String(res.data.id),
        platformUrl: res.data.link,
        publishedAt: new Date(),
      };
    } catch (err) {
      logger.error('Website publish error:', err.response?.data || err.message);
      throw new Error(err.message);
    }
  }
}

// ─── Publisher Factory ─────────────────────────────────────────────────────
const PUBLISHERS = {
  facebook: FacebookPublisher,
  instagram: InstagramPublisher,
  youtube: YouTubePublisher,
  telegram: TelegramPublisher,
  linkedin: LinkedInPublisher,
  tiktok: TikTokPublisher,
  website: WebsitePublisher,
};

function getPublisher(connection) {
  const Cls = PUBLISHERS[connection.platform];
  if (!Cls) throw new Error(`No publisher found for platform: ${connection.platform}`);
  return new Cls(connection);
}

module.exports = { getPublisher, PUBLISHERS };
