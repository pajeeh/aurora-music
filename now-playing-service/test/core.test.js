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
  assert.match(svg, /TOCANDO AGORA/);
  assert.match(svg, /animate attributeName="height"/);
  assert.match(svg, /repeatCount="indefinite"/);
});

test('closed clients expire while heartbeat keeps playback live', () => {
  const now = Date.parse('2026-09-18T12:00:00Z');
  const data = {track:{title:'Faixa',artist:'Artista'},playing:true,updatedAt:new Date(now-60000).toISOString()};
  assert.match(renderSvg(data,now), /TOCANDO AGORA/);
  assert.match(renderSvg(data,now+120000), /ÚLTIMA FAIXA/);
  assert.match(renderSvg({...data,playing:false},now), /ÚLTIMA FAIXA/);
  assert.doesNotMatch(renderSvg({...data,updatedAt:'invalid'},now), /TOCANDO AGORA/);
});

test('accepts bounded embedded artwork and rejects unsafe image data', () => {
  const valid = normalizePayload({track:{id:'id',title:'title',artist:'artist',artworkData:'data:image/jpeg;base64,aGVsbG8='},playing:true});
  const invalid = normalizePayload({track:{id:'id',title:'title',artist:'artist',artworkData:'javascript:alert(1)'},playing:true});
  assert.equal(valid.track.artworkData, 'data:image/jpeg;base64,aGVsbG8=');
  assert.equal(invalid.track.artworkData, '');
});

test('keeps the paused card still and accessible', () => {
  const svg = renderSvg({track:{title:'Faixa',artist:'Artista'},playing:false,updatedAt:new Date().toISOString()});
  assert.match(svg, /ÚLTIMA FAIXA/);
  assert.match(svg, /<title>Aurora/);
  assert.doesNotMatch(svg, /animateTransform/);
});

test('truncates text before escaping so long titles remain valid XML', () => {
  const svg=renderSvg({track:{title:'a'.repeat(34)+'& fim',artist:'Artista'}});
  assert.match(svg,/&amp;…/);
  assert.doesNotMatch(svg,/&am</);
});
