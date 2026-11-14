import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadBookDetails, parseBookDetails } from '../app/lib/books.ts';
const book = { id: 'example', title: 'Example', author: 'Author', subTitle: 'Subtitle', type: 'Audio & Text', imageLink: 'https://firebasestorage.googleapis.com/v0/b/summaristt.appspot.com/o/books%2Fimages%2Fexample.png', averageRating: 4.5, totalRating: 20, keyIdeas: 7, subscriptionRequired: true, tags: ['Business'], bookDescription: 'Description', authorDescription: 'Biography', summary: 'Excluded', audioLink: 'Excluded' };
test('details project only public view fields and preserve premium metadata', () => {
  const parsed = parseBookDetails(book, 'example');
  assert.equal(parsed.subscriptionRequired, true);
  assert.equal(parsed.bookDescription, 'Description');
  assert.equal('summary' in parsed, false);
  assert.equal('audioLink' in parsed, false);
});
test('rejects mismatched identifiers, untrusted covers and malformed metadata', () => {
  for (const update of [{ id: 'other' }, { imageLink: 'https://evil.example/a.png' }, { subscriptionRequired: 'true' }, { averageRating: 6 }, { totalRating: -1 }, { keyIdeas: 1.5 }, { tags: [''] }, { bookDescription: '' }, { authorDescription: null }]) {
    assert.throws(() => parseBookDetails({ ...book, ...update }, 'example'));
  }
});
test('invalid route input fails closed without fetching', async () => {
  assert.deepEqual(await loadBookDetails('../bad', () => { throw new Error('Must not fetch'); }), { status: 'empty' });
});
test('loader bounds requests and normalizes missing books', async () => {
  const result = await loadBookDetails('example', async (url, options) => {
    assert.match(url, /getBook\?id=example$/);
    assert.equal(options.cache, 'no-store');
    assert.ok(options.signal instanceof AbortSignal);
    return new Response(JSON.stringify(book));
  });
  assert.equal(result.status, 'success');
  for (const response of [new Response(''), new Response('null'), new Response('', { status: 404 })]) {
    assert.deepEqual(await loadBookDetails('missing', async () => response), { status: 'empty' });
  }
});
test('upstream and validation failures are recoverable errors', async () => {
  for (const response of [new Response('invalid'), new Response('{}'), new Response('', { status: 500 })]) {
    assert.deepEqual(await loadBookDetails('example', async () => response), { status: 'error' });
  }
  assert.deepEqual(await loadBookDetails('example', async () => { throw new Error('Timeout'); }), { status: 'error' });
});
