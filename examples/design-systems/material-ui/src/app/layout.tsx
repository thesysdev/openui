import type { Metadata } from "next";

import { ColorModeProvider } from "@/hooks/use-system-theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Material UI Chat",
  description: "Generative UI Chat with Material UI components",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ColorModeProvider>{children}</ColorModeProvider>
      </body>
    </html>
  );
}
