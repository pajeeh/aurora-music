export const escapeXml = value => String(value ?? '').replace(/[<>&"']/g, char => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[char]));

export function normalizePayload(payload) {
  const track = payload?.track;
  if (!track?.id || !track?.title || !track?.artist || typeof payload.playing !== 'boolean') return null;
  const artworkData = /^data:image\/(?:jpeg|png|webp);base64,[a-zA-Z0-9+/=]+$/.test(track.artworkData || '') && track.artworkData.length <= 120000 ? track.artworkData : '';
  return { track: { id: String(track.id).slice(0, 64), title: String(track.title).slice(0, 160), artist: String(track.artist).slice(0, 160), artwork: String(track.artwork || '').slice(0, 500), artworkData }, playing: payload.playing, updatedAt: new Date().toISOString() };
}

const bar = (x, values, delay) => `<rect x="${x}" y="194" width="6" height="18" rx="3" fill="url(#signal)"><animate attributeName="y" values="${values.map(v => 212 - v).join(';')}" dur="1.15s" begin="${delay}s" repeatCount="indefinite"/><animate attributeName="height" values="${values.join(';')}" dur="1.15s" begin="${delay}s" repeatCount="indefinite"/></rect>`;

export function renderSvg(data = {}, now = Date.now()) {
  const age = now - Date.parse(data.updatedAt);
  const live = data.playing && Number.isFinite(age) && age >= 0 && age < 180000;
  const shorten = (value, limit) => { const chars = Array.from(String(value)); return escapeXml(chars.length > limit ? chars.slice(0, limit - 1).join('') + '…' : chars.join('')); };
  const title = shorten(data.track?.title || 'Nada tocando agora', 36);
  const artist = shorten(data.track?.artist || 'Abra o Aurora e dê o play', 52);
  const titleLength = Array.from(String(data.track?.title || '')).length;
  const titleSize = titleLength > 31 ? 29 : titleLength > 24 ? 33 : 38;
  const art = data.track?.artworkData || '';
  const signal = live
    ? [[10,30,18,42,10],[18,44,12,34,18],[30,14,48,20,30],[12,38,22,50,12],[24,52,16,38,24],[14,34,46,18,14],[28,16,40,54,28],[10,42,24,36,10],[22,48,14,32,22],[16,30,52,20,16]].map((values, i) => bar(687 + i * 13, values, -i * .1)).join('')
    : Array.from({length:10}, (_, i) => `<rect x="${687 + i * 13}" y="${201 - (i % 3) * 3}" width="6" height="${11 + (i % 3) * 3}" rx="3" fill="url(#signal)" opacity=".38"/>`).join('');
  const cover = art
    ? `<image href="${art}" x="31" y="35" width="182" height="182" preserveAspectRatio="xMidYMid slice" clip-path="url(#cover)"/><rect x="31" y="35" width="182" height="182" rx="22" fill="url(#coverShade)"/>`
    : `<rect x="31" y="35" width="182" height="182" rx="22" fill="url(#coverFallback)"/><g transform="translate(122 126)" stroke="url(#brand)" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="m-32 38 32-68 34 68M-20 16h41" stroke-width="7"/><ellipse rx="61" ry="25" transform="rotate(-18)" stroke-width="3"/></g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="280" viewBox="0 0 900 280" role="img" aria-label="Aurora: ${title}">
  <title>Aurora — ${title}, ${artist}</title>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0a0d1b"/><stop offset=".52" stop-color="#101326"/><stop offset="1" stop-color="#171128"/></linearGradient>
    <linearGradient id="brand"><stop stop-color="#65e9ff"/><stop offset=".52" stop-color="#9a8cff"/><stop offset="1" stop-color="#e498f4"/></linearGradient>
    <linearGradient id="signal" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#70e9f5"/><stop offset="1" stop-color="#ad8cf8"/></linearGradient>
    <linearGradient id="play"><stop stop-color="#70e5fb"/><stop offset="1" stop-color="#b78af8"/></linearGradient>
    <linearGradient id="coverFallback" x2="1" y2="1"><stop stop-color="#132a46"/><stop offset=".5" stop-color="#24224d"/><stop offset="1" stop-color="#3b2045"/></linearGradient>
    <linearGradient id="coverShade" x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stop-color="#080a14" stop-opacity="0"/><stop offset="1" stop-color="#080a14" stop-opacity=".42"/></linearGradient>
    <radialGradient id="glow"><stop stop-color="#7657db" stop-opacity=".34"/><stop offset="1" stop-color="#7657db" stop-opacity="0"/></radialGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="30"/></filter><filter id="logoGlow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <clipPath id="frame"><rect x="2" y="2" width="896" height="276" rx="29"/></clipPath><clipPath id="cover"><rect x="31" y="35" width="182" height="182" rx="22"/></clipPath>
    <style>.aurora-a{animation:float 8s ease-in-out infinite alternate}.aurora-b{animation:float 11s ease-in-out -4s infinite alternate-reverse}.pulse{animation:pulse 1.5s ease-out infinite}.wave{animation:wave 2.8s ease-in-out infinite alternate}.shine{animation:shine 5s linear infinite}@keyframes float{to{transform:translate(35px,-7px)}}@keyframes pulse{0%{r:4;opacity:.85}100%{r:14;opacity:0}}@keyframes wave{to{transform:translateY(-4px)}}@keyframes shine{from{transform:translateX(-220px)}to{transform:translateX(940px)}}@media(prefers-reduced-motion:reduce){*{animation:none!important}}</style>
  </defs>
  <g clip-path="url(#frame)">
    <rect width="900" height="280" fill="url(#bg)"/><ellipse class="aurora-a" cx="735" cy="40" rx="300" ry="155" fill="url(#glow)" filter="url(#soft)"/><ellipse class="aurora-b" cx="585" cy="292" rx="280" ry="90" fill="#126578" opacity=".12" filter="url(#soft)"/>
    <path class="aurora-a" d="M328 31C483 80 604-22 913 45" fill="none" stroke="#8273da" stroke-width="2" opacity=".38"/><path class="aurora-b" d="M420 258C596 194 720 302 932 211" fill="none" stroke="#4bc4d2" stroke-width="2" opacity=".24"/>
    ${cover}<rect x="31" y="35" width="182" height="182" rx="22" fill="none" stroke="#332d4d" stroke-width="2"/>
    <g transform="translate(61 188)"><rect width="122" height="23" rx="11.5" fill="#0b0d19" opacity=".84"/><circle cx="15" cy="11.5" r="3.5" fill="#76edf0"/><text x="27" y="15.5" fill="#dfe6ff" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="10" font-weight="700">YOUTUBE</text></g>
    <g font-family="Inter,Segoe UI,Arial,sans-serif">
      <text x="252" y="48" fill="#75ddeb" font-size="11" font-weight="800" letter-spacing="2.8">AURORA MUSIC</text>
      <g transform="translate(252 61)"><rect width="${live ? 116 : 136}" height="28" rx="14" fill="${live ? '#16323b' : '#211d31'}" stroke="${live ? '#4fbfc5' : '#514768'}"/><circle cx="16" cy="14" r="4" fill="${live ? '#6fe8e2' : '#807692'}"/>${live ? '<circle class="pulse" cx="16" cy="14" r="4" fill="none" stroke="#6fe8e2"/>' : ''}<text x="29" y="18" fill="${live ? '#8cf4eb' : '#b8afc8'}" font-size="10" font-weight="800" letter-spacing="1.2">${live ? 'TOCANDO AGORA' : data.track ? 'ÚLTIMA FAIXA' : 'EM REPOUSO'}</text></g>
      <text x="252" y="132" fill="#f4f3fb" font-size="${titleSize}" font-weight="760" letter-spacing="-.7">${title}</text><text x="252" y="163" fill="#aeb3cc" font-size="17">${artist}</text>
      <text x="252" y="191" fill="#716b8d" font-size="11" font-weight="700">Sua música. Suas regras.</text>
      <g transform="translate(252 213)"><circle cx="22" cy="22" r="22" fill="url(#play)"/><path d="m18 14 13 8-13 8Z" fill="#111426"/><path d="M62 22h351" stroke="#37374c" stroke-width="4" stroke-linecap="round"/><path d="M62 22h156" stroke="url(#play)" stroke-width="4" stroke-linecap="round"><animate attributeName="stroke-dasharray" values="0 351;156 351;0 351" dur="14s" repeatCount="indefinite"/></path><circle cx="218" cy="22" r="5" fill="#c6a3fb"/></g>
      <g class="wave">${signal}</g><text x="687" y="238" fill="#77708f" font-size="10" font-weight="700" letter-spacing="1.5">AURORA CONNECT</text>
    </g>
    <g transform="translate(842 36)" stroke="url(#brand)" fill="none" stroke-linecap="round" filter="url(#logoGlow)"><path d="m-13 17 13-28 14 28M-8 8h17" stroke-width="3"/><ellipse rx="24" ry="10" transform="rotate(-18)" stroke-width="1.5"/></g>
    <rect class="shine" x="-220" width="130" height="280" fill="#fff" opacity=".018" transform="skewX(-20)"/>
  </g>
  <rect x="1" y="1" width="898" height="278" rx="30" fill="none" stroke="url(#brand)" stroke-opacity=".42" stroke-width="2"/>
</svg>`;
}
