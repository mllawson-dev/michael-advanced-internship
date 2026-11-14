import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSelectedBook, parseSelectedBook, loadRecommendedBooks, parseRecommendedBooks, loadSuggestedBooks, parseSuggestedBooks } from '../app/lib/books.ts';

const book = { id: 'book-1', title: 'A Book', author: 'An Author', subTitle: 'An idea', type: 'Audio & Text', status: 'selected', imageLink: 'https://firebasestorage.googleapis.com/v0/b/summaristt.appspot.com/o/books%2Fimages%2Fcover.png?alt=media' };

test('normalizes array and object responses without exposing unused book payload', () => {
  const parsed = parseSelectedBook([{ ...book, summary: 'not needed in the card' }]);
  assert.equal(parsed.title, book.title);
  assert.equal('summary' in parsed, false);
  assert.deepEqual(parseSelectedBook(book), parsed);
  assert.equal(parseSelectedBook([]), null);
  assert.equal(parseSelectedBook(null), null);
});

test('rejects malformed, non-selected, or untrusted media records', () => {
  for (const value of [{}, [null], { ...book, id: '../bad' }, { ...book, title: '' }, { ...book, status: 'recommended' }, { ...book, imageLink: 'https://example.com/cover.png' }, { ...book, imageLink: book.imageLink.replace('https:', 'http:') }, { ...book, imageLink: book.imageLink.replace('https://', 'https://name:password@') }]) {
    assert.throws(() => parseSelectedBook(value));
  }
});

test('handles success and empty upstream data with bounded uncached requests', async () => {
  const fetcher = async (url, options) => {
    assert.match(url, /getBooks\?status=selected$/);
    assert.equal(options.cache, 'no-store');
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json([book]);
  };
  assert.equal((await loadSelectedBook(fetcher)).status, 'success');
  assert.deepEqual(await loadSelectedBook(async () => Response.json([])), { status: 'empty' });
});

test('upstream failure, timeout, malformed JSON and invalid records become recoverable errors', async () => {
  const failures = [
    async () => new Response('failed', { status: 503 }),
    async () => { throw new DOMException('timed out', 'TimeoutError'); },
    async () => new Response('not json'),
    async () => Response.json({ broken: true }),
  ];
  for (const fetcher of failures) assert.deepEqual(await loadSelectedBook(fetcher), { status: 'error' });
});


const recommendation = { ...book, status: 'recommended', averageRating: 4.4, subscriptionRequired: false };

test('recommendations preserve API order, premium flags and ratings', () => {
  const books = parseRecommendedBooks([recommendation, { ...recommendation, id: 'book-2', averageRating: 5, subscriptionRequired: true }]);
  assert.deepEqual(books.map(item => item.id), ['book-1', 'book-2']);
  assert.deepEqual(books.map(item => item.subscriptionRequired), [false, true]);
  assert.deepEqual(books.map(item => item.averageRating), [4.4, 5]);
  assert.deepEqual(parseRecommendedBooks([]), []);
  assert.deepEqual(parseRecommendedBooks(null), []);
});

test('rejects invalid recommendation metadata and duplicate IDs', () => {
  for (const value of [recommendation, [null], [{ ...recommendation, subscriptionRequired: 'false' }], [{ ...recommendation, averageRating: NaN }], [{ ...recommendation, averageRating: 6 }], [{ ...recommendation, status: 'suggested' }], [recommendation, recommendation], [{ ...recommendation, imageLink: 'https://example.com/cover.png' }]]) {
    assert.throws(() => parseRecommendedBooks(value));
  }
});

test('recommended loader validates uncached, bounded requests and empty responses', async () => {
  const result = await loadRecommendedBooks(async (url, options) => {
    assert.match(url, /getBooks\?status=recommended$/);
    assert.equal(options.cache, 'no-store');
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json([recommendation]);
  });
  assert.equal(result.status, 'success');
  assert.equal(result.books.length, 1);
  assert.deepEqual(await loadRecommendedBooks(async () => Response.json([])), { status: 'empty' });
});

test('recommended failures remain recoverable without throwing into the page', async () => {
  for (const fetcher of [async () => new Response('failed', { status: 500 }), async () => { throw new DOMException('timed out', 'TimeoutError'); }, async () => new Response('not-json'), async () => Response.json([{ invalid: true }])]) {
    assert.deepEqual(await loadRecommendedBooks(fetcher), { status: 'error' });
  }
});


const suggestion = { ...recommendation, status: 'suggested', subscriptionRequired: true };

test('suggestions preserve API order and validate their own section status', () => {
  const books = parseSuggestedBooks([suggestion, { ...suggestion, id: 'book-2', subscriptionRequired: false }]);
  assert.deepEqual(books.map(item => item.id), ['book-1', 'book-2']);
  assert.deepEqual(books.map(item => item.subscriptionRequired), [true, false]);
  assert.equal(books[0].averageRating, 4.4);
  assert.deepEqual(parseSuggestedBooks([]), []);
  assert.deepEqual(parseSuggestedBooks(null), []);
  assert.throws(() => parseSuggestedBooks([recommendation]));
  assert.throws(() => parseRecommendedBooks([suggestion]));
  assert.throws(() => parseSuggestedBooks([suggestion, suggestion]));
});

test('suggested loader uses the suggested endpoint with bounded uncached requests', async () => {
  const result = await loadSuggestedBooks(async (url, options) => {
    assert.match(url, /getBooks\?status=suggested$/);
    assert.equal(options.cache, 'no-store');
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json([suggestion]);
  });
  assert.equal(result.status, 'success');
  assert.equal(result.books[0].subscriptionRequired, true);
  assert.deepEqual(await loadSuggestedBooks(async () => Response.json([])), { status: 'empty' });
});

test('suggested failure stays local while recommendations can succeed', async () => {
  for (const fetcher of [async () => new Response('failed', { status: 503 }), async () => { throw new DOMException('timed out', 'TimeoutError'); }, async () => new Response('not-json'), async () => Response.json([{ invalid: true }])]) {
    assert.deepEqual(await loadSuggestedBooks(fetcher), { status: 'error' });
  }
  assert.equal((await loadRecommendedBooks(async () => Response.json([recommendation]))).status, 'success');
});
