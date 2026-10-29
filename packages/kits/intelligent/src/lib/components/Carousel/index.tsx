"use client";

import {
  Carousel as RCCarousel,
  CarouselContent,
  CarouselNext,
  CarouselPrevious,
} from "@openuidev/react-components";
import { defineComponent } from "@openuidev/react-lang";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CarouselSchema } from "./schema";

export * from "./schema";

/**
 * react-components supplies the carousel: scrolling, snapping, the arrows and
 * the edge fade. Items are bare frames rather than CarouselItem, which is a
 * fixed-width card, so the child (Flashcard, SearchImage, Card, ...) sets the
 * look and one Carousel covers every kind.
 */
export const Carousel = defineComponent({
  name: "Carousel",
  props: CarouselSchema,
  description:
    "Horizontal row that scrolls and snaps, each child an item itemWidth px wide (default 240): photos, cards, options, days.",
  component: ({ props, renderNode }) => {
    const items = (Array.isArray(props.children) ? props.children.flat() : []).filter((c) => c != null);
    const width = Math.min(640, Math.max(80, props.itemWidth ?? 240));
    return (
      <RCCarousel className="iui-carousel">
        <CarouselContent
          className="iui-carousel-track"
          style={props.gap != null ? { gap: Math.max(0, props.gap) * 4 } : undefined}
        >
          {items.map((item, i) => (
            <div key={i} className="iui-carousel-item" style={{ width }}>
              {renderNode(item)}
            </div>
          ))}
        </CarouselContent>
        <CarouselPrevious shape="circle" icon={<ChevronLeft size={16} />} aria-label="Previous" />
        <CarouselNext shape="circle" icon={<ChevronRight size={16} />} aria-label="Next" />
      </RCCarousel>
    );
  },
});
