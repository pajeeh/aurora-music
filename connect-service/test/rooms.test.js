import test from 'node:test';
import assert from 'node:assert/strict';
import { Rooms } from '../rooms.js';
import { createServer } from '../server.js';
const track={id:'abcdefghijk',title:'Song',artist:'Artist',album:'YouTube',duration:'—',artwork:'',accent:'#9b7cff'};
test('invited guests append to the shared queue without acquiring playback privileges',()=>{
  const rooms=new Rooms();const host=rooms.create('PC');const guest=rooms.join(host.code,'Phone');
  rooms.action(host.code,guest.token,{type:'add',track});
  assert.equal(rooms.read(host.code,host.token).queue[0].addedBy,'Phone');
  assert.throws(()=>rooms.action(host.code,guest.token,{type:'toggle'}),{status:403});
  assert.throws(()=>rooms.read(host.code,'wrong'),{status:401});
  assert.equal(JSON.stringify(rooms.read(host.code,host.token)).includes(guest.token),false);
});
test('transfer requires device opt-in; only selected player can report state',()=>{
  const rooms=new Rooms();const host=rooms.create('PC',[track]);const guest=rooms.join(host.code,'Phone');
  assert.throws(()=>rooms.action(host.code,host.token,{type:'device',memberId:guest.memberId}),{status:409});
  rooms.action(host.code,guest.token,{type:'ready'});
  rooms.action(host.code,host.token,{type:'device',memberId:guest.memberId});
  assert.equal(rooms.read(host.code,host.token).playerId,guest.memberId);
  assert.throws(()=>rooms.action(host.code,host.token,{type:'report',playing:true,position:0}),{status:403});
  rooms.action(host.code,guest.token,{type:'report',playing:true,position:3});
  assert.equal(rooms.read(host.code,host.token).reported.position,3);
});
test('guest leave preserves session, host leave closes it, rooms expire',()=>{
  let now=0;const rooms=new Rooms(()=>now);const host=rooms.create('PC');const guest=rooms.join(host.code,'Phone');
  rooms.action(host.code,guest.token,{type:'leave'});assert.equal(rooms.read(host.code,host.token).members.length,1);
  now=13*3600000;assert.throws(()=>rooms.read(host.code,host.token),{status:404});
  const next=rooms.create('PC');rooms.action(next.code,next.token,{type:'leave'});assert.throws(()=>rooms.read(next.code,next.token),{status:404});
});
test('shared queue serializes concurrent additions and rejects invalid input',()=>{
  const rooms=new Rooms();const host=rooms.create('PC');const guest=rooms.join(host.code,'Phone');
  rooms.action(host.code,host.token,{type:'add',track});rooms.action(host.code,guest.token,{type:'add',track:{...track,id:'12345678901'}});
  assert.equal(rooms.read(host.code,host.token).queue.length,2);
  assert.throws(()=>rooms.action(host.code,guest.token,{type:'add',track:{...track,id:'bad'}}),{status:400});
});
test('HTTP boundary supports separate clients and rejects unauthorized origins/tokens',async t=>{
  const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
  const base=`http://127.0.0.1:${server.address().port}/api/connect/rooms`;
  const post=(url,body,token,origin)=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`} : {}),...(origin?{Origin:origin}:{})},body:JSON.stringify(body)});
  const host=await (await post(base,{name:'PC'})).json();
  const guest=await (await post(`${base}/${host.code}/join`,{name:'Phone'})).json();
  assert.equal((await post(`${base}/${host.code}/actions`,{type:'add',track},guest.token)).status,200);
  const state=await (await fetch(`${base}/${host.code}`,{headers:{Authorization:`Bearer ${host.token}`}})).json();assert.equal(state.queue.length,1);
  assert.equal((await fetch(`${base}/${host.code}`)).status,401);
  assert.equal((await post(base,{name:'Bad'},null,'https://attacker.example')).status,403);
  assert.equal((await post(`${base}/${host.code}/actions`,{type:'toggle'},guest.token)).status,403);
});
