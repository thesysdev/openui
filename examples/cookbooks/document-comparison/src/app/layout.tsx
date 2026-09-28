import "@openuidev/react-ui/components.css";
import "@openuidev/react-ui/styles/index.css";
import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Document analyst | OpenUI cookbook",
  description: "Compare documents through conversation with tables, charts, and cited evidence.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
