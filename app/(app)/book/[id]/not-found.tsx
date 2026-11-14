import Link from "next/link";

export default function BookNotFound() {
  return <section className="selected-state"><h1>Book not found</h1><p>This book is no longer available.</p><Link className="button" href="/for-you">Browse books</Link></section>;
}
