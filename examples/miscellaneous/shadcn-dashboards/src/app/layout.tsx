import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenUI x ShadCN Dashboards",
  description:
    "Ask for a dashboard about any npm package or GitHub repository and watch it build from shadcn/ui components, with live data from npm, GitHub, and OSV.dev.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
