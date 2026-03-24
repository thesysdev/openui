import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Email Generator",
  description: "AI-powered email generator with OpenUI and React Email",
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
