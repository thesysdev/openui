import "@openuidev/react-ui/styles/index.css";
import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Booking assistant | OpenUI cookbook",
  description: "Turn a request for a stay into a prefilled form, live hotel prices, and a booking.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
