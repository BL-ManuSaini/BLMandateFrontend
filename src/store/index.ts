import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PaletteMode } from '@mui/material';
import type { User } from '../types';
import { bindAuthTokenAccessors } from '../api/client/authToken';

// ─── Theme slice ──────────────────────────────────────────────────────────────
interface ThemeSlice {
  mode: PaletteMode;
  toggleMode: () => void;
  setMode: (mode: PaletteMode) => void;
}

export const useThemeStore = create<ThemeSlice>()(
  persist(
    (set) => ({
      mode: 'light',
      toggleMode: () =>
        set((s) => ({ mode: s.mode === 'dark' ? 'light' : 'dark' })),
      setMode: (mode) => set({ mode }),
    }),
    { name: 'mm-theme' }
  )
);

// ─── Session slice ────────────────────────────────────────────────────────────
interface SessionSlice {
  currentUser: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isSessionReady: boolean;
  setSession: (payload: { user: User; accessToken: string; refreshToken: string }) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setCurrentUser: (user: User | null) => void;
  setSessionReady: (ready: boolean) => void;
  logout: () => void;
}

export const useSessionStore = create<SessionSlice>()(
  persist(
    (set, get) => ({
      currentUser: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isSessionReady: false,

      setSession: ({ user, accessToken, refreshToken }) =>
        set({
          currentUser: user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isSessionReady: true,
        }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken, isAuthenticated: !!accessToken }),

      setCurrentUser: (user) =>
        set({
          currentUser: user,
          isAuthenticated: !!user && !!get().accessToken,
        }),

      setSessionReady: (ready) => set({ isSessionReady: ready }),

      logout: () => {
        useThemeStore.getState().setMode('light');
        set({
          currentUser: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isSessionReady: true,
        });
      },
    }),
    {
      name: 'mm-session',
      partialize: (state) => ({
        currentUser: state.currentUser,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && !state.accessToken) {
          state.logout();
        }
      },
    }
  )
);

bindAuthTokenAccessors({
  getAccessToken: () => useSessionStore.getState().accessToken,
  getRefreshToken: () => useSessionStore.getState().refreshToken,
  setTokens: (accessToken, refreshToken) =>
    useSessionStore.getState().setTokens(accessToken, refreshToken),
  clearSession: () => useSessionStore.getState().logout(),
});

// ─── Global filters slice ─────────────────────────────────────────────────────
interface GlobalFilters {
  coeId: string;
  clientId: string;
  techStack: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

interface GlobalFiltersSlice {
  filters: GlobalFilters;
  setFilter: <K extends keyof GlobalFilters>(key: K, value: GlobalFilters[K]) => void;
  resetFilters: () => void;
}

const defaultFilters: GlobalFilters = {
  coeId: '',
  clientId: '',
  techStack: '',
  status: '',
  dateFrom: '',
  dateTo: '',
};

export const useFiltersStore = create<GlobalFiltersSlice>()((set) => ({
  filters: defaultFilters,
  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),
  resetFilters: () => set({ filters: defaultFilters }),
}));

// ─── UI slice (sidebar, notifications panel) ──────────────────────────────────
interface UISlice {
  sidebarOpen: boolean;
  notifPanelOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleNotifPanel: () => void;
}

export const useUIStore = create<UISlice>()((set) => ({
  sidebarOpen: true,
  notifPanelOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleNotifPanel: () => set((s) => ({ notifPanelOpen: !s.notifPanelOpen })),
}));
