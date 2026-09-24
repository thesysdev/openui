import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voice GenUI",
  description: "Speak to the screen — voice-driven generative UI with OpenUI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
