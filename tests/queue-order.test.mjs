import test from 'node:test';
import assert from 'node:assert/strict';
import { shuffleQueue, moveQueueTrack } from '../src/queue-order.ts';

test('shuffle preserves membership and current track without changing source order', () => {
  const queue = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
  const shuffled = shuffleQueue(queue, 'b', () => 0);
  assert.equal(shuffled[0].id, 'b');
  assert.deepEqual(shuffled.map(t => t.id).sort(), ['a', 'b', 'c', 'd']);
  assert.deepEqual(queue.map(t => t.id), ['a', 'b', 'c', 'd']);
  assert.notDeepEqual(shuffled, queue);
});

test('shuffle handles empty queue and absent current track', () => {
  assert.deepEqual(shuffleQueue([], 'x'), []);
  assert.deepEqual(shuffleQueue([{ id: 'a' }], 'x'), [{ id: 'a' }]);
});

test('moveQueueTrack moves items up and down safely', () => {
  const queue = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  // Move 'b' up -> ['b', 'a', 'c']
  const up = moveQueueTrack(queue, 'b', 'up');
  assert.deepEqual(up.map(t => t.id), ['b', 'a', 'c']);

  // Move 'b' down -> ['a', 'c', 'b']
  const down = moveQueueTrack(queue, 'b', 'down');
  assert.deepEqual(down.map(t => t.id), ['a', 'c', 'b']);

  // Boundary checks: move first item up or last item down does nothing
  assert.deepEqual(moveQueueTrack(queue, 'a', 'up'), queue);
  assert.deepEqual(moveQueueTrack(queue, 'c', 'down'), queue);

  // Unknown ID returns original
  assert.deepEqual(moveQueueTrack(queue, 'unknown', 'up'), queue);
});
