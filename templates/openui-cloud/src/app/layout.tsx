import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "OpenUI",
  description: "Managed OpenUI Cloud Chat with web and image search tools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Before paint: the saved sidebar state and width, for the boot shell
            in cloud-chat-client.tsx. Keys match the react-ui sidebar. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var s=localStorage,w=+s.getItem("openui-agent-sidebar-width"),d=document.documentElement;if(s.getItem("openui-agent-sidebar-open")==="1")d.setAttribute("data-openui-sidebar","open");if(w>=220&&w<=420)d.style.setProperty("--openui-agent-sidebar-width",w+"px")}catch(e){}`,
          }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
