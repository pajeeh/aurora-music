import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Download,
  Heart,
  Home,
  Library,
  ListMusic,
  LogIn,
  Monitor,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  SkipBack,
  SkipForward,
  Upload,
  Users,
  Volume2,
  NowPlaying,
  X,
  CirclePlay as Youtube,
} from './icons';
import { tracks as initialTracks } from './catalog';
import { searchYouTube } from './youtube';
import type { Playlist } from './library-api';
import { usePlayer } from './usePlayer';
import { nextTrack, formatTime, readTracks } from './playback';
import {
  addToCollection,
  COLLECTIONS_KEY,
  createCollection,
  readCollections,
} from './collections';
import { nowPlayingReady, publishNowPlaying } from './now-playing';
import { useConnect } from './connect';
import { useAccount } from './useAccount';
import { useLibrary } from './useLibrary';
import { CollectionRow, Cover, Modal, TrackList } from './components';
import type { Track } from './types';
import { PlayerBar, type RepeatMode } from './PlayerBar';
import { HomeStage } from './HomeStage';
import { moveQueueTrack, shuffleQueue } from './queue-order';
import {
  exportLibraryJson,
  mergeLibraryData,
  parseLibraryBackup,
  LIKED_TRACKS_KEY,
} from './library-backup';
import './styles.css';
import './pirate.css';
import './aurora.css';
import { LyricsPanel } from './LyricsPanel';
import { useMediaSession } from './useMediaSession';
import { importAndReadLikes, likeSyncReady, readCloudLikes, writeCloudLike } from './library-sync';
import { SocialStage } from './SocialStage';
import { GoogleSignInButton } from './GoogleSignInButton';

type View = 'home' | 'social' | 'library' | 'search' | 'liked' | 'collection' | 'youtube';
type Filter = 'Tudo' | 'Playlists' | 'Curtidas' | 'Recentes';
type InstallPromptEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:'accepted'|'dismissed'}>};

