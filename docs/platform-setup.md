# Platform Setup Guide

Step-by-step instructions to connect each platform to OmniPost.

---

## Facebook Pages & Instagram

1. Go to [developers.facebook.com](https://developers.facebook.com) and create an App (type: **Business**)
2. Add products: **Facebook Login**, **Instagram Graph API**
3. Set OAuth redirect URI to: `https://yourdomain.com/api/oauth/facebook/callback`
4. Under App Settings → Basic, copy your **App ID** and **App Secret**
5. Add to `backend/.env`:
   ```
   FACEBOOK_APP_ID=your_app_id
   FACEBOOK_APP_SECRET=your_app_secret
   ```
6. In OmniPost → Platforms, click **Connect with OAuth** on Facebook
7. Instagram will be connected automatically if your FB account has a linked Instagram Business page

**Required permissions:** `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish`

---

## YouTube

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → Enable **YouTube Data API v3**
3. Create OAuth 2.0 credentials (type: **Web Application**)
4. Add redirect URI: `https://yourdomain.com/api/oauth/google/callback`
5. Add to `.env`:
   ```
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```
6. Click **Connect with OAuth** on YouTube in OmniPost

---

## TikTok

1. Go to [developers.tiktok.com](https://developers.tiktok.com) → Create App
2. Add product: **Content Posting API**
3. Set redirect URI: `https://yourdomain.com/api/oauth/tiktok/callback`
4. Add to `.env`:
   ```
   TIKTOK_CLIENT_KEY=your_client_key
   TIKTOK_CLIENT_SECRET=your_client_secret
   ```
5. Click **Connect with OAuth** on TikTok

---

## LinkedIn

1. Go to [linkedin.com/developers](https://www.linkedin.com/developers) → Create App
2. Link your LinkedIn Company Page
3. Request products: **Share on LinkedIn**, **Marketing Developer Platform**
4. Set redirect URI: `https://yourdomain.com/api/oauth/linkedin/callback`
5. Add to `.env`:
   ```
   LINKEDIN_CLIENT_ID=your_client_id
   LINKEDIN_CLIENT_SECRET=your_client_secret
   ```

---

## Telegram

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` and follow the prompts
3. Copy the **Bot Token** (format: `123456789:ABCdef...`)
4. Add your bot as an admin to your channel
5. In OmniPost → Platforms → Telegram → **Connect**
6. Enter the bot token and your channel username (e.g. `@mychannel`) or ID

---

## Website (WordPress)

1. In WordPress admin → Users → Profile → scroll to **Application Passwords**
2. Enter a name (e.g. "OmniPost") and click **Add New Application Password**
3. Copy the generated password (shown only once)
4. In OmniPost → Platforms → Website → **Connect**
5. Enter your site URL, WordPress username, and the application password

---

## Cloudinary (Media Storage)

1. Sign up at [cloudinary.com](https://cloudinary.com) (free tier: 25GB)
2. Go to Dashboard → copy **Cloud Name**, **API Key**, **API Secret**
3. Add to `.env`:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

---

## Meta Webhooks (Real-time Analytics)

1. In your Meta App → Add Product: **Webhooks**
2. Subscribe to **Page** object, fields: `feed`
3. Set callback URL: `https://yourdomain.com/api/webhooks/meta`
4. Set verify token (any random string) and add to `.env`:
   ```
   META_WEBHOOK_VERIFY_TOKEN=your_verify_token
   ```
