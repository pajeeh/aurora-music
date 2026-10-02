import test from 'node:test';import assert from 'node:assert/strict';import {protectSecret,unprotectSecret} from '../src/secrets.mjs';
test('protects the device token with Windows DPAPI',()=>{const token='private-device-token';const encrypted=protectSecret(token);assert.notEqual(encrypted,token);assert.equal(unprotectSecret(encrypted),token);});
