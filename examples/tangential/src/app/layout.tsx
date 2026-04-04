import { Sidebar } from "@/components/Sidebar/Sidebar";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tangential",
  description: "Dummy Linear-like app with mock API endpoints",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)]">
        <div className="flex h-full">
          <Sidebar />
          <main className="min-w-0 flex-1 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
