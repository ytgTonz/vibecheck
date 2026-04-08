import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { User } from '../types/models';

interface AuthGuardResult {
  user: User | null;
  token: string | null;
  hydrated: boolean;
  /** True when hydrated AND authenticated (user + token present). */
  ready: boolean;
}

/**
 * Auth guard hook for protected pages.
 *
 * Triggers hydration on mount and redirects unauthenticated users.
 * Pass a `redirect` function so the hook stays framework-agnostic
 * (works with both Next.js `useRouter().replace` and Expo Router).
 *
 * Usage:
 *   const router = useRouter();
 *   const { user, token, ready } = useRequireAuth((path) => router.replace(path));
 */
export function useRequireAuth(
  redirect: (path: string) => void,
  redirectTo = '/login',
): AuthGuardResult {
  const { user, token, hydrated, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (hydrated && !user) {
      redirect(redirectTo);
    }
  }, [hydrated, user, redirect, redirectTo]);

  return {
    user,
    token,
    hydrated,
    ready: hydrated && !!user && !!token,
  };
}
