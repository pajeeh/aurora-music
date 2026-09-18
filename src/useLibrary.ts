import { useEffect, useRef, useState } from 'react';
import { listPlaylists, listPlaylistTracks, listLikedTracks, type Playlist } from './library-api';
import type { Track } from './types';
export function useLibrary(token:string|null,expire:(token:string)=>void,notify:(message:string)=>void) {
  const [playlists,setPlaylists]=useState<Playlist[]>([]);const [next,setNext]=useState<string>();
  const [tracks,setTracks]=useState<Track[]>([]);const [trackNext,setTrackNext]=useState<string>();const [title,setTitle]=useState('');
  const [selected,setSelected]=useState<Playlist|null>(null);const [kind,setKind]=useState<'playlist'|'likes'>('playlist');const [busy,setBusy]=useState(false);
  const request=useRef<AbortController|null>(null);const latest=useRef(token);latest.current=token;
  function report(error:Error,expected:string){if(latest.current!==expected)return;if(error.message.includes('expirou'))expire(expected);else notify(error.message);}
  useEffect(()=>{setPlaylists([]);setTracks([]);setNext(undefined);setTrackNext(undefined);request.current?.abort();if(!token)return;const controller=new AbortController();listPlaylists(token,'',controller.signal).then(page=>{if(!controller.signal.aborted){setPlaylists(page.items);setNext(page.nextPageToken);}}).catch(error=>{if(!controller.signal.aborted)report(error,token);});return()=>{controller.abort();request.current?.abort();};},[token]);
  async function morePlaylists(){if(!token||busy)return;setBusy(true);try{const page=await listPlaylists(token,next);if(latest.current===token){setPlaylists(items=>[...items,...page.items]);setNext(page.nextPageToken);}}catch(error){report(error as Error,token);}finally{setBusy(false);}}
  async function load(playlist:Playlist|null,likes=false,more=false){
    if(!token){notify('Conecte ou renove o acesso ao YouTube pelo botão da conta.');return false;}
    request.current?.abort();const controller=new AbortController();request.current=controller;setBusy(true);
    if(!more){setTracks([]);setTrackNext(undefined);setSelected(playlist);setKind(likes?'likes':'playlist');setTitle(likes?'Curtidas do YouTube':playlist!.title);}
    try{const page=likes?await listLikedTracks(token,more?trackNext:'',controller.signal):await listPlaylistTracks(token,playlist!,more?trackNext:'',controller.signal);if(controller.signal.aborted)return false;setTracks(items=>more?[...items,...page.items]:page.items);setTrackNext(page.nextPageToken);}catch(error){if(!controller.signal.aborted)report(error as Error,token);}finally{if(request.current===controller)setBusy(false);}return true;
  }
  return {playlists,next,tracks,trackNext,title,busy,morePlaylists,load,moreTracks:()=>load(selected,kind==='likes',true),cancel:()=>{request.current?.abort();setBusy(false);}};
}
