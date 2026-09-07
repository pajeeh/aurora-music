export type CachedGoogleSession = { token: string; expiresAt: number; profile: { name: string; avatar?: string } };
const KEY = 'aurora-google-session-v1';

export function readGoogleSession(storage: Pick<Storage, 'getItem' | 'removeItem'>, now = Date.now()): CachedGoogleSession | null {
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<CachedGoogleSession>;
    const valid = typeof value.token === 'string' && value.token.length > 0 && typeof value.expiresAt === 'number' && value.expiresAt > now + 30_000 && typeof value.profile?.name === 'string';
    if (valid) return value as CachedGoogleSession;
  } catch { /* Remove damaged or inaccessible session data below. */ }
  try { storage.removeItem(KEY); } catch { /* The app remains usable without storage. */ }
  return null;
}

export function saveGoogleSession(storage: Pick<Storage, 'setItem'>, session: CachedGoogleSession) {
  storage.setItem(KEY, JSON.stringify(session));
}

export function clearGoogleSession(storage: Pick<Storage, 'removeItem'>) {
  try { storage.removeItem(KEY); } catch { /* Nothing else to clear. */ }
}
