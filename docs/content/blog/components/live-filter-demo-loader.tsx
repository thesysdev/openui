"use client";

import dynamic from "next/dynamic";

// The blog route bundles the client components of every post, so importing the
// demo directly would put @openuidev/react-ui (~2 MB) on every blog page. Loaded
// on demand, it only ships with the post that renders it.
export const LiveFilterDemo = dynamic(() =>
  import("./live-filter-demo").then((m) => m.LiveFilterDemo),
);
