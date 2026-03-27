import { create } from 'zustand';
import { User } from '../types/models';
import { login as apiLogin, register as apiRegister, RegisterPayload } from '../api';

const TOKEN_KEY = 'vibecheck_token';
const USER_KEY = 'vibecheck_user';

type AuthStorage = {
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => void | Promise<void>;
  removeItem: (key: string) => void | Promise<void>;
};

let memoryToken: string | null = null;
let memoryUserJson: string | null = null;
let customStorage: AuthStorage | null = null;

function canUseLocalStorage() {
  return typeof localStorage !== 'undefined';
}

function memoryStorage(): AuthStorage {
  return {
    getItem: (key) => (key === TOKEN_KEY ? memoryToken : key === USER_KEY ? memoryUserJson : null),
    setItem: (key, value) => {
      if (key === TOKEN_KEY) memoryToken = value;
      if (key === USER_KEY) memoryUserJson = value;
    },
    removeItem: (key) => {
      if (key === TOKEN_KEY) memoryToken = null;
      if (key === USER_KEY) memoryUserJson = null;
    },
  };
}

function localStorageAdapter(): AuthStorage {
  return {
    getItem: (key) => localStorage.getItem(key),
    setItem: (key, value) => localStorage.setItem(key, value),
    removeItem: (key) => localStorage.removeItem(key),
  };
}

function getStorage(): AuthStorage {
  if (canUseLocalStorage()) {
    return localStorageAdapter();
  }

  return customStorage ?? memoryStorage();
}

export function setAuthStorage(storage: AuthStorage) {
  customStorage = storage;
}

async function saveAuth(token: string, user: User) {
  const userJson = JSON.stringify(user);
  const storage = getStorage();
  await Promise.all([
    Promise.resolve(storage.setItem(TOKEN_KEY, token)),
    Promise.resolve(storage.setItem(USER_KEY, userJson)),
  ]);
}

async function clearAuth() {
  const storage = getStorage();
  await Promise.all([
    Promise.resolve(storage.removeItem(TOKEN_KEY)),
    Promise.resolve(storage.removeItem(USER_KEY)),
  ]);
  memoryToken = null;
  memoryUserJson = null;
}

async function loadAuth() {
  const storage = getStorage();
  const [token, userJson] = await Promise.all([
    Promise.resolve(storage.getItem(TOKEN_KEY)),
    Promise.resolve(storage.getItem(USER_KEY)),
  ]);
  return {
    token,
    userJson,
  };
}

interface AuthState {
  /** The authenticated user, or null if logged out. */
  user: User | null;

  /** JWT token for API calls. */
  token: string | null;

  /** Whether initial auth hydration has completed. */
  hydrated: boolean;

  /** True while a login/register request is in flight. */
  loading: boolean;

  /** Error message from the last auth attempt. */
  error: string | null;

  /** Register a new account and store the token. */
  register: (payload: RegisterPayload) => Promise<void>;

  /** Log in and store the token. */
  login: (email: string, password: string) => Promise<void>;

  /** Log out and clear stored auth. */
  logout: () => Promise<void>;

  /** Restore auth from localStorage (call on app load). */
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  hydrated: false,
  loading: false,
  error: null,

  register: async (payload) => {
    set({ loading: true, error: null });
    try {
      const { token, user } = await apiRegister(payload);
      await saveAuth(token, user);
      set({ token, user, loading: false, hydrated: true });
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
      await saveAuth(token, user);
      set({ token, user, loading: false, hydrated: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      set({ error: message, loading: false });
      throw err;
    }
  },

  logout: async () => {
    await clearAuth();
    set({ token: null, user: null, error: null, hydrated: true });
  },

  hydrate: async () => {
    const { token, userJson } = await loadAuth();
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        set({ token, user, hydrated: true });
        return;
      } catch {
        await clearAuth();
        set({ token: null, user: null, hydrated: true });
        return;
      }
    }

    set({ token: null, user: null, hydrated: true });
  },
}));
