import { create } from 'zustand';
import { User } from '../types';
import { login as apiLogin, register as apiRegister, RegisterPayload } from '../api';

const TOKEN_KEY = 'vibecheck_token';
const USER_KEY = 'vibecheck_user';

let memoryToken: string | null = null;
let memoryUserJson: string | null = null;

function canUseLocalStorage() {
  return typeof localStorage !== 'undefined';
}

function saveAuth(token: string, user: User) {
  const userJson = JSON.stringify(user);

  if (canUseLocalStorage()) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, userJson);
    return;
  }

  memoryToken = token;
  memoryUserJson = userJson;
}

function clearAuth() {
  if (canUseLocalStorage()) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  memoryToken = null;
  memoryUserJson = null;
}

function loadAuth() {
  if (canUseLocalStorage()) {
    return {
      token: localStorage.getItem(TOKEN_KEY),
      userJson: localStorage.getItem(USER_KEY),
    };
  }

  return {
    token: memoryToken,
    userJson: memoryUserJson,
  };
}

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
      saveAuth(token, user);
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
      saveAuth(token, user);
      set({ token, user, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      set({ error: message, loading: false });
      throw err;
    }
  },

  logout: () => {
    clearAuth();
    set({ token: null, user: null, error: null });
  },

  hydrate: () => {
    const { token, userJson } = loadAuth();
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        set({ token, user });
      } catch {
        clearAuth();
      }
    }
  },
}));
