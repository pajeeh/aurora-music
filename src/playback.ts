import type { Track } from './types';

export function nextTrack(queue: Track[], id: string, direction: 1 | -1): Track | undefined {
  const index = queue.findIndex(track => track.id === id);
  return index < 0 ? queue[0] : queue[index + direction];
}
export function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  return total >= 3600 ? `${Math.floor(total / 3600)}:${String(Math.floor(total / 60) % 60).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}` : `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
export function validTracks(value: unknown): Track[] {
  if (!Array.isArray(value)) return [];
  const keys = ['id', 'title', 'artist', 'album', 'duration', 'artwork', 'accent'] as const;
  return value.filter((track): track is Track => track && keys.every(key => typeof track[key] === 'string') && /^[\w-]{11}$/.test(track.id));
}
export function readTracks(key: string, fallback: Track[]): Track[] {
  try { const raw = localStorage.getItem(key); return raw === null ? fallback : validTracks(JSON.parse(raw)); } catch { return fallback; }
}
