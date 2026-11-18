import type { Transaction } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";
import { database, failure, identity, origin, prices, stripe, subscription } from "../../../lib/server/billing";
export const runtime = "nodejs";
export async function POST(request: Request) {
  let release: (() => Promise<void>) | undefined;
  try {
    const base = origin(request);
    const user = await identity(request);
    const body = await request.json();
    if (body.plan !== "monthly" && body.plan !== "annual") return failure();
    const plan: "monthly" | "annual" = body.plan;
    const price = prices()[plan];
    const ref = database().collection("billingCustomers").doc(user.uid);
    const owner = randomUUID();
    await database().runTransaction(async (tx: Transaction) => {
      const doc = await tx.get(ref);
      if ((doc.data()?.lockUntil ?? 0) > Date.now()) throw new Error("Checkout pending");
      tx.set(ref, { lockUntil: Date.now() + 120000, owner }, { merge: true });
    });
    release = async () => { await database().runTransaction(async (tx: Transaction) => { const doc = await tx.get(ref); if (doc.data()?.owner === owner) tx.update(ref, { lockUntil: 0 }); }); };
    if (!(await subscription(user.uid)).checkoutAllowed) return Response.json({ error: "Checkout is unavailable for this account. Review your existing subscription in Settings." }, { status: 409 });
    let data = (await ref.get()).data();
    const client = stripe();
    let customer = data?.customerId;
    if (typeof customer !== "string") {
      const created = await client.customers.create({ email: user.email, metadata: { firebaseUID: user.uid } }, { idempotencyKey: `customer-${user.uid}` });
      customer = created.id;
      await ref.set({ customerId: customer }, { merge: true });
    }
    if (typeof data?.checkoutId === "string") {
      const previous = await client.checkout.sessions.retrieve(data.checkoutId);
      if (previous.status === "open") {
        if (data.checkoutPlan === plan) return Response.json({ url: previous.url });
        await client.checkout.sessions.expire(previous.id);
      }
    }
    data = (await ref.get()).data();
    if (data?.checkoutPending && data.checkoutPlan !== plan) throw new Error("Previous checkout is still being recovered; retry its selected plan first");
    const count = Number(data?.checkoutCount ?? 0) + (data?.checkoutPending ? 0 : 1);
    let trialUsed = data?.trialUsed === true;
    for await (const previous of client.subscriptions.list({ customer, status: "all", limit: 100 })) {
      if (previous.trial_start !== null) trialUsed = true;
    }
    // Freeze all parameters before the external call so a response-loss retry is identical.
    const checkoutTrial = data?.checkoutPending ? data.checkoutTrial === true : plan === "annual" && !trialUsed;
    await ref.set({ checkoutCount: count, checkoutPending: true, checkoutPlan: plan, checkoutTrial }, { merge: true });
    const session = await client.checkout.sessions.create({ mode: "subscription", customer, client_reference_id: user.uid, line_items: [{ price, quantity: 1 }], success_url: `${base}/choose-plan?checkout=success`, cancel_url: `${base}/choose-plan?checkout=cancelled&plan=${plan}`, subscription_data: { metadata: { firebaseUID: user.uid }, ...(checkoutTrial ? { trial_period_days: 7 } : {}) } }, { idempotencyKey: `checkout-${user.uid}-${count}` });
    await ref.set({ checkoutId: session.id, checkoutPlan: plan, checkoutCount: count, checkoutPending: false }, { merge: true });
    return Response.json({ url: session.url });
  } catch { return failure(); }
  finally { try { await release?.(); } catch { /* Lease expires automatically; never expose infrastructure errors. */ } }
}
