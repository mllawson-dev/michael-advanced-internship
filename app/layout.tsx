import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Summarist",
  description: "Discover book summaries to read and listen to with Summarist.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
