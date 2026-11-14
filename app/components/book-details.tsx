"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BookDetailsResult } from "../lib/books";
import { bookDestination } from "../lib/book-access";
import { useAuth } from "./auth-modal";
import { BookCover } from "./book-cover";

function BookActions({ id, premium }: { id: string; premium: boolean }) {
  const router = useRouter();
  const { open, user, loading, pending, enabled, error } = useAuth();
  const [message, setMessage] = useState("");
  function activate() {
    // UI gate only: no content, payment, or persisted user data is accessed here.
    if (loading || pending) return;
    if (!enabled || error) { setMessage("Authentication is unavailable. Please reload and try again."); return; }
    if (!user) { open(`/book/${id}`); return; }
    const destination = bookDestination(id, premium);
    if (!destination) { setMessage("This book is unavailable."); return; }
    router.push(destination);
  }
  return <div className="book-actions">
    <div className="book-actions__buttons">
      <button className="button" type="button" disabled={loading || pending} onClick={activate}>Read</button>
      <button className="button book-actions__listen" type="button" disabled={loading || pending} onClick={activate}>Listen</button>
    </div>
    <p className="book-actions__status" role="status">{loading ? "Checking session…" : message}</p>
  </div>;
}

export function BookDetailsView({ result }: { result: BookDetailsResult }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  if (result.status !== "success") return <section className="selected-state" aria-busy={pending}>
    <h1>Book details unavailable</h1><p role="status">{pending ? "Loading book details…" : "We couldn’t load this book. Please try again."}</p>
    <button className="button" disabled={pending} onClick={() => startTransition(() => router.refresh())}>{pending ? "Loading…" : "Try again"}</button>
  </section>;
  const { book } = result;
  return <article className="book-details" aria-labelledby="book-title">
    <Link className="book-back" href="/for-you">← Back to For You</Link>
    <div className="book-details__layout"><div className="book-details__content">
      <h1 id="book-title">{book.title}{book.subscriptionRequired && <span className="book-details__premium">Premium</span>}</h1>
      <p className="book-details__author">{book.author}</p>
      <p className="book-details__subtitle">{book.subTitle}</p>
      <dl className="book-details__stats">
        <div><dt>Rating</dt><dd>★ {book.averageRating} / 5 <span>({book.totalRating} ratings)</span></dd></div>
        <div><dt>Key ideas</dt><dd>{book.keyIdeas}</dd></div>
        <div><dt>Format</dt><dd>{book.type}</dd></div>
      </dl>
      <BookActions key={book.id} id={book.id} premium={book.subscriptionRequired} />
      <section aria-labelledby="book-about"><h2 id="book-about">What’s it about?</h2>
        <ul className="book-details__tags" aria-label="Book topics">{book.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
        <p className="book-details__description">{book.bookDescription}</p>
      </section>
      <section aria-labelledby="author-about"><h2 id="author-about">About the author</h2><p className="book-details__description">{book.authorDescription}</p></section>
    </div><BookCover key={book.imageLink} title={book.title} imageLink={book.imageLink} size={300} className="book-details__cover" eager /></div>
  </article>;
}

export function BookDetailsSkeleton() {
  return <div className="book-details-skeleton" role="status" aria-label="Loading book details"><div aria-hidden="true" /><div aria-hidden="true" /><div aria-hidden="true" /></div>;
}
