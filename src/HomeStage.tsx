import { Heart, Play, Plus } from './icons';
import { Cover } from './components';
import type { Track } from './types';
export function HomeStage({track,liked,like,play,collections,open,create,browse}:{track:Track;liked:boolean;like:()=>void;play:()=>void;collections:{id:string;title:string;tracks:Track[]}[];open:(id:string)=>void;create:()=>void;browse:()=>void}) {
  return <>
    <section className="aurora-banner" aria-label="Aurora Music"><img src={`${import.meta.env.BASE_URL}aurora-icon.svg`} alt=""/><div><small>AURORA MUSIC</small><h2>Continue ouvindo.</h2><p>Sua música. Suas regras.</p></div></section>
    <div className="home-feature"><Cover artwork={track.artwork}/><div><small>RETOMAR · YOUTUBE</small><h1>{track.title}</h1><p>{track.artist}</p><div className="feature-actions"><button className="primary-button" onClick={play}><Play fill="currentColor"/>Reproduzir</button><button className="feature-heart" aria-label="Curtir faixa em destaque" aria-pressed={liked} onClick={like}><Heart fill={liked?'currentColor':'none'}/></button></div></div></div>
    <div className="home-heading"><h2>Suas playlists</h2><button className="text-button" onClick={browse}>Ver biblioteca</button></div>
    {collections.length?<div className="playlist-shelf">{collections.slice(0,4).map(item=><button className="playlist-tile" key={item.id} onClick={()=>open(item.id)}><Cover artwork={item.tracks[0]?.artwork}/><b>{item.title}</b><small>{item.tracks.length} faixas · Neste dispositivo</small></button>)}</div>:<div className="home-empty"><p>Seu som, organizado do seu jeito. Crie uma playlist para começar.</p><button className="outline-button" onClick={create}><Plus/>Nova playlist</button></div>}
  </>;
}
