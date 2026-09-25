import "@openuidev/react-ui/components.css";
import "@openuidev/react-ui/styles/index.css";
import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Data analyst | OpenUI cookbook",
  description:
    "Explore data through conversation with streaming charts, comparisons, and clear answers.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
