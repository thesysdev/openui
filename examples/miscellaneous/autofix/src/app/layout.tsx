import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Autofix · OpenUI",
  description: "Generate OpenUI Lang with OpenAI and fix it with OpenUI Autofix.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
