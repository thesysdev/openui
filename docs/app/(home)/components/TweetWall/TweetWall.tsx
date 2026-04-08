"use client";

import Script from "next/script";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { HOME_TWEETS, type HomeTweetEmbed } from "../../data/home-tweet-embeds";
import styles from "./TweetWall.module.css";

const MARQUEE_COPIES = 2;
const DESKTOP_COLUMN_COUNT = 3;
const MOBILE_COLUMN_COUNT = 1;
const MOBILE_COLUMN_DURATION = 40;
const COLUMN_DURATIONS = [30, 36, 30] as const;
const COLUMN_PHASES = [0, 0.28, 0.14] as const;
const EMBED_WIDTH = 360;

function loadTwitterWidgets(root: HTMLElement | null) {
  if (!root) return;
  window.twttr?.widgets?.load(root);
}

function splitIntoColumns(items: HomeTweetEmbed[], columnCount: number): HomeTweetEmbed[][] {
  const cols: HomeTweetEmbed[][] = Array.from({ length: columnCount }, () => []);
  items.forEach((item, i) => {
    cols[i % columnCount]!.push(item);
  });
  return cols;
}

function TweetEmbed({
  tweetId,
  conversation = "none",
}: {
  tweetId: string;
  conversation?: "all" | "none";
}) {
  return (
    <div className={styles.embedSlot} data-tweet-id={tweetId} data-conversation={conversation} />
  );
}

export function TweetWall() {
  const rootRef = useRef<HTMLDivElement>(null);
  const columnTracksRef = useRef<(HTMLDivElement | null)[]>([]);

  const [scriptReady, setScriptReady] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [columnCount, setColumnCount] = useState(DESKTOP_COLUMN_COUNT);
  const [isWallReady, setIsWallReady] = useState(false);
  const embedTheme = "light";

  useEffect(() => {
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqDesktop = window.matchMedia("(min-width: 900px)");

    const updateReduce = () => setPrefersReducedMotion(mqReduce.matches);
    const updateColumns = () => {
      setColumnCount(mqDesktop.matches ? DESKTOP_COLUMN_COUNT : MOBILE_COLUMN_COUNT);
    };

    updateReduce();
    updateColumns();

    mqReduce.addEventListener("change", updateReduce);
    mqDesktop.addEventListener("change", updateColumns);

    return () => {
      mqReduce.removeEventListener("change", updateReduce);
      mqDesktop.removeEventListener("change", updateColumns);
    };
  }, []);

  const columns = splitIntoColumns(HOME_TWEETS, columnCount);

  useEffect(() => {
    if (window.twttr?.widgets?.createTweet) {
      setScriptReady(true);
    }
  }, []);

  useEffect(() => {
    if (!scriptReady || !rootRef.current) return;

    let cancelled = false;
    const widgets = window.twttr?.widgets;
    if (!widgets?.createTweet) return;
    const createTweet = widgets.createTweet;

    const slots = Array.from(rootRef.current.querySelectorAll<HTMLElement>("[data-tweet-id]"));
    const shouldRehydrate = slots.some(
      (slot) => slot.dataset.embedded !== "true" || slot.dataset.theme !== embedTheme,
    );

    if (!shouldRehydrate) {
      setIsWallReady(true);
      return;
    }

    setIsWallReady(false);

    async function hydrateEmbeds() {
      await Promise.allSettled(
        slots.map(async (slot) => {
          const needsThemeRefresh = slot.dataset.theme !== embedTheme;
          const alreadyEmbedded = slot.dataset.embedded === "true";
          if (alreadyEmbedded && !needsThemeRefresh) return;

          const tweetId = slot.dataset.tweetId;
          if (!tweetId) return;

          slot.dataset.embedded = "pending";
          slot.dataset.theme = embedTheme;
          slot.innerHTML = "";

          try {
            await createTweet(tweetId, slot, {
              align: "center",
              conversation: slot.dataset.conversation === "all" ? "all" : "none",
              dnt: true,
              theme: embedTheme,
              width: EMBED_WIDTH,
            });
            slot.dataset.embedded = "true";
          } catch {
            slot.dataset.embedded = "error";
          }
        }),
      );

      if (cancelled) return;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!cancelled) {
            loadTwitterWidgets(rootRef.current);
            setIsWallReady(true);
          }
        });
      });
    }

    void hydrateEmbeds();

    return () => {
      cancelled = true;
    };
  }, [columnCount, embedTheme, prefersReducedMotion, scriptReady]);

  useLayoutEffect(() => {
    if (prefersReducedMotion || !scriptReady) return;

    const observers = columnTracksRef.current.slice(0, columnCount).map((track, index) => {
      if (!track) return null;

      const updateMetrics = () => {
        const singleHeight = track.scrollHeight / MARQUEE_COPIES;
        if (singleHeight <= 0) return;
        const duration =
          columnCount === MOBILE_COLUMN_COUNT
            ? MOBILE_COLUMN_DURATION
            : (COLUMN_DURATIONS[index] ?? 32);

        track.style.setProperty("--loop-distance", `${singleHeight}px`);
        track.style.setProperty("--loop-duration", `${duration}s`);
        track.style.setProperty(
          "--loop-start",
          `${-(singleHeight * (COLUMN_PHASES[index] ?? 0))}px`,
        );
      };

      updateMetrics();

      const observer = new ResizeObserver(updateMetrics);
      observer.observe(track);
      return observer;
    });

    return () => {
      observers.forEach((observer) => observer?.disconnect());
    };
  }, [columnCount, prefersReducedMotion, scriptReady]);

  const staticGrid = (
    <div className={styles.staticGrid} role="list" aria-label="What people are saying on X">
      {HOME_TWEETS.map((tweet, index) => (
        <div key={`static-${index}`} className={styles.staticCell} role="listitem">
          <TweetEmbed tweetId={tweet.id} conversation={tweet.conversation} />
        </div>
      ))}
    </div>
  );

  return (
    <>
      <Script
        id="twitter-widgets-js"
        src="https://platform.twitter.com/widgets.js"
        strategy="lazyOnload"
        onLoad={() => setScriptReady(true)}
      />

      <div ref={rootRef} className={`${styles.root} ${isWallReady ? styles.rootReady : ""}`}>
        {prefersReducedMotion ? (
          staticGrid
        ) : (
          <div className={styles.columns} role="region" aria-label="Scrolling posts from X">
            {columns.map((colHtml, colIndex) => (
              <div key={colIndex} className={styles.columnViewport}>
                <div
                  ref={(el) => {
                    columnTracksRef.current[colIndex] = el;
                  }}
                  className={styles.columnTrack}
                >
                  {Array.from({ length: MARQUEE_COPIES }).flatMap((_, copy) =>
                    colHtml.map((tweet, rowIndex) => (
                      <TweetEmbed
                        key={`c${colIndex}-r${rowIndex}-copy${copy}`}
                        tweetId={tweet.id}
                        conversation={tweet.conversation}
                      />
                    )),
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
