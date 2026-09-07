import type { Track } from './types';

export type Playlist = { id: string; title: string; artwork: string; count: number };
type Snippet = { title?: string; channelTitle?: string; videoOwnerChannelTitle?: string; thumbnails?: { medium?: { url: string }; high?: { url: string } }; resourceId?: { videoId?: string } };
type Item = { id: string; snippet?: Snippet; contentDetails?: { itemCount?: number }; status?: { privacyStatus?: string } };
type Page = { items?: Item[]; nextPageToken?: string };

export async function youtubePage(token: string, resource: string, params: Record<string, string>, signal?: AbortSignal): Promise<Page> {
  const response = await fetch(`https://www.googleapis.com/youtube/v3/${resource}?${new URLSearchParams(params)}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000)
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('Sua conexão expirou. Clique na conta para conectar novamente.');
    if (response.status === 403) throw new Error('O YouTube recusou a consulta. Confira a permissão de leitura, a API e a cota do projeto.');
    throw new Error('Não foi possível carregar a biblioteca. Tente novamente.');
  }
  return response.json();
}

export async function listPlaylists(token: string, pageToken = '', signal?: AbortSignal) {
  const page = await youtubePage(token, 'playlists', { part: 'snippet,contentDetails', mine: 'true', maxResults: '50', ...(pageToken ? { pageToken } : {}) }, signal);
  return { items: (page.items ?? []).map(item => ({ id: item.id, title: item.snippet?.title ?? 'Playlist', artwork: item.snippet?.thumbnails?.medium?.url ?? '', count: item.contentDetails?.itemCount ?? 0 })), nextPageToken: page.nextPageToken };
}

export async function listPlaylistTracks(token: string, playlist: Playlist, pageToken = '', signal?: AbortSignal) {
  const page = await youtubePage(token, 'playlistItems', { part: 'snippet,status', playlistId: playlist.id, maxResults: '50', ...(pageToken ? { pageToken } : {}) }, signal);
  const items: Track[] = (page.items ?? []).filter(item => item.snippet?.resourceId?.videoId && item.snippet.title !== 'Deleted video' && item.snippet.title !== 'Private video').map(item => ({
    id: item.snippet!.resourceId!.videoId!, title: item.snippet!.title ?? 'Vídeo', artist: item.snippet!.videoOwnerChannelTitle ?? item.snippet!.channelTitle ?? 'YouTube', album: playlist.title,
    duration: '—', artwork: item.snippet!.thumbnails?.high?.url ?? item.snippet!.thumbnails?.medium?.url ?? '', accent: '#9b7cff'
  }));
  return { items, nextPageToken: page.nextPageToken, skipped: (page.items?.length ?? 0) - items.length };
}
