import { BlogNavbar } from "./components/BlogNavbar";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BlogNavbar />
      {children}
    </>
  );
}
