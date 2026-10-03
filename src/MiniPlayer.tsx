import {useEffect,useRef,useState} from 'react';
import {Pause,Play,SkipBack,SkipForward} from './icons';
import {Cover} from './components';
import {formatTime} from './playback';
import type {Track} from './types';

export type MiniPlayerState={track:Track;playing:boolean;position:number;duration:number;canPrevious:boolean;canNext:boolean};
type MiniMessage={type:'state';value:MiniPlayerState}|{type:'command';command:'toggle'|'previous'|'next'|'seek';value?:number}|{type:'request-state'};

export function MiniPlayer(){
 const [state,setState]=useState<MiniPlayerState|null>(null);
 const channel=useRef<BroadcastChannel|null>(null);
 useEffect(()=>{if(new URLSearchParams(location.search).get('mini')==='1')document.title='Aurora Mini Player';const next=new BroadcastChannel('aurora-mini-player-v1');channel.current=next;next.onmessage=event=>{const message=event.data as MiniMessage;if(message?.type==='state')setState(message.value);};next.postMessage({type:'request-state'} satisfies MiniMessage);return()=>{channel.current=null;next.close();};},[]);
 const command=(value:MiniMessage)=>channel.current?.postMessage(value);
 if(!state)return <main className="mini-player waiting"><div className="mini-brand"><img src="./aurora-icon.svg" alt=""/><span/></div><div><b>Aurora Mini Player</b><small>Abra o Aurora para controlar a reprodução.</small></div></main>;
 const progress=state.duration?Math.min(100,state.position/state.duration*100):0;
 return <main className={`mini-player${state.playing?' is-playing':''}`}>
   <div className="mini-cover"><Cover artwork={state.track.artwork}/><span className="mini-live">{state.playing?'AO VIVO':'PAUSADO'}</span></div>
   <section><div className="mini-kicker"><span>AURORA</span><i aria-hidden="true"><b/><b/><b/><b/></i></div><div className="mini-copy"><b title={state.track.title}>{state.track.title}</b><small title={state.track.artist}>{state.track.artist}</small></div>
     <input className="mini-progress" aria-label="Posição da reprodução" type="range" min={0} max={state.duration||1} value={Math.min(state.position,state.duration||1)} disabled={!state.duration} style={{'--mini-progress':`${progress}%`} as React.CSSProperties} onChange={event=>command({type:'command',command:'seek',value:Number(event.target.value)})}/>
     <div className="mini-time"><span>{formatTime(state.position)}</span><span>{formatTime(state.duration)}</span></div>
   </section>
   <nav aria-label="Controles do Mini Player">
     <button aria-label="Faixa anterior" disabled={!state.canPrevious} onClick={()=>command({type:'command',command:'previous'})}><SkipBack fill="currentColor"/></button>
     <button className="mini-play" aria-label={state.playing?'Pausar':'Reproduzir'} onClick={()=>command({type:'command',command:'toggle'})}>{state.playing?<Pause fill="currentColor"/>:<Play fill="currentColor"/>}</button>
     <button aria-label="Próxima faixa" disabled={!state.canNext} onClick={()=>command({type:'command',command:'next'})}><SkipForward fill="currentColor"/></button>
   </nav>
 </main>;
}
