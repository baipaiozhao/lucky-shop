import { create } from 'zustand';
import type { User } from '@types';

interface AuthState {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  updatePoints: (points: number) => void;
  logout: () => void;
  isLoggedIn: () => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('lucky_shop_token'),
  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) localStorage.setItem('lucky_shop_token', token);
    else localStorage.removeItem('lucky_shop_token');
    set({ token });
  },
  updatePoints: (points) => {
    const user = get().user;
    if (user) set({ user: { ...user, points } });
  },
  logout: () => {
    localStorage.removeItem('lucky_shop_token');
    set({ user: null, token: null });
  },
  isLoggedIn: () => !!get().token,
  isAdmin: () => get().user?.role === 'admin',
}));
