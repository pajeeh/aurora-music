export const escapeXml = value => String(value ?? '').replace(/[<>&"']/g, char => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[char]));

export function normalizePayload(payload) {
  const track = payload?.track;
  if (!track?.id || !track?.title || !track?.artist || typeof payload.playing !== 'boolean') return null;
  return { track: { id: String(track.id).slice(0, 64), title: String(track.title).slice(0, 160), artist: String(track.artist).slice(0, 160), artwork: String(track.artwork || '').slice(0, 500) }, playing: payload.playing, updatedAt: new Date().toISOString() };
}

const bar = (x, values, delay, color) => `<rect x="${x}" y="207" width="9" height="22" fill="${color}"><animate attributeName="y" values="${values.map(v => 229 - v).join(';')}" dur=".95s" begin="${delay}s" repeatCount="indefinite"/><animate attributeName="height" values="${values.join(';')}" dur=".95s" begin="${delay}s" repeatCount="indefinite"/></rect>`;

export function renderSvg(data = {}, now = Date.now()) {
  const age = now - Date.parse(data.updatedAt);
  const live = data.playing && Number.isFinite(age) && age >= 0 && age < 180000;
  const shorten = (value, limit) => { const chars = Array.from(String(value)); return escapeXml(chars.length > limit ? chars.slice(0, limit - 1).join('') + '…' : chars.join('')); };
  const title = shorten(data.track?.title || 'SEM SINAL // DÊ O PLAY', 34);
  const titleLength = Array.from(String(data.track?.title || 'SEM SINAL // DÊ O PLAY')).length;
  const titleSize = titleLength > 29 ? 27 : titleLength > 23 ? 30 : 34;
  const artist = shorten(data.track?.artist || 'Aurora Music', 48);
  const status = live ? 'TRANSMITINDO AGORA' : data.track ? 'ÚLTIMO RUÍDO' : 'FORA DO AR';
  const rotation = live ? '<animateTransform attributeName="transform" type="rotate" from="0 151 141" to="360 151 141" dur="5.5s" repeatCount="indefinite"/>' : '';
  const signal = live
    ? [[14,48,22,58,14],[28,62,18,42,28],[40,20,68,26,40],[16,56,30,72,16],[36,74,22,50,36],[20,48,66,24,20],[38,22,58,76,38],[18,62,34,52,18],[30,70,20,44,30],[22,42,74,32,22]].map((values, i) => bar(476 + i * 17, values, -i * .09, i % 3 === 1 ? '#ff4fc8' : i % 3 === 2 ? '#d8ff3e' : '#69f6ff')).join('')
    : Array.from({length:10}, (_, i) => `<rect x="${476 + i * 17}" y="${216 - (i % 3) * 5}" width="9" height="${13 + (i % 3) * 5}" fill="${i % 2 ? '#ff4fc8' : '#69f6ff'}" opacity=".45"/>`).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="280" viewBox="0 0 900 280" role="img" aria-label="Aurora: ${title}">
  <title>Aurora — ${title}, ${artist}</title>
  <defs>
    <linearGradient id="void" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#09090d"/><stop offset=".55" stop-color="#111126"/><stop offset="1" stop-color="#221039"/></linearGradient>
    <linearGradient id="acid"><stop stop-color="#66f6ff"/><stop offset=".5" stop-color="#a985ff"/><stop offset="1" stop-color="#ff4fc8"/></linearGradient>
    <radialGradient id="disc"><stop stop-color="#d8ff3e"/><stop offset=".07" stop-color="#0a0a0d"/><stop offset=".1" stop-color="#ff4fc8"/><stop offset=".14" stop-color="#09090d"/><stop offset="1" stop-color="#020205"/></radialGradient>
    <filter id="noise" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".82" numOctaves="3" seed="19" result="n"/><feColorMatrix in="n" type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 .16"/></feComponentTransfer></filter>
    <filter id="rough"><feTurbulence type="turbulence" baseFrequency=".015 .16" numOctaves="2" seed="7" result="warp"/><feDisplacementMap in="SourceGraphic" in2="warp" scale="5"/></filter>
    <filter id="pink-glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="7" result="b"/><feFlood flood-color="#ff4fc8"/><feComposite in2="b" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <pattern id="halftone" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2" fill="#7d63cd" opacity=".26"/></pattern>
    <clipPath id="frame"><path d="M21 9H884L897 24V253L878 273H14L3 258V26Z"/></clipPath>
    <style>.ticker{animation:ticker 12s linear infinite}.jitter{animation:jitter 2.1s steps(2,end) infinite}.scan{animation:scan 4s linear infinite}.live-pulse{animation:pulse 1.2s ease-out infinite}.orbit{animation:orbit 8s linear infinite;transform-origin:151px 141px}@keyframes ticker{to{transform:translateX(-245px)}}@keyframes jitter{50%{transform:translate(2px,-1px)}}@keyframes scan{from{transform:translateX(-180px)}to{transform:translateX(920px)}}@keyframes pulse{0%{r:5;opacity:.9}100%{r:16;opacity:0}}@keyframes orbit{to{transform:rotate(-360deg)}}@media(prefers-reduced-motion:reduce){*{animation:none!important}}</style>
  </defs>
  <g clip-path="url(#frame)">
    <rect width="900" height="280" fill="url(#void)"/><rect width="900" height="280" fill="url(#halftone)"/>
    <path d="M0 0H248L184 280H0Z" fill="#0d0d15"/><path d="M0 0H22L0 208Z" fill="#ff4fc8"/><path d="M900 0H854L900 96ZM900 280H803L900 218Z" fill="#d8ff3e" opacity=".92"/>
    <g transform="rotate(-4 690 54)" filter="url(#rough)"><rect x="568" y="28" width="261" height="48" fill="#f1eedf"/><text x="590" y="59" fill="#0a0a0e" font-family="Arial Black,Impact,sans-serif" font-size="22" font-weight="900" letter-spacing="2">NOISE IS A FEATURE</text></g>
    <g opacity=".42"><path d="M731 91l132 132M751 91l112 112" stroke="#ff4fc8" stroke-width="3"/><path d="M692 221h169M706 233h155" stroke="#69f6ff" stroke-width="2"/></g>
    <g>${rotation}<circle cx="151" cy="141" r="88" fill="url(#disc)"/><circle cx="151" cy="141" r="73" fill="none" stroke="#888" opacity=".24"/><circle cx="151" cy="141" r="57" fill="none" stroke="#777" opacity=".18"/><circle cx="151" cy="141" r="42" fill="none" stroke="#777" opacity=".15"/></g>
    <g class="orbit" fill="none" stroke="url(#acid)" stroke-width="3" filter="url(#rough)"><ellipse cx="151" cy="141" rx="105" ry="40" transform="rotate(-11 151 141)"/><ellipse cx="151" cy="141" rx="98" ry="30" transform="rotate(15 151 141)" opacity=".45"/></g>
    <g class="jitter" stroke="url(#acid)" fill="none" stroke-linecap="square" stroke-linejoin="bevel" filter="url(#pink-glow)"><path d="m117 174 34-70 35 70M129 151h45" stroke-width="8"/><path d="M104 159l92-36" stroke-width="2"/></g>
    <text x="37" y="39" fill="#d8ff3e" font-family="Arial Black,Impact,sans-serif" font-size="13" font-weight="900" letter-spacing="2">AURORA® // 001</text>
    <g font-family="Arial,Helvetica,sans-serif">
      <text x="282" y="43" fill="#8f86b4" font-size="11" font-weight="800" letter-spacing="3.4">PERSONAL BROADCAST SYSTEM</text>
      <g transform="translate(282 59) rotate(-1)"><path d="M0 3L${live ? 190 : 156} 0l7 31L5 34Z" fill="${live ? '#d8ff3e' : '#f1eedf'}"/><text x="17" y="23" fill="#09090d" font-family="Arial Black,Impact,sans-serif" font-size="12" font-weight="900" letter-spacing="1.5">${status}</text>${live ? '<circle cx="177" cy="16" r="5" fill="#ff4fc8"/><circle class="live-pulse" cx="177" cy="16" r="5" fill="none" stroke="#ff4fc8" stroke-width="2"/>' : ''}</g>
      <text class="jitter" x="282" y="139" fill="#f7f3e5" font-family="Arial Black,Impact,sans-serif" font-size="${titleSize}" font-weight="900" letter-spacing="-.8">${title}</text>
      <rect x="279" y="151" width="${Math.min(438, Math.max(170, Array.from(String(data.track?.artist || 'Aurora Music')).length * 11 + 32))}" height="30" fill="#ff4fc8" transform="rotate(.7 279 151)"/><text x="295" y="173" fill="#08080d" font-family="Arial Black,Impact,sans-serif" font-size="16" font-weight="900">${artist}</text>
      <g>${signal}</g><text x="665" y="227" fill="#d8ff3e" font-size="11" font-weight="900" letter-spacing="1.8">${live ? 'AMPLITUDE // LIVE' : 'SIGNAL // HOLD'}</text>
      <g class="ticker"><text x="286" y="263" fill="#8c83ac" font-size="10" font-weight="700" letter-spacing="2.3">YOUTUBE SOURCE  ///  AURORA CONNECT  ///  BUILT BY PAJÉ  ///  YOUR MUSIC · YOUR RULES  ///  </text><text x="845" y="263" fill="#8c83ac" font-size="10" font-weight="700" letter-spacing="2.3">YOUTUBE SOURCE  ///  AURORA CONNECT</text></g>
    </g>
    <g fill="#f1eedf"><path d="M829 111h36v5h-36zM844 96h5v35h-5z"/><path d="M250 205h25v4h-25zM260 195h4v25h-4z" opacity=".6"/></g>
    <rect class="scan" x="-180" y="0" width="120" height="280" fill="#69f6ff" opacity=".025" transform="skewX(-18)"/>
    <rect width="900" height="280" filter="url(#noise)" opacity=".58"/>
  </g>
  <path d="M21 9H884L897 24V253L878 273H14L3 258V26Z" fill="none" stroke="url(#acid)" stroke-width="2"/>
</svg>`;
}
