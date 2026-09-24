import test from 'node:test';
import assert from 'node:assert/strict';
import {
  exportLibraryJson,
  parseLibraryBackup,
  mergeLibraryData,
  LIKED_TRACKS_KEY,
} from '../src/library-backup.ts';
import { COLLECTIONS_KEY } from '../src/collections.ts';

const trackA = {
  id: 'aaaaaaaaaaa',
  title: 'Track A',
  artist: 'Artist A',
  album: 'Album A',
  artwork: 'https://example.com/a.jpg',
  duration: '3:00',
  accent: '#7c5cff',
};

const trackB = {
  id: 'bbbbbbbbbbb',
  title: 'Track B',
  artist: 'Artist B',
  album: 'Album B',
  artwork: 'https://example.com/b.jpg',
  duration: '4:00',
  accent: '#29c7ac',
};

const collectionA = {
  id: 'col-1',
  title: 'Rock Favorites',
  tracks: [trackA],
};

test('exports library data as clean JSON', () => {
  const store = new Map([
    [COLLECTIONS_KEY, JSON.stringify([collectionA])],
    [LIKED_TRACKS_KEY, JSON.stringify([trackB])],
  ]);
  const storage = { getItem: key => store.get(key) ?? null };

  const exported = exportLibraryJson(storage);
  const parsed = JSON.parse(exported);

  assert.equal(parsed.version, 1);
  assert.equal(parsed.collections.length, 1);
  assert.equal(parsed.collections[0].title, 'Rock Favorites');
  assert.equal(parsed.likedTracks.length, 1);
  assert.equal(parsed.likedTracks[0].id, 'bbbbbbbbbbb');
});

test('parses and validates backup data rejecting malformed items', () => {
  const validJson = JSON.stringify({
    version: 1,
    collections: [collectionA],
    likedTracks: [trackA, { id: 'invalid_short', title: 'bad' }],
  });

  const result = parseLibraryBackup(validJson);
  assert.equal(result.collections.length, 1);
  assert.equal(result.likedTracks.length, 1);
  assert.equal(result.likedTracks[0].id, 'aaaaaaaaaaa');

  assert.throws(() => parseLibraryBackup('not json'), /não é um JSON legível/);
});

test('merges imported data into existing library without duplicate collections or tracks', () => {
  const existingCol = [collectionA];
  const importedCol = [
    {
      id: 'col-1',
      title: 'Rock Favorites',
      tracks: [trackA, trackB],
    },
    {
      id: 'col-2',
      title: 'Jazz',
      tracks: [trackB],
    },
  ];

  const merged = mergeLibraryData(
    existingCol,
    importedCol,
    [trackA],
    [trackA, trackB]
  );

  assert.equal(merged.collections.length, 2);
  assert.equal(merged.collectionsAdded, 1);
  const col1 = merged.collections.find(c => c.id === 'col-1');
  assert.equal(col1?.tracks.length, 2);

  assert.equal(merged.likedTracks.length, 2);
  assert.equal(merged.likedAdded, 1);
});
