"use client";

import { defineComponent } from "@openuidev/react-lang";
import { str } from "../style";
import { YouTubeSchema } from "./schema";

export * from "./schema";

const YT = /(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([\w-]{11})|^([\w-]{11})$/;

export const YouTube = defineComponent({
  name: "YouTube",
  props: YouTubeSchema,
  description: "Embedded YouTube video by id or URL. Only a video you know exists.",
  component: ({ props }) => {
    const m = YT.exec(str(props.video).trim());
    const id = m?.[1] ?? m?.[2];
    if (!id) return null;
    return (
      <div className="iui-video">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}`}
          title={str(props.title) || "YouTube video"}
          loading="lazy"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
        />
      </div>
    );
  },
});
