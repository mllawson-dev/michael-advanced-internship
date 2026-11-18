"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { useAuth } from "../../components/auth-modal";
import { useSubscription } from "../../components/subscription";

const statusLabels: Record<string, string> = {
  active: "Active", trialing: "Free trial", none: "No subscription",
  canceled: "Canceled", past_due: "Payment overdue", unpaid: "Payment required",
  incomplete: "Payment incomplete", incomplete_expired: "Checkout expired", paused: "Paused",
};

function SettingsSkeleton() {
  return <div className="settings-skeleton" role="status" aria-label="Loading account settings">
    <span /><span /><span />
  </div>;
}

export default function SettingsPage() {
  const { user, loading, pending, enabled, error, open } = useAuth();
  const subscription = useSubscription();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const openingPortal = useRef(false);
  const registered = user && !user.isAnonymous;

  async function manage() {
    // Fail closed: an available, registered session is required before creating a portal session.
    if (!registered || loading || pending || !enabled || error || openingPortal.current) return;
    openingPortal.current = true;
    setBusy(true);
    setMessage("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/billing/portal", {
        method: "POST", headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000),
      });
      const data = await response.json();
      if (!response.ok || typeof data.url !== "string") throw new Error("Unavailable portal");
      const url = new URL(data.url);
      if (url.origin !== "https://billing.stripe.com") throw new Error("Invalid portal destination");
      window.location.assign(url.href);
    } catch {
      setMessage("We couldn’t open billing management. Please try again.");
      openingPortal.current = false;
      setBusy(false);
    }
  }

  return <section className="account-page settings-page" aria-labelledby="settings-title">
    <h1 id="settings-title">Settings</h1>
    {loading ? <SettingsSkeleton /> : !enabled || error ? <div className="settings-state">
      <h2>Account unavailable</h2><p role="alert">We couldn’t verify your session. Reload the page to try again.</p>
      <button className="button" type="button" onClick={() => window.location.reload()}>Reload page</button>
    </div> : !registered ? <div className="settings-signed-out">
      <Image src="/assets/login.png" alt="" width={360} height={260} sizes="(max-width: 600px) 85vw, 360px" className="settings-login-image" />
      <h2>{user?.isAnonymous ? "Save your account to manage a subscription" : "Log in to view your settings"}</h2>
      <p>{user?.isAnonymous ? "Guest accounts don’t have an email or a paid plan. Log in or register to manage your membership." : "View your email, subscription plan, and billing details in one place."}</p>
      <button className="button" type="button" disabled={pending} aria-haspopup="dialog" onClick={() => open("/settings")}>{pending ? "Please wait…" : "Login"}</button>
    </div> : <>
      <section className="settings-section" aria-labelledby="settings-plan-title">
        <h2 id="settings-plan-title">Your subscription plan</h2>
        {subscription.phase === "loading" ? <SettingsSkeleton /> : subscription.phase === "error" ? <div className="settings-state">
          <p role="alert">We couldn’t load your subscription. Please try again.</p>
          <button className="button" type="button" onClick={subscription.retry}>Retry verification</button>
        </div> : <>
          <dl className="settings-details">
            <div><dt>Plan</dt><dd className="settings-plan">{subscription.plan}</dd></div>
            <div><dt>Status</dt><dd>{statusLabels[subscription.status] ?? "Unavailable"}</dd></div>
          </dl>
          <div className="settings-actions">
            {subscription.plan === "basic" && <Link className="button" href="/choose-plan">Upgrade to Premium</Link>}
            {subscription.status !== "none" && <button className="button settings-secondary" type="button" disabled={busy || pending} onClick={() => void manage()}>{busy ? "Opening billing…" : "Manage billing"}</button>}
            <button className="settings-refresh" type="button" disabled={busy} onClick={subscription.retry}>Refresh status</button>
          </div>
          <p className="settings-message" role="status">{message}</p>
        </>}
      </section>
      <section className="settings-section" aria-labelledby="settings-email-title">
        <h2 id="settings-email-title">Your email</h2>
        <p className="settings-email">{user.email || "No email is associated with this account."}</p>
      </section>
    </>}
  </section>;
}
