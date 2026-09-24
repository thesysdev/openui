import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jev support desk · OpenUI",
  description: "An LLM writes each support screen once; Jev reuses it for every later request.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
