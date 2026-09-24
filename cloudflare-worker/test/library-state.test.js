import test from 'node:test';
import assert from 'node:assert/strict';
import {applyLibraryAction,publicLibrary} from '../src/library-state.js';

const track={id:'aaaaaaaaaaa',title:'Faixa',artist:'Artista',album:'YouTube',duration:'3:00',artwork:'https://example.com/a.jpg',accent:'#7c5cff'};
test('imports each browser library once and preserves the union',()=>{let state=applyLibraryAction(null,{type:'import',deviceId:'device-browser-a',tracks:[track]});state=applyLibraryAction(state,{type:'import',deviceId:'device-browser-a',tracks:[]});assert.deepEqual(publicLibrary(state).likedTracks,[track]);assert.equal(state.revision,1);});
test('like actions synchronize additions and removals',()=>{let state=applyLibraryAction(null,{type:'like',track,liked:true});assert.equal(publicLibrary(state).likedTracks.length,1);state=applyLibraryAction(state,{type:'like',track,liked:false});assert.equal(publicLibrary(state).likedTracks.length,0);assert.equal(state.revision,2);});
test('rejects malformed and oversized imports',()=>{assert.throws(()=>applyLibraryAction(null,{type:'like',track:{id:'bad'},liked:true}),/Curtida inválida/);assert.throws(()=>applyLibraryAction(null,{type:'import',deviceId:'device-browser-a',tracks:Array(501).fill(track)}),/Biblioteca inválida/);});
