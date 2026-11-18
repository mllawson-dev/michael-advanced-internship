"use client";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "../../components/auth-modal";
import { useSubscription } from "../../components/subscription";
export default function SettingsPage() {
  const { user, loading, open } = useAuth();
  const subscription = useSubscription();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function manage() {
    if (!user || busy) return;
    setBusy(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/billing/portal", { method: "POST", headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000) });
      const data = await response.json();
      if (!response.ok || typeof data.url !== "string" || !data.url.startsWith("https://billing.stripe.com/")) throw new Error();
      window.location.assign(data.url);
    } catch { setMessage("Billing management is unavailable. Please try again."); setBusy(false); }
  }
  return <section className="account-page"><h1>Settings</h1>{loading ? <p role="status">Checking session…</p> : !user || user.isAnonymous ? <><p>Sign in with a registered account to manage your subscription.</p><button className="button" onClick={() => open("/settings")}>Login</button></> : <><h2>Your account</h2><p>{user.email}</p><h2>Your subscription</h2><p>Plan: {subscription.plan}</p><p>Status: {subscription.status}</p>{subscription.phase === "loading" && <p role="status">Checking your subscription…</p>}{subscription.phase === "error" && <><p role="alert">Your subscription could not be verified.</p><button className="button" onClick={subscription.retry}>Retry verification</button></>}<Link className="button" href="/choose-plan">View plans</Link><button className="button" disabled={busy} onClick={() => void manage()}>Manage billing</button><p role="status">{message}</p></>}</section>;
}
