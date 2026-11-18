import type { Transaction } from "firebase-admin/firestore";
import { database, stripe } from "../../../lib/server/billing";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error("Missing signature secret");
    const event = stripe().webhooks.constructEvent(await request.text(), request.headers.get("stripe-signature") ?? "", secret);
    if (event.livemode) throw new Error("Live event denied");
    const relevant = ["charge.refunded", "charge.dispute.created", "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted", "checkout.session.completed"];
    if (!relevant.includes(event.type)) return Response.json({ received: true });
    const object = event.data.object as unknown as { customer?: string; charge?: string; status?: string; trial_start?: number; refunded?: boolean };
    if (event.type === "charge.dispute.created" && typeof object.charge === "string") {
      const charge = await stripe().charges.retrieve(object.charge);
      if (typeof charge.customer === "string") object.customer = charge.customer;
    }
    if (typeof object.customer !== "string") return Response.json({ received: true });
    const customers = await database().collection("billingCustomers").where("customerId", "==", object.customer).limit(1).get();
    if (customers.empty) return Response.json({ received: true });
    const customer = customers.docs[0].ref;
    const eventRef = database().collection("billingEvents").doc(event.id);
    // Persist risk blocks separately: old subscription events must never restore refunded/disputed access.
    await database().runTransaction(async (tx: Transaction) => {
      if ((await tx.get(eventRef)).exists) return;
      const data: Record<string, unknown> = { updatedAt: Date.now() };
      if (event.type === "charge.dispute.created" || (event.type === "charge.refunded" && object.refunded === true)) data.blocked = true;
      if (event.type.startsWith("customer.subscription.") && object.trial_start) data.trialUsed = true;
      tx.set(customer, data, { merge: true });
      tx.create(eventRef, { type: event.type, created: event.created, processedAt: Date.now() });
    });
    return Response.json({ received: true });
  } catch { return Response.json({ error: "Webhook verification or persistence failed" }, { status: 400 }); }
}
