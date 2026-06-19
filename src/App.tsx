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

export default function App() {
  const { activeView } = useAppStore();
  const View = views[activeView] || Dashboard;

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
