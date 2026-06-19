import React from 'react';
import { useAppStore } from '../../store';
import {
  LayoutDashboard, FileText, Calendar, BarChart2,
  Image, Sparkles, Globe, Users, Settings, LogOut, Bell, Zap
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'content', label: 'Content', icon: FileText },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'media', label: 'Media Library', icon: Image },
  { id: 'ai', label: 'AI Assistant', icon: Sparkles },
  { id: 'platforms', label: 'Platforms', icon: Globe },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { activeView, setActiveView, user } = useAppStore();

  return (
    <aside style={{
      width: 260,
      minHeight: '100vh',
      background: '#fff',
      borderRight: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#111' }}>OmniPost</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>{user.businessName}</div>
          </div>
        </div>
      </div>

      {/* New Post Button */}
      <div style={{ padding: '16px 16px 8px' }}>
        <button
          onClick={() => setActiveView('content')}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '10px 0',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'opacity 0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
          onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
        >
          + New post
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 12px', overflowY: 'auto' }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.08em', padding: '8px 8px 4px', textTransform: 'uppercase' }}>
          Workspace
        </div>
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeView === id;
          return (
            <button
              key={id}
              onClick={() => setActiveView(id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#6366f1' : '#4b5563',
                background: isActive ? '#eef2ff' : 'transparent',
                transition: 'all 0.15s',
                textAlign: 'left',
                marginBottom: 2,
              }}
              onMouseOver={(e) => { if (!isActive) e.currentTarget.style.background = '#f9fafb'; }}
              onMouseOut={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #f3f4f6' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 13,
            }}>
              {user.name[0]}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{user.name}</div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>{user.email}</div>
            </div>
          </div>
          <Bell size={16} color="#9ca3af" style={{ cursor: 'pointer' }} />
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 6,
          color: '#ef4444', fontSize: 13, fontWeight: 500,
          background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
        }}>
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </aside>
  );
};
