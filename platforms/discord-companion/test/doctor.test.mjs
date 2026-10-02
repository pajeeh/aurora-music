import test from 'node:test';import assert from 'node:assert/strict';
import {summarize,supportsNode} from '../src/doctor.mjs';

test('accepts the supported Node.js line',()=>{assert.equal(supportsNode('22.12.0'),true);assert.equal(supportsNode('21.7.0'),false);});
test('fails only when diagnostics contain an error',()=>{assert.equal(summarize([{level:'ok'},{level:'warn'}]),0);assert.equal(summarize([{level:'error'}]),1);});
