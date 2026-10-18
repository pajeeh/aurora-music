import { useEffect,useState } from 'react';
import { Monitor, RefreshCw, X } from './icons';
import type { Track } from './types';
import { createDiscordPair, disableDiscordPresence, readDiscordSettings, revokeDiscordDevice, sendDiscordWebhook, type DiscordSettings } from './discord-presence';

export function DiscordPresenceModal({token,track,enabled,onEnabled,notify}:{token:string;track:Track;enabled:boolean;onEnabled:(value:boolean)=>void;notify:(value:string)=>void}){
  const [settings,setSettings]=useState<DiscordSettings|null>(null);const [pair,setPair]=useState<{code:string;expiresAt:string}|null>(null);const [busy,setBusy]=useState(false);
  useEffect(()=>{let active=true;const refresh=()=>void readDiscordSettings(token).then(value=>{if(active){setSettings(value);onEnabled(value.enabled);}}).catch(error=>{if(active)notify((error as Error).message);});refresh();const timer=setInterval(refresh,5000);return()=>{active=false;clearInterval(timer);};},[token]);
  async function create(){setBusy(true);try{const value=await createDiscordPair(token);setPair(value);onEnabled(true);const link=`aurora://discord-pair?code=${encodeURIComponent(value.code)}`;if(/Windows/i.test(navigator.userAgent)){location.href=link;notify('Abrindo o Companion. Confirme a janela do Windows para concluir.');}else notify('Código pronto para conectar outro dispositivo.');}catch(error){notify((error as Error).message);}finally{setBusy(false);}}
  async function disable(){setBusy(true);try{const value=await disableDiscordPresence(token);setSettings(value);setPair(null);onEnabled(false);notify('Presença no Discord desativada.');}catch(error){notify((error as Error).message);}finally{setBusy(false);}}
  async function revoke(id:string){setBusy(true);try{setSettings(await revokeDiscordDevice(token,id));notify('Dispositivo removido.');}catch(error){notify((error as Error).message);}finally{setBusy(false);}}
  async function share(){setBusy(true);try{await sendDiscordWebhook(token,track);notify('Faixa compartilhada no canal do Discord.');}catch(error){notify((error as Error).message);}finally{setBusy(false);}}
  const status=settings?.active?'Transmitindo':settings?.devices.length?'Companion conectado':'Precisa conectar';
  return <div className="discord-connect">
    <div className="discord-hero"><div className="discord-mark">◖◗</div><div><b>Aurora no Discord</b><p>Mostre a música, o artista e o progresso enquanto você ouve.</p></div><span className={settings?.active?'presence-live':''}>{enabled?status:'Desativado'}</span></div>
    <ol><li>Mantenha o Discord Desktop aberto.</li><li>Clique em conectar; o Companion fará o vínculo automaticamente.</li><li>Se a conexão cair, ele tentará se recuperar sem pedir outro código.</li></ol>
    {pair&&<div className="pair-code" aria-live="polite"><small>CÓDIGO DE PAREAMENTO</small><strong>{pair.code.slice(0,4)} {pair.code.slice(4)}</strong><span>Expira em 5 minutos e funciona uma vez.</span></div>}
    <div className="discord-actions"><button className="primary-button" disabled={busy} onClick={()=>void create()}><RefreshCw/> {pair?'Corrigir conexão':'Conectar este PC'}</button><button className="outline-button" disabled={busy} onClick={()=>void share()}>Compartilhar faixa no canal</button>{pair&&<a className="outline-button" href={`aurora://discord-pair?code=${encodeURIComponent(pair.code)}`}>Abrir Companion novamente</a>}{enabled&&<button className="outline-button" disabled={busy} onClick={()=>void disable()}>Desativar presença</button>}</div>
    {!!settings?.devices.length&&<div className="device-list"><small>DISPOSITIVOS CONECTADOS</small>{settings.devices.map(device=>{const online=Date.now()-Date.parse(device.lastSeenAt)<45000;return <div key={device.id}><Monitor/><span><b>{device.name}</b><small>{online?'Online agora':`Visto em ${new Date(device.lastSeenAt).toLocaleString('pt-BR')}`}</small></span>{online&&<span className="device-badge">Online</span>}<button aria-label={`Remover ${device.name}`} onClick={()=>void revoke(device.id)}><X/> Remover</button></div>;})}</div>}
    <small>Sua conta Google e seu acesso ao YouTube nunca são enviados ao Companion nem ao webhook. Você pode revogar cada dispositivo aqui.</small>
  </div>;
}
