import { WebsiteThemeProvider } from "@/components/website-theme-provider";
import { BlogNavbar } from "./components/BlogNavbar";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <WebsiteThemeProvider>
      <BlogNavbar />
      {children}
    </WebsiteThemeProvider>
  );
}
