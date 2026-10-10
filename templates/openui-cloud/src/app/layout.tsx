import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Variable Inter (no fixed weights), so the theme's in-between Medium (560)
// renders as set.
const inter = Inter({
  subsets: ["latin"],
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
            in cloud-chat-client.tsx, and the saved theme mode, so the first
            frame is already in it. Keys match the react-ui sidebar and
            useThemeModePreference. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var s=localStorage,w=+s.getItem("openui-agent-sidebar-width"),d=document.documentElement;if(s.getItem("openui-agent-sidebar-open")==="1")d.setAttribute("data-openui-sidebar","open");if(w>=220&&w<=420)d.style.setProperty("--openui-agent-sidebar-width",w+"px");var t=s.getItem("openui-theme-mode");if(t==="light"||t==="dark"){d.setAttribute("data-openui-theme",t);d.style.colorScheme=t}}catch(e){}`,
          }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
