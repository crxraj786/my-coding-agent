import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthUser {
  role: 'owner' | 'admin';
  token: string;
  email?: string;
  adminId?: string;
  displayName?: string;
  balance?: number;
  initialBalance?: number;
}

interface AuthStore {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user: AuthUser) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: 'lr-auth-storage' }
  )
);
