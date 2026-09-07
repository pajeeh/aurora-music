import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizePayload, renderSvg } from '../core.js';

test('rejects incomplete or malformed updates', () => {
  assert.equal(normalizePayload({}), null);
  assert.equal(normalizePayload({ track: { id: 'x', title: 'x', artist: 'x' }, playing: 'yes' }), null);
});

test('normalizes bounded public metadata', () => {
  const value = normalizePayload({ track: { id: 'id', title: 't'.repeat(200), artist: 'artist', artwork: 'a'.repeat(700) }, playing: true });
  assert.equal(value.track.title.length, 160);
  assert.equal(value.track.artwork.length, 500);
  assert.equal(value.playing, true);
  assert.match(value.updatedAt, /^\d{4}-/);
});

test('escapes untrusted metadata before rendering SVG', () => {
  const svg = renderSvg({ track: { title: '<script>alert(1)</script>', artist: 'A & B' }, playing: true });
  assert.doesNotMatch(svg, /<script>/);
  assert.match(svg, /&lt;script&gt;/);
  assert.match(svg, /A &amp; B/);
  assert.match(svg, /TOCANDO AGORA/);
});
