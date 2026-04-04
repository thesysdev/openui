import { TopBar } from "@/components/TopBar/TopBar";

export default function IssuesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-full flex-col">
      <TopBar />
      <div className="p-5">{children}</div>
    </div>
  );
}
