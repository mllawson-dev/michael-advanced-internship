import { notFound } from "next/navigation";
import { loadBookDetails } from "../../../lib/books";
import { PlayerPreview } from "../../../components/player-preview";
import { BookDetailsView } from "../../../components/book-details";

export default async function PlayerPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ mode?: string }> }) {
  const { id } = await params;
  const result = await loadBookDetails(id);
  if (result.status === "empty") notFound();
  if (result.status === "error") return <BookDetailsView result={result} />;
  return <PlayerPreview book={result.book} listen={(await searchParams).mode === "listen"} />;
}
