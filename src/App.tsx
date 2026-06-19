import React from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/dashboard/Dashboard';
import { Content } from './components/content/Content';
import { Calendar } from './components/calendar/Calendar';
import { Analytics } from './components/analytics/Analytics';
import { MediaLibrary } from './components/media/MediaLibrary';
import { AIAssistant } from './components/ai/AIAssistant';
import { Platforms } from './components/platforms/Platforms';
import { Team } from './components/team/Team';
import { Settings } from './components/settings/Settings';
import { AuthProvider, LoginPage, useAuth } from './auth/AuthContext';
import { useAppStore } from './store';

const views: Record<string, React.ComponentType> = {
  dashboard: Dashboard,
  content: Content,
  calendar: Calendar,
  analytics: Analytics,
  media: MediaLibrary,
  ai: AIAssistant,
  platforms: Platforms,
  team: Team,
  settings: Settings,
};

function AppInner() {
  const { user, loading } = useAuth();
  const { activeView } = useAppStore();
  const View = views[activeView] || Dashboard;

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)',
        flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          width: 48, height: 48,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, animation: 'pulse 1.5s ease-in-out infinite',
        }}>⚡</div>
        <div style={{ fontSize: 15, color: '#6b7280' }}>Loading OmniPost...</div>
        <style>{`@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }`}</style>
      </div>
    );
  }

  // If no Supabase configured, skip auth (demo mode)
  const hasSupabase = Boolean(import.meta.env.VITE_SUPABASE_URL);
  if (hasSupabase && !user) {
    return <LoginPage />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fc' }}>
      <Sidebar />
      <main style={{
        marginLeft: 260,
        flex: 1,
        padding: '36px 40px',
        maxWidth: 'calc(100vw - 260px)',
        minHeight: '100vh',
      }}>
        <View />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
