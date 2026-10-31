"use client";

import { defineComponent } from "@openuidev/react-lang";
import { YouTube as YouTubeView } from "../../components/YouTube";
import { str } from "../../shared/style";
import { YouTubeSchema } from "./schema";

export * from "./schema";

export const YouTube = defineComponent({
  name: "YouTube",
  props: YouTubeSchema,
  description: "Embedded YouTube video by id or URL. Only a video you know exists.",
  component: ({ props }) => <YouTubeView video={str(props.video)} title={str(props.title)} />,
});
