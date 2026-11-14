export type BookContent = { summary: string; audioLink: string | null };
export type ContentResult = { status: "success"; content: BookContent } | { status: "empty" | "error" | "blocked" };

export function parseBookContent(value: unknown, id: string): ContentResult {
  if (value === null) return { status: "empty" };
  if (!value || typeof value !== "object") throw new Error("Invalid content");
  const record = value as Record<string, unknown>;
  if (record.id !== id || typeof record.subscriptionRequired !== "boolean") throw new Error("Invalid book");
  // Fail closed: login alone never grants premium entitlements.
  if (record.subscriptionRequired) return { status: "blocked" };
  const summary = typeof record.summary === "string" ? record.summary.trim() : "";
  let audioLink: string | null = null;
  if (record.audioLink !== undefined && record.audioLink !== null && record.audioLink !== "") {
    if (typeof record.audioLink !== "string") throw new Error("Invalid audio");
    const url = new URL(record.audioLink);
    if (url.protocol !== "https:" || url.hostname !== "firebasestorage.googleapis.com" || url.username || url.password || url.port ||
        !url.pathname.startsWith("/v0/b/summaristt.appspot.com/o/books%2Faudios%2F")) throw new Error("Untrusted audio");
    audioLink = url.href;
  }
  if (!summary && !audioLink) return { status: "empty" };
  return { status: "success", content: { summary, audioLink } };
}

export async function loadBookContent(id: string, signal: AbortSignal, fetcher: typeof fetch = fetch): Promise<ContentResult> {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) return { status: "empty" };
  try {
    // Public upstream content; this client gate is not server authorization.
    const response = await fetcher(`https://us-central1-summaristt.cloudfunctions.net/getBook?id=${encodeURIComponent(id)}`, {
      cache: "no-store", signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
    });
    if (response.status === 404) return { status: "empty" };
    if (!response.ok) return { status: "error" };
    const body = await response.text();
    return body.trim() ? parseBookContent(JSON.parse(body), id) : { status: "empty" };
  } catch { return { status: "error" }; }
}
