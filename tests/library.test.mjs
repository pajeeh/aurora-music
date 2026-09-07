import test from 'node:test';
import assert from 'node:assert/strict';
import { listPlaylists, listPlaylistTracks } from '../src/library-api.ts';
import { nextTrack, formatTime, validTracks } from '../src/playback.ts';

test('library uses a read-only authorized request and returns pagination', async context => {
  context.mock.method(globalThis, 'fetch', async (url, options) => {
    const parsed = new URL(url);
    assert.equal(parsed.pathname, '/youtube/v3/playlists');
    assert.equal(parsed.searchParams.get('mine'), 'true');
    assert.equal(parsed.searchParams.get('pageToken'), 'page-2');
    assert.equal(options.headers.Authorization, 'Bearer test-token');
    assert.equal(parsed.searchParams.has('key'), false);
    return Response.json({ items: [{ id: 'playlist', snippet: { title: 'Minha playlist' }, contentDetails: { itemCount: 2 } }], nextPageToken: 'page-3' });
  });
  const page = await listPlaylists('test-token', 'page-2');
  assert.equal(page.items[0].title, 'Minha playlist'); assert.equal(page.items[0].count, 2); assert.equal(page.nextPageToken, 'page-3');
});

test('playlist keeps order and skips unavailable entries', async context => {
  context.mock.method(globalThis, 'fetch', async () => Response.json({ items: [
    { snippet: { title: 'Primeira', videoOwnerChannelTitle: 'Artista', resourceId: { videoId: 'abcdefghijk' } } },
    { snippet: { title: 'Private video', resourceId: { videoId: '12345678901' } } },
    { snippet: { title: 'Deleted video', resourceId: { videoId: '12345678902' } } },
    { snippet: { title: 'Segunda', resourceId: { videoId: '12345678903' } } }
  ] }));
  const page = await listPlaylistTracks('test-token', { id: 'playlist', title: 'Coleção' });
  assert.deepEqual(page.items.map(track => track.title), ['Primeira', 'Segunda']);
  assert.equal(page.items[0].artist, 'Artista'); assert.equal(page.items[0].album, 'Coleção'); assert.equal(page.skipped, 2);
});

for (const [status, message] of [[401, /expirou/], [403, /cota/], [500, /Tente novamente/]]) {
  test(`library reports HTTP ${status}`, async context => {
    context.mock.method(globalThis, 'fetch', async () => new Response('', { status }));
    await assert.rejects(listPlaylists('test-token'), message);
  });
}
test('queue advances in order and stops at the end instead of looping', () => {
  const queue = [{ id: 'one' }, { id: 'two' }];
  assert.equal(nextTrack(queue, 'one', 1)?.id, 'two');
  assert.equal(nextTrack(queue, 'two', 1), undefined);
  assert.equal(nextTrack(queue, 'one', -1), undefined);
  assert.equal(nextTrack([], 'missing', 1), undefined);
});
test('real playback timestamps cover minutes, hours and invalid values', () => {
  assert.equal(formatTime(62.7), '1:02'); assert.equal(formatTime(3661), '1:01:01'); assert.equal(formatTime(NaN), '0:00');
});
test('damaged saved tracks are rejected', () => {
  assert.deepEqual(validTracks(null), []); assert.deepEqual(validTracks([{ id: 'invalid' }]), []);
});
