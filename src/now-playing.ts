import type { Track } from './types';

const ENDPOINT = import.meta.env.VITE_NOW_PLAYING_ENDPOINT as string | undefined;

export function nowPlayingReady() { return Boolean(ENDPOINT); }

export async function publishNowPlaying(token: string, track: Track, playing: boolean, signal?: AbortSignal, keepalive = false) {
  if (!ENDPOINT) return;
  const response = await fetch(`${ENDPOINT.replace(/\/$/, '')}/api/now-playing`, {
    signal: keepalive ? undefined : signal ? AbortSignal.any([signal, AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000),
    method: 'POST',
    keepalive,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ track: { id: track.id, title: track.title, artist: track.artist, artwork: track.artwork }, playing })
  });
  if (!response.ok) throw new Error(`Falha ao publicar tocando agora (${response.status}).`);
}
