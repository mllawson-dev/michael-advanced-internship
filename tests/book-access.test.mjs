import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bookDestination, authReturnPath } from '../app/lib/book-access.ts';

test('free books route to player; premium stays closed without verified entitlements', () => {
  assert.equal(bookDestination('example', false), '/player/example');
  assert.equal(bookDestination('example', true), '/choose-plan');
  for (const id of ['', '../escape', 'a?next=https://evil.example', 'a'.repeat(129)]) assert.equal(bookDestination(id, false), null);
});
test('login return paths allow only local book details routes', () => {
  assert.equal(authReturnPath('/book/example'), '/book/example');
  for (const value of [undefined, '', 'https://evil.example', '//evil.example', 'javascript:alert(1)', '/book/../settings', '/book/example?next=evil', '/player/example']) {
    assert.equal(authReturnPath(value), '/for-you');
  }
});
