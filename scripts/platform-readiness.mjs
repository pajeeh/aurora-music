import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'));
const serviceWorker = readFileSync('public/sw.js', 'utf8');

assert.equal(manifest.id, '/aurora-music/');
assert.equal(manifest.scope, '/aurora-music/');
assert.match(manifest.start_url, /^\/aurora-music\//);
assert.equal(manifest.display, 'standalone');
assert.ok(manifest.display_override.includes('window-controls-overlay'));
assert.equal(manifest.prefer_related_applications, false);
assert.ok(manifest.icons.some(icon => icon.sizes === '192x192' && icon.purpose.includes('any')));
assert.ok(manifest.icons.some(icon => icon.sizes === '512x512' && icon.purpose.includes('any')));
assert.ok(manifest.icons.some(icon => icon.sizes === '512x512' && icon.purpose.includes('maskable')));
assert.ok(manifest.screenshots.some(item => item.form_factor === 'narrow'));
assert.ok(manifest.screenshots.some(item => item.form_factor === 'wide'));
for (const item of [...manifest.icons, ...manifest.screenshots]) {
  assert.ok(existsSync(`public/${item.src}`), `Arquivo ausente no manifesto: ${item.src}`);
}
assert.match(serviceWorker, /SKIP_WAITING/);
assert.match(serviceWorker, /offline\.html/);

if (existsSync('platforms/android/twa-manifest.json')) {
  const twa = JSON.parse(readFileSync('platforms/android/twa-manifest.json', 'utf8'));
  assert.equal(twa.packageId, 'com.pajeeh.aurora');
  assert.equal(twa.minSdkVersion, 21);
  assert.equal(twa.enableNotifications, false);
  assert.ok(!twa.signingKey.path.includes('Users'), 'O caminho da chave Android deve ser relativo.');
  const gradle = readFileSync('platforms/android/app/build.gradle', 'utf8');
  assert.match(gradle, /targetSdkVersion 36/);
  assert.match(gradle, /compileSdkVersion 36/);
  console.log('Android: projeto TWA reproduzível validado.');
}

console.log('PWA base: pronta para instalação em Windows e Android.');
console.log('Windows Store: requer identidade reservada no Partner Center para gerar o MSIX.');
console.log('Android TWA: requer domínio próprio, Digital Asset Links e chave de assinatura.');
