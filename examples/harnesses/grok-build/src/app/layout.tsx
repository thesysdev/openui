import type { Metadata } from "next";
import "@openuidev/react-ui/components.css";
import "@openuidev/react-ui/styles/index.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grok Build + OpenUI",
  description: "OpenUI Agent Interface powered by the Grok Build coding-agent harness",
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
