"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "./auth-modal";
import { BookCover } from "./book-cover";
import type { BookDetails } from "../lib/books";
import { loadBookContent, type ContentResult } from "../lib/book-content";

function clock(seconds: number) {
  const value = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}

function AudioPlayer({ src, book }: { src: string; book: BookDetails }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  function seek(value: number) {
    if (!audio.current || !duration) return;
    audio.current.currentTime = Math.min(duration, Math.max(0, value));
    setTime(audio.current.currentTime);
  }
  async function toggle() {
    const element = audio.current;
    if (!element) return;
    if (!element.paused) { element.pause(); return; }
    try { await element.play(); setError(""); }
    catch { setError("Playback could not start. Try again."); }
  }
  return <section className="audio-player" aria-label="Audio player">
    <audio ref={audio} src={src} preload="metadata" onLoadedMetadata={(event) => {
      const value = event.currentTarget.duration;
      setDuration(Number.isFinite(value) ? value : 0); setReady(Number.isFinite(value) && value > 0);
    }} onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)} onPlay={() => setPlaying(true)}
      onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => { setReady(false); setError("Audio is unavailable. Please retry."); }} />
    <div className="audio-player__book"><BookCover title={book.title} imageLink={book.imageLink} size={56} className="audio-player__cover" /><div><strong>{book.title}</strong><p>{book.author}</p></div></div>
    <div className="audio-player__transport"><div className="audio-player__buttons">
      <button type="button" disabled={!ready} onClick={() => seek(time - 10)} aria-label="Skip back 10 seconds">↶ 10</button>
      <button className="audio-player__play" type="button" disabled={!ready} onClick={() => void toggle()} aria-label={playing ? "Pause audio" : "Play audio"}>{playing ? "Ⅱ" : "▶"}</button>
      <button type="button" disabled={!ready} onClick={() => seek(time + 10)} aria-label="Skip forward 10 seconds">10 ↷</button>
    </div><div className="audio-player__timeline"><span>{clock(time)}</span><input aria-label="Audio position" type="range" min="0" max={duration || 0} step="0.1" value={Math.min(time, duration)} disabled={!ready} onChange={(event) => seek(Number(event.target.value))} aria-valuetext={`${clock(time)} of ${clock(duration)}`} /><span>{clock(duration)}</span></div></div>
    <label className="audio-player__speed">Speed <select aria-label="Playback speed" defaultValue="1" onChange={(event) => { if (audio.current) audio.current.playbackRate = Number(event.target.value); }}>{[0.75, 1, 1.25, 1.5, 2].map((speed) => <option key={speed} value={speed}>{speed}×</option>)}</select></label>
    {error ? <p role="alert">{error} <button type="button" onClick={() => { setError(""); audio.current?.load(); }}>Retry audio</button></p> : !ready && <p role="status">Loading audio…</p>}
  </section>;
}

function Reader({ book, listen }: { book: BookDetails; listen: boolean }) {
  const [result, setResult] = useState<ContentResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [fontSize, setFontSize] = useState(18);
  const audioRegion = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (listen && result?.status === "success") audioRegion.current?.focus({ preventScroll: true });
  }, [listen, result]);
  useEffect(() => {
    const controller = new AbortController();
    void loadBookContent(book.id, controller.signal).then((value) => { if (!controller.signal.aborted) setResult(value); });
    return () => controller.abort();
  }, [book.id, attempt]);
  return <article className="reader">
    <Link className="book-back" href={`/book/${book.id}`}>← Back to book details</Link>
    <div className="reader__heading"><h1>{book.title}</h1><p>{book.author}</p></div>
    {!result ? <p role="status">Loading book content…</p> : result.status !== "success" ? <section className="selected-state">
      <p role="status">{result.status === "blocked" ? "A verified subscription is required for this book." : result.status === "empty" ? "This book’s content is not available yet." : "We couldn’t load the book content."}</p>
      {result.status === "blocked" ? <Link className="button" href="/choose-plan">View plans</Link> : <button className="button" onClick={() => { setResult(null); setAttempt(attempt + 1); }}>Try again</button>}
    </section> : <>
      <div className="reader__tools"><span>Text size</span>{[16, 18, 22, 26].map((size) => <button type="button" key={size} aria-label={`Text size ${size}`} aria-pressed={fontSize === size} onClick={() => setFontSize(size)}>A<span className="reader__size">{size}</span></button>)}{result.content.audioLink && <a href="#book-audio">Listen to summary ↓</a>}</div>
      {result.content.summary ? <div className="reader__summary" style={{ fontSize }}>{result.content.summary}</div> : <p>Text summary is unavailable for this book.</p>}
      <div id="book-audio" ref={audioRegion} tabIndex={-1}>
        {result.content.audioLink ? <AudioPlayer src={result.content.audioLink} book={book} /> : <p>Audio is unavailable for this book.</p>}
      </div>
    </>}
  </article>;
}

export function PlayerPreview({ book, listen = false }: { book: BookDetails; listen?: boolean }) {
  const { user, open, loading, pending, enabled, error } = useAuth();
  if (loading) return <p role="status">Checking session…</p>;
  // Fail closed before mounting the content fetcher or audio element. Logout unmounts both.
  if (!enabled || error || !user || book.subscriptionRequired) return <section className="selected-state"><h1>{book.title}</h1>
    {!enabled || error ? <p role="alert">Authentication is unavailable. Please reload and try again.</p> : !user ? <><p>Log in to continue to this book.</p><button className="button" disabled={pending} onClick={() => open(`/book/${book.id}`)}>Login</button></> : <><p>A verified subscription is required for this premium book.</p><Link className="button" href="/choose-plan">View plans</Link></>}
    <p><Link href={`/book/${book.id}`}>Back to book details</Link></p></section>;
  return <Reader key={`${user.uid}:${book.id}`} book={book} listen={listen} />;
}
