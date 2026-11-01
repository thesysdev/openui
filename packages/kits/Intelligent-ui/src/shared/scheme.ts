"use client";

import { useEffect, useState, type RefObject } from "react";

/** "dark" when the element is in a dark theme, from either attribute (its used color-scheme), else "light". */
export function useColorScheme(ref: RefObject<HTMLElement | null>): "light" | "dark" {
  const [scheme, setScheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const read = () => {
      const value = ref.current ? getComputedStyle(ref.current).colorScheme : "";
      setScheme(value.trim() === "dark" ? "dark" : "light");
    };
    read();
    // Theme switches flip a data-theme somewhere above us, or data-openui-theme on the document.
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ["data-theme", "data-openui-theme"] });
    return () => observer.disconnect();
  }, [ref]);
  return scheme;
}
