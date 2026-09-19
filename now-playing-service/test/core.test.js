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
  const svg = renderSvg({ track: { title: '<script>alert(1)</script>', artist: 'A & B' }, playing: true, updatedAt: new Date().toISOString() });
  assert.doesNotMatch(svg, /<script>/);
  assert.match(svg, /&lt;script&gt;/);
  assert.match(svg, /A &amp; B/);
  assert.match(svg, /AO VIVO/);
  assert.match(svg, /animateTransform/);
  assert.match(svg, /repeatCount="indefinite"/);
});

test('closed clients expire while heartbeat keeps playback live', () => {
  const now = Date.parse('2026-09-18T12:00:00Z');
  const data = {track:{title:'Faixa',artist:'Artista'},playing:true,updatedAt:new Date(now-60000).toISOString()};
  assert.match(renderSvg(data,now), /AO VIVO/);
  assert.match(renderSvg(data,now+120000), /ÚLTIMA FAIXA/);
  assert.match(renderSvg({...data,playing:false},now), /ÚLTIMA FAIXA/);
  assert.doesNotMatch(renderSvg({...data,updatedAt:'invalid'},now), /AO VIVO/);
});

test('keeps the paused card still and accessible', () => {
  const svg = renderSvg({track:{title:'Faixa',artist:'Artista'},playing:false,updatedAt:new Date().toISOString()});
  assert.match(svg, /ÚLTIMA FAIXA/);
  assert.match(svg, /<title>Aurora/);
  assert.doesNotMatch(svg, /animateTransform/);
});

test('truncates text before escaping so long titles remain valid XML', () => {
  const svg=renderSvg({track:{title:'a'.repeat(36)+'& fim',artist:'Artista'}});
  assert.match(svg,/&amp;…/);
  assert.doesNotMatch(svg,/&am</);
});
