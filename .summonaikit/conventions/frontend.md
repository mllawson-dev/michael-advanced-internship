# Frontend conventions
- Next.js App Router with TypeScript, React, and plain CSS; await dynamic route params.
- Public catalog loaders live in app/lib/books.ts, use no-store and bounded requests, and project validated fields.
- Server pages fetch; client views own refresh/retry state and image fallbacks.
- Root AuthProvider owns authentication; app route group supplies AppShell.
- Book Details uses Suspense for loading, route not-found for missing books, and a recoverable client error state.
