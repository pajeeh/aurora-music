import { Heart, Play, Plus } from 'lucide-react';
import { Cover } from './components';
import type { Track } from './types';
export function HomeStage({track,liked,like,play,collections,open,create,browse}:{track:Track;liked:boolean;like:()=>void;play:()=>void;collections:{id:string;title:string;tracks:Track[]}[];open:(id:string)=>void;create:()=>void;browse:()=>void}) {
  return <>
    <img className="pirate-banner" src={`${import.meta.env.BASE_URL}aurora-pirate-banner.png`} alt="Continue ouvindo. Mais som, menos regras."/>
    <div className="home-feature"><Cover artwork={track.artwork}/><div><small>RETOMAR · YOUTUBE</small><h1>{track.title}</h1><p>{track.artist}</p><div className="feature-actions"><button className="primary-button" onClick={play}><Play fill="currentColor"/>Reproduzir</button><button className="feature-heart" aria-label="Curtir faixa em destaque" aria-pressed={liked} onClick={like}><Heart fill={liked?'currentColor':'none'}/></button></div></div></div>
    <div className="home-heading"><h2>Suas playlists</h2><button className="text-button" onClick={browse}>Ver biblioteca</button></div>
    {collections.length?<div className="playlist-shelf">{collections.slice(0,4).map(item=><button className="playlist-tile" key={item.id} onClick={()=>open(item.id)}><Cover artwork={item.tracks[0]?.artwork}/><b>{item.title}</b><small>{item.tracks.length} faixas · Neste dispositivo</small></button>)}</div>:<div className="home-empty"><p>Seu som, organizado do seu jeito. Crie uma playlist para começar.</p><button className="outline-button" onClick={create}><Plus/>Nova playlist</button></div>}
  </>;
}
