"use client";

import Link from "next/link";
import { BookDuration } from "./book-duration";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BookListItem, BookListKind, BookListResult } from "../lib/books";
import { BookCover } from "./book-cover";

function BookRow({ books, kind }: { books: BookListItem[]; kind: BookListKind }) {
  const region = useRef<HTMLDivElement>(null);
  const [scrollable, setScrollable] = useState(false);
  useEffect(() => {
    const element = region.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setScrollable(element.scrollWidth > element.clientWidth));
    observer.observe(element);
    return () => observer.disconnect();
  }, [books]);
  return (
    <div ref={region} className="book-row" role="region" aria-labelledby={`${kind}-title`} tabIndex={scrollable ? 0 : undefined}>
      <ul className="book-row__list" role="list">
        {books.map((book, index) => (
          <li className="recommendation" key={book.id}>
            <article aria-labelledby={`${kind}-${book.id}`}><Link className="book-card-link" href={`/book/${book.id}`} prefetch={false} aria-labelledby={`${kind}-${book.id}`}>
              <div className="recommendation__cover-area">
                {book.subscriptionRequired && <span className="book-premium">Premium</span>}
                <BookCover key={book.imageLink} title={book.title} imageLink={book.imageLink} size={172} className="recommendation__cover" eager={kind === "recommended" && index < 2} />
              </div>
              <h3 id={`${kind}-${book.id}`}>{book.title}</h3>
              <p className="recommendation__author">{book.author}</p>
              <p className="recommendation__subtitle">{book.subTitle}</p>
              <p className="recommendation__rating"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" focusable="false"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2L5.8 21 7 14.2 2 9.3l6.9-1L12 2Z" /></svg><span className="visually-hidden">Rating: </span>{book.averageRating}<span className="visually-hidden"> out of 5</span></p>
            <BookDuration key={book.audioLink} src={book.audioLink} /></Link></article>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BookListView({ result, kind }: { result: BookListResult; kind: BookListKind }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  if (result.status === "success") return <BookRow books={result.books} kind={kind} />;
  return <div className="selected-state" aria-busy={pending}>
    <p role="status">{pending ? `Loading ${kind} books…` : result.status === "empty" ? `No ${kind} books are available right now.` : `We couldn’t load your ${kind} books. Please try again.`}</p>
    <button className="button" type="button" disabled={pending} onClick={() => startTransition(() => router.refresh())}>{pending ? "Loading…" : "Try again"}</button>
  </div>;
}

export function BookListSkeleton({ kind }: { kind: BookListKind }) {
  return <div className="recommended-skeleton" role="status" aria-label={`Loading ${kind} books`}><div aria-hidden="true" /><div aria-hidden="true" /><div aria-hidden="true" /></div>;
}
