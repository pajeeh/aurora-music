export const escapeXml = value => String(value ?? '').replace(/[<>&"']/g, char => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[char]));

export function normalizePayload(payload) {
  const track = payload?.track;
  if (!track?.id || !track?.title || !track?.artist || typeof payload.playing !== 'boolean') return null;
  return { track: { id: String(track.id).slice(0, 64), title: String(track.title).slice(0, 160), artist: String(track.artist).slice(0, 160), artwork: String(track.artwork || '').slice(0, 500) }, playing: payload.playing, updatedAt: new Date().toISOString() };
}

const bar = (x, values, delay) => `<rect x="${x}" y="190" width="7" height="22" rx="3.5" fill="url(#signal)" opacity=".92"><animate attributeName="y" values="${values.map(v => 212 - v).join(';')}" dur="1.2s" begin="${delay}s" repeatCount="indefinite"/><animate attributeName="height" values="${values.join(';')}" dur="1.2s" begin="${delay}s" repeatCount="indefinite"/></rect>`;

export function renderSvg(data = {}, now = Date.now()) {
  const age = now - Date.parse(data.updatedAt);
  const live = data.playing && Number.isFinite(age) && age >= 0 && age < 180000;
  const shorten = (value, limit) => { const chars = Array.from(String(value)); return escapeXml(chars.length > limit ? chars.slice(0, limit - 1).join('') + '…' : chars.join('')); };
  const title = shorten(data.track?.title || 'Silêncio entre as faixas', 38);
  const artist = shorten(data.track?.artist || 'Abra o Aurora e dê o play', 54);
  const status = live ? 'AO VIVO' : data.track ? 'ÚLTIMA FAIXA' : 'AGUARDANDO O PLAY';
  const rotation = live ? '<animateTransform attributeName="transform" type="rotate" from="0 141 130" to="360 141 130" dur="7s" repeatCount="indefinite"/>' : '';
  const signal = live
    ? [[10,38,18,48,10],[20,52,14,36,20],[34,16,56,22,34],[12,46,24,58,12],[28,60,18,42,28],[16,40,54,20,16],[30,18,48,62,30],[14,50,28,42,14],[24,58,16,36,24],[18,34,62,26,18],[28,46,20,54,28],[12,38,52,18,12]].map((values, i) => bar(414 + i * 16, values, -i * .11)).join('')
    : Array.from({length:12}, (_, i) => `<rect x="${414 + i * 16}" y="${202 - (i % 3) * 4}" width="7" height="${10 + (i % 3) * 4}" rx="3.5" fill="url(#signal)" opacity=".48"/>`).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="260" viewBox="0 0 900 260" role="img" aria-label="Aurora: ${title}">
  <title>Aurora — ${title}, ${artist}</title>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#080b18"/><stop offset=".5" stop-color="#11162b"/><stop offset="1" stop-color="#1b1231"/></linearGradient>
    <linearGradient id="neon" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#69f3ff"/><stop offset=".48" stop-color="#9b8cff"/><stop offset="1" stop-color="#ff81d7"/></linearGradient>
    <linearGradient id="signal"><stop stop-color="#70f5e6"/><stop offset="1" stop-color="#ac82ff"/></linearGradient>
    <radialGradient id="vinyl"><stop offset="0" stop-color="#222944"/><stop offset=".18" stop-color="#0a0d18"/><stop offset=".23" stop-color="#9a7fff"/><stop offset=".27" stop-color="#0b0e19"/><stop offset="1" stop-color="#03050b"/></radialGradient>
    <filter id="glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="9" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="soft"><feGaussianBlur stdDeviation="28"/></filter><clipPath id="card"><rect width="900" height="260" rx="28"/></clipPath>
    <style>.wave-a{animation:drift 8s ease-in-out infinite alternate}.wave-b{animation:drift 11s ease-in-out -4s infinite alternate-reverse}.spark{animation:blink 2.4s ease-in-out infinite}.live{animation:pulse 1.55s ease-out infinite}.orbit{animation:orbit 9s linear infinite;transform-origin:141px 130px}@keyframes drift{to{transform:translate3d(38px,-10px,0) scale(1.05)}}@keyframes blink{50%{opacity:.25}}@keyframes pulse{0%{r:4;opacity:.85}80%,100%{r:13;opacity:0}}@keyframes orbit{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){*{animation:none!important}}</style>
  </defs>
  <g clip-path="url(#card)">
    <rect width="900" height="260" fill="url(#bg)"/><ellipse class="wave-a" cx="760" cy="-15" rx="260" ry="120" fill="#773cff" opacity=".18" filter="url(#soft)"/><ellipse class="wave-b" cx="705" cy="260" rx="300" ry="105" fill="#00e7ce" opacity=".12" filter="url(#soft)"/>
    <path class="wave-a" d="M474 19C586 70 672-19 918 52" fill="none" stroke="#9475ff" stroke-width="2" opacity=".32"/><path class="wave-b" d="M510 239C654 180 745 287 928 192" fill="none" stroke="#5cf5e2" stroke-width="2" opacity=".24"/>
    <circle class="spark" cx="685" cy="50" r="2" fill="#70f5e6"/><circle class="spark" cx="798" cy="183" r="2" fill="#cf8bff" style="animation-delay:-1s"/><circle class="spark" cx="623" cy="222" r="1.5" fill="#fff" style="animation-delay:-.6s"/><g opacity=".2" stroke="#a69af6"><path d="M382 36v188"/><path d="M384 224h450"/></g>
    <g><circle cx="141" cy="130" r="86" fill="#060814" stroke="#292e4c" stroke-width="2"/><g>${rotation}<circle cx="141" cy="130" r="72" fill="url(#vinyl)"/><circle cx="141" cy="130" r="59" fill="none" stroke="#737ea8" opacity=".2"/><circle cx="141" cy="130" r="46" fill="none" stroke="#737ea8" opacity=".16"/><circle cx="141" cy="130" r="4" fill="#77f1ee"/></g><ellipse class="orbit" cx="141" cy="130" rx="90" ry="38" fill="none" stroke="url(#neon)" stroke-width="2.5" opacity=".75"/><g stroke="url(#neon)" fill="none" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"><path d="m112 158 29-59 29 59M123 139h36" stroke-width="6"/><ellipse cx="141" cy="128" rx="47" ry="20" transform="rotate(-20 141 128)" stroke-width="2.5"/></g></g>
    <g font-family="Inter,Segoe UI,Arial,sans-serif"><text x="268" y="54" fill="#8e98b8" font-size="12" font-weight="700" letter-spacing="2.4">AURORA MUSIC</text><g transform="translate(268 70)"><rect width="${live ? 92 : 148}" height="28" rx="14" fill="${live ? '#123d3b' : '#24243f'}" stroke="${live ? '#49d9c8' : '#615a8d'}" opacity=".95"/>${live ? '<circle cx="17" cy="14" r="4" fill="#67f4df"/><circle class="live" cx="17" cy="14" r="4" fill="none" stroke="#67f4df"/>' : ''}<text x="${live ? 31 : 14}" y="18" fill="${live ? '#84ffe9' : '#c8c2e5'}" font-size="11" font-weight="800" letter-spacing="1.4">${status}</text></g><text x="268" y="137" fill="#f5f6ff" font-size="30" font-weight="760">${title}</text><text x="268" y="168" fill="#b8bed6" font-size="18">${artist}</text><g>${signal}</g><text x="620" y="209" fill="#8e98b8" font-size="11" font-weight="700" letter-spacing="1.3">${live ? 'SOM EM MOVIMENTO' : 'AURORA EM REPOUSO'}</text><text x="414" y="236" fill="#8b83bd" font-size="11">Reprodução oficial pelo YouTube  ·  feito por Pajé</text></g>
    <rect x="1" y="1" width="898" height="258" rx="27" fill="none" stroke="url(#neon)" stroke-opacity=".38" stroke-width="2"/>
  </g>
</svg>`;
}
