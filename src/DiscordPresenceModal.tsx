import { useEffect,useState } from 'react';
import { Monitor, RefreshCw, X } from './icons';
import { createDiscordPair, disableDiscordPresence, readDiscordSettings, revokeDiscordDevice, type DiscordSettings } from './discord-presence';

export function DiscordPresenceModal({token,enabled,onEnabled,notify}:{token:string;enabled:boolean;onEnabled:(value:boolean)=>void;notify:(value:string)=>void}){
  const [settings,setSettings]=useState<DiscordSettings|null>(null);const [pair,setPair]=useState<{code:string;expiresAt:string}|null>(null);const [busy,setBusy]=useState(false);
  useEffect(()=>{void readDiscordSettings(token).then(value=>{setSettings(value);onEnabled(value.enabled);}).catch(error=>notify((error as Error).message));},[token]);
  async function create(){setBusy(true);try{const value=await createDiscordPair(token);setPair(value);onEnabled(true);notify('Código pronto. Digite-o no Aurora Discord Companion.');}catch(error){notify((error as Error).message);}finally{setBusy(false);}}
  async function disable(){setBusy(true);try{const value=await disableDiscordPresence(token);setSettings(value);setPair(null);onEnabled(false);notify('Presença no Discord desativada.');}catch(error){notify((error as Error).message);}finally{setBusy(false);}}
  async function revoke(id:string){setBusy(true);try{setSettings(await revokeDiscordDevice(token,id));notify('Dispositivo removido.');}catch(error){notify((error as Error).message);}finally{setBusy(false);}}
  return <div className="discord-connect">
    <div className="discord-hero"><div className="discord-mark">◖◗</div><div><b>Aurora no Discord</b><p>Mostre a música, o artista e o progresso enquanto você ouve.</p></div><span className={enabled?'presence-live':''}>{enabled?'Ativo':'Desativado'}</span></div>
    <ol><li>Abra o Aurora Discord Companion no Windows.</li><li>Gere um código e informe-o no Companion.</li><li>Mantenha o Discord aberto. O status se atualiza automaticamente.</li></ol>
    {pair&&<div className="pair-code" aria-live="polite"><small>CÓDIGO DE PAREAMENTO</small><strong>{pair.code.slice(0,4)} {pair.code.slice(4)}</strong><span>Expira em 5 minutos e funciona uma vez.</span></div>}
    <div className="discord-actions"><button className="primary-button" disabled={busy} onClick={()=>void create()}><RefreshCw/> {pair?'Gerar outro código':'Conectar dispositivo'}</button>{enabled&&<button className="outline-button" disabled={busy} onClick={()=>void disable()}>Desativar presença</button>}</div>
    {!!settings?.devices.length&&<div className="device-list"><small>DISPOSITIVOS CONECTADOS</small>{settings.devices.map(device=><div key={device.id}><Monitor/><span><b>{device.name}</b><small>Visto em {new Date(device.lastSeenAt).toLocaleString('pt-BR')}</small></span><button aria-label={`Remover ${device.name}`} onClick={()=>void revoke(device.id)}><X/> Remover</button></div>)}</div>}
    <small>Sua conta Google e seu acesso ao YouTube nunca são enviados ao Companion. Você pode revogar cada dispositivo aqui.</small>
  </div>;
}
