import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenUI Agent Harness",
  description: "Generative UI agent harness powered by the Pi coding agent",
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
