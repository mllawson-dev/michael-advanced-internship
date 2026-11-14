import { Suspense } from "react";
import { notFound } from "next/navigation";
import { loadBookDetails } from "../../../lib/books";
import { BookDetailsView, BookDetailsSkeleton } from "../../../components/book-details";

async function Details({ id }: { id: string }) {
  const result = await loadBookDetails(id);
  if (result.status === "empty") notFound();
  return <BookDetailsView result={result} />;
}

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Suspense key={id} fallback={<BookDetailsSkeleton />}><Details id={id} /></Suspense>;
}
