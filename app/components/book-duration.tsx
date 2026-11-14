"use client";

import { useEffect, useRef, useState } from "react";

// Read metadata only when the badge enters view; never preload catalog audio bodies.
export function BookDuration({ src }: { src?: string }) {
  const target = useRef<HTMLSpanElement>(null);
  const [seconds, setSeconds] = useState<number | null>(null);
  useEffect(() => {
    const element = target.current;
    if (!src || !element) return;
    let audio: HTMLAudioElement | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      audio = new Audio();
      audio.preload = "metadata";
      audio.onloadedmetadata = () => {
        if (audio && Number.isFinite(audio.duration) && audio.duration > 0) setSeconds(audio.duration);
      };
      audio.src = src;
    });
    observer.observe(element);
    return () => { observer.disconnect(); if (audio) { audio.onloadedmetadata = null; audio.removeAttribute("src"); audio.load(); } };
  }, [src]);
  return <span ref={target} className="book-duration" aria-label={seconds === null ? "Audio duration unavailable" : `Audio duration ${Math.floor(seconds / 60)} minutes ${Math.floor(seconds % 60)} seconds`}>
    ◷ {seconds === null ? "—" : `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`}
  </span>;
}
