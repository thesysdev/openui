"use client";

import { useEffect, useRef } from "react";

export function useAutoScroll(deps: unknown[], isRunning: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);
  const isUserScrollingRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onUserStart = () => {
      isUserScrollingRef.current = true;
    };
    const onUserEnd = () => {
      isUserScrollingRef.current = false;
    };
    const onScroll = () => {
      if (isUserScrollingRef.current) {
        userScrolledRef.current = true;
      }
    };

    el.addEventListener("mousedown", onUserStart);
    el.addEventListener("touchstart", onUserStart);
    el.addEventListener("wheel", onUserStart);
    el.addEventListener("click", onUserEnd);
    el.addEventListener("scroll", onScroll);

    return () => {
      el.removeEventListener("mousedown", onUserStart);
      el.removeEventListener("touchstart", onUserStart);
      el.removeEventListener("wheel", onUserStart);
      el.removeEventListener("click", onUserEnd);
      el.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Auto-scroll to bottom when content changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (ref.current && !userScrolledRef.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, deps);

  // Reset scroll lock when a new generation starts
  useEffect(() => {
    if (isRunning) {
      userScrolledRef.current = false;
    }
  }, [isRunning]);

  return ref;
}
