"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BookCover } from "./book-cover";
import { searchBooks, type SearchResult } from "../lib/book-search";

export function BookSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<{ query: string; value: SearchResult } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const term = query.trim();
  useEffect(() => {
    if (!term) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void searchBooks(term, controller.signal).then((value) => {
        if (!controller.signal.aborted) setResult({ query: term, value });
      });
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [term, attempt]);
  useEffect(() => {
    function dismiss(event: PointerEvent) { if (!root.current?.contains(event.target as Node)) setOpen(false); }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, []);
  const visible = open && !!term;
  const current = result?.query === term ? result.value : null;
  return <div className="book-search" ref={root} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }} onKeyDown={(event) => {
    if (event.key === "Escape") { setOpen(false); input.current?.focus(); }
    if (event.key === "ArrowDown" && event.target === input.current && visible) {
      const first = root.current?.querySelector<HTMLAnchorElement>(".search-results a");
      if (first) { event.preventDefault(); first.focus(); }
    }
  }}>
    <div className="shell-search"><input ref={input} type="search" maxLength={200} placeholder="Search for books" aria-label="Search books by title or author" aria-controls="book-search-results" value={query}
      onChange={(event) => { setQuery(event.target.value); setOpen(true); }} onFocus={() => setOpen(true)} />
      <span aria-hidden="true"><svg className="shell-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M20 20l-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" /></svg></span>
    </div>
    {visible && <section id="book-search-results" className="search-results" aria-label="Book search results" aria-busy={!current}>
      {!current ? <div role="status" className="search-loading">Searching books…<div className="search-skeleton" aria-hidden="true" /></div> : current.status === "error" ? <div><p role="alert">Search is unavailable. Please try again.</p><button className="button" type="button" onClick={() => { setResult(null); setAttempt(attempt + 1); }}>Try again</button></div> : current.status === "empty" ? <p role="status">No books found for “{term}”.</p> : <>
        <p className="visually-hidden" role="status">{current.books.length} books found.</p>
        <ul>{current.books.map((book) => <li key={book.id}><Link href={`/book/${book.id}`} prefetch={false} onClick={() => setOpen(false)}>
          <BookCover title={book.title} imageLink={book.imageLink} size={48} className="search-result-cover" /><span><strong>{book.title}</strong><span className="search-result-author">{book.author}</span></span>
        </Link></li>)}</ul>
      </>}
    </section>}
  </div>;
}
