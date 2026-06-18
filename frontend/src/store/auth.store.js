import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      workspace: null,
      setAuth: ({ token, user, workspace }) => set({ token, user, workspace }),
      logout: () => set({ token: null, user: null, workspace: null }),
      updateWorkspace: (workspace) => set({ workspace }),
    }),
    { name: 'omnipost-auth' }
  )
);
