"use client";
import { useEffect, useState } from "react";
import { useAuth } from "./auth-modal";
type SubscriptionState = { uid: string; attempt: number; entitled: boolean; plan: string; status: string; phase: "success" | "error" };
export function useSubscription() {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!user || user.isAnonymous) return;
    const controller = new AbortController();
    const currentUser = user;
    async function refresh() {
      try {
        const token = await currentUser.getIdToken();
        const response = await fetch("/api/billing/subscription", { headers: { authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]) });
        if (!response.ok) throw new Error("Verification unavailable");
        const data = await response.json();
        if (!controller.signal.aborted) setState({ uid: currentUser.uid, attempt, entitled: data.entitled === true, plan: String(data.plan), status: String(data.status), phase: "success" });
      } catch {
        if (!controller.signal.aborted) setState({ uid: currentUser.uid, attempt, entitled: false, plan: "basic", status: "unverified", phase: "error" });
      }
    }
    void refresh();
    return () => controller.abort();
  }, [user, attempt]);
  const current = state && state.uid === user?.uid && state.attempt === attempt ? state : null;
  return { ...(current ?? { entitled: false, plan: "basic", status: "unverified", phase: user && !user.isAnonymous ? "loading" : "success" }), retry: () => setAttempt((value) => value + 1) };
}
