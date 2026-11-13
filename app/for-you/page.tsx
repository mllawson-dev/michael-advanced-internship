"use client";

import Link from "next/link";
import { LoginButton, useAuth } from "../components/auth-modal";

export default function ForYouPage() {
  const { user, loading } = useAuth();
  return (
    <main className="account-page">
      <Link href="/">Summarist home</Link>
      <h1>For you</h1>
      {loading ? <p role="status">Checking session…</p> : user ? (
        <>
          <p>You’re signed in{user.isAnonymous ? " as a guest" : ` as ${user.email}`}.</p>
          <p>{process.env.NEXT_PUBLIC_AUTH_MODE === "emulator" && "Local emulator account. "}Book recommendations will be added in the next project stage.</p>
          <LoginButton className="button" />
        </>
      ) : (
        <>
          <p>Log in to continue.</p>
          <LoginButton className="button" />
        </>
      )}
    </main>
  );
}
