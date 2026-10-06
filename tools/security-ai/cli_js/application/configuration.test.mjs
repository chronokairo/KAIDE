import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requireApiKey } from './configuration.mjs';
test('missing, empty and malformed secrets fail before browser or network startup', () => {
  for (const value of [undefined, '', '   ', 'secret\r\nheader']) assert.throws(() => requireApiKey({ SECURITY_AI_API_KEY: value }));
});
test('explicit environment input supports legitimate provider authentication', () => {
  assert.equal(requireApiKey({ SECURITY_AI_API_KEY: ' test-only-key ' }), 'test-only-key');
});
