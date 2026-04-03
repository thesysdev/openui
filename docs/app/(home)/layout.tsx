import "./globals.css";
import { Navbar } from "./sections/Navbar/Navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="homeTheme">
      <Navbar />
      {children}
    </div>
  );
}
