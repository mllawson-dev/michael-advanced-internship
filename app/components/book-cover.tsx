"use client";

import Image from "next/image";
import { useState } from "react";

export function BookCover({ title, imageLink, size, className, eager = false }: {
  title: string; imageLink: string; size: number; className: string; eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return failed ? <div className={`${className} book-cover-fallback`} role="img" aria-label={`Cover unavailable for ${title}`}>Cover unavailable</div> :
    <Image className={className} src={imageLink} alt={`Cover of ${title}`} width={size} height={size} sizes={`${size}px`} loading={eager ? "eager" : "lazy"} onError={() => setFailed(true)} />;
}