function App() {
  const [notice, setNotice] = useState('');
  const account = useAccount(setNotice);
  const library = useLibrary(account.token, account.expire, setNotice);

  const [view, setView] = useState<View>(()=>{const value=new URLSearchParams(location.search).get('view');return value==='search'||value==='social'||value==='library'?value:'home';});
  const [filter, setFilter] = useState<Filter>('Tudo');
  const [query, setQuery] = useState('');
  const [installPrompt,setInstallPrompt]=useState<InstallPromptEvent|null>(null);
  useEffect(()=>{const ready=(event:Event)=>{event.preventDefault();setInstallPrompt(event as InstallPromptEvent);};const installed=()=>setInstallPrompt(null);window.addEventListener('beforeinstallprompt',ready);window.addEventListener('appinstalled',installed);return()=>{window.removeEventListener('beforeinstallprompt',ready);window.removeEventListener('appinstalled',installed);};},[]);
  async function installApp(){if(!installPrompt)return;await installPrompt.prompt();await installPrompt.userChoice;setInstallPrompt(null);}

  const [queue, setQueue] = useState(() =>
    readTracks('aurora-queue-v1', initialTracks)
  );
  const [current, setCurrent] = useState(
    () => readTracks('aurora-current-v1', initialTracks)[0] ?? initialTracks[0]
  );
  const [saved, setSaved] = useState(() => {
    let ids: string[] = [];
    try {
      const value = JSON.parse(localStorage.getItem('aurora-liked') ?? '[]');
      if (Array.isArray(value)) ids = value;
    } catch {
      /* Recover legacy likes. */
    }
    return readTracks(
      LIKED_TRACKS_KEY,
      initialTracks.filter(t => ids.includes(t.id))
    );
  });
  const [collections, setCollections] = useState(() =>
    readCollections(localStorage)
  );
  const [recent, setRecent] = useState(() =>
    readTracks('aurora-recent-v1', [])
  );

  const [selected, setSelected] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const searchSequence = useRef(0);

  const [accountMenu, setAccountMenu] = useState(false);
  const [modal, setModal] = useState<'create' | 'save' | 'connect' | null>(null);
  const [playlistName, setPlaylistName] = useState('');
  const [saveTrack, setSaveTrack] = useState<Track | null>(null);
  const [deviceName, setDeviceName] = useState('Meu dispositivo');
  const [joinCode, setJoinCode] = useState('');

  const [panel, setPanel] = useState<'queue' | 'devices' | 'lyrics'>('queue');
  const [panelOpen, setPanelOpen] = useState(false);
  const [fallbackBusy, setFallbackBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function showPanel(value: 'queue' | 'devices' | 'lyrics') {
    setPanel(value);
    setPanelOpen(true);
  }

  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const unshuffled = useRef<Track[]>([]);

  function changeShuffle(value: boolean) {
    setShuffle(value);
    if (value) {
      unshuffled.current = queue;
      setQueue(shuffleQueue(queue, current.id));
    } else {
      setQueue(items => [
        ...unshuffled.current.filter(track =>
          items.some(item => item.id === track.id)
        ),
        ...items.filter(
          track => !unshuffled.current.some(item => item.id === track.id)
        ),
      ]);
    }
  }

  const group = useConnect();

  const handleTrackEnded = useCallback(() => {
    if (group.state) {
      if (group.isPlayer) {
        void group.action({
          type: 'ended',
          command: group.state.playback.command,
        });
      }
    } else if (repeat === 'one') {
      player.load(current.id);
    } else {
      skip(1);
    }
  }, [group.state, group.isPlayer, repeat, current.id]);

  const localPlayer = usePlayer(current.id, handleTrackEnded);

  const player = {
    ...localPlayer,
    duration:
      group.state && !group.isPlayer
        ? group.state.reported.duration ?? 0
        : localPlayer.duration,
  };

  const displayedQueue = group.state?.queue.map(item => item.track) ?? queue;
  const displayedCurrent = group.state?.playback.track ?? current;
  const selectedCollection = collections.find(item => item.id === selected);
  const liked = useMemo(() => new Set(saved.map(t => t.id)), [saved]);
  const savedRef=useRef(saved);savedRef.current=saved;

  useEffect(()=>{
    if(!account.identityToken||!likeSyncReady())return;
    const token=account.identityToken;let active=true;let busy=false;
    const apply=(value:{likedTracks:Track[]})=>{if(active)setSaved(value.likedTracks);};
    const refresh=async(first=false)=>{if(busy||document.visibilityState==='hidden')return;busy=true;try{apply(first?await importAndReadLikes(token,savedRef.current):await readCloudLikes(token));}catch(error){if(first&&active)setNotice((error as Error).message);}finally{busy=false;}};
    void refresh(true);const timer=setInterval(()=>void refresh(),15000);const focus=()=>void refresh();window.addEventListener('focus',focus);return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',focus);};
  },[account.identityToken]);

  useEffect(() => {
    try {
      localStorage.setItem(LIKED_TRACKS_KEY, JSON.stringify(saved));
      localStorage.setItem('aurora-queue-v1', JSON.stringify(queue));
      localStorage.setItem('aurora-current-v1', JSON.stringify([current]));
      localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
      localStorage.setItem('aurora-recent-v1', JSON.stringify(recent));
    } catch {
      setNotice(
        'Não foi possível salvar neste dispositivo. Verifique as permissões e o espaço disponível.'
      );
    }
  }, [saved, queue, current, collections, recent]);

  useEffect(() => {
    try {
      localStorage.setItem(
        'aurora-now-playing',
        JSON.stringify({
          track: displayedCurrent,
          playing: player.playing,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch {
      /* Playback is independent of storage. */
    }
    if (!account.identityToken || !nowPlayingReady() || (group.state && !group.isPlayer))
      return;

    const token = account.identityToken;
    const controller = new AbortController();
    let busy = false;

    const publish = async (keepalive = false) => {
      if (busy) return;
      busy = true;
      try {
        await publishNowPlaying(
          token,
          displayedCurrent,
          player.playing,
          controller.signal,
          keepalive
        );
      } catch {
        /* A publication failure must not interrupt playback. */
      } finally {
        busy = false;
      }
    };

    const refresh = () => {
      if (document.visibilityState === 'visible') void publish();
    };
    const finish = () => {
      void publish(true);
    };

    void publish();
    const timer = player.playing ? setInterval(() => void publish(), 15000) : undefined;

    window.addEventListener('focus', refresh);
    window.addEventListener('online', refresh);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('pagehide', finish);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('online', refresh);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('pagehide', finish);
      controller.abort();
    };
  }, [displayedCurrent, player.playing, account.identityToken, group.isPlayer, !!group.state]);

  const commandKey = group.state
    ? `${group.state.playerId}:${group.state.playback.command}`
    : 'local';
  const previousGroup = useRef(false);

  useEffect(() => {
    if (!group.state) {
      if (previousGroup.current) player.pause();
      previousGroup.current = false;
      return;
    }
    previousGroup.current = true;
    if (!group.isPlayer) {
      player.pause();
      return;
    }
    const playback = group.state.playback;
    if (playback.track && player.ready) {
      setCurrent(playback.track);
      player.setPlayback(playback.track.id, playback.position, playback.playing);
    }
  }, [commandKey, player.ready]);

  useEffect(() => {
    if (group.pair && group.error) player.pause();
  }, [group.error]);

  const telemetry = useRef({
    playing: player.playing,
    position: player.position,
    duration: player.duration,
  });
  telemetry.current = {
    playing: player.playing,
    position: player.position,
    duration: player.duration,
  };

  useEffect(() => {
    if (!group.state || !group.isPlayer) return;
    const timer = setInterval(() => {
      void group.action({ type: 'report', ...telemetry.current });
    }, 2000);
    return () => clearInterval(timer);
  }, [group.isPlayer, group.pair]);

  function navigate(next: View) {
    library.cancel();
    setSearchBusy(false);
    searchSequence.current++;
    setView(next);
    setQuery('');
  }

  function openCollection(id: string) {
    setSelected(id);
    navigate('collection');
  }

  function openRemote(playlist: Playlist | null, likes = false) {
    if (!account.token) {
      setNotice('Conecte ou renove o acesso ao YouTube pelo botão da conta.');
      return;
    }
    navigate('youtube');
    void library.load(playlist, likes);
  }

  async function play(track: Track, source?: Track[]) {
    if (group.pair) {
      await group.action({ type: 'add', track });
      if (group.isHost) await group.action({ type: 'play', trackId: track.id });
      else setNotice('Faixa adicionada à sessão. O anfitrião controla a reprodução.');
      return;
    }
    setCurrent(track);
    player.load(track.id);
    setRecent(items => [track, ...items.filter(t => t.id !== track.id)].slice(0, 30));
    if (source) {
      setShuffle(false);
      setQueue(Array.from(new Map(source.map(t => [t.id, t])).values()));
    } else {
      setQueue(items => (items.some(t => t.id === track.id) ? items : [...items, track]));
    }
  }

  function enqueue(track: Track) {
    if (group.pair) void group.action({ type: 'add', track });
    else setQueue(items => (items.some(t => t.id === track.id) ? items : [...items, track]));
    setNotice('Faixa adicionada à fila.');
  }

  function skip(direction: 1 | -1) {
    if (group.state) {
      if (group.isHost) void group.action({ type: direction === 1 ? 'next' : 'previous' });
      return;
    }
    const next =
      nextTrack(queue, current.id, direction) ??
      (repeat === 'all' ? (direction === 1 ? queue[0] : queue.at(-1)) : undefined);
    if (next) void play(next);
  }

  function toggleLike(track: Track) {
    const shouldLike=!savedRef.current.some(t=>t.id===track.id);
    setSaved(items=>shouldLike?[track,...items.filter(t=>t.id!==track.id)]:items.filter(t=>t.id!==track.id));
    if(account.identityToken&&likeSyncReady())void writeCloudLike(account.identityToken,track,shouldLike).then(value=>setSaved(value.likedTracks)).catch(error=>setNotice((error as Error).message));
  }

  function openSave(track: Track) {
    setSaveTrack(track);
    setModal('save');
  }

  function newPlaylist(event: React.FormEvent) {
    event.preventDefault();
    try {
      const value = createCollection(playlistName, crypto.randomUUID());
      setCollections(items => [value, ...items]);
      setPlaylistName('');
      setModal(null);
      openCollection(value.id);
    } catch (error) {
      setNotice((error as Error).message);
    }
  }

  async function search(event: React.FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    const sequence = ++searchSequence.current;
    setSearchBusy(true);
    try {
      const data = await searchYouTube(query.trim(), account.token);
      if (sequence !== searchSequence.current) return;
      const localMatches = initialTracks.filter(t =>
        `${t.title} ${t.artist}`.toLowerCase().includes(query.toLowerCase().trim())
      );
      setResults(data ?? (localMatches.length ? localMatches : initialTracks));
      if (!data) {
        setNotice(
          localMatches.length
            ? 'Resultados do catálogo local. Renove o YouTube para pesquisar o catálogo completo.'
            : 'O acesso ao YouTube precisa ser renovado. Enquanto isso, estes são os destaques disponíveis para tocar.'
        );
      }
    } catch (error) {
      if (sequence === searchSequence.current) {
        if ((error as Error).message.includes('expirou')) account.expire(account.token);
        else setNotice((error as Error).message);
      }
    } finally {
      if (sequence === searchSequence.current) setSearchBusy(false);
    }
  }

  // Smart fallback for blocked YouTube videos (codes 101/150)
  async function attemptSmartFallback() {
    if (fallbackBusy) return;
    setFallbackBusy(true);
    setNotice('Procurando versão alternativa desta música no YouTube…');
    try {
      const altQuery = `${displayedCurrent.title} ${displayedCurrent.artist} audio`;
      const candidates = await searchYouTube(altQuery, account.token);
      const alternative = candidates?.find(t => t.id !== displayedCurrent.id);
      if (alternative) {
        setNotice(`Versão alternativa encontrada: ${alternative.title}`);
        void play(alternative);
      } else {
        setNotice('Não encontramos outra versão compatível no YouTube para esta faixa.');
      }
    } catch {
      setNotice('Não foi possível buscar uma versão alternativa no momento.');
    } finally {
      setFallbackBusy(false);
    }
  }

  // Backup export / import handlers
  function handleExportLibrary() {
    try {
      const json = exportLibraryJson(localStorage);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aurora-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setNotice('Backup exportado com sucesso.');
    } catch {
      setNotice('Não foi possível exportar a biblioteca.');
    }
  }

  function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? '');
        const parsed = parseLibraryBackup(text);
        const merged = mergeLibraryData(collections, parsed.collections, saved, parsed.likedTracks);
        setCollections(merged.collections);
        setSaved(merged.likedTracks);
        setNotice(
          `Importação concluída: ${merged.collectionsAdded} playlists e ${merged.likedAdded} curtidas adicionadas.`
        );
      } catch (err) {
        setNotice((err as Error).message || 'Falha ao importar o arquivo.');
      } finally {
        if (event.target) event.target.value = '';
      }
    };
    reader.readAsText(file);
  }

  // Global keyboard shortcuts for desktop
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
        target.isContentEditable ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      ) {
        return;
      }

      if (event.code === 'Space') {
        event.preventDefault();
        if (group.state) void group.action({ type: 'toggle' });
        else player.toggle();
      } else if (event.code === 'KeyM') {
        event.preventDefault();
        player.setVolume(player.volume === 0 ? 70 : 0);
      } else if (event.code === 'ArrowRight' && !event.shiftKey) {
        event.preventDefault();
        const nextPos = Math.min(player.duration || 1, player.position + 5);
        if (group.state) void group.action({ type: 'seek', position: nextPos });
        else player.seek(nextPos);
      } else if (event.code === 'ArrowLeft' && !event.shiftKey) {
        event.preventDefault();
        const prevPos = Math.max(0, player.position - 5);
        if (group.state) void group.action({ type: 'seek', position: prevPos });
        else player.seek(prevPos);
      } else if (
        (event.code === 'ArrowRight' && event.shiftKey) ||
        event.code === 'KeyN'
      ) {
        event.preventDefault();
        skip(1);
      } else if (
        (event.code === 'ArrowLeft' && event.shiftKey) ||
        event.code === 'KeyP'
      ) {
        event.preventDefault();
        skip(-1);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [player.volume, player.position, player.duration, group.state, queue, current.id, repeat]);

  const match = (value: string) =>
    value.toLocaleLowerCase().includes(query.toLocaleLowerCase().trim());
  const canControl = !group.pair || group.isHost;

  const playing = group.state
    ? group.isPlayer
      ? player.playing
      : group.state.reported.playing
    : player.playing;
  const position =
    group.state && !group.isPlayer
      ? group.state.reported.position
      : player.position;

  useMediaSession(
    displayedCurrent,
    playing,
    canControl && (!!group.state || player.ready),
    position,
    player.duration,
    {
      play: () => {
        if (!playing) {
          if (group.state) void group.action({ type: 'toggle' });
          else player.toggle();
        }
      },
      pause: () => {
        if (playing) {
          if (group.state) void group.action({ type: 'toggle' });
          else player.pause();
        }
      },
      next:
        nextTrack(displayedQueue, displayedCurrent.id, 1) ||
        (!group.pair && repeat === 'all')
          ? () => skip(1)
          : undefined,
      previous:
        nextTrack(displayedQueue, displayedCurrent.id, -1) ||
        (!group.pair && repeat === 'all')
          ? () => skip(-1)
          : undefined,
      seek: value => {
        if (group.state) void group.action({ type: 'seek', position: value });
        else player.seek(value);
      },
    }
  );

  const title =
    view === 'library'
      ? 'Sua biblioteca'
      : view === 'liked'
      ? 'Músicas curtidas'
      : view === 'collection'
      ? selectedCollection?.title ?? 'Playlist'
      : view === 'youtube'
      ? library.title
      : view === 'search'
      ? 'Buscar'
      : view === 'social'
      ? 'Comunidade'
      : 'Continue ouvindo';

  let shownTracks =
    view === 'liked'
      ? saved
      : view === 'home'
      ? recent
      : view === 'collection'
      ? selectedCollection?.tracks ?? []
      : view === 'youtube'
      ? library.tracks
      : results;

  if (view !== 'search') shownTracks = shownTracks.filter(t => match(`${t.title} ${t.artist}`));

  const upcoming = displayedQueue.slice(
    Math.max(0, displayedQueue.findIndex(t => t.id === displayedCurrent.id) + 1)
  );

  const trackList = (tracks: Track[], removable = false) => (
    <TrackList
      tracks={tracks}
      liked={liked}
      play={play}
      like={toggleLike}
      enqueue={enqueue}
      save={openSave}
      remove={
        removable
          ? track =>
              setCollections(items =>
                items.map(item =>
                  item.id === selected
                    ? { ...item, tracks: item.tracks.filter(t => t.id !== track.id) }
                    : item
                )
              )
          : undefined
      }
    />
  );

  return (
    <div className="app">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={event => {
            event.preventDefault();
            navigate('library');
          }}
        >
          <img src={`${import.meta.env.BASE_URL}aurora-icon.svg`} alt="" />
          Aurora
        </a>
        <nav aria-label="Navegação principal">
          {(
            [
              { id: 'home', label: 'Início', icon: Home },
              { id: 'search', label: 'Buscar', icon: Search },
              { id: 'social', label: 'Comunidade', icon: Users },
              { id: 'library', label: 'Biblioteca', icon: Library },
            ] as const
          ).map(item => (
            <button
              key={item.id}
              className={view === item.id ? 'active' : ''}
              onClick={() => navigate(item.id)}
            >
              <item.icon />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <h2 className="sidebar-label">SUAS COLEÇÕES</h2>
        <button
          className={`collection-link ${view === 'liked' ? 'active' : ''}`}
          onClick={() => navigate('liked')}
        >
          <Heart className="liked-cover" fill="currentColor" />
          <span>
            <b>Músicas curtidas</b>
            <small>{saved.length} faixas · Aurora</small>
          </span>
        </button>
        <div className="sidebar-collections">
          {collections.map(item => (
            <button
              className="collection-link"
              key={item.id}
              onClick={() => openCollection(item.id)}
            >
              <Cover artwork={item.tracks[0]?.artwork} />
              <span>
                <b>{item.title}</b>
                <small>{item.tracks.length} faixas · local</small>
              </span>
            </button>
          ))}
          {library.playlists.slice(0, 8).map(item => (
            <button
              className="collection-link"
              key={item.id}
              onClick={() => openRemote(item)}
            >
              <Cover artwork={item.artwork} />
              <span>
                <b>{item.title}</b>
                <small>YouTube</small>
              </span>
            </button>
          ))}
        </div>
        <button className="new-playlist" onClick={() => setModal('create')}>
          <Plus />
          Nova playlist
        </button>
        <button className="connect-launch" onClick={() => setModal('connect')}>
          <Monitor />
          <span>{group.state ? 'Sessão conectada' : 'Aurora Connect'}</span>
        </button>
        <a className="beta-feedback" href="https://github.com/pajeeh/aurora-music/issues/new/choose" target="_blank" rel="noreferrer">Enviar feedback da beta ↗</a>
        <small className="sidebar-foot">
          Sua música. Suas regras.
          <br />
          Reprodução oficial pelo YouTube
        </small>
      </aside>

      <main className="main">
        <header>
          <form
            className="global-search"
            onSubmit={event => {
              if (view === 'search') void search(event);
              else event.preventDefault();
            }}
          >
            <Search />
            <input
              aria-label={
                view === 'search'
                  ? 'Buscar no YouTube'
                  : 'Buscar na sua biblioteca'
              }
              placeholder={
                view === 'search'
                  ? 'Músicas, artistas ou vídeos'
                  : 'Buscar na sua biblioteca'
              }
              value={query}
              onChange={event => setQuery(event.target.value)}
            />
            {view === 'search' && (
              <button type="submit" disabled={searchBusy}>
                Buscar
              </button>
            )}
          </form>
          <div className="account-wrap">
            {account.profile && !account.token && (
              <button
                className="reconnect-button"
                onClick={() => void account.connectYouTube()}
                disabled={account.busy}
              >
                <RefreshCw /> Conectar YouTube
              </button>
            )}
            {!account.profile ? <GoogleSignInButton onCredential={account.signIn} notify={setNotice}/> : <button
              className="account-button"
              aria-label={
                account.profile
                  ? `Conta de ${account.profile.name}`
                  : 'Conectar YouTube'
              }
              onClick={() => {
                setAccountMenu(value => !value);
              }}
              disabled={account.busy}
            >
              <span className="account-avatar">
                {account.profile?.avatar ? (
                  <img src={account.profile.avatar} alt="" />
                ) : (
                  <LogIn />
                )}
              </span>
              <span>
                {account.busy
                  ? 'Conectando…'
                  : `${account.profile.name}${account.token ? ' · YouTube' : ''}`}
              </span>
              <ChevronDown />
            </button>}
            {account.busy && (
              <button onClick={account.cancel}>Cancelar</button>
            )}
            {accountMenu && (
              <div className="account-menu">
                <button
                  onClick={() => {
                    setAccountMenu(false);
                    void account.connectYouTube();
                  }}
                >
                  {account.token?'Renovar YouTube':'Conectar YouTube'}
                </button>
                <button
                  onClick={() => {
                    setAccountMenu(false);
                    account.logout();
                  }}
                >
                  Sair da conta
                </button>
              </div>
            )}
          </div>
        </header>

        {notice && (
          <div className="notice" role="status">
            <span>{notice}</span>
            <button aria-label="Fechar aviso" onClick={() => setNotice('')}>
              <X />
            </button>
          </div>
        )}

        <section className={`content ${view === 'home' ? 'home-content' : ''}`}>
          {(view === 'collection' || view === 'youtube') && (
            <button className="back-button" onClick={() => navigate('library')}>
              <ArrowLeft />
              Biblioteca
            </button>
          )}
          {view !== 'home' && <h1>{title}</h1>}

          {view === 'home' ? (
            <HomeStage
              track={displayedCurrent}
              liked={liked.has(displayedCurrent.id)}
              like={() => toggleLike(displayedCurrent)}
              play={() => {
                if (canControl) void play(displayedCurrent);
                else enqueue(displayedCurrent);
              }}
              collections={collections}
              recent={recent}
              favorites={saved}
              discovery={initialTracks}
              playTrack={(item, source) => void play(item, source)}
              open={openCollection}
              create={() => setModal('create')}
              browse={() => navigate('library')}
              search={() => navigate('search')}
              install={installPrompt ? () => void installApp() : undefined}
              connect={() => setModal('connect')}
            />
          ) : view === 'social' ? (
            <SocialStage token={account.identityToken} name={account.profile?.name??'Aurora'} avatar={account.profile?.avatar} current={displayedCurrent} taste={Array.from(new Map([...saved,...recent].map(track=>[track.id,track])).values()).slice(0,50)} play={(item,source)=>void play(item,source)} notify={setNotice}/>
          ) : view === 'library' ? (
            <>
              <div className="library-toolbar">
                <div
                  className="filters"
                  role="group"
                  aria-label="Filtrar biblioteca"
                >
                  {(['Tudo', 'Playlists', 'Curtidas', 'Recentes'] as Filter[]).map(
                    item => (
                      <button
                        key={item}
                        className={filter === item ? 'selected' : ''}
                        aria-pressed={filter === item}
                        onClick={() => setFilter(item)}
                      >
                        {item}
                      </button>
                    )
                  )}
                </div>
                <div className="library-actions-group">
                  <div className="library-backup-buttons">
                    <button
                      className="outline-button"
                      title="Fazer download de backup das playlists e curtidas deste dispositivo"
                      onClick={handleExportLibrary}
                    >
                      <Download />
                      Backup
                    </button>
                    <button
                      className="outline-button"
                      title="Restaurar backup JSON salvo anteriormente"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload />
                      Restaurar
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".json"
                      className="hidden-file-input"
                      onChange={handleImportFile}
                    />
                  </div>
                  <button
                    className="outline-button"
                    onClick={() => setModal('create')}
                  >
                    <Plus />
                    Nova playlist
                  </button>
                </div>
              </div>

              {filter === 'Recentes' ? (
                trackList(recent.filter(t => match(`${t.title} ${t.artist}`)))
              ) : (
                <div className="collection-table">
                  <div className="collection-head">
                    <span>#</span>
                    <span>TÍTULO</span>
                    <span>ORIGEM</span>
                    <span>FAIXAS</span>
                    <span />
                  </div>
                  {(filter === 'Tudo' || filter === 'Curtidas') &&
                    match('Músicas curtidas') && (
                      <CollectionRow
                        index={1}
                        title="Músicas curtidas"
                        origin="Neste dispositivo"
                        count={saved.length}
                        liked
                        onOpen={() => navigate('liked')}
                        onPlay={() => {
                          if (saved[0]) void play(saved[0], saved);
                          else navigate('liked');
                        }}
                      />
                    )}
                  {(filter === 'Tudo' || filter === 'Curtidas') &&
                    account.token &&
                    match('Curtidas do YouTube') && (
                      <CollectionRow
                        index={2}
                        title="Curtidas do YouTube"
                        origin="YouTube"
                        count={null}
                        liked
                        onOpen={() => openRemote(null, true)}
                        onPlay={() => openRemote(null, true)}
                      />
                    )}
                  {filter !== 'Curtidas' &&
                    collections
                      .filter(item => match(item.title))
                      .map((item, index) => (
                        <CollectionRow
                          key={item.id}
                          index={index + 2}
                          title={item.title}
                          origin="Neste dispositivo"
                          count={item.tracks.length}
                          artwork={item.tracks[0]?.artwork}
                          onOpen={() => openCollection(item.id)}
                          onPlay={() => {
                            if (item.tracks[0]) void play(item.tracks[0], item.tracks);
                            else openCollection(item.id);
                          }}
                        />
                      ))}
                  {filter !== 'Curtidas' &&
                    library.playlists
                      .filter(item => match(item.title))
                      .map((item, index) => (
                        <CollectionRow
                          key={item.id}
                          index={index + collections.length + 2}
                          title={item.title}
                          origin="YouTube"
                          count={item.count}
                          artwork={item.artwork}
                          onOpen={() => openRemote(item)}
                          onPlay={() => openRemote(item)}
                        />
                      ))}
                  {filter !== 'Curtidas' &&
                    !collections.length &&
                    !library.playlists.length && (
                      <div className="library-empty">
                        <ListMusic />
                        <h2>Sua coleção começa aqui</h2>
                        <p>
                          Crie uma playlist no Aurora ou conecte o YouTube para
                          consultar as suas.
                        </p>
                      </div>
                    )}
                  {library.next && filter !== 'Curtidas' && (
                    <button
                      className="outline-button load-more"
                      disabled={library.busy}
                      onClick={() => void library.morePlaylists()}
                    >
                      Carregar mais playlists
                    </button>
                  )}
                </div>
              )}

              <div className="resume-strip">
                <div>
                  <b>Retomar</b>
                  <small>Continue de onde parou</small>
                </div>
                <Cover artwork={displayedCurrent.artwork} />
                <div className="resume-track">
                  <b>{displayedCurrent.title}</b>
                  <small>{displayedCurrent.artist}</small>
                </div>
                <button
                  className="round-button"
                  aria-label="Retomar reprodução"
                  disabled={!canControl}
                  onClick={() => void play(displayedCurrent)}
                >
                  <Play fill="currentColor" />
                </button>
              </div>
            </>
          ) : (
            <>
              {view === 'liked' && (
                <p className="section-description">
                  {saved.length} faixas curtidas no Aurora, salvas neste dispositivo.{' '}
                  <button
                    className="text-button"
                    onClick={() => openRemote(null, true)}
                  >
                    Ver curtidas do YouTube
                  </button>
                </p>
              )}
              {view === 'collection' && (
                <p className="section-description">
                  Playlist local · {selectedCollection?.tracks.length ?? 0} faixas ·
                  não altera sua conta YouTube
                </p>
              )}
              {view === 'youtube' && (
                <p className="section-description">
                  YouTube · somente leitura · esta consulta pode não incluir toda a
                  biblioteca do YouTube Music.
                </p>
              )}
              {shownTracks.length > 0 && view !== 'search' && (
                <button
                  className="primary-button"
                  onClick={() => void play(shownTracks[0], shownTracks)}
                >
                  <Play fill="currentColor" />
                  Reproduzir faixas carregadas
                </button>
              )}
              {(searchBusy || library.busy) && <p role="status">Carregando…</p>}
              {trackList(shownTracks, view === 'collection')}
              {!shownTracks.length && !searchBusy && !library.busy && (
                <div className="library-empty">
                  <ListMusic />
                  <h2>
                    {view === 'search'
                      ? 'Encontre sua próxima música'
                      : 'Ainda não há faixas aqui'}
                  </h2>
                  <p>
                    {view === 'collection'
                      ? 'Busque uma música e use “Salvar em playlist” para adicioná-la.'
                      : view === 'liked'
                      ? 'Use o coração ao lado das músicas para salvar suas favoritas.'
                      : 'Use a busca ou conecte sua conta para carregar músicas.'}
                  </p>
                  {view !== 'search' && (
                    <button
                      className="outline-button"
                      onClick={() => navigate('search')}
                    >
                      <Search />
                      Buscar músicas
                    </button>
                  )}
                </div>
              )}
              {view === 'youtube' && library.trackNext && (
                <button
                  className="outline-button load-more"
                  disabled={library.busy}
                  onClick={() => void library.moreTracks()}
                >
                  Carregar mais faixas
                </button>
              )}
            </>
          )}
        </section>
      </main>

      {panelOpen && <button className="panel-scrim" aria-label="Fechar painel do player" onClick={() => setPanelOpen(false)} />}
      <aside className={`rightbar ${panelOpen ? 'is-open' : ''}`} aria-hidden={!panelOpen} inert={!panelOpen}>
        <h2>
          <NowPlaying />
          Tocando agora
          <button className="panel-close" aria-label="Fechar painel" onClick={() => setPanelOpen(false)}><X /></button>
        </h2>
        <div className="youtube-frame">
          <div className="player-mount" ref={player.mount} />
        </div>
        {player.error && (
          <div className="player-error" role="alert">
            <p>{player.error}</p>
            <div className="player-error-actions">
              {[100, 101, 150].includes(player.errorCode ?? 0) && (
                <button
                  disabled={fallbackBusy}
                  onClick={() => void attemptSmartFallback()}
                >
                  <RefreshCw />
                  {fallbackBusy ? 'Buscando alternativa…' : 'Buscar versão alternativa'}
                </button>
              )}
              <a
                className="outline-button"
                href={`https://www.youtube.com/watch?v=${current.id}`}
                target="_blank"
                rel="noreferrer"
              >
                Abrir no YouTube
              </a>
            </div>
          </div>
        )}
        <div className="now-title">
          <h3>{displayedCurrent.title}</h3>
          <button
            aria-label={
              liked.has(displayedCurrent.id)
                ? 'Descurtir faixa atual'
                : 'Curtir faixa atual'
            }
            aria-pressed={liked.has(displayedCurrent.id)}
            onClick={() => toggleLike(displayedCurrent)}
          >
            <Heart
              fill={liked.has(displayedCurrent.id) ? 'currentColor' : 'none'}
            />
          </button>
        </div>
        <p>{displayedCurrent.artist}</p>
        <span className="origin-label">
          <Youtube />
          YouTube
        </span>
        {group.state && (
          <p className="group-status">
            {
              group.state.members.find(m => m.id === group.state?.playerId)
                ?.name
            }{' '}
            ·{' '}
            {group.state.members.find(m => m.id === group.state?.playerId)
              ?.online
              ? 'online'
              : 'indisponível'}
          </p>
        )}
        <div className="panel-tabs" role="group" aria-label="Painel do player">
          <button
            aria-pressed={panel === 'queue'}
            onClick={() => setPanel('queue')}
          >
            Fila
          </button>
          <button
            aria-pressed={panel === 'devices'}
            onClick={() => setPanel('devices')}
          >
            Dispositivos
          </button>
          <button
            aria-pressed={panel === 'lyrics'}
            onClick={() => setPanel('lyrics')}
          >
            Letras
          </button>
        </div>

        {panel === 'lyrics' ? (
          <LyricsPanel
            key={displayedCurrent.id}
            track={displayedCurrent}
            position={position}
          />
        ) : panel === 'queue' ? (
          <>
            <div className="queue-heading">
              <h3>Próximas na fila</h3>
              <span>{upcoming.length}</span>
            </div>
            <div className="queue-list">
              {upcoming.map((track, index) => (
                <div className="queue-row" key={track.id}>
                  <span>{index + 1}</span>
                  <Cover artwork={track.artwork} />
                  <button
                    className="queue-track"
                    disabled={!canControl}
                    onClick={() => void play(track)}
                  >
                    <b>{track.title}</b>
                    <small>
                      {group.state?.queue.find(
                        item => item.track.id === track.id
                      )?.addedBy ?? track.artist}
                    </small>
                  </button>
                  <div className="queue-actions">
                    {!group.state && (
                      <>
                        <button
                          className="icon-button"
                          aria-label={`Mover ${track.title} para cima`}
                          disabled={index === 0}
                          onClick={() =>
                            setQueue(items =>
                              moveQueueTrack(items, track.id, 'up')
                            )
                          }
                        >
                          <ChevronUp />
                        </button>
                        <button
                          className="icon-button"
                          aria-label={`Mover ${track.title} para baixo`}
                          disabled={index === upcoming.length - 1}
                          onClick={() =>
                            setQueue(items =>
                              moveQueueTrack(items, track.id, 'down')
                            )
                          }
                        >
                          <ChevronDown />
                        </button>
                      </>
                    )}
                    <button
                      className="icon-button"
                      aria-label={`Remover ${track.title} da fila`}
                      disabled={!canControl}
                      onClick={() => {
                        if (group.state) {
                          void group.action({
                            type: 'remove',
                            trackId: track.id,
                          });
                        } else {
                          setQueue(items =>
                            items.filter(t => t.id !== track.id)
                          );
                        }
                      }}
                    >
                      <X />
                    </button>
                  </div>
                </div>
              ))}
              {!upcoming.length && (
                <div className="queue-empty">
                  <ListMusic />
                  <h3>Sua fila está vazia</h3>
                  <p>Use “Adicionar à fila” no menu de uma música.</p>
                  <button
                    className="outline-button"
                    onClick={() => navigate('search')}
                  >
                    Buscar músicas
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <section className="connect-panel">
            <h3>Onde o som acontece</h3>
            <div className="this-device">
              <Monitor />
              <span>
                Este navegador
                <small>
                  {group.isPlayer
                    ? 'Saída local'
                    : group.state
                    ? 'Participante da sessão'
                    : 'Reprodução individual'}
                </small>
              </span>
            </div>
            {group.state ? (
              <div className="device-list">
                {group.state.members.map(member => (
                  <div key={member.id}>
                    <Monitor />
                    <span>
                      <b>{member.name}</b>
                      <small>{member.online ? 'Online' : 'Indisponível'}</small>
                    </span>
                    {member.id === group.state?.playerId ? (
                      <span className="device-badge">Reprodutor</span>
                    ) : (
                      group.isHost && (
                        <button
                          disabled={!member.canPlay || !member.online}
                          onClick={() =>
                            void group.action({
                              type: 'device',
                              memberId: member.id,
                            })
                          }
                        >
                          Usar
                        </button>
                      )
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <>
                <h4>Nenhum outro dispositivo conectado</h4>
                <p>
                  Abra o Aurora em outro aparelho e entre na mesma sessão pelo
                  código do convite.
                </p>
                <p>Não há descoberta automática de TVs ou caixas de som.</p>
              </>
            )}
            <button
              className="primary-button"
              onClick={() => setModal('connect')}
            >
              <Users />
              {group.state ? 'Gerenciar sessão' : 'Criar ou entrar em sessão'}
            </button>
            <small className="connect-availability">
              Sessões por convite. O serviço precisa estar conectado para parear
              navegadores.
            </small>
          </section>
        )}
      </aside>

      <PlayerBar
        track={displayedCurrent}
        liked={liked.has(displayedCurrent.id)}
        like={() => toggleLike(displayedCurrent)}
        playing={playing}
        ready={!!group.state || player.ready}
        canControl={canControl}
        previous={
          nextTrack(displayedQueue, displayedCurrent.id, -1) ||
          (!group.pair && repeat === 'all')
            ? () => skip(-1)
            : undefined
        }
        next={
          nextTrack(displayedQueue, displayedCurrent.id, 1) ||
          (!group.pair && repeat === 'all')
            ? () => skip(1)
            : undefined
        }
        toggle={() => {
          if (group.state) void group.action({ type: 'toggle' });
          else player.toggle();
        }}
        position={position}
        duration={player.duration}
        seek={value => {
          if (group.state) void group.action({ type: 'seek', position: value });
          else player.seek(value);
        }}
        volume={player.volume}
        setVolume={player.setVolume}
        panel={panelOpen ? panel : null}
        setPanel={showPanel}
        shuffle={shuffle}
        setShuffle={changeShuffle}
        repeat={repeat}
        setRepeat={setRepeat}
        grouped={!!group.pair}
      />

      {modal === 'create' && (
        <Modal title="Nova playlist" close={() => setModal(null)}>
          <form onSubmit={newPlaylist}>
            <label>
              Nome da playlist
              <input
                autoFocus
                maxLength={100}
                value={playlistName}
                onChange={event => setPlaylistName(event.target.value)}
                required
              />
            </label>
            <p>
              Salva neste dispositivo. Sua conta YouTube não será alterada.
            </p>
            <button className="primary-button" type="submit">
              <Plus />
              Criar playlist
            </button>
          </form>
        </Modal>
      )}

      {modal === 'save' && saveTrack && (
        <Modal title="Salvar em playlist" close={() => setModal(null)}>
          <p>{saveTrack.title}</p>
          {collections.map(item => (
            <button
              className="save-option"
              key={item.id}
              onClick={() => {
                setCollections(items =>
                  items.map(collection =>
                    collection.id === item.id
                      ? addToCollection(collection, saveTrack)
                      : collection
                  )
                );
                setModal(null);
                setNotice(`Salva em ${item.title}.`);
              }}
            >
              <ListMusic />
              {item.title}
            </button>
          ))}
          {!collections.length && (
            <p>Crie sua primeira playlist para organizar as músicas.</p>
          )}
          <button className="outline-button" onClick={() => setModal('create')}>
            <Plus />
            Nova playlist
          </button>
        </Modal>
      )}

      {modal === 'connect' && (
        <Modal title="Aurora Connect" close={() => setModal(null)}>
          <p>
            Uma fila compartilhada. Um aparelho reproduz; os outros participam.
          </p>
          {group.error && (
            <p className="player-error" role="alert">
              {group.error}
            </p>
          )}
          {!group.state ? (
            <>
              <label>
                Nome deste dispositivo
                <input
                  autoFocus
                  value={deviceName}
                  maxLength={50}
                  onChange={event => setDeviceName(event.target.value)}
                />
              </label>
              <button
                className="primary-button"
                disabled={group.busy}
                onClick={() => void group.enter(deviceName, queue)}
              >
                <Users />
                Criar sessão
              </button>
              <form
                onSubmit={event => {
                  event.preventDefault();
                  void group.enter(deviceName, undefined, joinCode);
                }}
              >
                <label>
                  Código do convite
                  <input
                    value={joinCode}
                    onChange={event => setJoinCode(event.target.value)}
                    maxLength={12}
                    required
                  />
                </label>
                <button className="outline-button" disabled={group.busy}>
                  Entrar na sessão
                </button>
              </form>
              <small>
                Conecte apenas dispositivos convidados. TVs e caixas de som
                ainda não são suportadas.
              </small>
            </>
          ) : (
            <>
              <label>
                Código para convidar
                <input readOnly value={group.state.code} />
              </label>
              <p>
                {group.isHost
                  ? 'Você é o anfitrião. Participantes podem adicionar faixas.'
                  : 'Você pode adicionar músicas à fila. O anfitrião controla a reprodução.'}
              </p>
              <button
                className="outline-button"
                onClick={() => {
                  player.pause();
                  void group.action({ type: 'ready' });
                  setNotice(
                    'Dispositivo habilitado. O anfitrião pode selecioná-lo; talvez seja necessário clicar no player para iniciar áudio.'
                  );
                }}
              >
                <Monitor />
                Habilitar reprodução aqui
              </button>
              <div className="device-list">
                {group.state.members.map(member => (
                  <div key={member.id}>
                    <Monitor />
                    <span>
                      <b>{member.name}</b>
                      <small>
                        {member.online ? 'Online' : 'Indisponível'} ·{' '}
                        {member.host ? 'anfitrião' : 'participante'}
                      </small>
                    </span>
                    {member.id === group.state?.playerId ? (
                      <span className="device-badge">Reprodutor</span>
                    ) : (
                      group.isHost && (
                        <button
                          disabled={!member.canPlay || !member.online}
                          onClick={() =>
                            void group.action({
                              type: 'device',
                              memberId: member.id,
                            })
                          }
                        >
                          Usar
                        </button>
                      )
                    )}
                  </div>
                ))}
              </div>
              <button
                className="outline-button"
                onClick={() => {
                  player.pause();
                  void group.action({ type: 'leave' });
                }}
              >
                {group.isHost ? 'Encerrar sessão' : 'Sair da sessão'}
              </button>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error('Aurora failed to render', error);
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="fatal-error">
          <img src={`${import.meta.env.BASE_URL}aurora-icon.svg`} alt="" />
          <p className="eyebrow">O SOM PAROU POR AQUI</p>
          <h1>O Aurora encontrou um erro.</h1>
          <p>
            Recarregue a página. Se acontecer de novo, conte o que você estava
            fazendo para conseguirmos corrigir.
          </p>
          <div>
            <button className="primary-button" onClick={() => location.reload()}>
              Recarregar o Aurora
            </button>
            <a
              className="outline-button"
              href="https://github.com/pajeeh/aurora-music/issues/new?template=bug_report.yml"
            >
              Relatar o problema
            </a>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () =>
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch(() => undefined)
  );
}
