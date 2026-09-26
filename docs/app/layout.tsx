import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import Script from "next/script";
import { BASE_URL } from "../lib/source";
import "./global.css";
import { PHProvider } from "./providers";

const inter = Inter({
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_TITLE = "OpenUI - The Open Standard for Generative UI";
const SITE_DESCRIPTION =
  "Full-stack, framework-agnostic Generative UI built on OpenUI Lang, a streaming-first language with first-party runtimes for React, Vue, Svelte, and Angular, and up to 67% fewer tokens than JSON.";
const SITE_IMAGE = "/meta-image.png?v=20260725-1708";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_TITLE}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_TITLE,
  referrer: "origin-when-cross-origin",
  keywords: [
    "OpenUI",
    "Generative UI",
    "AI UI",
    "OpenUI Lang",
    "React",
    "LLM",
    "AI apps",
    "streaming UI",
  ],
  authors: [{ name: "OpenUI" }],
  creator: "OpenUI",
  publisher: "OpenUI",
  category: "technology",
  icons: {
    icon: "/shiro-logo.svg",
    shortcut: "/shiro-logo.svg",
    apple: "/shiro-logo.svg",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_TITLE,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: SITE_IMAGE,
        width: 1800,
        height: 942,
        alt: "OpenUI preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [SITE_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.className} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <PHProvider>
          <RootProvider theme={{ defaultTheme: "system", enableSystem: true }}>
            {children}
          </RootProvider>
        </PHProvider>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-MZ0TZ82NM2"
          strategy="lazyOnload"
        />
        <Script id="ga-init" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-MZ0TZ82NM2');
          `}
        </Script>
      </body>
    </html>
  );
}
