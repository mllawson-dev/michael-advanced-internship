import type { User } from "firebase/auth";
export type LibraryBook = { id: string; title: string; author: string; imageLink: string; subscriptionRequired: boolean; saved?: boolean; finished?: boolean };
export async function libraryRequest(user: User, action?: "save" | "remove" | "finish", id?: string, signal?: AbortSignal) {
  const token = await user.getIdToken();
  const requestSignal = signal ? AbortSignal.any([signal, AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000);
  const books: LibraryBook[] = [];
  let cursor: string | null = null;
  do {
    const response = await fetch(`/api/library${cursor ? `?after=${encodeURIComponent(cursor)}` : ""}`, {
      method: action ? "POST" : "GET", cache: "no-store",
      headers: { authorization: `Bearer ${token}`, ...(action ? { "Content-Type": "application/json" } : {}) },
      ...(action ? { body: JSON.stringify({ id, action }) } : {}),
      signal: requestSignal,
    });
    if (!response.ok) throw new Error("Library unavailable");
    const page = await response.json() as { books?: LibraryBook[]; ok?: boolean; nextCursor?: string | null };
    if (action) return page;
    if (!Array.isArray(page.books)) throw new Error("Invalid library response");
    books.push(...page.books);
    const next = page.nextCursor ?? null;
    if (next !== null && (typeof next !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(next) || (cursor !== null && next <= cursor))) throw new Error("Invalid library cursor");
    cursor = next;
  } while (cursor);
  return { books };
}
