"use client";

import { useEffect, useRef, type ComponentProps } from "react";

/* A <video> for docs pages that only downloads when it is about to be seen.
   An autoPlay video normally downloads in full as soon as the page loads, even
   far below the fold. Here it fetches just its metadata (so the box keeps its
   size), starts playing once it nears the viewport and pauses when it leaves.
   Videos without autoPlay wait for the reader to press play. */
export function LazyVideo({ autoPlay, preload, ...props }: ComponentProps<"video">) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!autoPlay || !video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { rootMargin: "200px" },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [autoPlay]);

  return <video ref={ref} preload={autoPlay ? "metadata" : (preload ?? "none")} {...props} />;
}
