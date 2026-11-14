import { parseCatalogBook, type SelectedBook } from "./books.ts";

export type SearchBook = Pick<SelectedBook, "id" | "title" | "author" | "imageLink">;
export type SearchResult = { status: "success"; books: SearchBook[] } | { status: "empty" } | { status: "error" };
export function parseSearchBooks(value: unknown): SearchBook[] {
  if (!Array.isArray(value)) throw new Error("Invalid search response");
  const ids = new Set<string>();
  return value.map((record) => {
    const { id, title, author, imageLink } = parseCatalogBook(record);
    if (ids.has(id)) throw new Error("Duplicate result");
    ids.add(id);
    return { id, title, author, imageLink };
  });
}
export async function searchBooks(query: string, signal: AbortSignal, fetcher: typeof fetch = fetch): Promise<SearchResult> {
  const term = query.trim();
  // Fail closed before fetching invalid/empty input. Search is public and read-only.
  if (!term || term.length > 200) return { status: "empty" };
  try {
    const response = await fetcher(`https://us-central1-summaristt.cloudfunctions.net/getBooksByAuthorOrTitle?search=${encodeURIComponent(term)}`, {
      cache: "no-store", signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
    });
    if (!response.ok) return { status: "error" };
    const books = parseSearchBooks(await response.json());
    return books.length ? { status: "success", books } : { status: "empty" };
  } catch { return { status: "error" }; }
}
