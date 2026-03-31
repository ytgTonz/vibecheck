const KEY = 'vibecheck_device_id';
let cached: string | null = null;

/** Returns a persistent anonymous device ID stored in localStorage. */
export function getDeviceId(): string {
  if (cached) return cached;
  if (typeof window === 'undefined') return 'ssr';

  const existing = localStorage.getItem(KEY);
  if (existing) {
    cached = existing;
    return existing;
  }

  const id = crypto.randomUUID();
  localStorage.setItem(KEY, id);
  cached = id;
  return id;
}
