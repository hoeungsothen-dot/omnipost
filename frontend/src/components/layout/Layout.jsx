import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { useSocket } from '../../hooks/index.js';
import NotificationBell from '../notifications/NotificationBell';
import {
  LayoutDashboard, FileText, Calendar, BarChart2, Sparkles,
  Settings, Globe, LogOut, Plus, Zap, Image, Users, Search
} from 'lucide-react';
import { useState } from 'react';

const PLATFORMS = [
  { name: 'Facebook', color: '#1877F2' },
  { name: 'YouTube', color: '#FF0000' },
  { name: 'Telegram', color: '#26A5E4' },
  { name: 'Instagram', color: '#E1306C' },
  { name: 'TikTok', color: '#010101' },
  { name: 'LinkedIn', color: '#0A66C2' },
  { name: 'Website', color: '#21759B' },
];

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/content', icon: FileText, label: 'Content' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/media', icon: Image, label: 'Media library' },
  { to: '/ai', icon: Sparkles, label: 'AI assistant' },
  { to: '/platforms', icon: Globe, label: 'Platforms' },
  { to: '/team', icon: Users, label: 'Team' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const { user, workspace, logout } = useAuthStore();
  const navigate = useNavigate();
  useSocket(); // Connect Socket.IO globally

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">OmniPost</div>
              <div className="text-[10px] text-gray-400 truncate max-w-[110px]">{workspace?.name}</div>
            </div>
          </div>
        </div>

        {/* New post CTA */}
        <div className="px-3 py-3">
          <button onClick={() => navigate('/content/new')} className="btn-primary w-full justify-center text-xs py-1.5">
            <Plus size={13} /> New post
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 overflow-y-auto pb-2">
          <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider px-2 mb-1.5 mt-1">Workspace</div>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <Icon size={15} />
              <span>{label}</span>
            </NavLink>
          ))}

          <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider px-2 mb-1.5 mt-4">Platforms</div>
          {PLATFORMS.map(p => (
            <div key={p.name} className="sidebar-item cursor-default">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
              <span className="text-xs">{p.name}</span>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-3 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-700">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-800 truncate">{user?.name}</div>
              <div className="text-[10px] text-gray-400 truncate">{user?.email}</div>
            </div>
            <NotificationBell />
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} className="sidebar-item w-full text-red-500 hover:bg-red-50 hover:text-red-600 text-xs">
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
