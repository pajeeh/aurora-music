import { useEffect, useRef } from 'react';
import type { Track } from './types';
type Controls={play:()=>void;pause:()=>void;next?:()=>void;previous?:()=>void;seek:(position:number)=>void};
export function useMediaSession(track:Track,playing:boolean,enabled:boolean,position:number,duration:number,controls:Controls){
 const latest=useRef(controls);latest.current=controls;
 useEffect(()=>{
  if(!('mediaSession' in navigator))return;
  const session=navigator.mediaSession;
  const actions:MediaSessionAction[]=['play','pause','nexttrack','previoustrack','seekto'];
  const handlers:Partial<Record<MediaSessionAction,MediaSessionActionHandler>>={play:()=>latest.current.play(),pause:()=>latest.current.pause(),nexttrack:()=>latest.current.next?.(),previoustrack:()=>latest.current.previous?.(),seekto:event=>{if(event.seekTime!==undefined)latest.current.seek(event.seekTime);}};
  for(const action of actions){try{session.setActionHandler(action,enabled&&(action!=='nexttrack'||controls.next)&&(action!=='previoustrack'||controls.previous)?handlers[action]!:null);}catch{/* Browser does not support this action. */}}
  return()=>{for(const action of actions)try{session.setActionHandler(action,null);}catch{/* Unsupported action. */}};
 },[enabled,!!controls.next,!!controls.previous,playing]);
 useEffect(()=>{
  if(!('mediaSession' in navigator))return;
  if(typeof MediaMetadata!=='undefined')navigator.mediaSession.metadata=new MediaMetadata({title:track.title,artist:track.artist,album:track.album,artwork:track.artwork?[{src:track.artwork}]:[]});
  navigator.mediaSession.playbackState=enabled?(playing?'playing':'paused'):'none';
 },[track,playing,enabled]);
 useEffect(()=>{
  if(!('mediaSession' in navigator)||!navigator.mediaSession.setPositionState)return;
  try{if(enabled&&Number.isFinite(duration)&&duration>0)navigator.mediaSession.setPositionState({duration,playbackRate:1,position:Math.max(0,Math.min(position,duration))});else navigator.mediaSession.setPositionState();}catch{/* Live streams may not provide a valid duration. */}
 },[position,duration,enabled]);
}
