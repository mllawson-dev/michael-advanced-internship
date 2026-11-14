"use client";

import Link from "next/link";
import { useAuth } from "./auth-modal";
import type { BookDetails } from "../lib/books";

// A destination for Stage 6 navigation; summary/audio are deliberately not loaded.
export function PlayerPreview({ book }: { book: BookDetails }) {
  const { user, open, loading, pending, enabled, error } = useAuth();
  if (loading) return <p role="status">Checking session…</p>;
  return <section className="selected-state"><h1>{book.title}</h1>
    {!enabled || error ? <p role="alert">Authentication is unavailable. Please reload and try again.</p> :
      !user ? <><p>Log in to continue to this book.</p><button className="button" type="button" disabled={pending} onClick={() => open(`/book/${book.id}`)}>Login</button></> :
      book.subscriptionRequired ? <><p>A verified subscription is required for this premium book.</p><Link className="button" href="/choose-plan">View plans</Link></> :
      <p>The book player is coming in the next stage. Reading and audio playback are not available yet.</p>}
    <p><Link href={`/book/${book.id}`}>Back to book details</Link></p>
  </section>;
}
