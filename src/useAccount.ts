import { useEffect, useRef, useState } from 'react';
import { readGoogleSession, saveGoogleSession, clearGoogleSession } from './auth-session';
import { connectGoogle, getYouTubeProfile, prepareGoogleConnection, googleConnectionReady } from './google';
import {clearAuroraSession,parseGoogleCredential,readAuroraSession,saveAuroraSession} from './aurora-session';
const CLIENT_ID=import.meta.env.VITE_GOOGLE_CLIENT_ID as string|undefined;
export function useAccount(notify:(message:string)=>void) {
  const [cached]=useState(()=>readGoogleSession(localStorage));
  const [aurora,setAurora]=useState(()=>CLIENT_ID?readAuroraSession(sessionStorage,CLIENT_ID):null);
  const profile=aurora?.profile??null;
  const [token,setToken]=useState(cached?.token ?? null);
  const [expiry,setExpiry]=useState(cached?.expiresAt ?? 0);
  const [busy,setBusy]=useState(false);const [ready,setReady]=useState(false);
  const request=useRef<AbortController|null>(null);const latest=useRef(token);latest.current=token;
  function expire(expected=latest.current){if(expected!==latest.current)return;clearGoogleSession(localStorage);setToken(null);setExpiry(0);notify('Sua conta continua lembrada. Renove o acesso ao YouTube para consultar sua biblioteca.');}
  useEffect(()=>{let active=true;if(googleConnectionReady())prepareGoogleConnection().then(()=>{if(active)setReady(true);}).catch(error=>{if(active)notify(error.message);});return()=>{active=false;request.current?.abort();};},[]);
  useEffect(()=>{if(!aurora)return;const expireAccount=()=>{if(Date.now()<aurora.expiresAt-30_000)return;clearAuroraSession(sessionStorage);setAurora(null);notify('Sua sessão do Aurora expirou. Entre novamente com Google.');};const timer=setTimeout(expireAccount,Math.max(0,aurora.expiresAt-Date.now()-30_000));window.addEventListener('focus',expireAccount);return()=>{clearTimeout(timer);window.removeEventListener('focus',expireAccount);};},[aurora]);
  useEffect(()=>{if(!token)return;const check=()=>{if(Date.now()>=expiry-30000)expire(token);};const timer=setTimeout(check,Math.max(0,expiry-Date.now()-30000));window.addEventListener('focus',check);return()=>{clearTimeout(timer);window.removeEventListener('focus',check);};},[token,expiry]);
  function signIn(credential:string){if(!CLIENT_ID)return;try{const session=parseGoogleCredential(credential,CLIENT_ID);saveAuroraSession(sessionStorage,session);setAurora(session);notify(`Bem-vindo ao Aurora, ${session.profile.name}.`);}catch(error){notify((error as Error).message);}}
  async function connectYouTube(){
    if(request.current)return;
    if(!googleConnectionReady()){notify('Falta configurar o identificador OAuth do Google.');return;}
    if(!ready){try{await prepareGoogleConnection();setReady(true);notify('Conexão preparada. Clique novamente para abrir a autorização.');}catch(error){notify((error as Error).message);}return;}
    const controller=new AbortController();request.current=controller;setBusy(true);
    try{const grant=await connectGoogle(controller.signal,Boolean(token));const identity=await getYouTubeProfile(grant.token,controller.signal);if(controller.signal.aborted)return;setToken(grant.token);setExpiry(grant.expiresAt);try{saveGoogleSession(localStorage,{...grant,profile:identity});}catch{/* Memory-only session. */}notify(`YouTube conectado como ${identity.name}.`);}catch(error){if(!controller.signal.aborted)notify((error as Error).message);}finally{if(request.current===controller){request.current=null;setBusy(false);}}
  }
  function logout(){request.current?.abort();clearGoogleSession(localStorage);clearAuroraSession(sessionStorage);window.google?.accounts.id.disableAutoSelect();setAurora(null);setToken(null);setExpiry(0);notify('Conta desconectada. Suas coleções locais foram preservadas.');}
  return {profile,identityToken:aurora?.credential??null,token,busy,signIn,connectYouTube,logout,expire,cancel:()=>request.current?.abort()};
}
