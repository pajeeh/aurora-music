import http from 'node:http';
import { Firestore } from '@google-cloud/firestore';
import { normalizePayload, renderSvg } from './core.js';

const db = new Firestore();
const origin = process.env.AURORA_ORIGIN || 'https://pajeeh.github.io';
const allowedEmail = process.env.ALLOWED_EMAIL;
const clientId = process.env.GOOGLE_CLIENT_ID;
const ref = db.doc('aurora/public-now-playing');

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

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'OPTIONS') return send(res, 204, '');
    if (req.method === 'GET' && url.pathname === '/health') return send(res, 200, JSON.stringify({ ok: true }));
    if (req.method === 'GET' && url.pathname === '/now-playing.svg') {
      const snapshot = await ref.get();
      return send(res, 200, renderSvg(snapshot.data()), 'image/svg+xml');
    }
    if (req.method === 'GET' && url.pathname === '/api/now-playing') {
      const snapshot = await ref.get();
      return send(res, 200, JSON.stringify(snapshot.data() || {}));
    }
    if (req.method === 'POST' && url.pathname === '/api/now-playing') {
      if (!await authenticate(req)) return send(res, 401, JSON.stringify({ error: 'unauthorized' }));
      const payload = await readBody(req);
      const value = normalizePayload(payload);
      if (!value) return send(res, 400, JSON.stringify({ error: 'invalid_payload' }));
      await ref.set(value);
      return send(res, 200, JSON.stringify(value));
    }
    return send(res, 404, JSON.stringify({ error: 'not_found' }));
  } catch (error) {
    console.error(error);
    return send(res, error?.message === 'too_large' ? 413 : 500, JSON.stringify({ error: 'server_error' }));
  }
}).listen(Number(process.env.PORT || 8080));
