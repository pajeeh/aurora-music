import assert from 'node:assert/strict';
import test from 'node:test';
import {clearAuroraSession,parseGoogleCredential,readAuroraSession,saveAuroraSession} from '../src/aurora-session.ts';
const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
const credential=payload=>`${encode({alg:'RS256'})}.${encode(payload)}.signature`;
function store(){const values=new Map();return{values,getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};}
test('accepts a valid Google identity session and restores it',()=>{const token=credential({iss:'https://accounts.google.com',aud:'aurora-client',sub:'user-1',email:'listener@gmail.com',email_verified:true,name:'Listener',picture:'https://example.com/me.jpg',exp:2000});const session=parseGoogleCredential(token,'aurora-client',1_000_000);assert.equal(session.profile.name,'Listener');const storage=store();saveAuroraSession(storage,session);assert.deepEqual(readAuroraSession(storage,'aurora-client',1_000_000),session);clearAuroraSession(storage);assert.equal(readAuroraSession(storage,'aurora-client'),null);});
test('rejects expired credentials and credentials for another client',()=>{const base={iss:'accounts.google.com',sub:'user-1',email:'listener@gmail.com',email_verified:true,name:'Listener',exp:2000};assert.throws(()=>parseGoogleCredential(credential({...base,aud:'other'}),'aurora-client',1_000_000),/validar/);assert.throws(()=>parseGoogleCredential(credential({...base,aud:'aurora-client',exp:1000}),'aurora-client',1_000_000),/validar/);});
