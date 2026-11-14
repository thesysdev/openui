import "@openuidev/react-ui/styles/index.css";
import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Shopping assistant | OpenUI cookbook",
  description:
    "Find products in a Shopify store, choose a variant, and build a cart through conversation.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
