import { ThemeProvider } from "@/hooks/use-system-theme";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vercel AI Chat",
  description: "Generative UI Chat with Vercel AI SDK + OpenUI Renderer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
