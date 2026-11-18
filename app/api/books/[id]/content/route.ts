import { identity, subscription } from "../../../../lib/server/billing";
import { parseBookContent } from "../../../../lib/book-content";
export const runtime = "nodejs";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) return Response.json({ status: "empty" }, { status: 404 });
    const user = await identity(request);
    if (!(await subscription(user.uid)).entitled) return Response.json({ status: "blocked" }, { status: 403 });
    const response = await fetch(`https://us-central1-summaristt.cloudfunctions.net/getBook?id=${encodeURIComponent(id)}`, { cache: "no-store", signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error("Unavailable");
    return Response.json(parseBookContent(await response.json(), id, true), { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ status: "error" }, { status: 403 }); }
}
