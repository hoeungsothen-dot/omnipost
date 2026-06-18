# Backend Deployment Guide — Railway

Railway is the easiest way to deploy the OmniPost backend.
Free tier gives you $5/month credit — enough for a small deployment.

---

## Step 1 — Create a Railway account

1. Go to https://railway.app
2. Sign up with your GitHub account
3. Authorize Railway to access your repositories

---

## Step 2 — Create a new project

1. Click **New Project**
2. Select **Deploy from GitHub repo**
3. Choose **hoeungsothen-dot/omnipost**
4. Railway will detect the `railway.toml` and configure automatically

---

## Step 3 — Add MongoDB

1. In your Railway project, click **+ New Service**
2. Select **Database → MongoDB**
3. Railway creates a MongoDB instance and sets `MONGODB_URL` automatically
4. No configuration needed — it connects automatically

---

## Step 4 — Add Redis

1. Click **+ New Service** again
2. Select **Database → Redis**
3. Railway sets `REDIS_URL` automatically
4. No configuration needed

---

## Step 5 — Set environment variables

Click your **backend service → Variables** tab and add these:

### Required
```
JWT_SECRET=<generate a random 64-char string>
ANTHROPIC_API_KEY=sk-ant-...
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=https://omnipost.hoeungsothen.workers.dev
BACKEND_URL=https://<your-railway-url>.railway.app
NODE_ENV=production
```

### Generate JWT_SECRET (run this in terminal):
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Platform APIs (add as you connect each platform)
```
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
META_WEBHOOK_VERIFY_TOKEN=<any random string>
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
```

---

## Step 6 — Deploy

1. Railway auto-deploys when you save variables
2. Watch the build logs — should take ~2 minutes
3. Once deployed, click **Settings → Networking → Generate Domain**
4. You get a URL like: `https://omnipost-production.up.railway.app`

---

## Step 7 — Connect frontend to backend

1. Go to **Cloudflare Workers & Pages → omnipost → Settings → Environment Variables**
2. Add:
   ```
   VITE_API_URL=https://omnipost-production.up.railway.app
   ```
3. Click **Save and deploy**
4. Cloudflare rebuilds the frontend — now it talks to your real backend!

---

## Step 8 — Test it works

Visit your Cloudflare URL and:
1. Register a new account — if it saves, MongoDB is working ✓
2. Go to Dashboard — if you see your workspace name, auth is working ✓
3. Go to AI Assistant and type a message — if Claude responds, Anthropic API key is working ✓

---

## Step 9 — Add the scheduler worker (optional)

The scheduler auto-publishes posts at their scheduled time.

1. In Railway project, click **+ New Service → Empty Service**
2. Connect to same GitHub repo
3. In Settings → set Start Command: `cd backend && node src/workers/scheduler.worker.js`
4. Add the same environment variables
5. Deploy

---

## Cloudinary setup (free — required for media uploads)

1. Go to https://cloudinary.com and sign up (free: 25GB storage)
2. Dashboard → copy **Cloud Name**, **API Key**, **API Secret**
3. Add to Railway environment variables

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `MongoServerError` | Check MONGODB_URL is set (Railway sets this automatically) |
| `401 Invalid token` | Check JWT_SECRET is set and matches between deploys |
| `CORS error` | Add your Cloudflare URL to FRONTEND_URL in Railway vars |
| Media upload fails | Check all 3 CLOUDINARY_* variables are set correctly |
| AI captions not working | Check ANTHROPIC_API_KEY starts with `sk-ant-` |

---

## Cost estimate

| Service | Cost |
|---------|------|
| Railway Hobby plan | $5/month credit (free for small apps) |
| MongoDB on Railway | ~$0 on free tier |
| Redis on Railway | ~$0 on free tier |
| Cloudinary | Free (25GB) |
| Cloudflare Workers | Free (100K requests/day) |
| **Total** | **$0–5/month** |
