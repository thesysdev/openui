"use client";

import Script from "next/script";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

const EMBED_MAX_WIDTH = 550;

function extractTweetId(idOrUrl: string): string | null {
  const trimmed = idOrUrl.trim();
  const match = trimmed.match(/status\/(\d+)/);
  if (match) return match[1]!;
  if (/^\d+$/.test(trimmed)) return trimmed;
  return null;
}

export function TweetEmbed({ id }: { id: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const { resolvedTheme } = useTheme();
  const tweetId = extractTweetId(id);
  const embedTheme: "light" | "dark" = resolvedTheme === "dark" ? "dark" : "light";

  useEffect(() => {
    if (window.twttr?.widgets?.createTweet) setScriptReady(true);
  }, []);

  useEffect(() => {
    if (!tweetId || !scriptReady || !containerRef.current) return;
    const slot = containerRef.current;
    const widgets = window.twttr?.widgets;
    if (!widgets?.createTweet) return;
    const { createTweet } = widgets;
    const idForTweet = tweetId;

    let cancelled = false;

    async function renderTweet() {
      slot.innerHTML = "";
      try {
        await createTweet(idForTweet, slot, {
          align: "center",
          conversation: "none",
          dnt: true,
          theme: embedTheme,
          width: EMBED_MAX_WIDTH,
        });
      } catch {
        if (!cancelled) {
          slot.innerHTML = "";
          const p = document.createElement("p");
          p.className = "text-center text-sm";
          const a = document.createElement("a");
          a.href = `https://twitter.com/i/web/status/${idForTweet}`;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.textContent = "View post on X";
          p.append(a);
          slot.append(p);
        }
      }
    }

    void renderTweet();

    return () => {
      cancelled = true;
    };
  }, [scriptReady, tweetId, embedTheme]);

  if (!tweetId) {
    return (
      <p className="not-prose my-6 text-center text-sm text-fd-muted-foreground">
        Invalid tweet URL or ID.
      </p>
    );
  }

  return (
    <>
      <Script
        src="https://platform.twitter.com/widgets.js"
        strategy="lazyOnload"
        onLoad={() => setScriptReady(true)}
      />
      <div
        ref={containerRef}
        className="not-prose my-6 flex min-h-[120px] justify-center [&_iframe]:max-w-full"
      />
    </>
  );
}
