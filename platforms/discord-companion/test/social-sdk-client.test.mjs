import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {PassThrough,Writable} from 'node:stream';
import {createSocialSdkClient,toSocialSdkCommand} from '../src/social-sdk-client.mjs';

test('maps Aurora activity to the Social SDK line protocol',()=>{
  const start=new Date('2026-10-01T12:00:00.000Z');const end=new Date('2026-10-01T12:03:30.000Z');
  assert.deepEqual(toSocialSdkCommand({details:'Faixa','state':'Artista',largeImageKey:'aurora',startTimestamp:start,endTimestamp:end,buttons:[{label:'Abrir',url:'https://pajeeh.github.io/aurora-music/'}]},42),{
    command:'set',id:42,title:'Faixa',artist:'Artista',image:'aurora',start:start.getTime(),end:end.getTime(),url:'https://pajeeh.github.io/aurora-music/'
  });
});

test('maps an empty activity to clear',()=>assert.deepEqual(toSocialSdkCommand(null,7),{command:'clear',id:7}));

function fakeHelper(onCommand){const child=new EventEmitter();child.stdout=new PassThrough();child.stderr=new PassThrough();child.exitCode=null;child.killed=false;child.stdin=new Writable({write(chunk,_encoding,done){const command=JSON.parse(String(chunk));if(command.command==='exit'){child.exitCode=0;queueMicrotask(()=>child.emit('exit',0));}else onCommand(command,child);done();}});child.kill=()=>{child.killed=true;child.exitCode=1;child.emit('exit',1);};queueMicrotask(()=>child.stdout.write('{"event":"ready"}\n'));return child;}

test('waits for Discord confirmation before completing an update',async()=>{
  let confirmed=false;const client=await createSocialSdkClient('1',{spawnProcess:()=>fakeHelper((command,child)=>setTimeout(()=>{confirmed=true;child.stdout.write(`${JSON.stringify({event:'updated',id:command.id,successful:true})}\n`);},10)),responseTimeoutMs:100});
  const update=client.setActivity({details:'Faixa'});assert.equal(confirmed,false);await update;assert.equal(confirmed,true);await client.destroy();
});

test('rejects an update refused by Discord',async()=>{
  const client=await createSocialSdkClient('1',{spawnProcess:()=>fakeHelper((command,child)=>child.stdout.write(`${JSON.stringify({event:'updated',id:command.id,successful:false})}\n`)),responseTimeoutMs:100});
  await assert.rejects(client.setActivity({details:'Faixa'}),/recusou/);await client.destroy();
});
