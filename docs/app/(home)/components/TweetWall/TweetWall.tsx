"use client";

import { useEffect, useState } from "react";
import { STATIC_TWEETS, type StaticTweet } from "../../data/home-tweets-static";
import { StaticTweetCard } from "../StaticTweetCard/StaticTweetCard";
import styles from "./TweetWall.module.css";

const DESKTOP_COLUMNS = 4;
const MOBILE_COLUMNS = 3;
const DESKTOP_QUERY = "(min-width: 900px)";

// Per-column scroll duration (s), direction, and a starting phase offset so the
// columns never line up. The marquee is pure CSS (translateY 0 -> -50% over two
// duplicated copies), so there is nothing to measure and it cannot drift.
const COLUMNS_META = [
  { duration: 36, reverse: false, delay: -4 },
  { duration: 30, reverse: true, delay: -13 },
  { duration: 42, reverse: false, delay: -8 },
  { duration: 33, reverse: true, delay: -19 },
] as const;

function splitIntoColumns(items: StaticTweet[], count: number): StaticTweet[][] {
  const columns = Array.from({ length: count }, () => [] as StaticTweet[]);
  items.forEach((item, index) => columns[index % count]!.push(item));
  return columns;
}

export function TweetWall() {
  const [mounted, setMounted] = useState(false);
  const [columnCount, setColumnCount] = useState(DESKTOP_COLUMNS);

  // Resolve the column count on the client only. The columns render after mount
  // (the outer root still server-renders to reserve height), so there is no
  // SSR/hydration column-count swap.
  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY);
    const update = () => setColumnCount(query.matches ? DESKTOP_COLUMNS : MOBILE_COLUMNS);
    update();
    setMounted(true);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const columns = splitIntoColumns(STATIC_TWEETS, columnCount);

  return (
    <div
      className={styles.root}
      role="region"
      aria-label="What people are saying on X"
      data-nosnippet=""
    >
      {mounted && (
        <div className={styles.columns}>
          {columns.map((column, columnIndex) => {
            const meta = COLUMNS_META[columnIndex % COLUMNS_META.length]!;
            // On mobile (3 columns) the centre column scrolls up and the outer
            // columns scroll down; desktop keeps the COLUMNS_META directions.
            const reverse = columnCount === MOBILE_COLUMNS ? columnIndex !== 1 : meta.reverse;
            return (
              <div className={styles.column} key={columnIndex}>
                <div
                  className={styles.track}
                  style={{
                    animationDuration: `${meta.duration}s`,
                    animationDelay: `${meta.delay}s`,
                    animationDirection: reverse ? "reverse" : "normal",
                  }}
                >
                  {[0, 1].map((copy) =>
                    column.map((tweet, index) => (
                      <div
                        key={`${columnIndex}-${index}-${copy}`}
                        className={styles.slot}
                        aria-hidden={copy === 1 || undefined}
                      >
                        <StaticTweetCard tweet={tweet} />
                      </div>
                    )),
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
