export const escapeXml = value => String(value ?? '').replace(/[<>&"']/g, char => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[char]));

export function normalizePayload(payload) {
  const track = payload?.track;
  if (!track?.id || !track?.title || !track?.artist || typeof payload.playing !== 'boolean') return null;
  return {
    track: {
      id: String(track.id).slice(0, 64),
      title: String(track.title).slice(0, 160),
      artist: String(track.artist).slice(0, 160),
      artwork: String(track.artwork || '').slice(0, 500)
    },
    playing: payload.playing,
    updatedAt: new Date().toISOString()
  };
}

export function renderSvg(data = {}, now = Date.now()) {
  const age = now - Date.parse(data.updatedAt);
  const live = data.playing && Number.isFinite(age) && age >= 0 && age < 180000;
  const shorten = (value, limit) => { const chars = Array.from(String(value)); return escapeXml(chars.length > limit ? chars.slice(0, limit - 1).join('') + '…' : chars.join('')); };
  const title = shorten(data.track?.title || 'Nada tocando agora', 38);
  const artist = shorten(data.track?.artist || 'Aurora Music', 50);
  const status = live ? 'TOCANDO AGORA' : data.track ? 'ÚLTIMA FAIXA' : 'AURORA MUSIC';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="180" viewBox="0 0 720 180" role="img" aria-label="Aurora: ${title}"><defs><linearGradient id="g"><stop stop-color="#101529"/><stop offset="1" stop-color="#241c3b"/></linearGradient><linearGradient id="neon" x2="1" y2="1"><stop stop-color="#75eaff"/><stop offset=".6" stop-color="#a392ff"/><stop offset="1" stop-color="#e59bf3"/></linearGradient></defs><rect width="720" height="180" rx="22" fill="url(#g)"/><rect x="1" y="1" width="718" height="178" rx="21" fill="none" stroke="#393554"/><g stroke="url(#neon)" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="m48 118 32-64 32 64M61 95h38" stroke-width="7"/><ellipse cx="80" cy="84" rx="52" ry="24" transform="rotate(-20 80 84)" stroke-width="3"/></g><text x="150" y="51" fill="#75eaff" font-family="Arial,sans-serif" font-size="14" font-weight="700" letter-spacing="2">${status}</text><text x="150" y="92" fill="#edf0ff" font-family="Arial,sans-serif" font-size="24" font-weight="700">${title}</text><text x="150" y="124" fill="#b4bdd4" font-family="Arial,sans-serif" font-size="17">${artist}</text><text x="150" y="151" fill="#a392ff" font-family="Arial,sans-serif" font-size="12">Aurora · reprodução oficial pelo YouTube</text></svg>`;
}
