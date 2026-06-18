# OmniPost — Multi-Platform CMS & Digital Marketing Manager

A full-stack Content Management System for publishing and analyzing content across **Facebook, YouTube, Instagram, TikTok, LinkedIn, Telegram, and your Website** — all from one dashboard.

## Features

- **Multi-platform publishing** — one post, all platforms simultaneously
- **AI-powered captions** — Claude generates platform-specific captions automatically
- **Content calendar** — visual schedule with drag-and-drop
- **Analytics dashboard** — unified reach, engagement, and performance metrics
- **Media management** — image/video upload with automatic format optimization
- **Real-time updates** — Socket.IO for live publish status
- **Scheduled publishing** — Bull queue with Redis, auto-retry on failure
- **AI assistant** — chat interface for content strategy help

## Architecture

```
omnipost/
├── backend/              # Express.js API
│   └── src/
│       ├── index.js          # Server entry point
│       ├── routes/           # REST API endpoints
│       ├── models/           # MongoDB schemas
│       ├── services/
│       │   ├── publisher.service.js   # All platform publishers
│       │   └── ai.service.js          # Claude AI integration
│       ├── workers/
│       │   └── scheduler.worker.js    # Bull queue + cron
│       ├── middleware/       # Auth, error handling
│       └── config/           # Redis, DB config
└── frontend/             # React + Vite + Tailwind
    └── src/
        ├── pages/            # Dashboard, Content, Calendar, Analytics, AI...
        ├── components/       # Reusable UI components
        ├── services/api.js   # All API calls
        └── store/            # Zustand state management
```

## Quick Start

### Prerequisites
- Node.js 20+
- MongoDB 7+
- Redis 7+
- Cloudinary account (media storage)
- Anthropic API key (AI captions)

### 1. Clone and install
```bash
git clone https://github.com/YOUR_USERNAME/omnipost.git
cd omnipost
cp backend/.env.example backend/.env
# Fill in your credentials in backend/.env
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Start with Docker (recommended)
```bash
docker-compose up -d
# Frontend: http://localhost:3000
# Backend API: http://localhost:4000
```

### 3. Start manually
```bash
# Terminal 1 - Backend API
cd backend && npm run dev

# Terminal 2 - Background scheduler worker
cd backend && npm run worker

# Terminal 3 - Frontend
cd frontend && npm run dev
# Open http://localhost:5173
```

## Platform Setup

Each platform requires API credentials. See the [Platform Setup Guide](docs/platform-setup.md) for step-by-step OAuth setup for each platform.

| Platform | API | Auth Type |
|----------|-----|-----------|
| Facebook Pages | Meta Graph API v18 | OAuth 2.0 |
| Instagram | Meta Graph API v18 | OAuth 2.0 |
| YouTube | YouTube Data API v3 | OAuth 2.0 |
| TikTok | TikTok Content Posting API | OAuth 2.0 |
| LinkedIn | LinkedIn UGC API v2 | OAuth 2.0 |
| Telegram | Telegram Bot API | Bot Token |
| Website | WordPress REST API | JWT/App Password |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register + create workspace |
| POST | `/api/auth/login` | Login |
| GET | `/api/content` | List content |
| POST | `/api/content` | Create content |
| POST | `/api/content/:id/publish` | Publish immediately |
| GET | `/api/analytics/overview` | Aggregated metrics |
| POST | `/api/ai/captions` | Generate AI captions |
| POST | `/api/ai/chat` | AI assistant chat |
| POST | `/api/upload` | Upload media files |
| GET | `/api/platforms` | List connected platforms |
| POST | `/api/platforms/:platform/connect` | Connect platform |

## Environment Variables

See `backend/.env.example` for all required variables.

Key variables:
- `MONGODB_URI` — MongoDB connection string
- `REDIS_HOST` — Redis host for job queue
- `JWT_SECRET` — Secret for auth tokens (use 64+ random chars in production)
- `ANTHROPIC_API_KEY` — For AI caption generation
- `CLOUDINARY_*` — For media storage

## Tech Stack

**Backend:** Node.js, Express, MongoDB (Mongoose), Redis, Bull, Socket.IO, Winston, Cloudinary, FFmpeg

**Frontend:** React 18, Vite, Tailwind CSS, Zustand, TanStack Query, Recharts, React Dropzone

**AI:** Anthropic Claude (claude-sonnet-4-6)

**Infrastructure:** Docker, Nginx

## License

MIT
