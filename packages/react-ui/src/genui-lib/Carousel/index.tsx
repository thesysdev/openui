"use client";

import { defineComponent } from "@openuidev/react-lang";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { z } from "zod";
import {
  Carousel as OpenUICarousel,
  CarouselContent as OpenUICarouselContent,
  CarouselItem as OpenUICarouselItem,
  CarouselNext as OpenUICarouselNext,
  CarouselPrevious as OpenUICarouselPrevious,
} from "../../components/Carousel";
import { ContentChildUnion } from "../unions";

export const Carousel = defineComponent({
  name: "Carousel",
  props: z.object({
    children: z.array(z.array(ContentChildUnion)),
    variant: z.enum(["card", "sunk"]).optional(),
  }),
  description: "Horizontal scrollable carousel",
  component: ({ props, renderNode }) => {
    const items = props.children ?? [];
    return (
      <OpenUICarousel showButtons={true} variant={props.variant}>
        <OpenUICarouselContent>
          {items.map((item, i) => (
            <OpenUICarouselItem key={i}>{renderNode(item)}</OpenUICarouselItem>
          ))}
        </OpenUICarouselContent>
        <OpenUICarouselPrevious icon={<ChevronLeft />} />
        <OpenUICarouselNext icon={<ChevronRight />} />
      </OpenUICarousel>
    );
  },
});
