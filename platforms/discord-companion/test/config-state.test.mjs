import test from 'node:test';
import assert from 'node:assert/strict';
import {discordTokenFields,mergePairingConfig} from '../src/config-state.mjs';

test('accepts an absent config while starting Discord authentication',()=>{
  assert.deepEqual(discordTokenFields(undefined),{protectedAccessToken:undefined,protectedRefreshToken:undefined});
});

test('repairing Aurora pairing preserves the Discord session',()=>{
  const current={protectedDiscordAccessToken:'access',protectedDiscordRefreshToken:'refresh',custom:'keep'};
  assert.deepEqual(mergePairingConfig(current,'device','2026-10-31T16:30:00.000Z'),{
    ...current,protectedToken:'device',pairedAt:'2026-10-31T16:30:00.000Z'
  });
});
