import { database, failure, identity, origin, stripe } from "../../../lib/server/billing";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const base = origin(request); const user = await identity(request);
    const data = (await database().collection("billingCustomers").doc(user.uid).get()).data();
    if (typeof data?.customerId !== "string") return failure();
    const session = await stripe().billingPortal.sessions.create({ customer: data.customerId, return_url: `${base}/settings` });
    return Response.json({ url: session.url });
  } catch { return failure(); }
}
