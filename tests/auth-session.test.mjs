import test from 'node:test';
import assert from 'node:assert/strict';
import { clearGoogleSession, readGoogleSession, saveGoogleSession } from '../src/auth-session.ts';

function storage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key), values };
}

test('restores a valid Google session after a page refresh', () => {
  const store = storage();
  const session = { token: 'short-lived-token', expiresAt: 4_000_000, profile: { name: 'Pajé' } };
  saveGoogleSession(store, session);
  assert.deepEqual(readGoogleSession(store, 1_000_000), session);
});

test('removes expired and damaged sessions instead of causing a login loop', () => {
  const store = storage();
  saveGoogleSession(store, { token: 'expired', expiresAt: 1_010_000, profile: { name: 'Pajé' } });
  assert.equal(readGoogleSession(store, 1_000_000), null);
  assert.equal(store.values.size, 0);
  store.setItem('aurora-google-session-v1', '{broken');
  assert.equal(readGoogleSession(store, 1_000_000), null);
});

test('logout helper removes only the Aurora Google session', () => {
  const store = storage(); store.setItem('other', 'keep'); saveGoogleSession(store, { token: 'x', expiresAt: 9_000_000, profile: { name: 'Pajé' } });
  clearGoogleSession(store);
  assert.equal(store.values.get('other'), 'keep'); assert.equal(readGoogleSession(store), null);
});
