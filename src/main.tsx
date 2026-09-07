import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { CirclePlay, Clock3, Disc3, Download, Heart, Home, Library, LogIn, Pause, Play, Radio, Search, Settings2, SkipBack, SkipForward, Sparkles, Volume2 } from "lucide-react";
import { tracks as initialTracks } from "./catalog";
import { connectGoogle, getYouTubeProfile, googleConnectionReady, prepareGoogleConnection } from "./google";
import { searchYouTube } from "./youtube";
import type { Track } from "./types";
import { LibraryPanel } from './LibraryPanel';
import { usePlayer } from './usePlayer';
import { nextTrack, formatTime, readTracks } from './playback';
import { clearGoogleSession, readGoogleSession, saveGoogleSession } from './auth-session';
import { nowPlayingReady, publishNowPlaying } from './now-playing';
import "./styles.css";
import "./live.css";

type View = "home" | "search" | "library";
type InstallPromptEvent = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

function App() {
  const showcase = new URLSearchParams(window.location.search).has('showcase');
  const [cachedSession] = useState(() => readGoogleSession(localStorage));
  const [view, setView] = useState<View>("home");
  const [queue, setQueue] = useState<Track[]>(() => readTracks('aurora-queue-v1', initialTracks));
  const [current, setCurrent] = useState(() => readTracks('aurora-current-v1', initialTracks)[0] ?? initialTracks[0]);
  const player = usePlayer(current.id, () => skip(1));
  const { playing } = player;
  const [token, setToken] = useState<string | null>(cachedSession?.token ?? null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>(initialTracks);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [profile, setProfile] = useState<{name:string;avatar?:string} | null>(cachedSession?.profile ?? null);
  const [connecting, setConnecting] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [preparingGoogle, setPreparingGoogle] = useState(false);
  const [accountNotice, setAccountNotice] = useState("");
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const connection = useRef<AbortController | null>(null);
  const [savedTracks, setSavedTracks] = useState<Track[]>(() => {
    let legacy: string[] = [];
    try { const value = JSON.parse(localStorage.getItem('aurora-liked') ?? '[]'); if (Array.isArray(value)) legacy = value; } catch { /* A damaged legacy value must not prevent startup. */ }
    return readTracks('aurora-liked-tracks-v1', initialTracks.filter(track => legacy.includes(track.id)));
  });
  const liked = useMemo(() => savedTracks.map(track => track.id), [savedTracks]);

  useEffect(() => {
    try {
      localStorage.setItem('aurora-liked-tracks-v1', JSON.stringify(savedTracks));
      localStorage.setItem('aurora-queue-v1', JSON.stringify(queue));
      localStorage.setItem('aurora-current-v1', JSON.stringify([current]));
    } catch { setNotice('Não foi possível salvar neste dispositivo. Verifique o espaço e as permissões do navegador.'); }
  }, [savedTracks, queue, current]);
  useEffect(() => {
    let active = true;
    if (googleConnectionReady()) {
      setPreparingGoogle(true);
      prepareGoogleConnection()
        .then(() => { if (active) setGoogleReady(true); })
        .catch(error => { if (active) setAccountNotice(error.message); })
        .finally(() => { if (active) setPreparingGoogle(false); });
    }
    return () => { active = false; connection.current?.abort(); };
  }, []);
  useEffect(() => {
    const receive = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPromptEvent); };
    window.addEventListener('beforeinstallprompt', receive);
    return () => window.removeEventListener('beforeinstallprompt', receive);
  }, []);
  useEffect(() => {
    try { localStorage.setItem("aurora-now-playing", JSON.stringify({ track: current, playing, updatedAt: new Date().toISOString() })); } catch { /* Playback remains usable when storage is unavailable. */ }
    if (token && nowPlayingReady()) publishNowPlaying(token, current, playing).catch(() => undefined);
  }, [current, playing, token]);

  async function connectAccount() {
    if (connection.current || preparingGoogle) return;
    setAccountNotice("");
    if (!googleConnectionReady()) {
      setAccountNotice("Falta configurar o identificador OAuth do Google para conectar sua conta.");
      return;
    }
    if (!googleReady) {
      setPreparingGoogle(true);
      try {
        await prepareGoogleConnection();
        setGoogleReady(true);
        setAccountNotice("Tudo pronto. Clique em Conectar YouTube para abrir a autorização.");
      } catch (error) {
        setAccountNotice(error instanceof Error ? error.message : "Falha ao preparar a conexão do Google.");
      } finally { setPreparingGoogle(false); }
      return;
    }
    const attempt = new AbortController();
    connection.current = attempt;
    setConnecting(true);
    try {
      const token = await connectGoogle(attempt.signal);
      const youtubeProfile = await getYouTubeProfile(token, attempt.signal);
      if (!attempt.signal.aborted) {
        setProfile(youtubeProfile);
        setToken(token);
        try { saveGoogleSession(localStorage, { token, profile: youtubeProfile, expiresAt: Date.now() + 50 * 60 * 1000 }); } catch { /* A memory-only session still works. */ }
        setAccountNotice("Conta conectada. Sua biblioteca e a busca já podem consultar o YouTube.");
        setView('library');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('expirou')) { clearGoogleSession(localStorage); setToken(null); setProfile(null); }
      setAccountNotice(attempt.signal.aborted
        ? "Tentativa cancelada. Feche a janela do Google antes de tentar novamente."
        : error instanceof Error ? error.message : "Não foi possível conectar sua conta.");
    } finally {
      if (connection.current === attempt) {
        connection.current = null;
        setConnecting(false);
      }
    }
  }

  async function runSearch(event: React.FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setNotice("");
    try {
      const remote = await searchYouTube(query.trim(), token);
      if (remote) setResults(remote);
      else {
        const words = query.toLowerCase().split(/\s+/);
        const local = initialTracks.filter(track => words.some(word => `${track.title} ${track.artist} ${track.album}`.toLowerCase().includes(word)));
        setResults(local);
        setNotice("Busca local de demonstração. Conecte sua conta para buscar no YouTube.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro inesperado na busca.";
      if (message.includes('expirou')) disconnectAccount('Sua autorização expirou. Conecte novamente para continuar.');
      setNotice(message);
    } finally { setLoading(false); }
  }

  function disconnectAccount(message = 'Conta desconectada deste dispositivo.') {
    connection.current?.abort();
    clearGoogleSession(localStorage);
    setToken(null); setProfile(null); setAccountNotice(message); setView('home');
  }

  async function installApp() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  function play(track: Track, source?: Track[]) {
    setCurrent(track);
    player.load(track.id);
    if (source) setQueue(Array.from(new Map(source.map(item => [item.id, item])).values()));
    else if (!queue.some(item => item.id === track.id)) setQueue(items => [...items, track]);
  }

  function enqueue(track: Track) { setQueue(items => items.some(item => item.id === track.id) ? items : [...items, track]); }

  function skip(direction: 1 | -1) {
    const next = nextTrack(queue, current.id, direction);
    if (next) play(next);
  }

  const likedTracks = savedTracks;

  return <div className="app" style={{"--accent": current.accent} as React.CSSProperties}>
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Disc3 /></div><span>Aurora</span></div>
      <nav>
        <Nav active={view === "home"} icon={<Home />} label="Início" onClick={() => setView("home")} />
        <Nav active={view === "search"} icon={<Search />} label="Buscar" onClick={() => setView("search")} />
        <Nav active={view === "library"} icon={<Library />} label="Sua biblioteca" onClick={() => setView("library")} />
      </nav>
      <div className="sidebar-label">COLEÇÃO</div>
      <button className="playlist-link" onClick={() => setView("library")}><span className="liked-icon"><Heart size={17} fill="currentColor" /></span><span><b>Músicas curtidas</b><small>{liked.length} faixas</small></span></button>
      <button className="playlist-link" onClick={() => play(queue[0] ?? initialTracks[0])}><span className="daily-icon"><Sparkles size={17} /></span><span><b>Meu fluxo</b><small>Reproduzir sua fila</small></span></button>
      <div className="live-status"><Radio size={16}/><span><b>Reprodução local</b><small>{playing ? "Tocando neste dispositivo" : "Player pausado"}</small></span><i className={playing ? "on" : ""}/></div>
      <div className="sidebar-bottom"><CirclePlay size={17}/><span>Reprodução oficial<br/><b>YouTube</b></span></div>
    </aside>

    <main className="main">
      <header><div/><div className="account-actions">{installPrompt && <button className="install-button" onClick={installApp}><Download/> Instalar</button>}<button className="account-button" disabled={connecting || preparingGoogle} onClick={profile ? () => setView('library') : connectAccount}>{profile?.avatar?<img src={profile.avatar} alt=""/>:<LogIn/>}<span>{connecting?"Conectando…":preparingGoogle?"Preparando conexão…":profile?.name??"Conectar YouTube"}</span></button>{connecting && <button className="account-cancel" onClick={() => connection.current?.abort()}>Cancelar</button>}{profile && <button className="account-cancel" onClick={() => disconnectAccount()}>Sair</button>}</div></header>
      {accountNotice && <div className="notice account-notice" role="status"><Settings2/><span>{accountNotice}</span><button aria-label="Fechar aviso da conta" onClick={() => setAccountNotice("")}>×</button></div>}
      {view === "home" && <HomeView play={play} current={current} playing={playing} showAll={() => setView('search')} />}
      {view === "search" && <SearchView query={query} setQuery={setQuery} search={runSearch} results={results} loading={loading} notice={notice} play={play} />}
      {view === "library" && <><section className="content"><LibraryPanel token={token} play={play} enqueue={enqueue} onAuthExpired={() => disconnectAccount('Sua autorização expirou. Conecte novamente para carregar a biblioteca.')}/></section><LibraryView tracks={likedTracks} play={play} /></>}
    </main>

    <aside className="rightbar">
      <div className="right-title"><span>Tocando agora</span></div>
      <div className="now-art"><img src={current.artwork}/><span className="yt-badge"><CirclePlay size={15}/> YouTube</span></div>
      <h2>{current.title}</h2><p>{current.artist}</p>
      <div className="about"><b>Sobre a reprodução</b><span>O áudio é fornecido pelo player oficial do YouTube.</span></div>
      <div className="queue-title"><b>Fila · {queue.length} faixas</b></div>
      {queue.map(track => <button className={`queue-row ${track.id === current.id ? 'current' : ''}`} key={track.id} onClick={() => play(track)}><img src={track.artwork}/><span><b>{track.title}</b><small>{track.id === current.id ? 'Faixa selecionada' : track.artist}</small></span><Play/></button>)}
    </aside>

    <footer className="playerbar">
      <div className="track-mini"><img src={current.artwork}/><span><b>{current.title}</b><small>{current.artist}</small></span><button aria-label={liked.includes(current.id) ? 'Descurtir faixa' : 'Curtir faixa'} aria-pressed={liked.includes(current.id)} onClick={() => setSavedTracks(items => items.some(item => item.id === current.id) ? items.filter(item => item.id !== current.id) : [...items,current])}><Heart fill={liked.includes(current.id) ? "currentColor" : "none"}/></button></div>
      <div className="controls"><div><button aria-label="Faixa anterior" disabled={!player.ready || !nextTrack(queue, current.id, -1)} onClick={() => skip(-1)}><SkipBack/></button><button className="play" aria-label={playing ? 'Pausar' : 'Reproduzir'} disabled={!player.ready} onClick={player.toggle}>{playing ? <Pause fill="currentColor"/> : <Play fill="currentColor"/>}</button><button aria-label="Próxima faixa" disabled={!player.ready || !nextTrack(queue, current.id, 1)} onClick={() => skip(1)}><SkipForward/></button></div><div className="timeline"><span>{formatTime(player.position)}</span><input aria-label="Posição da reprodução" type="range" min="0" max={player.duration || 1} step="1" value={Math.min(player.position, player.duration || 1)} disabled={!player.ready || !player.duration} onChange={event => player.seek(Number(event.target.value))}/><span>{formatTime(player.duration)}</span></div></div>
      <div className="volume"><Volume2/><input aria-label="Volume" type="range" min="0" max="100" value={player.volume} disabled={!player.ready} onChange={event => player.setVolume(Number(event.target.value))}/></div>
    </footer>

    <div className={`youtube-frame visible ${showcase ? 'showcase' : ''}`}>
      {player.error && !showcase && <div className="player-error" role="alert">{player.error} <a href={`https://www.youtube.com/watch?v=${current.id}`} target="_blank" rel="noreferrer">Abrir no YouTube</a></div>}
      <div className="player-mount" ref={player.mount}/>
    </div>
  </div>;
}

function Nav({active, icon, label, onClick}:{active:boolean;icon:React.ReactNode;label:string;onClick:()=>void}) { return <button className={active ? "active" : ""} onClick={onClick}>{icon}<span>{label}</span></button> }

function HomeView({play,current,playing,showAll}:{play:(t:Track)=>void;current:Track;playing:boolean;showAll:()=>void}) { return <section className="content">
  <div className="greeting"><span>BOA TARDE</span><h1>O som certo,<br/>na hora certa.</h1><p>Sua música, organizada do seu jeito.</p></div>
  <h3>Atalhos para você</h3><div className="quick-grid">{initialTracks.slice(0,4).map(track => <button onClick={() => play(track)} key={track.id}><img src={track.artwork}/><b>{track.title}</b><span className="round-play">{current.id===track.id&&playing?<Pause fill="currentColor"/>:<Play fill="currentColor"/>}</span></button>)}</div>
  <div className="section-head"><div><h2>Feito para o seu momento</h2><p>Seleções para entrar no ritmo.</p></div><button onClick={showAll}>Buscar mais</button></div>
  <div className="card-grid">{initialTracks.map(track => <button className="music-card" onClick={() => play(track)} key={track.id}><div><img src={track.artwork}/><span><Play fill="currentColor"/></span></div><b>{track.title}</b><small>{track.artist}</small></button>)}</div>
</section> }

function SearchView({query,setQuery,search,results,loading,notice,play}:{query:string;setQuery:(v:string)=>void;search:(e:React.FormEvent)=>void;results:Track[];loading:boolean;notice:string;play:(t:Track)=>void}) { return <section className="content search-view"><h1>Buscar</h1><form onSubmit={search}><Search/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="O que você quer ouvir?"/><button>{loading?"Buscando…":"Buscar"}</button></form>{notice&&<div className="notice"><Settings2/>{notice}</div>}<div className="track-table"><div className="table-head"><span>#</span><span>TÍTULO</span><span>ÁLBUM</span><Clock3/></div>{results.map((track,index)=><button key={track.id} onClick={()=>play(track)}><span>{index+1}</span><span className="table-track"><img src={track.artwork}/><span><b>{track.title}</b><small>{track.artist}</small></span></span><span>{track.album}</span><span>{track.duration}</span></button>)}</div></section> }

function LibraryView({tracks,play}:{tracks:Track[];play:(t:Track)=>void}) { return <section className="content library-view"><div className="library-hero"><div><Heart fill="white"/></div><span><small>PLAYLIST</small><h1>Músicas curtidas</h1><p>{tracks.length} faixas salvas neste dispositivo</p></span></div>{tracks.length?<div className="track-table">{tracks.map((track,index)=><button key={track.id} onClick={()=>play(track)}><span>{index+1}</span><span className="table-track"><img src={track.artwork}/><span><b>{track.title}</b><small>{track.artist}</small></span></span><span>{track.album}</span><span>{track.duration}</span></button>)}</div>:<div className="empty"><Heart/><h2>Suas favoritas aparecerão aqui</h2><p>Curta uma música pelo coração no player.</p></div>}</section> }

createRoot(document.getElementById("root")!).render(<React.StrictMode><App/></React.StrictMode>);

if ('serviceWorker' in navigator && import.meta.env.PROD) window.addEventListener('load', () => navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => undefined));
