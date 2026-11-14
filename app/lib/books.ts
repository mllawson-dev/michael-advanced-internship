export type SelectedBook = {
  id: string;
  title: string;
  author: string;
  subTitle: string;
  imageLink: string;
  type: string;
  audioLink?: string;
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

export function parseCatalogBook(value: unknown, expectedStatus?: "selected" | "recommended" | "suggested"): SelectedBook {
  if (!value || typeof value !== "object") throw new Error("Invalid catalog book.");
  const record = value as Record<string, unknown>;
  const required = ["id", "title", "author", "subTitle", "imageLink", "type"] as const;
  for (const field of required) {
    if (typeof record[field] !== "string" || !record[field].trim()) throw new Error("Incomplete catalog book.");
  }
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(record.id as string)) throw new Error("Invalid book identifier.");
  if (expectedStatus && record.status !== undefined && record.status !== expectedStatus) throw new Error("Unexpected book status.");
  const image = new URL(record.imageLink as string);
  // Fail closed on untrusted media origins; Next Image uses the same restricted bucket.
  if (image.protocol !== "https:" || image.hostname !== "firebasestorage.googleapis.com" || image.username || image.password || image.port ||
      !image.pathname.startsWith("/v0/b/summaristt.appspot.com/o/books%2Fimages%2F")) {
    throw new Error("Invalid book cover source.");
  }
  const book = Object.fromEntries(required.map((field) => [field, (record[field] as string).trim()])) as SelectedBook;
  if (typeof record.audioLink === "string" && record.audioLink) {
    const audio = new URL(record.audioLink);
    if (audio.protocol !== "https:" || audio.hostname !== "firebasestorage.googleapis.com" || audio.username || audio.password || audio.port ||
        !audio.pathname.startsWith("/v0/b/summaristt.appspot.com/o/books%2Faudios%2F")) throw new Error("Invalid audio source.");
    book.audioLink = audio.href;
  }
  return book;
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


export type BookDetails = BookListItem & {
  totalRating: number;
  keyIdeas: number;
  tags: string[];
  bookDescription: string;
  authorDescription: string;
};
export type BookDetailsResult =
  | { status: "success"; book: BookDetails }
  | { status: "empty" }
  | { status: "error" };

export function parseBookDetails(value: unknown, id: string): BookDetails | null {
  if (value === null) return null;
  const base = parseCatalogBook(value);
  const record = value as Record<string, unknown>;
  if (base.id !== id || typeof record.subscriptionRequired !== "boolean" ||
      typeof record.averageRating !== "number" || !Number.isFinite(record.averageRating) ||
      record.averageRating < 0 || record.averageRating > 5 ||
      !Number.isSafeInteger(record.totalRating) || (record.totalRating as number) < 0 ||
      !Number.isSafeInteger(record.keyIdeas) || (record.keyIdeas as number) < 0 ||
      !Array.isArray(record.tags) || !record.tags.every((tag) => typeof tag === "string" && tag.trim()) ||
      typeof record.bookDescription !== "string" || !record.bookDescription.trim() ||
      typeof record.authorDescription !== "string" || !record.authorDescription.trim()) {
    throw new Error("Invalid book details.");
  }
  // Project public details and validated audio metadata source; summary and upstream extras stay out.
  return { ...base, subscriptionRequired: record.subscriptionRequired, averageRating: record.averageRating,
    totalRating: record.totalRating as number, keyIdeas: record.keyIdeas as number,
    tags: [...new Set((record.tags as string[]).map((tag) => tag.trim()))],
    bookDescription: record.bookDescription.trim(), authorDescription: record.authorDescription.trim() };
}

export async function loadBookDetails(id: string, fetcher: typeof fetch = fetch): Promise<BookDetailsResult> {
  // Fail closed before fetching on invalid route input; never construct an arbitrary upstream URL.
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) return { status: "empty" };
  try {
    const response = await fetcher(`https://us-central1-summaristt.cloudfunctions.net/getBook?id=${encodeURIComponent(id)}`, {
      cache: "no-store", signal: AbortSignal.timeout(10000),
    });
    if (response.status === 404) return { status: "empty" };
    if (!response.ok) return { status: "error" };
    // Unknown IDs currently return HTTP 200 with an empty body.
    const text = await response.text();
    if (!text.trim()) return { status: "empty" };
    const book = parseBookDetails(JSON.parse(text), id);
    return book ? { status: "success", book } : { status: "empty" };
  } catch {
    return { status: "error" };
  }
}
