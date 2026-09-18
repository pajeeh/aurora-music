import { useEffect, useRef, useState } from 'react';
import type { Track } from './types';
export type GroupState = { code:string; hostId:string; playerId:string; revision:number; queue:{track:Track;addedBy:string}[]; playback:{track:Track|null;playing:boolean;position:number;command:number}; reported:{playing:boolean;position:number;duration?:number}; members:{id:string;name:string;host:boolean;canPlay:boolean;online:boolean}[] };
type Pair = {code:string;token:string;memberId:string};
const KEY='aurora-connect-pair-v1';
async function call(path:string,body?:unknown,token?:string) {
  const response=await fetch(`/api/connect/${path}`,{method:body===undefined?'GET':'POST',headers:{...(body===undefined?{}:{'Content-Type':'application/json'}),...(token?{Authorization:`Bearer ${token}`}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(8000)});
  let value;try {value=await response.json();} catch {throw new Error('Aurora Connect indisponível. Inicie o serviço de sessões.');}
  if (!response.ok) throw Object.assign(new Error(value.error || 'Falha na sessão.'),{status:response.status});
  return value;
}
function restore():Pair|null {try {const pair=JSON.parse(sessionStorage.getItem(KEY) ?? 'null');return typeof pair?.code==='string'&&typeof pair.token==='string'&&typeof pair.memberId==='string'?pair:null;} catch{return null;}}
export function useConnect() {
  const [pair,setPair]=useState<Pair|null>(restore);const [state,setState]=useState<GroupState|null>(null);const [error,setError]=useState('');const [busy,setBusy]=useState(false);const latest=useRef(pair);latest.current=pair;
  function save(value:Pair|null) {try {if(value)sessionStorage.setItem(KEY,JSON.stringify(value));else sessionStorage.removeItem(KEY);}catch{/* Pairing stays in memory. */}setPair(value);if(!value)setState(null);}
  useEffect(()=>{
    if(!pair)return;let active=true;let timer:ReturnType<typeof setTimeout>;
    async function poll(){try {const value=await call(`rooms/${pair!.code}`,undefined,pair!.token);if(active){setState(previous=>!previous||value.revision>=previous.revision?value:previous);setError('');}}catch(reason){if(active){setError(reason instanceof Error?reason.message:'Sem conexão.');if((reason as {status?:number}).status===401||(reason as {status?:number}).status===404)save(null);}}finally{if(active)timer=setTimeout(poll,1000);}}
    void poll();return()=>{active=false;clearTimeout(timer);};
  },[pair]);
  async function enter(name:string,queue?:Track[],code?:string){setBusy(true);setError('');try{const result=await call(code?`rooms/${encodeURIComponent(code.trim())}/join`:'rooms',code?{name}:{name,queue});save({code:result.code,token:result.token,memberId:result.memberId});setState(result.state);}catch(reason){setError(reason instanceof Error?reason.message:'Falha ao entrar.');}finally{setBusy(false);}}
  async function action(value:Record<string,unknown>){const current=latest.current;if(!current)return;try{const result=await call(`rooms/${current.code}/actions`,value,current.token);if(latest.current!==current)return;if(result.closed || value.type==='leave')save(null);else setState(previous=>!previous||result.revision>=previous.revision?result:previous);setError('');}catch(reason){setError(reason instanceof Error?reason.message:'Falha no comando.');}}
  return {pair,state,error,busy,enter,action,isHost:state?.hostId===pair?.memberId,isPlayer:state?.playerId===pair?.memberId};
}
