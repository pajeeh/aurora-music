import test from 'node:test';
import assert from 'node:assert/strict';
import {discordWebhookPayload,normalizeDiscordWebhookTrack,validDiscordWebhookUrl} from '../src/discord-webhook.js';

test('builds a bounded Discord embed without mentions',()=>{
  const payload=discordWebhookPayload({track:{id:'abc123def45',title:' Song ',artist:' Artist ',album:' Album ',artwork:'https://img.example/cover.jpg'}});
  assert.equal(payload.embeds[0].title,'Song');
  assert.equal(payload.embeds[0].url,'https://www.youtube.com/watch?v=abc123def45');
  assert.deepEqual(payload.allowed_mentions,{parse:[]});
  assert.equal(payload.embeds[0].thumbnail.url,'https://img.example/cover.jpg');
});

test('rejects malformed tracks and non-HTTPS artwork',()=>{
  assert.equal(normalizeDiscordWebhookTrack({track:{id:'bad',title:'Song',artist:'Artist'}}),null);
  assert.equal(discordWebhookPayload({track:{id:'abc123def45',title:'',artist:'Artist'}}),null);
  assert.equal(normalizeDiscordWebhookTrack({track:{id:'abc123def45',title:'Song',artist:'Artist',artwork:'http://unsafe'}}).artwork,'');
});

test('accepts only Discord webhook endpoints',()=>{
  assert.equal(validDiscordWebhookUrl('https://discord.com/api/webhooks/123/token_value'),true);
  assert.equal(validDiscordWebhookUrl('https://example.com/api/webhooks/123/token_value'),false);
  assert.equal(validDiscordWebhookUrl('https://discord.com/channels/123/456'),false);
});
