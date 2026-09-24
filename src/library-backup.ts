import type { Collection } from './collections.ts';
import type { Track } from './types.ts';
import { COLLECTIONS_KEY } from './collections.ts';

export const LIKED_TRACKS_KEY = 'aurora-liked-tracks-v1';
export const QUEUE_KEY = 'aurora-queue-v1';

export type AuroraBackupData = {
  version: 1;
  exportedAt: string;
  collections: Collection[];
  likedTracks: Track[];
};

function isValidTrack(item: unknown): item is Track {
  if (!item || typeof item !== 'object') return false;
  const t = item as Record<string, unknown>;
  return (
    typeof t.id === 'string' &&
    /^[\w-]{11}$/.test(t.id) &&
    typeof t.title === 'string' &&
    typeof t.artist === 'string' &&
    typeof t.album === 'string' &&
    typeof t.artwork === 'string' &&
    typeof t.duration === 'string' &&
    typeof t.accent === 'string'
  );
}

function isValidCollection(item: unknown): item is Collection {
  if (!item || typeof item !== 'object') return false;
  const c = item as Record<string, unknown>;
  return (
    typeof c.id === 'string' &&
    Boolean(c.id.trim()) &&
    typeof c.title === 'string' &&
    Boolean(c.title.trim()) &&
    Array.isArray(c.tracks) &&
    c.tracks.every(isValidTrack)
  );
}

export function exportLibraryJson(storage: Pick<Storage, 'getItem'>): string {
  let collections: Collection[] = [];
  try {
    const raw = JSON.parse(storage.getItem(COLLECTIONS_KEY) ?? '[]');
    if (Array.isArray(raw)) {
      collections = raw.filter(isValidCollection);
    }
  } catch {
    collections = [];
  }

  let likedTracks: Track[] = [];
  try {
    const raw = JSON.parse(storage.getItem(LIKED_TRACKS_KEY) ?? '[]');
    if (Array.isArray(raw)) {
      likedTracks = raw.filter(isValidTrack);
    }
  } catch {
    likedTracks = [];
  }

  const payload: AuroraBackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    collections,
    likedTracks,
  };

  return JSON.stringify(payload, null, 2);
}

export function parseLibraryBackup(json: string): {
  collections: Collection[];
  likedTracks: Track[];
} {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('Arquivo de backup inválido: não é um JSON legível.');
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Arquivo de backup corrompido ou vazio.');
  }

  const raw = data as Record<string, unknown>;
  const collections: Collection[] = [];
  if (Array.isArray(raw.collections)) {
    for (const c of raw.collections) {
      if (isValidCollection(c)) collections.push(c);
    }
  }

  const likedTracks: Track[] = [];
  if (Array.isArray(raw.likedTracks)) {
    for (const t of raw.likedTracks) {
      if (isValidTrack(t)) likedTracks.push(t);
    }
  }

  return { collections, likedTracks };
}

export function mergeLibraryData(
  existingCollections: Collection[],
  importedCollections: Collection[],
  existingLiked: Track[],
  importedLiked: Track[]
): {
  collections: Collection[];
  likedTracks: Track[];
  collectionsAdded: number;
  likedAdded: number;
} {
  const collectionMap = new Map<string, Collection>();
  for (const c of existingCollections) {
    collectionMap.set(c.id, c);
  }

  let collectionsAdded = 0;
  for (const imp of importedCollections) {
    if (!collectionMap.has(imp.id)) {
      collectionMap.set(imp.id, imp);
      collectionsAdded++;
    } else {
      // Merge tracks if same playlist ID exists
      const current = collectionMap.get(imp.id)!;
      const trackMap = new Map<string, Track>();
      for (const t of current.tracks) trackMap.set(t.id, t);
      for (const t of imp.tracks) trackMap.set(t.id, t);
      collectionMap.set(imp.id, {
        ...current,
        tracks: Array.from(trackMap.values()),
      });
    }
  }

  const likedMap = new Map<string, Track>();
  for (const t of existingLiked) {
    likedMap.set(t.id, t);
  }

  let likedAdded = 0;
  for (const imp of importedLiked) {
    if (!likedMap.has(imp.id)) {
      likedMap.set(imp.id, imp);
      likedAdded++;
    }
  }

  return {
    collections: Array.from(collectionMap.values()),
    likedTracks: Array.from(likedMap.values()),
    collectionsAdded,
    likedAdded,
  };
}
