import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('public CSP permits every hosted Aurora API used by GitHub Pages', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const policy = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1] ?? '';

  assert.match(policy, /connect-src [^;]*https:\/\/aurora-edge\.aurora-edge\.workers\.dev/);
  assert.match(policy, /connect-src [^;]*https:\/\/www\.googleapis\.com/);
  assert.match(policy, /connect-src [^;]*https:\/\/lrclib\.net/);
});
