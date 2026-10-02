import type { Track } from './types';

const ENDPOINT=(import.meta.env.VITE_CONNECT_ENDPOINT??'').replace(/\/$/,'');
export const discordPresenceReady=Boolean(ENDPOINT);
export type DiscordDevice={id:string;name:string;createdAt:string;lastSeenAt:string};
export type DiscordSettings={enabled:boolean;active:boolean;devices:DiscordDevice[]};

async function request<T>(token:string,method:'GET'|'POST'|'DELETE'='GET',body?:unknown):Promise<T>{
  const response=await fetch(`${ENDPOINT}/api/presence`,{method,headers:{Authorization:`Bearer ${token}`,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(8000)});
  const value=await response.json().catch(()=>({error:'Serviço de presença indisponível.'}));if(!response.ok)throw new Error(value.error??'Falha ao conectar ao Discord.');return value;
}
export const readDiscordSettings=(token:string)=>request<DiscordSettings>(token);
export const createDiscordPair=(token:string)=>request<{code:string;expiresAt:string}>(token,'POST',{action:'pair'});
export const revokeDiscordDevice=(token:string,deviceId:string)=>request<DiscordSettings>(token,'POST',{action:'revoke',deviceId});
export const disableDiscordPresence=(token:string)=>request<DiscordSettings>(token,'DELETE');
export async function publishDiscordPresence(token:string,track:Track,playing:boolean,position:number,duration:number,signal?:AbortSignal){
  return fetch(`${ENDPOINT}/api/presence`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({track,playing,position,duration}),signal});
}
