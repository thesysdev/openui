import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { BASE_URL } from "../lib/source";
import "./global.css";
import { PHProvider } from "./providers";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "OpenUI",
    template: "%s | OpenUI",
  },
  description: "The Open Standard for Generative UI",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <PHProvider>
          <RootProvider>{children}</RootProvider>
        </PHProvider>
      </body>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-MZ0TZ82NM2"
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-MZ0TZ82NM2');
      `}</Script>
    </html>
  );
}
