import assert from 'node:assert/strict';
import test from 'node:test';
import { requestGoogleToken, YOUTUBE_READ_SCOPE } from '../src/google-token.ts';

// Test the real adapter at Google's callback boundary, without credentials or network.
function googleBoundary() {
  let callbackConfig;
  let requested = false;
  return {
    oauth: { initTokenClient(config) {
      callbackConfig = config;
      return { requestAccessToken() { requested = true; } };
    } },
    get config() { return callbackConfig; },
    get requested() { return requested; }
  };
}

test('opens synchronously from the click and accepts the authorized read scope', async () => {
  const google = googleBoundary();
  const result = requestGoogleToken(google.oauth, 'test-client');
  assert.equal(google.requested, true);
  assert.equal(google.config.scope, YOUTUBE_READ_SCOPE);
  assert.equal(google.config.include_granted_scopes, false);
  google.config.callback({ access_token: 'test-only-token', scope: YOUTUBE_READ_SCOPE });
  assert.equal(await result, 'test-only-token');
});

for (const [type, message] of [
  ['popup_closed', /janela do Google foi fechada/],
  ['popup_failed_to_open', /Não foi possível abrir/],
  ['unknown', /Não foi possível concluir/]
]) {
  test(`finishes instead of hanging on ${type}`, async () => {
    const google = googleBoundary();
    const result = requestGoogleToken(google.oauth, 'test-client');
    const rejected = assert.rejects(result, message);
    google.config.error_callback({ type });
    await rejected;
  });
}

test('access_denied explains the tester/permission requirement', async () => {
  const google = googleBoundary();
  const result = requestGoogleToken(google.oauth, 'test-client');
  const rejected = assert.rejects(result, /lista de testadores/);
  google.config.callback({ error: 'access_denied' });
  await rejected;
});

test('does not use a token missing the requested scope', async () => {
  const google = googleBoundary();
  const result = requestGoogleToken(google.oauth, 'test-client');
  const rejected = assert.rejects(result, /permissão de leitura/);
  google.config.callback({ access_token: 'test-only-token', scope: 'openid' });
  await rejected;
});

test('cancel ignores a late response and allows a fresh attempt', async () => {
  const google = googleBoundary();
  const controller = new AbortController();
  const result = requestGoogleToken(google.oauth, 'test-client', controller.signal);
  const rejected = assert.rejects(result, /cancelada/);
  controller.abort();
  google.config.callback({ access_token: 'late-test-token', scope: YOUTUBE_READ_SCOPE });
  await rejected;
  const retried = requestGoogleToken(google.oauth, 'test-client');
  google.config.callback({ access_token: 'fresh-test-token', scope: YOUTUBE_READ_SCOPE });
  assert.equal(await retried, 'fresh-test-token');
});

test('times out when Google never responds', async context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const google = googleBoundary();
  const result = requestGoogleToken(google.oauth, 'test-client');
  const rejected = assert.rejects(result, /não foi concluída/);
  context.mock.timers.tick(120_000);
  await rejected;
});
