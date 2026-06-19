/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_BACKEND_URL?: string;
  readonly VITE_FB_APP_ID?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_TIKTOK_CLIENT_KEY?: string;
  readonly VITE_LINKEDIN_CLIENT_ID?: string;
  readonly VITE_TWITTER_CLIENT_ID?: string;
  readonly VITE_TELEGRAM_BOT_TOKEN?: string;
  readonly VITE_APP_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
