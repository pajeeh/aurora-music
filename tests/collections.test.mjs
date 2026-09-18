import test from 'node:test';
import assert from 'node:assert/strict';
import { readCollections, createCollection, addToCollection } from '../src/collections.ts';

const track = { id: 'abcdefghijk', title: 'Song', artist: 'Artist', album: 'YouTube', artwork: '', duration: '—', accent: '#9b7cff' };
test('collections survive reload without modifying legacy favorites', () => {
  const collection = addToCollection(createCollection(' My mix ', 'mix'), track);
  assert.equal(collection.title, 'My mix');
  assert.deepEqual(readCollections({ getItem: () => JSON.stringify([collection]) }), [collection]);
});
test('adding a track is immutable and duplicate-safe', () => {
  const original = createCollection('Mix', 'mix');
  const updated = addToCollection(original, track);
  assert.equal(original.tracks.length, 0);
  assert.equal(addToCollection(updated, track).tracks.length, 1);
});
test('rejects damaged collection storage and invalid track metadata', () => {
  assert.deepEqual(readCollections({ getItem: () => '{broken' }), []);
  assert.deepEqual(readCollections({ getItem: () => JSON.stringify([{ id: 1, title: 'bad', tracks: [] }]) }), []);
  assert.throws(() => createCollection('   ', 'mix'));
});
