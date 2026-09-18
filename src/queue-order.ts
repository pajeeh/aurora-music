import type { Track } from './types';
export function shuffleQueue(queue:Track[],currentId:string,random:()=>number=Math.random):Track[]{
  const current=queue.find(track=>track.id===currentId);
  const remaining=queue.filter(track=>track.id!==currentId);
  for(let i=remaining.length-1;i>0;i--){const j=Math.min(i,Math.max(0,Math.floor(random()*(i+1))));[remaining[i],remaining[j]]=[remaining[j],remaining[i]];}
  return current?[current,...remaining]:remaining;
}
