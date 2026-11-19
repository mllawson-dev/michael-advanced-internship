import { FieldPath } from "firebase-admin/firestore";
import { database, identity, origin } from "../../lib/server/billing";
import { loadBookDetails } from "../../lib/books";

export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store" };
const denied = () => Response.json({ error: "Your library is unavailable or access was denied. Please retry." }, { status: 403, headers });
// Newly tracked in Stage 11: no historical saved/finished books exist to backfill.
// Fail closed: verified identity owns the path; never accept a uid or book metadata from the caller.
export async function GET(request: Request) {
  try {
    const user = await identity(request, true);
    const cursor = new URL(request.url).searchParams.get("after");
    if (cursor !== null && !/^[a-zA-Z0-9_-]{1,128}$/.test(cursor)) throw new Error("Invalid cursor");
    let query = database().collection("libraries").doc(user.uid).collection("books").orderBy(FieldPath.documentId());
    if (cursor) query = query.startAfter(cursor);
    const snapshot = await query.limit(101).get();
    const page = snapshot.docs.slice(0, 100);
    const books = page.map((doc) => ({ ...doc.data(), id: doc.id }));
    return Response.json({ books, nextCursor: snapshot.docs.length > 100 ? page.at(-1)!.id : null }, { headers });
  } catch { return denied(); }
}
export async function POST(request: Request) {
  try {
    origin(request);
    const user = await identity(request, true);
    const body = await request.json();
    if (!body || typeof body.id !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(body.id) || !["save", "remove", "finish"].includes(body.action)) throw new Error("Invalid action");
    const ref = database().collection("libraries").doc(user.uid).collection("books").doc(body.id);
    if (body.action === "remove") {
      // Native transaction retries against concurrent finishes; do not leave empty tombstones.
      await database().runTransaction(async (transaction) => {
        const current = await transaction.get(ref);
        if (!current.exists) return;
        if (current.data()?.finished === true) transaction.set(ref, { saved: false }, { merge: true });
        else transaction.delete(ref);
      });
    } else {
      const result = await loadBookDetails(body.id);
      if (result.status !== "success") throw new Error("Book unavailable");
      const { id, title, author, imageLink, subscriptionRequired } = result.book;
      // Merge independent flags so finishing never saves a book or races a remove.
      await ref.set({ id, title, author, imageLink, subscriptionRequired, ...(body.action === "save" ? { saved: true } : { finished: true }) }, { merge: true });
    }
    return Response.json({ ok: true }, { headers });
  } catch { return denied(); }
}
