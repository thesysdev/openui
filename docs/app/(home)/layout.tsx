import { WebsiteThemeProvider } from "@/components/website-theme-provider";
import { Navbar } from "./sections/Navbar/Navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <WebsiteThemeProvider forcedTheme="light">
      <Navbar />
      {children}
    </WebsiteThemeProvider>
  );
}
