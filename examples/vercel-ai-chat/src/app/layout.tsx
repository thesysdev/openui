import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vercel AI Chat",
  description: "Generative UI Chat with Vercel AI SDK",
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
