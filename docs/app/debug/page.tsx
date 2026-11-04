"use client";

import dynamic from "next/dynamic";
import styles from "./paste.module.css";

// Client-only: the playground drives CodeMirror, CDN version loading and
// playback in the browser, and @openuidev/thesys does not survive SSR.
const Playground = dynamic(() => import("./components/Playground").then((m) => m.Playground), {
  ssr: false,
  loading: () => <div className={styles.loading}>Loading playground…</div>,
});

export default function DebugPage() {
  return (
    <>
      <h1 className="sr-only">OpenUI Lang debug playground</h1>
      <Playground />
    </>
  );
}
