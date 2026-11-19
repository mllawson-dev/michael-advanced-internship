"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "./auth-modal";
import { BookCover } from "./book-cover";
import { libraryRequest, type LibraryBook } from "../lib/library";

export function SaveBook({ id }: { id: string }) {
  const { user } = useAuth();
  return <SaveBookControl key={`${user?.uid ?? "signed-out"}:${id}`} id={id} />;
}

function SaveBookControl({ id }: { id: string }) {
  const { user, open, loading, error } = useAuth();
  const [saved, setSaved] = useState(false);
  const [phase, setPhase] = useState("loading");
  const [attempt, setAttempt] = useState(0);
  const busy = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    if (user) void libraryRequest(user, undefined, undefined, controller.signal).then((data) => {
      if (!controller.signal.aborted) { setSaved(data.books?.some((book) => book.id === id && book.saved) ?? false); setPhase("ready"); }
    }).catch(() => { if (!controller.signal.aborted) setPhase("error"); });
    return () => controller.abort();
  }, [user, id, attempt]);
  async function toggle() {
    if (!user) { open(`/book/${id}`); return; }
    if (busy.current) return;
    busy.current = true; setPhase("pending");
    try { await libraryRequest(user, saved ? "remove" : "save", id); setSaved(!saved); setPhase("ready"); }
    catch { setPhase("error"); }
    finally { busy.current = false; }
  }
  return <div className="library-save">
    <button className="auth-switch" disabled={loading || !!error || (!!user && (phase === "loading" || phase === "pending" || phase === "error"))} onClick={() => void toggle()} aria-pressed={saved}>{user && phase === "loading" ? "Checking library…" : phase === "pending" ? "Updating library…" : saved ? "Remove title from My Library" : "Add title to My Library"}</button>
    {user && phase === "error" && <p role="alert">Couldn’t update your library. <button onClick={() => { setPhase("loading"); setAttempt(attempt + 1); }}>Retry library</button></p>}
    {user && phase === "ready" && <p className="auth-hint" role="status">{saved ? "Saved to My Library." : "Not saved to My Library."}</p>}
  </div>;
}

function LibraryContent() {
  const { user } = useAuth();
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [phase, setPhase] = useState("loading");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    void libraryRequest(user, undefined, undefined, controller.signal).then((data) => {
      if (!controller.signal.aborted) { setBooks(data.books ?? []); setPhase("ready"); }
    }).catch(() => { if (!controller.signal.aborted) setPhase("error"); });
    return () => controller.abort();
  }, [user, attempt]);
  if (phase === "loading") return <div className="recommended-skeleton" role="status" aria-label="Loading your library"><div /><div /><div /></div>;
  if (phase === "error") return <div><p role="alert">Your library couldn’t be loaded.</p><button className="button" onClick={() => { setPhase("loading"); setAttempt(attempt + 1); }}>Retry library</button></div>;
  return <>{(["saved", "finished"] as const).map((kind) => {
    const items = books.filter((book) => book[kind]);
    return <section className="library-section" key={kind} aria-labelledby={`${kind}-books`}><h2 id={`${kind}-books`}>{kind === "saved" ? "Saved books" : "Finished books"} ({items.length})</h2>
      {!items.length ? <p>{kind === "saved" ? "No saved books yet. Add a title from its book details page." : "No finished books yet. Listen to a summary until the end to record it here."}</p> : <ul className="library-grid">{items.map((book) => <li key={book.id}><Link className="book-card-link" href={`/book/${book.id}`} prefetch={false}><BookCover title={book.title} imageLink={book.imageLink} size={172} className="recommendation__cover" /><h3>{book.title}</h3><p>{book.author}</p>{book.subscriptionRequired && <span className="book-details__premium">Premium</span>}</Link></li>)}</ul>}
    </section>;
  })}<Link href="/for-you">Find your next book →</Link></>;
}
export function LibraryView() {
  const { user, open, loading, error, enabled } = useAuth();
  return <section className="account-page" aria-labelledby="library-title"><h1 id="library-title">My Library</h1>
    {loading ? <p role="status">Checking session…</p> : error || !enabled ? <p role="alert">Authentication is unavailable. Please reload and try again.</p> : !user ? <><p>Log in to see your saved and finished books.</p><button className="button" onClick={() => open("/library")}>Login</button></> : <><p>Save books for later and find the summaries you’ve finished listening to.</p>{user.isAnonymous && <p className="auth-hint">Guest library belongs to this guest session. Use a registered account for access across devices.</p>}<LibraryContent key={user.uid} /></>}
  </section>;
}
