import test from 'node:test';
import assert from 'node:assert/strict';
import { rememberGoogleProfile, readRememberedGoogleProfile, forgetGoogleProfile } from '../src/account-memory.ts';
import { readGoogleSession } from '../src/auth-session.ts';
function storage() { const data = new Map(); return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key,value), removeItem: key => data.delete(key) }; }
test('authorization expiry does not forget the account identity', () => {
  const store = storage();
  rememberGoogleProfile(store, { name: 'Listener' });
  store.setItem('aurora-google-session-v1', JSON.stringify({ token:'expired',expiresAt:100,profile:{name:'Listener'} }));
  assert.equal(readGoogleSession(store, 200), null);
  assert.deepEqual(readRememberedGoogleProfile(store), { name: 'Listener' });
});
test('migrates the remembered profile from an expired legacy session without restoring its token', () => {
  const store = storage();
  store.setItem('aurora-google-session-v1', JSON.stringify({token:'expired',expiresAt:100,profile:{name:'Legacy'}}));
  assert.deepEqual(readRememberedGoogleProfile(store), {name:'Legacy'});
  assert.equal(readGoogleSession(store, 200), null);
  forgetGoogleProfile(store);
  assert.equal(readRememberedGoogleProfile(store), null);
});
