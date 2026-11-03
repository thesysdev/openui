"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Carousel as CarouselView } from "../../components/Carousel";
import { CarouselSchema } from "./schema";

export * from "./schema";

export const Carousel = defineComponent({
  name: "Carousel",
  props: CarouselSchema,
  description:
    "Horizontal row that scrolls and snaps, each child an item itemWidth px wide (default 240): photos, cards, options, days.",
  component: ({ props, renderNode }) => {
    const items = (Array.isArray(props.children) ? props.children.flat() : []).filter((c) => c != null);
    return <CarouselView items={items.map((item) => renderNode(item))} itemWidth={props.itemWidth} gap={props.gap} />;
  },
});
