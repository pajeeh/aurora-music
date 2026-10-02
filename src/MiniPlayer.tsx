import {useEffect,useState} from 'react';
import {Pause,Play,SkipBack,SkipForward} from './icons';
import {Cover} from './components';
import {formatTime} from './playback';
import type {Track} from './types';

export type MiniPlayerState={track:Track;playing:boolean;position:number;duration:number;canPrevious:boolean;canNext:boolean};
type MiniMessage={type:'state';value:MiniPlayerState}|{type:'command';command:'toggle'|'previous'|'next'|'seek';value?:number}|{type:'request-state'};

export function MiniPlayer(){
 const [state,setState]=useState<MiniPlayerState|null>(null);
 useEffect(()=>{document.title='Aurora Mini Player';const channel=new BroadcastChannel('aurora-mini-player-v1');channel.onmessage=event=>{const message=event.data as MiniMessage;if(message?.type==='state')setState(message.value);};channel.postMessage({type:'request-state'} satisfies MiniMessage);return()=>channel.close();},[]);
 const command=(value:MiniMessage)=>{const channel=new BroadcastChannel('aurora-mini-player-v1');channel.postMessage(value);channel.close();};
 if(!state)return <main className="mini-player waiting"><img src="./aurora-icon.svg" alt=""/><div><b>Aurora Mini Player</b><small>Abra o Aurora para controlar a reprodução.</small></div></main>;
 const progress=state.duration?Math.min(100,state.position/state.duration*100):0;
 return <main className="mini-player">
   <Cover artwork={state.track.artwork}/>
   <section><div className="mini-copy"><b>{state.track.title}</b><small>{state.track.artist}</small></div>
     <div className="mini-progress"><span style={{width:`${progress}%`}}/></div>
     <div className="mini-time"><span>{formatTime(state.position)}</span><span>{formatTime(state.duration)}</span></div>
   </section>
   <nav aria-label="Controles do Mini Player">
     <button aria-label="Faixa anterior" disabled={!state.canPrevious} onClick={()=>command({type:'command',command:'previous'})}><SkipBack fill="currentColor"/></button>
     <button className="mini-play" aria-label={state.playing?'Pausar':'Reproduzir'} onClick={()=>command({type:'command',command:'toggle'})}>{state.playing?<Pause fill="currentColor"/>:<Play fill="currentColor"/>}</button>
     <button aria-label="Próxima faixa" disabled={!state.canNext} onClick={()=>command({type:'command',command:'next'})}><SkipForward fill="currentColor"/></button>
   </nav>
 </main>;
}
