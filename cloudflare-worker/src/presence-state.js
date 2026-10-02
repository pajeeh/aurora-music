const clean=(value,max)=>typeof value==='string'?value.trim().slice(0,max):'';
const finite=(value,min,max)=>Number.isFinite(Number(value))?Math.min(max,Math.max(min,Number(value))):0;

export function emptyPresenceState(){return {users:{},pairings:{},devices:{}};}

export function publicPresenceSettings(state,userId,now=Date.now()){
  const source=state??emptyPresenceState();const user=source.users?.[userId];
  const devices=Object.values(source.devices??{}).filter(device=>device.userId===userId).map(({id,name,createdAt,lastSeenAt})=>({id,name,createdAt,lastSeenAt}));
  return {enabled:Boolean(user?.enabled),active:Boolean(user?.presence&&Date.parse(user.presence.expiresAt)>now),devices};
}

export function publishPresence(state,userId,payload,now=Date.now()){
  const source=structuredClone(state??emptyPresenceState());const current=source.users[userId]??{};
  if(payload?.action==='disable'){source.users[userId]={enabled:false,presence:null};return source;}
  const track=payload?.track;const title=clean(track?.title,160);const artist=clean(track?.artist,120);
  if(!title||!artist){const error=new Error('Faixa inválida.');error.status=400;throw error;}
  const duration=finite(payload.duration,0,86400);const position=finite(payload.position,0,duration||86400);const updatedAt=new Date(now).toISOString();
  source.users[userId]={...current,enabled:true,presence:{track:{id:clean(track.id,64),title,artist,artwork:/^https:\/\//.test(track.artwork??'')?clean(track.artwork,500):''},playing:Boolean(payload.playing),position,duration,updatedAt,expiresAt:new Date(now+45000).toISOString()}};
  return source;
}

export function createPairing(state,userId,code,now=Date.now()){
  const source=structuredClone(state??emptyPresenceState());source.pairings[code]={userId,expiresAt:now+300000};return source;
}

export function claimPairing(state,code,tokenHash,deviceId,name,now=Date.now()){
  const source=structuredClone(state??emptyPresenceState());const pairing=source.pairings[code];
  if(!pairing||pairing.expiresAt<=now){const error=new Error('Código inválido ou expirado.');error.status=404;throw error;}
  delete source.pairings[code];source.devices[tokenHash]={id:deviceId,userId:pairing.userId,name:clean(name,60)||'Discord',createdAt:new Date(now).toISOString(),lastSeenAt:new Date(now).toISOString()};return source;
}

export function readDevicePresence(state,tokenHash,now=Date.now()){
  const source=state??emptyPresenceState();const device=source.devices?.[tokenHash];if(!device){const error=new Error('Dispositivo não autorizado.');error.status=401;throw error;}
  const user=source.users?.[device.userId];const presence=user?.enabled&&user.presence&&Date.parse(user.presence.expiresAt)>now?user.presence:null;
  return {device:{id:device.id,name:device.name},presence};
}

export function touchDevice(state,tokenHash,now=Date.now()){
  const source=structuredClone(state??emptyPresenceState());if(source.devices[tokenHash])source.devices[tokenHash].lastSeenAt=new Date(now).toISOString();return source;
}

export function revokeDevice(state,userId,deviceId){
  const source=structuredClone(state??emptyPresenceState());for(const [key,device] of Object.entries(source.devices))if(device.userId===userId&&device.id===deviceId)delete source.devices[key];return source;
}
