import test from 'node:test';import assert from 'node:assert/strict';
import {runtimeHealthy,summarize,supportsNode} from '../src/doctor.mjs';

test('accepts the supported Node.js line',()=>{assert.equal(supportsNode('22.12.0'),true);assert.equal(supportsNode('21.7.0'),false);});
test('fails only when diagnostics contain an error',()=>{assert.equal(summarize([{level:'ok'},{level:'warn'}]),0);assert.equal(summarize([{level:'error'}]),1);});
test('accepts only a recent runtime heartbeat with a valid pid',()=>{const now=Date.parse('2026-10-02T12:00:20Z');assert.equal(runtimeHealthy({pid:42,heartbeatAt:'2026-10-02T12:00:05Z'},now),true);assert.equal(runtimeHealthy({pid:42,heartbeatAt:'2026-10-02T11:59:00Z'},now),false);assert.equal(runtimeHealthy({pid:0,heartbeatAt:'2026-10-02T12:00:19Z'},now),false);});
