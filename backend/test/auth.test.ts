import assert from 'node:assert/strict';
import test from 'node:test';
import { googlePrincipalUserId, hashPassword, verifyPassword } from '../src/auth.js';

test('derives the same stable TrọƠi user id from Google identity', () => {
  assert.equal(
    googlePrincipalUserId('https://accounts.google.com', '112345678901234567890'),
    'a91e0ddd-a81d-5fec-b3af-0f7ed5ed53f2',
  );
});

test('hashes passwords with a random salt and verifies without storing plaintext', async () => {
  const password = 'correct-horse-battery-staple';
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  assert.notEqual(first, second);
  assert.ok(!first.includes(password));
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword('wrong-password', first), false);
});
