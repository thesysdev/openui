import { MarketingThemeProvider } from "@/components/marketing-theme-provider";
import { SITE_OPEN_GRAPH } from "@/lib/page-metadata";
import type { Metadata } from "next";
import "../(home)/globals.css";
import { BlogNavbar } from "./components/BlogNavbar";

export const metadata: Metadata = {
  alternates: {
    canonical: "/blog",
  },
  openGraph: { ...SITE_OPEN_GRAPH, url: "/blog" },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <MarketingThemeProvider>
      <BlogNavbar />
      <div className="homeTheme">{children}</div>
    </MarketingThemeProvider>
  );
}
