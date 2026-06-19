# OmniPost — Multi-Platform Content Management System

A full-featured CMS and digital marketing analytics manager for managing content across all major social media platforms.

## 🚀 Features

- **Dashboard** — Live analytics: reach, impressions, engagement rate, daily trends, platform breakdown
- **Content Manager** — Create, schedule, and publish posts with multi-platform selection
- **Calendar View** — Visual content schedule with monthly calendar layout
- **Analytics** — Deep performance analytics: charts, platform distribution, engagement breakdown
- **Media Library** — Drag-and-drop file upload, grid/list view, file management
- **AI Assistant** — Generate platform-specific captions and hashtags with tone control
- **Platforms** — Connect/disconnect: Facebook, Instagram, YouTube, TikTok, Telegram, LinkedIn, Twitter/X, Website
- **Team Management** — Invite members, assign roles (Admin / Editor / Viewer)
- **Settings** — Business profile, notifications, plan management

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript |
| State | Zustand |
| Charts | Recharts |
| Routing | React Router v6 |
| Build | Vite |
| Styling | Tailwind CSS + Inline styles |
| File Upload | react-dropzone |
| Icons | Lucide React |

## 📦 Supported Platforms

| Platform | Content Types | Status |
|----------|--------------|--------|
| Facebook | Image, Video, Carousel, Text, Story, Reel | ✅ |
| Instagram | Image, Video, Carousel, Story, Reel | ✅ |
| YouTube | Video | ✅ |
| TikTok | Video, Reel | ✅ |
| Telegram | Image, Video, Text, Document | ✅ |
| LinkedIn | Image, Video, Text, Carousel | ✅ |
| Twitter / X | Image, Video, Text | ✅ |
| Website | Image, Video, Text, Carousel | ✅ |

## 🛠️ Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📁 Project Structure

```
src/
├── components/
│   ├── dashboard/      # Dashboard with live charts
│   ├── content/        # Post creation & management
│   ├── calendar/       # Content calendar
│   ├── analytics/      # Performance analytics
│   ├── media/          # Media library with upload
│   ├── ai/             # AI caption generator
│   ├── platforms/      # Platform connection management
│   ├── team/           # Team member management
│   ├── settings/       # Account & notification settings
│   └── Sidebar.tsx     # Navigation sidebar
├── store/              # Zustand global state
├── services/           # Mock data & API services
├── types/              # TypeScript type definitions
└── utils/              # Platform configs & helpers
```

## 🔧 Connecting Real APIs

To connect real platform APIs, update `src/services/` with:

- **Facebook/Instagram**: Meta Business API + Graph API
- **YouTube**: Google YouTube Data API v3
- **TikTok**: TikTok for Business API
- **Telegram**: Bot API (token from @BotFather)
- **LinkedIn**: LinkedIn Marketing API
- **Twitter/X**: Twitter API v2

## 📄 License

MIT — Built for EESC Store by OmniPost
