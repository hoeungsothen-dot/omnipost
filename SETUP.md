# OmniPost — Complete Setup Guide

## 🚀 Quick Start (Demo Mode — No Account Needed)

```bash
git clone https://github.com/hoeungsothen-dot/omnipost.git
cd omnipost
npm install
npm run dev
# Open http://localhost:5173
```

Works immediately with demo data. No sign-up required.

---

## 🗄️ Step 1: Set Up Supabase (Free Database + Auth)

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Name it `omnipost`, choose a region close to Cambodia (Singapore)
3. Copy your **Project URL** and **anon public** key from:
   `Settings → API → Project URL / anon key`
4. Open **SQL Editor** → paste contents of `supabase/schema.sql` → **Run**
5. Go to **Storage** → **New Bucket** → name: `media`, Public: ✅ ON

Create `.env.local` in project root:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

Restart dev server → You now have real auth + database!

---

## 🔗 Step 2: Connect Each Platform

### Facebook Pages
1. [developers.facebook.com](https://developers.facebook.com) → **Create App** → Business
2. Add products: **Facebook Login** + **Pages API**
3. Settings → Basic → copy **App ID**
4. Add to `.env.local`: `VITE_FB_APP_ID=your_app_id`
5. Request permission: `pages_manage_posts` (requires App Review)

### Instagram
- Uses same Facebook App → Add **Instagram Graph API** product
- Connect your Instagram Professional Account to a Facebook Page
- Same `VITE_FB_APP_ID` works

### YouTube
1. [console.cloud.google.com](https://console.cloud.google.com) → New Project
2. **APIs & Services** → Enable **YouTube Data API v3**
3. **Credentials** → Create **OAuth 2.0 Client ID** (Web Application)
4. Authorized redirect URI: `https://yourdomain.com/auth/callback/youtube`
5. Add to `.env.local`: `VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com`

### TikTok
1. [developers.tiktok.com](https://developers.tiktok.com) → Create App
2. Add product: **Content Posting API**
3. Redirect URI: `https://yourdomain.com/auth/callback/tiktok`
4. Add to `.env.local`: `VITE_TIKTOK_CLIENT_KEY=your_client_key`

### Telegram (Easiest!)
1. Open Telegram → search **@BotFather**
2. Send `/newbot` → follow steps → copy token
3. Add bot as **Administrator** to your channel
4. Add to `.env.local`: `VITE_TELEGRAM_BOT_TOKEN=123456:ABC-DEF...`

### LinkedIn
1. [developer.linkedin.com](https://developer.linkedin.com) → Create App → link to your Page
2. Request products: **Share on LinkedIn**
3. OAuth 2.0 → Redirect URL: `https://yourdomain.com/auth/callback/linkedin`
4. Add to `.env.local`: `VITE_LINKEDIN_CLIENT_ID=your_client_id`

### Twitter / X
1. [developer.twitter.com](https://developer.twitter.com) → Create Project + App
2. Enable **OAuth 2.0** in User Authentication Settings
3. Add redirect URL: `https://yourdomain.com/auth/callback/twitter`
4. Add to `.env.local`: `VITE_TWITTER_CLIENT_ID=your_client_id`
5. Note: Requires Basic plan ($100/mo) for posting

---

## 🌐 Step 3: Deploy to Vercel (Free)

### Option A: Connect GitHub (Recommended)
1. [vercel.com](https://vercel.com) → **New Project** → Import from GitHub
2. Select `omnipost` repo
3. **Environment Variables** → add all your `.env.local` values
4. Click **Deploy** → Done in ~2 minutes!

### Option B: Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Option C: Netlify
1. [app.netlify.com](https://app.netlify.com) → **Add new site** → Import from Git
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variables → Deploy!

---

## ⚙️ Step 4: Custom Domain (Optional)

On Vercel: **Settings → Domains → Add** → e.g. `omnipost.eescstore.com`

Update your platform OAuth redirect URIs to match your new domain.

---

## 📱 Platform Publishing — How It Works

```
User clicks "Publish"
    ↓
OmniPost frontend sends request to your Backend API
    ↓
Backend API holds your secret tokens (safe!)
    ↓
Backend publishes to each platform API
    ↓
Returns success/failure for each platform
    ↓
Dashboard shows live analytics
```

**For now (demo mode):** Publish button saves to Supabase with "published" status.
**For real publishing:** You need a small backend (Node.js/Express or Edge Functions).

---

## 🤖 Step 5: Enable AI Captions (Real Claude API)

The AI Assistant currently uses template-based generation.
To use real Claude AI:

1. Get API key at [console.anthropic.com](https://console.anthropic.com)
2. The app already calls Anthropic API from the AI Assistant component
3. Set in Supabase Edge Function secrets (keep key server-side!)

---

## 📊 Analytics Integration

Real analytics require platform API calls to fetch post performance.
Set up a daily Supabase Edge Function or cron job to:
1. Fetch analytics from each platform API
2. Store in `post_analytics` table
3. Dashboard reads from Supabase automatically

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Blank screen | Check browser console for errors |
| Auth not working | Verify VITE_SUPABASE_URL is correct |
| Can't upload media | Check Supabase Storage bucket is public |
| Platform won't connect | Verify redirect URI matches exactly |
| Build fails | Run `npm install` then `npm run build` |

---

## 📞 Support

- GitHub Issues: [github.com/hoeungsothen-dot/omnipost/issues](https://github.com/hoeungsothen-dot/omnipost/issues)
- Supabase Docs: [supabase.com/docs](https://supabase.com/docs)
- Platform API Docs: see `src/services/platforms.ts` for all links
