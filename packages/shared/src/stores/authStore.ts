import { create } from 'zustand';
import { User } from '../types';
import { login as apiLogin, register as apiRegister, RegisterPayload } from '../api';

interface AuthState {
  /** The authenticated user, or null if logged out. */
  user: User | null;

  /** JWT token for API calls. */
  token: string | null;

  /** True while a login/register request is in flight. */
  loading: boolean;

  /** Error message from the last auth attempt. */
  error: string | null;

  /** Register a new account and store the token. */
  register: (payload: RegisterPayload) => Promise<void>;

  /** Log in and store the token. */
  login: (email: string, password: string) => Promise<void>;

  /** Log out and clear stored auth. */
  logout: () => void;

  /** Restore auth from localStorage (call on app load). */
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,
  error: null,

  register: async (payload) => {
    set({ loading: true, error: null });
    try {
      const { token, user } = await apiRegister(payload);
      localStorage.setItem('vibecheck_token', token);
      localStorage.setItem('vibecheck_user', JSON.stringify(user));
      set({ token, user, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      set({ error: message, loading: false });
      throw err;
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { token, user } = await apiLogin(email, password);
      localStorage.setItem('vibecheck_token', token);
      localStorage.setItem('vibecheck_user', JSON.stringify(user));
      set({ token, user, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      set({ error: message, loading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('vibecheck_token');
    localStorage.removeItem('vibecheck_user');
    set({ token: null, user: null, error: null });
  },

  hydrate: () => {
    const token = localStorage.getItem('vibecheck_token');
    const userJson = localStorage.getItem('vibecheck_user');
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        set({ token, user });
      } catch {
        localStorage.removeItem('vibecheck_token');
        localStorage.removeItem('vibecheck_user');
      }
    }
  },
}));
