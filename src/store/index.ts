import { create } from 'zustand';
import type { Post, MediaFile, PlatformAccount, TeamMember, User, DashboardStats } from '../types';
import { mockPosts, mockMediaFiles, mockPlatformAccounts, mockTeamMembers, mockDashboardStats } from '../services/mockData';

interface AppStore {
  // Auth
  user: User;
  
  // Data
  posts: Post[];
  mediaFiles: MediaFile[];
  platformAccounts: PlatformAccount[];
  teamMembers: TeamMember[];
  dashboardStats: DashboardStats;

  // UI State
  activeView: string;
  setActiveView: (view: string) => void;
  
  // Posts actions
  addPost: (post: Post) => void;
  updatePost: (id: string, updates: Partial<Post>) => void;
  deletePost: (id: string) => void;
  
  // Media actions
  addMediaFile: (file: MediaFile) => void;
  deleteMediaFile: (id: string) => void;
  
  // Platform actions
  togglePlatformConnection: (id: string) => void;
  
  // Team actions
  addTeamMember: (member: TeamMember) => void;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;
  removeTeamMember: (id: string) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  user: {
    id: '1',
    name: 'Sothen Hoeung',
    email: 'sothenreal@gmail.com',
    businessName: 'EESC Store',
    plan: 'pro',
  },
  
  posts: mockPosts,
  mediaFiles: mockMediaFiles,
  platformAccounts: mockPlatformAccounts,
  teamMembers: mockTeamMembers,
  dashboardStats: mockDashboardStats,
  
  activeView: 'dashboard',
  setActiveView: (view) => set({ activeView: view }),
  
  addPost: (post) => set((s) => ({ posts: [post, ...s.posts] })),
  updatePost: (id, updates) => set((s) => ({
    posts: s.posts.map((p) => p.id === id ? { ...p, ...updates } : p),
  })),
  deletePost: (id) => set((s) => ({ posts: s.posts.filter((p) => p.id !== id) })),
  
  addMediaFile: (file) => set((s) => ({ mediaFiles: [file, ...s.mediaFiles] })),
  deleteMediaFile: (id) => set((s) => ({ mediaFiles: s.mediaFiles.filter((f) => f.id !== id) })),
  
  togglePlatformConnection: (id) => set((s) => ({
    platformAccounts: s.platformAccounts.map((p) =>
      p.id === id ? { ...p, connected: !p.connected } : p
    ),
  })),
  
  addTeamMember: (member) => set((s) => ({ teamMembers: [...s.teamMembers, member] })),
  updateTeamMember: (id, updates) => set((s) => ({
    teamMembers: s.teamMembers.map((m) => m.id === id ? { ...m, ...updates } : m),
  })),
  removeTeamMember: (id) => set((s) => ({
    teamMembers: s.teamMembers.filter((m) => m.id !== id),
  })),
}));
