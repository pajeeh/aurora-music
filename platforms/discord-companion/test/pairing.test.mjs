import test from 'node:test';import assert from 'node:assert/strict';
import {normalizePairCode,retryDelay,validPairCode} from '../src/pairing.mjs';

test('accepts a code or an Aurora protocol link',()=>{
  assert.equal(normalizePairCode('1234 5678'),'12345678');
  assert.equal(normalizePairCode('aurora://discord-pair?code=12345678'),'12345678');
  assert.equal(validPairCode('aurora://discord-pair?code=12345678'),true);
  assert.equal(validPairCode('aurora://wrong?code=12345678'),false);
});

test('backs off temporary failures and waits for an explicit repair after revocation',()=>{
  assert.equal(retryDelay(0),5000);
  assert.equal(retryDelay(1),10000);
  assert.equal(retryDelay(10),60000);
  assert.equal(retryDelay(3,{needsPairing:true}),30000);
});
