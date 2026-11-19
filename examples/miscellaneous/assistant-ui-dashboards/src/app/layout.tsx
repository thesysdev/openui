import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenUI x assistant-ui Dashboards",
  description:
    "Ask an assistant-ui chat for a dashboard about any npm package or GitHub repository and open it beside the chat, with live data from npm, GitHub, and OSV.dev.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
