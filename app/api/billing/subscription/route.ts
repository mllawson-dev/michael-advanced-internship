import { failure, identity, subscription } from "../../../lib/server/billing";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try { const user = await identity(request); return Response.json(await subscription(user.uid), { headers: { "Cache-Control": "no-store" } }); }
  catch { return failure(); }
}
