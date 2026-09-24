import type { Track } from './types';
const ENDPOINT=(import.meta.env.VITE_CONNECT_ENDPOINT??'').replace(/\/$/,'');
export type SocialProfile={handle:string;displayName:string;bio:string;avatar:string;followers:number;following:number;followedByMe:boolean};
export type SocialPlaylist={id:string;title:string;ownerHandle:string;members:string[];tracks:{track:Track;addedBy:string;addedAt:string}[];updatedAt:string;canEdit:boolean};
export type SocialState={me:SocialProfile|null;profiles:SocialProfile[];playlists:SocialPlaylist[]};
export async function socialRequest(token:string,body?:Record<string,unknown>):Promise<SocialState>{const response=await fetch(`${ENDPOINT}/api/social`,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${token}`,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(10000)});const value=await response.json().catch(()=>({error:'Aurora Social indisponível.'}));if(!response.ok)throw new Error(value.error??'Aurora Social indisponível.');return value;}
