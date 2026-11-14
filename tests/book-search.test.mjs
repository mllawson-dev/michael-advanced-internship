import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSearchBooks, searchBooks } from '../app/lib/book-search.ts';
const book = { id: 'one', title: 'Title', author: 'Author', subTitle: 'Subtitle', type: 'Audio', imageLink: 'https://firebasestorage.googleapis.com/v0/b/summaristt.appspot.com/o/books%2Fimages%2Fone.png', summary: 'Do not expose' };
test('search projects only display fields and rejects malformed or duplicate results', () => {
  assert.deepEqual(parseSearchBooks([book]), [{id: book.id, title: book.title, author: book.author, imageLink: book.imageLink}]);
  for (const value of [null, {}, [book, book], [{...book, id: '../bad'}], [{...book, imageLink: 'https://evil.test/a.png'}]]) assert.throws(() => parseSearchBooks(value));
});
test('search validates before fetching and encodes title/author queries', async () => {
  const signal = new AbortController().signal;
  for (const query of [' ', 'a'.repeat(201)]) assert.equal((await searchBooks(query, signal, () => { throw Error('must not fetch'); })).status, 'empty');
  const result = await searchBooks('  Author & Title  ', signal, async (url, options) => {
    assert.ok(url.endsWith('search=Author%20%26%20Title'));
    assert.equal(options.cache, 'no-store');
    return new Response(JSON.stringify([book]));
  });
  assert.equal(result.status, 'success');
  for (const [response, status] of [[new Response('[]'), 'empty'], [new Response('bad'), 'error'], [new Response('{}'), 'error'], [new Response('', {status: 500}), 'error']]) assert.equal((await searchBooks('test', signal, async () => response)).status, status);
});
