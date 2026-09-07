import http from 'node:http';
import { Firestore } from '@google-cloud/firestore';

const db = new Firestore();
const origin = process.env.AURORA_ORIGIN || 'https://pajeeh.github.io';
const allowedEmail = process.env.ALLOWED_EMAIL;
const clientId = process.env.GOOGLE_CLIENT_ID;
const ref = db.doc('aurora/public-now-playing');

const escapeXml = value => String(value ?? '').replace(/[<>&"']/g, char => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[char]));
const cors = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const send = (res, status, body, type = 'application/json') => { res.writeHead(status, { ...cors, 'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'no-store' }); res.end(body); };

async function authenticate(req) {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token || !allowedEmail || !clientId) return false;
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(token)}`, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) return false;
  const identity = await response.json();
  return identity.email_verified === 'true' && identity.email === allowedEmail && identity.aud === clientId;
}

async function readBody(req) {
  let body = '';
  for await (const chunk of req) { body += chunk; if (body.length > 20_000) throw new Error('too_large'); }
  return JSON.parse(body);
}

function svg(data = {}) {
  const title = escapeXml(data.track?.title || 'Nada tocando agora');
  const artist = escapeXml(data.track?.artist || 'Aurora Music');
  const status = data.playing ? 'TOCANDO AGORA' : 'ÚLTIMA FAIXA';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="180" role="img" aria-label="Aurora: ${title}"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#17131d"/><stop offset="1" stop-color="#2a1c42"/></linearGradient></defs><rect width="720" height="180" rx="22" fill="url(#g)"/><circle cx="80" cy="90" r="48" fill="#9b7cff"/><path d="M68 63v54l38-27z" fill="#120d19"/><text x="150" y="51" fill="#bba7ff" font-family="Arial,sans-serif" font-size="14" font-weight="700" letter-spacing="2">${status}</text><text x="150" y="92" fill="#fff" font-family="Arial,sans-serif" font-size="27" font-weight="700">${title.slice(0,38)}</text><text x="150" y="124" fill="#b8afc0" font-family="Arial,sans-serif" font-size="18">${artist.slice(0,50)}</text><text x="150" y="151" fill="#776d82" font-family="Arial,sans-serif" font-size="12">Aurora · reprodução oficial pelo YouTube</text></svg>`;
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'OPTIONS') return send(res, 204, '');
    if (req.method === 'GET' && url.pathname === '/health') return send(res, 200, JSON.stringify({ ok: true }));
    if (req.method === 'GET' && url.pathname === '/now-playing.svg') {
      const snapshot = await ref.get();
      return send(res, 200, svg(snapshot.data()), 'image/svg+xml');
    }
    if (req.method === 'GET' && url.pathname === '/api/now-playing') {
      const snapshot = await ref.get();
      return send(res, 200, JSON.stringify(snapshot.data() || {}));
    }
    if (req.method === 'POST' && url.pathname === '/api/now-playing') {
      if (!await authenticate(req)) return send(res, 401, JSON.stringify({ error: 'unauthorized' }));
      const payload = await readBody(req);
      const track = payload?.track;
      if (!track?.id || !track?.title || !track?.artist || typeof payload.playing !== 'boolean') return send(res, 400, JSON.stringify({ error: 'invalid_payload' }));
      const value = { track: { id: String(track.id).slice(0,64), title: String(track.title).slice(0,160), artist: String(track.artist).slice(0,160), artwork: String(track.artwork || '').slice(0,500) }, playing: payload.playing, updatedAt: new Date().toISOString() };
      await ref.set(value);
      return send(res, 200, JSON.stringify(value));
    }
    return send(res, 404, JSON.stringify({ error: 'not_found' }));
  } catch (error) {
    console.error(error);
    return send(res, error?.message === 'too_large' ? 413 : 500, JSON.stringify({ error: 'server_error' }));
  }
}).listen(Number(process.env.PORT || 8080));
