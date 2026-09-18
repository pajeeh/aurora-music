import { useEffect, useRef, useState } from 'react';
import { readGoogleSession, saveGoogleSession, clearGoogleSession } from './auth-session';
import { readRememberedGoogleProfile, rememberGoogleProfile, forgetGoogleProfile } from './account-memory';
import { connectGoogle, getYouTubeProfile, prepareGoogleConnection, googleConnectionReady } from './google';
export function useAccount(notify:(message:string)=>void) {
  const [remembered]=useState(()=>readRememberedGoogleProfile(localStorage));
  const [cached]=useState(()=>readGoogleSession(localStorage));
  const [profile,setProfile]=useState(cached?.profile ?? remembered);
  const [token,setToken]=useState(cached?.token ?? null);
  const [expiry,setExpiry]=useState(cached?.expiresAt ?? 0);
  const [busy,setBusy]=useState(false);const [ready,setReady]=useState(false);
  const request=useRef<AbortController|null>(null);const latest=useRef(token);latest.current=token;
  function expire(expected=latest.current){if(expected!==latest.current)return;clearGoogleSession(localStorage);setToken(null);setExpiry(0);notify('Sua conta continua lembrada. Renove o acesso ao YouTube para consultar sua biblioteca.');}
  useEffect(()=>{let active=true;if(googleConnectionReady())prepareGoogleConnection().then(()=>{if(active)setReady(true);}).catch(error=>{if(active)notify(error.message);});return()=>{active=false;request.current?.abort();};},[]);
  useEffect(()=>{if(!token)return;const check=()=>{if(Date.now()>=expiry-30000)expire(token);};const timer=setTimeout(check,Math.max(0,expiry-Date.now()-30000));window.addEventListener('focus',check);return()=>{clearTimeout(timer);window.removeEventListener('focus',check);};},[token,expiry]);
  async function connect(){
    if(request.current)return;
    if(!googleConnectionReady()){notify('Falta configurar o identificador OAuth do Google.');return;}
    if(!ready){try{await prepareGoogleConnection();setReady(true);notify('Conexão preparada. Clique novamente para abrir a autorização.');}catch(error){notify((error as Error).message);}return;}
    const controller=new AbortController();request.current=controller;setBusy(true);
    try{const grant=await connectGoogle(controller.signal,Boolean(profile));const identity=await getYouTubeProfile(grant.token,controller.signal);if(controller.signal.aborted)return;rememberGoogleProfile(localStorage,identity);setProfile(identity);setToken(grant.token);setExpiry(grant.expiresAt);try{saveGoogleSession(localStorage,{...grant,profile:identity});}catch{/* Memory-only session. */}notify('Conta conectada. Sua biblioteca está disponível.');}catch(error){if(!controller.signal.aborted)notify((error as Error).message);}finally{if(request.current===controller){request.current=null;setBusy(false);}}
  }
  function logout(){request.current?.abort();clearGoogleSession(localStorage);forgetGoogleProfile(localStorage);setProfile(null);setToken(null);setExpiry(0);notify('Conta desconectada. Suas coleções locais foram preservadas.');}
  return {profile,token,busy,connect,logout,expire,cancel:()=>request.current?.abort()};
}
