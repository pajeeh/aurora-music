export type GoogleProfile = { name: string; avatar?: string };
const KEY = 'aurora-google-profile-v1';
type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export function rememberGoogleProfile(storage: Store, profile: GoogleProfile) {
  try { storage.setItem(KEY, JSON.stringify(profile)); } catch { /* Memory-only profile is still usable. */ }
}
export function readRememberedGoogleProfile(storage: Store): GoogleProfile | null {
  try {
    const raw = storage.getItem(KEY);
    const profile = raw ? JSON.parse(raw) : JSON.parse(storage.getItem('aurora-google-session-v1') ?? 'null')?.profile;
    if (typeof profile?.name !== 'string' || !profile.name.trim()) return null;
    const valid = { name: profile.name, ...(typeof profile.avatar === 'string' && profile.avatar.startsWith('https://') ? { avatar: profile.avatar } : {}) };
    rememberGoogleProfile(storage, valid);
    return valid;
  } catch { return null; }
}
export function forgetGoogleProfile(storage: Store) { try { storage.removeItem(KEY); } catch { /* Best effort logout. */ } }
