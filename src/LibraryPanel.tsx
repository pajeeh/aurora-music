import { useEffect, useRef, useState } from 'react';
import { listPlaylists, listPlaylistTracks, type Playlist } from './library-api';
import type { Track } from './types';

export function LibraryPanel({ token, play, enqueue, onAuthExpired }: { token: string | null; play: (track: Track, tracks?: Track[]) => void; enqueue: (track: Track) => void; onAuthExpired: () => void }) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selected, setSelected] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [next, setNext] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [skipped, setSkipped] = useState(0);
  const request = useRef<AbortController | null>(null);

  async function load(playlist: Playlist | null, more = false) {
    if (!token) return;
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    setBusy(true); setError(''); setSelected(playlist);
    if (!more) { setNext(undefined); setTracks([]); setSkipped(0); }
    try {
      if (playlist) {
        const page = await listPlaylistTracks(token, playlist, more ? next : '', controller.signal);
        if (controller.signal.aborted) return;
        setTracks(previous => more ? [...previous, ...page.items] : page.items);
        setSkipped(previous => (more ? previous : 0) + page.skipped); setNext(page.nextPageToken);
      } else {
        const page = await listPlaylists(token, more ? next : '', controller.signal);
        if (controller.signal.aborted) return;
        setPlaylists(previous => more ? [...previous, ...page.items] : page.items); setNext(page.nextPageToken);
      }
    } catch (cause) {
      if (!controller.signal.aborted) {
        const message = cause instanceof Error ? cause.message : 'Falha ao carregar.';
        setError(message);
        if (message.includes('expirou')) onAuthExpired();
      }
    }
    finally { if (request.current === controller) setBusy(false); }
  }
  useEffect(() => { setPlaylists([]); setSelected(null); setTracks([]); void load(null); return () => request.current?.abort(); }, [token]);

  return <section className="remote-library"><h2>Playlists do YouTube</h2><p>Somente leitura. Esta lista pode não incluir toda a biblioteca do YouTube Music.</p>
    {!token ? <p>Conecte sua conta no botão acima para consultar suas playlists.</p> : <>
      <div className="library-actions"><button disabled={busy} onClick={() => load(null)}>{selected ? '← Todas as playlists' : 'Atualizar playlists'}</button>{selected && tracks.length > 0 && <button onClick={() => play(tracks[0], tracks)}>Reproduzir faixas carregadas</button>}</div>
      {selected && <h3>{selected.title}</h3>}
      {error && <div className="notice" role="alert">{error}<button onClick={() => load(selected)}>Tentar novamente</button></div>}
      {busy && <p role="status">Carregando…</p>}
      {!selected ? <div className="playlist-grid">{playlists.map(playlist => <button key={playlist.id} disabled={busy} onClick={() => load(playlist)}>{playlist.artwork && <img src={playlist.artwork} alt=""/>}<b>{playlist.title}</b><small>{playlist.count} itens</small></button>)}</div> : <div className="remote-tracks">{tracks.map((track, index) => <div key={`${track.id}-${index}`}><button onClick={() => play(track, tracks)}>{track.artwork && <img src={track.artwork} alt=""/>}<span><b>{track.title}</b><small>{track.artist}</small></span></button><button aria-label={`Adicionar ${track.title} à fila`} onClick={() => enqueue(track)}>+ Fila</button></div>)}</div>}
      {!busy && !error && (selected ? !tracks.length : !playlists.length) && <p>Nenhum item disponível nesta consulta.</p>}
      {skipped > 0 && <p>{skipped} itens privados ou removidos não foram incluídos.</p>}
      {next && <button disabled={busy} onClick={() => load(selected, true)}>Carregar mais</button>}
    </>}
  </section>;
}
