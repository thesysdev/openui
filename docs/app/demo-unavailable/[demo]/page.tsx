import { CopyCommand } from "@/components/CopyCommand";
import { WebsiteThemeProvider } from "@/components/website-theme-provider";
import {
  DEMOS_PAUSED_MESSAGE,
  isProxiedDemoSlug,
  PROXIED_DEMOS,
  proxiedDemoLocalCommand,
} from "@/lib/demos-offline";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import "./demo-unavailable.css";

/* proxy.ts rewrites /demo/<slug> here while NEXT_PUBLIC_DEMOS_DISABLED is set, so the
   visitor keeps the demo's URL and sees how to run it locally instead. */

export const metadata: Metadata = {
  title: "Demo offline",
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return Object.keys(PROXIED_DEMOS).map((demo) => ({ demo }));
}

export default async function DemoUnavailablePage(props: PageProps<"/demo-unavailable/[demo]">) {
  const { demo } = await props.params;
  if (!isProxiedDemoSlug(demo)) notFound();
  const { title, repo, screenshot } = PROXIED_DEMOS[demo];

  return (
    <WebsiteThemeProvider>
      <main className="demo-unavailable">
        {/* The demo itself, dimmed behind the notice like a dialog's backdrop. */}
        <Image
          className="demo-unavailable-shot"
          src={screenshot}
          alt=""
          fill
          priority
          sizes="100vw"
        />
        <div className="demo-unavailable-backdrop" aria-hidden="true" />
        <div className="demo-unavailable-card">
          <h1>{title} is offline</h1>
          <p>{DEMOS_PAUSED_MESSAGE} In the meantime, you can run it locally:</p>
          <CopyCommand command={proxiedDemoLocalCommand(demo)} />
          <div className="demo-unavailable-actions">
            <a
              className="demo-unavailable-primary"
              href={`https://github.com/${repo}`}
              target="_blank"
              rel="noreferrer"
            >
              View on GitHub
            </a>
            <Link className="demo-unavailable-secondary" href="/demos">
              All demos
            </Link>
          </div>
        </div>
      </main>
    </WebsiteThemeProvider>
  );
}
