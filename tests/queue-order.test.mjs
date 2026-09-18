import test from 'node:test';
import assert from 'node:assert/strict';
import { shuffleQueue } from '../src/queue-order.ts';
test('shuffle preserves membership and current track without changing source order',()=>{
  const queue=[{id:'a'},{id:'b'},{id:'c'},{id:'d'}];
  const shuffled=shuffleQueue(queue,'b',()=>0);
  assert.equal(shuffled[0].id,'b');
  assert.deepEqual(shuffled.map(t=>t.id).sort(),['a','b','c','d']);
  assert.deepEqual(queue.map(t=>t.id),['a','b','c','d']);
  assert.notDeepEqual(shuffled,queue);
});
test('shuffle handles empty queue and absent current track',()=>{
  assert.deepEqual(shuffleQueue([],'x'),[]);
  assert.deepEqual(shuffleQueue([{id:'a'}],'x'),[{id:'a'}]);
});
