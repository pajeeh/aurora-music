export type LyricLine = { time: number; text: string };
export type LyricsRecord = { id:number; trackName:string; artistName:string; albumName?:string; duration:number; instrumental:boolean; plainLyrics:string|null; syncedLyrics:string|null };
export function parseLyrics(value:string):LyricLine[]{
 const lines:LyricLine[]=[];
 for(const row of value.split(/\r?\n/)){
  const stamps=[...row.matchAll(/\[(\d+):([0-5]\d)(?:\.(\d{1,3}))?\]/g)];
  const text=row.replace(/\[[^\]]*\]/g,'').trim();
  for(const stamp of stamps)lines.push({time:Number(stamp[1])*60+Number(stamp[2])+Number(`0.${stamp[3] ?? '0'}`),text});
 }
 return lines.sort((a,b)=>a.time-b.time);
}
export function activeLyric(lines:LyricLine[],position:number):number{
 let index=-1;for(let i=0;i<lines.length&&lines[i].time<=position;i++)index=i;return index;
}
export async function searchLyrics(title:string,artist:string,signal:AbortSignal):Promise<LyricsRecord[]>{
 const params=new URLSearchParams({track_name:title.trim(),...(artist.trim()?{artist_name:artist.trim()}: {})});
 const response=await fetch(`https://lrclib.net/api/search?${params}`,{signal});
 if(response.status===429)throw new Error('Muitas consultas. Aguarde um minuto antes de tentar novamente.');
 if(!response.ok)throw new Error('Não foi possível consultar as letras agora. Tente novamente.');
 const data:unknown=await response.json();
 if(!Array.isArray(data))throw new Error('O serviço retornou uma resposta inválida.');
 return data.filter((item):item is LyricsRecord=>item&&typeof item.id==='number'&&typeof item.trackName==='string'&&typeof item.artistName==='string'&&(item.instrumental||typeof item.plainLyrics==='string'||typeof item.syncedLyrics==='string'));
}
