import { useEffect, useLayoutEffect } from "react";

// useLayoutEffect on the client, useEffect on the server (avoids React's SSR
// dev warning; the server never fires effects either way). The ONE shared
// SSR-safe layout effect for the package — do not re-alias this locally.
// Used by the spring followers (seed/aim a position before paint so a newly
// shown follower never flashes from the origin) and by measurement hooks that
// must read the DOM after commit but before paint.
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
