import { Suspense } from "react";
import { SelectedBookSkeleton, SelectedBookView } from "../../components/selected-book";
import { BookListSkeleton, BookListView } from "../../components/book-list";
import { loadSelectedBook, loadRecommendedBooks, loadSuggestedBooks } from "../../lib/books";

async function SelectedBookSection() {
  return <SelectedBookView result={await loadSelectedBook()} />;
}

async function RecommendedBooksSection() {
  return <BookListView kind="recommended" result={await loadRecommendedBooks()} />;
}

async function SuggestedBooksSection() {
  return <BookListView kind="suggested" result={await loadSuggestedBooks()} />;
}

export default function ForYouPage() {
  return (
    <section className="for-you-page" aria-labelledby="for-you-title">
      <h1 id="for-you-title">Selected just for you</h1>
      <Suspense fallback={<SelectedBookSkeleton />}>
        <SelectedBookSection />
      </Suspense>
      <section className="book-section" aria-labelledby="recommended-title">
        <h2 id="recommended-title">Recommended For You</h2>
        <p className="book-section-subtitle">We think you’ll like these</p>
        <Suspense fallback={<BookListSkeleton kind="recommended" />}>
          <RecommendedBooksSection />
        </Suspense>
      </section>
      <section className="book-section" aria-labelledby="suggested-title">
        <h2 id="suggested-title">Suggested Books</h2>
        <p className="book-section-subtitle">Browse those books</p>
        <Suspense fallback={<BookListSkeleton kind="suggested" />}>
          <SuggestedBooksSection />
        </Suspense>
      </section>
    </section>
  );
}
