import type { Track } from './types';
export type Collection = { id: string; title: string; tracks: Track[] };
export const COLLECTIONS_KEY = 'aurora-collections-v1';
export function createCollection(title: string, id: string): Collection {
  if (!title.trim()) throw new Error('Dê um nome à playlist.');
  return { id, title: title.trim().slice(0, 100), tracks: [] };
}
export function addToCollection(collection: Collection, track: Track): Collection {
  return { ...collection, tracks: collection.tracks.some(item => item.id === track.id) ? collection.tracks : [...collection.tracks, track] };
}
export function readCollections(storage: Pick<Storage, 'getItem'>): Collection[] {
  try {
    const data: unknown = JSON.parse(storage.getItem(COLLECTIONS_KEY) ?? '[]');
    if (!Array.isArray(data)) return [];
    return data.filter(item => item && typeof item.id === 'string' && typeof item.title === 'string' && Array.isArray(item.tracks))
      .map(item => ({ id: item.id, title: item.title, tracks: item.tracks.filter((track: Track) => track && /^[\w-]{11}$/.test(track.id) && ['title','artist','album','artwork','duration','accent'].every(key => typeof (track as unknown as Record<string, unknown>)[key] === 'string')) }));
  } catch { return []; }
}
