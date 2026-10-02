import test from 'node:test';
import assert from 'node:assert/strict';
import {toSocialSdkCommand} from '../src/social-sdk-client.mjs';

test('maps Aurora activity to the Social SDK line protocol',()=>{
  const start=new Date('2026-10-01T12:00:00.000Z');const end=new Date('2026-10-01T12:03:30.000Z');
  assert.deepEqual(toSocialSdkCommand({details:'Faixa','state':'Artista',largeImageKey:'aurora',startTimestamp:start,endTimestamp:end,buttons:[{label:'Abrir',url:'https://pajeeh.github.io/aurora-music/'}]}),{
    command:'set',title:'Faixa',artist:'Artista',image:'aurora',start:start.getTime(),end:end.getTime(),url:'https://pajeeh.github.io/aurora-music/'
  });
});

test('maps an empty activity to clear',()=>assert.deepEqual(toSocialSdkCommand(null),{command:'clear'}));
