import "@openuidev/react-ui/components.css";
import "@openuidev/react-ui/styles/index.css";
import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Retail notebook | OpenUI cookbook",
  description: "Explore the UCI Online Retail dataset with reactive OpenUI dashboards.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
