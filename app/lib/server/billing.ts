import "server-only";
import Stripe from "stripe";
import { accessForSubscription, canStartCheckout } from "../billing-policy";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

export function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key?.startsWith("sk_test_")) throw new Error("Test billing is not configured");
  return new Stripe(key, { maxNetworkRetries: 2, timeout: 10000 });
}
export function database() {
  const app = getApps().find((app) => app.name === "billing") ?? initializeApp({ credential: applicationDefault(), projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID }, "billing");
  return getFirestore(app);
}
export async function identity(request: Request) {
  if (process.env.NEXT_PUBLIC_AUTH_MODE !== "firebase" || process.env.FIREBASE_AUTH_EMULATOR_HOST) throw new Error("Live identity required");
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new Error("Authentication required");
  database();
  const user = await getAuth(getApps().find((app) => app.name === "billing")).verifyIdToken(token, true);
  if (user.firebase.sign_in_provider === "anonymous") throw new Error("Registered account required");
  return user;
}
export function origin(request?: Request) {
  const value = process.env.APP_URL;
  if (!value) throw new Error("APP_URL is required");
  const url = new URL(value);
  if (url.pathname !== "/" || url.search || url.hash || url.username || url.password || (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)))) throw new Error("Invalid APP_URL");
  if (request && request.headers.get("origin") !== url.origin) throw new Error("Invalid origin");
  return url.origin;
}
export function prices() {
  const monthly = process.env.STRIPE_MONTHLY_PRICE_ID;
  const annual = process.env.STRIPE_ANNUAL_PRICE_ID;
  if (!monthly?.startsWith("price_") || !annual?.startsWith("price_") || monthly === annual) throw new Error("Prices not configured");
  return { monthly, annual };
}
export async function subscription(uid: string) {
  const doc = await database().collection("billingCustomers").doc(uid).get();
  const customer = doc.data()?.customerId;
  if (typeof customer !== "string") return { plan: "basic", status: "none", entitled: false, checkoutAllowed: doc.data()?.blocked !== true };
  const list = await stripe().subscriptions.list({ customer, status: "all", limit: 100 });
  const allowed = prices();
  if (list.has_more) throw new Error("Subscription reconciliation exceeds bounded limit");
  const active = list.data.find((item) => ["active", "trialing"].includes(item.status) && item.items.data.some((line) => [allowed.monthly, allowed.annual].includes(line.price.id)));
  const blocked = doc.data()?.blocked === true;
  const status = active?.status ?? list.data[0]?.status ?? "none";
  const price = active?.items.data.find((item) => [allowed.monthly, allowed.annual].includes(item.price.id))?.price.id ?? "";
  return { ...accessForSubscription(status, price, allowed.monthly, allowed.annual, blocked), status, checkoutAllowed: canStartCheckout(blocked, list.data.map((item) => ({ status: item.status, priceIds: item.items.data.map((line) => line.price.id) })), [allowed.monthly, allowed.annual]) };
}
export function failure() { return Response.json({ error: "Billing is unavailable or access was denied. Please try again." }, { status: 403, headers: { "Cache-Control": "no-store" } }); }
