import Image from "next/image";

export default function HomePage() {
  return (
    <main className="setup">
      <Image
        className="setup__logo"
        src="/assets/logo.png"
        alt="Summarist"
        width={495}
        height={114}
        priority
      />
      <h1>Book summaries, coming next.</h1>
      <p>The Summarist homepage is being built one section at a time.</p>
    </main>
  );
}
