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

export function renderSvg(data = {}) {
  const title = escapeXml(data.track?.title || 'Nada tocando agora');
  const artist = escapeXml(data.track?.artist || 'Aurora Music');
  const status = data.playing ? 'TOCANDO AGORA' : 'ÚLTIMA FAIXA';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="180" role="img" aria-label="Aurora: ${title}"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#17131d"/><stop offset="1" stop-color="#2a1c42"/></linearGradient></defs><rect width="720" height="180" rx="22" fill="url(#g)"/><circle cx="80" cy="90" r="48" fill="#9b7cff"/><path d="M68 63v54l38-27z" fill="#120d19"/><text x="150" y="51" fill="#bba7ff" font-family="Arial,sans-serif" font-size="14" font-weight="700" letter-spacing="2">${status}</text><text x="150" y="92" fill="#fff" font-family="Arial,sans-serif" font-size="27" font-weight="700">${title.slice(0,38)}</text><text x="150" y="124" fill="#b8afc0" font-family="Arial,sans-serif" font-size="18">${artist.slice(0,50)}</text><text x="150" y="151" fill="#776d82" font-family="Arial,sans-serif" font-size="12">Aurora · reprodução oficial pelo YouTube</text></svg>`;
}
