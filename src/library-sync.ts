import type { Track } from './types';
const ENDPOINT=(import.meta.env.VITE_AURORA_API_ENDPOINT||import.meta.env.VITE_NOW_PLAYING_ENDPOINT) as string|undefined;
const DEVICE_KEY='aurora-sync-device-v1';
type CloudLibrary={likedTracks:Track[];revision:number};
function deviceId(){let value=localStorage.getItem(DEVICE_KEY);if(!value){value=crypto.randomUUID();localStorage.setItem(DEVICE_KEY,value);}return value;}
async function call(token:string,body?:unknown):Promise<CloudLibrary>{
  if(!ENDPOINT)throw new Error('Sincronização em nuvem não configurada.');
  const response=await fetch(`${ENDPOINT.replace(/\/$/,'')}/api/library`,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${token}`,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(10000)});
  if(response.status===401)throw new Error('Sua autorização expirou. Reconecte o YouTube para sincronizar.');
  if(!response.ok)throw new Error('Não foi possível sincronizar suas curtidas agora.');
  return response.json();
}
export const likeSyncReady=()=>Boolean(ENDPOINT);
export const importAndReadLikes=(token:string,tracks:Track[])=>call(token,{type:'import',deviceId:deviceId(),tracks});
export const readCloudLikes=(token:string)=>call(token);
export const writeCloudLike=(token:string,track:Track,liked:boolean)=>call(token,{type:'like',track,liked});
