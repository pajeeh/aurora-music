import { useEffect, useRef, useState } from 'react';

type Player = {
  loadVideoById(id: string): void; cueVideoById(id: string): void;
  playVideo(): void; pauseVideo(): void; seekTo(seconds: number, allowSeekAhead: boolean): void;
  setVolume(volume: number): void; getCurrentTime(): number; getDuration(): number; destroy(): void;
};
type PlayerAPI = { Player: new (element: HTMLElement, options: { width: string; height: string; videoId: string; playerVars: Record<string, string | number>; events: { onReady(): void; onStateChange(event: { data: number }): void; onError(event: { data: number }): void; onAutoplayBlocked(): void } }) => Player };
declare global { interface Window { YT?: PlayerAPI; onYouTubeIframeAPIReady?: () => void } }
let loading: Promise<PlayerAPI> | undefined;
function loadAPI() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (loading) return loading;
  loading = new Promise<PlayerAPI>((resolve, reject) => {
    const script = document.createElement('script');
    const previous = window.onYouTubeIframeAPIReady;
    const timer = setTimeout(fail, 15000);
    function fail() { clearTimeout(timer); script.remove(); loading = undefined; window.onYouTubeIframeAPIReady = previous; reject(new Error('Não foi possível carregar o player. Verifique sua conexão e recarregue a página.')); }
    window.onYouTubeIframeAPIReady = () => { clearTimeout(timer); previous?.(); if (window.YT?.Player) resolve(window.YT); else fail(); };
    script.src = 'https://www.youtube.com/iframe_api'; script.onerror = fail; document.head.appendChild(script);
  });
  return loading;
}

export function usePlayer(initialId: string, onEnded: () => void) {
  const mount = useRef<HTMLDivElement>(null);
  const player = useRef<Player | null>(null);
  const pending = useRef({ id: initialId, autoplay: false });
  const ended = useRef(onEnded); ended.current = onEnded;
  const readyRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState('');
  const [volume, setVolumeState] = useState(70);
  useEffect(() => {
    let active = true;
    let instance: Player | null = null;
    let timer: ReturnType<typeof setInterval> | undefined;
    const host = mount.current!;
    const target = document.createElement('div'); host.appendChild(target);
    loadAPI().then(api => {
      if (!active) return;
      instance = new api.Player(target, { width: '100%', height: '100%', videoId: pending.current.id,
        playerVars: { playsinline: 1, origin: window.location.origin, autoplay: 0 }, events: {
          onReady() {
            if (!active || !instance) return;
            player.current = instance; readyRef.current = true; setReady(true); instance.setVolume(70);
            if (pending.current.autoplay) instance.loadVideoById(pending.current.id); else instance.cueVideoById(pending.current.id);
            timer = setInterval(() => { if (instance && active) { setPosition(instance.getCurrentTime() || 0); setDuration(instance.getDuration() || 0); } }, 500);
          },
          onStateChange(event) { if (!active) return; setPlaying(event.data === 1); if (event.data === 1) setError(''); if (event.data === 0) ended.current(); },
          onError(event) { if (!active) return; setPlaying(false); setError([100, 101, 150].includes(event.data) ? 'Este vídeo não está disponível no player incorporado. Escolha outra faixa ou abra no YouTube.' : `O player não conseguiu reproduzir este vídeo (código ${event.data}). Tente outra faixa.`); },
          onAutoplayBlocked() { if (active) { setPlaying(false); setError('O navegador bloqueou a reprodução automática. Clique em Reproduzir ou no player do YouTube.'); } }
        }
      });
    }).catch(cause => { if (active) setError(cause.message); });
    return () => { active = false; clearInterval(timer); readyRef.current = false; player.current = null; instance?.destroy(); target.remove(); };
  }, []);
  function load(id: string) { pending.current = { id, autoplay: true }; setError(''); setPosition(0); setDuration(0); setPlaying(false); if (readyRef.current) player.current?.loadVideoById(id); }
  function toggle() { if (!readyRef.current) return; if (playing) player.current?.pauseVideo(); else player.current?.playVideo(); }
  function seek(seconds: number) { if (readyRef.current) { player.current?.seekTo(seconds, true); setPosition(seconds); } }
  function setVolume(value: number) { setVolumeState(value); if (readyRef.current) player.current?.setVolume(value); }
  return { mount, ready, playing, position, duration, error, volume, load, toggle, seek, setVolume };
}
