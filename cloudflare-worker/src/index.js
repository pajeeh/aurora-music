import { DurableObject } from 'cloudflare:workers';
import { Rooms } from '../../connect-service/rooms.js';
import { normalizePayload, renderSvg } from '../../now-playing-service/core.js';

const json=(value,status=200,headers={})=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
const cors=origin=>({'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Vary':'Origin'});
const code=()=>crypto.getRandomValues(new Uint8Array(9)).toBase64({alphabet:'base64url',omitPadding:true});
const authCache=new Map();
const tokenKey=async token=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),byte=>byte.toString(16).padStart(2,'0')).join('');

export class AuroraState extends DurableObject {
  async rooms(){
    const data=await this.ctx.storage.get('room');const rooms=new Rooms();
    if(data)rooms.rooms=new Map([[data.code,{...data,members:new Map(data.members)}]]);
    return rooms;
  }
  async fetch(request){
    const url=new URL(request.url);
    if(url.pathname==='/internal/card'){
      if(request.method==='GET'||request.method==='HEAD'){
        const value=await this.ctx.storage.get('now-playing');const timestamp=Date.parse(value?.updatedAt)||0;const tag=`"aurora-${timestamp}"`;const headers={'Content-Type':'image/svg+xml; charset=utf-8','Cache-Control':'public, max-age=0, must-revalidate','ETag':tag,'Last-Modified':new Date(timestamp).toUTCString(),'X-Content-Type-Options':'nosniff'};
        if(request.headers.get('If-None-Match')===tag)return new Response(null,{status:304,headers});
        return new Response(request.method==='HEAD'?null:renderSvg(value),{headers});
      }
      const value=normalizePayload(await request.json());if(!value)return json({error:'invalid_payload'},400);
      await this.ctx.storage.put('now-playing',value);return json(value);
    }
    if(url.pathname==='/internal/now-playing')return json(await this.ctx.storage.get('now-playing')??{});
    const rooms=await this.rooms();let body={};if(request.method==='POST')body=await request.json();
    const parts=url.pathname.split('/').filter(Boolean);const roomCode=parts[1];const action=parts[2];
    try{
      let result;
      if(request.method==='POST'&&parts[0]==='create')result=rooms.create(body.name,body.queue,roomCode);
      else if(request.method==='POST'&&action==='join')result=rooms.join(roomCode,body.name);
      else {const token=request.headers.get('Authorization')?.match(/^Bearer ([\w-]+)$/)?.[1];result=request.method==='GET'?rooms.read(roomCode,token):rooms.action(roomCode,token,body);}
      const room=rooms.rooms.get(roomCode);if(room)await this.ctx.storage.put('room',{...room,members:[...room.members]});else await this.ctx.storage.delete('room');
      return json(result,request.method==='POST'&&parts[0]==='create'?201:200);
    }catch(error){const room=rooms.rooms.get(roomCode);if(room)await this.ctx.storage.put('room',{...room,members:[...room.members]});else await this.ctx.storage.delete('room');return json({error:error.status?error.message:'Falha no serviço.'},error.status??500);}
  }
}

async function owner(request,env){
  const token=request.headers.get('Authorization')?.match(/^Bearer (.+)$/)?.[1];if(!token||!env.ALLOWED_EMAIL||!env.GOOGLE_CLIENT_ID)return false;
  const key=await tokenKey(token);const cached=authCache.get(key);if(cached&&cached.expires>Date.now())return cached.owner;
  const response=await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(token)}`);if(!response.ok)return false;
  const identity=await response.json();const allowed=identity.email_verified==='true'&&identity.email===env.ALLOWED_EMAIL&&identity.aud===env.GOOGLE_CLIENT_ID;const ttl=Math.max(5000,Math.min(300000,Number(identity.expires_in||0)*1000));authCache.set(key,{owner:allowed,expires:Date.now()+ttl});if(authCache.size>64)authCache.delete(authCache.keys().next().value);return allowed;
}

export default {async fetch(request,env){
  const url=new URL(request.url);const origin=request.headers.get('Origin');
  if(origin&&origin!==env.AURORA_ORIGIN)return json({error:'Origem não autorizada.'},403);
  const headers=cors(env.AURORA_ORIGIN);if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(url.pathname==='/health')return json({ok:true},200,headers);
  const card=env.AURORA.getByName('public-now-playing');
  if(url.pathname==='/now-playing.svg')return card.fetch(new Request(new URL('/internal/card',url),request));
  if(url.pathname==='/api/now-playing'){
    if(request.method==='GET'){const response=await card.fetch(new Request(new URL('/internal/now-playing',url)));const result=new Response(response.body,response);Object.entries(headers).forEach(([k,v])=>result.headers.set(k,v));return result;}
    if(request.method!=='POST')return json({error:'Método não permitido.'},405,headers);
    if(!await owner(request,env))return json({error:'unauthorized'},401,headers);
    const response=await card.fetch(new Request(new URL('/internal/card',url),request));const result=new Response(response.body,response);Object.entries(headers).forEach(([k,v])=>result.headers.set(k,v));return result;
  }
  const match=url.pathname.match(/^\/api\/connect\/rooms(?:\/([\w-]{12})(?:\/(join|actions))?)?$/);
  if(!match)return json({error:'Não encontrado.'},404,headers);
  const roomCode=match[1]??code();const stub=env.AURORA.getByName(`room:${roomCode}`);
  const path=match[1]?`/room/${roomCode}${match[2]?'/'+match[2]:''}`:`/create/${roomCode}`;
  const response=await stub.fetch(new Request(new URL(path,url),request));const result=new Response(response.body,response);Object.entries(headers).forEach(([k,v])=>result.headers.set(k,v));return result;
}};
