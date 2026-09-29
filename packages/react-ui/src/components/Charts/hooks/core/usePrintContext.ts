import { useEffect, useState } from "react";

/**
 * Detects when the browser is in print mode (Ctrl+P / Cmd+P).
 * Useful for disabling animations and ensuring the chart renders
 * its final state for print output.
 */
export const usePrintContext = (): boolean => {
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("print");

    const handleChange = (e: MediaQueryListEvent) => {
      setIsPrinting(e.matches);
    };

    setIsPrinting(mediaQuery.matches);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isPrinting;
};
