import { useEffect, useLayoutEffect } from "react";

// useLayoutEffect on the client, useEffect on the server — the same SSR-safe
// alias react-ui's charts use for pre-paint DOM writes (the data morph seed).
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
