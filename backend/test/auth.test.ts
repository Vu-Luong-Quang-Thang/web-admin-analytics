import assert from 'node:assert/strict';
import test from 'node:test';
import { googlePrincipalUserId } from '../src/auth.js';

test('derives the same stable TrọƠi user id from Google identity', () => {
  assert.equal(
    googlePrincipalUserId('https://accounts.google.com', '112345678901234567890'),
    'a91e0ddd-a81d-5fec-b3af-0f7ed5ed53f2',
  );
});
