"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "./auth-modal";

export function Plans({ initialPlan = "annual", checkoutStatus }: { initialPlan?: string; checkoutStatus?: string }) {
  const [plan, setPlan] = useState(initialPlan === "monthly" ? "monthly" : "annual");
  const { user, loading, pending, enabled, error, open } = useAuth();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function checkout() {
    if (!enabled || error) { setMessage("Authentication is unavailable. Please try again later."); return; }
    if (!user || user.isAnonymous) { open(`/choose-plan?plan=${plan}`); return; }
    if (busy) return;
    setBusy(true); setMessage("Opening secure checkout…");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/billing/checkout", { method: "POST", headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify({ plan }), signal: AbortSignal.timeout(15000) });
      const data = await response.json();
      if (!response.ok || typeof data.url !== "string" || !data.url.startsWith("https://checkout.stripe.com/")) throw new Error(data.error || "Checkout is unavailable.");
      window.location.assign(data.url);
    } catch (failure) { setMessage(failure instanceof Error ? failure.message : "Checkout is unavailable."); setBusy(false); }
  }
  return <div className="plans-page">
    {checkoutStatus === "success" && <p className="selected-state" role="status">Thanks! Check your subscription status to continue. <Link href="/settings">Check subscription status</Link></p>}
    {checkoutStatus === "cancelled" && <p className="selected-state" role="status">Checkout was canceled. Choose a plan whenever you’re ready.</p>}
    <header className="plans-header"><Link href="/" aria-label="Summarist home"><Image src="/assets/logo.png" alt="Summarist" width={180} height={42} /></Link><Link href="/for-you">Browse books</Link></header>
    <section className="plans-hero"><h1>Get unlimited access to the best ideas</h1><p>Build your knowledge with book summaries you can read or listen to.</p><a className="button" href="#plans">Choose your plan</a><Image src="/assets/pricing-top.png" alt="" width={800} height={400} sizes="(max-width: 768px) 100vw, 800px" className="plans-image" loading="eager" /></section>
    <section className="plans-benefits" aria-label="Membership benefits"><div><h2>Read or listen</h2><p>Discover key ideas in the format that fits your day.</p></div><div><h2>Explore every book</h2><p>Unlock the full premium catalog with either subscription.</p></div><div><h2>Keep learning</h2><p>Make room for new ideas, one summary at a time.</p></div></section>
    <section id="plans" className="plans-selection" aria-labelledby="plans-title"><h2 id="plans-title">Choose the plan that works for you</h2><fieldset><legend className="visually-hidden">Billing plan</legend>
      <label className={`plan-option ${plan === "annual" ? "plan-option--selected" : ""}`}><input type="radio" name="plan" value="annual" checked={plan === "annual"} onChange={() => setPlan("annual")} /><span><strong>Premium Plus · Annual</strong><span className="plan-price">$59.99<span> USD / year</span></span><span>7-day free trial for eligible first-time subscribers, then $59.99 each year</span></span></label>
      <label className={`plan-option ${plan === "monthly" ? "plan-option--selected" : ""}`}><input type="radio" name="plan" value="monthly" checked={plan === "monthly"} onChange={() => setPlan("monthly")} /><span><strong>Premium · Monthly</strong><span className="plan-price">$9.99<span> USD / month</span></span><span>Billed monthly · No free trial</span></span></label>
    </fieldset><button className="button" disabled={loading || pending || busy} onClick={() => void checkout()}>{loading ? "Checking session…" : plan === "annual" ? "Continue with annual" : "Continue with monthly"}</button>{!loading && (!user || user.isAnonymous) && <p>Log in or register to continue to checkout. Guest accounts cannot subscribe.</p>}<p>Subscriptions renew automatically until canceled.</p><p className="plans-status" role="status">{message}</p></section>
    <section className="plans-faq" aria-labelledby="faq-title"><h2 id="faq-title">Frequently asked questions</h2>{[
      ["What’s included?", "Both plans include reading and audio access to the same complete book catalog."],
      ["How does the free trial work?", "Eligible first-time annual subscribers receive a 7-day trial. After the trial, the annual subscription renews at $59.99 USD per year unless canceled before the trial ends."],
      ["Can I cancel my subscription?", "You can cancel automatic renewal through the billing portal once your subscription is active."],
      ["Does the monthly plan have a trial?", "The monthly subscription starts at $9.99 USD per month without a free trial."],
    ].map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</section>
    <footer className="plans-footer"><Link href="/for-you">Back to For You</Link><p>Stripe test environment · No live payments</p></footer>
  </div>;
}
