# OmniPost — Multi-Platform CMS & Digital Marketing Manager

A production-ready, full-stack Content Management System for publishing, scheduling, and analyzing content across **Facebook, YouTube, Instagram, TikTok, LinkedIn, Telegram, and your Website** — all from one dashboard.

---

## Features

| Feature | Details |
|---------|---------|
| **Multi-platform publishing** | Publish simultaneously to 7 platforms with one click |
| **Real OAuth flows** | Facebook, Google/YouTube, TikTok, LinkedIn — full OAuth 2.0 with token auto-refresh |
| **AI-powered captions** | Claude generates platform-specific captions, hashtags, content ideas |
| **AI assistant chat** | In-app conversational marketing co-pilot |
| **Media library** | Upload, browse, tag, and reuse images/videos with Cloudinary |
| **Content calendar** | Weekly visual schedule with drag-and-drop |
| **Analytics dashboard** | Unified reach, engagement, clicks across all platforms |
| **Real-time notifications** | Socket.IO push for publish success/failure, team events |
| **Scheduled publishing** | Bull + Redis queue with exponential retry |
| **Team collaboration** | Invite members with Admin/Editor/Viewer roles |
| **Webhooks** | Receive real-time analytics from Meta (Facebook/Instagram) |
| **Docker deployment** | Full docker-compose stack in one command |

---

## Architecture

```
omnipost/
├── backend/                    Express.js API server
│   └── src/
│       ├── index.js               Entry point, Socket.IO setup
│       ├── models/                MongoDB schemas
│       │   ├── Content.model.js
│       │   ├── User.model.js      (includes Workspace)
│       │   ├── Metric.model.js
│       │   ├── Media.model.js
│       │   └── Notification.model.js
│       ├── routes/                REST API endpoints
│       │   ├── auth.routes.js
│       │   ├── content.routes.js
│       │   ├── platform.routes.js
│       │   ├── analytics.routes.js
│       │   ├── scheduler.routes.js
│       │   ├── ai.routes.js
│       │   ├── upload.routes.js
│       │   ├── oauth.routes.js    ← OAuth callbacks for all platforms
│       │   ├── media.routes.js    ← Media library CRUD
│       │   ├── notification.routes.js
│       │   ├── team.routes.js
│       │   └── webhooks/
│       │       └── webhook.routes.js  ← Meta webhooks + analytics sync
│       ├── services/
│       │   ├── publisher.service.js   All 7 platform publishers
│       │   ├── ai.service.js          Claude AI integration
│       │   ├── notification.service.js
│       │   └── oauth/
│       │       └── oauth.service.js   Token exchange + auto-refresh
│       └── workers/
│           └── scheduler.worker.js    Bull queue + cron
│
├── frontend/                   React 18 + Vite + Tailwind CSS
│   └── src/
│       ├── pages/
│       │   ├── DashboardPage.jsx
│       │   ├── ContentPage.jsx
│       │   ├── CreateContentPage.jsx
│       │   ├── CalendarPage.jsx
│       │   ├── AnalyticsPage.jsx
│       │   ├── MediaLibraryPage.jsx   ← Media browser + upload
│       │   ├── AIAssistantPage.jsx
│       │   ├── PlatformsPage.jsx      ← OAuth connect buttons
│       │   ├── TeamPage.jsx           ← Member management
│       │   ├── SettingsPage.jsx
│       │   └── LoginPage.jsx
│       ├── components/
│       │   ├── layout/Layout.jsx
│       │   ├── notifications/NotificationBell.jsx
│       │   └── ui/index.jsx           ← Modal, Badge, Avatar, Skeleton…
│       ├── hooks/index.js             useSocket, useDebounce, usePollStatus
│       ├── services/api.js            All API calls
│       └── store/auth.store.js        Zustand auth
│
├── docs/platform-setup.md      Step-by-step platform connection guide
├── docker-compose.yml
└── .github/workflows/ci.yml    GitHub Actions CI
```

---

## Quick Start

### Option A — Docker (recommended)

```bash
git clone https://github.com/YOUR_USERNAME/omnipost.git
cd omnipost
cp backend/.env.example backend/.env
# Fill in your credentials (at minimum: JWT_SECRET, ANTHROPIC_API_KEY, CLOUDINARY_*)
docker-compose up -d
```

- Frontend: http://localhost:3000
- API: http://localhost:4000/api/health

### Option B — Local dev

```bash
# Prerequisites: Node 20+, MongoDB 7, Redis 7

git clone https://github.com/YOUR_USERNAME/omnipost.git
cd omnipost
cp backend/.env.example backend/.env
# Fill in credentials

# Install all deps
cd backend && npm install
cd ../frontend && npm install

# Terminal 1: API server
cd backend && npm run dev

# Terminal 2: Scheduler worker
cd backend && npm run worker

# Terminal 3: Frontend
cd frontend && npm run dev
# → http://localhost:5173
```

---

## Platform Setup

See **[docs/platform-setup.md](docs/platform-setup.md)** for full step-by-step OAuth setup.

| Platform | Auth type | Required env vars |
|----------|-----------|-------------------|
| Facebook Pages | OAuth 2.0 | `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` |
| Instagram Business | OAuth 2.0 (via Facebook) | Same as Facebook |
| YouTube | OAuth 2.0 | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| TikTok | OAuth 2.0 | `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` |
| LinkedIn | OAuth 2.0 | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` |
| Telegram | Bot token (manual) | Configured in UI |
| Website | WordPress App Password (manual) | Configured in UI |

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user + create workspace |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/content` | List content (filter by status, platform) |
| POST | `/api/content` | Create draft or scheduled post |
| POST | `/api/content/:id/publish` | Publish immediately |
| GET | `/api/content/view/calendar` | Calendar range view |
| GET | `/api/analytics/overview` | Aggregated metrics (configurable days) |
| GET | `/api/analytics/timeseries` | Daily breakdown by platform |
| POST | `/api/ai/captions` | Generate platform-specific captions |
| POST | `/api/ai/hashtags` | Generate hashtag suggestions |
| POST | `/api/ai/ideas` | Generate content ideas |
| POST | `/api/ai/chat` | AI assistant conversation |
| POST | `/api/upload` | Upload media to Cloudinary |
| GET | `/api/media` | Browse media library |
| POST | `/api/media/upload` | Upload to permanent media library |
| GET | `/api/notifications` | List notifications |
| POST | `/api/notifications/read-all` | Mark all read |
| GET | `/api/team` | List workspace members |
| POST | `/api/team/invite` | Invite by email |
| GET | `/api/oauth/facebook` | Initiate Facebook OAuth |
| GET | `/api/oauth/google` | Initiate Google/YouTube OAuth |
| GET | `/api/oauth/tiktok` | Initiate TikTok OAuth |
| GET | `/api/oauth/linkedin` | Initiate LinkedIn OAuth |
| POST | `/api/oauth/telegram` | Connect Telegram bot |
| POST | `/api/oauth/website` | Connect WordPress site |
| GET | `/api/webhooks/meta` | Meta webhook verification |
| POST | `/api/webhooks/meta` | Receive Meta events |

---

## Tech Stack

**Backend:** Node.js 20, Express, MongoDB 7 (Mongoose), Redis 7, Bull, Socket.IO, Winston, Cloudinary SDK, FFmpeg

**Frontend:** React 18, Vite, Tailwind CSS 3, Zustand, TanStack Query v5, Recharts, React Dropzone, Socket.IO client, date-fns

**AI:** Anthropic Claude (`claude-sonnet-4-6`)

**Infrastructure:** Docker, Nginx, GitHub Actions

---

## License

MIT — free to use, modify, and deploy.
