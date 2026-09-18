import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Autofix · OpenUI",
  description: "Repair invalid OpenUI Lang and preview the result with the Autofix API.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
