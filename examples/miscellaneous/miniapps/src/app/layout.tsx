import type { Metadata } from "next";
import "@openuidev/react-ui/styles/index.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenUI MiniApps",
  description: "Build and save interactive dashboards inside a self-hosted agent.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
