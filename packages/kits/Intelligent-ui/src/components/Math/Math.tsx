"use client";

import clsx from "clsx";
import katex from "katex";
import { useEffect, useState } from "react";
import { names, styles } from "./math.styles";

export interface MathBlockProps {
  /** A LaTeX formula, e.g. "E = mc^2". */
  tex: string;
  /** Sits in a line of text rather than on its own line. */
  inline?: boolean;
}

// KaTeX's stylesheet loads on first use, not at the top of this file: plain Node can't load one.
let sheet: Promise<void> | undefined;
let sheetLoaded = false;

const loadSheet = () =>
  (sheet ??= import("katex/dist/katex.min.css").then(
    () => {
      sheetLoaded = true;
    },
    () => {
      sheetLoaded = true;
    },
  ));

/** Whether a formula can show yet: without its sheet KaTeX draws every formula twice, unaligned. */
function useSheet() {
  const [ready, setReady] = useState(sheetLoaded);
  useEffect(() => {
    if (ready) return;
    let active = true;
    void loadSheet().then(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
  }, [ready]);
  return ready;
}

/** A LaTeX formula, rendered with KaTeX. */
export function MathBlock({ tex, inline }: MathBlockProps) {
  const ready = useSheet();
  const html = katex.renderToString(tex, { displayMode: !inline, throwOnError: false, trust: false, strict: "ignore", output: "htmlAndMathml" });
  const style = ready ? undefined : ({ visibility: "hidden" } as const);
  // KaTeX escapes its input and is configured without \href or \includegraphics.
  return inline ? (
    <span className={clsx(styles.root, names.root)} style={style} dangerouslySetInnerHTML={{ __html: html }} />
  ) : (
    <div className={clsx(styles.root, names.root, styles.block, names.block)} style={style} dangerouslySetInnerHTML={{ __html: html }} />
  );
}
