export type SelectedBook = {
  id: string;
  title: string;
  author: string;
  subTitle: string;
  imageLink: string;
  type: string;
};
export type SelectedBookResult =
  | { status: "success"; book: SelectedBook }
  | { status: "empty" }
  | { status: "error" };

const selectedEndpoint = "https://us-central1-summaristt.cloudfunctions.net/getBooks?status=selected";

export function parseSelectedBook(value: unknown): SelectedBook | null {
  // The supplied API currently returns an array, although the brief describes one object.
  const candidates = Array.isArray(value) ? value : value === null ? [] : [value];
  if (!candidates.length) return null;
  const entry = candidates.find((item) => item && typeof item === "object" && item.status === "selected") ?? candidates[0];
  return parseCatalogBook(entry, "selected");
}

function parseCatalogBook(value: unknown, expectedStatus: "selected" | "recommended" | "suggested"): SelectedBook {
  if (!value || typeof value !== "object") throw new Error("Invalid catalog book.");
  const record = value as Record<string, unknown>;
  const required = ["id", "title", "author", "subTitle", "imageLink", "type"] as const;
  for (const field of required) {
    if (typeof record[field] !== "string" || !record[field].trim()) throw new Error("Incomplete catalog book.");
  }
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(record.id as string)) throw new Error("Invalid book identifier.");
  if (record.status !== undefined && record.status !== expectedStatus) throw new Error("Unexpected book status.");
  const image = new URL(record.imageLink as string);
  // Fail closed on untrusted media origins; Next Image uses the same restricted bucket.
  if (image.protocol !== "https:" || image.hostname !== "firebasestorage.googleapis.com" || image.username || image.password || image.port ||
      !image.pathname.startsWith("/v0/b/summaristt.appspot.com/o/books%2Fimages%2F")) {
    throw new Error("Invalid book cover source.");
  }
  return Object.fromEntries(required.map((field) => [field, (record[field] as string).trim()])) as SelectedBook;
}

export async function loadSelectedBook(fetcher: typeof fetch = fetch): Promise<SelectedBookResult> {
  try {
    // Public catalog endpoint; no auth credentials, private records, or writes are involved.
    const response = await fetcher(selectedEndpoint, { cache: "no-store", signal: AbortSignal.timeout(10000) });
    if (!response.ok) return { status: "error" };
    const book = parseSelectedBook(await response.json());
    return book ? { status: "success", book } : { status: "empty" };
  } catch {
    return { status: "error" };
  }
}


export type BookListItem = SelectedBook & { averageRating: number; subscriptionRequired: boolean };
export type BookListKind = "recommended" | "suggested";
export type BookListResult =
  | { status: "success"; books: BookListItem[] }
  | { status: "empty" }
  | { status: "error" };

function parseBookList(value: unknown, kind: BookListKind): BookListItem[] {
  if (value === null) return [];
  if (!Array.isArray(value)) throw new Error("Expected a book list.");
  const ids = new Set<string>();
  return value.map((item) => {
    const base = parseCatalogBook(item, kind);
    const record = item as Record<string, unknown>;
    if (typeof record.subscriptionRequired !== "boolean" || typeof record.averageRating !== "number" ||
        !Number.isFinite(record.averageRating) || record.averageRating < 0 || record.averageRating > 5 || ids.has(base.id)) {
      throw new Error("Invalid book-list metadata.");
    }
    ids.add(base.id);
    return { ...base, averageRating: record.averageRating, subscriptionRequired: record.subscriptionRequired };
  });
}

export function parseRecommendedBooks(value: unknown): BookListItem[] {
  return parseBookList(value, "recommended");
}

export function parseSuggestedBooks(value: unknown): BookListItem[] {
  return parseBookList(value, "suggested");
}

async function loadBookList(kind: BookListKind, fetcher: typeof fetch): Promise<BookListResult> {
  try {
    const response = await fetcher(`https://us-central1-summaristt.cloudfunctions.net/getBooks?status=${kind}`, {
      cache: "no-store", signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return { status: "error" };
    const books = parseBookList(await response.json(), kind);
    return books.length ? { status: "success", books } : { status: "empty" };
  } catch {
    return { status: "error" };
  }
}

export function loadRecommendedBooks(fetcher: typeof fetch = fetch): Promise<BookListResult> {
  return loadBookList("recommended", fetcher);
}

export function loadSuggestedBooks(fetcher: typeof fetch = fetch): Promise<BookListResult> {
  return loadBookList("suggested", fetcher);
}
