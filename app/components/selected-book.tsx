"use client";

import Link from "next/link";
import { BookDuration } from "./book-duration";
import { BookCover } from "./book-cover";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { SelectedBook, SelectedBookResult } from "../lib/books";

function BookCard({ book }: { book: SelectedBook }) {
  return (
    <article aria-labelledby="selected-book-title"><Link className="selected-card book-card-link" href={`/book/${book.id}`} prefetch={false} aria-labelledby="selected-book-title">
      <p className="selected-card__tagline">{book.subTitle}</p>
      <div className="selected-card__details">
        <BookCover title={book.title} imageLink={book.imageLink} size={140} className="selected-card__cover" eager />
        <div className="selected-card__info">
          <h2 id="selected-book-title">{book.title}</h2>
          <p className="selected-card__author">{book.author}</p>
          <p className="selected-card__format"><span className="selected-card__play" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor" focusable="false"><path d="m9 5 11 7-11 7V5Z" /></svg></span>{book.type} <BookDuration key={book.audioLink} src={book.audioLink} /></p>
        </div>
      </div>
    </Link></article>
  );
}

export function SelectedBookView({ result }: { result: SelectedBookResult }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  if (result.status === "success") return <BookCard key={`${result.book.id}-${result.book.imageLink}`} book={result.book} />;
  return (
    <div className="selected-state" aria-busy={pending}>
      <p role="status">{pending ? "Loading selected book…" : result.status === "empty" ? "No selected book is available right now." : "We couldn’t load your selected book. Please try again."}</p>
      <button className="button" type="button" disabled={pending} onClick={() => startTransition(() => router.refresh())}>{pending ? "Loading…" : "Try again"}</button>
    </div>
  );
}

export function SelectedBookSkeleton() {
  return <div className="selected-skeleton" role="status" aria-label="Loading selected book"><div aria-hidden="true" className="selected-skeleton__text" /><div aria-hidden="true" className="selected-skeleton__cover" /><div aria-hidden="true" className="selected-skeleton__text" /></div>;
}
