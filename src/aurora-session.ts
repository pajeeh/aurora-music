export type AuroraProfile={sub:string;name:string;email:string;avatar?:string};
export type AuroraSession={credential:string;expiresAt:number;profile:AuroraProfile};
const KEY='aurora-account-session-v1';
const decode=(value:string)=>{const normalized=value.replace(/-/g,'+').replace(/_/g,'/');return JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length/4)*4,'=')));};
export function parseGoogleCredential(credential:string,clientId:string,now=Date.now()):AuroraSession{
  const parts=credential.split('.');if(parts.length!==3)throw new Error('O Google retornou uma credencial inválida.');
  let payload:Record<string,unknown>;try{payload=decode(parts[1]);}catch{throw new Error('O Google retornou uma credencial inválida.');}
  const issuer=payload.iss,expiresAt=Number(payload.exp)*1000;
  if((issuer!=='https://accounts.google.com'&&issuer!=='accounts.google.com')||payload.aud!==clientId||payload.email_verified!==true||typeof payload.sub!=='string'||typeof payload.email!=='string'||typeof payload.name!=='string'||!Number.isFinite(expiresAt)||expiresAt<=now+30_000)throw new Error('Não foi possível validar esta conta Google.');
  return {credential,expiresAt,profile:{sub:payload.sub,name:payload.name,email:payload.email,...(typeof payload.picture==='string'&&payload.picture.startsWith('https://')?{avatar:payload.picture}:{})}};
}
export function readAuroraSession(storage:Pick<Storage,'getItem'|'removeItem'>,clientId:string,now=Date.now()):AuroraSession|null{try{const raw=storage.getItem(KEY);if(!raw)return null;const value=JSON.parse(raw);return parseGoogleCredential(value.credential,clientId,now);}catch{try{storage.removeItem(KEY);}catch{/* Session remains memory-only. */}return null;}}
export function saveAuroraSession(storage:Pick<Storage,'setItem'>,session:AuroraSession){storage.setItem(KEY,JSON.stringify({credential:session.credential}));}
export function clearAuroraSession(storage:Pick<Storage,'removeItem'>){try{storage.removeItem(KEY);}catch{/* Best effort. */}}
