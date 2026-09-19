import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, renameSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
export class RoomError extends Error { constructor(status, message) { super(message); this.status = status; } }
const secret = () => randomBytes(24).toString('base64url');
const fail = (status, message) => { throw new RoomError(status, message); };
function cleanTrack(track) {
  if (!track || !/^[\w-]{11}$/.test(track.id) || !['title','artist','album','duration','artwork','accent'].every(key => typeof track[key] === 'string')) fail(400, 'Faixa inválida.');
  return Object.fromEntries(['id','title','artist','album','duration','artwork','accent'].map(key => [key, track[key].slice(0, key === 'artwork' ? 500 : 160)]));
}
export class Rooms {
  constructor(now = Date.now, stateFile) {
    this.rooms = new Map(); this.now = now; this.stateFile=stateFile;
    if(stateFile&&existsSync(stateFile)){
      const data=JSON.parse(readFileSync(stateFile,'utf8'));
      if(data.version!==1||!Array.isArray(data.rooms))throw new Error('Invalid Connect state file');
      this.rooms=new Map(data.rooms.map(([code,room])=>[code,{...room,playback:{...room.playback,playing:false,command:room.playback.command+1},reported:{...room.reported,playing:false},members:new Map(room.members.map(([token,member])=>[token,{...member,lastSeen:0}]))}]));
      this.sweep();
    }
  }
  persist(){
    if(!this.stateFile)return;
    mkdirSync(dirname(this.stateFile),{recursive:true});
    const rooms=[...this.rooms].map(([code,room])=>[code,{...room,members:[...room.members]}]);
    writeFileSync(this.stateFile+'.tmp',JSON.stringify({version:1,rooms}),{mode:0o600});
    renameSync(this.stateFile+'.tmp',this.stateFile);
  }
  sweep() { for (const [code,room] of this.rooms) if (this.now() - room.touched > 12 * 3600000) this.rooms.delete(code); }
  create(name, queue = [], requestedCode) {
    this.sweep();
    if (this.rooms.size >= 100) fail(503, 'Limite de sessões atingido.');
    if (!Array.isArray(queue) || queue.length > 200) fail(400, 'Fila muito grande.');
    const tracks = queue.map(cleanTrack);
    const code = requestedCode ?? randomBytes(9).toString('base64url');
    const member = this.member(name, true);
    const room = { code, hostId:member.id, playerId:member.id, members:new Map([[member.token,member]]), queue:tracks.map(track => ({track,addedBy:member.name})), playback:{track:tracks[0] ?? null,playing:false,position:0,command:0}, reported:{playing:false,position:0}, revision:0, touched:this.now() };
    this.rooms.set(code,room);
    return { code, token:member.token, memberId:member.id, state:this.snapshot(room) };
  }
  member(name, host = false) {
    if (typeof name !== 'string' || !name.trim()) fail(400, 'Informe o nome do dispositivo.');
    return {id:secret(),token:secret(),name:name.trim().slice(0,50),host,canPlay:host,lastSeen:this.now()};
  }
  get(code) { this.sweep(); const room=this.rooms.get(code); if (!room) fail(404,'Sessão encerrada ou código inválido.'); return room; }
  join(code,name) {
    const room=this.get(code);
    if (room.members.size >= 20) fail(409,'Esta sessão já tem 20 dispositivos.');
    const member=this.member(name); room.members.set(member.token,member); room.touched=this.now();
    return {code,token:member.token,memberId:member.id,state:this.snapshot(room)};
  }
  authorize(code,token) { const room=this.get(code); const member=room.members.get(token); if (!member) fail(401,'Dispositivo não pareado.'); member.lastSeen=this.now(); room.touched=this.now(); return {room,member}; }
  read(code,token) { return this.snapshot(this.authorize(code,token).room); }
  snapshot(room) { return {code:room.code,hostId:room.hostId,playerId:room.playerId,revision:room.revision,queue:room.queue,playback:room.playback,reported:room.reported,members:[...room.members.values()].map(({token,lastSeen,...member})=>({...member,online:this.now()-lastSeen<15000}))}; }
  action(code,token,action) {
    const {room,member}=this.authorize(code,token);
    if (!action || typeof action.type !== 'string') fail(400,'Comando inválido.');
    if (action.type === 'add') {
      const track=cleanTrack(action.track);
      if (room.queue.length >= 200) fail(409,'A fila está cheia.');
      if (!room.queue.some(item=>item.track.id===track.id)) room.queue.push({track,addedBy:member.name});
    } else if (action.type === 'ready') member.canPlay=true;
    else if (action.type === 'report') {
      if (room.playerId !== member.id) fail(403,'Somente o reprodutor pode informar reprodução.');
      if (typeof action.playing !== 'boolean' || !Number.isFinite(action.position) || action.position<0) fail(400,'Estado inválido.');
      if (action.duration !== undefined && (!Number.isFinite(action.duration) || action.duration < 0)) fail(400,'Duração inválida.');
      room.reported={playing:action.playing,position:Math.min(action.position,86400),duration:Math.min(action.duration ?? 0,86400)};
    } else if (action.type === 'leave') {
      if (member.host) { this.rooms.delete(code); return {closed:true}; }
      room.members.delete(token);
      if (room.playerId===member.id) { room.playerId=room.hostId; room.playback.playing=false; room.playback.command++; }
    } else {
      const ended = action.type==='ended' && member.id===room.playerId;
      if (!member.host && !ended) fail(403,'Somente o anfitrião pode controlar a sessão.');
      if (ended && action.command !== undefined && action.command !== room.playback.command) return this.snapshot(room);
      if (action.type==='device') {
        const device=[...room.members.values()].find(item=>item.id===action.memberId && item.canPlay && this.now()-item.lastSeen<15000);
        if (!device) fail(409,'Dispositivo indisponível ou não habilitado.');
        room.playerId=device.id; room.playback.playing=false; room.playback.position=room.reported.position; room.playback.command++;
      } else if (action.type==='play') {
        const track=room.queue.find(item=>item.track.id===action.trackId)?.track;
        if (!track) fail(400,'Adicione a faixa à fila primeiro.');
        room.playback={track,playing:true,position:0,command:room.playback.command+1};
      } else if (action.type==='toggle') { if (!room.playback.track) fail(409,'Escolha uma faixa.'); room.playback.position=room.reported.position; room.playback.playing=!room.playback.playing; room.playback.command++; }
      else if (action.type==='seek') { if (!Number.isFinite(action.position) || action.position<0) fail(400,'Posição inválida.'); room.playback.position=Math.min(action.position,86400); room.playback.command++; }
      else if (action.type==='next' || action.type==='previous' || ended) {
        const index=room.queue.findIndex(item=>item.track.id===room.playback.track?.id);
        const track=room.queue[index+(action.type==='previous'?-1:1)]?.track;
        room.playback={track:track ?? room.playback.track,playing:Boolean(track),position:0,command:room.playback.command+1};
      } else if (action.type==='remove') {
        if (action.trackId===room.playback.track?.id) fail(409,'Não remova a faixa selecionada.');
        room.queue=room.queue.filter(item=>item.track.id!==action.trackId);
      } else fail(400,'Comando desconhecido.');
    }
    if (action.type!=='report') room.revision++;
    return this.snapshot(room);
  }
}
