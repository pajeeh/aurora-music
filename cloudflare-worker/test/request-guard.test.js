import test from 'node:test';
import assert from 'node:assert/strict';
import {boundedForward} from '../src/request-guard.js';

test('measures the real request body when Content-Length is absent or false',async()=>{
  const oversized=new Request('https://aurora.test/api',{method:'POST',body:'x'.repeat(11)});
  oversized.headers.delete('Content-Length');
  assert.equal(await boundedForward(oversized,'https://internal.test/',10),null);
  const forged=new Request('https://aurora.test/api',{method:'POST',headers:{'Content-Length':'1'},body:'x'.repeat(11)});
  assert.equal(await boundedForward(forged,'https://internal.test/',10),null);
});

test('forwards bounded payloads without changing their bytes',async()=>{
  const request=new Request('https://aurora.test/api',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"ok":true}'});
  const forwarded=await boundedForward(request,'https://internal.test/api',32);
  assert.equal(await forwarded.text(),'{"ok":true}');
  assert.equal(forwarded.headers.get('Content-Type'),'application/json');
});
