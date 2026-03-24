import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenUI Form Generator",
  description: "Generate and refine forms from natural language prompts using OpenUI + HeroUI",
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
