import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Supabase Chat",
  description: "OpenUI chat with Supabase persistence",
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
