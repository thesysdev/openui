import { ThemeProvider } from "@openuidev/react-ui";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenUI + HeroUI Chat",
  description: "Generative UI Chat with OpenAI SDK + HeroUI components",
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
