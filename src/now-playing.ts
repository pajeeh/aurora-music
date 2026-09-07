import type { Track } from './types';

const ENDPOINT = import.meta.env.VITE_NOW_PLAYING_ENDPOINT as string | undefined;

export function nowPlayingReady() { return Boolean(ENDPOINT); }

export async function publishNowPlaying(token: string, track: Track, playing: boolean) {
  if (!ENDPOINT) return;
  const response = await fetch(`${ENDPOINT}/api/now-playing`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ track: { id: track.id, title: track.title, artist: track.artist, artwork: track.artwork }, playing })
  });
  if (!response.ok) throw new Error(`Falha ao publicar tocando agora (${response.status}).`);
}
