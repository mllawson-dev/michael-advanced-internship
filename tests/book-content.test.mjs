import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseBookContent, loadBookContent } from '../app/lib/book-content.ts';
const book = { id: 'free', subscriptionRequired: false, summary: 'First paragraph\n\nSecond paragraph', audioLink: 'https://firebasestorage.googleapis.com/v0/b/summaristt.appspot.com/o/books%2Faudios%2Fbook.mp3?alt=media' };
test('projects text and restricted audio, supports either format independently', () => {
  assert.equal(parseBookContent(book, 'free').content.summary, book.summary);
  assert.equal(parseBookContent({...book, summary: ''}, 'free').status, 'success');
  assert.equal(parseBookContent({...book, audioLink: ''}, 'free').content.audioLink, null);
  assert.equal(parseBookContent({...book, summary: '', audioLink: ''}, 'free').status, 'empty');
});
test('premium content fails closed and mismatched IDs or untrusted media are rejected', () => {
  assert.equal(parseBookContent({...book, subscriptionRequired: true}, 'free').status, 'blocked');
  assert.throws(() => parseBookContent(book, 'other'));
  for (const audioLink of ['javascript:alert(1)', 'https://evil.test/a.mp3', 'https://firebasestorage.googleapis.com/v0/b/other/o/books%2Faudios%2Fa.mp3']) assert.throws(() => parseBookContent({...book, audioLink}, 'free'));
});
test('loader validates before fetch and handles missing, malformed, and failed responses', async () => {
  const signal = new AbortController().signal;
  assert.equal((await loadBookContent('../bad', signal, () => { throw Error('must not fetch'); })).status, 'empty');
  for (const [response, status] of [[new Response(JSON.stringify(book)), 'success'], [new Response(''), 'empty'], [new Response('bad'), 'error'], [new Response('', {status: 503}), 'error'], [new Response('', {status: 404}), 'empty']]) {
    assert.equal((await loadBookContent('free', signal, async (_url, options) => { assert.equal(options.cache, 'no-store'); return response; })).status, status);
  }
});
